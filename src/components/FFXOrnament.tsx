/**
 * Decorative SVG ornaments inspired by FFX's UI flourishes
 */
export function FFXDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/60 to-transparent" />
    </div>
  );
}

export function FFXCornerOrnament({ className = "", position = "top-left" }: { className?: string; position?: string }) {
  const rotate = {
    "top-left": "rotate-0",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90",
  }[position] || "rotate-0";

  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      className={`text-forge-gold/20 ${rotate} ${className}`}
    >
      <path d="M4 44V20C4 11.16 11.16 4 20 4H44" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M4 44V28C4 17.5 12 9 22 8" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
      <circle cx="20" cy="4" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="4" cy="44" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function RuneCircle({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`animate-rune-spin ${className}`}
    >
      <circle cx="60" cy="60" r="55" stroke="hsl(var(--primary) / 0.15)" strokeWidth="0.5" fill="none" />
      <circle cx="60" cy="60" r="48" stroke="hsl(var(--forge-gold) / 0.1)" strokeWidth="0.5" fill="none" strokeDasharray="4 8" />
      <circle cx="60" cy="60" r="40" stroke="hsl(var(--forge-cyan) / 0.08)" strokeWidth="0.5" fill="none" strokeDasharray="2 12" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <circle
          key={angle}
          cx={60 + 55 * Math.cos((angle * Math.PI) / 180)}
          cy={60 + 55 * Math.sin((angle * Math.PI) / 180)}
          r="1.5"
          fill="hsl(var(--forge-gold) / 0.3)"
        />
      ))}
    </svg>
  );
}
