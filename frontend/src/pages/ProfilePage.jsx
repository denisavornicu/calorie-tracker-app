//frontend/src/pages/ProfilePage.jsx

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const defaultProfile = {
  gender: "female",
  age: 22,
  heightCm: 150,
  weightKg: 44,
  maintenanceCalories: 1360,
  proteinTarget: 80,
  fiberTarget: 25,
  fatTarget: 45,
  saturatedFatLimit: 15,
  unsaturatedFatTarget: 30,
  carbsTarget: 170,
  sugarLimit: 50,
  addedSugarLimit: 25,
  waterTargetMl: 2500,
};

const defaultPreferences = {
  language: "ro",
  colorMode: "light",
  themeStyle: "pink-purple",
  sidebarCollapsed: false,
};

const numericProfileFields = [
  "age",
  "heightCm",
  "weightKg",
  "maintenanceCalories",
  "proteinTarget",
  "fiberTarget",
  "fatTarget",
  "saturatedFatLimit",
  "unsaturatedFatTarget",
  "carbsTarget",
  "sugarLimit",
  "addedSugarLimit",
  "waterTargetMl",
];

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { updateStoredUser } = useAuth();
  const { changeColorMode, changeThemeStyle } = useTheme();

  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState(defaultProfile);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchProfile = async () => {
    try {
      const response = await api.get("/profile");
      setUsername(response.data.username || "");
      setProfile({
        ...defaultProfile,
        ...(response.data.profile || {}),
      });
      setPreferences({
        ...defaultPreferences,
        ...(response.data.preferences || {}),
      });
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  };

  const handlePreferenceChange = (event) => {
    const { name, value } = event.target;

    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [name]: value,
    }));
  };

  const buildProfilePayload = () => {
    const payload = {
      ...profile,
    };

    numericProfileFields.forEach((field) => {
      payload[field] = Number(payload[field] || 0);
    });

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");

    try {
      setSaving(true);

      const payload = {
        profile: buildProfilePayload(),
        preferences,
      };

      const response = await api.put("/profile", payload);

      if (response.data.preferences?.language) {
        i18n.changeLanguage(response.data.preferences.language);
        localStorage.setItem("language", response.data.preferences.language);
      }

      if (response.data.preferences?.colorMode) {
        changeColorMode(response.data.preferences.colorMode);
      }

      if (response.data.preferences?.themeStyle) {
        changeThemeStyle(response.data.preferences.themeStyle);
      }

      updateStoredUser({
        username: response.data.username,
        profile: response.data.profile,
        preferences: response.data.preferences,
      });

      setProfile({
        ...defaultProfile,
        ...(response.data.profile || {}),
      });
      setPreferences({
        ...defaultPreferences,
        ...(response.data.preferences || {}),
      });
      setSuccessMessage(t("savedSuccessfully"));
    } catch (error) {
      console.error("Failed to save profile", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="content-card">
          <p>{t("loading")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{username || t("profile")}</p>
          <h1>{t("profile")}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="content-card form-card">
          <div className="section-title">
            <div>
              <h2>{t("personalData")}</h2>
              <p>{t("profileSubtitle")}</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              {t("gender")}
              <select
                className="form-select"
                name="gender"
                value={profile.gender}
                onChange={handleProfileChange}
              >
                <option value="female">{t("female")}</option>
                <option value="male">{t("male")}</option>
                <option value="other">{t("other")}</option>
              </select>
            </label>

            <label>
              {t("age")}
              <input
                className="form-input"
                type="number"
                name="age"
                value={profile.age}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("heightCm")}
              <input
                className="form-input"
                type="number"
                name="heightCm"
                value={profile.heightCm}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("weightKg")}
              <input
                className="form-input"
                type="number"
                step="0.1"
                name="weightKg"
                value={profile.weightKg}
                onChange={handleProfileChange}
              />
            </label>
          </div>
        </div>

        <div className="content-card form-card">
          <div className="section-title">
            <div>
              <h2>{t("nutritionTargets")}</h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              {t("maintenanceCalories")}
              <input
                className="form-input"
                type="number"
                name="maintenanceCalories"
                value={profile.maintenanceCalories}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("proteinTarget")}
              <input
                className="form-input"
                type="number"
                step="0.1"
                name="proteinTarget"
                value={profile.proteinTarget}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("fiberTarget")}
              <input
                className="form-input"
                type="number"
                step="0.1"
                name="fiberTarget"
                value={profile.fiberTarget}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("fatTarget")}
              <input
                className="form-input"
                type="number"
                step="0.1"
                name="fatTarget"
                value={profile.fatTarget}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("saturatedFatLimit")}
              <input
                className="form-input"
                type="number"
                step="0.1"
                name="saturatedFatLimit"
                value={profile.saturatedFatLimit}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("unsaturatedFatTarget")}
              <input
                className="form-input"
                type="number"
                step="0.1"
                name="unsaturatedFatTarget"
                value={profile.unsaturatedFatTarget}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("carbsTarget")}
              <input
                className="form-input"
                type="number"
                step="0.1"
                name="carbsTarget"
                value={profile.carbsTarget}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("sugarLimit")}
              <input
                className="form-input"
                type="number"
                step="0.1"
                name="sugarLimit"
                value={profile.sugarLimit}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("addedSugarLimit")}
              <input
                className="form-input"
                type="number"
                step="0.1"
                name="addedSugarLimit"
                value={profile.addedSugarLimit}
                onChange={handleProfileChange}
              />
            </label>

            <label>
              {t("waterTargetMl")}
              <input
                className="form-input"
                type="number"
                name="waterTargetMl"
                value={profile.waterTargetMl}
                onChange={handleProfileChange}
              />
            </label>
          </div>
        </div>

        <div className="content-card form-card">
          <div className="section-title">
            <div>
              <h2>{t("appPreferences")}</h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              {t("language")}
              <select
                className="form-select"
                name="language"
                value={preferences.language}
                onChange={handlePreferenceChange}
              >
                <option value="ro">{t("romanian")}</option>
                <option value="en">{t("english")}</option>
              </select>
            </label>

            <label>
              {t("colorMode")}
              <select
                className="form-select"
                name="colorMode"
                value={preferences.colorMode}
                onChange={handlePreferenceChange}
              >
                <option value="light">{t("lightMode")}</option>
                <option value="dark">{t("darkMode")}</option>
              </select>
            </label>

            <label>
              {t("themeStyle")}
              <select
                className="form-select"
                name="themeStyle"
                value={preferences.themeStyle}
                onChange={handlePreferenceChange}
              >
                <option value="pink-purple">{t("pinkPurple")}</option>
                <option value="green">{t("green")}</option>
              </select>
            </label>
          </div>
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>}

        <button type="submit" className="primary-button profile-save-button" disabled={saving}>
          {saving ? t("loading") : t("saveChanges")}
        </button>
      </form>
    </section>
  );
};

export default ProfilePage;
