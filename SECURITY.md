# Security

Natt Pundit is a **read-only fan experience** for the TxODDS World Cup hackathon. It is **not** a bookmaker and does not custody funds or execute trades.

## What we never ask for

- Production trading vault private keys
- Ethereum mainnet keys for trading
- Production HyperNatt API secrets

## TxLINE activation

The `/activate` flow uses your **Solana wallet** to prove an on-chain TxLINE subscription. Only the resulting **apiToken** belongs in server env (`TXLINE_API_TOKEN`) — never commit it.

## Reporting

Open a GitHub issue on this repo or contact the maintainer via https://hypernatt.com .
