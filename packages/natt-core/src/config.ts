/** Public infra constants (no proprietary edge formula). */
export const CONVICTION_GAUGE_CAP = 0.2;

/**
 * TxLINE soccer full-game goal stats (Participant 1 / 2).
 * @see https://txline.txodds.com/documentation/scores/soccer-feed
 * Keys 1002/1003 are H1 period stats — NOT full-game goals.
 */
export const TXLINE_SOCCER_P1_GOALS = 1;
export const TXLINE_SOCCER_P2_GOALS = 2;
export const TXLINE_SOCCER_P1_PEN_GOALS = 5001;
export const TXLINE_SOCCER_P2_PEN_GOALS = 5002;

/** Home/away stat keys for CPI fetch (statToProve = home, statToProve2 = away). */
export type TxlineHomeAwayStatKeys = {
  homeStatKey: number;
  awayStatKey: number;
};

export function txlineHomeAwayStatKeys(participant1IsHome: boolean): TxlineHomeAwayStatKeys {
  return participant1IsHome
    ? { homeStatKey: TXLINE_SOCCER_P1_GOALS, awayStatKey: TXLINE_SOCCER_P2_GOALS }
    : { homeStatKey: TXLINE_SOCCER_P2_GOALS, awayStatKey: TXLINE_SOCCER_P1_GOALS };
}

export function txlineHomeAwayPenKeys(participant1IsHome: boolean): TxlineHomeAwayStatKeys {
  return participant1IsHome
    ? { homeStatKey: TXLINE_SOCCER_P1_PEN_GOALS, awayStatKey: TXLINE_SOCCER_P2_PEN_GOALS }
    : { homeStatKey: TXLINE_SOCCER_P2_PEN_GOALS, awayStatKey: TXLINE_SOCCER_P1_PEN_GOALS };
}

/** @deprecated Use txlineHomeAwayStatKeys — legacy misread of soccer feed encoding. */
export const TXLINE_STAT_HOME_GOALS = TXLINE_SOCCER_P1_GOALS;
/** @deprecated Use txlineHomeAwayStatKeys — legacy misread of soccer feed encoding. */
export const TXLINE_STAT_AWAY_GOALS = TXLINE_SOCCER_P2_GOALS;

export const TXLINE_PROGRAM_ID = "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA";
export const TXLINE_DEVNET_PROGRAM_ID = "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J";
export const TXL_TOKEN_MINT = "Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL";
export const TXLINE_API_BASE = "https://txline.txodds.com";
export const TXLINE_DEVNET_API_BASE = "https://txline-dev.txodds.com";

export const WC_FREE_SERVICE_LEVEL_REALTIME = 12;
export const WC_FREE_SERVICE_LEVEL_DELAY = 1;
export const SUBSCRIBE_DURATION_WEEKS = 4;
