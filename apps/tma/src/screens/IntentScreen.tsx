import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { track } from "../lib/amplitude";
import { useAppStore } from "../store/useAppStore";

const intents = ["wholesale", "cooperation", "distribution", "selection"] as const;

export function IntentScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const intent = useAppStore((state) => state.intent);
  const setIntent = useAppStore((state) => state.setIntent);
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="screen">
      <div className="screen-card">
        <span className="screen-eyebrow">{t("screens.intent.eyebrow")}</span>
        <h1 className="screen-title">{t("screens.intent.title")}</h1>
        <p className="screen-description">{t("screens.intent.description")}</p>

        <div className="stack">
          {intents.map((item) => (
            <button
              key={item}
              type="button"
              className={`choice-card choice-card--row intent-card ${
                intent === item ? "is-selected" : ""
              } ${pendingIntent === item ? "is-confirming" : ""}`}
              onClick={() => {
                if (timeoutRef.current) {
                  window.clearTimeout(timeoutRef.current);
                }
                setIntent(item);
                setPendingIntent(item);
                void track("intent_selected", { intent: item });
                timeoutRef.current = window.setTimeout(() => {
                  navigate("/products");
                }, 300);
              }}
            >
              <span className="intent-card__label">
                {t(`screens.intent.options.${item}.label`)}
              </span>
              <small>{t(`screens.intent.options.${item}.hint`)}</small>
              <span
                className={`intent-card__confirmation ${
                  pendingIntent === item ? "is-visible" : ""
                }`}
              >
                {t("screens.intent.confirmation")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
