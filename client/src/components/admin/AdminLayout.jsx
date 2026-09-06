import React from "react";
import { Box, Container } from "@mui/material";

function AdminLayout({ children }) {
  return (
    <Box className="admin-root" dir="ltr" sx={{ minHeight: "100vh", bgcolor: "#fff8fb", py: { xs: 2.5, md: 3.5 }, overflowX: "clip" }}>
      <Container
        dir="rtl"
        maxWidth="lg"
        sx={{ paddingInlineStart: { xs: 5, sm: 3, md: 4 }, paddingInlineEnd: { xs: 2, sm: 3, md: 4 } }}
      >
        {children}
      </Container>
    </Box>
  );
}

export default AdminLayout;
