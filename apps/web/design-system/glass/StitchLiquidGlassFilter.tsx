const DISP_MAP = "/fr/nattpundit/ui/stitch-lg-displacement-pill.png";

/**
 * SVG refraction filter for stitch liquid-glass pills.
 * feImage must use a stable public URL (not webpack-hashed media).
 */
export function StitchLiquidGlassFilter() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", overflow: "hidden" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter
          id="stitch-lg-refract-pill"
          x="-20%"
          y="-40%"
          width="140%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feImage href={DISP_MAP} result="dispMap" preserveAspectRatio="none" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="dispMap"
            scale="22"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
