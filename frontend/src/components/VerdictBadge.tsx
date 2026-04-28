const verdictStyles: Record<string, { bg: string; text: string; border: string }> = {
  allow: {
    bg: "rgba(16,185,129,0.15)",
    text: "#34d399",
    border: "rgba(16,185,129,0.3)",
  },
  challenge: {
    bg: "rgba(234,179,8,0.15)",
    text: "#fbbf24",
    border: "rgba(234,179,8,0.3)",
  },
  deny: {
    bg: "rgba(239,68,68,0.15)",
    text: "#f87171",
    border: "rgba(239,68,68,0.3)",
  },
};

export function VerdictBadge({ verdict }: { verdict: string }) {
  const v = verdictStyles[verdict.toLowerCase()] ?? verdictStyles.challenge;
  return (
    <span
      className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
      style={{
        background: v.bg,
        color: v.text,
        border: `1px solid ${v.border}`,
        boxShadow: `0 0 20px ${v.bg}`,
      }}
    >
      {verdict}
    </span>
  );
}