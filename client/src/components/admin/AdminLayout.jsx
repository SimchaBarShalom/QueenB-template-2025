import React from "react";
import { Box, Container } from "@mui/material";
import { useLanguage } from "../../i18n/LanguageContext";

function AdminLayout({ children }) {
  const { direction } = useLanguage();

  return (
    <Box className="admin-root" dir={direction} sx={{ minHeight: "100vh", bgcolor: "#fff8fb", py: { xs: 2.5, md: 3.5 }, overflowX: "clip" }}>
      <Container
        dir={direction}
        maxWidth="lg"
        sx={{ px: { xs: 2, sm: 3, md: 4 } }}
      >
        {children}
      </Container>
    </Box>
  );
}

export default AdminLayout;
