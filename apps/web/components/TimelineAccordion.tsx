import { useState, type ReactNode } from "react";
import type { AppLang } from "@/lib/locales";
import { formatTimelineEvents, shell } from "@/lib/appShellI18n";

type Props = {
  eventCount: number;
  lang: AppLang;
  live?: boolean;
  children: ReactNode;
};

/** Collapsible timeline — collapsed by default when many events. */
export function TimelineAccordion({ eventCount, lang, live = false, children }: Props) {
  const s = shell(lang);
  const [open, setOpen] = useState(() => live && eventCount <= 6);

  if (eventCount === 0) return null;

  const label = open ? s.timelineCollapse : s.timelineExpand;
  const summary = formatTimelineEvents(lang, eventCount);

  return (
    <div className={`timeline-accordion${open ? " timeline-accordion--open" : ""}`}>
      <button
        type="button"
        className="timeline-accordion-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="timeline-accordion-chevron" aria-hidden>
          {open ? "▼" : "▶"}
        </span>
        <span className="timeline-accordion-summary">{summary}</span>
        <span className="timeline-accordion-action">{label}</span>
      </button>
      {open ? <div className="timeline-accordion-body">{children}</div> : null}
    </div>
  );
}
