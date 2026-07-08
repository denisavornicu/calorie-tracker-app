import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("dashboard")}</p>
          <h1>{t("home")}</h1>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="summary-card highlight-card">
          <span>{t("caloriesRemaining")}</span>
          <strong>1360 kcal</strong>
          <p>{t("maintenanceCalories")}</p>
        </article>

        <article className="summary-card">
          <span>{t("consumedCalories")}</span>
          <strong>0 kcal</strong>
          <p>{t("addMeal")}</p>
        </article>

        <article className="summary-card">
          <span>{t("burnedCalories")}</span>
          <strong>0 kcal</strong>
          <p>{t("sport")}</p>
        </article>

        <article className="summary-card">
          <span>{t("waterTarget")}</span>
          <strong>0 / 2500 ml</strong>
          <p>{t("addWater")}</p>
        </article>
      </div>

      <div className="content-card">
        <h2>{t("startFast")}</h2>
        <p>{t("comingSoon")}</p>
      </div>
    </section>
  );
};

export default HomePage;