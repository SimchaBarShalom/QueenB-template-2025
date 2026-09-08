import React from "react";
import { Alert, Paper, Stack, Typography } from "@mui/material";
import { useLanguage } from "../i18n/LanguageContext";

function RoleAreaPage({ role }) {
  const { t } = useLanguage();

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          {t(`roleArea.${role}_title`)}
        </Typography>
        <Alert severity="info">{t(`roleArea.${role}_text`)}</Alert>
      </Stack>
    </Paper>
  );
}

export default RoleAreaPage;
