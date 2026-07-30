"""AVAXUSDT futures observer/trader embedded in the existing Render worker.

The bot is fail-closed: live orders require AVAX_BOT_LIVE_TRADING=true,
Binance credentials, and a PostgreSQL leadership lock. Default mode only
paper-trades real public market data.
"""

from __future__ import annotations

import fcntl
import hashlib
import json
import logging
import os
import statistics
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Sequence

import ccxt
import psycopg
import websocket

from avax_paper_tournament import (
    HttpStateStore,
    JsonStateStore,
    PostgresStateStore,
    STRATEGIES,
    STRATEGY_PROFILES,
    PaperTournament,
    brackets as strategy_brackets,
    signal_for,
)
from hyperliquid_copy import CopySettings, HyperliquidCopyEngine

logger = logging.getLogger("avax_bot")
Candle = Sequence[float]


def env_bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_csv(name: str, default: str) -> tuple[str, ...]:
    return tuple(
        value.strip().lower()
        for value in os.getenv(name, default).split(",")
        if value.strip()
    )


@dataclass(frozen=True)
class Settings:
    enabled: bool = env_bool("AVAX_BOT_ENABLED", False)
    live: bool = env_bool("AVAX_BOT_LIVE_TRADING", False)
    testnet: bool = env_bool("AVAX_BOT_BINANCE_TESTNET", False)
    api_key: str = os.getenv("AVAX_BOT_BINANCE_API_KEY", "")
    api_secret: str = os.getenv("AVAX_BOT_BINANCE_API_SECRET", "")
    database_url: str = os.getenv("AVAX_BOT_DATABASE_URL") or os.getenv("DATABASE_URL", "")
    leverage: int = int(os.getenv("AVAX_BOT_LEVERAGE", "2"))
    wallet_fraction: float = float(os.getenv("AVAX_BOT_WALLET_FRACTION", "0.10"))
    take_profit_roe: float = float(os.getenv("AVAX_BOT_TAKE_PROFIT_ROE", "0.055"))
    # Production cadence is deliberately fixed: every 30 seconds the bot
    # refreshes the full market universe. Open positions are managed by the
    # independent real-time supervisor below.
    poll_seconds: int = 30
    position_watch_stale_seconds: float = float(
        os.getenv("AVAX_BOT_POSITION_WATCH_STALE_SECONDS", "15")
    )
    microstructure_enforce: bool = env_bool("AVAX_BOT_MICROSTRUCTURE_ENFORCE", False)
    paper_tournament: bool = env_bool("AVAX_BOT_PAPER_TOURNAMENT", True)
    paper_initial_usdt: float = float(os.getenv("AVAX_BOT_PAPER_INITIAL_USDT", "6000"))
    paper_duration_hours: int = int(os.getenv("AVAX_BOT_PAPER_DURATION_HOURS", "48"))
    paper_state_path: str = os.getenv(
        "AVAX_BOT_PAPER_STATE_PATH", "/tmp/avax-paper-tournament.json"
    )
    paper_state_key: str = os.getenv(
        "AVAX_BOT_PAPER_STATE_KEY", "top50-three-strategy-v1"
    )
    copy_trading: bool = env_bool("AVAX_BOT_COPY_TRADING", False)
    copy_wallets: tuple[str, ...] = env_csv(
        "AVAX_BOT_COPY_WALLETS",
        (
            "0xdc9bf10e6b88f0657d02179ca338e0ffe9ecc564,"
            "0x4721d4bcf69f585801362feac273e8389d1a45ec"
        ),
    )
    copy_initial_usdt: float = float(
        os.getenv("AVAX_BOT_COPY_INITIAL_USDT", "6000")
    )
    copy_wallet_fraction: float = float(
        os.getenv("AVAX_BOT_COPY_WALLET_FRACTION", "0.10")
    )
    copy_state_key: str = os.getenv(
        "AVAX_BOT_COPY_STATE_KEY", "hyperliquid-copy-two-wallets-v1"
    )
    copy_max_entry_distance_pct: float = float(
        os.getenv("AVAX_BOT_COPY_MAX_ENTRY_DISTANCE_PCT", "0.75")
    )
    # Websocket fills wake the loop immediately. REST is only a reconciliation
    # safety net, so keep it slow enough to avoid Hyperliquid shared-IP limits.
    copy_poll_seconds: int = 30
    max_daily_loss_pct: float = float(os.getenv("AVAX_BOT_MAX_DAILY_LOSS_PCT", "2.0"))
    max_drawdown_pct: float = float(os.getenv("AVAX_BOT_MAX_DRAWDOWN_PCT", "5.0"))
    max_consecutive_losses: int = int(
        os.getenv("AVAX_BOT_MAX_CONSECUTIVE_LOSSES", "3")
    )
    live_strategy: str = os.getenv("AVAX_BOT_LIVE_STRATEGY", "pullback_reclaim")
    # One-shot paper demos must never replay after a worker restart. Keep the
    # production runtime locked off even if a stale Render value survives.
    paper_demo_seconds: int = 0
    dashboard_url: str = os.getenv("AVAX_BOT_DASHBOARD_URL", "").rstrip("/")
    dashboard_ingest_token: str = os.getenv("AVAX_BOT_DASHBOARD_INGEST_TOKEN", "")
    universe_size: int = int(os.getenv("AVAX_BOT_UNIVERSE_SIZE", "50"))
    # Scan the complete top-50 universe on every cycle. Keeping the old
    # eight-symbol batch with a 30-second poll would delay a full pass to
    # more than three minutes.
    scan_batch_size: int = 50
    symbol: str = "AVAX/USDT:USDT"

    def validate(self) -> None:
        if self.leverage != 2:
            raise ValueError("This release is locked to 2x leverage")
        if not 0 < self.wallet_fraction <= 0.20:
            raise ValueError("Wallet fraction must be in (0, 0.20]")
        if self.take_profit_roe < 0.05:
            raise ValueError("Take-profit ROE cannot be below 5%")
        if self.paper_initial_usdt <= 0 or self.paper_duration_hours <= 0:
            raise ValueError("Paper tournament balance and duration must be positive")
        if self.paper_demo_seconds < 0:
            raise ValueError("Paper demo duration cannot be negative")
        if not 1 <= self.universe_size <= 100:
            raise ValueError("Universe size must be between 1 and 100")
        if not 1 <= self.scan_batch_size <= self.universe_size:
            raise ValueError("Scan batch size must be within the universe")
        if not 2 <= self.position_watch_stale_seconds <= 30:
            raise ValueError("Position watcher stale threshold must be within [2, 30] seconds")
        if not 0 < self.max_daily_loss_pct <= 10:
            raise ValueError("Daily loss limit must be within (0, 10]")
        if not 0 < self.max_drawdown_pct <= 20:
            raise ValueError("Drawdown limit must be within (0, 20]")
        if not 1 <= self.max_consecutive_losses <= 10:
            raise ValueError("Consecutive-loss limit must be between 1 and 10")
        if self.live_strategy not in STRATEGIES:
            raise ValueError(f"Live strategy must be one of {', '.join(STRATEGIES)}")
        if self.copy_trading:
            if self.live:
                raise ValueError(
                    "Hyperliquid copy mode is paper-only until Binance credentials "
                    "and live account reconciliation are explicitly activated"
                )
            if self.copy_initial_usdt <= 0:
                raise ValueError("Copy-trading initial balance must be positive")
            if not 0 < self.copy_wallet_fraction <= 0.20:
                raise ValueError("Copy-trading wallet fraction must be in (0, 0.20]")
            if not 0 < self.copy_max_entry_distance_pct <= 3:
                raise ValueError("Copy entry-distance limit must be within (0, 3]")
            if len(self.copy_wallets) != 2 or any(
                len(wallet) != 42 or not wallet.startswith("0x")
                for wallet in self.copy_wallets
            ):
                raise ValueError("Exactly two valid Hyperliquid source wallets are required")
        if self.live and (not self.api_key or not self.api_secret or not self.database_url):
            raise ValueError("Live mode requires API credentials and AVAX_BOT_DATABASE_URL")


