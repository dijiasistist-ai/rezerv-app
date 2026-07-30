# AVAX paper tournament

The Render worker runs three independent virtual AVAX/USDT perpetual accounts
against Binance's current public futures prices for 48 hours.

## Shared rules

- Initial virtual balance: 1,000 USDT per strategy
- Isolated leverage model: 2x
- Initial margin per trade: 20% of that strategy's available balance
- One open position per strategy
- Take profit: 5.5% position ROE (2.75% underlying price move at 2x)
- Stop: 1.8 ATR, bounded to a 0.6%-1.8% underlying move
- Fee model: 0.05% taker fee on entry and exit
- Longs enter at ask and exit/mark at bid; shorts enter at bid and exit/mark at ask
- Open positions are marked to market and closed when the 48-hour experiment ends

## Strategies

1. `trend_breakout`: 4h/1h regime, ADX, volume and 15m 20-bar breakout.
2. `pullback_reclaim`: higher-timeframe trend, EMA21 pullback and EMA9 reclaim.
3. `liquidity_sweep`: a local high/low is swept by a wick and price closes back
   inside the prior range.

## Reported metrics

- `position_roi_pct`: fee-adjusted PnL divided by the position's initial margin
- `wallet_roi_pct`: marked-to-market strategy equity versus its initial 1,000 USDT
- realized balance, trade count, wins, win rate, max drawdown and profit factor

The worker emits `AVAX TOURNAMENT EVENT` for opens/closes and
`AVAX TOURNAMENT SCORE` once per completed 15-minute candle. State is written
atomically to `AVAX_BOT_PAPER_STATE_PATH`. The default `/tmp` path survives
ordinary process restarts in the same instance but not an instance replacement;
the event log is the secondary audit trail.
