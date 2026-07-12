const introUsed = new Map();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function isIntroFreeEnabled() {
  const v = process.env.PUNDIT_X402_INTRO_FREE_ENABLED;
  if (v === undefined || v === "") return true;
  return v === "true" || v === "1";
}

/** Hackathon mode: paid tools free on devnet; x402 still works if x_payment sent. */
export function isDevnetOpenAccess() {
  const v = process.env.PUNDIT_X402_DEVNET_OPEN_ACCESS;
  if (v === undefined || v === "") return false;
  return v === "true" || v === "1";
}

export function juryBypassWallets() {
  return (process.env.PUNDIT_X402_JURY_BYPASS_WALLETS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isJuryBypassWallet(wallet) {
  if (!wallet || typeof wallet !== "string") return false;
  return juryBypassWallets().includes(wallet.trim());
}

/** One free paid-tool call per tool / agent_wallet / UTC day. */
export function consumeIntroFree(tool, agentWallet) {
  if (!isIntroFreeEnabled()) return false;
  const key = `${todayKey()}:${tool}:${agentWallet || "anon"}`;
  if (introUsed.has(key)) return false;
  introUsed.set(key, true);
  return true;
}
