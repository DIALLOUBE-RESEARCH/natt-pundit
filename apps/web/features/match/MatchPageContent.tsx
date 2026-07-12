import Link from "next/link";
import { useRouter } from "next/router";
import { EdgeBadge, EdgeDetail } from "@/components/EdgeBadge";
import { OddsTicker } from "@/components/OddsTicker";
import { usePresent } from "@/components/present/PresentProvider";
import { SettlementProofPanel } from "@/components/SettlementProofPanel";
import { EscrowPanel } from "@/components/EscrowPanel";
import { FanBetSlip } from "@/features/betting/FanBetSlip";
import { TransparencySection } from "@/features/betting/TransparencySection";
import { fanBetUxEnabled } from "@/lib/fanUiFlag";
import { MatchKickoffCountdown } from "@/components/MatchKickoffCountdown";
import { GoalFeed } from "@/components/GoalFeed";
import { TimelineAccordion } from "@/components/TimelineAccordion";
import { TeamFlag } from "@/components/TeamFlag";
import { MatchPageLayout } from "@/features/match/MatchPageLayout";
import { StitchMatchPageView } from "@/features/match/StitchMatchPageView";
import { useMatchEdge } from "@/lib/useMatchEdge";
import { useMatchFavorites } from "@/lib/matchFavorites";
import { formatKickoff } from "@/lib/formatLocale";
import { ui } from "@/lib/i18n";
import { shell } from "@/lib/appShellI18n";
import { stitchUiEnabled } from "@/lib/stitchUiFlag";
import { resolveKnockoutWinner } from "@natt-pundit/natt-core/wcMatchRules";
import { resolveWcFormat } from "@/lib/wcMatchRules";
import { FINISHED_LABEL, LIVE_TAG, liveIndicator, PENALTIES_LABEL } from "@/lib/matchStatus";
import { penaltyShootoutScore } from "@/lib/penaltyI18n";
import { sectionCopyFor, MATCH_SECTION_COPY } from "@/lib/matchSectionCopy";
import { publicEdgeSummaryText } from "@/lib/edgePublicI18n";

