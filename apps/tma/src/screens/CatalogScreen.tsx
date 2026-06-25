import { useEffect } from "react";
import { Link } from "react-router-dom";
import { products } from "../data/products";
import { useTranslation } from "../i18n";
import { track } from "../lib/amplitude";

export function CatalogScreen() {
  const { t } = useTranslation();

  useEffect(() => {
    void track("catalog_view");
  }, []);

  return (
    <section className="screen">
      <div className="screen-card">
        <h1 className="screen-title">{t("screens.catalog.title")}</h1>
        <p className="screen-description">{t("screens.catalog.description")}</p>

        <div className="catalog-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="catalog-card"
            >
              <div className="catalog-card__image">
                <img src={product.images.main} alt={t(product.nameKey)} />
              </div>
              <strong>{t(product.nameKey)}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
