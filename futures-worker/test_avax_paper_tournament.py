from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from urllib.error import HTTPError
from unittest.mock import patch

from avax_paper_tournament import (
    CURRENT_RULE_VERSION,
    CURRENT_STOP_RULE_VERSION,
    HttpStateStore,
    PaperTournament,
    STRATEGIES,
    STRATEGY_PROFILES,
    bollinger_bands,
    brackets,
    closed_15m_candles,
    signal_for,
    stop_model_for,
)


def candles(count: int, step_ms: int) -> list[list[float]]:
    rows = []
    for index in range(count):
        price = 20 + index * 0.001
        rows.append([index * step_ms, price, price * 1.002, price * 0.998, price, 1000])
    return rows


class MemoryStateStore:
    def __init__(self) -> None:
        self.state = None

    def load(self):
        return self.state

    def save(self, state) -> None:
        import json

        self.state = json.loads(json.dumps(state))


class TournamentTest(unittest.TestCase):
    @staticmethod
    def completed_trade(net_pnl: float, reason: str) -> dict:
        return {
            "net_pnl": net_pnl,
            "exit_reason": reason,
            "demo": False,
        }

    def test_strategy_self_review_changes_one_bounded_parameter_after_five_trades(
        self,
    ) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        strategy = tournament.state["strategies"]["pullback_reclaim"]
        strategy["trades"] = [
            self.completed_trade(-20, "stop"),
            self.completed_trade(-18, "stop"),
            self.completed_trade(-22, "stop"),
            self.completed_trade(35, "take"),
            self.completed_trade(-19, "stop"),
        ]

        review = tournament._maybe_adapt("pullback_reclaim", strategy)

        self.assertIsNotNone(review)
        self.assertEqual("atr_stop_multiplier", review["change"]["parameter"])
        self.assertEqual(1.3, strategy["adaptation"]["parameters"]["atr_stop_multiplier"])
        self.assertEqual(0.030, STRATEGY_PROFILES["pullback_reclaim"]["take_profit_roe"])
        self.assertEqual(0.015, STRATEGY_PROFILES["pullback_reclaim"]["minimum_stop_roe"])
        self.assertEqual(1, strategy["adaptation"]["generation"])

    def test_self_review_waits_for_five_new_closed_trades(self) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        strategy = tournament.state["strategies"]["trend_breakout"]
        strategy["trades"] = [
            self.completed_trade(-10, "stop") for _ in range(4)
        ]
        self.assertIsNone(tournament._maybe_adapt("trend_breakout", strategy))
        self.assertEqual(0, strategy["adaptation"]["generation"])

    def test_competition_awards_risk_adjusted_leader_without_adding_capital(
        self,
    ) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        winner = tournament.state["strategies"]["trend_breakout"]
        runner_up = tournament.state["strategies"]["pullback_reclaim"]
        winner["trades"] = [
            self.completed_trade(30, "take"),
            self.completed_trade(-5, "stop"),
            self.completed_trade(25, "take"),
        ]
        runner_up["trades"] = [
            self.completed_trade(12, "take"),
            self.completed_trade(-8, "stop"),
            self.completed_trade(10, "take"),
        ]
        tournament.state["competition"]["next_award_at"] = 0
        original_balance = winner["balance"]

        award = tournament._maybe_award_champion()

        self.assertEqual("trend_breakout", award["winner"])
        self.assertEqual(1, winner["reward_points"])
        self.assertEqual(original_balance, winner["balance"])
        self.assertEqual(
            "trend_breakout",
            tournament.summary({})["competition"]["champion"],
        )

    def test_realtime_position_manager_closes_stop_without_running_scanner(self) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        strategy = tournament.state["strategies"]["pullback_reclaim"]
        strategy["balance"] = 5999
        strategy["position"] = {
            "side": "long",
            "symbol": "ZAMA/USDT:USDT",
            "entry": 0.0642,
            "quantity": 2400 / 0.0642,
            "initial_margin": 1200,
            "entry_fee": 1,
            "stop": 0.0632,
            "take": 0.0652,
            "opened_at": 1,
            "reason": "test",
        }

        events = tournament.manage_open_positions(
            {
                "ZAMA/USDT:USDT": {
                    "bid": 0.0631,
                    "ask": 0.06311,
                    "last": 0.063105,
                }
            }
        )

        self.assertEqual(1, len(events))
        self.assertEqual("stop", events[0]["exit_reason"])
        self.assertIsNone(strategy["position"])

    def test_realtime_position_manager_never_opens_new_position(self) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        events = tournament.manage_open_positions(
            {"BTC/USDT:USDT": {"bid": 100, "ask": 101, "last": 100.5}}
        )
        self.assertEqual([], events)
        self.assertTrue(
            all(
                strategy["position"] is None
                for strategy in tournament.state["strategies"].values()
            )
        )

    def test_remote_state_retries_transient_gateway_errors(self) -> None:
        store = HttpStateStore("https://example.test/api/state", "token")
        failure = HTTPError(store.state_url, 502, "Bad Gateway", {}, None)
        with patch(
            "avax_paper_tournament.urllib.request.urlopen",
            side_effect=[failure, failure, failure],
        ) as request, patch("avax_paper_tournament.time.sleep"):
            with self.assertRaises(HTTPError):
                store.save({"version": 5})
        self.assertEqual(3, request.call_count)

    def test_state_store_survives_new_tournament_instance(self) -> None:
        store = MemoryStateStore()
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=1000,
            state_store=store,
        )
        tournament.state["strategies"]["trend_breakout"]["balance"] = 987.65
        tournament.save()

        restored = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=1000,
            state_store=store,
        )
        self.assertEqual(
            987.65,
            restored.state["strategies"]["trend_breakout"]["balance"],
        )
        self.assertEqual(
            tournament.state["started_at"],
            restored.state["started_at"],
        )

    def test_version_five_state_adds_fourth_strategy_without_reset(self) -> None:
        store = MemoryStateStore()
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=1000,
            state_store=store,
        )
        tournament.state["strategies"]["trend_breakout"]["balance"] = 912.34
        tournament.state["strategies"].pop("selective_trend_pullback")
        tournament.state["version"] = 5
        original_started_at = tournament.state["started_at"]
        tournament.save()

        restored = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=1000,
            state_store=store,
        )
        self.assertEqual(912.34, restored.state["strategies"]["trend_breakout"]["balance"])
        self.assertEqual(original_started_at, restored.state["started_at"])
        self.assertIn("selective_trend_pullback", restored.state["strategies"])
        self.assertEqual(
            1000,
            restored.state["strategies"]["selective_trend_pullback"]["balance"],
        )
        self.assertIn("bollinger_reversion", restored.state["strategies"])
        self.assertEqual(
            1000,
            restored.state["strategies"]["bollinger_reversion"]["balance"],
        )

    def test_budget_increase_adds_capital_without_resetting_performance(self) -> None:
        store = MemoryStateStore()
        original = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=1000,
            state_store=store,
        )
        strategy = original.state["strategies"]["trend_breakout"]
        strategy["balance"] = 987.5
        strategy["peak_equity"] = 1010
        strategy["day_start_balance"] = 995
        strategy["wins"] = 2
        original.save()

        resized = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=store,
        )
        resized_strategy = resized.state["strategies"]["trend_breakout"]
        self.assertEqual(5987.5, resized_strategy["balance"])
        self.assertEqual(6010, resized_strategy["peak_equity"])
        self.assertEqual(5995, resized_strategy["day_start_balance"])
        self.assertEqual(2, resized_strategy["wins"])
        self.assertEqual(6000, resized.state["initial_usdt"])

        resized.save()
        restored = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=store,
        )
        self.assertEqual(5987.5, restored.state["strategies"]["trend_breakout"]["balance"])

    def test_version_seven_clears_all_paper_risk_locks_once(self) -> None:
        store = MemoryStateStore()
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=store,
        )
        for name in STRATEGIES:
            strategy = tournament.state["strategies"][name]
            strategy["balance"] = 5875
            strategy["peak_equity"] = 6100
            strategy["day_start_balance"] = 6000
            strategy["consecutive_losses"] = 4
            strategy["risk_pause_until"] = 9999999999999
            strategy["risk_halted_reason"] = "max_drawdown_5.00%"
        tournament.state["version"] = 7
        tournament.save()

        restored = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=store,
        )
        for name in STRATEGIES:
            strategy = restored.state["strategies"][name]
            self.assertEqual(5875, strategy["balance"])
            self.assertEqual(5875, strategy["peak_equity"])
            self.assertEqual(5875, strategy["day_start_balance"])
            self.assertEqual(0, strategy["consecutive_losses"])
            self.assertEqual(0, strategy["risk_pause_until"])
            self.assertIsNone(strategy["risk_halted_reason"])

    def test_six_thousand_per_strategy_uses_twelve_hundred_margin(self) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        c5 = candles(260, 300_000)
        c1h = candles(260, 3_600_000)
        with patch(
            "avax_paper_tournament.signal_for",
            return_value=("long", "budget sizing", 0.005),
        ):
            events, _ = tournament.cycle(
                c5,
                c1h,
                c1h,
                {"bid": 20.0, "ask": 20.0, "last": 20.0},
                None,
            )
        opened = [event for event in events if event["event"] == "open"]
        self.assertEqual(len(STRATEGIES), len(opened))
        self.assertTrue(all(event["initial_margin"] == 1200 for event in opened))

    def test_daily_loss_does_not_block_observation_entries(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            tournament = PaperTournament(
                str(Path(directory) / "risk.json"),
                initial_usdt=1000,
                max_daily_loss_pct=2,
            )
            for strategy in tournament.state["strategies"].values():
                strategy["balance"] = 979
                strategy["day_start_balance"] = 1000
            c15 = candles(260, 300_000)
            c1h = candles(260, 3_600_000)
            c4h = candles(260, 14_400_000)
            with patch(
                "avax_paper_tournament.signal_for",
                return_value=("long", "must be blocked", 0.005),
            ):
                events, summary = tournament.cycle(
                    c15,
                    c1h,
                    c4h,
                    {"bid": 20.0, "ask": 20.0, "last": 20.0},
                    None,
                )
            self.assertEqual(
                len(STRATEGIES),
                len([event for event in events if event["event"] == "open"]),
            )
            self.assertTrue(
                all(
                    not row["risk_status"]["halted"]
                    and row["risk_status"]["reason"] is None
                    for row in summary["strategies"].values()
                )
            )

    def test_expired_legacy_deadline_does_not_block_continuous_entries(self) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        tournament.state["ends_at"] = 1
        tournament.state["finalized_at"] = 2
        tournament.state["continuous"] = True
        c5 = candles(260, 300_000)
        c1h = candles(260, 3_600_000)
        with patch(
            "avax_paper_tournament.signal_for",
            return_value=("long", "continuous tournament", 0.005),
        ):
            events, summary = tournament.cycle(
                c5,
                c1h,
                c1h,
                {"bid": 20.0, "ask": 20.0, "last": 20.0},
                None,
            )
        self.assertEqual(
            len(STRATEGIES),
            len([event for event in events if event["event"] == "open"]),
        )
        self.assertTrue(summary["continuous"])
        self.assertIsNone(summary["finalized_at"])

    def test_each_strategy_keeps_one_position_while_universe_scans(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            tournament = PaperTournament(
                str(Path(directory) / "universe.json"),
                initial_usdt=1000,
                duration_hours=48,
            )
            c15 = candles(260, 300_000)
            c1h = candles(260, 3_600_000)
            c4h = candles(260, 14_400_000)
            ticker = {"bid": 20.0, "ask": 20.0, "last": 20.0}
            with patch(
                "avax_paper_tournament.signal_for",
                return_value=("long", "universe entry", 0.005),
            ):
                first_events, _ = tournament.cycle(
                    c15,
                    c1h,
                    c4h,
                    ticker,
                    None,
                    symbol="BTC/USDT:USDT",
                )
                second_events, _ = tournament.cycle(
                    c15,
                    c1h,
                    c4h,
                    ticker,
                    None,
                    symbol="ETH/USDT:USDT",
                )

            self.assertEqual(
                len(STRATEGIES),
                len([event for event in first_events if event["event"] == "open"]),
            )
            self.assertFalse(any(event["event"] == "open" for event in second_events))
            self.assertTrue(
                all(
                    strategy["position"]["symbol"] == "BTC/USDT:USDT"
                    for strategy in tournament.state["strategies"].values()
                )
            )

    def test_strategies_keep_separate_fee_adjusted_accounts(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            state_path = str(Path(directory) / "state.json")
            tournament = PaperTournament(state_path, initial_usdt=1000, duration_hours=48)
            c15 = candles(260, 300_000)
            c1h = candles(260, 3_600_000)
            c4h = candles(260, 14_400_000)
            with patch(
                "avax_paper_tournament.signal_for",
                return_value=("long", "test entry", 0.005),
            ):
                events, _ = tournament.cycle(
                    c15, c1h, c4h, {"bid": 20.0, "ask": 20.0, "last": 20.0}, None
                )
            self.assertEqual(
                len(STRATEGIES),
                len([event for event in events if event["event"] == "open"]),
            )
            self.assertTrue(all(tournament.state["strategies"][name]["position"] for name in STRATEGIES))
            opened_summary = tournament.summary(
                {"bid": 20.0, "ask": 20.0, "last": 20.0}
            )
            self.assertTrue(
                all(
                    opened_summary["strategies"][name]["position_pnl_usdt"] is not None
                    for name in STRATEGIES
                )
            )
            positions = {
                name: tournament.state["strategies"][name]["position"]
                for name in STRATEGIES
            }
            self.assertEqual(1, len({position["take"] for position in positions.values()}))
            self.assertEqual(2, len({position["stop"] for position in positions.values()}))
            self.assertTrue(
                all(
                    position["stop_model"] == stop_model_for(name)
                    for name, position in positions.items()
                )
            )
            self.assertTrue(
                all(
                    position["rule_version"] == CURRENT_RULE_VERSION
                    for position in positions.values()
                )
            )
            self.assertEqual("5m", positions["trend_breakout"]["decision_timeframe"])
            self.assertEqual("5m", positions["pullback_reclaim"]["decision_timeframe"])
            self.assertEqual(
                "5m + 1h filter",
                positions["selective_trend_pullback"]["decision_timeframe"],
            )
            self.assertEqual(
                "15m Bollinger(20, 2)",
                positions["bollinger_reversion"]["decision_timeframe"],
            )
            self.assertEqual(
                0.03,
                positions["selective_trend_pullback"]["take_profit_roe"],
            )
            self.assertTrue(
                all(
                    position["take_profit_roe"] == 0.03
                    for position in positions.values()
                )
            )

            # Every strategy now has the same 3% ROE target.
            events, _ = tournament.cycle(
                c15, c1h, c4h, {"bid": 20.42, "ask": 20.43, "last": 20.425}, None
            )
            self.assertEqual(
                list(STRATEGIES),
                [event["strategy"] for event in events if event["event"] == "close"],
            )

            summary = tournament.summary({"bid": 20.84, "ask": 20.85, "last": 20.845})
            for name in STRATEGIES:
                row = summary["strategies"][name]
                self.assertEqual(1, row["trades"])
                self.assertEqual(1, row["wins"])
                self.assertGreater(row["wallet_roi_pct"], 0)
                self.assertIsNone(row["position"])

            restored = PaperTournament(state_path, initial_usdt=1000, duration_hours=48)
            self.assertEqual(
                tournament.state["strategies"]["trend_breakout"]["balance"],
                restored.state["strategies"]["trend_breakout"]["balance"],
            )

    def test_existing_trend_position_migrates_to_three_percent_roe_and_closes(self) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        c5 = candles(260, 300_000)
        c1h = candles(260, 3_600_000)
        with patch(
            "avax_paper_tournament.signal_for",
            side_effect=lambda name, *_: (
                ("long", "legacy trend target", 0.005)
                if name == "trend_breakout"
                else None
            ),
        ):
            tournament.cycle(
                c5,
                c1h,
                c1h,
                {"bid": 20.0, "ask": 20.0, "last": 20.0},
                None,
            )
        position = tournament.state["strategies"]["trend_breakout"]["position"]
        position["take_profit_roe"] = 0.08
        position["take"] = position["entry"] * 1.04

        events, _ = tournament.cycle(
            c5,
            c1h,
            c1h,
            {"bid": 20.32, "ask": 20.33, "last": 20.325},
            None,
        )
        closes = [event for event in events if event["event"] == "close"]
        self.assertEqual(["trend_breakout"], [event["strategy"] for event in closes])
        self.assertEqual("take", closes[0]["exit_reason"])

    def test_positions_do_not_close_for_time_or_indicator_reversal(self) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=1000,
            state_store=MemoryStateStore(),
        )
        c5 = candles(260, 300_000)
        c1h = candles(260, 3_600_000)
        ticker = {"bid": 20.0, "ask": 20.0, "last": 20.0}
        with patch(
            "avax_paper_tournament.signal_for",
            return_value=("long", "fixed stop test", 0.005),
        ):
            opened, _ = tournament.cycle(c5, c1h, c1h, ticker, None)
        self.assertEqual(
            len(STRATEGIES),
            len([event for event in opened if event["event"] == "open"]),
        )

        reversed_c5 = [
            [row[0] + 3_600_000, row[1], row[2], row[3], row[4], row[5]]
            for row in c5
        ]
        held, _ = tournament.cycle(reversed_c5, c1h, c1h, ticker, None)
        self.assertFalse(any(event["event"] == "close" for event in held))
        self.assertTrue(
            all(strategy["position"] for strategy in tournament.state["strategies"].values())
        )

    def test_forced_demo_opens_all_accounts_and_closes_after_deadline(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            tournament = PaperTournament(
                str(Path(directory) / "demo.json"),
                initial_usdt=1000,
                duration_hours=48,
                demo_seconds=300,
            )
            c15 = candles(260, 300_000)
            c1h = candles(260, 3_600_000)
            c4h = candles(260, 14_400_000)
            ticker = {"bid": 20.0, "ask": 20.0, "last": 20.0}
            with patch("avax_paper_tournament.time.time", return_value=1000):
                events, opened = tournament.cycle(c15, c1h, c4h, ticker, None)
            self.assertEqual(
                len(STRATEGIES),
                len([event for event in events if event["event"] == "open"]),
            )
            self.assertTrue(all(opened["strategies"][name]["position"] for name in STRATEGIES))

            with patch("avax_paper_tournament.time.time", return_value=1299):
                events, _ = tournament.cycle(c15, c1h, c4h, ticker, None)
            self.assertFalse(any(event["event"] == "close" for event in events))

            with patch("avax_paper_tournament.time.time", return_value=1300):
                events, closed = tournament.cycle(c15, c1h, c4h, ticker, None)
            self.assertEqual(
                len(STRATEGIES),
                len([event for event in events if event["event"] == "close"]),
            )
            self.assertTrue(all(closed["strategies"][name]["trades"] == 1 for name in STRATEGIES))
            self.assertTrue(
                all(
                    closed["strategies"][name]["recent_trades"][-1]["exit_reason"]
                    == "5m_demo_end"
                    for name in STRATEGIES
                )
            )

    def test_bollinger_uses_only_complete_fifteen_minute_candles(self) -> None:
        c5 = candles(10, 300_000)
        aggregated = closed_15m_candles(c5)
        self.assertEqual(3, len(aggregated))
        self.assertEqual([0, 900_000, 1_800_000], [row[0] for row in aggregated])
        self.assertEqual(c5[0][1], aggregated[0][1])
        self.assertEqual(c5[2][4], aggregated[0][4])
        self.assertEqual(sum(row[5] for row in c5[:3]), aggregated[0][5])

    def test_bollinger_long_requires_lower_band_reentry_on_closed_15m_candle(self) -> None:
        c5 = candles(80, 300_000)
        closes = [100 + (index % 4 - 1.5) for index in range(24)]
        c15 = [
            [index * 900_000, close, close + 0.4, close - 0.4, close, 3000]
            for index, close in enumerate(closes)
        ]
        c15[-2][1] = 98.02
        c15[-2][2] = 98.15
        c15[-2][3] = 97.90
        c15[-2][4] = 98.10
        c15[-1][1] = 98.12
        c15[-1][4] = 98.18
        with patch(
            "avax_paper_tournament.market_features",
            return_value={"close15": [float(row[4]) for row in c5]},
        ), patch(
            "avax_paper_tournament.closed_15m_candles",
            return_value=c15,
        ), patch(
            "avax_paper_tournament.bollinger_bands",
            return_value=(98.0, 100.0, 102.0),
        ), patch("avax_paper_tournament.rsi", return_value=40), patch(
            "avax_paper_tournament.adx", return_value=20
        ), patch(
            "avax_paper_tournament.atr", return_value=0.5
        ):
            found = signal_for("bollinger_reversion", c5, c5, c5)
        self.assertEqual("long", found[0])
        self.assertIn("next-candle confirmation", found[1])

    def test_bollinger_short_requires_upper_band_reentry_on_closed_15m_candle(self) -> None:
        c5 = candles(80, 300_000)
        closes = [100 + (index % 4 - 1.5) for index in range(24)]
        c15 = [
            [index * 900_000, close, close + 0.4, close - 0.4, close, 3000]
            for index, close in enumerate(closes)
        ]
        c15[-2][1] = 101.98
        c15[-2][2] = 102.10
        c15[-2][3] = 101.85
        c15[-2][4] = 101.90
        c15[-1][1] = 101.88
        c15[-1][4] = 101.82
        with patch(
            "avax_paper_tournament.market_features",
            return_value={"close15": [float(row[4]) for row in c5]},
        ), patch(
            "avax_paper_tournament.closed_15m_candles",
            return_value=c15,
        ), patch(
            "avax_paper_tournament.bollinger_bands",
            return_value=(98.0, 100.0, 102.0),
        ), patch("avax_paper_tournament.rsi", return_value=60), patch(
            "avax_paper_tournament.adx", return_value=20
        ), patch(
            "avax_paper_tournament.atr", return_value=0.5
        ):
            found = signal_for("bollinger_reversion", c5, c5, c5)
        self.assertEqual("short", found[0])
        self.assertIn("next-candle confirmation", found[1])

    def test_bollinger_does_not_chase_a_reentry_toward_the_middle_band(self) -> None:
        c5 = candles(80, 300_000)
        c15 = candles(24, 900_000)
        c15[-2][1] = 98.02
        c15[-2][2] = 98.15
        c15[-2][3] = 97.90
        c15[-2][4] = 98.10
        c15[-1][1] = 98.20
        c15[-1][4] = 99.00
        with patch(
            "avax_paper_tournament.market_features",
            return_value={"close15": [float(row[4]) for row in c5]},
        ), patch(
            "avax_paper_tournament.closed_15m_candles",
            return_value=c15,
        ), patch(
            "avax_paper_tournament.bollinger_bands",
            return_value=(98.0, 100.0, 102.0),
        ), patch("avax_paper_tournament.rsi", return_value=40), patch(
            "avax_paper_tournament.adx", return_value=20
        ), patch(
            "avax_paper_tournament.atr", return_value=0.5
        ):
            found = signal_for("bollinger_reversion", c5, c5, c5)
        self.assertIsNone(found)

    def test_bollinger_stop_has_eight_tenths_percent_floor(self) -> None:
        stop, _ = brackets(
            "bollinger_reversion",
            entry=100,
            side="long",
            atr_fraction=0.001,
            leverage=2,
            minimum_tp_roe=0.03,
        )
        self.assertAlmostEqual(99.2, stop)

    def test_all_strategies_use_one_and_half_percent_roe_stop_floor(self) -> None:
        for strategy, expected in (
            ("trend_breakout", 99.25),
            ("pullback_reclaim", 99.25),
            ("liquidity_sweep", 99.25),
            ("selective_trend_pullback", 99.25),
        ):
            stop, _ = brackets(
                strategy,
                entry=100,
                side="long",
                atr_fraction=0.001,
                leverage=2,
                minimum_tp_roe=0.03,
            )
            self.assertAlmostEqual(expected, stop)

    def test_liquidity_sweep_requires_next_five_minute_confirmation(self) -> None:
        c5 = candles(80, 300_000)
        prior_low = min(float(row[3]) for row in c5[-14:-2])
        c5[-2][1] = 20.06
        c5[-2][2] = 20.10
        c5[-2][3] = prior_low - 0.10
        c5[-2][4] = prior_low + 0.02
        c5[-1][1] = 20.08
        c5[-1][4] = 20.09
        features = {
            "close15": [float(row[4]) for row in c5],
            "ema21_15": [20.0] * len(c5),
            "atr": 0.10,
            "volume_ratio": 1.0,
            "rsi": 45,
        }
        with patch(
            "avax_paper_tournament.market_features",
            return_value=features,
        ):
            self.assertIsNone(signal_for("liquidity_sweep", c5, c5, c5))
            c5[-1][4] = 20.12
            features["close15"][-1] = 20.12
            found = signal_for("liquidity_sweep", c5, c5, c5)
        self.assertEqual("long", found[0])
        self.assertIn("next 5m candle confirmation", found[1])

    def test_bollinger_rejects_entry_requiring_more_than_one_and_half_percent_stop(
        self,
    ) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        strategy = tournament.state["strategies"]["bollinger_reversion"]
        opened = tournament._open(
            "bollinger_reversion",
            strategy,
            ("long", "excessive volatility", 0.01),
            {"bid": 20.0, "ask": 20.0, "last": 20.0},
            1,
            None,
            candles(260, 300_000),
        )
        self.assertIsNone(opened)
        self.assertIsNone(strategy["position"])
        self.assertEqual(6000, strategy["balance"])

    def test_bollinger_rejects_entry_below_minimum_reward_risk(self) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        strategy = tournament.state["strategies"]["bollinger_reversion"]
        with patch(
            "avax_paper_tournament.brackets",
            return_value=(19.8, 20.1),
        ):
            opened = tournament._open(
                "bollinger_reversion",
                strategy,
                ("long", "poor reward", 0.005),
                {"bid": 20.0, "ask": 20.0, "last": 20.0},
                1,
                None,
                candles(260, 300_000),
            )
        self.assertIsNone(opened)
        self.assertIsNone(strategy["position"])
        self.assertEqual(6000, strategy["balance"])

    def test_legacy_oversized_stop_is_capped_during_migration(self) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        strategy = tournament.state["strategies"]["trend_breakout"]
        c5 = candles(260, 300_000)
        opened = tournament._open(
            "trend_breakout",
            strategy,
            ("long", "legacy entry", 0.005),
            {"bid": 20.0, "ask": 20.0, "last": 20.0},
            1,
            None,
            c5,
        )
        self.assertIsNotNone(opened)
        position = strategy["position"]
        position["stop"] = 18.0
        position.pop("stop_rule_version")
        tournament.cycle(
            c5,
            candles(260, 3_600_000),
            candles(260, 14_400_000),
            {"bid": 20.0, "ask": 20.0, "last": 20.0},
            None,
            allow_entries=False,
        )
        migrated = strategy["position"]
        self.assertLessEqual(
            abs(migrated["stop"] / migrated["entry"] - 1),
            0.015,
        )
        self.assertEqual(
            CURRENT_STOP_RULE_VERSION,
            migrated["stop_rule_version"],
        )

    def test_liquidity_rejects_entry_requiring_more_than_one_percent_stop(
        self,
    ) -> None:
        tournament = PaperTournament(
            "/tmp/not-used.json",
            initial_usdt=6000,
            state_store=MemoryStateStore(),
        )
        strategy = tournament.state["strategies"]["liquidity_sweep"]
        opened = tournament._open(
            "liquidity_sweep",
            strategy,
            ("short", "excessive volatility", 0.009),
            {"bid": 20.0, "ask": 20.0, "last": 20.0},
            1,
            None,
            candles(260, 300_000),
        )
        self.assertIsNone(opened)
        self.assertIsNone(strategy["position"])
        self.assertEqual(6000, strategy["balance"])


if __name__ == "__main__":
    unittest.main()
