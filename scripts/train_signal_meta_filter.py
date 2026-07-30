#!/usr/bin/env python3
"""Train and walk-forward-audit a small signal acceptance model.

The model never chooses long or short. It estimates whether an already valid
primary-strategy candidate is likely to close profitably after costs. Training
is deliberately offline; this script does not alter the running bot.
"""

from __future__ import annotations

import argparse
import json
import math
import random
import statistics
from pathlib import Path

NUMERIC_FEATURES = (
    "atr_fraction",
    "adx_5m",
    "rsi_5m",
    "volume_ratio_5m",
    "extension_atr_5m",
    "coin_return_6h_pct",
    "coin_return_24h_pct",
    "btc_return_6h_pct",
    "btc_return_24h_pct",
    "open_interest_change_pct_1h",
    "taker_buy_sell_ratio_1h",
    "global_long_short_ratio",
    "top_position_long_short_ratio",
    "funding_rate",
)
STRATEGIES = (
    "trend_breakout",
    "pullback_reclaim",
    "liquidity_sweep",
    "selective_trend_pullback",
    "bollinger_reversion",
)


def sigmoid(value: float) -> float:
    clipped = max(-30.0, min(30.0, value))
    return 1 / (1 + math.exp(-clipped))


def read_rows(path: Path) -> list[dict]:
    return [
        json.loads(line)
        for line in path.read_text("utf-8").splitlines()
        if line.strip()
    ]


def joined_examples(rows: list[dict]) -> list[dict]:
    candidates = {
        row["observation_id"]: row
        for row in rows
        if row.get("event") == "signal_candidate"
        and row.get("accepted")
        and row.get("observation_id")
    }
    examples = []
    for outcome in rows:
        if outcome.get("event") != "trade_outcome":
            continue
        candidate = candidates.get(outcome.get("observation_id"))
        if not candidate:
            continue
        examples.append(
            {
                "candidate": candidate,
                "outcome": outcome,
                "timestamp": int(candidate["signal_candle"]),
                "label": 1 if float(outcome.get("net_pnl") or 0) > 0 else 0,
            }
        )
    return sorted(examples, key=lambda row: row["timestamp"])


def raw_vector(example: dict) -> list[float]:
    candidate = example["candidate"]
    features = candidate.get("features") or {}
    context = candidate.get("futures_context") or {}
    combined = {**features, **context}
    values = [
        float(combined.get(name) or 0.0)
        for name in NUMERIC_FEATURES
    ]
    values.extend(
        (
            1.0 if candidate.get("side") == "long" else -1.0,
            1.0 if features.get("ema21_above_ema55") else 0.0,
            1.0 if features.get("ema21_slope_up") else 0.0,
        )
    )
    values.extend(
        1.0 if candidate.get("strategy") == strategy else 0.0
        for strategy in STRATEGIES
    )
    return values


def fit_scaler(vectors: list[list[float]]) -> tuple[list[float], list[float]]:
    columns = list(zip(*vectors))
    means = [statistics.fmean(column) for column in columns]
    scales = [
        max(statistics.pstdev(column), 1e-9)
        for column in columns
    ]
    return means, scales


def scaled(vector, means, scales):
    return [
        (value - mean) / scale
        for value, mean, scale in zip(vector, means, scales)
    ]


def train_logistic(
    vectors: list[list[float]],
    labels: list[int],
    *,
    epochs: int = 800,
    learning_rate: float = 0.025,
    l2: float = 0.02,
) -> tuple[float, list[float]]:
    random.seed(7)
    weights = [random.uniform(-0.01, 0.01) for _ in vectors[0]]
    bias = 0.0
    count = len(vectors)
    for _ in range(epochs):
        gradient = [0.0] * len(weights)
        bias_gradient = 0.0
        for vector, label in zip(vectors, labels):
            probability = sigmoid(
                bias + sum(weight * value for weight, value in zip(weights, vector))
            )
            error = probability - label
            bias_gradient += error
            for index, value in enumerate(vector):
                gradient[index] += error * value
        bias -= learning_rate * bias_gradient / count
        for index in range(len(weights)):
            weights[index] -= learning_rate * (
                gradient[index] / count + l2 * weights[index]
            )
    return bias, weights


