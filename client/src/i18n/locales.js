export const LOCALE_BY_LANGUAGE = {
  he: "he-IL",
  en: "en-US",
  ar: "ar",
};

export const FULLCALENDAR_LOCALE_BY_LANGUAGE = {
  he: "he",
  en: "en",
  ar: "ar",
};

export function getLocale(language = "he") {
  return LOCALE_BY_LANGUAGE[language] || LOCALE_BY_LANGUAGE.he;
}

export function formatDate(value, language = "he") {
  if (!value) return "";
  return new Date(value).toLocaleDateString(getLocale(language));
}

export function formatTime(value, language = "he") {
  if (!value) return "";
  return new Date(value).toLocaleTimeString(getLocale(language), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(value, language = "he") {
  if (!value) return "";
  return new Date(value).toLocaleString(getLocale(language), {
    dateStyle: "short",
    timeStyle: "short",
  });
}
