import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { productMap } from "../data/products";
import { useTranslation } from "../i18n";
import { track } from "../lib/amplitude";

export function ProductScreen() {
  const { id = "bb-cream" } = useParams();
  const { t } = useTranslation();
  const product = productMap.get(id ?? "bb-cream") ?? productMap.get("bb-cream");

  if (!product || product.isSet) {
    return null;
  }

  useEffect(() => {
    void track("product_view", {
      product_id: product.id,
      product_name: t(product.nameKey),
    });
  }, [product.id, product.nameKey, t]);

  return (
    <section className="screen">
      <div className="screen-card screen-card--split">
        <div className="product-gallery" aria-label={t("screens.product.gallery")}>
          {product.images.gallery.map((image, index) => (
            <div
              key={`${product.id}-${image}`}
              className={`product-gallery__slide ${
                index === product.images.gallery.length - 1
                  ? "product-gallery__slide--info"
                  : ""
              }`}
            >
              <img src={image} alt={t(product.nameKey)} />
            </div>
          ))}
        </div>

        <div className="stack">
          <span className="screen-eyebrow">{t("screens.product.eyebrow")}</span>
          <h1 className="screen-title">{t(product.nameKey)}</h1>
          <p className="screen-description">{t(product.descriptionKey)}</p>

          <ul className="benefit-list benefit-list--checks">
            {product.benefits.map((benefit) => (
              <li key={benefit}>
                <span className="benefit-list__icon">✓</span>
                <span>{t(benefit)}</span>
              </li>
            ))}
          </ul>

          <div className="button-row button-row--single">
            <Link
              to="/form"
              className="primary-button primary-button--full"
              onClick={() => {
                void track("cta_click", {
                  product_id: product.id,
                  product_name: t(product.nameKey),
                });
              }}
            >
              {t("screens.product.cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
