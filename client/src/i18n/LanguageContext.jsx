import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import translations from "./translations";

const STORAGE_KEY = "queensMatchLanguage";

// Hebrew and Arabic read right-to-left; English reads left-to-right.
const DIRECTION_BY_LANGUAGE = { he: "rtl", en: "ltr", ar: "rtl" };

const LanguageContext = createContext(null);

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return savedLanguage && translations[savedLanguage] ? savedLanguage : "he";
  });

  const direction = DIRECTION_BY_LANGUAGE[language] || "rtl";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language, direction]);

  // Looks up a dot-separated key such as "auth.email" in the current
  // language's translation object. Falls back to the key itself so a
  // missing translation is visible instead of crashing the page.
  const t = useMemo(() => {
    return (key) => {
      const value = key
        .split(".")
        .reduce((current, part) => (current ? current[part] : undefined), translations[language]);

      return value ?? key;
    };
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, direction, t }),
    [language, direction, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}

export { LanguageProvider, useLanguage };