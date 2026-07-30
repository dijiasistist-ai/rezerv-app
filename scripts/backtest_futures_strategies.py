#!/usr/bin/env python3
"""Walk-forward comparison for the paper strategies using Binance Futures bars.

This is deliberately separate from the live worker. It enters on the next 5m
open after a closed-candle signal, charges taker fees on both sides, and assumes
the stop is hit first when stop and target both trade inside the same candle.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import time
import urllib.parse
import urllib.request
from bisect import bisect_right
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "futures-worker"))

from avax_paper_tournament import (  # noqa: E402
    STRATEGIES,
    STRATEGY_PROFILES,
    adx,
    atr,
    bollinger_bands,
    brackets,
    closed_15m_candles,
    ema,
    market_features,
    rsi,
    signal_for,
)

SYMBOLS = (
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "SOLUSDT",
    "XRPUSDT",
    "DOGEUSDT",
    "ADAUSDT",
    "LINKUSDT",
    "AVAXUSDT",
    "SUIUSDT",
    "AAVEUSDT",
    "NEARUSDT",
)
FEE = 0.0005
LEVERAGE = 2
INITIAL_BALANCE = 6000.0
MARGIN_FRACTION = 0.20


def get_klines(symbol: str, interval: str, start: int, end: int) -> list[list]:
    cache_dir = Path("/tmp/tyee-binance-backtest")
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / f"{symbol}-{interval}-{start}-{end}.json"
    if cache_path.exists():
        return json.loads(cache_path.read_text("utf-8"))
    rows: list[list] = []
    cursor = start
    while cursor < end:
        query = urllib.parse.urlencode(
            {
                "symbol": symbol,
                "interval": interval,
                "startTime": cursor,
                "endTime": end,
                "limit": 1500,
            }
        )
        request = urllib.request.Request(
            f"https://fapi.binance.com/fapi/v1/klines?{query}",
            headers={"User-Agent": "tyee-strategy-audit/1.0"},
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            batch = json.load(response)
        if not batch:
            break
        rows.extend(batch)
        next_cursor = int(batch[-1][0]) + 1
        if next_cursor <= cursor:
            break
        cursor = next_cursor
        time.sleep(0.035)
    result = [row for row in rows if int(row[0]) < end]
    cache_path.write_text(json.dumps(result, separators=(",", ":")), "utf-8")
    return result


def regime_retest_signal(c5, c1h, btc1h):
    """High-selectivity trend retest without the slow EMA200 gate."""
    if len(c5) < 80 or len(c1h) < 80 or len(btc1h) < 80:
        return None
    features = market_features(c5, c1h, btc1h)
    closes = features["close15"]
    current = closes[-1]
    current_open = float(c5[-1][1])
    current_high = float(c5[-1][2])
    current_low = float(c5[-1][3])
    previous_high = float(c5[-2][2])
    previous_low = float(c5[-2][3])
    coin_hour = [float(row[4]) for row in c1h]
    btc_hour = [float(row[4]) for row in btc1h]
    coin_ema21, coin_ema50 = ema(coin_hour, 21), ema(coin_hour, 50)
    btc_ema21, btc_ema50 = ema(btc_hour, 21), ema(btc_hour, 50)
    extension = abs(current - features["ema21_15"][-1]) / features["atr"]
    body = abs(current - current_open) / features["atr"]
    touched_long = any(
        float(c5[index][3]) <= features["ema21_15"][index]
        for index in range(len(c5) - 5, len(c5) - 1)
    )
    touched_short = any(
        float(c5[index][2]) >= features["ema21_15"][index]
        for index in range(len(c5) - 5, len(c5) - 1)
    )
    long_regime = (
        coin_ema21[-1] > coin_ema50[-1]
        and coin_ema21[-1] > coin_ema21[-4]
        and btc_ema21[-1] > btc_ema50[-1]
        and features["ema21_5m"] > features["ema55_5m"]
        and features["ema21_5m"] > features["ema21_5m_prior"]
    )
    short_regime = (
        coin_ema21[-1] < coin_ema50[-1]
        and coin_ema21[-1] < coin_ema21[-4]
        and btc_ema21[-1] < btc_ema50[-1]
        and features["ema21_5m"] < features["ema55_5m"]
        and features["ema21_5m"] < features["ema21_5m_prior"]
    )
    common = (
        16 <= features["adx"] <= 45
        and 0.65 <= features["volume_ratio"] <= 4.0
        and extension <= 0.60
        and body <= 1.20
    )
    if (
        common
        and long_regime
        and touched_long
        and current > features["ema9_15"][-1]
        and current > previous_high
        and current_low <= features["ema21_15"][-1] + 0.20 * features["atr"]
        and 47 <= features["rsi"] <= 64
    ):
        return "long", "1h regime + BTC alignment + 5m retest", features["atr"] / current
    if (
        common
        and short_regime
        and touched_short
        and current < features["ema9_15"][-1]
        and current < previous_low
        and current_high >= features["ema21_15"][-1] - 0.20 * features["atr"]
        and 36 <= features["rsi"] <= 53
    ):
        return "short", "1h regime + BTC alignment + 5m rejection", features["atr"] / current
    return None


def regime_breakout_signal(c5, c1h, btc1h):
    """Breakout only when the coin and BTC hourly regimes agree."""
    if len(c5) < 80 or len(c1h) < 80 or len(btc1h) < 80:
        return None
    features = market_features(c5, c1h, btc1h)
    closes = features["close15"]
    current = closes[-1]
    coin_hour = [float(row[4]) for row in c1h]
    btc_hour = [float(row[4]) for row in btc1h]
    coin_ema21, coin_ema50 = ema(coin_hour, 21), ema(coin_hour, 50)
    btc_ema21, btc_ema50 = ema(btc_hour, 21), ema(btc_hour, 50)
    prior_high = max(float(row[2]) for row in c5[-7:-1])
    prior_low = min(float(row[3]) for row in c5[-7:-1])
    extension = abs(current - features["ema21_5m"]) / features["atr"]
    common = (
        18 <= features["adx"] <= 48
        and 0.90 <= features["volume_ratio"] <= 4.0
        and extension <= 1.10
    )
    if (
        common
        and coin_ema21[-1] > coin_ema50[-1]
        and coin_ema21[-1] > coin_ema21[-4]
        and btc_ema21[-1] > btc_ema50[-1]
        and features["ema21_5m"] > features["ema55_5m"]
        and current > prior_high
        and 52 <= features["rsi"] <= 70
    ):
        return "long", "1h coin/BTC regime + 5m six-bar breakout", features["atr"] / current
    if (
        common
        and coin_ema21[-1] < coin_ema50[-1]
        and coin_ema21[-1] < coin_ema21[-4]
        and btc_ema21[-1] < btc_ema50[-1]
        and features["ema21_5m"] < features["ema55_5m"]
        and current < prior_low
        and 30 <= features["rsi"] <= 48
    ):
        return "short", "1h coin/BTC regime + 5m six-bar breakdown", features["atr"] / current
    return None


def dual_momentum_signal(c5, c1h, btc1h):
    """6h/24h momentum agreement plus a restrained 5m continuation."""
    if len(c5) < 80 or len(c1h) < 30 or len(btc1h) < 30:
        return None
    features = market_features(c5, c1h, btc1h)
    closes = features["close15"]
    current = closes[-1]
    coin_hour = [float(row[4]) for row in c1h]
    btc_hour = [float(row[4]) for row in btc1h]
    coin_6h = coin_hour[-1] / coin_hour[-7] - 1
    coin_24h = coin_hour[-1] / coin_hour[-25] - 1
    btc_6h = btc_hour[-1] / btc_hour[-7] - 1
    prior_high = max(float(row[2]) for row in c5[-5:-1])
    prior_low = min(float(row[3]) for row in c5[-5:-1])
    extension = abs(current - features["ema21_5m"]) / features["atr"]
    common = (
        20 <= features["adx"] <= 50
        and 0.85 <= features["volume_ratio"] <= 4.0
        and extension <= 0.95
    )
    if (
        common
        and coin_6h > 0.006
        and coin_24h > 0.012
        and btc_6h > 0
        and features["ema21_5m"] > features["ema55_5m"]
        and current > prior_high
        and 52 <= features["rsi"] <= 68
    ):
        return "long", "6h/24h momentum + BTC + 5m continuation", features["atr"] / current
    if (
        common
        and coin_6h < -0.006
        and coin_24h < -0.012
        and btc_6h < 0
        and features["ema21_5m"] < features["ema55_5m"]
        and current < prior_low
        and 32 <= features["rsi"] <= 48
    ):
        return "short", "6h/24h momentum + BTC + 5m continuation", features["atr"] / current
    return None


def range_reversion_signal(c5, c1h, btc1h):
    """Closed 15m outer-band rejection while trend strength is low."""
    candles = closed_15m_candles(c5)
    if len(candles) < 24:
        return None
    closes = [float(row[4]) for row in candles]
    lower, middle, upper = bollinger_bands(closes[:-1])
    current = candles[-1]
    current_open = float(current[1])
    current_high = float(current[2])
    current_low = float(current[3])
    current_close = float(current[4])
    width_pct = 100 * (upper - lower) / middle
    atr_fraction = atr(candles) / current_close
    ranging = adx(candles) <= 20 and 1.0 <= width_pct <= 8.0
    if (
        ranging
        and current_low <= lower
        and current_close > lower
        and current_close > current_open
        and current_close < middle
        and rsi(closes) <= 43
    ):
        return "long", "15m low-ADX lower-band rejection", atr_fraction
    if (
        ranging
        and current_high >= upper
        and current_close < upper
        and current_close < current_open
        and current_close > middle
        and rsi(closes) >= 57
    ):
        return "short", "15m low-ADX upper-band rejection", atr_fraction
    return None


def range_reversion_strict_signal(c5, c1h, btc1h):
    """More selective range rejection used as an untouched holdout candidate."""
    candles = closed_15m_candles(c5)
    if len(candles) < 24:
        return None
    closes = [float(row[4]) for row in candles]
    lower, middle, upper = bollinger_bands(closes[:-1])
    current = candles[-1]
    current_open, current_high, current_low, current_close = map(
        float, (current[1], current[2], current[3], current[4])
    )
    width_pct = 100 * (upper - lower) / middle
    candle_range = max(current_high - current_low, 1e-12)
    lower_wick = min(current_open, current_close) - current_low
    upper_wick = current_high - max(current_open, current_close)
    ranging = adx(candles) <= 18 and 1.2 <= width_pct <= 7.0
    atr_fraction = atr(candles) / current_close
    if (
        ranging
        and current_low <= lower
        and current_close > lower
        and current_close > current_open
        and lower_wick / candle_range >= 0.35
        and rsi(closes) <= 40
    ):
        return "long", "15m strict lower-band wick rejection", atr_fraction
    if (
        ranging
        and current_high >= upper
        and current_close < upper
        and current_close < current_open
        and upper_wick / candle_range >= 0.35
        and rsi(closes) >= 60
    ):
        return "short", "15m strict upper-band wick rejection", atr_fraction
    return None


CANDIDATE_SIGNALS = {
    "regime_retest": regime_retest_signal,
    "regime_breakout": regime_breakout_signal,
    "dual_momentum": dual_momentum_signal,
    "range_reversion": range_reversion_signal,
    "range_reversion_strict": range_reversion_strict_signal,
}
CANDIDATE_PROFILES = {
    "regime_retest": "trend_breakout",
    "regime_breakout": "trend_breakout",
    "dual_momentum": "trend_breakout",
    "range_reversion": "bollinger_reversion",
    "range_reversion_strict": "bollinger_reversion",
}


def aligned_window(rows, timestamps, at, size):
    end = bisect_right(timestamps, at)
    return rows[max(0, end - size) : end]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=60)
    parser.add_argument("--symbols", nargs="*", default=list(SYMBOLS))
    parser.add_argument(
        "--strategies",
        nargs="*",
        default=[*STRATEGIES, *CANDIDATE_SIGNALS],
    )
    parser.add_argument("--output", default="/tmp/tyee-strategy-backtest.json")
    args = parser.parse_args()
    end = math.floor(int(time.time() * 1000) / 3_600_000) * 3_600_000
    start = end - args.days * 86_400_000

    data = {}
    for symbol in args.symbols:
        print(f"downloading {symbol}", flush=True)
        data[symbol] = {
            "5m": get_klines(symbol, "5m", start - 2 * 86_400_000, end),
            "1h": get_klines(symbol, "1h", start - 12 * 86_400_000, end),
        }
    btc1h = data["BTCUSDT"]["1h"]
    btc_ts = [int(row[0]) for row in btc1h]
    timeline = sorted(
        {
            int(row[0])
            for symbol in args.symbols
            for row in data[symbol]["5m"]
            if start <= int(row[0]) < end
        }
    )
    indexes = {
        symbol: {int(row[0]): index for index, row in enumerate(data[symbol]["5m"])}
        for symbol in args.symbols
    }
    hour_ts = {
        symbol: [int(row[0]) for row in data[symbol]["1h"]]
        for symbol in args.symbols
    }
    names = tuple(args.strategies)
    states = {
        name: {
            "balance": INITIAL_BALANCE,
            "position": None,
            "trades": [],
            "next_entry_at": 0,
            "equity_peak": INITIAL_BALANCE,
            "max_drawdown_pct": 0.0,
        }
        for name in names
    }

    for timestamp in timeline:
        # First manage positions using the full next candle range.
        for name, state in states.items():
            position = state["position"]
            if not position:
                continue
            row_index = indexes[position["symbol"]].get(timestamp)
            if row_index is None:
                continue
            row = data[position["symbol"]]["5m"][row_index]
            high, low = float(row[2]), float(row[3])
            stop_hit = (
                low <= position["stop"]
                if position["side"] == "long"
                else high >= position["stop"]
            )
            take_hit = (
                high >= position["take"]
                if position["side"] == "long"
                else low <= position["take"]
            )
            if not stop_hit and not take_hit:
                continue
            reason = "stop" if stop_hit else "take"
            exit_price = position[reason]
            gross = (
                (exit_price - position["entry"]) * position["quantity"]
                if position["side"] == "long"
                else (position["entry"] - exit_price) * position["quantity"]
            )
            exit_fee = exit_price * position["quantity"] * FEE
            pnl = gross - position["entry_fee"] - exit_fee
            state["balance"] += gross - exit_fee
            state["trades"].append(
                {
                    "symbol": position["symbol"],
                    "side": position["side"],
                    "opened_at": position["opened_at"],
                    "closed_at": timestamp,
                    "reason": reason,
                    "pnl": pnl,
                    "roi_pct": 100 * pnl / position["margin"],
                }
            )
            state["position"] = None
            strategy_name = CANDIDATE_PROFILES.get(name, name)
            state["next_entry_at"] = (
                timestamp + STRATEGY_PROFILES[strategy_name]["cooldown_ms"]
            )
            state["equity_peak"] = max(state["equity_peak"], state["balance"])
            drawdown = 100 * (1 - state["balance"] / state["equity_peak"])
            state["max_drawdown_pct"] = max(state["max_drawdown_pct"], drawdown)

        # Signals are evaluated on this just-closed bar and entered at the next
        # available 5m open. Scan order is fixed for reproducibility.
        next_timestamp = timestamp + 5 * 60_000
        for name, state in states.items():
            if state["position"] or timestamp < state["next_entry_at"]:
                continue
            for symbol in args.symbols:
                index = indexes[symbol].get(timestamp)
                next_index = indexes[symbol].get(next_timestamp)
                if index is None or next_index is None or index < 79:
                    continue
                # The slowest indicator is EMA55 and Bollinger needs 24
                # aggregated 15m candles; 100 closed 5m bars are sufficient.
                c5 = data[symbol]["5m"][max(0, index - 99) : index + 1]
                c1h = aligned_window(
                    data[symbol]["1h"], hour_ts[symbol], timestamp, 300
                )
                btc_window = aligned_window(btc1h, btc_ts, timestamp, 300)
                signal = (
                    CANDIDATE_SIGNALS[name](c5, c1h, btc_window)
                    if name in CANDIDATE_SIGNALS
                    else signal_for(name, c5, c1h, btc_window)
                )
                if not signal:
                    continue
                side, reason, atr_fraction = signal
                entry = float(data[symbol]["5m"][next_index][1])
                strategy_name = CANDIDATE_PROFILES.get(name, name)
                stop, take = brackets(
                    strategy_name,
                    entry,
                    side,
                    atr_fraction,
                    LEVERAGE,
                    0.03,
                    c5,
                )
                profile = STRATEGY_PROFILES[strategy_name]
                stop_fraction = abs(stop / entry - 1)
                if (
                    profile.get("maximum_stop_fraction") is not None
                    and stop_fraction > profile["maximum_stop_fraction"]
                ):
                    continue
                risk_distance = abs(entry - stop)
                reward_distance = abs(take - entry)
                minimum_reward_risk = profile.get("minimum_reward_risk")
                if (
                    minimum_reward_risk is not None
                    and (
                        risk_distance <= 0
                        or reward_distance / risk_distance < minimum_reward_risk
                    )
                ):
                    continue
                margin = state["balance"] * MARGIN_FRACTION
                notional = margin * LEVERAGE
                quantity = notional / entry
                entry_fee = notional * FEE
                state["balance"] -= entry_fee
                state["position"] = {
                    "symbol": symbol,
                    "side": side,
                    "entry": entry,
                    "stop": stop,
                    "take": take,
                    "quantity": quantity,
                    "margin": margin,
                    "entry_fee": entry_fee,
                    "opened_at": next_timestamp,
                    "reason": reason,
                }
                break

    results = {}
    for name, state in states.items():
        trades = state["trades"]
        wins = [trade for trade in trades if trade["pnl"] > 0]
        losses = [trade for trade in trades if trade["pnl"] <= 0]
        gross_profit = sum(trade["pnl"] for trade in wins)
        gross_loss = abs(sum(trade["pnl"] for trade in losses))
        midpoint = start + (end - start) // 2
        halves = {}
        for label, subset in (
            ("first_half", [trade for trade in trades if trade["closed_at"] < midpoint]),
            ("second_half", [trade for trade in trades if trade["closed_at"] >= midpoint]),
        ):
            subset_wins = [trade for trade in subset if trade["pnl"] > 0]
            subset_profit = sum(max(0.0, trade["pnl"]) for trade in subset)
            subset_loss = abs(sum(min(0.0, trade["pnl"]) for trade in subset))
            halves[label] = {
                "trades": len(subset),
                "win_rate_pct": (
                    round(100 * len(subset_wins) / len(subset), 2)
                    if subset
                    else 0.0
                ),
                "net_pnl_usdt": round(sum(trade["pnl"] for trade in subset), 2),
                "profit_factor": (
                    round(subset_profit / subset_loss, 3)
                    if subset_loss
                    else None
                ),
            }
        results[name] = {
            "closed_trades": len(trades),
            "wins": len(wins),
            "win_rate_pct": round(100 * len(wins) / len(trades), 2)
            if trades
            else 0.0,
            "net_pnl_usdt": round(sum(trade["pnl"] for trade in trades), 2),
            "return_pct": round(
                100 * sum(trade["pnl"] for trade in trades) / INITIAL_BALANCE, 2
            ),
            "profit_factor": round(gross_profit / gross_loss, 3)
            if gross_loss
            else None,
            "average_trade_usdt": round(
                sum(trade["pnl"] for trade in trades) / len(trades), 2
            )
            if trades
            else 0.0,
            "max_drawdown_pct": round(state["max_drawdown_pct"], 2),
            "open_position": bool(state["position"]),
            "halves": halves,
        }
    payload = {
        "period_days": args.days,
        "symbols": args.symbols,
        "assumptions": {
            "leverage": LEVERAGE,
            "margin_fraction": MARGIN_FRACTION,
            "taker_fee_each_side": FEE,
            "entry": "next_5m_open",
            "same_bar_stop_and_take": "stop_first",
        },
        "results": results,
    }
    Path(args.output).write_text(json.dumps(payload, indent=2), "utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
