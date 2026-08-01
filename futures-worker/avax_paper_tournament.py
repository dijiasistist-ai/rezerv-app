"""Five-strategy futures paper-trading tournament using live Binance prices."""

from __future__ import annotations

import json
import hashlib
import os
import statistics
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Sequence

Candle = Sequence[float]

STRATEGIES = (
    "trend_breakout",
    "pullback_reclaim",
    "liquidity_sweep",
    "selective_trend_pullback",
    "bollinger_reversion",
    "cross_sectional_momentum",
    "dynamic_pair_reversion",
    "funding_basis",
    "btc_lead_lag",
    "orderflow_open_interest",
)
STATE_VERSION = 11
PROFIT_HOLD_THRESHOLD_USDT = 15.0
PROFIT_LOCK_FLOOR_USDT = 10.0
PROFIT_HOLD_SECONDS = 10 * 60


class JsonStateStore:
    def __init__(self, path: str) -> None:
        self.path = Path(path)

    def load(self) -> dict | None:
        if not self.path.exists():
            return None
        return json.loads(self.path.read_text("utf-8"))

    def save(self, state: dict) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(self.path.suffix + ".tmp")
        temporary.write_text(json.dumps(state, separators=(",", ":")), "utf-8")
        os.replace(temporary, self.path)


