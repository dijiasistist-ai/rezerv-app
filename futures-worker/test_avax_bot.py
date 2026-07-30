from __future__ import annotations

import unittest
import sys
import types
from unittest.mock import patch

try:
    import ccxt  # noqa: F401
except ModuleNotFoundError:
    ccxt_stub = types.ModuleType("ccxt")
    ccxt_stub.ExchangeError = Exception
    ccxt_stub.binanceusdm = object
    sys.modules["ccxt"] = ccxt_stub

try:
    import psycopg  # noqa: F401
except ModuleNotFoundError:
    sys.modules["psycopg"] = types.ModuleType("psycopg")

from avax_bot import Settings, Side, brackets, entry_signal
from avax_paper_tournament import brackets as strategy_brackets


class BotDecisionTest(unittest.TestCase):
    def test_production_cadence_scans_full_universe_every_30_seconds(self) -> None:
        settings = Settings()
        self.assertEqual(30, settings.poll_seconds)
        self.assertEqual(50, settings.scan_batch_size)

    def test_live_entry_uses_selected_paper_strategy_signal(self) -> None:
        with patch(
            "avax_bot.signal_for",
            return_value=("short", "shared strategy decision", 0.012),
        ) as mocked:
            signal = entry_signal([], [], [], "liquidity_sweep")

        mocked.assert_called_once_with("liquidity_sweep", [], [], [])
        self.assertEqual(Side.SHORT, signal.side)
        self.assertEqual("shared strategy decision", signal.reason)

    def test_live_brackets_match_selected_paper_strategy(self) -> None:
        settings = Settings(live_strategy="trend_breakout")
        expected = strategy_brackets(
            "trend_breakout",
            20.0,
            "long",
            0.01,
            settings.leverage,
            settings.take_profit_roe,
        )
        self.assertEqual(expected, brackets(20.0, Side.LONG, 0.01, settings))


if __name__ == "__main__":
    unittest.main()
