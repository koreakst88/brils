import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function Layout() {
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
