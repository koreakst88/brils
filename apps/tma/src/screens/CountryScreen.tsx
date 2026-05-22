import { useNavigate } from "react-router-dom";
import { track } from "../lib/amplitude";
import { useTranslation } from "../i18n";
import { useAppStore } from "../store/useAppStore";

const countries = [
  { code: "KZ", emoji: "🇰🇿" },
  { code: "UZ", emoji: "🇺🇿" },
  { code: "KG", emoji: "🇰🇬" },
  { code: "TM", emoji: "🇹🇲" },
  { code: "Other", emoji: "🌐" },
] as const;

export function CountryScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const country = useAppStore((state) => state.country);
  const setCountry = useAppStore((state) => state.setCountry);
  const hasSelection = Boolean(country);

  return (
    <section className="screen">
      <div className="screen-card screen-card--hero">
        <span className="screen-eyebrow">{t("screens.country.eyebrow")}</span>
        <h1 className="screen-title">{t("screens.country.title")}</h1>
        <p className="screen-description">{t("screens.country.description")}</p>

        <div className="choice-grid country-grid">
          {countries.map((item) => {
            const translationKey = item.code.toLowerCase();
            const isSelected = country === item.code;

            return (
              <button
                key={item.code}
                type="button"
                className={`choice-card country-card ${
                  item.code === "Other" ? "country-card--wide" : ""
                } ${isSelected ? "is-selected" : ""}`}
                onClick={() => {
                  setCountry(item.code);
                  void track("country_selected", { country: item.code });
                }}
              >
                <span className="country-card__emoji" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="country-card__label">
                  {t(`screens.country.options.${translationKey}`)}
                </span>
                <span className="country-card__hint">
                  {t(`screens.country.optionHints.${translationKey}`)}
                </span>
                <span className={`country-card__check ${isSelected ? "is-visible" : ""}`}>
                  {t("screens.country.selectedBadge")}
                </span>
              </button>
            );
          })}
        </div>

        <div className={`micro-confirmation ${hasSelection ? "is-visible" : ""}`}>
          <span className="micro-confirmation__dot" aria-hidden="true" />
          <span>
            {hasSelection
              ? t("screens.country.confirmation").replace(
                  "{country}",
                  t(`screens.country.options.${String(country).toLowerCase()}`),
                )
              : t("screens.country.confirmationIdle")}
          </span>
        </div>

        <button
          type="button"
          className="primary-button primary-button--full"
          disabled={!hasSelection}
          onClick={() => navigate("/intent")}
        >
          {t("screens.country.cta")}
        </button>
      </div>
    </section>
  );
}
