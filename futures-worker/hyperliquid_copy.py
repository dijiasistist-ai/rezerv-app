"""Mirror selected Hyperliquid wallets with Binance USD-M paper positions.

The source of truth is each wallet's public Hyperliquid clearinghouse state.
Websocket fills wake the reconciler immediately; a periodic REST reconciliation
is kept as a fallback so disconnects cannot silently lose a position change.
"""

from __future__ import annotations

import json
import logging
import math
import threading
import time
import urllib.request
from dataclasses import dataclass
from typing import Callable

logger = logging.getLogger("hyperliquid_copy")

HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info"
HYPERLIQUID_WS_URL = "wss://api.hyperliquid.xyz/ws"
STATE_VERSION = 1


def _now_ms() -> int:
    return int(time.time() * 1000)


def _source_key(address: str, coin: str) -> str:
    return f"{address.lower()}:{coin}"


def _side(size: float) -> str:
    return "long" if size > 0 else "short"


@dataclass(frozen=True)
class CopySettings:
    wallets: tuple[str, ...]
    initial_usdt: float
    wallet_fraction: float
    leverage: int
    taker_fee: float = 0.0005

    @property
    def margin_per_position(self) -> float:
        return self.initial_usdt * self.wallet_fraction

    @property
    def notional_per_position(self) -> float:
        return self.margin_per_position * self.leverage

    @property
    def max_positions(self) -> int:
        return max(1, math.floor(1 / self.wallet_fraction))


class HyperliquidFillFeed:
    """Best-effort websocket wake-up feed with polling as the safety net."""

    def __init__(self, wallets: tuple[str, ...], wake_event: threading.Event) -> None:
        self.wallets = wallets
        self.wake_event = wake_event
        self._stopped = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._thread = threading.Thread(
            target=self._run,
            name="hyperliquid-copy-feed",
            daemon=True,
        )
        self._thread.start()

    def stop(self) -> None:
        self._stopped.set()

    def _run(self) -> None:
        try:
            import websocket
        except ImportError:
            logger.warning("websocket-client unavailable; using five-second REST polling")
            return

        while not self._stopped.is_set():
            socket = None

            def on_open(ws) -> None:
                for wallet in self.wallets:
                    ws.send(
                        json.dumps(
                            {
                                "method": "subscribe",
                                "subscription": {"type": "userFills", "user": wallet},
                            }
                        )
                    )

            def on_message(_ws, raw: str) -> None:
                try:
                    message = json.loads(raw)
                except json.JSONDecodeError:
                    return
                if message.get("channel") != "userFills":
                    return
                data = message.get("data") or {}
                if not data.get("isSnapshot"):
                    self.wake_event.set()

            try:
                socket = websocket.WebSocketApp(
                    HYPERLIQUID_WS_URL,
                    on_open=on_open,
                    on_message=on_message,
                    on_error=lambda _ws, error: logger.warning(
                        "Hyperliquid copy websocket error: %s", error
                    ),
                )
                socket.run_forever(ping_interval=25, ping_timeout=10)
            except Exception:
                logger.exception("Hyperliquid copy websocket disconnected")
            finally:
                if socket:
                    try:
                        socket.close()
                    except Exception:
                        pass
            self._stopped.wait(3)