export function MatchPageContent() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const { lang } = usePresent();
  const { data, error, loading } = useMatchEdge(id);
  const { isFavorite, toggleFavorite } = useMatchFavorites();
  const stitch = stitchUiEnabled;

  const t = ui(lang);
  const s = shell(lang);

  if (!id) return null;

  if (stitch) {
    return (
      <MatchPageLayout>
        {loading && !data ? <p className="stitch-panel-empty">{t.syncTxline}</p> : null}
        {error ? <p className="stitch-panel-error">{error}</p> : null}
        {data ? (
          <StitchMatchPageView
            id={id}
            data={data}
            lang={lang}
            favorited={isFavorite(id)}
            onToggleFavorite={toggleFavorite}
          />
        ) : null}
      </MatchPageLayout>
    );
  }

  const setup = data?.edge.verdict === "SETUP";
  const edgeBlock = sectionCopyFor(
    setup ? MATCH_SECTION_COPY.edgeSetup : MATCH_SECTION_COPY.edgeHold,
    lang,
  );
  const oddsBlock = sectionCopyFor(MATCH_SECTION_COPY.odds, lang);

  const clock = data?.scores?.clock;
  const phase = clock?.phase;
  const finished =
    phase === "FT" || (data?.fixture.status === "finished" && phase !== "PEN" && phase !== "ET");
  const live =
    phase === "PEN" ||
    phase === "ET" ||
    phase === "1H" ||
    phase === "2H" ||
    phase === "HT" ||
    (data?.fixture.status === "live" && phase !== "FT");
  const statusHint = data ? liveIndicator(data.fixture.status, clock, t, lang) : "";
  const score = data?.fixture.score;
  const penScore = data?.scores?.penScore;
  const wcFormat = data ? resolveWcFormat(data.fixture) : "group";
  const knockoutWinner =
    wcFormat === "knockout" && score
      ? resolveKnockoutWinner(score, penScore)
      : null;
  const homeWin =
    !!finished &&
    !!score &&
    (knockoutWinner ? knockoutWinner === "home" : score.home > score.away);
  const awayWin =
    !!finished &&
    !!score &&
    (knockoutWinner ? knockoutWinner === "away" : score.away > score.home);

  const body = (
    <>
      <p className="match-page-label">{t.matchDetailsLabel}</p>
      <Link href="/" className="match-back">
        {t.backFixtures}
      </Link>

      {loading && !data && <p className="match-loading">{t.syncTxline}</p>}
      {error && <p className="match-error">{error}</p>}

      {data && (
        <>
          <header className="match-header glass-panel">
            <p className="match-competition">{data.fixture.competition ?? s.worldCupFallback}</p>
            <div className="match-title-row">
              <TeamFlag team={data.fixture.homeTeam} size="xl" variant="circle" muted={awayWin} />
              <h1 className="match-title">
                <span className={homeWin ? "match-title-win" : awayWin ? "match-title-lose" : ""}>
                  {data.fixture.homeTeam}
                </span>
                <span className="match-title-vs">{t.matchVs}</span>
                <span className={awayWin ? "match-title-win" : homeWin ? "match-title-lose" : ""}>
                  {data.fixture.awayTeam}
                </span>
              </h1>
              <TeamFlag team={data.fixture.awayTeam} size="xl" variant="circle" muted={homeWin} />
            </div>
            <MatchKickoffCountdown
              kickoffAt={data.fixture.kickoffAt}
              status={data.fixture.status}
              lang={lang}
            />
            <p className="match-score">
              {score ? (
                <>
                  <span className={homeWin ? "ms-win" : awayWin ? "ms-lose" : ""}>{score.home}</span>
                  <span className="ms-sep"> - </span>
                  <span className={awayWin ? "ms-win" : homeWin ? "ms-lose" : ""}>{score.away}</span>
                  {penScore ? (
                    <span className="match-pen-score">
                      {" "}
                      ({PENALTIES_LABEL[lang]} {penScore.home}-{penScore.away})
                    </span>
                  ) : null}
                </>
              ) : (
                formatKickoff(data.fixture.kickoffAt, lang)
              )}
            </p>
            <div className="match-header-toolbar">
              <div className="match-header-status">
                {phase === "PEN" ? (
                  <p className="match-live-badge match-pen-badge">
                    <span className="match-live-badge-dot" aria-hidden />
                    {PENALTIES_LABEL[lang]}
                    {penScore ? ` ${penScore.home}-${penScore.away}` : ""}
                  </p>
                ) : live ? (
                  <p className="match-live-badge">
                    <span className="match-live-badge-dot" aria-hidden />
                    {LIVE_TAG[lang]}
                    {statusHint ? <span className="match-live-badge-min"> · {statusHint}</span> : null}
                  </p>
                ) : finished ? (
                  <>
                    <p className="match-ft-badge">✓ {FINISHED_LABEL[lang]}</p>
                    {penScore ? (
                      <p className="match-pen-finished-note">
                        {penaltyShootoutScore(lang, penScore.home, penScore.away)}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </header>

          {data.scores && (data.scores.events.length > 0 || data.scores.penScore != null) ? (
            <section className="goal-feed-panel glass-panel">
              <h2 className="section-title">{s.timelineTitle}</h2>
              <TimelineAccordion
                eventCount={data.scores.events.length}
                lang={lang}
                live={data.fixture.status === "live"}
              >
                <GoalFeed
                  events={data.scores.events}
                  homeTeam={data.fixture.homeTeam}
                  awayTeam={data.fixture.awayTeam}
                  penScore={data.scores.penScore}
                  lang={lang}
                />
              </TimelineAccordion>
            </section>
          ) : null}

          {data.odds.length > 0 ? (
            <section className="odds-panel glass-panel">
              <h2 className="section-title">{oddsBlock.title}</h2>
              <OddsTicker
                odds={data.odds}
                scroll={false}
                lang={lang}
                homeTeam={data.fixture.homeTeam}
                awayTeam={data.fixture.awayTeam}
                wcFormat={wcFormat}
              />
            </section>
          ) : null}

          <section className="edge-panel glass-panel">
            <h2 className="section-title">{edgeBlock.title}</h2>
            <div className="edge-panel-top">
              <EdgeBadge verdict={data.edge} />
            </div>
            <p className="edge-why">
              {publicEdgeSummaryText(
                data.edge,
                data.fixture.homeTeam,
                data.fixture.awayTeam,
                lang,
              )}
            </p>
            <EdgeDetail
              verdict={data.edge}
              homeTeam={data.fixture.homeTeam}
              awayTeam={data.fixture.awayTeam}
              consensus={data.consensus}
              wcFormat={wcFormat}
              lang={lang}
            />
          </section>

          <section className="settlement-stack">
            <h2 className="section-title">{t.settlementTitle}</h2>
            {fanBetUxEnabled ? (
              <>
                <FanBetSlip
                  fixtureId={id}
                  kickoffAt={data.fixture.kickoffAt}
                  homeTeam={data.fixture.homeTeam}
                  awayTeam={data.fixture.awayTeam}
                  status={data.fixture.status}
                  wcFormat={wcFormat}
                  score={data.fixture.score}
                  penScore={data.scores?.penScore}
                />
                <TransparencySection
                  fixtureId={id}
                  fixtureStatus={data.fixture.status}
                  score={data.fixture.score}
                />
              </>
            ) : (
              <>
                <EscrowPanel
                  fixtureId={id}
                  kickoffAt={data.fixture.kickoffAt}
                  homeTeam={data.fixture.homeTeam}
                  awayTeam={data.fixture.awayTeam}
                  status={data.fixture.status}
                  wcFormat={wcFormat}
                  score={data.fixture.score}
                  penScore={data.scores?.penScore}
                />
                <SettlementProofPanel
                  fixtureId={id}
                  fixtureStatus={data.fixture.status}
                  score={data.fixture.score}
                />
              </>
            )}
          </section>
        </>
      )}
    </>
  );

  return <div className="match-page">{body}</div>;
}
