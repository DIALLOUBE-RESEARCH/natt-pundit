type Props = {
  mode: "light" | "dark";
  onChange: (mode: "light" | "dark") => void;
};

/** iOS-style theme switch — clic anywhere sur le pill pour basculer. */
export function StitchThemeToggle({ mode, onChange }: Props) {
  const isLight = mode === "light";

  return (
    <button
      type="button"
      className="stitch-theme-toggle"
      data-mode={mode}
      role="switch"
      aria-checked={!isLight}
      aria-label={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
      onClick={() => onChange(isLight ? "dark" : "light")}
    >
      <span className="stitch-theme-toggle-thumb" aria-hidden />
      <span className="stitch-theme-toggle-icon stitch-theme-toggle-icon--sun" aria-hidden>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14.25 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      </span>
      <span className="stitch-theme-toggle-icon stitch-theme-toggle-icon--moon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      </span>
    </button>
  );
}
