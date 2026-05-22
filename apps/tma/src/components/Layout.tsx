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
    // iOS Telegram WebView: keep our "100vh" aligned to the *visual* viewport
    // so inputs/buttons won't be covered by the on-screen keyboard.
    const updateAppHeight = () => {
      const vv = window.visualViewport;
      const height = Math.round(vv?.height ?? window.innerHeight);
      document.documentElement.style.setProperty("--app-height", `${height}px`);

      // When iOS keyboard is visible, visualViewport is smaller than innerHeight.
      // Expose the difference as padding for scroll containers.
      const inset = Math.max(
        0,
        Math.round(window.innerHeight - ((vv?.height ?? window.innerHeight) + (vv?.offsetTop ?? 0))),
      );
      document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
    };

    updateAppHeight();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", updateAppHeight);
    vv?.addEventListener("scroll", updateAppHeight);
    window.addEventListener("orientationchange", updateAppHeight);

    return () => {
      vv?.removeEventListener("resize", updateAppHeight);
      vv?.removeEventListener("scroll", updateAppHeight);
      window.removeEventListener("orientationchange", updateAppHeight);
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