class PostgresStateStore:
    def __init__(self, database_url: str, state_key: str) -> None:
        self.database_url = database_url
        self.state_key = state_key

    def _connect(self):
        import psycopg

        return psycopg.connect(self.database_url)

    def load(self) -> dict | None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS avax_paper_state (
                    state_key TEXT PRIMARY KEY,
                    payload JSONB NOT NULL,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            row = connection.execute(
                "SELECT payload FROM avax_paper_state WHERE state_key = %s",
                (self.state_key,),
            ).fetchone()
        return row[0] if row else None

    def save(self, state: dict) -> None:
        payload = json.dumps(state, separators=(",", ":"))
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO avax_paper_state (state_key, payload, updated_at)
                VALUES (%s, %s::jsonb, NOW())
                ON CONFLICT (state_key) DO UPDATE
                SET payload = EXCLUDED.payload, updated_at = NOW()
                """,
                (self.state_key, payload),
            )


class HttpStateStore:
    def __init__(self, state_url: str, token: str) -> None:
        self.state_url = state_url
        self.token = token

    def _request(self, method: str, payload: dict | None = None):
        body = (
            json.dumps(payload, separators=(",", ":")).encode("utf-8")
            if payload is not None
            else None
        )
        for attempt in range(3):
            request = urllib.request.Request(
                self.state_url,
                data=body,
                method=method,
                headers={
                    "Content-Type": "application/json",
                    "X-AVAX-Ingest-Token": self.token,
                },
            )
            try:
                with urllib.request.urlopen(request, timeout=10) as response:
                    content = response.read()
                    return json.loads(content.decode("utf-8")) if content else None
            except urllib.error.HTTPError as exc:
                if method == "GET" and exc.code == 404:
                    return None
                if exc.code not in {502, 503, 504} or attempt == 2:
                    raise
            except urllib.error.URLError:
                if attempt == 2:
                    raise
            time.sleep(0.25 * (attempt + 1))
        raise RuntimeError("remote state request exhausted retries")

    def load(self) -> dict | None:
        response = self._request("GET")
        return response.get("state") if response else None

    def save(self, state: dict) -> None:
        self._request("PUT", {"state": state})

STRATEGY_PROFILES = {
    "trend_breakout": {
        "decision_timeframe": "5m",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 30 * 60_000,
        "exit_model": "fixed take profit or volatility/structure stop",
        "minimum_stop_fraction": 0.004,
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.2,
        "maximum_stop_fraction": 0.015,
    },
    "pullback_reclaim": {
        "decision_timeframe": "5m",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 15 * 60_000,
        "exit_model": "fixed take profit or volatility/structure stop",
        "minimum_stop_fraction": 0.004,
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.2,
        "maximum_stop_fraction": 0.015,
    },
    "liquidity_sweep": {
        "decision_timeframe": "5m",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 20 * 60_000,
        "exit_model": "fixed take profit or volatility/structure stop",
        "minimum_stop_fraction": 0.005,
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.2,
        "maximum_stop_fraction": 0.010,
    },
    "selective_trend_pullback": {
        "decision_timeframe": "5m + 1h filter",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 30 * 60_000,
        "exit_model": "fixed take profit or volatility/structure stop",
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.2,
        "maximum_stop_fraction": 0.015,
    },
    "bollinger_reversion": {
        "decision_timeframe": "15m Bollinger(20, 2)",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 15 * 60_000,
        "exit_model": "fixed take profit or volatility/structure stop",
        "minimum_stop_fraction": 0.008,
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.8,
        "maximum_stop_fraction": 0.015,
        "minimum_reward_risk": 1.25,
    },
    "cross_sectional_momentum": {
        "decision_timeframe": "1h relative-strength rank",
        "decision_source": "1h",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 60 * 60_000,
        "exit_model": "relative-strength decay, fixed take profit or structure stop",
        "minimum_stop_fraction": 0.006,
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.5,
        "maximum_stop_fraction": 0.020,
        "minimum_reward_risk": 1.0,
    },
    "dynamic_pair_reversion": {
        "decision_timeframe": "1h BTC-relative spread",
        "decision_source": "1h",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 60 * 60_000,
        "exit_model": "spread mean reversion, fixed take profit or structure stop",
        "minimum_stop_fraction": 0.0075,
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.7,
        "maximum_stop_fraction": 0.025,
        "minimum_reward_risk": 0.8,
    },
    "funding_basis": {
        "decision_timeframe": "funding interval + 15m confirmation",
        "decision_source": "15m",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 60 * 60_000,
        "exit_model": "funding normalization, fixed take profit or structure stop",
        "minimum_stop_fraction": 0.006,
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.5,
        "maximum_stop_fraction": 0.020,
        "minimum_reward_risk": 1.0,
    },
    "btc_lead_lag": {
        "decision_timeframe": "5m BTC impulse + altcoin lag",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 30 * 60_000,
        "exit_model": "lag closure, fixed take profit or structure stop",
        "minimum_stop_fraction": 0.005,
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.3,
        "maximum_stop_fraction": 0.015,
        "minimum_reward_risk": 1.0,
    },
    "orderflow_open_interest": {
        "decision_timeframe": "15m price + taker flow + open interest",
        "decision_source": "15m",
        "take_profit_roe": 0.030,
        "respect_minimum_tp": False,
        "cooldown_ms": 30 * 60_000,
        "exit_model": "flow reversal, fixed take profit or structure stop",
        "minimum_stop_fraction": 0.005,
        "minimum_stop_roe": 0.015,
        "atr_stop_multiplier": 1.4,
        "maximum_stop_fraction": 0.018,
        "minimum_reward_risk": 1.0,
    },
}

ADAPTIVE_DEFAULTS = {
    name: {
        "atr_stop_multiplier": float(profile["atr_stop_multiplier"]),
        "cooldown_ms": int(profile["cooldown_ms"]),
    }
    for name, profile in STRATEGY_PROFILES.items()
}
CURRENT_RULE_VERSION = "R5"
CURRENT_STOP_RULE_VERSION = "R3-1.5roe-atr"


def stop_model_for(strategy: str) -> str:
    profile = STRATEGY_PROFILES[strategy]
    if "minimum_stop_roe" in profile:
        multiplier = profile["atr_stop_multiplier"]
        timeframe = (
            "1h"
            if profile.get("decision_source") == "1h"
            else "15m"
            if profile.get("decision_source") == "15m"
            or strategy == "bollinger_reversion"
            else "5m"
        )
        return (
            f"{timeframe} structure + max(1.5% ROE, "
            f"{multiplier:.1f} ATR) stop"
        )
    return "5m swing + 0.786 Fibonacci invalidation"


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


def bollinger_bands(
    values: Sequence[float],
    period: int = 20,
    deviations: float = 2.0,
) -> tuple[float, float, float]:
    window = [float(value) for value in values[-period:]]
    middle = statistics.fmean(window)
    width = statistics.pstdev(window) * deviations
    return middle - width, middle, middle + width


def closed_15m_candles(candles_5m: Sequence[Candle]) -> list[list[float]]:
    """Aggregate closed 5m candles into aligned, fully closed 15m candles."""
    grouped: dict[int, list[Candle]] = {}
    interval_ms = 900_000
    for candle in candles_5m:
        bucket = int(candle[0]) // interval_ms * interval_ms
        grouped.setdefault(bucket, []).append(candle)
    result = []
    for bucket in sorted(grouped):
        group = grouped[bucket]
        if len(group) != 3:
            continue
        result.append(
            [
                bucket,
                float(group[0][1]),
                max(float(candle[2]) for candle in group),
                min(float(candle[3]) for candle in group),
                float(group[-1][4]),
                sum(float(candle[5]) for candle in group),
            ]
        )
    return result


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


def market_features(c15: Sequence[Candle], c1h: Sequence[Candle], c4h: Sequence[Candle]) -> dict:
    # c15 is retained as the public parameter name for backward-compatible
    # state/tests, but production now supplies closed 5m candles here.
    close15 = [float(c[4]) for c in c15]
    ema9_15 = ema(close15, 9)
    ema21_15 = ema(close15, 21)
    ema55_15 = ema(close15, 55)
    current_atr = atr(c15)
    volumes = [float(c[5]) for c in c15]
    return {
        "close15": close15,
        "ema9_15": ema9_15,
        "ema21_15": ema21_15,
        "ema21_5m": ema21_15[-1],
        "ema21_5m_prior": ema21_15[-4],
        "ema55_5m": ema55_15[-1],
        "adx": adx(c15),
        "rsi": rsi(close15),
        "atr": current_atr,
        "volume_ratio": volumes[-1] / statistics.fmean(volumes[-21:-1]),
    }


def signal_observation(
    strategy: str,
    symbol: str,
    side: str,
    reason: str,
    candle_ts: int,
    c5: Sequence[Candle],
    c1h: Sequence[Candle],
    btc1h: Sequence[Candle],
) -> dict:
    features = market_features(c5, c1h, btc1h)
    current = float(c5[-1][4])
    coin_hour = [float(candle[4]) for candle in c1h]
    btc_hour = [float(candle[4]) for candle in btc1h]
    identity = "|".join(
        (CURRENT_RULE_VERSION, strategy, symbol, side, str(candle_ts))
    )
    return {
        "event": "signal_candidate",
        "observation_id": hashlib.sha256(identity.encode("utf-8")).hexdigest()[:24],
        "observed_at": int(time.time() * 1000),
        "signal_candle": candle_ts,
        "rule_version": CURRENT_RULE_VERSION,
        "strategy": strategy,
        "symbol": symbol,
        "side": side,
        "reason": reason,
        "features": {
            "price": current,
            "atr_fraction": features["atr"] / current,
            "adx_5m": features["adx"],
            "rsi_5m": features["rsi"],
            "volume_ratio_5m": features["volume_ratio"],
            "extension_atr_5m": abs(current - features["ema21_5m"])
            / features["atr"],
            "ema21_above_ema55": features["ema21_5m"]
            > features["ema55_5m"],
            "ema21_slope_up": features["ema21_5m"]
            > features["ema21_5m_prior"],
            "coin_return_6h_pct": 100 * (coin_hour[-1] / coin_hour[-7] - 1),
            "coin_return_24h_pct": 100
            * (coin_hour[-1] / coin_hour[-25] - 1),
            "btc_return_6h_pct": 100 * (btc_hour[-1] / btc_hour[-7] - 1),
            "btc_return_24h_pct": 100
            * (btc_hour[-1] / btc_hour[-25] - 1),
        },
    }


def regime(features: dict) -> tuple[bool, bool]:
    long_regime = (
        features["ema21_5m"] > features["ema55_5m"]
        and features["ema21_5m"] > features["ema21_5m_prior"]
    )
    short_regime = (
        features["ema21_5m"] < features["ema55_5m"]
        and features["ema21_5m"] < features["ema21_5m_prior"]
    )
    return long_regime, short_regime


def signal_for(
    strategy: str,
    c15: Sequence[Candle],
    c1h: Sequence[Candle],
    c4h: Sequence[Candle],
    context: dict | None = None,
) -> tuple[str, str, float] | None:
    if len(c15) < 80:
        return None
    f = market_features(c15, c1h, c4h)
    closes = f["close15"]
    current = closes[-1]
    current_open = float(c15[-1][1])
    prior_high = max(float(c[2]) for c in c15[-13:-1])
    prior_low = min(float(c[3]) for c in c15[-13:-1])

    if strategy == "trend_breakout":
        prior_high_5m = max(float(c[2]) for c in c15[-4:-1])
        prior_low_5m = min(float(c[3]) for c in c15[-4:-1])
        extension_5m = abs(current - f["ema21_5m"]) / f["atr"]
        responsive_long_regime = (
            f["ema21_5m"] > f["ema55_5m"]
            and f["ema21_5m"] > f["ema21_5m_prior"]
        )
        responsive_short_regime = (
            f["ema21_5m"] < f["ema55_5m"]
            and f["ema21_5m"] < f["ema21_5m_prior"]
        )
        if (
            responsive_long_regime
            and f["adx"] >= 18
            and f["volume_ratio"] >= 0.75
            and current > prior_high_5m
            and extension_5m <= 1.60
            and 52 <= f["rsi"] <= 76
        ):
            return "long", "5m three-bar momentum breakout", f["atr"] / current
        if (
            responsive_short_regime
            and f["adx"] >= 18
            and f["volume_ratio"] >= 0.75
            and current < prior_low_5m
            and extension_5m <= 1.60
            and 24 <= f["rsi"] <= 48
        ):
            return "short", "5m three-bar momentum breakdown", f["atr"] / current

    elif strategy == "pullback_reclaim":
        touched_long = any(
            float(c15[index][3]) <= f["ema21_15"][index]
            for index in range(len(c15) - 7, len(c15) - 1)
        )
        touched_short = any(
            float(c15[index][2]) >= f["ema21_15"][index]
            for index in range(len(c15) - 7, len(c15) - 1)
        )
        extension = abs(current - f["ema21_15"][-1]) / f["atr"]
        long_confirm = (
            current > f["ema9_15"][-1]
            and closes[-2] <= f["ema9_15"][-2]
            and current > current_open
        )
        short_confirm = (
            current < f["ema9_15"][-1]
            and closes[-2] >= f["ema9_15"][-2]
            and current < current_open
        )
        five_minute_long = f["ema21_5m"] > f["ema55_5m"]
        five_minute_short = f["ema21_5m"] < f["ema55_5m"]
        if (
            five_minute_long
            and f["ema21_5m"] > f["ema21_5m_prior"]
            and 12 <= f["adx"] <= 55
            and f["volume_ratio"] >= 0.50
            and touched_long
            and long_confirm
            and extension <= 0.90
            and 44 <= f["rsi"] <= 68
        ):
            return "long", "5m pullback + EMA9 reclaim", f["atr"] / current
        if (
            five_minute_short
            and f["ema21_5m"] < f["ema21_5m_prior"]
            and 12 <= f["adx"] <= 55
            and f["volume_ratio"] >= 0.50
            and touched_short
            and short_confirm
            and extension <= 0.90
            and 32 <= f["rsi"] <= 56
        ):
            return "short", "5m pullback + EMA9 rejection", f["atr"] / current

    elif strategy == "selective_trend_pullback":
        if len(c1h) < 220 or len(c4h) < 220:
            return None
        coin_1h = [float(c[4]) for c in c1h]
        btc_1h = [float(c[4]) for c in c4h]
        coin_ema21 = ema(coin_1h, 21)
        coin_ema50 = ema(coin_1h, 50)
        coin_ema200 = ema(coin_1h, 200)
        btc_ema50 = ema(btc_1h, 50)
        btc_ema200 = ema(btc_1h, 200)
        touched_long = any(
            float(c15[index][3]) <= f["ema21_15"][index]
            for index in range(len(c15) - 7, len(c15) - 1)
        )
        touched_short = any(
            float(c15[index][2]) >= f["ema21_15"][index]
            for index in range(len(c15) - 7, len(c15) - 1)
        )
        extension = abs(current - f["ema21_15"][-1]) / f["atr"]
        long_regime = (
            coin_ema21[-1] > coin_ema50[-1] > coin_ema200[-1]
            and btc_ema50[-1] > btc_ema200[-1]
            and f["ema21_5m"] > f["ema55_5m"]
            and f["ema21_5m"] > f["ema21_5m_prior"]
        )
        short_regime = (
            coin_ema21[-1] < coin_ema50[-1] < coin_ema200[-1]
            and btc_ema50[-1] < btc_ema200[-1]
            and f["ema21_5m"] < f["ema55_5m"]
            and f["ema21_5m"] < f["ema21_5m_prior"]
        )
        long_confirm = (
            current > f["ema9_15"][-1]
            and closes[-2] <= f["ema9_15"][-2]
            and current > current_open
        )
        short_confirm = (
            current < f["ema9_15"][-1]
            and closes[-2] >= f["ema9_15"][-2]
            and current < current_open
        )
        if (
            long_regime
            and 14 <= f["adx"] <= 45
            and f["volume_ratio"] >= 0.80
            and touched_long
            and long_confirm
            and extension <= 0.65
            and 48 <= f["rsi"] <= 64
        ):
            return "long", "1h trend + BTC alignment · selective 5m reclaim", f["atr"] / current
        if (
            short_regime
            and 14 <= f["adx"] <= 45
            and f["volume_ratio"] >= 0.80
            and touched_short
            and short_confirm
            and extension <= 0.65
            and 36 <= f["rsi"] <= 52
        ):
            return "short", "1h trend + BTC alignment · selective 5m rejection", f["atr"] / current

    elif strategy == "bollinger_reversion":
        candles_15m = closed_15m_candles(c15)
        if len(candles_15m) < 24:
            return None
        closes_15m = [float(candle[4]) for candle in candles_15m]
        lower, middle, upper = bollinger_bands(closes_15m[:-1])
        band_width_pct = 100 * (upper - lower) / max(middle, 1e-12)
        current_15m = closes_15m[-1]
        current_open_15m = float(candles_15m[-1][1])
        current_high_15m = float(candles_15m[-1][2])
        current_low_15m = float(candles_15m[-1][3])
        rsi_15m = rsi(closes_15m)
        atr_15m = atr(candles_15m)
        atr_fraction_15m = atr_15m / current_15m
        stop_requirement_is_safe = max(
            STRATEGY_PROFILES[strategy]["minimum_stop_fraction"],
            STRATEGY_PROFILES[strategy]["atr_stop_multiplier"] * atr_fraction_15m,
        ) <= STRATEGY_PROFILES[strategy]["maximum_stop_fraction"]
        ranging_market = (
            adx(candles_15m) <= 20
            and 1.0 <= band_width_pct <= 8.0
            and stop_requirement_is_safe
        )
        if (
            ranging_market
            and current_low_15m <= lower
            and current_15m > lower
            and current_15m > current_open_15m
            and current_15m < middle
            and rsi_15m <= 43
        ):
            return (
                "long",
                "15m low-ADX lower Bollinger rejection",
                atr_fraction_15m,
            )
        if (
            ranging_market
            and current_high_15m >= upper
            and current_15m < upper
            and current_15m < current_open_15m
            and current_15m > middle
            and rsi_15m >= 57
        ):
            return (
                "short",
                "15m low-ADX upper Bollinger rejection",
                atr_fraction_15m,
            )

    elif strategy == "liquidity_sweep":
        sweep_open, sweep_high, sweep_low, sweep_close = (
            float(c15[-2][1]),
            float(c15[-2][2]),
            float(c15[-2][3]),
            float(c15[-2][4]),
        )
        prior_high_before_sweep = max(float(c[2]) for c in c15[-14:-2])
        prior_low_before_sweep = min(float(c[3]) for c in c15[-14:-2])
        sweep_range = max(sweep_high - sweep_low, 1e-12)
        lower_wick = (min(sweep_open, sweep_close) - sweep_low) / sweep_range
        upper_wick = (sweep_high - max(sweep_open, sweep_close)) / sweep_range
        extension = abs(current - f["ema21_15"][-1]) / f["atr"]
        if (
            sweep_low < prior_low_before_sweep
            and sweep_close > prior_low_before_sweep
            and current > sweep_high
            and current > current_open
            and lower_wick >= 0.30
            and f["volume_ratio"] >= 0.75
            and extension >= 0.35
            and f["rsi"] <= 48
        ):
            return (
                "long",
                "sell-side sweep + next 5m candle confirmation",
                f["atr"] / current,
            )
        if (
            sweep_high > prior_high_before_sweep
            and sweep_close < prior_high_before_sweep
            and current < sweep_low
            and current < current_open
            and upper_wick >= 0.30
            and f["volume_ratio"] >= 0.75
            and extension >= 0.35
            and f["rsi"] >= 52
        ):
            return (
                "short",
                "buy-side sweep + next 5m candle confirmation",
                f["atr"] / current,
            )

    elif strategy == "cross_sectional_momentum":
        context = context or {}
        percentile = float(context.get("relative_strength_percentile") or 0.5)
        momentum = float(context.get("relative_momentum_score") or 0.0)
        if (
            context.get("cross_sectional_selected") is True
            and
            percentile >= 0.85
            and momentum >= 0.012
            and f["ema21_5m"] > f["ema55_5m"]
            and f["rsi"] <= 74
        ):
            return "long", "top-%15 göreceli momentum + yerel trend teyidi", f["atr"] / current
        if (
            context.get("cross_sectional_selected") is True
            and
            percentile <= 0.15
            and momentum <= -0.012
            and f["ema21_5m"] < f["ema55_5m"]
            and f["rsi"] >= 26
        ):
            return "short", "alt-%15 göreceli momentum + yerel trend teyidi", f["atr"] / current

    elif strategy == "dynamic_pair_reversion":
        context = context or {}
        spread_zscore = float(context.get("pair_spread_zscore") or 0.0)
        pair_correlation = float(context.get("pair_correlation") or 0.0)
        if (
            context.get("pair_reversion_selected") is True
            and pair_correlation >= 0.70
            and spread_zscore <= -2.0
            and f["rsi"] <= 48
        ):
            return "long", "BTC-relative spread -2σ altı · yakınsama beklentisi", f["atr"] / current
        if (
            context.get("pair_reversion_selected") is True
            and pair_correlation >= 0.70
            and spread_zscore >= 2.0
            and f["rsi"] >= 52
        ):
            return "short", "BTC-relative spread +2σ üstü · yakınsama beklentisi", f["atr"] / current

    elif strategy == "funding_basis":
        context = context or {}
        funding = context.get("funding_rate")
        basis_pct = context.get("basis_pct")
        if funding is None or basis_pct is None:
            return None
        funding = float(funding)
        basis_pct = float(basis_pct)
        if (
            context.get("funding_basis_selected") is True
            and funding >= 0.0003
            and basis_pct >= 0.03
            and current < current_open
        ):
            return "short", "yüksek pozitif funding + pozitif perpetual basis", f["atr"] / current
        if (
            context.get("funding_basis_selected") is True
            and funding <= -0.0003
            and basis_pct <= -0.03
            and current > current_open
        ):
            return "long", "yüksek negatif funding + negatif perpetual basis", f["atr"] / current

    elif strategy == "btc_lead_lag":
        context = context or {}
        btc_return = float(context.get("btc_return_5m_pct") or 0.0)
        lag_gap = float(context.get("btc_coin_lag_gap_pct") or 0.0)
        correlation = float(context.get("pair_correlation") or 0.0)
        if (
            context.get("btc_lead_lag_selected") is True
            and correlation >= 0.55
            and btc_return >= 0.35
            and lag_gap >= 0.20
        ):
            return "long", "BTC yukarı impulsu · altcoin henüz fiyatlamadı", f["atr"] / current
        if (
            context.get("btc_lead_lag_selected") is True
            and correlation >= 0.55
            and btc_return <= -0.35
            and lag_gap <= -0.20
        ):
            return "short", "BTC aşağı impulsu · altcoin henüz fiyatlamadı", f["atr"] / current

    elif strategy == "orderflow_open_interest":
        context = context or {}
        oi_change = context.get("open_interest_change_pct_1h")
        taker_ratio = context.get("taker_buy_sell_ratio_1h")
        if oi_change is None or taker_ratio is None:
            return None
        oi_change = float(oi_change)
        taker_ratio = float(taker_ratio)
        if (
            context.get("orderflow_selected") is True
            and
            oi_change >= 0.8
            and taker_ratio >= 1.25
            and f["ema21_5m"] > f["ema55_5m"]
            and f["volume_ratio"] >= 0.75
        ):
            return "long", "artan açık pozisyon + agresif alıcı akışı", f["atr"] / current
        if (
            context.get("orderflow_selected") is True
            and
            oi_change >= 0.8
            and taker_ratio <= 0.80
            and f["ema21_5m"] < f["ema55_5m"]
            and f["volume_ratio"] >= 0.75
        ):
            return "short", "artan açık pozisyon + agresif satıcı akışı", f["atr"] / current
    return None


def demo_signal_for(
    strategy: str, c15: Sequence[Candle], c1h: Sequence[Candle], c4h: Sequence[Candle]
) -> tuple[str, str, float]:
    """Choose a transparent direction for a forced, short-lived display demo."""
    f = market_features(c15, c1h, c4h)
    current = f["close15"][-1]
    atr_fraction = f["atr"] / current
    if strategy == "trend_breakout":
        side = "long" if f["ema21_5m"] >= f["ema55_5m"] else "short"
        return side, "5 dk demo · 5m momentum yönü", atr_fraction
    if strategy == "pullback_reclaim":
        side = "long" if current >= f["ema21_15"][-1] else "short"
        return side, "5 dk demo · EMA21 konumu", atr_fraction
    if strategy == "selective_trend_pullback":
        side = "long" if current >= f["ema55_5m"] else "short"
        return side, "5 dk demo · seçici trend geri çekilmesi", atr_fraction
    if strategy == "bollinger_reversion":
        candles_15m = closed_15m_candles(c15)
        closes_15m = [float(candle[4]) for candle in candles_15m]
        lower, _, upper = bollinger_bands(closes_15m)
        current_15m = closes_15m[-1]
        side = "long" if abs(current_15m - lower) <= abs(current_15m - upper) else "short"
        return side, "demo · en yakın 15m Bollinger dış bandı", atr(candles_15m) / current_15m
    if strategy in {
        "cross_sectional_momentum",
        "dynamic_pair_reversion",
        "funding_basis",
        "btc_lead_lag",
        "orderflow_open_interest",
    }:
        side = "long" if current >= f["ema21_15"][-1] else "short"
        return side, "5 dk demo · yeni strateji veri hattı", atr_fraction

    current_open = float(c15[-1][1])
    candle_high, candle_low = float(c15[-1][2]), float(c15[-1][3])
    lower_wick = min(current_open, current) - candle_low
    upper_wick = candle_high - max(current_open, current)
    side = "long" if lower_wick >= upper_wick else "short"
    return side, "5 dk demo · son mum fitil dengesi", atr_fraction


def fibonacci_structure_stop(
    candles: Sequence[Candle],
    entry: float,
    side: str,
    lookback: int = 24,
    retracement: float = 0.786,
) -> tuple[float, float, float]:
    """Return a fixed 5m swing/Fibonacci invalidation stop and its anchors."""
    window = list(candles[-max(3, lookback) :])
    buffer = atr(candles) * 0.10
    if side == "long":
        low_index = min(range(len(window)), key=lambda index: float(window[index][3]))
        swing_low = float(window[low_index][3])
        swing_high = max(float(candle[2]) for candle in window[low_index:])
        fib_level = swing_high - retracement * (swing_high - swing_low)
        stop = fib_level - buffer
        if stop >= entry:
            stop = swing_low - buffer
        stop = min(stop, entry - max(buffer, entry * 0.001))
        return max(stop, entry * 0.50), swing_low, swing_high

    high_index = max(range(len(window)), key=lambda index: float(window[index][2]))
    swing_high = float(window[high_index][2])
    swing_low = min(float(candle[3]) for candle in window[high_index:])
    fib_level = swing_low + retracement * (swing_high - swing_low)
    stop = fib_level + buffer
    if stop <= entry:
        stop = swing_high + buffer
    stop = max(stop, entry + max(buffer, entry * 0.001))
    return min(stop, entry * 1.50), swing_low, swing_high


def brackets(
    strategy: str,
    entry: float,
    side: str,
    atr_fraction: float,
    leverage: int,
    minimum_tp_roe: float,
    candles: Sequence[Candle] | None = None,
):
    profile = STRATEGY_PROFILES[strategy]
    decision_candles = (
        closed_15m_candles(candles)
        if strategy == "bollinger_reversion" and candles
        else candles
    )
    if decision_candles:
        stop, _, _ = fibonacci_structure_stop(decision_candles, entry, side)
    else:
        # Compatibility fallback for callers that have not supplied candles.
        stop_fraction = max(atr_fraction, 0.004)
        stop = entry * (1 - stop_fraction if side == "long" else 1 + stop_fraction)
    if (
        "minimum_stop_fraction" in profile
        or "minimum_stop_roe" in profile
    ):
        structure_fraction = abs(stop / entry - 1)
        minimum_stop_fraction = max(
            float(profile.get("minimum_stop_fraction") or 0),
            float(profile.get("minimum_stop_roe") or 0) / leverage,
        )
        stop_fraction = max(
            structure_fraction,
            minimum_stop_fraction,
            profile["atr_stop_multiplier"] * atr_fraction,
        )
        stop = entry * (
            1 - stop_fraction if side == "long" else 1 + stop_fraction
        )
    target_roe = (
        max(minimum_tp_roe, profile["take_profit_roe"])
        if profile.get("respect_minimum_tp", True)
        else profile["take_profit_roe"]
    )
    if profile.get("dynamic_take") and decision_candles:
        lower, middle, upper = bollinger_bands(
            [float(candle[4]) for candle in decision_candles]
        )
        if side == "long" and middle > entry:
            return stop, middle
        if side == "short" and middle < entry:
            return stop, middle
        fallback = upper if side == "long" else lower
        if (side == "long" and fallback > entry) or (
            side == "short" and fallback < entry
        ):
            return stop, fallback
        fallback_fraction = max(atr_fraction, 0.005)
        return (
            stop,
            entry
            * (1 + fallback_fraction if side == "long" else 1 - fallback_fraction),
        )
    target_fraction = target_roe / leverage
    if side == "long":
        return stop, entry * (1 + target_fraction)
    return stop, entry * (1 - target_fraction)


def context_exit_reason(
    strategy: str,
    position: dict,
    context: dict | None,
) -> str | None:
    """Exit research strategies when the measured edge has disappeared."""
    if not context:
        return None
    side = position.get("side")
    if strategy == "cross_sectional_momentum":
        percentile = context.get("relative_strength_percentile")
        if percentile is not None and (
            (side == "long" and float(percentile) < 0.55)
            or (side == "short" and float(percentile) > 0.45)
        ):
            return "relative_strength_decay"
    elif strategy == "dynamic_pair_reversion":
        zscore = context.get("pair_spread_zscore")
        if zscore is not None and abs(float(zscore)) <= 0.35:
            return "spread_mean_reversion"
    elif strategy == "funding_basis":
        funding = context.get("funding_rate")
        basis = context.get("basis_pct")
        if funding is not None and basis is not None and (
            (side == "short" and (float(funding) <= 0.00005 or float(basis) <= 0))
            or (side == "long" and (float(funding) >= -0.00005 or float(basis) >= 0))
        ):
            return "funding_basis_normalized"
    elif strategy == "btc_lead_lag":
        gap = context.get("btc_coin_lag_gap_pct")
        if gap is not None and (
            (side == "long" and float(gap) <= 0.03)
            or (side == "short" and float(gap) >= -0.03)
        ):
            return "lead_lag_gap_closed"
    elif strategy == "orderflow_open_interest":
        ratio = context.get("taker_buy_sell_ratio_1h")
        if ratio is not None and (
            (side == "long" and float(ratio) < 0.90)
            or (side == "short" and float(ratio) > 1.10)
        ):
            return "orderflow_reversal"
    return None


class PaperTournament:
    def __init__(
        self,
        state_path: str,
        initial_usdt: float = 1000.0,
        duration_hours: int = 48,
        leverage: int = 2,
        wallet_fraction: float = 0.20,
        take_profit_roe: float = 0.055,
        taker_fee: float = 0.0005,
        demo_seconds: int = 0,
        database_url: str = "",
        remote_state_url: str = "",
        remote_state_token: str = "",
        state_key: str = "top50-three-strategy-v1",
        state_store=None,
        autosave: bool = True,
        max_daily_loss_pct: float = 2.0,
        max_drawdown_pct: float = 5.0,
        max_consecutive_losses: int = 3,
        profit_hold_threshold_usdt: float = PROFIT_HOLD_THRESHOLD_USDT,
        profit_lock_floor_usdt: float = PROFIT_LOCK_FLOOR_USDT,
        profit_hold_seconds: int = PROFIT_HOLD_SECONDS,
    ) -> None:
        self.path = Path(state_path)
        self.initial_usdt = initial_usdt
        self.duration_ms = duration_hours * 3_600_000
        self.leverage = leverage
        self.wallet_fraction = wallet_fraction
        self.take_profit_roe = take_profit_roe
        self.taker_fee = taker_fee
        self.demo_seconds = max(0, int(demo_seconds))
        self.autosave = autosave
        self.max_daily_loss_pct = max_daily_loss_pct
        self.max_drawdown_limit_pct = max_drawdown_pct
        self.max_consecutive_losses = max_consecutive_losses
        self.profit_hold_threshold_usdt = float(profit_hold_threshold_usdt)
        self.profit_lock_floor_usdt = float(profit_lock_floor_usdt)
        self.profit_hold_ms = max(1, int(profit_hold_seconds)) * 1000
        if self.profit_lock_floor_usdt >= self.profit_hold_threshold_usdt:
            raise ValueError("Profit-lock floor must stay below its hold threshold")
        self.last_entry_rejection: str | None = None
        self.store = state_store or (
            PostgresStateStore(database_url, state_key)
            if database_url
            else (
                HttpStateStore(remote_state_url, remote_state_token)
                if remote_state_url and remote_state_token
                else JsonStateStore(state_path)
            )
        )
        self.last_summary_candle: int | None = None
        self.state = self._load_or_create()

    def _new_strategy(self, name: str) -> dict:
        now = int(time.time() * 1000)
        return {
            "balance": self.initial_usdt,
            "peak_equity": self.initial_usdt,
            "max_drawdown_pct": 0.0,
            "wins": 0,
            "losses": 0,
            "gross_profit": 0.0,
            "gross_loss": 0.0,
            "position": None,
            "last_signal_candles": {},
            "next_entry_at": 0,
            "risk_day": self._utc_day(now),
            "day_start_balance": self.initial_usdt,
            "consecutive_losses": 0,
            "risk_pause_until": 0,
            "risk_halted_reason": None,
            "trades": [],
            "adaptation": {
                "generation": 0,
                "last_evaluated_trade_count": 0,
                "parameters": dict(ADAPTIVE_DEFAULTS[name]),
                "diagnosis": "İlk değerlendirme için işlem verisi birikiyor.",
                "last_change": None,
                "history": [],
            },
        }

    @staticmethod
    def _utc_day(timestamp_ms: int) -> str:
        return time.strftime("%Y-%m-%d", time.gmtime(timestamp_ms / 1000))

    def _upgrade_state(self, loaded: dict) -> dict | None:
        version = loaded.get("version")
        if version not in {4, 5, 6, 7, 8, 9, 10, STATE_VERSION}:
            return None
        strategies = loaded.get("strategies")
        if not isinstance(strategies, dict):
            return None
        previous_initial_usdt = float(loaded.get("initial_usdt") or self.initial_usdt)
        capital_increase = max(0.0, self.initial_usdt - previous_initial_usdt)
        for strategy in strategies.values():
            if capital_increase:
                strategy["balance"] = float(strategy.get("balance") or 0.0) + capital_increase
                strategy["peak_equity"] = (
                    float(strategy.get("peak_equity") or previous_initial_usdt)
                    + capital_increase
                )
                strategy["day_start_balance"] = (
                    float(strategy.get("day_start_balance") or previous_initial_usdt)
                    + capital_increase
                )
            strategy.setdefault("risk_day", self._utc_day(int(time.time() * 1000)))
            strategy.setdefault("day_start_balance", strategy.get("balance", self.initial_usdt))
            strategy.setdefault("consecutive_losses", 0)
            strategy.setdefault("risk_pause_until", 0)
            strategy.setdefault("risk_halted_reason", None)
        for name in STRATEGIES:
            strategies.setdefault(name, self._new_strategy(name))
            strategy = strategies[name]
            strategy.pop("reward_points", None)
            strategy.setdefault(
                "adaptation",
                {
                    "generation": 0,
                    "last_evaluated_trade_count": 0,
                    "parameters": dict(ADAPTIVE_DEFAULTS[name]),
                    "diagnosis": "İlk değerlendirme için işlem verisi birikiyor.",
                    "last_change": None,
                    "history": [],
                },
            )
            adaptation = strategy["adaptation"]
            adaptation.setdefault("generation", 0)
            adaptation.setdefault("last_evaluated_trade_count", 0)
            adaptation.setdefault("diagnosis", "İşlem verisi değerlendiriliyor.")
            adaptation.setdefault("last_change", None)
            adaptation.setdefault("history", [])
            parameters = adaptation.setdefault(
                "parameters", dict(ADAPTIVE_DEFAULTS[name])
            )
            for parameter, default in ADAPTIVE_DEFAULTS[name].items():
                parameters.setdefault(parameter, default)
        if int(version) < 8:
            for name in STRATEGIES:
                strategy = strategies[name]
                balance = float(strategy.get("balance") or self.initial_usdt)
                strategy["peak_equity"] = balance
                strategy["day_start_balance"] = balance
                strategy["consecutive_losses"] = 0
                strategy["risk_pause_until"] = 0
                strategy["risk_halted_reason"] = None
        loaded["initial_usdt"] = max(previous_initial_usdt, self.initial_usdt)
        # Paper tracking is continuous. Preserve the historical ends_at value
        # for old records, but it no longer finalizes accounts or blocks entries.
        loaded["continuous"] = True
        loaded["finalized_at"] = None
        loaded.pop("competition", None)
        loaded["version"] = STATE_VERSION
        self._apply_adaptive_parameters(loaded)
        return loaded

    def _load_or_create(self) -> dict:
        try:
            loaded = self.store.load()
            if loaded:
                upgraded = self._upgrade_state(loaded)
                if upgraded:
                    return upgraded
        except Exception:
            if not isinstance(self.store, JsonStateStore):
                raise
        now = int(time.time() * 1000)
        created = {
            "version": STATE_VERSION,
            "started_at": now,
            "ends_at": now + self.duration_ms,
            "finalized_at": None,
            "continuous": True,
            "initial_usdt": self.initial_usdt,
            "strategies": {name: self._new_strategy(name) for name in STRATEGIES},
        }
        self._apply_adaptive_parameters(created)
        return created

    def _apply_adaptive_parameters(self, state: dict) -> None:
        for name in STRATEGIES:
            adaptation = (
                state.get("strategies", {}).get(name, {}).get("adaptation", {})
            )
            parameters = adaptation.get("parameters", {})
            for parameter, default in ADAPTIVE_DEFAULTS[name].items():
                value = int(default) if parameter == "cooldown_ms" else float(default)
                parameters[parameter] = value
                STRATEGY_PROFILES[name][parameter] = value
            adaptation["frozen"] = True
            adaptation["diagnosis"] = (
                "Kural sabit; küçük örneklemle otomatik parametre değişimi kapalı."
            )

    def _save(self) -> None:
        self.store.save(self.state)

    def save(self) -> None:
        self._save()

    def _refresh_risk_day(self, strategy: dict, now: int) -> None:
        current_day = self._utc_day(now)
        if strategy.get("risk_day") == current_day:
            return
        strategy["risk_day"] = current_day
        strategy["day_start_balance"] = strategy["balance"]
        strategy["risk_pause_until"] = 0
        if str(strategy.get("risk_halted_reason") or "").startswith("daily_loss"):
            strategy["risk_halted_reason"] = None

    def _risk_reason(self, strategy: dict, now: int) -> str | None:
        self._refresh_risk_day(strategy, now)
        # This is an observation-first paper tournament: strategies keep
        # trading so their good and bad decisions remain measurable. Stops,
        # cooldowns and the one-position limit still apply.
        strategy["risk_halted_reason"] = None
        strategy["risk_pause_until"] = 0
        return None

    def _mark_price(self, side: str, ticker: dict) -> float:
        fallback = float(ticker.get("last") or ticker.get("close"))
        return float(ticker.get("bid") or fallback) if side == "long" else float(ticker.get("ask") or fallback)

    def _entry_price(self, side: str, ticker: dict) -> float:
        fallback = float(ticker.get("last") or ticker.get("close"))
        return float(ticker.get("ask") or fallback) if side == "long" else float(ticker.get("bid") or fallback)

    def _unrealized(self, position: dict | None, ticker: dict) -> float:
        if not position:
            return 0.0
        mark = self._mark_price(position["side"], ticker)
        raw = (
            (mark - position["entry"]) * position["quantity"]
            if position["side"] == "long"
            else (position["entry"] - mark) * position["quantity"]
        )
        return raw - mark * position["quantity"] * self.taker_fee

    def _net_position_pnl(self, position: dict, ticker: dict) -> float:
        """Return executable PnL after entry and estimated exit fees."""
        return self._unrealized(position, ticker) - float(position["entry_fee"])

    def _profit_protection_reason(
        self, position: dict, ticker: dict, now: int
    ) -> str | None:
        """Hold 15 USDT for ten continuous minutes or protect it at 10 USDT."""
        net_pnl = self._net_position_pnl(position, ticker)
        armed_at = position.get("profit_lock_armed_at")
        hold_started_at = position.get("profit_hold_started_at")

        if net_pnl >= self.profit_hold_threshold_usdt:
            if armed_at is None:
                position["profit_lock_armed_at"] = now
            if hold_started_at is None:
                position["profit_hold_started_at"] = now
                hold_started_at = now
            if now - int(hold_started_at) >= self.profit_hold_ms:
                return "profit_hold_10m"
            return None

        # The ten-minute clock is continuous. A dip below 15 USDT resets it.
        position["profit_hold_started_at"] = None
        if armed_at is not None and net_pnl < self.profit_lock_floor_usdt:
            return "profit_lock_floor"
        return None

    def _equity(self, strategy: dict, ticker: dict) -> float:
        return strategy["balance"] + self._unrealized(strategy["position"], ticker)

    def _open(
        self,
        name: str,
        strategy: dict,
        found: tuple,
        ticker: dict,
        candle_ts: int,
        context: dict | None,
        candles: Sequence[Candle],
        *,
        symbol: str = "AVAX/USDT:USDT",
        observation_id: str | None = None,
        demo: bool = False,
        demo_close_at: int | None = None,
    ) -> dict | None:
        self.last_entry_rejection = None
        side, reason, atr_fraction = found
        entry = self._entry_price(side, ticker)
        initial_margin = strategy["balance"] * self.wallet_fraction
        notional = initial_margin * self.leverage
        quantity = notional / entry
        entry_fee = notional * self.taker_fee
        stop, take = brackets(
            name,
            entry,
            side,
            atr_fraction,
            self.leverage,
            self.take_profit_roe,
            candles,
        )
        profile = STRATEGY_PROFILES[name]
        if "maximum_stop_fraction" in profile and (
            abs(stop / entry - 1) > profile["maximum_stop_fraction"]
        ):
            self.last_entry_rejection = "stop_above_strategy_maximum"
            return None
        risk_distance = abs(entry - stop)
        reward_distance = abs(take - entry)
        minimum_reward_risk = profile.get("minimum_reward_risk")
        if not demo and minimum_reward_risk is not None and (
            risk_distance <= 0
            or reward_distance / risk_distance < minimum_reward_risk
        ):
            self.last_entry_rejection = "reward_risk_below_minimum"
            return None
        decision_candles = (
            closed_15m_candles(candles)
            if name == "bollinger_reversion"
            else candles
        )
        _, swing_low, swing_high = fibonacci_structure_stop(
            decision_candles, entry, side
        )
        effective_take_profit_roe = (
            abs(take / entry - 1) * self.leverage
            if profile.get("dynamic_take")
            else (
                max(self.take_profit_roe, profile["take_profit_roe"])
                if profile.get("respect_minimum_tp", True)
                else profile["take_profit_roe"]
            )
        )
        strategy["balance"] -= entry_fee
        strategy["position"] = {
            "side": side,
            "symbol": symbol,
            "entry": entry,
            "quantity": quantity,
            "initial_margin": initial_margin,
            "entry_fee": entry_fee,
            "stop": stop,
            "stop_model": stop_model_for(name),
            "stop_rule_version": CURRENT_STOP_RULE_VERSION,
            "stop_swing_low": swing_low,
            "stop_swing_high": swing_high,
            "take": take,
            "opened_at": int(time.time() * 1000),
            "signal_candle": candle_ts,
            "reason": reason,
            "context": context,
            "demo": demo,
            "demo_close_at": demo_close_at,
            "decision_timeframe": profile["decision_timeframe"],
            "take_profit_roe": effective_take_profit_roe,
            "exit_model": profile["exit_model"],
            "rule_version": CURRENT_RULE_VERSION,
            "observation_id": observation_id,
            "profit_lock_armed_at": None,
            "profit_hold_started_at": None,
        }
        return {"event": "open", "strategy": name, **strategy["position"]}

    def _maybe_adapt(self, name: str, strategy: dict) -> dict | None:
        adaptation = strategy["adaptation"]
        # Five trades is far too little evidence for live parameter tuning and
        # was changing the exact rules being compared. Keep the audit history,
        # but freeze all production parameters until an out-of-sample review.
        adaptation["frozen"] = True
        adaptation["diagnosis"] = (
            "Kural sabit; küçük örneklemle otomatik parametre değişimi kapalı."
        )
        return None

    def _close(self, name: str, strategy: dict, ticker: dict, reason: str) -> dict:
        position = strategy["position"]
        exit_price = self._mark_price(position["side"], ticker)
        gross_pnl = (
            (exit_price - position["entry"]) * position["quantity"]
            if position["side"] == "long"
            else (position["entry"] - exit_price) * position["quantity"]
        )
        exit_fee = exit_price * position["quantity"] * self.taker_fee
        net_pnl_after_entry = gross_pnl - exit_fee - position["entry_fee"]
        strategy["balance"] += gross_pnl - exit_fee
        roi_pct = 100 * net_pnl_after_entry / position["initial_margin"]
        wallet_return = net_pnl_after_entry
        if wallet_return > 0:
            strategy["wins"] += 1
            strategy["gross_profit"] += wallet_return
            strategy["consecutive_losses"] = 0
        else:
            strategy["losses"] += 1
            strategy["gross_loss"] += abs(wallet_return)
            strategy["consecutive_losses"] = int(strategy.get("consecutive_losses") or 0) + 1
        trade = {
            **position,
            "exit": exit_price,
            "exit_fee": exit_fee,
            "net_pnl": net_pnl_after_entry,
            "roi_pct": roi_pct,
            "closed_at": int(time.time() * 1000),
            "exit_reason": reason,
        }
        strategy["trades"].append(trade)
        strategy["position"] = None
        strategy["next_entry_at"] = trade["closed_at"] + STRATEGY_PROFILES[name]["cooldown_ms"]
        adaptation = self._maybe_adapt(name, strategy)
        return {
            "event": "close",
            "strategy": name,
            **trade,
            "adaptation": adaptation,
        }

    def _position_ticker(self, position: dict | None, tickers: dict) -> dict:
        if not position:
            return tickers if "last" in tickers or "close" in tickers else {}
        if "last" in tickers or "close" in tickers:
            return tickers
        ticker = tickers.get(position.get("symbol"))
        if ticker:
            return ticker
        entry = float(position["entry"])
        return {"bid": entry, "ask": entry, "last": entry}

    def manage_open_positions(self, tickers: dict[str, dict]) -> list[dict]:
        """Apply protective exits without waiting for the market scan.

        The caller supplies the latest executable bid/ask for each active
        symbol. No entry decisions are made here, so this method can safely
        run at market-data cadence independently of the 30-second scanner.
        """
        now = int(time.time() * 1000)
        experiment_over = (
            not self.state.get("continuous", True)
            and now >= self.state["ends_at"]
        )
        events: list[dict] = []
        for name, strategy in self.state["strategies"].items():
            position = strategy.get("position")
            if not position:
                continue
            symbol = position.get("symbol", "AVAX/USDT:USDT")
            ticker = tickers.get(symbol)
            if not ticker:
                continue
            if position.get("demo"):
                demo_finished = now >= int(position["demo_close_at"])
                should_close = experiment_over or demo_finished
                reason = "experiment_end" if experiment_over else "5m_demo_end"
            else:
                mark = self._mark_price(position["side"], ticker)
                stop_hit = (
                    mark <= position["stop"]
                    if position["side"] == "long"
                    else mark >= position["stop"]
                )
                take_hit = (
                    mark >= position["take"]
                    if position["side"] == "long"
                    else mark <= position["take"]
                )
                profit_exit = self._profit_protection_reason(position, ticker, now)
                should_close = (
                    experiment_over or stop_hit or take_hit or bool(profit_exit)
                )
                reason = (
                    "experiment_end"
                    if experiment_over
                    else "stop"
                    if stop_hit
                    else "take"
                    if take_hit
                    else profit_exit
                )
            if should_close:
                events.append(self._close(name, strategy, ticker, reason))
        if events and self.autosave:
            self._save()
        return events

    def summary(self, tickers: dict) -> dict:
        rows = {}
        for name, strategy in self.state["strategies"].items():
            position = strategy["position"]
            profile = STRATEGY_PROFILES[name]
            ticker = self._position_ticker(position, tickers)
            equity = self._equity(strategy, ticker)
            position_roi = None
            position_pnl = None
            if position:
                position_pnl = self._net_position_pnl(position, ticker)
                position_roi = 100 * position_pnl / position["initial_margin"]
            trades = strategy["wins"] + strategy["losses"]
            mark_price = self._mark_price(position["side"], ticker) if position else None
            rows[name] = {
                "equity_usdt": round(equity, 4),
                "wallet_roi_pct": round(100 * (equity / self.initial_usdt - 1), 4),
                "realized_balance_usdt": round(strategy["balance"], 4),
                "position": position["side"] if position else None,
                "symbol": position.get("symbol") if position else None,
                "position_roi_pct": round(position_roi, 4) if position_roi is not None else None,
                "position_pnl_usdt": round(position_pnl, 4) if position_pnl is not None else None,
                "entry": round(position["entry"], 6) if position else None,
                "mark_price": round(mark_price, 6) if mark_price is not None else None,
                "stop": round(position["stop"], 6) if position else None,
                "take": round(position["take"], 6) if position else None,
                "opened_at": position["opened_at"] if position else None,
                "reason": position["reason"] if position else None,
                "profit_lock_armed": bool(
                    position and position.get("profit_lock_armed_at") is not None
                ),
                "profit_hold_started_at": (
                    position.get("profit_hold_started_at") if position else None
                ),
                "profit_hold_threshold_usdt": self.profit_hold_threshold_usdt,
                "profit_lock_floor_usdt": self.profit_lock_floor_usdt,
                "profit_hold_seconds": self.profit_hold_ms // 1000,
                "rule_version": (
                    position.get("rule_version", "ESKİ") if position else None
                ),
                "decision_timeframe": profile["decision_timeframe"],
                "take_profit_roe_pct": (
                    round(100 * position["take_profit_roe"], 2)
                    if position and profile.get("dynamic_take")
                    else (
                        None
                        if profile.get("dynamic_take")
                        else round(
                            100
                            * (
                                max(self.take_profit_roe, profile["take_profit_roe"])
                                if profile.get("respect_minimum_tp", True)
                                else profile["take_profit_roe"]
                            ),
                            2,
                        )
                    )
                ),
                "exit_model": profile["exit_model"],
                "trades": trades,
                "wins": strategy["wins"],
                "win_rate_pct": round(100 * strategy["wins"] / trades, 2) if trades else 0.0,
                "max_drawdown_pct": round(strategy["max_drawdown_pct"], 4),
                "risk_status": {
                    "halted": bool(strategy.get("risk_halted_reason"))
                    or int(time.time() * 1000) < int(strategy.get("risk_pause_until") or 0),
                    "reason": strategy.get("risk_halted_reason")
                    or (
                        "consecutive_loss_pause"
                        if int(time.time() * 1000) < int(strategy.get("risk_pause_until") or 0)
                        else None
                    ),
                    "consecutive_losses": int(strategy.get("consecutive_losses") or 0),
                    "pause_until": int(strategy.get("risk_pause_until") or 0),
                },
                "profit_factor": (
                    round(strategy["gross_profit"] / strategy["gross_loss"], 3)
                    if strategy["gross_loss"]
                    else None
                ),
                "adaptation": {
                    "frozen": True,
                    "generation": int(
                        strategy.get("adaptation", {}).get("generation") or 0
                    ),
                    "diagnosis": strategy.get("adaptation", {}).get("diagnosis"),
                    "last_change": strategy.get("adaptation", {}).get(
                        "last_change"
                    ),
                    "parameters": strategy.get("adaptation", {}).get(
                        "parameters", {}
                    ),
                    "next_review_after_trades": 0,
                },
                "recent_trades": strategy["trades"][-20:],
            }
        return {
            "started_at": self.state["started_at"],
            "ends_at": self.state["ends_at"],
            "finalized_at": self.state["finalized_at"],
            "continuous": bool(self.state.get("continuous", True)),
            "strategies": rows,
        }

    def cycle(
        self,
        c15: Sequence[Candle],
        c1h: Sequence[Candle],
        c4h: Sequence[Candle],
        ticker: dict,
        context: dict | None,
        *,
        symbol: str = "AVAX/USDT:USDT",
        allow_entries: bool = True,
    ) -> tuple[list[dict], dict | None]:
        now = int(time.time() * 1000)
        if self.state.get("continuous", True):
            self.state["finalized_at"] = None
        candle_ts = int(c15[-1][0])
        events = []
        experiment_over = (
            not self.state.get("continuous", True)
            and now >= self.state["ends_at"]
        )
        demo_started_this_cycle = False
        if self.demo_seconds and not self.state.get("demo_started_at"):
            self.state["demo_started_at"] = now
            self.state["demo_close_at"] = now + self.demo_seconds * 1000
            demo_started_this_cycle = True

        for name, strategy in self.state["strategies"].items():
            profile = STRATEGY_PROFILES[name]
            strategy_candles = (
                closed_15m_candles(c15)
                if name == "bollinger_reversion"
                or profile.get("decision_source") == "15m"
                else c1h
                if profile.get("decision_source") == "1h"
                else c15
            )
            decision_candle = int(strategy_candles[-1][0])
            position = strategy["position"]
            closed_this_cycle = False
            if position and position.get("symbol", "AVAX/USDT:USDT") == symbol:
                if position.get("demo"):
                    demo_finished = now >= int(position["demo_close_at"])
                    should_close = experiment_over or demo_finished
                    reason = "experiment_end" if experiment_over else "5m_demo_end"
                else:
                    expected_stop_model = stop_model_for(name)
                    if (
                        position.get("stop_model") != expected_stop_model
                        or (
                            (
                                "minimum_stop_fraction" in profile
                                or "minimum_stop_roe" in profile
                            )
                            and position.get("stop_rule_version")
                            != CURRENT_STOP_RULE_VERSION
                        )
                    ):
                        structure_stop, swing_low, swing_high = fibonacci_structure_stop(
                            strategy_candles,
                            float(position["entry"]),
                            position["side"],
                        )
                        if (
                            "minimum_stop_fraction" in profile
                            or "minimum_stop_roe" in profile
                        ):
                            entry = float(position["entry"])
                            atr_fraction = atr(strategy_candles) / entry
                            minimum_stop_fraction = max(
                                float(
                                    profile.get("minimum_stop_fraction") or 0
                                ),
                                float(profile.get("minimum_stop_roe") or 0)
                                / self.leverage,
                            )
                            stop_fraction = max(
                                abs(structure_stop / entry - 1),
                                minimum_stop_fraction,
                                profile["atr_stop_multiplier"] * atr_fraction,
                            )
                            stop_fraction = min(
                                stop_fraction,
                                profile["maximum_stop_fraction"],
                            )
                            protected_stop = entry * (
                                1 - stop_fraction
                                if position["side"] == "long"
                                else 1 + stop_fraction
                            )
                            # The R2 migration enforces both sides of the
                            # envelope: old noise-tight stops are widened to
                            # the ATR floor and legacy oversized stops are
                            # pulled back to the strategy's hard maximum.
                            position["stop"] = protected_stop
                            position["stop_rule_version"] = (
                                CURRENT_STOP_RULE_VERSION
                            )
                        else:
                            position["stop"] = structure_stop
                        position["stop_model"] = expected_stop_model
                        position["stop_swing_low"] = swing_low
                        position["stop_swing_high"] = swing_high
                    if not profile.get("dynamic_take"):
                        expected_take_roe = (
                            max(self.take_profit_roe, profile["take_profit_roe"])
                            if profile.get("respect_minimum_tp", True)
                            else profile["take_profit_roe"]
                        )
                        if abs(
                            float(position.get("take_profit_roe") or 0)
                            - expected_take_roe
                        ) > 1e-12:
                            target_fraction = expected_take_roe / self.leverage
                            position["take"] = float(position["entry"]) * (
                                1 + target_fraction
                                if position["side"] == "long"
                                else 1 - target_fraction
                            )
                            position["take_profit_roe"] = expected_take_roe
                    edge_exit = context_exit_reason(name, position, context)
                    mark = self._mark_price(position["side"], ticker)
                    stop_hit = mark <= position["stop"] if position["side"] == "long" else mark >= position["stop"]
                    take_hit = mark >= position["take"] if position["side"] == "long" else mark <= position["take"]
                    profit_exit = self._profit_protection_reason(position, ticker, now)
                    should_close = (
                        experiment_over
                        or stop_hit
                        or take_hit
                        or bool(profit_exit)
                        or bool(edge_exit)
                    )
                    reason = (
                        "experiment_end"
                        if experiment_over
                        else "stop"
                        if stop_hit
                        else "take"
                        if take_hit
                        else profit_exit
                        if profit_exit
                        else edge_exit
                    )
                if should_close:
                    events.append(self._close(name, strategy, ticker, reason))
                    closed_this_cycle = True
            if (
                not experiment_over
                and not closed_this_cycle
                and allow_entries
                and strategy["position"] is None
                and self._risk_reason(strategy, now) is None
                and now >= int(strategy.get("next_entry_at") or 0)
                and strategy.get("last_signal_candles", {}).get(symbol) != decision_candle
            ):
                strategy.setdefault("last_signal_candles", {})[symbol] = decision_candle
                found = (
                    demo_signal_for(name, c15, c1h, c4h)
                    if demo_started_this_cycle
                    else signal_for(name, c15, c1h, c4h, context)
                )
                if found:
                    side, signal_reason, _ = found
                    observation = signal_observation(
                        name,
                        symbol,
                        side,
                        signal_reason,
                        decision_candle,
                        c15,
                        c1h,
                        c4h,
                    )
                    opened = self._open(
                        name,
                        strategy,
                        found,
                        ticker,
                        decision_candle,
                        context,
                        (
                            c15
                            if name == "bollinger_reversion"
                            else strategy_candles
                        ),
                        symbol=symbol,
                        observation_id=observation["observation_id"],
                        demo=demo_started_this_cycle,
                        demo_close_at=self.state.get("demo_close_at"),
                    )
                    observation["accepted"] = bool(opened)
                    observation["rejection_reason"] = (
                        None if opened else self.last_entry_rejection or "entry_not_opened"
                    )
                    if opened:
                        observation["entry_plan"] = {
                            "entry": opened["entry"],
                            "stop": opened["stop"],
                            "take": opened["take"],
                            "initial_margin": opened["initial_margin"],
                            "quantity": opened["quantity"],
                        }
                    events.append(observation)
                    if opened:
                        events.append(opened)

            current_position = strategy["position"]
            if not current_position or current_position.get("symbol", "AVAX/USDT:USDT") == symbol:
                equity = self._equity(strategy, ticker)
                strategy["peak_equity"] = max(strategy["peak_equity"], equity)
                drawdown = 100 * (strategy["peak_equity"] - equity) / strategy["peak_equity"]
                strategy["max_drawdown_pct"] = max(strategy["max_drawdown_pct"], drawdown)

        if experiment_over and not self.state["finalized_at"]:
            self.state["finalized_at"] = now
            events.append({"event": "experiment_finalized", "timestamp": now})
        if self.autosave:
            self._save()

        # Return a full heartbeat snapshot on every 30-second bot cycle. The
        # receiver updates the current candle in place, so this keeps the UI
        # live without creating a new history row every 30 seconds.
        self.last_summary_candle = candle_ts
        periodic_summary = self.summary(ticker)
        # The dashboard rejects snapshots older than the newest stored
        # market_candle. An entry/exit event uses wall-clock time, so falling
        # back to the 5m candle timestamp on the next quiet cycle would make
        # every following 30-second heartbeat look stale until a new candle.
        periodic_summary["market_candle"] = now
        periodic_summary["market_price"] = float(
            ticker.get("last") or ticker.get("close")
        )
        periodic_summary["market_ohlc"] = {
            "open": float(c15[-1][1]),
            "high": float(c15[-1][2]),
            "low": float(c15[-1][3]),
            "close": float(c15[-1][4]),
            "volume": float(c15[-1][5]),
        }
        return events, periodic_summary
