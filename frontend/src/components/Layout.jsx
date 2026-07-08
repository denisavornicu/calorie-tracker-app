import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, Utensils, Dumbbell, BarChart3, User, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";

const Layout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      path: "/",
      label: t("home"),
      icon: <Home size={19} />,
    },
    {
      path: "/foods",
      label: t("foods"),
      icon: <Utensils size={19} />,
    },
    {
      path: "/sport",
      label: t("sport"),
      icon: <Dumbbell size={19} />,
    },
    {
      path: "/statistics",
      label: t("statistics"),
      icon: <BarChart3 size={19} />,
    },
    {
      path: "/profile",
      label: t("profile"),
      icon: <User size={19} />,
    },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">CT</div>
          <div>
            <h2>{t("appName")}</h2>
            <p>{user?.username || "User"}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-actions">
          <LanguageToggle />
          <ThemeToggle />

          <button type="button" className="logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="mobile-header">
          <div className="brand mobile-brand">
            <div className="brand-icon">CT</div>
            <div>
              <h2>{t("appName")}</h2>
              <p>{user?.username || "User"}</p>
            </div>
          </div>

          <div className="mobile-controls">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <Outlet />
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;