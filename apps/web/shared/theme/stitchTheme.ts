export type StitchThemeMode = "light" | "dark";

export const STITCH_THEME_STORAGE_KEY = "natt-pundit-stitch-theme";

const THEME_COLORS: Record<StitchThemeMode, string> = {
  light: "#ffffff",
  dark: "#0b0f17",
};

const APPKIT_THEME_VARS: Record<StitchThemeMode, Record<string, string>> = {
  light: {
    "--w3m-accent": "#C8A951",
    "--w3m-color-mix": "#f8fafc",
    "--w3m-color-mix-strength": "20",
    "--w3m-border-radius-master": "12px",
    "--apkt-accent": "#C8A951",
    "--apkt-color-mix": "#f8fafc",
    "--apkt-color-mix-strength": "20",
    "--apkt-border-radius-master": "12px",
  },
  dark: {
    "--w3m-accent": "#818cf8",
    "--w3m-color-mix": "#1e293b",
    "--w3m-color-mix-strength": "58",
    "--w3m-border-radius-master": "12px",
    "--apkt-accent": "#818cf8",
    "--apkt-color-mix": "#1e293b",
    "--apkt-color-mix-strength": "58",
    "--apkt-border-radius-master": "12px",
  },
};

export function normalizeStitchTheme(value: string | null | undefined): StitchThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function readStoredStitchTheme(): StitchThemeMode | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STITCH_THEME_STORAGE_KEY);
  if (!stored) return null;
  return normalizeStitchTheme(stored);
}

export function storeStitchTheme(mode: StitchThemeMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STITCH_THEME_STORAGE_KEY, mode);
}

/** Sync Reown AppKit modal theme when available. */
export function syncStitchAppKitTheme(mode: StitchThemeMode): void {
  if (typeof window === "undefined") return;
  void import("@/features/wallet/nattPunditAppKit")
    .then(({ ensureNattPunditAppKit, syncNattPunditAppKitTheme }) => {
      if (ensureNattPunditAppKit()) {
        syncNattPunditAppKitTheme(mode);
      }
    })
    .catch(() => {
      /* AppKit not loaded yet — init will read stored theme */
    });
}

/** Apply stitch theme on <html>. */
export function applyStitchTheme(mode: StitchThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLORS[mode]);
  }

  syncStitchAppKitTheme(mode);
}

export function getStitchAppKitThemeMode(): StitchThemeMode {
  return readStoredStitchTheme() ?? "light";
}

export function getStitchAppKitThemeVariables(): Record<string, string> {
  return APPKIT_THEME_VARS[getStitchAppKitThemeMode()];
}

export function getStitchAppKitThemeVariablesForMode(mode: StitchThemeMode): Record<string, string> {
  return APPKIT_THEME_VARS[mode];
}
