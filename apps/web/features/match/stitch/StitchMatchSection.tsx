import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  spanFull?: boolean;
};

export function StitchMatchSection({ title, children, spanFull }: Props) {
  return (
    <section
      className={[
        "stitch-match-section",
        spanFull ? "stitch-match-section--span-full" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title ? <h2 className="stitch-match-section-title">{title}</h2> : null}
      <div className="stitch-glass-card stitch-match-section-body">{children}</div>
    </section>
  );
}
