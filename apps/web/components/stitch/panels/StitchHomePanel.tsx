import { FixtureCard } from "@/features/fixtures/FixtureCard";
import { usePresent } from "@/components/present/PresentProvider";
import { LiquidGlassPill } from "@/design-system/glass/LiquidGlassPill";
import { featuredSectionLabel, pickFeaturedFixture } from "@/lib/fixtureSort";
import { fixtureToStitchCard } from "@/lib/stitchCardModel";
import { useMatchFavorites } from "@/lib/matchFavorites";
import { useFixturesWithEdge } from "@/lib/useFixturesWithEdge";
import { ui } from "@/lib/i18n";
import { StitchPanelFooter } from "@/components/stitch/StitchPanelFooter";
import type { StitchTabId } from "@/lib/stitchTabs";

type Props = {
  onNavigateTab: (tab: StitchTabId) => void;
};

export function StitchHomePanel({ onNavigateTab }: Props) {
  const { lang } = usePresent();
  const t = ui(lang);
  const { favorites, toggleFavorite, isFavorite } = useMatchFavorites();
  const { fixtures, edgeMap, err } = useFixturesWithEdge(lang, favorites);
  const featured = pickFeaturedFixture(fixtures, edgeMap);
  const kickerParts = t.homeKicker.split(" · ");
  const homeKickerBrand = kickerParts[0] ?? "TXODDS";
  const homeKickerSub = kickerParts.slice(1).join(" · ");

  return (
    <div className="stitch-panel stitch-panel--home">
      <section className="stitch-home-hero">
        <p className="stitch-home-kicker stitch-home-kicker--event">{t.homeEventKicker}</p>
        <p className="stitch-home-kicker stitch-home-kicker--split">
          <span className="stitch-home-kicker-brand">{homeKickerBrand}</span>
          {homeKickerSub ? (
            <span className="stitch-home-kicker-sub">{homeKickerSub}</span>
          ) : null}
        </p>
        <h1 className="stitch-home-title">{t.homeTitle}</h1>
        <p className="stitch-home-lead">{t.homeLead}</p>
      </section>

      {err ? <p className="stitch-panel-error">{err}</p> : null}

      {featured ? (
        <div className="stitch-featured-wrap">
          <h2 className="stitch-section-label">
            {featuredSectionLabel(featured, edgeMap, {
              live: t.statusLive,
              upcoming: t.statusUpcoming,
              finished: t.badgeFinished,
            })}
          </h2>
          <FixtureCard
            featured
            card={fixtureToStitchCard(featured, edgeMap.get(featured.fixtureId), lang)}
            favorited={isFavorite(featured.fixtureId)}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      ) : (
        <p className="stitch-panel-empty">{t.homeNoFixtures}</p>
      )}

      <div className="stitch-nav-pill-row stitch-nav-pill-row--home">
        <LiquidGlassPill
          variant="nav"
          className="stitch-nav-pill--wide"
          onClick={() => onNavigateTab("matches")}
        >
          {t.viewAllMatches}
        </LiquidGlassPill>
      </div>

      <StitchPanelFooter />
    </div>
  );
}