class Side(str, Enum):
    LONG = "long"
    SHORT = "short"


@dataclass(frozen=True)
class Signal:
    side: Side
    reason: str
    atr_fraction: float


@dataclass
class PaperPosition:
    side: Side
    entry: float
    stop: float
    take: float
    opened_at: int


@dataclass(frozen=True)
class MarketContext:
    timestamp: int
    open_interest_change_pct_1h: float
    taker_buy_sell_ratio_1h: float
    global_long_short_ratio: float | None
    top_position_long_short_ratio: float | None
    funding_rate: float | None


def ema(values: Sequence[float], period: int) -> list[float]:
    alpha = 2 / (period + 1)
    result = [float(values[0])]
    for value in values[1:]:
        result.append(alpha * float(value) + (1 - alpha) * result[-1])
    return result


def rsi(values: Sequence[float], period: int = 14) -> float:
    changes = [float(values[i]) - float(values[i - 1]) for i in range(1, len(values))]
    gains = [max(change, 0.0) for change in changes[-period:]]
    losses = [max(-change, 0.0) for change in changes[-period:]]
    avg_gain = statistics.fmean(gains)
    avg_loss = statistics.fmean(losses)
    return 100.0 if avg_loss == 0 else 100 - 100 / (1 + avg_gain / avg_loss)


def atr(candles: Sequence[Candle], period: int = 14) -> float:
    ranges = []
    for index in range(1, len(candles)):
        high, low = float(candles[index][2]), float(candles[index][3])
        previous_close = float(candles[index - 1][4])
        ranges.append(max(high - low, abs(high - previous_close), abs(low - previous_close)))
    return statistics.fmean(ranges[-period:])


def adx(candles: Sequence[Candle], period: int = 14) -> float:
    true_ranges, plus_dm, minus_dm = [], [], []
    for index in range(1, len(candles)):
        high, low = float(candles[index][2]), float(candles[index][3])
        prev_high, prev_low, prev_close = (
            float(candles[index - 1][2]),
            float(candles[index - 1][3]),
            float(candles[index - 1][4]),
        )
        up, down = high - prev_high, prev_low - low
        plus_dm.append(up if up > down and up > 0 else 0.0)
        minus_dm.append(down if down > up and down > 0 else 0.0)
        true_ranges.append(max(high - low, abs(high - prev_close), abs(low - prev_close)))
    dx = []
    for index in range(period - 1, len(true_ranges)):
        tr_sum = sum(true_ranges[index - period + 1 : index + 1])
        if tr_sum == 0:
            dx.append(0.0)
            continue
        plus_di = 100 * sum(plus_dm[index - period + 1 : index + 1]) / tr_sum
        minus_di = 100 * sum(minus_dm[index - period + 1 : index + 1]) / tr_sum
        denominator = plus_di + minus_di
        dx.append(0.0 if denominator == 0 else 100 * abs(plus_di - minus_di) / denominator)
    return statistics.fmean(dx[-period:])


def entry_signal(
    c15: Sequence[Candle],
    c1h: Sequence[Candle],
    c4h: Sequence[Candle],
    strategy: str = "pullback_reclaim",
) -> Signal | None:
    found = signal_for(strategy, c15, c1h, c4h)
    if not found:
        return None
    side, reason, atr_fraction = found
    return Signal(Side(side), reason, atr_fraction)


