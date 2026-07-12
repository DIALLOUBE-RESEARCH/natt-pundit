"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { Fixture } from "@natt-pundit/contracts";
import type { AppLang } from "@/lib/locales";
import { formatKickoff } from "@/lib/formatLocale";
import {
  formatCountdownDigits,
  parseKickoffMs,
  splitCountdownParts,
  type CountdownParts,
} from "@/lib/kickoffCountdown";
import { kickoffCountdownCopy } from "@/lib/kickoffCountdownI18n";

type Props = {
  kickoffAt: string;
  status: Fixture["status"];
  lang: AppLang;
};

function useNowMs(tickMs: number, enabled: boolean): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [enabled, tickMs]);

  return nowMs;
}

function unitLabels(parts: CountdownParts, copy: ReturnType<typeof kickoffCountdownCopy>) {
  if (parts.days > 0) {
    return [copy.unitDays, copy.unitHours, copy.unitMinutes, copy.unitSeconds];
  }
  return [copy.unitHours, copy.unitMinutes, copy.unitSeconds];
}

function digitGroups(parts: CountdownParts): string[] {
  if (parts.days > 0) {
    return [
      String(parts.days).padStart(2, "0"),
      String(parts.hours).padStart(2, "0"),
      String(parts.minutes).padStart(2, "0"),
      String(parts.seconds).padStart(2, "0"),
    ];
  }
  return [
    String(parts.hours).padStart(2, "0"),
    String(parts.minutes).padStart(2, "0"),
    String(parts.seconds).padStart(2, "0"),
  ];
}

/** Token-driven countdown for stitch match detail (light + dark). */
export function StitchMatchCountdown({ kickoffAt, status, lang }: Props) {
  const copy = kickoffCountdownCopy(lang);
  const kickoffMs = useMemo(() => parseKickoffMs(kickoffAt), [kickoffAt]);
  const showScheduled = status === "scheduled" && kickoffMs !== null;
  const nowMs = useNowMs(1000, showScheduled);
  const parts = showScheduled && kickoffMs !== null ? splitCountdownParts(kickoffMs, nowMs) : null;

  if (status === "live" || status === "finished" || kickoffMs === null) {
    return null;
  }

  const absoluteKickoff = formatKickoff(kickoffAt, lang);

  if (!parts) {
    return (
      <div className="stitch-match-countdown stitch-match-countdown--soon" role="status">
        <p className="stitch-match-countdown-label">{copy.startingSoon}</p>
        <p className="stitch-match-countdown-schedule">
          {copy.scheduledAt} · {absoluteKickoff}
        </p>
      </div>
    );
  }

  const groups = digitGroups(parts);
  const units = unitLabels(parts, copy);

  return (
    <div className="stitch-match-countdown" role="timer" aria-live="polite">
      <p className="stitch-match-countdown-label">{copy.label}</p>
      <div
        className="stitch-match-countdown-digits"
        aria-label={`${copy.label} ${formatCountdownDigits(parts)}`}
      >
        {groups.map((g, i) => (
          <Fragment key={`${units[i]}-${i}`}>
            {i > 0 ? (
              <span className="stitch-match-countdown-sep" aria-hidden>
                :
              </span>
            ) : null}
            <span className="stitch-match-countdown-digit-group">
              <span className="stitch-match-countdown-digit">{g}</span>
              <span className="stitch-match-countdown-unit">{units[i]}</span>
            </span>
          </Fragment>
        ))}
      </div>
      <p className="stitch-match-countdown-schedule">
        {copy.scheduledAt} · {absoluteKickoff}
      </p>
    </div>
  );
}
