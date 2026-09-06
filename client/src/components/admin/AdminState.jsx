import React from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

export function AdminLoading() {
  return (
    <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
      <CircularProgress />
    </Box>
  );
}

export function AdminError({ message }) {
  if (!message) return null;
  return (
    <Alert severity="error" sx={{ mb: 3 }}>
      {message}
    </Alert>
  );
}

export function AdminEmpty({ title, subtitle }) {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: "center",
        border: "1px dashed #e8b8ca",
        borderRadius: 2,
        bgcolor: "#fff",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
