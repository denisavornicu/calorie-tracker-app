import { useTranslation } from "react-i18next";

const MessagesPage = () => {
  const { t } = useTranslation();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("messages")}</p>
          <h1>{t("messages")}</h1>
        </div>
      </div>

      <div className="content-card">
        <h2>{t("messages")}</h2>
        <p>{t("messagesComingSoon")}</p>
      </div>
    </section>
  );
};

export default MessagesPage;