import { Bell, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../components/LanguageToggle";
import ThemeToggle from "../components/ThemeToggle";

const formatTodayDate = (language) => {
  const locale = language === "en" ? "en-US" : "ro-RO";

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
};

const Topbar = ({ onMenuClick }) => {
  const { t, i18n } = useTranslation();

  return (
    <header className="topbar">
      <button type="button" className="topbar-icon-button" onClick={onMenuClick}>
        <Menu size={22} />
      </button>

      <div className="topbar-title">
        <h1>{t("appName")}</h1>
        <p>{formatTodayDate(i18n.language)}</p>
      </div>

      <div className="topbar-actions">
        <LanguageToggle />
        <ThemeToggle />

        <button
          type="button"
          className="topbar-icon-button notification-button"
          title={t("notifications")}
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;