import { useTranslation } from "react-i18next";

const FoodsPage = () => {
  const { t } = useTranslation();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("foods")}</p>
          <h1>{t("foods")}</h1>
        </div>

        <button type="button" className="primary-button small">
          + {t("addMeal")}
        </button>
      </div>

      <div className="content-card">
        <p>{t("comingSoon")}</p>
      </div>
    </section>
  );
};

export default FoodsPage;