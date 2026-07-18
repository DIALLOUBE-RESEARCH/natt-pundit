# Pre-submission checklist — irreproachable pass

**Deadline:** 2026-07-19 23:59 UTC  
**Status:** **SUBMITTED** (owner 2026-07-17) — form Superteam Earn depose.  
**Form copy-paste:** [`SUBMISSION_FORM_READY.md`](./SUBMISSION_FORM_READY.md)

---

## P0 — blocking (must be green)

| # | Item | Command / action | Status |
|---|------|------------------|--------|
| 1 | Upload demo video | https://youtu.be/5X3aXO4YfvE | ✅ |
| 2 | Mirror public repo | https://github.com/DIALLOUBE-RESEARCH/natt-pundit | ✅ |
| 3 | Live app | https://hypernatt.com/fr/nattpundit?lang=en → 200 | ✅ |
| 4 | TxLINE health | `curl -sf .../txline/health` → `mock:false` | ✅ |
| 5 | Merkle verify | `.../18172280/proof/verify` → `valid:true` | ✅ |
| 6 | CPI args (jury demo) | `.../18209181/cpi-args?outcome=home` → 200 | ✅ |
| 7 | TxLINE feedback doc | `docs/TXLINE_FEEDBACK.md` on mirror | ✅ |
| 8 | Superteam form filled | All fields from SUBMISSION_FORM_READY.md | ✅ SUBMITTED 2026-07-17 |

---

## P1 — jury polish (done in repo)

| Item | Status |
|------|--------|
| SUBMISSION_KIT CPI fixture = `18209181` | ✅ |
| TXLINE_SETTLEMENT explains 18172280 draw vs 18209181 home | ✅ |
| README links TXLINE_FEEDBACK | ✅ |
| Video 4:38 ≤ 5:00 | ✅ (~4:39 YouTube) |
| 8 langs + in-app docs | ✅ |
| 228 tests documented | ✅ |
| Fail-closed knockout TAB documented | ✅ |

---

## Prod smoke (post-submit / jury)

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

**Project:** **SUBMITTED** 2026-07-17 — P0 all green.  
**Quality:** full settlement stack + agents + video. Mode = jury wait / maintenance only.
