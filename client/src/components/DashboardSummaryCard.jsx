import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { AppSurface } from "./AppPrimitives";

function DashboardSummaryCard({ icon: Icon, title, value, subtitle }) {
  return (
    <AppSurface
      sx={{
        p: 2,
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "background.default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon color="primary" />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>

          <Typography variant="h6" noWrap>
            {value}
          </Typography>

          {subtitle && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </AppSurface>
  );
}

export default DashboardSummaryCard;
