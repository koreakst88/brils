import { useTranslation } from "../i18n";

const languages = [
  { value: "ru", label: "RU" },
  { value: "en", label: "EN" },
  { value: "ko", label: "KO" },
] as const;

export function Header() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark">
          <img src="/images/logo.jpg" alt="BRILS" />
        </div>
      </div>

      <div
        className="language-switcher"
        aria-label={t("header.languageSwitcher")}
      >
        {languages.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`language-chip ${language === item.value ? "is-active" : ""}`}
            onClick={() => setLanguage(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
