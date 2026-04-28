import type { Theme } from "@/themes";

export function ScoreRing({ score, t }: { score: number; t: Theme }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const scoreColor = score >= 75 ? t.primary : score >= 50 ? "#eab308" : "#ef4444";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 140, height: 140 }}
    >
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={t.primary} />
            <stop offset="100%" stopColor={t.primaryLight} />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={score >= 75 ? "url(#scoreGrad)" : scoreColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{
            transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: `drop-shadow(0 0 8px ${scoreColor}66)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-xs" style={{ color: "rgba(203,213,225,0.4)" }}>
          trust score
        </span>
      </div>
    </div>
  );
}