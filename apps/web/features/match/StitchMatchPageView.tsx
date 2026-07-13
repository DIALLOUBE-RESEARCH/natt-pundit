import type { PublicMatchEdge } from "@natt-pundit/contracts";
import { SettlementProofPanel } from "@/components/SettlementProofPanel";
import { EscrowPanel } from "@/components/EscrowPanel";
import { FanBetSlip } from "@/features/betting/FanBetSlip";
import { TransparencySection } from "@/features/betting/TransparencySection";
import { LiquidGlassPillLink } from "@/design-system/glass/LiquidGlassPill";
import { fanBetUxEnabled } from "@/lib/fanUiFlag";
import { GoalFeed } from "@/components/GoalFeed";
import { TimelineAccordion } from "@/components/TimelineAccordion";
import { StitchPanelFooter } from "@/components/stitch/StitchPanelFooter";
import { MatchDetailHero } from "@/features/match/stitch/MatchDetailHero";
import { StitchMatchSection } from "@/features/match/stitch/StitchMatchSection";
import { StitchEdgePanel } from "@/features/match/stitch/StitchEdgePanel";
import { fixtureToStitchCard, matchEdgeToSummaryItem } from "@/lib/stitchCardModel";
import { sectionCopyFor, MATCH_SECTION_COPY } from "@/lib/matchSectionCopy";
import { ui } from "@/lib/i18n";
import { shell } from "@/lib/appShellI18n";
import { fanBetCopy } from "@/lib/fanBetI18n";
import { resolveKnockoutWinner } from "@natt-pundit/natt-core/wcMatchRules";
import { resolveWcFormat } from "@/lib/wcMatchRules";
import { liveIndicator } from "@/lib/matchStatus";
import type { AppLang } from "@/lib/locales";

type Props = {
  id: string;
  data: PublicMatchEdge;
  lang: AppLang;
  favorited: boolean;
  onToggleFavorite: (fixtureId: string) => void;
};

export function StitchMatchPageView({
  id,
  data,
  lang,
  favorited,
  onToggleFavorite,
}: Props) {
  const t = ui(lang);
  const s = shell(lang);
  const betCopy = fanBetCopy(lang);

  const setup = data.edge.verdict === "SETUP";
  const edgeBlock = sectionCopyFor(
    setup ? MATCH_SECTION_COPY.edgeSetup : MATCH_SECTION_COPY.edgeHold,
    lang,
  );

  const clock = data.scores?.clock;
  const phase = clock?.phase;
  const finished =
    phase === "FT" || (data.fixture.status === "finished" && phase !== "PEN" && phase !== "ET");
  const live =
    phase === "PEN" ||
    phase === "ET" ||
    phase === "1H" ||
    phase === "2H" ||
    phase === "HT" ||
    (data.fixture.status === "live" && phase !== "FT");
  const phasePen = phase === "PEN";
  const statusHint = liveIndicator(data.fixture.status, clock, t, lang);
  const score = data.fixture.score;
  const penScore = data.scores?.penScore;
  const wcFormat = resolveWcFormat(data.fixture);
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

  const card = fixtureToStitchCard(data.fixture, matchEdgeToSummaryItem(data), lang);

  return (
    <>
      <header className="stitch-match-detail-top">
        <p className="stitch-section-label">{t.matchDetailsLabel}</p>
        <div className="stitch-nav-pill-row">
          <LiquidGlassPillLink href="/?tab=matches" className="stitch-nav-pill--compact">
            {t.backFixtures}
          </LiquidGlassPillLink>
        </div>
      </header>

      <MatchDetailHero
        card={card}
        fixture={data.fixture}
        odds={data.odds}
        competition={data.fixture.competition ?? s.worldCupFallback}
        favorited={favorited}
        onToggleFavorite={onToggleFavorite}
        live={live}
        finished={finished}
        phasePen={phasePen}
        homeWin={homeWin}
        awayWin={awayWin}
        statusHint={statusHint}
        penScore={penScore}
      />

      <div className="stitch-match-sections">
        {data.scores && (data.scores.events.length > 0 || data.scores.penScore != null) ? (
          <StitchMatchSection spanFull title={s.timelineTitle}>
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
          </StitchMatchSection>
        ) : null}

        <StitchMatchSection spanFull title={edgeBlock.title}>
          <StitchEdgePanel
            verdict={data.edge}
            homeTeam={data.fixture.homeTeam}
            awayTeam={data.fixture.awayTeam}
            consensus={data.consensus}
            wcFormat={wcFormat}
            lang={lang}
          />
        </StitchMatchSection>

        <StitchMatchSection spanFull title={fanBetUxEnabled ? betCopy.title : t.settlementTitle}>
          <div className="stitch-match-settlement-stack">
            {fanBetUxEnabled ? (
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
          </div>
        </StitchMatchSection>

        {fanBetUxEnabled && finished ? (
          <StitchMatchSection spanFull title={t.settlementTitle}>
            <TransparencySection
              fixtureId={id}
              fixtureStatus={data.fixture.status}
              score={data.fixture.score}
            />
          </StitchMatchSection>
        ) : null}
      </div>

      <StitchPanelFooter />
    </>
  );
}
