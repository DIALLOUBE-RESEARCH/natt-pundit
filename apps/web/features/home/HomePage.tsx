import { StitchDocsPanel } from "@/components/stitch/panels/StitchDocsPanel";
import { StitchHomePanel } from "@/components/stitch/panels/StitchHomePanel";
import { StitchWalletPanel } from "@/components/stitch/panels/StitchWalletPanel";
import { StitchMatchesPanel } from "@/components/stitch/panels/StitchMatchesPanel";
import { LegacyHomePage } from "@/features/home/LegacyHomePage";
import { useAppTabs } from "@/features/shell/AppTabsContext";
import { stitchUiEnabled } from "@/lib/stitchUiFlag";

function StitchHomePanels() {
  const { activeTab, selectTab } = useAppTabs();

  if (activeTab === "matches") return <StitchMatchesPanel />;
  if (activeTab === "docs") return <StitchDocsPanel />;
  if (activeTab === "wallet") return <StitchWalletPanel />;
  return <StitchHomePanel onNavigateTab={selectTab} />;
}

export function HomePage() {
  if (!stitchUiEnabled) return <LegacyHomePage />;
  return <StitchHomePanels />;
}
