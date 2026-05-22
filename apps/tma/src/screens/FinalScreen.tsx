import { useEffect } from "react";
import { Link } from "react-router-dom";
import { products } from "../data/products";
import { useTranslation } from "../i18n";
import { track } from "../lib/amplitude";

function formatPriceRange(min: number, max: number) {
  return `$${min} - $${max}`;
}

export function FinalScreen() {
  const { t } = useTranslation();
  const managerTelegram = import.meta.env.VITE_MANAGER_TG;
  const managerLink = managerTelegram
    ? `https://t.me/${managerTelegram.replace(/^@/, "")}`
    : "https://t.me";

  useEffect(() => {
    void track("price_view");
  }, []);

  return (
    <section className="screen">
      <div className="screen-card">
        <span className="screen-eyebrow">{t("screens.final.eyebrow")}</span>
        <h1 className="screen-title">{t("screens.final.title")}</h1>
        <p className="screen-description">{t("screens.final.timeframe")}</p>

        <section className="final-section">
          <div className="highlight-panel final-section__panel">
            <strong>{t("screens.final.conditionsTitle")}</strong>
            <p>{t("screens.final.conditionsDescription")}</p>

            <div className="conditions-list">
              <div className="conditions-item">
                <span>{t("screens.final.minimumOrderLabel")}</span>
                <strong>{t("screens.final.minimumOrderValue")}</strong>
              </div>
              <div className="conditions-item">
                <span>{t("screens.final.tierOneLabel")}</span>
                <strong>{t("screens.final.tierOneValue")}</strong>
              </div>
              <div className="conditions-item">
                <span>{t("screens.final.tierTwoLabel")}</span>
                <strong>{t("screens.final.tierTwoValue")}</strong>
              </div>
            </div>

            <div className="info-card info-card--section">
              <strong>{t("screens.final.estimatedPricesTitle")}</strong>
              <ul className="section-list">
                {products.map((product) => (
                  <li key={product.id}>
                    {t(product.nameKey)}: {formatPriceRange(product.price.min, product.price.max)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="social-proof">
          <span>{t("screens.final.socialProofLabel")}</span>
          <p>{t("screens.final.socialProofLocations")}</p>
        </div>

        <div className="button-row">
          <a
            className="primary-button"
            href={managerLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              void track("contact_click");
            }}
          >
            {t("screens.final.primaryCta")}
          </a>
          <Link to="/catalog" className="secondary-button">
            {t("screens.final.secondaryCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
