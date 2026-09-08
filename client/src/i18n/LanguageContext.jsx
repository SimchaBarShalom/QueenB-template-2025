import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import translations from "./translations";
import { getLocale } from "./locales";

const STORAGE_KEY = "queensMatchLanguage";

// Hebrew and Arabic read right-to-left; English reads left-to-right.
const DIRECTION_BY_LANGUAGE = { he: "rtl", en: "ltr", ar: "rtl" };

const LanguageContext = createContext(null);

function lookup(dictionary, key) {
  return key.split(".").reduce((current, part) => (current == null ? undefined : current[part]), dictionary);
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => (vars[name] == null ? `{${name}}` : String(vars[name])));
}

function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return savedLanguage && translations[savedLanguage] ? savedLanguage : "he";
  });

  const direction = DIRECTION_BY_LANGUAGE[language] || "rtl";
  const locale = getLocale(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language, direction]);

  // Looks up a dot-separated key such as "auth.email" in the current
  // language's translation object. Missing en/ar keys fall back to Hebrew,
  // then to the key itself so incomplete translations stay visible.
  // Optional second argument interpolates {name} placeholders.
  const t = useMemo(() => {
    return (key, vars) => {
      const fromCurrent = lookup(translations[language], key);
      const fromHebrew = language === "he" ? undefined : lookup(translations.he, key);
      const value = typeof fromCurrent === "string" ? fromCurrent : typeof fromHebrew === "string" ? fromHebrew : null;

      if (value == null) return key;
      return interpolate(value, vars);
    };
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, direction, locale, t }),
    [language, direction, locale, t]
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
