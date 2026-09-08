import React from "react";
import { Box, Chip, Container, Paper, Stack, Typography } from "@mui/material";

// Shared authenticated-area building blocks. Their visual treatment is based
// on the admin area so every role has the same spacing, surfaces and hierarchy.
export function AppPage({ children, maxWidth = "lg", sx }) {
  return (
    <Box sx={{ minHeight: "calc(100vh - 72px)", bgcolor: "background.default", py: { xs: 2.5, md: 3.5 }, ...sx }}>
      <Container maxWidth={maxWidth}>{children}</Container>
    </Box>
  );
}

export function AppPageHeader({ title, subtitle, actions }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "flex-start" }} spacing={2} sx={{ mb: 3 }}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: 0 }}>
          {title}
        </Typography>
        {subtitle && <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>{actions}</Stack>}
    </Stack>
  );
}

export function AppSurface({ children, sx, ...props }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #f1d1dd",
        borderRadius: 1.5,
        bgcolor: "#fff",
        boxShadow: "0 8px 24px rgba(74, 31, 52, 0.055)",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
}

export function AppSectionTitle({ title, subtitle, action }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2} sx={{ mb: 1.5 }}>
      <Box>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 800, lineHeight: 1.25 }}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" variant="body2">{subtitle}</Typography>}
      </Box>
      {action}
    </Stack>
  );
}

export function AppStatusBadge({ label, tone = "normal" }) {
  const toneStyles = {
    urgent: { bgcolor: "#fde7ef", color: "#9b174d", borderColor: "#f3a8c4" },
    high: { bgcolor: "#fff0d9", color: "#8a4b00", borderColor: "#ffd58a" },
    normal: { bgcolor: "#f4efff", color: "#4d3694", borderColor: "#d8cdf8" },
    success: { bgcolor: "#eef7f2", color: "#276749", borderColor: "#b7dfc8" },
    low: { bgcolor: "#eef7f2", color: "#276749", borderColor: "#b7dfc8" },
  }[tone];
  return <Chip size="small" label={label} sx={{ fontWeight: 700, border: "1px solid", ...toneStyles }} />;
}
