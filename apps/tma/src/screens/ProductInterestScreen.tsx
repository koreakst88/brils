import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";
import { track } from "../lib/amplitude";
import { useAppStore } from "../store/useAppStore";

const products = [
  "essence",
  "bbCream",
  "cushion",
  "sleepingMask",
  "full-line",
] as const;
const productIcons: Record<(typeof products)[number], string> = {
  essence: "🫘",
  bbCream: "🧴",
  cushion: "💎",
  sleepingMask: "🌙",
  "full-line": "✨",
};

export function ProductInterestScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const selectedProducts = useAppStore((state) => state.selectedProducts);
  const toggleSelectedProduct = useAppStore(
    (state) => state.toggleSelectedProduct,
  );
  const hasSelection = selectedProducts.length > 0;

  return (
    <section className="screen">
      <div className="screen-card">
        <span className="screen-eyebrow">
          {t("screens.products.eyebrow")}
        </span>
        <h1 className="screen-title">{t("screens.products.title")}</h1>
        <p className="screen-description">
          {t("screens.products.description")}
        </p>

        <div className="choice-grid product-interest-grid">
          {products.map((item) => {
            const isSelected = selectedProducts.includes(item);

            return (
              <button
                key={item}
                type="button"
                className={`choice-card product-interest-card ${
                  isSelected ? "is-selected" : ""
                }`}
                onClick={() => {
                  const nextProducts = isSelected
                    ? selectedProducts.filter((product) => product !== item)
                    : [...selectedProducts, item];

                  toggleSelectedProduct(item);
                  void track("products_selected", {
                    products: nextProducts,
                  });
                }}
              >
                <span
                  className={`product-interest-card__check ${
                    isSelected ? "is-visible" : ""
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="product-interest-card__icon" aria-hidden="true">
                  {productIcons[item]}
                </span>
                <span className="product-interest-card__label">
                  {t(`screens.products.options.${item}`)}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="primary-button primary-button--full"
          disabled={!hasSelection}
          onClick={() => navigate("/catalog")}
        >
          {t("screens.products.cta")}
        </button>
      </div>
    </section>
  );
}
