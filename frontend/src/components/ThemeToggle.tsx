import type { Theme, ThemeKey } from "@/themes";

export function ThemeToggle({
  theme,
  t,
  onToggle,
}: {
  theme: ThemeKey;
  t: Theme;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute top-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-white/90 backdrop-blur-md"
      style={{
        background: t.toggleBg,
        border: `1px solid ${t.toggleBorder}`,
        cursor: "pointer",
        boxShadow: `0 4px 20px rgba(${t.primaryRgb},0.15)`,
      }}
    >
      <div
        className="relative flex items-center rounded-full"
        style={{
          width: 52,
          height: 28,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: 3,
        }}
      >
        <span
          className="absolute text-xs font-bold"
          style={{
            left: 7,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: theme === "rubine" ? 0 : 0.5,
            transition: "opacity 0.3s ease",
            fontSize: 10,
          }}
        >
          💎
        </span>
        <span
          className="absolute text-xs font-bold"
          style={{
            right: 7,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: theme === "emerald" ? 0 : 0.5,
            transition: "opacity 0.3s ease",
            fontSize: 10,
          }}
        >
          🌿
        </span>
        <div
          className="rounded-full"
          style={{
            width: 22,
            height: 22,
            background: t.toggleActiveBg,
            boxShadow: `0 0 12px rgba(${t.primaryRgb},0.6), 0 2px 8px rgba(0,0,0,0.3)`,
            transform: theme === "emerald" ? "translateX(24px)" : "translateX(0px)",
            transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
      <span>
        {t.emoji} {t.name}
      </span>
    </button>
  );
}