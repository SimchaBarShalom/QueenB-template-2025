import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Chip, Container, Paper, Stack, Typography } from "@mui/material";

function ProfilePage({ user }) {
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Alert
          severity="info"
          action={
            <Button component={RouterLink} to="/" color="inherit" size="small">
              לדף הבית
            </Button>
          }
        >
          יש להתחבר כדי לראות את הפרופיל.
        </Alert>
      </Container>
    );
  }

  const capabilities = [
    "חניכה",
    user.mentorProfile && "מנטורית",
    user.isAdmin && "מנהלת",
  ].filter(Boolean);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, borderColor: "#f6d3e0" }}>
        <Stack spacing={2}>
          <Typography variant="h4" component="h1">
            פרופיל
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
            {capabilities.map((label) => (
              <Chip key={label} label={label} color="primary" variant="outlined" />
            ))}
          </Stack>

          <Box>
            <Typography color="text.secondary">שם מלא</Typography>
            <Typography>{user.fullName}</Typography>
          </Box>

          <Box>
            <Typography color="text.secondary">אימייל</Typography>
            <Typography>{user.email}</Typography>
          </Box>

          {user.jobTitle && (
            <Box>
              <Typography color="text.secondary">תפקיד נוכחי</Typography>
              <Typography>
                {user.jobTitle}
                {user.workplace ? ` · ${user.workplace}` : ""}
              </Typography>
            </Box>
          )}

          {user.mentorProfile && (
            <Box>
              <Typography color="text.secondary">תחומי מנטורינג</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 0.5 }}>
                {user.mentorProfile.mentoringTopics.map((topic) => (
                  <Chip key={topic} label={topic} size="small" />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

export default ProfilePage;
