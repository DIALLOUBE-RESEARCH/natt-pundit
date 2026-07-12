import { StitchDataLabPanel } from "@/components/stitch/panels/StitchDataLabPanel";
import { LegacyDataLabPage } from "@/features/datalab/LegacyDataLabPage";
import { stitchUiEnabled } from "@/lib/stitchUiFlag";

export function DataLabPage() {
  if (stitchUiEnabled) return <StitchDataLabPanel />;
  return <LegacyDataLabPage />;
}
