/**
 * CDP x402 facilitator verify/settle — fork Terminal MCP (F72N devnet).
 */
import axios from "axios";
import {
  formatFacilitatorErrorForStorage,
  parseCdpFacilitatorError,
} from "./x402-facilitator-error.mjs";
import { createAuthHeader, createCorrelationHeader } from "@coinbase/x402";

const DEFAULT_FACILITATOR =
  process.env.PUNDIT_X402_FACILITATOR_URL ||
  process.env.X402_FACILITATOR_URL ||
  "https://api.cdp.coinbase.com/platform/v2/x402";
const VERIFY_PATH = "/platform/v2/x402/verify";
const SETTLE_PATH = "/platform/v2/x402/settle";
const REQUEST_HOST = "api.cdp.coinbase.com";

export function formatUsdLabel(price) {
  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) return "0.00";
  if (p >= 0.01) return p.toFixed(2);
  return p.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function verifyUrl() {
  return `${String(DEFAULT_FACILITATOR).replace(/\/$/, "")}/verify`;
}

function settleUrl() {
  return `${String(DEFAULT_FACILITATOR).replace(/\/$/, "")}/settle`;
}

async function buildAuthHeaders(requestPath) {
  const headers = {
    "Content-Type": "application/json",
    "Correlation-Context": createCorrelationHeader(),
  };
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  if (apiKeyId && apiKeySecret) {
    headers.Authorization = await createAuthHeader(
      apiKeyId,
      apiKeySecret,
      "POST",
      REQUEST_HOST,
      requestPath,
    );
  }
  return headers;
}

export function normalizePaymentRequirements(req) {
  const amount = req?.amount ?? req?.maxAmountRequired ?? "0";
  const isSvm =
    typeof req?.network === "string" &&
    req.network.trim().toLowerCase().startsWith("solana");
  const payTo = isSvm ? String(req.payTo || "") : String(req.payTo || "").toLowerCase();
  const asset = isSvm ? String(req.asset || "") : String(req.asset || "").toLowerCase();
  return {
    scheme: req.scheme,
    network: req.network,
    asset,
    amount: String(amount),
    payTo,
    maxTimeoutSeconds: req.maxTimeoutSeconds ?? 120,
    extra: req.extra ?? {},
    ...(req.resource ? { resource: req.resource } : {}),
    ...(req.description ? { description: req.description } : {}),
    ...(req.mimeType ? { mimeType: req.mimeType } : {}),
  };
}

export async function verifyPaymentWithFacilitator(paymentPayload, paymentRequirements) {
  if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
    return {
      isValid: false,
      error: "CDP_API_KEY_ID/SECRET missing on natt-pundit-mcp",
    };
  }
  try {
    const response = await axios.post(
      verifyUrl(),
      {
        x402Version: 2,
        paymentPayload,
        paymentRequirements: normalizePaymentRequirements(paymentRequirements),
      },
      { headers: await buildAuthHeaders(VERIFY_PATH), timeout: 10000 },
    );
    if (response.data?.isValid) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: response.data?.invalidReason || "Payment verification failed",
    };
  } catch (err) {
    const parsed = parseCdpFacilitatorError(err);
    return { isValid: false, error: formatFacilitatorErrorForStorage(parsed) };
  }
}

export async function settlePaymentWithFacilitator(paymentPayload, paymentRequirements) {
  if (!process.env.CDP_API_KEY_ID || !process.env.CDP_API_KEY_SECRET) {
    return { success: false, error: "CDP_API_KEY_ID/SECRET missing" };
  }
  try {
    const response = await axios.post(
      settleUrl(),
      {
        x402Version: 2,
        paymentPayload,
        paymentRequirements: normalizePaymentRequirements(paymentRequirements),
      },
      { headers: await buildAuthHeaders(SETTLE_PATH), timeout: 15000 },
    );
    return {
      success: response.data?.success === true,
      txHash: response.data?.transaction,
      error: response.data?.errorReason,
    };
  } catch (err) {
    const parsed = parseCdpFacilitatorError(err);
    return { success: false, error: formatFacilitatorErrorForStorage(parsed) };
  }
}
