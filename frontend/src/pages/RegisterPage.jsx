import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import LanguageToggle from "../components/LanguageToggle";
import ThemeToggle from "../components/ThemeToggle";

const RegisterPage = () => {
  const { t } = useTranslation();
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const result = await register(formData.username, formData.password);

    if (result.success) {
      navigate("/");
    } else {
      setError(t("registerFailed"));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-top-actions">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="auth-card">
        <div className="auth-badge">✦</div>

        <h1>{t("createAccount")}</h1>
        <p>{t("registerSubtitle")}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            {t("username")}
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Denisa"
            />
          </label>

          <label>
            {t("password")}
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="denisa"
            />
          </label>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? t("loading") : t("register")}
          </button>
        </form>

        <p className="auth-link">
          {t("alreadyHaveAccount")} <Link to="/login">{t("login")}</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;