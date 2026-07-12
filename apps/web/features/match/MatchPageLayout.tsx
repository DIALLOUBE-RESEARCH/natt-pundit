import type { ReactNode } from "react";

export function MatchPageLayout({ children }: { children: ReactNode }) {
  return <div className="stitch-panel stitch-panel--match">{children}</div>;
}
