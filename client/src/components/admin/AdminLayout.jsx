import React from "react";
import { Box, Container } from "@mui/material";

function AdminLayout({ children }) {
  return (
    <Box className="admin-root" dir="rtl" sx={{ minHeight: "100vh", bgcolor: "#fff8fb", py: { xs: 2.5, md: 3.5 }, overflowX: "clip" }}>
      <Container
        dir="rtl"
        maxWidth="lg"
        sx={{ px: { xs: 2, sm: 3, md: 4 } }}
      >
        {children}
      </Container>
    </Box>
  );
}

export default AdminLayout;
