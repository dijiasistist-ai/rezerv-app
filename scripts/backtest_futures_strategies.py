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
import statistics
import sys
import time
import urllib.parse
import urllib.request
from bisect import bisect_right
from collections import defaultdict
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


def get_futures_series(symbol: str, series: str, start: int, end: int) -> list[dict]:
    endpoints = {
        "taker5m": "/futures/data/takerlongshortRatio",
        "oi5m": "/futures/data/openInterestHist",
    }
    cache_dir = Path("/tmp/tyee-binance-backtest")
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / f"{symbol}-{series}-{start}-{end}-v2.json"
    if cache_path.exists():
        return json.loads(cache_path.read_text("utf-8"))
    rows = []
    cursor_end = end
    while cursor_end > start:
        query = urllib.parse.urlencode(
            {
                "symbol": symbol,
                "period": "5m",
                "startTime": start,
                "endTime": cursor_end,
                "limit": 500,
            }
        )
        request = urllib.request.Request(
            f"https://fapi.binance.com{endpoints[series]}?{query}",
            headers={"User-Agent": "tyee-strategy-audit/1.0"},
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            batch = json.load(response)
        if not batch:
            break
        rows.extend(batch)
        next_cursor_end = int(batch[0]["timestamp"]) - 1
        if next_cursor_end >= cursor_end:
            break
        cursor_end = next_cursor_end
        time.sleep(0.035)
    deduplicated = {
        int(row["timestamp"]): row
        for row in rows
        if start <= int(row["timestamp"]) <= end
    }
    result = [deduplicated[key] for key in sorted(deduplicated)]
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


def direction_is_aligned(side, c1h, btc1h, include_24h=True):
    if len(c1h) < 25 or len(btc1h) < 7:
        return False
    coin = [float(row[4]) for row in c1h]
    btc = [float(row[4]) for row in btc1h]
    moves = [
        coin[-1] / coin[-7] - 1,
        btc[-1] / btc[-7] - 1,
    ]
    if include_24h:
        moves.append(coin[-1] / coin[-25] - 1)
    return all(move > 0 for move in moves) if side == "long" else all(
        move < 0 for move in moves
    )


def flow_snapshot(flow):
    taker = flow["taker"]
    oi = flow["oi"]
    if len(taker) < 12 or len(oi) < 12:
        return None
    buy_1h = sum(float(row["buyVol"]) for row in taker[-12:])
    sell_1h = sum(float(row["sellVol"]) for row in taker[-12:])
    first_oi = float(oi[-12]["sumOpenInterestValue"])
    last_oi = float(oi[-1]["sumOpenInterestValue"])
    return {
        "taker_latest": float(taker[-1]["buySellRatio"]),
        "taker_1h": buy_1h / sell_1h if sell_1h else 99.0,
        "oi_change_1h_pct": 100 * (last_oi / first_oi - 1) if first_oi else 0.0,
    }


def flow_confirms(side, snapshot):
    return (
        snapshot["taker_latest"] >= 1.05 and snapshot["taker_1h"] >= 1.02
        if side == "long"
        else snapshot["taker_latest"] <= 0.95 and snapshot["taker_1h"] <= 0.98
    )


def flow_candidate_signal(name, c5, c1h, btc1h, flow):
    base_name = "liquidity_sweep" if name.startswith("flow_sweep") else "trend_breakout"
    signal = signal_for(base_name, c5, c1h, btc1h)
    snapshot = flow_snapshot(flow)
    if not signal or not snapshot or not flow_confirms(signal[0], snapshot):
        return None
    if name.endswith("_oi_build") and snapshot["oi_change_1h_pct"] <= 0.05:
        return None
    if name.endswith("_oi_unwind") and snapshot["oi_change_1h_pct"] >= -0.05:
        return None
    return signal[0], (
        f"{signal[1]} + taker flow"
        f" + OI {snapshot['oi_change_1h_pct']:+.2f}%"
    ), signal[2]


def consensus_pullback_signal(c5, c1h, btc1h):
    signal = signal_for("selective_trend_pullback", c5, c1h, btc1h)
    if signal and direction_is_aligned(signal[0], c1h, btc1h):
        return signal[0], f"{signal[1]} + 6h/24h direction consensus", signal[2]
    return None


def consensus_sweep_signal(c5, c1h, btc1h):
    signal = signal_for("liquidity_sweep", c5, c1h, btc1h)
    if signal and direction_is_aligned(signal[0], c1h, btc1h):
        return signal[0], f"{signal[1]} + 6h/24h direction consensus", signal[2]
    return None


CANDIDATE_SIGNALS = {
    "regime_retest": regime_retest_signal,
    "regime_breakout": regime_breakout_signal,
    "dual_momentum": dual_momentum_signal,
    "range_reversion": range_reversion_signal,
    "range_reversion_strict": range_reversion_strict_signal,
    "consensus_pullback": consensus_pullback_signal,
    "consensus_sweep": consensus_sweep_signal,
}
CANDIDATE_PROFILES = {
    "regime_retest": "trend_breakout",
    "regime_breakout": "trend_breakout",
    "dual_momentum": "trend_breakout",
    "range_reversion": "bollinger_reversion",
    "range_reversion_strict": "bollinger_reversion",
    "consensus_pullback": "selective_trend_pullback",
    "consensus_sweep": "liquidity_sweep",
    "flow_sweep": "liquidity_sweep",
    "flow_sweep_oi_build": "liquidity_sweep",
    "flow_sweep_oi_unwind": "liquidity_sweep",
    "flow_breakout_oi_build": "trend_breakout",
    "flow_breakout_oi_unwind": "trend_breakout",
}
FLOW_SIGNALS = {
    "flow_sweep",
    "flow_sweep_oi_build",
    "flow_sweep_oi_unwind",
    "flow_breakout_oi_build",
    "flow_breakout_oi_unwind",
}


def aligned_window(rows, timestamps, at, size):
    end = bisect_right(timestamps, at)
    return rows[max(0, end - size) : end]


def entry_diagnostics(c5, c1h, btc1h):
    features = market_features(c5, c1h, btc1h)
    current = float(c5[-1][4])
    coin_hour = [float(row[4]) for row in c1h]
    btc_hour = [float(row[4]) for row in btc1h]
    return {
        "adx": features["adx"],
        "rsi": features["rsi"],
        "volume_ratio": features["volume_ratio"],
        "extension_atr": abs(current - features["ema21_5m"]) / features["atr"],
        "coin_6h_return_pct": 100 * (coin_hour[-1] / coin_hour[-7] - 1),
        "btc_6h_return_pct": 100 * (btc_hour[-1] / btc_hour[-7] - 1),
        "coin_24h_return_pct": 100 * (coin_hour[-1] / coin_hour[-25] - 1),
    }


def recovery_after_stop(trade, rows, indexes):
    if trade["reason"] != "stop":
        return None
    start_index = indexes[trade["symbol"]].get(trade["closed_at"])
    if start_index is None:
        return None
    future = rows[trade["symbol"]]["5m"][start_index + 1 : start_index + 145]
    result = {}
    for label, bars in (("1h", future[:12]), ("4h", future[:48]), ("12h", future)):
        revisit_index = None
        target_hit = False
        for offset, row in enumerate(bars, 1):
            high, low = float(row[2]), float(row[3])
            if trade["side"] == "long":
                revisited = high >= trade["entry"]
                target_hit = target_hit or high >= trade["take"]
            else:
                revisited = low <= trade["entry"]
                target_hit = target_hit or low <= trade["take"]
            if revisited and revisit_index is None:
                revisit_index = offset
        result[label] = {
            "revisited_entry": revisit_index is not None,
            "minutes_to_revisit": revisit_index * 5 if revisit_index else None,
            "eventual_target_hit": target_hit,
        }
    return result


def compact_group_stats(trades, key):
    groups = defaultdict(list)
    for trade in trades:
        groups[str(trade[key])].append(trade)
    return {
        label: {
            "trades": len(subset),
            "win_rate_pct": round(
                100 * sum(trade["pnl"] > 0 for trade in subset) / len(subset), 2
            ),
            "net_pnl_usdt": round(sum(trade["pnl"] for trade in subset), 2),
        }
        for label, subset in sorted(groups.items())
    }


def feature_comparison(trades):
    result = {}
    for feature in (
        "adx",
        "rsi",
        "volume_ratio",
        "extension_atr",
        "coin_6h_return_pct",
        "btc_6h_return_pct",
        "coin_24h_return_pct",
    ):
        result[feature] = {}
        for label, subset in (
            ("wins", [trade for trade in trades if trade["pnl"] > 0]),
            ("losses", [trade for trade in trades if trade["pnl"] <= 0]),
        ):
            values = [trade["features"][feature] for trade in subset]
            result[feature][label] = {
                "mean": round(statistics.fmean(values), 4) if values else None,
                "median": round(statistics.median(values), 4) if values else None,
            }
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=60)
    parser.add_argument("--symbols", nargs="*", default=list(SYMBOLS))
    parser.add_argument(
        "--strategies",
        nargs="*",
        default=[*STRATEGIES, *CANDIDATE_SIGNALS],
    )
    parser.add_argument(
        "--target-roe-pct",
        type=float,
        help="Override every tested profile's fixed ROE target.",
    )
    parser.add_argument(
        "--slippage-bps",
        type=float,
        default=0.0,
        help="Adverse execution slippage applied on every entry and exit.",
    )
    parser.add_argument("--output", default="/tmp/tyee-strategy-backtest.json")
    args = parser.parse_args()
    if args.target_roe_pct is not None:
        for profile in STRATEGY_PROFILES.values():
            profile["take_profit_roe"] = args.target_roe_pct / 100
    slippage = args.slippage_bps / 10_000
    end = math.floor(int(time.time() * 1000) / 3_600_000) * 3_600_000
    start = end - args.days * 86_400_000

    data = {}
    needs_flow = any(name in FLOW_SIGNALS for name in args.strategies)
    for symbol in args.symbols:
        print(f"downloading {symbol}", flush=True)
        data[symbol] = {
            "5m": get_klines(symbol, "5m", start - 2 * 86_400_000, end),
            "1h": get_klines(symbol, "1h", start - 12 * 86_400_000, end),
        }
        if needs_flow:
            data[symbol]["taker5m"] = get_futures_series(
                symbol, "taker5m", start, end
            )
            data[symbol]["oi5m"] = get_futures_series(
                symbol, "oi5m", start, end
            )
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
    taker_ts = {
        symbol: [int(row["timestamp"]) for row in data[symbol].get("taker5m", [])]
        for symbol in args.symbols
    }
    oi_ts = {
        symbol: [int(row["timestamp"]) for row in data[symbol].get("oi5m", [])]
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
            exit_level = position[reason]
            exit_price = exit_level * (
                1 - slippage if position["side"] == "long" else 1 + slippage
            )
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
                    "signal_reason": position["reason"],
                    "entry": position["entry"],
                    "stop": position["stop"],
                    "take": position["take"],
                    "margin": position["margin"],
                    "gross_pnl": gross,
                    "fees": position["entry_fee"] + exit_fee,
                    "pnl": pnl,
                    "roi_pct": 100 * pnl / position["margin"],
                    "holding_minutes": (timestamp - position["opened_at"]) / 60_000,
                    "stop_distance_pct": 100
                    * abs(position["stop"] / position["entry"] - 1),
                    "target_distance_pct": 100
                    * abs(position["take"] / position["entry"] - 1),
                    "reward_risk": abs(position["take"] - position["entry"])
                    / abs(position["entry"] - position["stop"]),
                    "features": position["features"],
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
                # The 5m signal bar closes at timestamp + 5m. Therefore the
                # newest knowable 1h bar opened 55 minutes earlier; using the
                # current hour's row would leak its future close/high/low.
                c1h = aligned_window(
                    data[symbol]["1h"],
                    hour_ts[symbol],
                    timestamp - 55 * 60_000,
                    300,
                )
                btc_window = aligned_window(
                    btc1h,
                    btc_ts,
                    timestamp - 55 * 60_000,
                    300,
                )
                if name in FLOW_SIGNALS:
                    flow = {
                        "taker": aligned_window(
                            data[symbol]["taker5m"],
                            taker_ts[symbol],
                            timestamp,
                            24,
                        ),
                        # OI timestamps mark the period end, so the row ending
                        # with this signal candle is knowable at its close.
                        "oi": aligned_window(
                            data[symbol]["oi5m"],
                            oi_ts[symbol],
                            timestamp + 5 * 60_000,
                            24,
                        ),
                    }
                    signal = flow_candidate_signal(
                        name, c5, c1h, btc_window, flow
                    )
                elif name in CANDIDATE_SIGNALS:
                    signal = CANDIDATE_SIGNALS[name](c5, c1h, btc_window)
                else:
                    signal = signal_for(name, c5, c1h, btc_window)
                if not signal:
                    continue
                side, reason, atr_fraction = signal
                raw_entry = float(data[symbol]["5m"][next_index][1])
                entry = raw_entry * (1 + slippage if side == "long" else 1 - slippage)
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
                    "features": entry_diagnostics(c5, c1h, btc_window),
                }
                break

    results = {}
    for name, state in states.items():
        trades = state["trades"]
        for trade in trades:
            recovery = recovery_after_stop(trade, data, indexes)
            if recovery:
                trade["post_stop_recovery"] = recovery
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
        stopped = [trade for trade in trades if trade["reason"] == "stop"]
        recovery_summary = {}
        for horizon in ("1h", "4h", "12h"):
            available = [
                trade
                for trade in stopped
                if trade.get("post_stop_recovery", {}).get(horizon)
            ]
            revisited = [
                trade
                for trade in available
                if trade["post_stop_recovery"][horizon]["revisited_entry"]
            ]
            target_hit = [
                trade
                for trade in available
                if trade["post_stop_recovery"][horizon]["eventual_target_hit"]
            ]
            recovery_summary[horizon] = {
                "stops_observed": len(available),
                "entry_revisit_pct": round(
                    100 * len(revisited) / len(available), 2
                )
                if available
                else 0.0,
                "eventual_target_pct": round(
                    100 * len(target_hit) / len(available), 2
                )
                if available
                else 0.0,
                "median_minutes_to_revisit": round(
                    statistics.median(
                        trade["post_stop_recovery"][horizon]["minutes_to_revisit"]
                        for trade in revisited
                    ),
                    1,
                )
                if revisited
                else None,
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
            "average_win_usdt": round(
                statistics.fmean(trade["pnl"] for trade in wins), 2
            )
            if wins
            else 0.0,
            "average_loss_usdt": round(
                statistics.fmean(trade["pnl"] for trade in losses), 2
            )
            if losses
            else 0.0,
            "median_holding_minutes": round(
                statistics.median(trade["holding_minutes"] for trade in trades), 1
            )
            if trades
            else 0.0,
            "average_stop_distance_pct": round(
                statistics.fmean(trade["stop_distance_pct"] for trade in trades), 3
            )
            if trades
            else 0.0,
            "average_reward_risk": round(
                statistics.fmean(trade["reward_risk"] for trade in trades), 3
            )
            if trades
            else 0.0,
            "by_symbol": compact_group_stats(trades, "symbol"),
            "by_side": compact_group_stats(trades, "side"),
            "by_exit": compact_group_stats(trades, "reason"),
            "winner_loser_features": feature_comparison(trades),
            "post_stop_recovery": recovery_summary,
            "open_position": bool(state["position"]),
            "halves": halves,
            "trades": trades,
        }
    payload = {
        "period_days": args.days,
        "period_start": start,
        "period_end": end,
        "symbols": args.symbols,
        "assumptions": {
            "leverage": LEVERAGE,
            "margin_fraction": MARGIN_FRACTION,
            "taker_fee_each_side": FEE,
            "slippage_bps_each_fill": args.slippage_bps,
            "entry": "next_5m_open",
            "same_bar_stop_and_take": "stop_first",
        },
        "results": results,
    }
    Path(args.output).write_text(json.dumps(payload, indent=2), "utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
