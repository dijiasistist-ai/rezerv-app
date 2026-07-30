# Futures paper laboratory

The Tyee Render worker runs five independent virtual perpetual accounts against
Binance's public futures prices. It also follows two Hyperliquid source wallets
in a separate paper-copy account. Live order placement remains disabled.

## Shared rules

- Initial virtual balance: 6,000 USDT per strategy
- Isolated leverage model: 2x
- Initial margin per trade: 20% of that strategy's available balance
- One open position per strategy
- Take profit: 3% position ROE
- Stop: strategy/ATR based, at least 1.5% position ROE
- Fee model: 0.05% taker fee on entry and exit
- Longs enter at ask and exit/mark at bid; shorts enter at bid and exit/mark at ask
- The five strategies scan the top 50 liquid USDT perpetual markets every 30 seconds
- Open positions are managed by an independent real-time supervisor
- Results accumulate continuously; there is no time-based forced exit

## Strategies

1. `trend_breakout`
2. `pullback_reclaim`
3. `liquidity_sweep`
4. `selective_trend_pullback`
5. `bollinger_reversion` (15-minute signal timeframe)

## Signal observation and meta-filter research

Every primary-strategy candidate receives a stable `observation_id`. Accepted
entries and their eventual outcomes are joined by that ID and appended to
`avax-signal-observations.jsonl` through Tyee's authenticated ingest endpoint.
Futures context is requested lazily only when a candidate exists. The bounded
8 MB JSONL file is included in the encrypted runtime backup, so deploys do not
erase the research trail.

`scripts/train_signal_meta_filter.py` trains an offline logistic acceptance
model after at least 300 labeled trades. It uses a chronological split and
embargo, and cannot activate or alter the running bot. A model that passes its
fixed research gate still needs a separate forward paper test.

## Reported metrics

- `position_roi_pct`: fee-adjusted PnL divided by the position's initial margin
- `wallet_roi_pct`: marked-to-market strategy equity versus its initial 1,000 USDT
- realized balance, trade count, wins, win rate, max drawdown and profit factor

The worker emits `FUTURES TOURNAMENT EVENT` for opens/closes and
`FUTURES TOURNAMENT SCORE` for snapshots. Tournament and copy state use the
Tyee remote state endpoint when configured, with Postgres and local-file
fallbacks.
