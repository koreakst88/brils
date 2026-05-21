import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { initAmplitude, track } from "./lib/amplitude";
import { useAppStore } from "./store/useAppStore";
import "./styles/globals.css";

async function bootstrap() {
  const { language, country } = useAppStore.getState();

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
