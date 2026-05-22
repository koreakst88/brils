import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Header } from "./Header";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const backButton = window.Telegram?.WebApp?.BackButton;

    if (!backButton) {
      return;
    }

    const isRootScreen = location.pathname === "/";
    const handleBack = () => navigate(-1);

    if (isRootScreen) {
      backButton.hide();
      backButton.offClick(handleBack);
      return;
    }

    backButton.show();
    backButton.onClick(handleBack);

    return () => {
      backButton.offClick(handleBack);
      backButton.hide();
    };
  }, [location.pathname, navigate]);

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--top" />
      <div className="app-shell__glow app-shell__glow--bottom" />

      <div className="app-container">
        <Header />

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
