from __future__ import annotations

from hyperliquid_copy import CopySettings, HyperliquidCopyEngine


WALLET_A = "0x" + "1" * 40
WALLET_B = "0x" + "2" * 40


class MemoryStore:
    def __init__(self):
        self.value = None

    def load(self):
        return self.value

    def save(self, value):
        self.value = value


class FakeClient:
    def __init__(self, coins):
        self.markets = {
            f"{coin}/USDT:USDT": {
                "active": True,
                "swap": True,
                "linear": True,
            }
            for coin in coins
        }

    def fetch_ticker(self, _symbol):
        return {"bid": 99.0, "ask": 101.0, "last": 100.0, "close": 100.0}


def clearinghouse(**positions):
    return {
        "assetPositions": [
            {
                "position": {
                    "coin": coin,
                    "szi": str(size["size"] if isinstance(size, dict) else size),
                    "entryPx": str(
                        size.get("entry", 0) if isinstance(size, dict) else 0
                    ),
                }
            }
            for coin, size in positions.items()
            if size
        ]
    }


def test_existing_position_is_entered_when_price_is_still_near_source_entry():
    sources = {
        WALLET_A: clearinghouse(BTC={"size": 1, "entry": 101}),
        WALLET_B: clearinghouse(),
    }
    store = MemoryStore()
    engine = HyperliquidCopyEngine(
        CopySettings((WALLET_A, WALLET_B), 6000, 0.10, 2),
        store,
        source_fetcher=lambda address: sources[address],
    )
    client = FakeClient(["BTC", "ETH", "SOL"])

    events = engine.reconcile(client)
    assert [event["event"] for event in events] == ["open"]
    assert len(engine.state["positions"]) == 1

    sources[WALLET_A] = clearinghouse(ETH=3)
    sources[WALLET_B] = clearinghouse(SOL=-4)
    events = engine.reconcile(client)

    assert [event["event"] for event in events] == ["close", "open", "open"]
    assert len(engine.state["positions"]) == 2
    assert {row["side"] for row in engine.state["positions"].values()} == {
        "long",
        "short",
    }
    assert all(row["remaining_margin"] == 600 for row in engine.state["positions"].values())
    assert all(row["notional"] == 1200 for row in engine.state["positions"].values())


def test_one_wallet_failure_does_not_block_the_other_wallet():
    sources = {WALLET_B: clearinghouse(ETH=-2)}

    def fetch(address):
        if address == WALLET_A:
            raise RuntimeError("rate limited")
        return sources[address]

    engine = HyperliquidCopyEngine(
        CopySettings((WALLET_A, WALLET_B), 6000, 0.10, 2),
        MemoryStore(),
        source_fetcher=fetch,
    )
    events = engine.reconcile(FakeClient(["ETH"]))

    assert [event["event"] for event in events] == ["open"]
    assert f"{WALLET_B}:ETH" in engine.state["positions"]
    assert WALLET_A in engine.state["source_errors"]


def test_existing_position_is_not_chased_when_entry_is_too_far_away():
    sources = {
        WALLET_A: clearinghouse(BTC={"size": 1, "entry": 90}),
        WALLET_B: clearinghouse(),
    }
    engine = HyperliquidCopyEngine(
        CopySettings((WALLET_A, WALLET_B), 6000, 0.10, 2),
        MemoryStore(),
        source_fetcher=lambda address: sources[address],
    )
    engine.reconcile(FakeClient(["BTC"]))

    assert engine.state["positions"] == {}
    assert "late_entry_distance" in engine.state["skipped"][-1]["reason"]


def test_partial_close_and_source_close_are_mirrored():
    sources = {WALLET_A: clearinghouse(), WALLET_B: clearinghouse()}
    engine = HyperliquidCopyEngine(
        CopySettings((WALLET_A, WALLET_B), 6000, 0.10, 2),
        MemoryStore(),
        source_fetcher=lambda address: sources[address],
    )
    client = FakeClient(["BTC"])
    engine.reconcile(client)

    sources[WALLET_A] = clearinghouse(BTC=2)
    engine.reconcile(client)
    key = f"{WALLET_A}:BTC"
    sources[WALLET_A] = clearinghouse(BTC=1)
    events = engine.reconcile(client)
    assert events[0]["exit_reason"] == "source_partial_close"
    assert engine.state["positions"][key]["remaining_margin"] == 300

    sources[WALLET_A] = clearinghouse()
    events = engine.reconcile(client)
    assert events[0]["exit_reason"] == "source_closed"
    assert key not in engine.state["positions"]
    assert len(engine.state["trades"]) == 2


def test_ten_percent_allocation_allows_ten_positions_and_rejects_eleventh():
    coins = [f"C{index}" for index in range(11)]
    sources = {WALLET_A: clearinghouse(), WALLET_B: clearinghouse()}
    engine = HyperliquidCopyEngine(
        CopySettings((WALLET_A, WALLET_B), 6000, 0.10, 2),
        MemoryStore(),
        source_fetcher=lambda address: sources[address],
    )
    client = FakeClient(coins)
    engine.reconcile(client)

    sources[WALLET_A] = clearinghouse(**{coin: 1 for coin in coins})
    engine.reconcile(client)

    assert len(engine.state["positions"]) == 10
    assert engine._used_margin() == 6000
    assert engine.state["skipped"][-1]["reason"] == "insufficient_copy_capital"


def test_each_wallet_has_an_independent_six_thousand_dollar_account():
    a_coins = [f"A{index}" for index in range(10)]
    b_coins = [f"B{index}" for index in range(10)]
    sources = {WALLET_A: clearinghouse(), WALLET_B: clearinghouse()}
    engine = HyperliquidCopyEngine(
        CopySettings((WALLET_A, WALLET_B), 6000, 0.10, 2),
        MemoryStore(),
        source_fetcher=lambda address: sources[address],
    )
    client = FakeClient([*a_coins, *b_coins])
    engine.reconcile(client)

    sources[WALLET_A] = clearinghouse(**{coin: 1 for coin in a_coins})
    sources[WALLET_B] = clearinghouse(**{coin: -1 for coin in b_coins})
    engine.reconcile(client)
    summary = engine.summary(client)

    assert len(engine.state["positions"]) == 20
    assert engine._used_margin(WALLET_A) == 6000
    assert engine._used_margin(WALLET_B) == 6000
    assert summary["initial_usdt"] == 12000
    assert summary["initial_usdt_per_wallet"] == 6000
    assert summary["max_positions"] == 20
    assert summary["max_positions_per_wallet"] == 10
    assert summary["wallets"][WALLET_A]["initial_usdt"] == 6000
    assert summary["wallets"][WALLET_B]["initial_usdt"] == 6000


def test_closing_one_wallet_position_does_not_change_the_other_balance():
    sources = {
        WALLET_A: clearinghouse(BTC=1),
        WALLET_B: clearinghouse(ETH=-1),
    }
    engine = HyperliquidCopyEngine(
        CopySettings((WALLET_A, WALLET_B), 6000, 0.10, 2),
        MemoryStore(),
        source_fetcher=lambda address: sources[address],
    )
    client = FakeClient(["BTC", "ETH"])
    engine.reconcile(client)
    wallet_b_balance = engine._account(WALLET_B)["balance"]

    sources[WALLET_A] = clearinghouse()
    engine.reconcile(client)

    assert engine._account(WALLET_B)["balance"] == wallet_b_balance
    assert engine._account(WALLET_A)["balance"] != wallet_b_balance
