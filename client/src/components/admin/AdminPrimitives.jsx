import React from "react";
import { Box, Breadcrumbs, Chip, Link, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export function AdminPageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "flex-start" }} spacing={2} sx={{ mb: 3 }}>
      <Box>
        {breadcrumbs.length > 0 && (
          <Breadcrumbs sx={{ mb: 1, color: "text.secondary", fontSize: "0.875rem" }}>
            <Link component={RouterLink} to="/admin" color="inherit">
              ניהול
            </Link>
            {breadcrumbs.map((item) =>
              item.to ? (
                <Link key={item.label} component={RouterLink} to={item.to} color="inherit">
                  {item.label}
                </Link>
              ) : (
                <Typography key={item.label} color="text.primary" variant="body2">
                  {item.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>{actions}</Stack>}
    </Stack>
  );
}

export function AdminSurface({ children, sx, ...props }) {
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

export function AdminSectionTitle({ title, subtitle }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
        {title}
      </Typography>
      {subtitle && <Typography color="text.secondary" variant="body2">{subtitle}</Typography>}
    </Box>
  );
}

export function AdminStatusBadge({ label, color = "default", tone }) {
  const toneStyles = {
    urgent: { bgcolor: "#fde7ef", color: "#9b174d", borderColor: "#f3a8c4" },
    high: { bgcolor: "#fff0d9", color: "#8a4b00", borderColor: "#ffd58a" },
    normal: { bgcolor: "#f4efff", color: "#4d3694", borderColor: "#d8cdf8" },
    low: { bgcolor: "#eef7f2", color: "#276749", borderColor: "#b7dfc8" },
  }[tone];

  return <Chip size="small" label={label} color={tone ? "default" : color} sx={{ fontWeight: 700, border: "1px solid", ...toneStyles }} />;
}
