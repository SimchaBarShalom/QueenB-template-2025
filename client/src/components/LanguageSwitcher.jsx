import React from "react";
import { FormControl, MenuItem, Select } from "@mui/material";
import { useLanguage } from "../i18n/LanguageContext";

const LANGUAGE_OPTIONS = ["he", "en", "ar"];

function LanguageSwitcher({ size = "small" }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <FormControl size={size} variant="outlined" sx={{ minWidth: 118 }}>
      <Select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t("language.switcher")}
        sx={{
          fontWeight: 600,
          bgcolor: "#fff",
          "& .MuiSelect-select": { py: 0.75 },
        }}
      >
        {LANGUAGE_OPTIONS.map((code) => (
          <MenuItem key={code} value={code}>
            {t(`language.${code}`)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default LanguageSwitcher;
