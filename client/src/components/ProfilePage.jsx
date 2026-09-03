import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";

const roleLabels = {
  MENTEE: "חניכה",
  MENTOR: "מנטורית",
  ADMIN: "מנהלת",
};

function ProfilePage({ user }) {
  if (!user) {
    return (
      <Alert
        severity="info"
        action={
          <Button component={RouterLink} to="/login" color="inherit" size="small">
            כניסה
          </Button>
        }
      >
        יש להתחבר כדי לראות את הפרופיל.
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 720 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          פרופיל בסיסי
        </Typography>
        <Typography>
          שם: {user.firstName} {user.lastName}
        </Typography>
        <Typography>אימייל: {user.email}</Typography>
        <Typography>תפקיד: {roleLabels[user.role] || user.role}</Typography>
      </Stack>
    </Paper>
  );
}

export default ProfilePage;
