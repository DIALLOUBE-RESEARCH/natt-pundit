import Link from "next/link";
import {
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";

type Variant = "hold" | "bet" | "setup" | "agent" | "wallet" | "finished" | "nav";

type BaseProps = {
  variant: Variant;
  children: ReactNode;
  className?: string;
};

type ButtonProps = BaseProps & {
  as?: "button";
} & ButtonHTMLAttributes<HTMLButtonElement>;

type DivProps = BaseProps & {
  as: "div";
} & HTMLAttributes<HTMLDivElement>;

type Props = ButtonProps | DivProps;

function trackPointer(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  event.currentTarget.style.setProperty("--lg-mx", `${x}%`);
  event.currentTarget.style.setProperty("--lg-my", `${y}%`);
}

const pointerHandlers = {
  onMouseMove: (event: MouseEvent<HTMLElement>) => trackPointer(event),
  onMouseLeave: (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.removeProperty("--lg-mx");
    event.currentTarget.style.removeProperty("--lg-my");
  },
};

const defaultPointerStyle = { "--lg-mx": "50%", "--lg-my": "28%" } as CSSProperties;

export const liquidGlassPointerProps = {
  style: defaultPointerStyle,
  ...pointerHandlers,
};

export function LiquidGlassLayers({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="stitch-lg-pill__effect" aria-hidden />
      <span className="stitch-lg-pill__tint" aria-hidden />
      <span className="stitch-lg-pill__shine" aria-hidden />
      <span className="stitch-lg-pill__content">{children}</span>
    </>
  );
}

/** iOS 26 Liquid Glass pill — 4-layer material (F67N / F92N design-system). */
export function LiquidGlassPill(props: Props) {
  const { variant, children, className = "", as = "button", ...rest } = props;
  const cls = `stitch-lg-pill stitch-lg-pill--${variant} ${className}`.trim();

  if (as === "div") {
    const divRest = rest as HTMLAttributes<HTMLDivElement>;
    return (
      <div className={cls} {...liquidGlassPointerProps} {...divRest}>
        <LiquidGlassLayers>{children}</LiquidGlassLayers>
      </div>
    );
  }

  const btnRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={cls} {...liquidGlassPointerProps} {...btnRest}>
      <LiquidGlassLayers>{children}</LiquidGlassLayers>
    </button>
  );
}

type LinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className">;

/** Liquid Glass pill as Next.js link — nav CTAs (match back, view all, etc.). */
export function LiquidGlassPillLink({ href, children, className = "", ...rest }: LinkProps) {
  const cls = `stitch-lg-pill stitch-lg-pill--nav ${className}`.trim();
  return (
    <Link href={href} className={cls} {...liquidGlassPointerProps} {...rest}>
      <LiquidGlassLayers>{children}</LiquidGlassLayers>
    </Link>
  );
}
