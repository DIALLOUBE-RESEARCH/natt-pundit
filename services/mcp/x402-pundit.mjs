import { verifyPaymentWithFacilitator, formatUsdLabel } from "./x402-facilitator-client.mjs";

export const PUNDIT_PRICE_USDC = parseFloat(process.env.PUNDIT_X402_PRICE_USDC || "0.01");
export const PUNDIT_PRICE_ATOMIC = String(
  Math.round(PUNDIT_PRICE_USDC * 1_000_000),
);

export const SOLANA_DEVNET_NETWORK =
  process.env.PUNDIT_X402_NETWORK || "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

export const SOLANA_DEVNET_USDC_MINT =
  process.env.PUNDIT_X402_USDC_MINT ||
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const PUNDIT_FEE_PAYER =
  process.env.PUNDIT_X402_FEE_PAYER ||
  "D6ZhtNQ5nT9ZnTHUbqXZsTx5MH2rPFiBBggX4hY1WePM";

export const PUBLIC_MCP_URL =
  process.env.PUBLIC_MCP_URL || "https://hypernatt.com/mcp-pundit/protocol";

export const PAID_TOOLS = new Set([
  "get_match_edge",
  "get_edge_summary",
  "get_match_odds",
  "get_live_scores",
  "get_cpi_settle_args",
  "build_escrow_deposit_tx",
  "build_escrow_settle_tx",
]);

export function getPayto() {
  return process.env.PUNDIT_X402_PAYTO || "";
}

export function isPaytoConfigured() {
  return getPayto().length > 0;
}

export function buildPaymentRequirements(toolLabel) {
  const priceLabel = `$${formatUsdLabel(PUNDIT_PRICE_USDC)}`;
  return {
    scheme: "exact",
    network: SOLANA_DEVNET_NETWORK,
    maxAmountRequired: PUNDIT_PRICE_ATOMIC,
    amount: PUNDIT_PRICE_ATOMIC,
    payTo: getPayto(),
    maxTimeoutSeconds: 120,
    asset: SOLANA_DEVNET_USDC_MINT,
    extra: { feePayer: PUNDIT_FEE_PAYER },
    resource: PUBLIC_MCP_URL,
    description: `Pay ${priceLabel} USDC on Solana devnet: ${toolLabel}`,
    mimeType: "application/json",
  };
}

export function buildPaymentRequired(tool, extraError) {
  const reqs = buildPaymentRequirements(tool);
  return {
    x402Version: 2,
    error:
      extraError ||
      `X-PAYMENT required. Pay $${formatUsdLabel(PUNDIT_PRICE_USDC)} USDC on Solana devnet.`,
    accepts: [reqs],
    mcp_hint:
      "Retry with x_payment (base64 JSON) or X-Payment header on MCP POST /messages.",
    tool,
    network: "solana-devnet",
    price_usdc: PUNDIT_PRICE_USDC,
    pay_to: getPayto(),
  };
}

export function parsePaymentHeader(raw) {
  if (!raw) throw new Error("missing");
  const paymentHeader = Array.isArray(raw) ? raw[0] : raw;
  try {
    return JSON.parse(Buffer.from(paymentHeader, "base64").toString("utf-8"));
  } catch {
    const hex = String(paymentHeader).trim();
    if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) {
      return JSON.parse(Buffer.from(hex, "hex").toString("utf-8"));
    }
    throw new Error("invalid format");
  }
}

/** F77N — always verify against server-built requirements (never client `accepted`). */
export async function verifyPayment(paymentPayload, toolOrRequirements) {
  const requirements =
    typeof toolOrRequirements === "string"
      ? buildPaymentRequirements(toolOrRequirements)
      : toolOrRequirements;
  return verifyPaymentWithFacilitator(paymentPayload, requirements);
}
