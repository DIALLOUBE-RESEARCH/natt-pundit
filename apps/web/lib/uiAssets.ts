import heroBg from "../public/ui/hero-bg.webp";
import cardTexture from "../public/ui/card-texture.webp";
import headerStrip from "../public/ui/header-strip.webp";
import stitchLightHero from "../public/ui/stitch-light-hero.webp";
import stitchMockupOverlay from "../public/ui/stitch-mockup-overlay.webp";
import nShieldLogo from "../public/ui/n-shield-logo.png";
import metlifeStadium from "../public/ui/stadiums/metlife-stadium.webp";
import aztecaStadium from "../public/ui/stadiums/azteca-stadium.webp";
import sofiStadium from "../public/ui/stadiums/sofi-stadium.webp";
import mercedesBenzStadium from "../public/ui/stadiums/mercedes-benz-stadium.webp";
import metlifeStadiumNight from "../public/ui/stadiums/night/metlife-stadium-night.webp";
import aztecaStadiumNight from "../public/ui/stadiums/night/azteca-stadium-night.webp";
import sofiStadiumNight from "../public/ui/stadiums/night/sofi-stadium-night.webp";
import mercedesBenzStadiumNight from "../public/ui/stadiums/night/mercedes-benz-stadium-night.webp";
import type { StitchThemeMode } from "@/shared/theme/stitchTheme";
import txoddsLogo from "../public/branding/txodds-logo.webp";
import contestLogo from "../public/branding/contest-logo.avif";

/** Bundled via webpack — nginx regex was stealing /public/*.webp */
export const UI_ASSETS = {
  heroBg: heroBg.src,
  cardTexture: cardTexture.src,
  headerStrip: headerStrip.src,
  stitchLightHero: stitchLightHero.src,
  stitchMockupOverlay: stitchMockupOverlay.src,
  nShieldLogo: nShieldLogo.src,
} as const;

/** Nano Banana Pro — per-card stadium backgrounds (F67N light glass) */
export const STITCH_STADIUM_ASSETS = {
  metlife: metlifeStadium.src,
  azteca: aztecaStadium.src,
  sofi: sofiStadium.src,
  mercedes: mercedesBenzStadium.src,
} as const;

/** F89N — Nano Banana night variants (dark mode sandbox cards only). */
export const STITCH_STADIUM_ASSETS_DARK = {
  metlife: metlifeStadiumNight.src,
  azteca: aztecaStadiumNight.src,
  sofi: sofiStadiumNight.src,
  mercedes: mercedesBenzStadiumNight.src,
} as const;

export type StitchStadiumKey = keyof typeof STITCH_STADIUM_ASSETS;

/** Display labels aligned with STITCH_STADIUM_ASSETS keys (card header). */
export const STITCH_STADIUM_LABELS: Record<StitchStadiumKey, string> = {
  metlife: "MetLife Stadium",
  azteca: "Estadio Azteca",
  sofi: "SoFi Stadium",
  mercedes: "Mercedes-Benz Stadium",
};

export function stitchStadiumLabel(key: StitchStadiumKey): string {
  return STITCH_STADIUM_LABELS[key];
}

export function stitchStadiumAssetForTheme(
  key: StitchStadiumKey,
  mode: StitchThemeMode,
): string {
  return mode === "dark" ? STITCH_STADIUM_ASSETS_DARK[key] : STITCH_STADIUM_ASSETS[key];
}

export const BRAND_ASSETS = {
  txoddsLogo: txoddsLogo.src,
  contestLogo: contestLogo.src,
} as const;
