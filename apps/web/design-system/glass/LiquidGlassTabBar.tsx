import { type ReactNode } from "react";
import { liquidGlassPointerProps } from "@/design-system/glass/LiquidGlassPill";

type Props = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
};

/** Floating footer nav — liquid glass shell matching stitch pills. */
export function LiquidGlassTabBar({ children, className = "", "aria-label": ariaLabel }: Props) {
  const cls = `stitch-tabbar stitch-lg-glass-bar ${className}`.trim();
  return (
    <nav className={cls} aria-label={ariaLabel} {...liquidGlassPointerProps}>
      <span className="stitch-lg-pill__shine" aria-hidden />
      <div className="stitch-tabbar-inner">{children}</div>
    </nav>
  );
}