def metrics(examples, probabilities, threshold):
    selected = [
        (example, probability)
        for example, probability in zip(examples, probabilities)
        if probability >= threshold
    ]
    if not selected:
        return {
            "threshold": threshold,
            "trades": 0,
            "win_rate_pct": 0.0,
            "net_pnl_usdt": 0.0,
            "profit_factor": None,
        }
    outcomes = [row[0]["outcome"] for row in selected]
    pnls = [float(outcome.get("net_pnl") or 0) for outcome in outcomes]
    wins = [pnl for pnl in pnls if pnl > 0]
    losses = [pnl for pnl in pnls if pnl <= 0]
    return {
        "threshold": threshold,
        "trades": len(selected),
        "win_rate_pct": round(100 * len(wins) / len(selected), 2),
        "net_pnl_usdt": round(sum(pnls), 2),
        "profit_factor": (
            round(sum(wins) / abs(sum(losses)), 3) if losses and sum(losses) else None
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("observations")
    parser.add_argument("--output", default="/tmp/tyee-meta-filter.json")
    parser.add_argument("--minimum-examples", type=int, default=300)
    parser.add_argument("--train-fraction", type=float, default=0.70)
    parser.add_argument("--embargo-hours", type=float, default=12.0)
    args = parser.parse_args()

    examples = joined_examples(read_rows(Path(args.observations)))
    if len(examples) < args.minimum_examples:
        raise SystemExit(
            f"insufficient labeled examples: {len(examples)} < {args.minimum_examples}"
        )
    split = max(1, min(len(examples) - 1, int(len(examples) * args.train_fraction)))
    test_start = examples[split]["timestamp"]
    embargo_ms = int(args.embargo_hours * 3_600_000)
    train_examples = [
        example for example in examples[:split]
        if example["timestamp"] < test_start - embargo_ms
    ]
    test_examples = examples[split:]
    if len(train_examples) < 2 or not test_examples:
        raise SystemExit(
            "chronological split/embargo left too few train or test examples"
        )
    if len({example["label"] for example in train_examples}) < 2:
        raise SystemExit("training window must contain both wins and losses")
    train_raw = [raw_vector(example) for example in train_examples]
    test_raw = [raw_vector(example) for example in test_examples]
    means, scales = fit_scaler(train_raw)
    train_vectors = [scaled(vector, means, scales) for vector in train_raw]
    test_vectors = [scaled(vector, means, scales) for vector in test_raw]
    bias, weights = train_logistic(
        train_vectors, [example["label"] for example in train_examples]
    )
    probabilities = [
        sigmoid(bias + sum(weight * value for weight, value in zip(weights, vector)))
        for vector in test_vectors
    ]
    test_metrics = [
        metrics(test_examples, probabilities, threshold)
        for threshold in (0.50, 0.55, 0.60, 0.65, 0.70)
    ]
    fixed_gate = next(row for row in test_metrics if row["threshold"] == 0.65)
    payload = {
        "model_type": "l2_logistic_signal_acceptance",
        "trained_at": max(example["timestamp"] for example in train_examples),
        "train_examples": len(train_examples),
        "untouched_test_examples": len(test_examples),
        "embargo_hours": args.embargo_hours,
        "feature_names": [
            *NUMERIC_FEATURES,
            "side_long_vs_short",
            "ema21_above_ema55",
            "ema21_slope_up",
            *(f"strategy_{strategy}" for strategy in STRATEGIES),
        ],
        "means": means,
        "scales": scales,
        "bias": bias,
        "weights": weights,
        "test_metrics": test_metrics,
        "research_gate_passed": bool(
            fixed_gate["trades"] >= 100
            and fixed_gate["net_pnl_usdt"] > 0
            and (fixed_gate["profit_factor"] or 0) >= 1.30
        ),
        "promotion_note": (
            "The predeclared 0.65 threshold must have PF >= 1.30, positive net "
            "PnL, and at least 100 selected untouched-test trades. Passing this "
            "research gate still requires a separate forward paper test."
        ),
    }
    Path(args.output).write_text(json.dumps(payload, indent=2), "utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
