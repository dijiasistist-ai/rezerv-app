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
            {"position": {"coin": coin, "szi": str(size)}}
            for coin, size in positions.items()
            if size
        ]
    }


def test_baseline_is_not_entered_and_multiple_new_positions_are_mirrored():
    sources = {WALLET_A: clearinghouse(BTC=1), WALLET_B: clearinghouse()}
    store = MemoryStore()
    engine = HyperliquidCopyEngine(
        CopySettings((WALLET_A, WALLET_B), 6000, 0.10, 2),
        store,
        source_fetcher=lambda address: sources[address],
    )
    client = FakeClient(["BTC", "ETH", "SOL"])

    assert engine.reconcile(client) == []
    assert engine.state["positions"] == {}
    assert len(engine.state["ignored_until_flat"]) == 1

    sources[WALLET_A] = clearinghouse()
    engine.reconcile(client)
    sources[WALLET_A] = clearinghouse(ETH=3)
    sources[WALLET_B] = clearinghouse(SOL=-4)
    events = engine.reconcile(client)

    assert [event["event"] for event in events] == ["open", "open"]
    assert len(engine.state["positions"]) == 2
    assert {row["side"] for row in engine.state["positions"].values()} == {
        "long",
        "short",
    }
    assert all(row["remaining_margin"] == 600 for row in engine.state["positions"].values())
    assert all(row["notional"] == 1200 for row in engine.state["positions"].values())


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
