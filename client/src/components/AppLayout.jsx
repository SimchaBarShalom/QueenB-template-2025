import React from "react";
import { Box, Container } from "@mui/material";
import Navbar from "./Navbar";
import { useLanguage } from "../i18n/LanguageContext";

function AppLayout({ children, currentUser, onLogout }) {
  const { direction } = useLanguage();

  return (
    <Box
      sx={{ minHeight: "100vh", bgcolor: "background.default" }}
      dir={direction}
    >
      <Navbar
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <Container
        component="main"
        maxWidth="lg"
        sx={{ py: { xs: 4, md: 6 } }}
      >
        {children}
      </Container>
    </Box>
  );
}

export default AppLayout;