/** Pre-registered constants — do not tune after hackathon submit. */
export const EPSILON_NET = 0.03;
export const COMBINE_ALPHA = 1;
export const COMBINE_BETA = 1;

/** pi_model feature coefficients (F67N AUDIT 240 — fixed before data review). */
export const MODEL_SCORE_COEF = 0.04;
export const MODEL_MOMENTUM_COEF = 0.12;
export const MODEL_MINUTE_COEF = 0.002;
export const MODEL_DRAW_TIE_BONUS = 0.02;
export const MODEL_MAX_ADJ = 0.1;

/** TxLINE soccer stat keys (on-chain validation docs). */
export const TXLINE_STAT_HOME_GOALS = 1002;
export const TXLINE_STAT_AWAY_GOALS = 1003;

/** @deprecated legacy crowd proxy — kept for reference only */
export const EDGE_MIN = 0.08;
export const CROWD_WEIGHT = 0.6;
export const ORACLE_WEIGHT = 0.4;

export const TXLINE_PROGRAM_ID = "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA";
export const TXL_TOKEN_MINT = "Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL";
export const TXLINE_API_BASE = "https://txline.txodds.com";

/** WC free tier — real-time (SPEC: prefer live for jury). */
export const WC_FREE_SERVICE_LEVEL_REALTIME = 12;
export const WC_FREE_SERVICE_LEVEL_DELAY = 1;
export const SUBSCRIBE_DURATION_WEEKS = 4;
