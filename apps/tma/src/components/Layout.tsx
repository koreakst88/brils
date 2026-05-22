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
    const isFinalScreen = location.pathname === "/final";
    const handleBack = () => navigate(-1);

    if (isRootScreen || isFinalScreen) {
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

  useEffect(() => {
    // Stabilize the app height on iOS Safari/Telegram WebView:
    // use the layout viewport height (innerHeight), not visualViewport.height.
    const updateAppHeight = () => {
      document.documentElement.style.setProperty("--app-height", `${Math.round(window.innerHeight)}px`);
    };

    updateAppHeight();
    window.addEventListener("resize", updateAppHeight);
    window.addEventListener("orientationchange", updateAppHeight);

    return () => {
      window.removeEventListener("resize", updateAppHeight);
      window.removeEventListener("orientationchange", updateAppHeight);
    };
  }, []);

  useEffect(() => {
    // Keyboard handling: compute bottom inset from visualViewport changes,
    // but do not shrink the whole app container (that causes jumpy layouts in Telegram iOS).
    const updateKeyboardInset = () => {
      const vv = window.visualViewport;
      if (!vv) {
        document.documentElement.style.setProperty("--keyboard-inset", "0px");
        return;
      }

      const inset = Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)));
      document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
    };

    updateKeyboardInset();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", updateKeyboardInset);
    vv?.addEventListener("scroll", updateKeyboardInset);

    return () => {
      vv?.removeEventListener("resize", updateKeyboardInset);
      vv?.removeEventListener("scroll", updateKeyboardInset);
    };
  }, []);

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
