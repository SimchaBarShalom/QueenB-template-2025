import React from "react";
import { useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import AuthenticatedNavbar from "./AuthenticatedNavbar";
import { useLanguage } from "../i18n/LanguageContext";

function AppLayout({ children, currentUser, onLogout, onOpenLogin, onOpenRegister }) {
  const { direction } = useLanguage();
  const location = useLocation();

  // Every authenticated area (mentee/mentor/admin/profile) shares the same
  // authenticated navbar shell; only the public homepage shows the marketing
  // navbar with login/register triggers.
  const showAuthenticatedNavbar = Boolean(currentUser) && location.pathname !== "/";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }} dir={direction}>
      {showAuthenticatedNavbar ? (
        <AuthenticatedNavbar currentUser={currentUser} onLogout={onLogout} />
      ) : (
        <Navbar onOpenLogin={onOpenLogin} onOpenRegister={onOpenRegister} />
      )}

      <Box component="main">{children}</Box>
    </Box>
  );
}

export default AppLayout;
