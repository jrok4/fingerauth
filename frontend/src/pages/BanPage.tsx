import { useState, useEffect, useCallback, useRef } from "react";
import type { BanInfo } from "@/types";
import type { Theme } from "@/themes";

export function BanPage({
  t,
  banInfo,
  onLogout,
}: {
  t: Theme;
  banInfo: BanInfo;
  onLogout: () => void;
}) {
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [pulse, setPulse] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse((p) => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    setRy(((e.clientX - b.left - b.width / 2) / (b.width / 2)) * 8);
    setRx((-(e.clientY - b.top - b.height / 2) / (b.height / 2)) * 8);
  }, []);

  const onLeave = useCallback(() => {
    setRx(0);
    setRy(0);
  }, []);

  const c = t.primaryRgb;
  const isPermanent = banInfo.expires === null;

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative z-10 w-full max-w-md mx-4"
      style={{ perspective: 1000, animation: "slideUp 0.8s ease-out" }}
    >
      <div
        className="rounded-3xl p-8 md:p-10"
        style={{
          transform: `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`,
          transition: "transform 0.1s ease-out, box-shadow 0.8s ease",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: `1px solid rgba(${c},0.15)`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.5), 0 0 80px rgba(${c},0.1), 0 0 120px rgba(${c},0.05), inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="relative flex items-center justify-center"
            style={{ width: 80, height: 80 }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: pulse ? 100 : 80,
                height: pulse ? 100 : 80,
                border: `2px solid rgba(${c},0.2)`,
                transition: "all 1s ease-in-out",
                opacity: pulse ? 0 : 0.5,
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                width: pulse ? 120 : 90,
                height: pulse ? 120 : 90,
                border: `1px solid rgba(${c},0.1)`,
                transition: "all 1.2s ease-in-out",
                opacity: pulse ? 0 : 0.3,
              }}
            />
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 72,
                height: 72,
                background: `linear-gradient(135deg, rgba(${c},0.2), rgba(${c},0.3))`,
                border: `2px solid rgba(${c},0.3)`,
                boxShadow: `0 0 30px rgba(${c},0.2), 0 0 60px rgba(${c},0.1)`,
                animation: "banSpin 20s linear infinite",
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: "banSpinReverse 20s linear infinite" }}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              backgroundImage: t.grad,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            Access Denied
          </h1>
          <p className="text-sm" style={{ color: `rgba(${c},0.7)` }}>
            Your account has been suspended
          </p>
        </div>

        {/* Ban details card */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: `rgba(${c},0.06)`,
            border: `1px solid rgba(${c},0.1)`,
          }}
        >
          {/* Reason */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg mt-0.5"
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                background: `rgba(${c},0.1)`,
                border: `1px solid rgba(${c},0.15)`,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.primary}
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: `rgba(${c},0.8)` }}
              >
                REASON
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "rgba(203,213,225,0.6)" }}
              >
                {banInfo.reason}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-lg mt-0.5"
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                background: `rgba(${c},0.1)`,
                border: `1px solid rgba(${c},0.15)`,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.primary}
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: `rgba(${c},0.8)` }}
              >
                DURATION
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "rgba(203,213,225,0.6)" }}
              >
                {isPermanent
                  ? "Permanent — this decision is final and cannot be reversed automatically."
                  : `Suspended until ${banInfo.expires}. Access will be restored after this date.`}
              </p>
            </div>
          </div>

          {/* Banned At */}
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-lg mt-0.5"
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                background: `rgba(${c},0.1)`,
                border: `1px solid rgba(${c},0.15)`,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.primary}
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: `rgba(${c},0.8)` }}
              >
                BANNED ON
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "rgba(203,213,225,0.5)" }}
              >
                {banInfo.bannedAt}
              </p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 mb-6"
          style={{
            background: `rgba(${c},0.08)`,
            border: `1px solid rgba(${c},0.12)`,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              background: t.primary,
              boxShadow: `0 0 8px rgba(${c},0.6)`,
              animation: "blink 2s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: `rgba(${c},0.7)` }}
          >
            {isPermanent
              ? "Account status: Permanently suspended"
              : `Account status: Suspended until ${banInfo.expires}`}
          </span>
        </div>

        {/* Back to login */}
        <button
          type="button"
          onClick={onLogout}
          className="relative w-full rounded-xl py-3.5 text-sm font-semibold overflow-hidden flex items-center justify-center gap-2"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer",
            color: "rgba(203,213,225,0.6)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Login
        </button>
      </div>

      {/* Edge glow */}
      <div
        className="absolute -inset-px rounded-3xl pointer-events-none"
        style={{
          backgroundImage: t.edgeGlow,
          zIndex: -1,
        }}
      />
    </div>
  );
}