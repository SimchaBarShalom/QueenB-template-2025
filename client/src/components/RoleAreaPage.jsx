import React from "react";
import { Alert, Paper, Stack, Typography } from "@mui/material";

const roleContent = {
  MENTEE: {
    title: "אזור חניכה",
    text: "עמוד בסיסי להמשך פיתוח תהליכי בקשות וחיבור למנטוריות.",
  },
  MENTOR: {
    title: "אזור מנטורית",
    text: "עמוד בסיסי להמשך פיתוח פרופיל מנטורית, זמינות ובקשות נכנסות.",
  },
  ADMIN: {
    title: "אזור ניהול",
    text: "עמוד בסיסי להמשך פיתוח יכולות ניהול ומעקב.",
  },
};

function RoleAreaPage({ role }) {
  const content = roleContent[role];

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          {content.title}
        </Typography>
        <Alert severity="info">{content.text}</Alert>
      </Stack>
    </Paper>
  );
}

export default RoleAreaPage;
