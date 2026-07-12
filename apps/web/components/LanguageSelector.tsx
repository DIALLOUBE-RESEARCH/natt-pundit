import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePresent } from "@/components/present/PresentProvider";
import { APP_LANGUAGES, type AppLang } from "@/lib/locales";
import { shell } from "@/lib/appShellI18n";

type LanguageSelectorProps = {
  /** default = legacy dark header; stitch = Natt Pundit glass header */
  variant?: "default" | "stitch";
};

export function LanguageSelector({ variant = "default" }: LanguageSelectorProps) {
  const { lang, setLang } = usePresent();
  const s = shell(lang);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const current = APP_LANGUAGES.find((l) => l.code === lang) ?? APP_LANGUAGES[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dropdownWidth = 170;
    let right = window.innerWidth - rect.right;
    const maxRight = window.innerWidth - dropdownWidth - 10;
    if (right > maxRight) right = maxRight;
    setPos({ top: rect.bottom + 8, right });
  }, [open]);

  const pick = (code: AppLang) => {
    setLang(code);
    setOpen(false);
  };

  const menu =
    open && mounted
      ? createPortal(
          <>
            <div className="lang-menu-backdrop" onClick={() => setOpen(false)} aria-hidden />
            <div
              className={
                variant === "stitch"
                  ? "lang-menu-dropdown lang-menu-dropdown--stitch"
                  : "lang-menu-dropdown"
              }
              style={{ top: pos.top, right: pos.right }}
              role="listbox"
              aria-label={s.ariaLanguage}
            >
              {APP_LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`lang-menu-item${variant === "stitch" ? " lang-menu-item--stitch" : ""}${
                    item.code === lang ? " lang-menu-item--active" : ""
                  }`}
                  role="option"
                  aria-selected={item.code === lang}
                  onClick={() => pick(item.code)}
                >
                  <span>{item.flag}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className={variant === "stitch" ? "lang-selector lang-selector--stitch" : "lang-selector"}>
      <button
        ref={btnRef}
        type="button"
        className={variant === "stitch" ? "stitch-btn-lang lang-toggle--stitch" : "lang-toggle"}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={s.ariaLanguage}
        title={current.name}
      >
        <span aria-hidden>{current.flag}</span>
        <span className="lang-toggle-code">{current.code.toUpperCase()}</span>
        {variant === "stitch" ? (
          <svg
            className={`lang-toggle-chevron lang-toggle-chevron--stitch${open ? " is-open" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : (
          <svg className="lang-toggle-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>
      {menu}
    </div>
  );
}
