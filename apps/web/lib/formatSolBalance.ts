/** Dot-decimal SOL string for Reown AppKit + on-chain UIs (never locale comma). */
export function formatSolBalance(sol: number, maxDigits = 4): string {
  if (!Number.isFinite(sol)) return "0.00";
  const digits = sol > 0 && sol < 0.01 ? maxDigits : 2;
  return sol.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
    useGrouping: false,
  });
}
