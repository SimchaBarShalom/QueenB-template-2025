import React from "react";
import { Box, Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { AppSurface, AppSectionTitle, AppStatusBadge } from "../AppPrimitives";

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

export const AdminSurface = AppSurface;
export const AdminSectionTitle = AppSectionTitle;
export const AdminStatusBadge = AppStatusBadge;
