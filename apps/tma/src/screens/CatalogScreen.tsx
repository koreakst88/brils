import { useEffect } from "react";
import { Link } from "react-router-dom";
import { products } from "../data/products";
import { useTranslation } from "../i18n";
import { track } from "../lib/amplitude";

export function CatalogScreen() {
  const { t } = useTranslation();
  const sortedProducts = [...products].sort((left, right) => {
    if (left.isSet === right.isSet) {
      return 0;
    }

    return left.isSet ? 1 : -1;
  });

  useEffect(() => {
    void track("catalog_view");
  }, []);

  return (
    <section className="screen">
      <div className="screen-card">
        <span className="screen-eyebrow">{t("screens.catalog.eyebrow")}</span>
        <h1 className="screen-title">{t("screens.catalog.title")}</h1>
        <p className="screen-description">{t("screens.catalog.description")}</p>

        <div className="catalog-grid">
          {sortedProducts.map((product) => (
            <Link
              key={product.id}
              to={product.isSet ? `/set/${product.id}` : `/product/${product.id}`}
              className={`catalog-card ${product.isSet ? "catalog-card--set" : ""}`}
            >
              <div className="catalog-card__image">
                <img src={product.images.main} alt={t(product.nameKey)} />
              </div>
              <span className="catalog-card__type">
                {product.isSet
                  ? t("screens.catalog.bundleOffer")
                  : t("screens.catalog.productLabel")}
              </span>
              <strong>{t(product.nameKey)}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
