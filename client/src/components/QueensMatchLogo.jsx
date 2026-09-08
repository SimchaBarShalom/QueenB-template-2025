import React from "react";
import { Box } from "@mui/material";
import { useLanguage } from "../i18n/LanguageContext";

function QueensMatchLogo({ height = 48, sx = {} }) {
  const { t } = useLanguage();
  return (
    <Box
      component="img"
      src="/queen-match-logo.png"
      alt={t("common.logoAlt")}
      sx={{
        display: "block",
        height,
        width: "auto",
        maxWidth: "100%",
        objectFit: "contain",
        ...sx,
      }}
    />
  );
}

export default QueensMatchLogo;