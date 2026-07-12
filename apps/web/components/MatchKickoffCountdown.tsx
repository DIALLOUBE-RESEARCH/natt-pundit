import { useEffect, useMemo, useState } from "react";
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

export function MatchKickoffCountdown({ kickoffAt, status, lang }: Props) {
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
      <div className="match-kickoff-countdown match-kickoff-countdown--soon" role="status">
        <p className="match-kickoff-label">{copy.startingSoon}</p>
        <p className="match-kickoff-absolute">
          {copy.scheduledAt} · {absoluteKickoff}
        </p>
      </div>
    );
  }

  const groups = digitGroups(parts);
  const units = unitLabels(parts, copy);

  return (
    <div className="match-kickoff-countdown" role="timer" aria-live="polite">
      <p className="match-kickoff-label">{copy.label}</p>
      <div className="match-kickoff-digits-row" aria-label={`${copy.label} ${formatCountdownDigits(parts)}`}>
        {groups.map((g, i) => (
          <span key={`${units[i]}-${i}`} className="match-kickoff-digit-wrap">
            {i > 0 ? <span className="match-kickoff-sep" aria-hidden>:</span> : null}
            <span className="match-kickoff-digit-group">
              <span className="match-kickoff-digit">{g}</span>
              <span className="match-kickoff-unit">{units[i]}</span>
            </span>
          </span>
        ))}
      </div>
      <p className="match-kickoff-absolute">
        {copy.scheduledAt} · {absoluteKickoff}
      </p>
    </div>
  );
}
