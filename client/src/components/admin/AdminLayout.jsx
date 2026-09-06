import React from "react";
import { Box, Container } from "@mui/material";

function AdminLayout({ children }) {
  return (
    <Box sx={{ py: { xs: 3, md: 4 } }}>
      <Container maxWidth="xl">{children}</Container>
    </Box>
  );
}

export default AdminLayout;
