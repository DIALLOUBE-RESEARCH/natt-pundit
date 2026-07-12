import dynamic from "next/dynamic";
import { usePresent } from "@/components/present/PresentProvider";
import { shell } from "@/lib/appShellI18n";
import { stitchUiEnabled } from "@/lib/stitchUiFlag";

const ActivateTxline = dynamic(
  () => import("@/components/ActivateTxline").then((m) => m.ActivateTxline),
  { ssr: false },
);

export default function ActivatePage() {
  const { lang } = usePresent();
  const s = shell(lang);

  const inner = (
    <>
      <h1 className={stitchUiEnabled ? "stitch-home-title" : "text-2xl font-bold text-natt-gold"}>
        {s.activateTitle}
      </h1>
      <p className={stitchUiEnabled ? "stitch-home-lead" : "mt-2 text-sm text-white/70"}>
        {s.activateLead}
      </p>
      <div className={stitchUiEnabled ? "stitch-activate-form" : "mt-8"}>
        <ActivateTxline />
      </div>
    </>
  );

  if (stitchUiEnabled) {
    return <div className="stitch-panel stitch-panel--activate">{inner}</div>;
  }

  return <div className="mx-auto max-w-lg px-4 py-10">{inner}</div>;
}