class HyperliquidCopyEngine:
    def __init__(
        self,
        settings: CopySettings,
        state_store,
        *,
        source_fetcher: Callable[[str], dict] | None = None,
    ) -> None:
        self.settings = settings
        self.state_store = state_store
        self.source_fetcher = source_fetcher or self._fetch_source_state
        self.wake_event = threading.Event()
        self.feed = HyperliquidFillFeed(settings.wallets, self.wake_event)
        loaded = state_store.load()
        self.state = loaded if self._valid_state(loaded) else self._new_state()
        self._fresh_state = not self._valid_state(loaded)

    def _new_state(self) -> dict:
        now = _now_ms()
        return {
            "version": STATE_VERSION,
            "mode": "hyperliquid_copy",
            "started_at": now,
            "initial_usdt": self.settings.initial_usdt,
            "balance": self.settings.initial_usdt,
            "peak_equity": self.settings.initial_usdt,
            "max_drawdown_pct": 0.0,
            "source_positions": {},
            "ignored_until_flat": [],
            "positions": {},
            "trades": [],
            "skipped": [],
            "last_reconciled_at": None,
        }

    @staticmethod
    def _valid_state(value: dict | None) -> bool:
        return bool(
            isinstance(value, dict)
            and value.get("mode") == "hyperliquid_copy"
            and int(value.get("version") or 0) == STATE_VERSION
            and isinstance(value.get("positions"), dict)
        )

    def start(self) -> None:
        self.feed.start()

    def wait(self, timeout: float) -> None:
        self.wake_event.wait(timeout)
        if self.wake_event.is_set():
            # Give the clearinghouse state a brief moment to include the fill
            # that triggered the websocket event.
            time.sleep(0.15)
        self.wake_event.clear()

    def _fetch_source_state(self, address: str) -> dict:
        body = json.dumps(
            {"type": "clearinghouseState", "user": address},
            separators=(",", ":"),
        ).encode("utf-8")
        request = urllib.request.Request(
            HYPERLIQUID_INFO_URL,
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=8) as response:
            return json.loads(response.read().decode("utf-8"))

    @staticmethod
    def _positions_from_state(raw: dict) -> dict[str, float]:
        result = {}
        for row in raw.get("assetPositions") or []:
            position = row.get("position") or {}
            coin = str(position.get("coin") or "").strip()
            size = float(position.get("szi") or 0)
            if coin and abs(size) > 1e-12:
                result[coin] = size
        return result

    def _binance_symbol(self, client, coin: str) -> str | None:
        if ":" in coin or "/" in coin:
            return None
        candidates = (f"{coin}/USDT:USDT", f"1000{coin}/USDT:USDT")
        for symbol in candidates:
            market = client.markets.get(symbol)
            if (
                market
                and market.get("active")
                and market.get("swap")
                and market.get("linear")
            ):
                return symbol
        return None

    @staticmethod
    def _entry_price(ticker: dict, side: str) -> float:
        preferred = ticker.get("ask") if side == "long" else ticker.get("bid")
        return float(preferred or ticker.get("last") or ticker.get("close"))

    @staticmethod
    def _exit_price(ticker: dict, side: str) -> float:
        preferred = ticker.get("bid") if side == "long" else ticker.get("ask")
        return float(preferred or ticker.get("last") or ticker.get("close"))

    def _used_margin(self) -> float:
        return sum(float(row["remaining_margin"]) for row in self.state["positions"].values())

    def _record_skip(self, source: str, coin: str, reason: str) -> None:
        self.state["skipped"].append(
            {
                "source": source,
                "coin": coin,
                "reason": reason,
                "timestamp": _now_ms(),
            }
        )
        self.state["skipped"] = self.state["skipped"][-100:]
        logger.warning("COPY SKIP source=%s coin=%s reason=%s", source, coin, reason)

    def _open(self, client, source: str, coin: str, source_size: float) -> dict | None:
        key = _source_key(source, coin)
        if key in self.state["positions"]:
            return None
        symbol = self._binance_symbol(client, coin)
        if not symbol:
            self._record_skip(source, coin, "binance_market_unavailable")
            return None
        margin = self.settings.margin_per_position
        free_capital = self.settings.initial_usdt - self._used_margin()
        if free_capital + 1e-9 < margin:
            self._record_skip(source, coin, "insufficient_copy_capital")
            return None
        ticker = client.fetch_ticker(symbol)
        side = _side(source_size)
        entry = self._entry_price(ticker, side)
        notional = self.settings.notional_per_position
        quantity = notional / entry
        entry_fee = notional * self.settings.taker_fee
        self.state["balance"] -= entry_fee
        position = {
            "id": key,
            "source": source,
            "coin": coin,
            "symbol": symbol,
            "side": side,
            "source_size": source_size,
            "source_open_size": source_size,
            "entry": entry,
            "quantity": quantity,
            "remaining_margin": margin,
            "entry_fee_remaining": entry_fee,
            "opened_at": _now_ms(),
            "leverage": self.settings.leverage,
            "allocation_pct": 100 * self.settings.wallet_fraction,
            "notional": notional,
        }
        self.state["positions"][key] = position
        logger.warning(
            "COPY PAPER OPEN source=%s coin=%s side=%s notional=%.2f entry=%.8f",
            source,
            coin,
            side,
            notional,
            entry,
        )
        return {"event": "open", **position}

    def _close_fraction(
        self,
        client,
        key: str,
        fraction: float,
        reason: str,
    ) -> dict | None:
        position = self.state["positions"].get(key)
        if not position:
            return None
        fraction = max(0.0, min(1.0, fraction))
        if fraction <= 1e-9:
            return None
        ticker = client.fetch_ticker(position["symbol"])
        exit_price = self._exit_price(ticker, position["side"])
        quantity = float(position["quantity"]) * fraction
        allocated_entry_fee = float(position["entry_fee_remaining"]) * fraction
        gross = (
            (exit_price - float(position["entry"])) * quantity
            if position["side"] == "long"
            else (float(position["entry"]) - exit_price) * quantity
        )
        exit_fee = exit_price * quantity * self.settings.taker_fee
        net = gross - exit_fee - allocated_entry_fee
        self.state["balance"] += gross - exit_fee
        trade = {
            **position,
            "quantity": quantity,
            "closed_fraction": fraction,
            "exit": exit_price,
            "exit_fee": exit_fee,
            "entry_fee": allocated_entry_fee,
            "net_pnl": net,
            "roi_pct": 100 * net / (float(position["remaining_margin"]) * fraction),
            "closed_at": _now_ms(),
            "exit_reason": reason,
        }
        self.state["trades"].append(trade)
        self.state["trades"] = self.state["trades"][-500:]
        if fraction >= 1 - 1e-9:
            del self.state["positions"][key]
        else:
            position["quantity"] *= 1 - fraction
            position["remaining_margin"] *= 1 - fraction
            position["entry_fee_remaining"] *= 1 - fraction
            position["notional"] *= 1 - fraction
        logger.warning(
            "COPY PAPER CLOSE source=%s coin=%s fraction=%.4f net=%.4f reason=%s",
            position["source"],
            position["coin"],
            fraction,
            net,
            reason,
        )
        return {"event": "close", **trade}

    def reconcile(self, client) -> list[dict]:
        current_by_source = {}
        for source in self.settings.wallets:
            current_by_source[source] = self._positions_from_state(
                self.source_fetcher(source)
            )

        if self._fresh_state:
            ignored = []
            source_positions = {}
            for source, positions in current_by_source.items():
                for coin, size in positions.items():
                    key = _source_key(source, coin)
                    source_positions[key] = size
                    ignored.append(key)
            self.state["source_positions"] = source_positions
            self.state["ignored_until_flat"] = ignored
            self.state["last_reconciled_at"] = _now_ms()
            self._fresh_state = False
            self.state_store.save(self.state)
            logger.info(
                "COPY baseline captured existing_positions=%s; waiting for fresh entries",
                len(ignored),
            )
            return []

        previous = dict(self.state.get("source_positions") or {})
        ignored = set(self.state.get("ignored_until_flat") or [])
        events = []
        all_keys = set(previous)
        for source, positions in current_by_source.items():
            all_keys.update(_source_key(source, coin) for coin in positions)

        for key in sorted(all_keys):
            source, coin = key.split(":", 1)
            old_size = float(previous.get(key) or 0)
            new_size = float(current_by_source.get(source, {}).get(coin) or 0)

            if key in ignored:
                if abs(new_size) <= 1e-12:
                    ignored.remove(key)
                continue

            mirrored = self.state["positions"].get(key)
            if abs(old_size) <= 1e-12 and abs(new_size) > 1e-12:
                opened = self._open(client, source, coin, new_size)
                if opened:
                    events.append(opened)
            elif old_size * new_size < 0:
                closed = self._close_fraction(client, key, 1.0, "source_reversed")
                if closed:
                    events.append(closed)
                opened = self._open(client, source, coin, new_size)
                if opened:
                    events.append(opened)
            elif abs(new_size) <= 1e-12:
                closed = self._close_fraction(client, key, 1.0, "source_closed")
                if closed:
                    events.append(closed)
            elif mirrored and abs(new_size) < abs(old_size):
                fraction = 1 - abs(new_size / old_size)
                closed = self._close_fraction(
                    client,
                    key,
                    fraction,
                    "source_partial_close",
                )
                if closed:
                    events.append(closed)
                if key in self.state["positions"]:
                    self.state["positions"][key]["source_size"] = new_size
            elif mirrored:
                # The allocation remains capped at 10% per source position.
                mirrored["source_size"] = new_size

        next_positions = {}
        for source, positions in current_by_source.items():
            for coin, size in positions.items():
                next_positions[_source_key(source, coin)] = size
        self.state["source_positions"] = next_positions
        self.state["ignored_until_flat"] = sorted(ignored)
        self.state["last_reconciled_at"] = _now_ms()
        self.state_store.save(self.state)
        return events

    def summary(self, client) -> dict:
        positions = []
        unrealized = 0.0
        unrealized_equity_component = 0.0
        for row in self.state["positions"].values():
            ticker = client.fetch_ticker(row["symbol"])
            mark = self._exit_price(ticker, row["side"])
            raw = (
                (mark - float(row["entry"])) * float(row["quantity"])
                if row["side"] == "long"
                else (float(row["entry"]) - mark) * float(row["quantity"])
            )
            estimated_exit_fee = mark * float(row["quantity"]) * self.settings.taker_fee
            pnl = raw - estimated_exit_fee - float(row["entry_fee_remaining"])
            unrealized += pnl
            # Entry fees were already debited from balance when the position
            # opened. Equity adds only the still-unrealized price move and
            # estimated exit fee so the entry fee is not counted twice.
            unrealized_equity_component += raw - estimated_exit_fee
            positions.append(
                {
                    **row,
                    "mark_price": mark,
                    "position_pnl_usdt": round(pnl, 4),
                    "position_roi_pct": round(
                        100 * pnl / float(row["remaining_margin"]), 4
                    ),
                }
            )
        equity = float(self.state["balance"]) + unrealized_equity_component
        self.state["peak_equity"] = max(float(self.state["peak_equity"]), equity)
        drawdown = (
            100 * (float(self.state["peak_equity"]) - equity) / float(self.state["peak_equity"])
            if self.state["peak_equity"]
            else 0.0
        )
        self.state["max_drawdown_pct"] = max(
            float(self.state["max_drawdown_pct"]), drawdown
        )
        trades = self.state["trades"]
        wins = sum(1 for row in trades if float(row["net_pnl"]) > 0)
        closed = len(trades)
        by_source = {}
        for source in self.settings.wallets:
            source_trades = [row for row in trades if row["source"] == source]
            source_positions = [row for row in positions if row["source"] == source]
            source_wins = sum(1 for row in source_trades if float(row["net_pnl"]) > 0)
            by_source[source] = {
                "address": source,
                "open_positions": len(source_positions),
                "closed_trades": len(source_trades),
                "wins": source_wins,
                "win_rate_pct": (
                    round(100 * source_wins / len(source_trades), 2)
                    if source_trades
                    else 0.0
                ),
                "realized_pnl_usdt": round(
                    sum(float(row["net_pnl"]) for row in source_trades), 4
                ),
                "unrealized_pnl_usdt": round(
                    sum(float(row["position_pnl_usdt"]) for row in source_positions),
                    4,
                ),
            }
        return {
            "mode": "hyperliquid_copy",
            "started_at": self.state["started_at"],
            "ends_at": self.state["started_at"] + 3650 * 86400 * 1000,
            "finalized_at": None,
            "initial_usdt": self.settings.initial_usdt,
            "balance_usdt": round(float(self.state["balance"]), 4),
            "equity_usdt": round(equity, 4),
            "wallet_roi_pct": round(
                100 * (equity / self.settings.initial_usdt - 1), 4
            ),
            "realized_pnl_usdt": round(
                sum(float(row["net_pnl"]) for row in trades), 4
            ),
            "unrealized_pnl_usdt": round(unrealized, 4),
            "max_drawdown_pct": round(float(self.state["max_drawdown_pct"]), 4),
            "leverage": self.settings.leverage,
            "allocation_pct": 100 * self.settings.wallet_fraction,
            "margin_per_position": self.settings.margin_per_position,
            "notional_per_position": self.settings.notional_per_position,
            "max_positions": self.settings.max_positions,
            "positions": sorted(positions, key=lambda row: row["opened_at"]),
            "wallets": by_source,
            "closed_trades": closed,
            "wins": wins,
            "win_rate_pct": round(100 * wins / closed, 2) if closed else 0.0,
            "recent_trades": trades[-50:],
            "skipped": self.state["skipped"][-20:],
            "ignored_existing_positions": len(self.state["ignored_until_flat"]),
            "last_reconciled_at": self.state["last_reconciled_at"],
        }
