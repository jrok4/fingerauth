import { useState } from "react";
import type { AuthData } from "@/types";
import type { Theme } from "@/themes";
import { useTiltCard } from "@/hooks/useTiltCard";
import { inputStyle, focusHandler, blurHandler } from "@/utils/inputHelpers";
import { LogoCube } from "@/components/LogoCube";
import { ErrorBanner } from "@/components/ErrorBanner";
import { collectFingerprint } from "@/utils/fingerprint";

export function LoginPage({
  t,
  onLogin,
  onGoRegister,
  onBan,
}: {
  t: Theme;
  onLogin: (data: AuthData) => void;
  onGoRegister: () => void;
  onBan: (info: BanInfo) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { rx, ry, cardRef, onMove, onLeave } = useTiltCard();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const clientFp = await collectFingerprint();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          password,
          rememberMe,
          theme: t.name,
          clientFingerprint: clientFp,
        }),
      });
      const data: AuthData = await res.json();

      if (res.status === 403 && data.ban) {
        setLoading(false);
        onBan(data.ban);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      setLoading(false);
      onLogin(data);
    } catch {
      setError("Network error — server unreachable");
      setLoading(false);
    }
  };

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
        }}
      >
        <LogoCube t={t} />

        <div className="text-center mb-8">
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
            Welcome Back
          </h1>
          <p className="text-sm" style={{ color: "rgba(203,213,225,0.6)" }}>
            Sign in to your dimensional portal
          </p>
        </div>

        {error && <ErrorBanner message={error} />}

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              className="block text-xs font-medium mb-2 uppercase tracking-wider"
              style={{ color: "rgba(203,213,225,0.5)" }}
            >
              Email Address
            </label>
            <div className="relative">
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: t.icon1 }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none"
                style={{
                  ...inputStyle,
                  transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                }}
                onFocus={(e) => focusHandler(e, t.primaryRgb)}
                onBlur={blurHandler}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-xs font-medium mb-2 uppercase tracking-wider"
              style={{ color: "rgba(203,213,225,0.5)" }}
            >
              Password
            </label>
            <div className="relative">
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: t.icon2 }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-xl py-3.5 pl-12 pr-12 text-sm outline-none"
                style={{
                  ...inputStyle,
                  transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                }}
                onFocus={(e) => focusHandler(e, t.primaryRgb)}
                onBlur={blurHandler}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{
                  color: "rgba(203,213,225,0.4)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {showPwd ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRememberMe((prev) => !prev)}
              className="flex items-center gap-2.5"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <span
                key={rememberMe ? "on" : "off"}
                className="flex items-center justify-center"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  flexShrink: 0,
                  background: rememberMe ? t.checkGrad : "rgba(255,255,255,0.06)",
                  border: rememberMe
                    ? `2px solid ${t.checkBorder}`
                    : "2px solid rgba(255,255,255,0.2)",
                  boxShadow: rememberMe ? t.checkShadow : "none",
                }}
              >
                {rememberMe && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="text-xs" style={{ color: "rgba(203,213,225,0.5)" }}>
                Remember me
              </span>
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full rounded-xl py-3.5 text-sm font-semibold text-white overflow-hidden"
            style={{
              backgroundImage: t.btnGrad,
              backgroundSize: "300% 300%",
              animation: "bgShift 6s ease infinite",
              boxShadow: t.btnShadow,
              border: "none",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Authenticating...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "rgba(203,213,225,0.4)" }}
        >
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onGoRegister}
            className="font-medium"
            style={{
              color: t.createColor,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Create one →
          </button>
        </p>
      </div>

      <div
        className="absolute -inset-px rounded-3xl pointer-events-none"
        style={{ backgroundImage: t.edgeGlow, zIndex: -1 }}
      />
    </div>
  );
}