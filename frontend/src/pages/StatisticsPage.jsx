import { useTranslation } from "react-i18next";

const StatisticsPage = () => {
  const { t } = useTranslation();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("statistics")}</p>
          <h1>{t("statistics")}</h1>
        </div>
      </div>

      <div className="content-card">
        <p>{t("comingSoon")}</p>
      </div>
    </section>
  );
};

export default StatisticsPage;