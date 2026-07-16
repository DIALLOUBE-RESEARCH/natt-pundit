# Superteam Earn — form copy-paste (World Cup Track)

**Fill after:** YouTube upload + `sync-public-github.ps1 -Push`  
**Replace:** `[YOUTUBE_URL]` and `[TWEET_URL]` before submit.

---

## Link to Your Submission (primary — use live app)

```
https://hypernatt.com/fr/nattpundit?lang=en
```

---

## Project Title

```
Natt Settlement — TxLINE-Powered Solana Prediction Market Settlement
```

---

## Briefly explain your Project

```
Natt Settlement turns TxLINE World Cup feeds into trustless Solana prediction-market settlement on devnet USDC (demo — not real money).

Fans and AI agents see live fixtures, odds, and SETUP/HOLD edge badges. When a match finishes, TxLINE publishes a Merkle stat-validation proof. Our gateway verifies it off-chain, then an Anchor escrow CPI-calls TxLINE validate_stat on Solana devnet. A permissionless keeper settles pools; users only sign deposit and claim.

Includes: 8-language mobile web app, Data Lab (CLV harness), 20-tool MCP server for Cursor/Claude agents, and an autonomous CDP wallet betting loop. Fail-closed by design — no payout without a verifiable TxLINE proof.
```

---

## Link to your live & working MVP

```
https://hypernatt.com/fr/nattpundit?lang=en
```

Alt links (optional in "Anything Else"):

- Data Lab: https://hypernatt.com/fr/nattpundit/datas?lang=en
- Agent dashboard: https://hypernatt.com/fr/nattpundit/agent?lang=en
- MCP health: https://hypernatt.com/mcp-pundit/health

---

## Link to Your Live Demo Video

```
https://youtu.be/5X3aXO4YfvE
```

Title on YouTube: `Natt Settlement — TxLINE World Cup Hackathon Demo` (4:39, 9:16 vertical).

---

## Project's Public Repository Link

```
https://github.com/DIALLOUBE-RESEARCH/natt-pundit
```

---

## Link to your Project's Technical Documentation

```
https://github.com/DIALLOUBE-RESEARCH/natt-pundit/blob/main/docs/QUICKSTART_JURY.md
```

Also:

- Settlement deep dive: https://github.com/DIALLOUBE-RESEARCH/natt-pundit/blob/main/docs/TXLINE_SETTLEMENT.md
- Smoke + curls: https://github.com/DIALLOUBE-RESEARCH/natt-pundit/blob/main/docs/SUBMISSION_KIT.md
- TxLINE feedback: https://github.com/DIALLOUBE-RESEARCH/natt-pundit/blob/main/docs/TXLINE_FEEDBACK.md

---

## Link to X Profile or post

```
[TWEET_URL]
```

---

## Share your team's experience using the TxLINE API

```
Liked: normalised fixtures/odds JSON, stat-validation Merkle proofs (reproducible off-chain + CPI on-chain), guest auth flow, and SSE score updates for live UI + keeper timing. Hackathon zero-fee access made a real settlement demo possible.

Friction: knockout matches decided on penalties — Merkle goal stats often prove regulation scores only, not shootout winner (fixtures 18176123, 18172280). We fail-closed (refund) instead of guessing. CPI /cpi-args outcome must match what TxLINE can prove (demo: 18209181 outcome=home for FT 2-0; 18172280 use outcome=draw for regulation tie). Stat key docs (1002/1003 vs 1/2) could be clearer.

Full write-up: https://github.com/DIALLOUBE-RESEARCH/natt-pundit/blob/main/docs/TXLINE_FEEDBACK.md
```

---

## Anything Else?

```
TxLINE endpoints used: guest/start, token/activate, fixtures/snapshot, odds/snapshot, scores/snapshot, scores/updates (SSE), stat-validation.

On-chain: Solana devnet escrow GPSU49hPRqWeEtTyMghWLWrXagV8hobFPkbFKVK3jxUD — CPI validate_stat.

MCP for agents: https://hypernatt.com/mcp-pundit/protocol (20 tools).

Smoke: curl https://hypernatt.com/api/natt-pundit/txline/v1/fixtures/18209181/cpi-args?outcome=home
```

---

## Pre-submit checkbox

- [ ] YouTube video public or unlisted, plays without login
- [ ] `sync-public-github.ps1 -Push` done (mirror has TXLINE_FEEDBACK.md)
- [ ] Open app in incognito — fixtures load
- [ ] Confirm checkbox on Superteam form
