from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from train_signal_meta_filter import (  # noqa: E402
    fit_scaler,
    joined_examples,
    raw_vector,
    scaled,
    sigmoid,
    train_logistic,
)


class MetaFilterTest(unittest.TestCase):
    def test_candidates_join_outcomes_and_model_separates_simple_edge(self) -> None:
        rows = []
        for index in range(80):
            observation_id = f"obs-{index}"
            winner = index % 2 == 0
            rows.extend(
                [
                    {
                        "event": "signal_candidate",
                        "observation_id": observation_id,
                        "accepted": True,
                        "signal_candle": index * 300_000,
                        "strategy": "liquidity_sweep",
                        "side": "long" if winner else "short",
                        "features": {
                            "rsi_5m": 65 if winner else 35,
                            "ema21_above_ema55": winner,
                            "ema21_slope_up": winner,
                        },
                        "futures_context": {},
                    },
                    {
                        "event": "trade_outcome",
                        "observation_id": observation_id,
                        "net_pnl": 10 if winner else -10,
                    },
                ]
            )
        examples = joined_examples(rows)
        vectors = [raw_vector(example) for example in examples]
        means, scales = fit_scaler(vectors)
        normalized = [scaled(vector, means, scales) for vector in vectors]
        bias, weights = train_logistic(
            normalized,
            [example["label"] for example in examples],
            epochs=300,
        )
        probabilities = [
            sigmoid(
                bias
                + sum(weight * value for weight, value in zip(weights, vector))
            )
            for vector in normalized
        ]
        self.assertEqual(80, len(examples))
        self.assertGreater(statistics_mean(probabilities[::2]), 0.8)
        self.assertLess(statistics_mean(probabilities[1::2]), 0.2)


def statistics_mean(values):
    return sum(values) / len(values)


if __name__ == "__main__":
    unittest.main()
