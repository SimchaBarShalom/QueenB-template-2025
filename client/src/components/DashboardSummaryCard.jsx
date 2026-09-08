import React from "react";
import { Box, Card, Stack, Typography } from "@mui/material";

function DashboardSummaryCard({ icon: Icon, title, value, subtitle }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
        borderColor: "#f6d3e0",
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
    </Card>
  );
}

export default DashboardSummaryCard;