def brackets(
    entry: float,
    side: Side,
    atr_fraction: float,
    settings: Settings,
    candles: Sequence[Candle] | None = None,
) -> tuple[float, float]:
    return strategy_brackets(
        settings.live_strategy,
        entry,
        side.value,
        atr_fraction,
        settings.leverage,
        settings.take_profit_roe,
        candles,
    )


def microstructure_veto(side: Side, context: MarketContext) -> str | None:
    """Flag crowded, flow-divergent entries.

    Thresholds initially run in shadow mode. They must earn their place from
    forward observations before AVAX_BOT_MICROSTRUCTURE_ENFORCE is enabled.
    """
    if (
        context.global_long_short_ratio is None
        or context.top_position_long_short_ratio is None
    ):
        return None
    if side is Side.LONG:
        crowded = context.global_long_short_ratio >= 1.80
        flow_diverges = context.taker_buy_sell_ratio_1h <= 0.85
        positioning_expands = context.open_interest_change_pct_1h >= 1.5
        if crowded and flow_diverges and positioning_expands:
            return "crowded longs + rising OI + sell-side taker flow"
    else:
        crowded = context.global_long_short_ratio <= 0.65
        flow_diverges = context.taker_buy_sell_ratio_1h >= 1.18
        positioning_expands = context.open_interest_change_pct_1h >= 1.5
        if crowded and flow_diverges and positioning_expands:
            return "crowded shorts + rising OI + buy-side taker flow"
    return None


