import { useTranslation } from "react-i18next";

const MealsPage = () => {
  const { t } = useTranslation();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("meals")}</p>
          <h1>{t("meals")}</h1>
        </div>

        <button type="button" className="primary-button small">
          + {t("addMeal")}
        </button>
      </div>

      <div className="content-card">
        <h2>{t("addMeal")}</h2>
        <p>{t("mealsComingSoon")}</p>
      </div>
    </section>
  );
};

export default MealsPage;