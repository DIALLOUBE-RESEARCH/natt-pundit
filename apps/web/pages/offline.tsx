import Link from "next/link";
import { usePresent } from "@/components/present/PresentProvider";
import { shell } from "@/lib/appShellI18n";
import { stitchUiEnabled } from "@/lib/stitchUiFlag";

export default function OfflinePage() {
  const { lang } = usePresent();
  const s = shell(lang);

  const inner = (
    <>
      <h1 className={stitchUiEnabled ? "stitch-home-title" : "text-2xl font-bold text-natt-gold"}>
        {s.offlineTitle}
      </h1>
      <p className={stitchUiEnabled ? "stitch-home-lead" : "mt-4 text-white/70"}>{s.offlineBody}</p>
      <Link
        href="/"
        className={
          stitchUiEnabled
            ? "stitch-action-btn stitch-offline-back"
            : "mt-8 inline-block rounded-xl bg-natt-cyan px-6 py-3 font-semibold text-black"
        }
      >
        {s.offlineBack}
      </Link>
    </>
  );

  if (stitchUiEnabled) {
    return <div className="stitch-panel stitch-panel--offline stitch-panel--centered">{inner}</div>;
  }

  return <div className="mx-auto max-w-md px-4 py-20 text-center">{inner}</div>;
}
