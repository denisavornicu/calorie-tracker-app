import { useTranslation } from "react-i18next";

const ProfilePage = () => {
  const { t } = useTranslation();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("profile")}</p>
          <h1>{t("profile")}</h1>
        </div>
      </div>

      <div className="content-card">
        <p>{t("comingSoon")}</p>
      </div>
    </section>
  );
};

export default ProfilePage;