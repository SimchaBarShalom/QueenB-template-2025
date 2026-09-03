import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";

function AppLayout({ children, currentUser, onLogout }) {
  const location = useLocation();

  const navItems = [
    { label: "בית", to: "/" },
    { label: "פרופיל", to: "/profile" },
    { label: "אזור חניכה", to: "/mentee" },
    { label: "אזור מנטורית", to: "/mentor" },
    { label: "ניהול", to: "/admin" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }} dir="rtl">
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #e5e7eb" }}>
        <Toolbar sx={{ gap: 2, py: 1, flexWrap: "wrap" }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{ color: "primary.main", fontWeight: 800, ml: 2 }}
          >
            Queens Match
          </Typography>

          <Stack direction="row" spacing={1} sx={{ flexGrow: 1, flexWrap: "wrap", rowGap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                color={location.pathname === item.to ? "primary" : "inherit"}
                variant={location.pathname === item.to ? "outlined" : "text"}
                size="small"
              >
                {item.label}
              </Button>
            ))}
          </Stack>

          {currentUser ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {currentUser.firstName} {currentUser.lastName}
              </Typography>
              <Button variant="contained" size="small" onClick={onLogout}>
                יציאה
              </Button>
            </Stack>
          ) : (
            <Button component={RouterLink} to="/login" variant="contained" size="small">
              כניסה
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {children}
      </Container>
    </Box>
  );
}

export default AppLayout;
