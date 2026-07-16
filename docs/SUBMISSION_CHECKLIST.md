# Pre-submission checklist — irreproachable pass

**Deadline:** 2026-07-19 23:59 UTC  
**Form copy-paste:** [`SUBMISSION_FORM_READY.md`](./SUBMISSION_FORM_READY.md)

---

## P0 — blocking (must be green)

| # | Item | Command / action | Status |
|---|------|------------------|--------|
| 1 | Upload demo video | https://youtu.be/5X3aXO4YfvE | ✅ |
| 2 | Mirror public repo | `.\hackathon\natt-pundit\scripts\sync-public-github.ps1 -Push` | ⏳ owner |
| 3 | Live app | https://hypernatt.com/fr/nattpundit?lang=en → 200 | ✅ |
| 4 | TxLINE health | `curl -sf .../txline/health` → `mock:false` | ✅ |
| 5 | Merkle verify | `.../18172280/proof/verify` → `valid:true` | ✅ |
| 6 | CPI args (jury demo) | `.../18209181/cpi-args?outcome=home` → 200 | ✅ |
| 7 | TxLINE feedback doc | `docs/TXLINE_FEEDBACK.md` on mirror | ✅ local |
| 8 | Superteam form filled | All fields from SUBMISSION_FORM_READY.md | ⏳ owner |

---

## P1 — jury polish (done in repo)

| Item | Status |
|------|--------|
| SUBMISSION_KIT CPI fixture = `18209181` | ✅ |
| TXLINE_SETTLEMENT explains 18172280 draw vs 18209181 home | ✅ |
| README links TXLINE_FEEDBACK | ✅ |
| Video 4:38 ≤ 5:00 | ✅ |
| 8 langs + in-app docs | ✅ |
| 228 tests documented | ✅ |
| Fail-closed knockout TAB documented | ✅ |

---

## Prod smoke (run before Submit)

```powershell
$base = "https://hypernatt.com/api/natt-pundit/txline/v1/fixtures"
Invoke-WebRequest -Uri "https://hypernatt.com/fr/nattpundit?lang=en" -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest -Uri "https://hypernatt.com/api/natt-pundit/txline/health" -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest -Uri "$base/18172280/proof/verify" -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest -Uri "$base/18209181/cpi-args?outcome=home" -UseBasicParsing | Select-Object StatusCode
```

---

## Known honest limits (not bugs — document in form)

| Topic | Verdict |
|-------|---------|
| Devnet USDC only | By design — not real money |
| Edge formula closed-source | SETUP/HOLD visible; formula proprietary |
| TAB pen winner CPI | Fail-closed refund if TxLINE Merkle gap |
| Post-deadline live matches | Archive fixtures + proof on finished games |

---

## Verdict

**Project:** ready for submission after P0 items 1, 2, 8.  
**Quality:** above track average — full settlement stack + agents + video.
