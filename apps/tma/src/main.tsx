import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { initAmplitude, track } from "./lib/amplitude";
import { useAppStore } from "./store/useAppStore";
import "./styles/globals.css";

function configureTelegramWebApp() {
  const webApp = window.Telegram?.WebApp;

  webApp?.ready?.();
  webApp?.expand?.();
  webApp?.disableVerticalSwipes?.();
  webApp?.setHeaderColor?.("#f8f6f2");
  webApp?.setBackgroundColor?.("#f8f6f2");
}

async function bootstrap() {
  const { language, country } = useAppStore.getState();

  configureTelegramWebApp();

  await initAmplitude({
    country,
    language,
  });

  await track("tma_open");

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
