import { Bell, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../components/LanguageToggle";
import ThemeToggle from "../components/ThemeToggle";

const Topbar = ({ onMenuClick }) => {
  const { t } = useTranslation();

  return (
    <header className="topbar">
      <button type="button" className="topbar-icon-button" onClick={onMenuClick}>
        <Menu size={22} />
      </button>

      <div className="topbar-title">
        <h1>{t("appName")}</h1>
        <p>{t("dashboard")}</p>
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