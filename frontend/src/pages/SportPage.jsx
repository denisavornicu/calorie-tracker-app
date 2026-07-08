import { useTranslation } from "react-i18next";

const SportPage = () => {
  const { t } = useTranslation();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("sport")}</p>
          <h1>{t("sport")}</h1>
        </div>
      </div>

      <div className="content-card">
        <p>{t("comingSoon")}</p>
      </div>
    </section>
  );
};

export default SportPage;