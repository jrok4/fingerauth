import { useState, useEffect } from "react";
import { themes, type ThemeKey } from "@/themes";
import type { AuthData, BanInfo, PageType } from "@/types";
import { Background } from "@/components/Background";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { BanPage } from "@/pages/BanPage";

export function App() {
  const [theme, setTheme] = useState<ThemeKey>("emerald");
  const [page, setPage] = useState<PageType>("login");
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);

  const t = themes[theme];

  const toggleTheme = () => {
    setTheme((prev) => (prev === "rubine" ? "emerald" : "rubine"));
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      key={theme}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        backgroundImage: t.bg,
        backgroundSize: "400% 400%",
        animation: "bgShift 15s ease infinite",
      }}
    >
      <ThemeToggle theme={theme} t={t} onToggle={toggleTheme} />
      <Background t={t} />

      {page === "login" && (
        <LoginPage
          t={t}
          onLogin={(data) => {
            setAuthData(data);
            setPage("dashboard");
          }}
          onGoRegister={() => setPage("register")}
          onBan={(ban: BanInfo) => {
            setBanInfo(ban);
            setPage("banned");
          }}
        />
      )}

      {page === "banned" && (
        <BanPage
          t={t}
          banInfo={banInfo}
          onLogout={() => {
            setBanInfo(null);
            setAuthData(null);
            setPage("login");
          }}
        />
      )}

      {page === "register" && (
        <RegisterPage
          t={t}
          onRegister={() => setPage("login")}
          onGoLogin={() => setPage("login")}
          onBan={(ban: BanInfo) => {
            setBanInfo(ban);
            setPage("banned");
          }}
        />
      )}

      {page === "dashboard" && (
        <DashboardPage
          t={t}
          authData={authData}
          onLogout={() => {
            setAuthData(null);
            setPage("login");
          }}
        />
      )}
    </div>
  );
}