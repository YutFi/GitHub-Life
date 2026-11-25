/** The LifeVerse mark: a life-line that ends in a bright node. Matches the home-screen icon. */
export function Logo({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="LifeVerse" className="drop-shadow-[0_12px_40px_rgba(139,92,246,0.55)]">
      <defs>
        <linearGradient id="lv-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#06b6d4" /></linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#lv-g)" />
      <path d="M92 300c44-140 96-140 140 0s96 140 140 0" fill="none" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="400" cy="150" r="30" fill="#fff" />
    </svg>
  );
}
