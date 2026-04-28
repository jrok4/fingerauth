import { useState } from "react";
import type { AuthData } from "@/types";
import type { Theme } from "@/themes";
import { useTiltCard } from "@/hooks/useTiltCard";
import { LogoCube } from "@/components/LogoCube";
import { ScoreRing } from "@/components/ScoreRing";
import { VerdictBadge } from "@/components/VerdictBadge";

export function DashboardPage({
  t,
  authData,
  onLogout,
}: {
  t: Theme;
  authData: AuthData | null;
  onLogout: () => void;
}) {
  const [showRaw, setShowRaw] = useState(false);
  const { rx, ry, cardRef, onMove, onLeave } = useTiltCard();

  const ip = authData?.ip_info;

  const infoGrid: { label: string; value: string; warn?: boolean }[] = [];
  if (ip?.ip) infoGrid.push({ label: "IP Address", value: String(ip.ip) });
  if (ip?.country) infoGrid.push({ label: "Country", value: String(ip.country) });
  if (ip?.city) infoGrid.push({ label: "City", value: String(ip.city) });
  if (ip?.region) infoGrid.push({ label: "Region", value: String(ip.region) });
  if (ip?.org) infoGrid.push({ label: "Organization", value: String(ip.org) });
  if (ip?.is_vpn) infoGrid.push({ label: "VPN", value: "Detected", warn: true });
  if (ip?.is_proxy) infoGrid.push({ label: "Proxy", value: "Detected", warn: true });
  if (ip?.is_tor) infoGrid.push({ label: "Tor", value: "Detected", warn: true });
  if (ip?.is_datacenter)
    infoGrid.push({ label: "Datacenter", value: "Yes", warn: true });

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
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: t.cardGlow,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <LogoCube t={t} />

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
            Portal Active
          </h1>
          <p className="text-sm" style={{ color: "rgba(203,213,225,0.6)" }}>
            TLS fingerprint analysis complete
          </p>
        </div>

        {/* Score Ring */}
        {authData?.score !== undefined && (
          <div className="flex justify-center my-6">
            <ScoreRing score={authData.score} t={t} />
          </div>
        )}

        {/* Verdict */}
        {authData?.verdict && (
          <div className="flex justify-center mb-6">
            <VerdictBadge verdict={authData.verdict} />
          </div>
        )}

        {/* Flags */}
        {authData?.reasons && authData.reasons.length > 0 && (
          <div className="space-y-2 mb-6">
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "rgba(203,213,225,0.4)" }}
            >
              Security Flags
            </p>
            {authData.reasons.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                style={{
                  background: "rgba(234,179,8,0.08)",
                  border: "1px solid rgba(234,179,8,0.15)",
                  color: "#fbbf24",
                }}
              >
                <span>⚠</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* IP Info Grid */}
        {infoGrid.length > 0 && (
          <div className="mb-6">
            <p
              className="text-xs font-medium uppercase tracking-wider mb-3"
              style={{ color: "rgba(203,213,225,0.4)" }}
            >
              Connection Info
            </p>
            <div className="grid grid-cols-2 gap-2">
              {infoGrid.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="text-xs mb-1"
                    style={{ color: "rgba(203,213,225,0.35)" }}
                  >
                    {item.label}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{
                      color: item.warn ? "#f87171" : "rgba(226,232,240,0.9)",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw response toggle */}
        {authData && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium"
              style={{
                color: "rgba(203,213,225,0.4)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: showRaw ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Raw Response
            </button>
            {showRaw && (
              <pre
                className="mt-2 rounded-xl p-3 text-xs overflow-x-auto"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  color: "rgba(203,213,225,0.5)",
                  animation: "slideUp 0.3s ease-out",
                }}
              >
                {JSON.stringify(authData, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="relative w-full rounded-xl py-3.5 text-sm font-semibold text-white overflow-hidden flex items-center justify-center gap-2"
          style={{
            backgroundImage: t.btnGrad,
            backgroundSize: "300% 300%",
            animation: "bgShift 6s ease infinite",
            boxShadow: t.btnShadow,
            border: "none",
            cursor: "pointer",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      <div
        className="absolute -inset-px rounded-3xl pointer-events-none"
        style={{ backgroundImage: t.edgeGlow, zIndex: -1 }}
      />
    </div>
  );
}