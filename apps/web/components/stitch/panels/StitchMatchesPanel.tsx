import { FixtureCard } from "@/features/fixtures/FixtureCard";
import { StitchPanelFooter } from "@/components/stitch/StitchPanelFooter";
import { fixtureToStitchCard } from "@/lib/stitchCardModel";
import { useMatchFavorites } from "@/lib/matchFavorites";
import { useFixturesWithEdge } from "@/lib/useFixturesWithEdge";
import { ui } from "@/lib/i18n";
import { usePresent } from "@/components/present/PresentProvider";

export function StitchMatchesPanel() {
  const { lang } = usePresent();
  const t = ui(lang);
  const { favorites, toggleFavorite, isFavorite } = useMatchFavorites();
  const { ordered, edgeMap, err } = useFixturesWithEdge(lang, favorites);

  return (
    <div className="stitch-panel stitch-panel--matches">
      <h2 className="stitch-section-label">{t.homeFixturesTitle}</h2>
      {err ? <p className="stitch-panel-error">{err}</p> : null}

      <div className="stitch-cards-list">
        {ordered.length === 0 ? (
          <p className="stitch-panel-empty">{t.homeNoFixtures}</p>
        ) : (
          ordered.map((f) => (
            <FixtureCard
              key={f.fixtureId}
              card={fixtureToStitchCard(f, edgeMap.get(f.fixtureId), lang)}
              favorited={isFavorite(f.fixtureId)}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </div>

      <StitchPanelFooter />
    </div>
  );
}
