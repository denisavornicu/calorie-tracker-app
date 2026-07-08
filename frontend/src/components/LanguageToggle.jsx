import { useTranslation } from "react-i18next";

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("language", language);
  };

  return (
    <div className="language-toggle">
      <button
        className={currentLanguage === "ro" ? "active" : ""}
        onClick={() => changeLanguage("ro")}
      >
        RO
      </button>

      <button
        className={currentLanguage === "en" ? "active" : ""}
        onClick={() => changeLanguage("en")}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;