class LeaderLock:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url
        self.connection = None
        self.file_handle = None

    def acquire(self) -> bool:
        if self.database_url:
            lock_id = int.from_bytes(
                hashlib.sha256(b"avax-futures-production").digest()[:8], "big", signed=True
            )
            self.connection = psycopg.connect(self.database_url, autocommit=True)
            acquired = self.connection.execute(
                "SELECT pg_try_advisory_lock(%s)", (lock_id,)
            ).fetchone()[0]
            if not acquired:
                self.connection.close()
                self.connection = None
            return bool(acquired)
        self.file_handle = Path("/tmp/avax-futures-bot.lock").open("w")
        try:
            fcntl.flock(self.file_handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return True
        except BlockingIOError:
            self.file_handle.close()
            self.file_handle = None
            return False

    def healthy(self) -> bool:
        if self.connection:
            try:
                self.connection.execute("SELECT 1")
                return True
            except Exception:
                return False
        return self.file_handle is not None


class Bot:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.lock = LeaderLock(settings.database_url)
        self.paper_position: PaperPosition | None = None
        self.last_decision: int | None = None
        self.last_context_timestamp: int | None = None
        self.latest_context: MarketContext | None = None
        self.context_symbol: str | None = None
        self.candle_cache: dict[tuple[str, str], list[list[float]]] = {}
        self.paper_universe: list[str] = []
        self.universe_refreshed_at = 0
        self.scan_cursor = 0
        self.latest_tickers: dict[str, dict] = {}
        self.state_guard = threading.RLock()
        self.position_watch_last_message = 0.0
        self.position_watch_connected = False
        self.last_tournament_cycle = 0.0
        self.latest_tournament_summary: dict | None = None
        copy_store = (
            PostgresStateStore(settings.database_url, settings.copy_state_key)
            if settings.database_url
            else (
                HttpStateStore(
                    settings.dashboard_url + "/api/state/copy",
                    settings.dashboard_ingest_token,
                )
                if settings.dashboard_url and settings.dashboard_ingest_token
                else JsonStateStore(settings.paper_state_path + ".copy")
            )
        )
        self.copy_engine = (
            HyperliquidCopyEngine(
                CopySettings(
                    wallets=settings.copy_wallets,
                    initial_usdt=settings.copy_initial_usdt,
                    wallet_fraction=settings.copy_wallet_fraction,
                    leverage=settings.leverage,
                    max_entry_distance_pct=settings.copy_max_entry_distance_pct,
                ),
                copy_store,
            )
            if settings.copy_trading
            else None
        )
        self.tournament = (
            PaperTournament(
                state_path=settings.paper_state_path,
                initial_usdt=settings.paper_initial_usdt,
                duration_hours=settings.paper_duration_hours,
                leverage=settings.leverage,
                wallet_fraction=settings.wallet_fraction,
                take_profit_roe=settings.take_profit_roe,
                demo_seconds=settings.paper_demo_seconds,
                database_url=settings.database_url,
                remote_state_url=(
                    settings.dashboard_url + "/api/state/tournament"
                    if settings.dashboard_url
                    else ""
                ),
                remote_state_token=settings.dashboard_ingest_token,
                state_key=settings.paper_state_key,
                autosave=False,
                max_daily_loss_pct=settings.max_daily_loss_pct,
                max_drawdown_pct=settings.max_drawdown_pct,
                max_consecutive_losses=settings.max_consecutive_losses,
            )
            if settings.paper_tournament and not settings.live
            else None
        )
        self.client = ccxt.binanceusdm(
            {
                "apiKey": settings.api_key,
                "secret": settings.api_secret,
                "enableRateLimit": True,
                "options": {"defaultType": "future", "adjustForTimeDifference": True},
            }
        )
        if settings.testnet:
            self.client.set_sandbox_mode(True)

    def active_position_symbols(self) -> set[str]:
        if not self.tournament:
            return set()
        with self.state_guard:
            return {
                strategy["position"].get("symbol", self.settings.symbol)
                for strategy in self.tournament.state["strategies"].values()
                if strategy.get("position")
            }

    def _market_symbol_from_id(self, market_id: str) -> str | None:
        markets = self.client.markets_by_id.get(market_id)
        if not markets:
            return None
        market = markets[0] if isinstance(markets, list) else markets
        return market.get("symbol")

    def handle_position_quote(
        self,
        market_id: str,
        bid: float,
        ask: float,
        event_time: int | None = None,
    ) -> list[dict]:
        """Process one Binance book-ticker update for protective exits only."""
        if not self.tournament:
            return []
        symbol = self._market_symbol_from_id(market_id)
        if not symbol or symbol not in self.active_position_symbols():
            return []
        ticker = {
            "bid": float(bid),
            "ask": float(ask),
            "last": (float(bid) + float(ask)) / 2,
            "timestamp": event_time or int(time.time() * 1000),
        }
        self.latest_tickers[symbol] = ticker
        with self.state_guard:
            events = self.tournament.manage_open_positions({symbol: ticker})
            if events:
                self.tournament.save()
        for event in events:
            logger.warning(
                "FUTURES REALTIME EXIT %s",
                json.dumps(event, separators=(",", ":"), sort_keys=True),
            )
        self.publish_signal_observations(self.observation_rows_from_events(events))
        return events

    def position_supervisor_forever(self) -> None:
        """Watch active symbols' real-time book tickers independently of scanning."""
        stream_base = (
            "wss://stream.binancefuture.com/stream?streams="
            if self.settings.testnet
            else "wss://fstream.binance.com/stream?streams="
        )

        while True:
            socket = None
            try:
                active_symbols = self.active_position_symbols()
                if not active_symbols:
                    self.position_watch_connected = False
                    time.sleep(0.5)
                    continue
                market_ids = {
                    str(self.client.market(symbol)["id"]).lower()
                    for symbol in active_symbols
                }
                streams = "/".join(
                    f"{market_id}@bookTicker" for market_id in sorted(market_ids)
                )
                socket = websocket.create_connection(
                    stream_base + streams,
                    timeout=10,
                )
                socket.settimeout(1)
                self.position_watch_connected = True
                self.position_watch_last_message = time.monotonic()
                logger.info(
                    "FUTURES position supervisor connected symbols=%s",
                    ",".join(sorted(active_symbols)),
                )
                while active_symbols == self.active_position_symbols():
                    if (
                        time.monotonic() - self.position_watch_last_message
                        > self.settings.position_watch_stale_seconds
                    ):
                        raise TimeoutError("position quote stream became stale")
                    try:
                        raw = socket.recv()
                    except websocket.WebSocketTimeoutException:
                        continue
                    payload = json.loads(raw)
                    row = payload.get("data", payload)
                    market_id = row.get("s")
                    bid = row.get("b")
                    ask = row.get("a")
                    self.position_watch_last_message = time.monotonic()
                    if market_id and bid is not None and ask is not None:
                        self.handle_position_quote(
                            str(market_id),
                            float(bid),
                            float(ask),
                            int(row.get("E") or time.time() * 1000),
                        )
            except Exception:
                logger.exception("FUTURES position supervisor reconnecting")
                time.sleep(1)
            finally:
                self.position_watch_connected = False
                if socket is not None:
                    socket.close()

    def start_position_supervisor(self) -> threading.Thread | None:
        if not self.tournament:
            return None
        thread = threading.Thread(
            name="futures-position-supervisor",
            target=self.position_supervisor_forever,
            daemon=True,
        )
        thread.start()
        return thread

    def setup(self) -> None:
        self.settings.validate()
        if not self.lock.acquire():
            raise RuntimeError("another bot process owns the AVAX trading lock")
        self.client.load_markets()
        if self.copy_engine:
            self.copy_engine.start()
        if self.settings.live:
            try:
                self.client.set_margin_mode("isolated", self.settings.symbol)
            except ccxt.ExchangeError as exc:
                if "No need to change margin type" not in str(exc):
                    raise
            self.client.set_leverage(self.settings.leverage, self.settings.symbol)

    def candles(self, timeframe: str, symbol: str | None = None) -> list[list[float]]:
        market_symbol = symbol or self.settings.symbol
        interval_ms = {
            "5m": 300_000,
            "15m": 900_000,
            "1h": 3_600_000,
            "4h": 14_400_000,
        }[timeframe]
        now = int(time.time() * 1000)
        latest_closed_start = (now // interval_ms - 1) * interval_ms
        cache_key = (market_symbol, timeframe)
        cached = self.candle_cache.get(cache_key)
        if cached and int(cached[-1][0]) >= latest_closed_start:
            return cached
        refreshed = self.client.fetch_ohlcv(
            market_symbol, timeframe, limit=260
        )[:-1]
        self.candle_cache[cache_key] = refreshed
        return refreshed

    def market_context(self, symbol: str) -> MarketContext:
        market_id = str(self.client.market(symbol)["id"])
        params = {"symbol": market_id, "period": "15m", "limit": 5}
        oi_rows = self.client.fapiDataGetOpenInterestHist(params)
        taker_rows = self.client.fapiDataGetTakerlongshortRatio(params)
        global_ratio = None
        top_ratio = None
        funding_rate = None
        try:
            global_rows = self.client.fapiDataGetGlobalLongShortAccountRatio(
                {"symbol": market_id, "period": "15m", "limit": 1}
            )
            global_ratio = float(global_rows[-1]["longShortRatio"])
        except Exception:
            logger.info("Global long/short ratio unavailable symbol=%s", symbol)
        try:
            top_rows = self.client.fapiDataGetTopLongShortPositionRatio(
                {"symbol": market_id, "period": "15m", "limit": 1}
            )
            top_ratio = float(top_rows[-1]["longShortRatio"])
        except Exception:
            logger.info("Top-position ratio unavailable symbol=%s", symbol)
        try:
            funding = self.client.fetch_funding_rate(symbol)
            funding_rate = float(funding.get("fundingRate") or 0.0)
        except Exception:
            logger.info("Funding rate unavailable symbol=%s", symbol)
        first_oi = float(oi_rows[0]["sumOpenInterestValue"])
        last_oi = float(oi_rows[-1]["sumOpenInterestValue"])
        buy_volume = sum(float(row["buyVol"]) for row in taker_rows[-4:])
        sell_volume = sum(float(row["sellVol"]) for row in taker_rows[-4:])
        return MarketContext(
            timestamp=int(oi_rows[-1]["timestamp"]),
            open_interest_change_pct_1h=100 * (last_oi / first_oi - 1) if first_oi else 0.0,
            taker_buy_sell_ratio_1h=buy_volume / sell_volume if sell_volume else 99.0,
            global_long_short_ratio=global_ratio,
            top_position_long_short_ratio=top_ratio,
            funding_rate=funding_rate,
        )

    def observe_market_context(self, symbol: str, candle_timestamp: int) -> None:
        if symbol == self.context_symbol and candle_timestamp == self.last_context_timestamp:
            return
        self.context_symbol = symbol
        self.last_context_timestamp = candle_timestamp
        try:
            self.latest_context = self.market_context(symbol)
        except Exception:
            logger.exception("Futures microstructure observation failed symbol=%s", symbol)
            self.latest_context = None
            return
        context = self.latest_context
        logger.info(
            "FUTURES FLOW %s",
            json.dumps(
                {
                    "symbol": symbol,
                    "timestamp": context.timestamp,
                    "open_interest_change_pct_1h": context.open_interest_change_pct_1h,
                    "taker_buy_sell_ratio_1h": context.taker_buy_sell_ratio_1h,
                    "global_long_short_ratio": context.global_long_short_ratio,
                    "top_position_long_short_ratio": context.top_position_long_short_ratio,
                    "funding_rate": context.funding_rate,
                },
                separators=(",", ":"),
                sort_keys=True,
            ),
        )

    def refresh_paper_universe(self) -> list[str]:
        now = int(time.time() * 1000)
        if self.paper_universe and now - self.universe_refreshed_at < 3_600_000:
            return self.paper_universe
        tickers = self.client.fetch_tickers()
        stable_bases = {"USDT", "USDC", "FDUSD", "TUSD", "DAI", "USDE"}
        ranked = []
        for symbol, market in self.client.markets.items():
            if not (
                market.get("active")
                and market.get("swap")
                and market.get("linear")
                and market.get("quote") == "USDT"
                and market.get("base") not in stable_bases
                and (market.get("info") or {}).get("underlyingType") == "COIN"
            ):
                continue
            ticker = tickers.get(symbol) or {}
            quote_volume = float(ticker.get("quoteVolume") or 0)
            if quote_volume <= 0:
                continue
            ranked.append((quote_volume, symbol))
            self.latest_tickers[symbol] = ticker
        ranked.sort(reverse=True)
        self.paper_universe = [symbol for _, symbol in ranked[: self.settings.universe_size]]
        self.universe_refreshed_at = now
        self.scan_cursor %= max(1, len(self.paper_universe))
        logger.info(
            "FUTURES PAPER universe refreshed count=%s symbols=%s",
            len(self.paper_universe),
            ",".join(self.paper_universe),
        )
        return self.paper_universe

    def next_scan_batch(self) -> list[str]:
        universe = self.refresh_paper_universe()
        if not universe:
            raise RuntimeError("no eligible Binance USD-M perpetual markets")
        count = min(self.settings.scan_batch_size, len(universe))
        batch = [universe[(self.scan_cursor + index) % len(universe)] for index in range(count)]
        self.scan_cursor = (self.scan_cursor + count) % len(universe)
        return batch

    def publish_tournament_summary(self, summary: dict) -> None:
        if not self.settings.dashboard_url or not self.settings.dashboard_ingest_token:
            return
        body = json.dumps(summary, separators=(",", ":")).encode("utf-8")
        request = urllib.request.Request(
            self.settings.dashboard_url + "/api/snapshot",
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-AVAX-Ingest-Token": self.settings.dashboard_ingest_token,
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                if response.status not in {200, 202}:
                    raise RuntimeError(f"dashboard returned HTTP {response.status}")
            logger.info(
                "AVAX dashboard snapshot published mode=%s positions=%s",
                summary.get("mode", "unknown"),
                len(summary.get("positions") or []),
            )
        except (urllib.error.URLError, TimeoutError, RuntimeError):
            logger.exception("AVAX tournament dashboard publish failed")

    @staticmethod
    def context_payload(context: MarketContext | None) -> dict | None:
        if not context:
            return None
        return {
            "timestamp": context.timestamp,
            "open_interest_change_pct_1h": context.open_interest_change_pct_1h,
            "taker_buy_sell_ratio_1h": context.taker_buy_sell_ratio_1h,
            "global_long_short_ratio": context.global_long_short_ratio,
            "top_position_long_short_ratio": context.top_position_long_short_ratio,
            "funding_rate": context.funding_rate,
        }

    def publish_signal_observations(self, observations: list[dict]) -> None:
        if (
            not observations
            or not self.settings.dashboard_url
            or not self.settings.dashboard_ingest_token
        ):
            return
        body = json.dumps(
            {"observations": observations}, separators=(",", ":")
        ).encode("utf-8")
        request = urllib.request.Request(
            self.settings.dashboard_url + "/api/observations",
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-AVAX-Ingest-Token": self.settings.dashboard_ingest_token,
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                if response.status not in {200, 202}:
                    raise RuntimeError(
                        f"observation endpoint returned HTTP {response.status}"
                    )
            logger.info("FUTURES observations published count=%s", len(observations))
        except (urllib.error.URLError, TimeoutError, RuntimeError):
            logger.exception("FUTURES observation publish failed")

    def observation_rows_from_events(self, events: list[dict]) -> list[dict]:
        rows = []
        context_cache: dict[str, dict | None] = {}
        for event in events:
            if event.get("event") == "signal_candidate":
                symbol = str(event.get("symbol") or "")
                if symbol not in context_cache:
                    try:
                        context_cache[symbol] = self.context_payload(
                            self.market_context(symbol)
                        )
                    except Exception:
                        logger.exception(
                            "FUTURES candidate context unavailable symbol=%s",
                            symbol,
                        )
                        context_cache[symbol] = None
                rows.append(
                    {
                        **event,
                        "futures_context": context_cache[symbol],
                    }
                )
            elif event.get("event") == "close" and event.get("observation_id"):
                rows.append(
                    {
                        "event": "trade_outcome",
                        "observation_id": event["observation_id"],
                        "strategy": event.get("strategy"),
                        "symbol": event.get("symbol"),
                        "side": event.get("side"),
                        "opened_at": event.get("opened_at"),
                        "closed_at": event.get("closed_at"),
                        "exit_reason": event.get("exit_reason"),
                        "net_pnl": event.get("net_pnl"),
                        "roi_pct": event.get("roi_pct"),
                    }
                )
        return rows

    def live_position(self) -> dict | None:
        for raw in self.client.fetch_positions([self.settings.symbol]):
            if float(raw.get("contracts") or 0) > 0:
                return raw
        return None

    def client_id(self, kind: str, timestamp: int) -> str:
        return f"avx-{kind}-{timestamp}"[:36]

    def cancel_protection_orders(self) -> None:
        for order in self.client.fetch_open_orders(self.settings.symbol):
            info = order.get("info") or {}
            if order.get("reduceOnly") or info.get("reduceOnly"):
                self.client.cancel_order(order["id"], self.settings.symbol)

    def close_live(self, position: dict, timestamp: int) -> None:
        side = Side.LONG if position["side"] == "long" else Side.SHORT
        self.client.create_order(
            self.settings.symbol,
            "market",
            "sell" if side is Side.LONG else "buy",
            float(position["contracts"]),
            params={
                "reduceOnly": True,
                "newClientOrderId": self.client_id("reversal", timestamp),
            },
        )
        self.cancel_protection_orders()

    def open_live(
        self,
        signal: Signal,
        timestamp: int,
        candles: Sequence[Candle],
    ) -> None:
        if self.live_position():
            raise RuntimeError("position exists; refusing duplicate entry")
        ticker = self.client.fetch_ticker(self.settings.symbol)
        reference = float(ticker["ask"] if signal.side is Side.LONG else ticker["bid"])
        preliminary_stop, preliminary_take = brackets(
            reference,
            signal.side,
            signal.atr_fraction,
            self.settings,
            candles,
        )
        live_profile = STRATEGY_PROFILES[self.settings.live_strategy]
        if "maximum_stop_fraction" in live_profile and (
            abs(preliminary_stop / reference - 1)
            > live_profile["maximum_stop_fraction"]
        ):
            logger.info(
                "AVAX LIVE %s entry rejected: required stop exceeds %.2f%%",
                self.settings.live_strategy,
                100 * live_profile["maximum_stop_fraction"],
            )
            return
        minimum_reward_risk = live_profile.get("minimum_reward_risk")
        risk_distance = abs(reference - preliminary_stop)
        reward_distance = abs(preliminary_take - reference)
        if minimum_reward_risk is not None and (
            risk_distance <= 0
            or reward_distance / risk_distance < minimum_reward_risk
        ):
            logger.info(
                "AVAX LIVE %s entry rejected: reward/risk is below %.2f",
                self.settings.live_strategy,
                minimum_reward_risk,
            )
            return
        balance = self.client.fetch_balance()
        available = float((balance.get("USDT") or {}).get("free") or 0)
        notional = available * self.settings.wallet_fraction * self.settings.leverage
        amount = float(self.client.amount_to_precision(self.settings.symbol, notional / reference))
        order_side = "buy" if signal.side is Side.LONG else "sell"
        entry_order = self.client.create_order(
            self.settings.symbol,
            "market",
            order_side,
            amount,
            params={"newClientOrderId": self.client_id("entry", timestamp)},
        )
        entry = float(entry_order.get("average") or entry_order.get("price") or reference)
        stop, take = brackets(
            entry,
            signal.side,
            signal.atr_fraction,
            self.settings,
            candles,
        )
        close_side = "sell" if signal.side is Side.LONG else "buy"
        stop = float(self.client.price_to_precision(self.settings.symbol, stop))
        take = float(self.client.price_to_precision(self.settings.symbol, take))
        acknowledged_orders = []
        try:
            for kind, order_type, trigger in (
                ("stop", "STOP_MARKET", stop),
                ("take", "TAKE_PROFIT_MARKET", take),
            ):
                protection = self.client.create_order(
                    self.settings.symbol,
                    order_type,
                    close_side,
                    amount,
                    params={
                        "stopPrice": trigger,
                        "reduceOnly": True,
                        "workingType": "MARK_PRICE",
                        "newClientOrderId": self.client_id(kind, timestamp),
                    },
                )
                status = str(protection.get("status") or "").lower()
                if not protection.get("id") or status in {"canceled", "rejected", "expired"}:
                    raise RuntimeError(
                        f"{kind} protection was not acknowledged by Binance"
                    )
                acknowledged_orders.append(
                    {"kind": kind, "id": protection["id"], "trigger": trigger}
                )
            logger.warning(
                "AVAX LIVE protection acknowledged %s",
                json.dumps(acknowledged_orders, separators=(",", ":")),
            )
        except Exception:
            logger.exception("protection order failed; emergency-closing entry")
            position = self.live_position()
            if position:
                self.close_live(position, timestamp)
            raise

    def cycle(self) -> None:
        copy_summary = None
        if self.copy_engine:
            events = self.copy_engine.reconcile(self.client)
            copy_summary = self.copy_engine.summary(self.client)
            positions = copy_summary["positions"]
            reference_symbol = (
                positions[0]["symbol"] if positions else "BTC/USDT:USDT"
            )
            reference_ticker = self.client.fetch_ticker(reference_symbol)
            now = int(time.time() * 1000)
            copy_summary["market_candle"] = now
            copy_summary["market_symbol"] = reference_symbol
            copy_summary["market_price"] = float(
                reference_ticker.get("last") or reference_ticker.get("close")
            )
            copy_summary["universe"] = sorted(
                {
                    market["symbol"]
                    for market in self.client.markets.values()
                    if market.get("active")
                    and market.get("swap")
                    and market.get("linear")
                    and market.get("quote") == "USDT"
                }
            )
            copy_summary["universe_size"] = len(copy_summary["universe"])
            copy_summary["bot_status"] = {
                "enabled": True,
                "mode": "paper-copy",
                "poll_seconds": self.settings.copy_poll_seconds,
                "websocket": True,
                "heartbeat_at": now,
                "state_storage": (
                    "postgres"
                    if self.settings.database_url
                    else (
                        "tyee_remote"
                        if self.settings.dashboard_url
                        and self.settings.dashboard_ingest_token
                        else "local_file"
                    )
                ),
            }
            for event in events:
                logger.warning(
                    "HYPERLIQUID COPY EVENT %s",
                    json.dumps(event, separators=(",", ":"), sort_keys=True),
                )
            # Copy positions must reach the dashboard immediately. Do not make
            # their visibility wait for the independent top-50 strategy scan.
            self.publish_tournament_summary(copy_summary)
            if not self.tournament:
                return
            tournament_due = (
                self.latest_tournament_summary is None
                or time.monotonic() - self.last_tournament_cycle
                >= self.settings.poll_seconds
            )
            if not tournament_due:
                combined = dict(self.latest_tournament_summary)
                combined["copy_trading"] = copy_summary
                combined["market_candle"] = now
                combined["bot_status"] = dict(combined.get("bot_status") or {})
                combined["bot_status"].update(
                    {
                        "enabled": True,
                        "mode": "paper+copy",
                        "poll_seconds": self.settings.copy_poll_seconds,
                        "strategy_poll_seconds": self.settings.poll_seconds,
                        "heartbeat_at": now,
                    }
                )
                self.publish_tournament_summary(combined)
                return
        if self.tournament:
            self.last_tournament_cycle = time.monotonic()
            scan_batch = self.next_scan_batch()
            active_symbols = self.active_position_symbols()
            targets = list(active_symbols) + [
                symbol for symbol in scan_batch if symbol not in active_symbols
            ]
            events = []
            reference_symbol = next(iter(active_symbols), scan_batch[0])
            reference_c15 = None
            btc_1h = self.candles("1h", "BTC/USDT:USDT")
            for symbol in targets:
                # The tournament's primary candle argument now contains
                # closed 5m candles. The parameter name remains c15 for state
                # compatibility with the existing tournament interface.
                c15 = self.candles("5m", symbol)
                # The selective trend strategy uses the coin's 1h regime and
                # BTC's 1h market regime; the first three still decide on 5m.
                c1h = self.candles("1h", symbol)
                c4h = btc_1h
                ticker = self.client.fetch_ticker(symbol)
                self.latest_tickers[symbol] = ticker
                if symbol == reference_symbol:
                    reference_c15 = c15
                    self.observe_market_context(symbol, int(c15[-1][0]))
                symbol_context = (
                    {
                        "timestamp": self.latest_context.timestamp,
                        "open_interest_change_pct_1h": self.latest_context.open_interest_change_pct_1h,
                        "taker_buy_sell_ratio_1h": self.latest_context.taker_buy_sell_ratio_1h,
                        "global_long_short_ratio": self.latest_context.global_long_short_ratio,
                        "top_position_long_short_ratio": self.latest_context.top_position_long_short_ratio,
                        "funding_rate": self.latest_context.funding_rate,
                    }
                    if symbol == reference_symbol and self.latest_context
                    else None
                )
                with self.state_guard:
                    symbol_events, _ = self.tournament.cycle(
                        c15,
                        c1h,
                        c4h,
                        ticker,
                        symbol_context,
                        symbol=symbol,
                        allow_entries=symbol in scan_batch,
                    )
                events.extend(symbol_events)

            with self.state_guard:
                self.tournament.save()
            reference_ticker = self.latest_tickers[reference_symbol]
            with self.state_guard:
                summary = self.tournament.summary(self.latest_tickers)
            context = (
                {
                    "timestamp": self.latest_context.timestamp,
                    "open_interest_change_pct_1h": self.latest_context.open_interest_change_pct_1h,
                    "taker_buy_sell_ratio_1h": self.latest_context.taker_buy_sell_ratio_1h,
                    "global_long_short_ratio": self.latest_context.global_long_short_ratio,
                    "top_position_long_short_ratio": self.latest_context.top_position_long_short_ratio,
                    "funding_rate": self.latest_context.funding_rate,
                }
                if self.latest_context
                else None
            )
            self.publish_signal_observations(
                self.observation_rows_from_events(events)
            )
            for event in (
                event for event in events if event.get("event") != "signal_candidate"
            ):
                logger.warning(
                    "FUTURES TOURNAMENT EVENT %s",
                    json.dumps(event, separators=(",", ":"), sort_keys=True),
                )
            now = int(time.time() * 1000)
            summary["market_candle"] = now
            summary["market_symbol"] = reference_symbol
            summary["market_price"] = float(
                reference_ticker.get("last") or reference_ticker.get("close")
            )
            summary["market_ohlc"] = {
                "open": float(reference_c15[-1][1]),
                "high": float(reference_c15[-1][2]),
                "low": float(reference_c15[-1][3]),
                "close": float(reference_c15[-1][4]),
                "volume": float(reference_c15[-1][5]),
            }
            summary["market_context"] = context
            summary["universe"] = self.paper_universe
            summary["universe_size"] = len(self.paper_universe)
            summary["scan_batch"] = scan_batch
            summary["bot_status"] = {
                "enabled": True,
                "mode": (
                    "live"
                    if self.settings.live
                    else "paper+copy"
                    if copy_summary
                    else "paper"
                ),
                "poll_seconds": (
                    self.settings.copy_poll_seconds
                    if copy_summary
                    else self.settings.poll_seconds
                ),
                "strategy_poll_seconds": self.settings.poll_seconds,
                "heartbeat_at": now,
                "signal_dataset": {
                    "enabled": bool(
                        self.settings.dashboard_url
                        and self.settings.dashboard_ingest_token
                    ),
                    "mode": "offline_research",
                    "minimum_labeled_examples": 300,
                },
                "position_supervisor": {
                    "connected": self.position_watch_connected,
                    "last_message_age_seconds": (
                        round(time.monotonic() - self.position_watch_last_message, 2)
                        if self.position_watch_last_message
                        else None
                    ),
                    "stale_after_seconds": self.settings.position_watch_stale_seconds,
                },
                "state_storage": (
                    "postgres"
                    if self.settings.database_url
                    else (
                        "tyee_remote"
                        if self.settings.dashboard_url
                        and self.settings.dashboard_ingest_token
                        else "local_file"
                    )
                ),
            }
            if copy_summary:
                summary["copy_trading"] = copy_summary
            self.latest_tournament_summary = dict(summary)
            logger.info(
                "FUTURES TOURNAMENT SCORE %s",
                json.dumps(summary, separators=(",", ":"), sort_keys=True),
            )
            self.publish_tournament_summary(summary)
            return
        c15 = self.candles("5m")
        c1h = self.candles("1h")
        c4h = self.candles("1h", "BTC/USDT:USDT")
        timestamp = int(c15[-1][0])
        self.observe_market_context(self.settings.symbol, timestamp)
        if self.settings.live:
            position = self.live_position()
            if position:
                return
            self.cancel_protection_orders()
        elif self.paper_position:
            position = self.paper_position
            high, low = float(c15[-1][2]), float(c15[-1][3])
            stop_hit = low <= position.stop if position.side is Side.LONG else high >= position.stop
            take_hit = high >= position.take if position.side is Side.LONG else low <= position.take
            if stop_hit or take_hit:
                outcome = "stop" if stop_hit else "take"
                logger.info("AVAX PAPER position closed: %s", outcome)
                self.paper_position = None
            return

        if timestamp == self.last_decision:
            return
        self.last_decision = timestamp
        signal = entry_signal(c15, c1h, c4h, self.settings.live_strategy)
        if not signal:
            return
        veto_reason = (
            microstructure_veto(signal.side, self.latest_context)
            if self.latest_context
            else None
        )
        if veto_reason:
            logger.warning(
                "AVAX SHADOW VETO side=%s enforced=%s reason=%s",
                signal.side.value,
                self.settings.microstructure_enforce,
                veto_reason,
            )
            if self.settings.microstructure_enforce:
                return
        if self.settings.live:
            self.open_live(signal, timestamp, c15)
            logger.warning("AVAX LIVE %s opened: %s", signal.side.value, signal.reason)
        else:
            entry = float(c15[-1][4])
            stop, take = brackets(
                entry,
                signal.side,
                signal.atr_fraction,
                self.settings,
                c15,
            )
            self.paper_position = PaperPosition(signal.side, entry, stop, take, timestamp)
            logger.info(
                "AVAX PAPER %s opened entry=%.4f stop=%.4f take=%.4f reason=%s",
                signal.side.value,
                entry,
                stop,
                take,
                signal.reason,
            )

    def run_forever(self) -> None:
        self.setup()
        logger.info(
            "AVAX bot ready mode=%s symbol=%s leverage=%sx margin_fraction=%.2f poll=%ss",
            (
                "PAPER+COPY"
                if self.copy_engine and self.tournament
                else "COPY"
                if self.copy_engine
                else "LIVE"
                if self.settings.live
                else "PAPER"
            ),
            self.settings.symbol,
            self.settings.leverage,
            self.settings.wallet_fraction,
            (
                self.settings.copy_poll_seconds
                if self.copy_engine
                else self.settings.poll_seconds
            ),
        )
        if self.tournament:
            logger.info(
                "AVAX tournament ready strategies=%d initial_usdt=%.2f started_at=%s continuous=%s",
                len(STRATEGIES),
                self.settings.paper_initial_usdt,
                self.tournament.state["started_at"],
                self.tournament.state.get("continuous", True),
            )
            self.start_position_supervisor()
        while True:
            cycle_started = time.monotonic()
            if not self.lock.healthy():
                raise RuntimeError("leadership lock lost; bot stopped fail-closed")
            try:
                self.cycle()
            except Exception:
                logger.exception("AVAX bot cycle failed")
            elapsed = time.monotonic() - cycle_started
            wait_seconds = max(
                0.0,
                (
                    self.settings.copy_poll_seconds
                    if self.copy_engine
                    else self.settings.poll_seconds
                )
                - elapsed,
            )
            if self.copy_engine:
                self.copy_engine.wait(wait_seconds)
            else:
                time.sleep(wait_seconds)


def start_avax_bot_daemon() -> threading.Thread | None:
    settings = Settings()
    if not settings.enabled:
        logger.info("AVAX bot disabled")
        return None

    def target() -> None:
        while True:
            try:
                Bot(settings).run_forever()
            except Exception:
                logger.exception("AVAX bot daemon stopped; retrying in 60 seconds")
                time.sleep(60)

    thread = threading.Thread(name="avax-futures-bot", target=target, daemon=True)
    thread.start()
    return thread
