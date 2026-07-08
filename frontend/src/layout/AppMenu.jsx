import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Utensils,
  Apple,
  Dumbbell,
  BarChart3,
  User,
  MessageCircle,
  LogOut,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const AppMenu = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", label: t("home"), icon: <Home size={20} /> },
    { path: "/meals", label: t("meals"), icon: <Utensils size={20} /> },
    { path: "/foods", label: t("foods"), icon: <Apple size={20} /> },
    { path: "/sport", label: t("sport"), icon: <Dumbbell size={20} /> },
    { path: "/statistics", label: t("statistics"), icon: <BarChart3 size={20} /> },
    { path: "/messages", label: t("messages"), icon: <MessageCircle size={20} /> },
    { path: "/profile", label: t("profile"), icon: <User size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login");
  };

  return (
    <>
      <div
        className={`menu-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      <aside className={`app-menu ${isOpen ? "open" : ""}`}>
        <div className="menu-header">
          <div className="brand">
            <div className="brand-icon">CT</div>

            <div>
              <h2>{t("appName")}</h2>
              <p>{user?.username || "User"}</p>
            </div>
          </div>

          <button type="button" className="icon-only-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="menu-nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={onClose}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="menu-logout" onClick={handleLogout}>
          <LogOut size={19} />
          <span>{t("logout")}</span>
        </button>
      </aside>
    </>
  );
};

export default AppMenu;