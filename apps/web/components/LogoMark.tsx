type Props = { size?: number; className?: string };

export function LogoMark({ size = 32, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="natt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5C542" />
          <stop offset="100%" stopColor="#37D6F0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="#12121A" />
      <path
        d="M148 380V132h52l88 148V132h52v248h-52l-88-148v148h-52z"
        fill="url(#natt-grad)"
      />
      <circle cx="392" cy="148" r="14" fill="#37D6F0" />
    </svg>
  );
}
