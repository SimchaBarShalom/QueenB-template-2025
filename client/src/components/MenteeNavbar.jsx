import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { AppBar, Box, Button, Stack, Toolbar } from "@mui/material";
import UserMenu from "./UserMenu";
import QueensMatchLogo from "./QueensMatchLogo";

// Authenticated navbar shared by every logged-in area (mentee/mentor/admin).
// Only the mentee-facing links are built out in this pass; the profile
// menu's area-switch options adapt per user (see UserMenu + areaRouting).
function MenteeNavbar({ currentUser, onLogout }) {
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ bgcolor: "#fff", borderBottom: "1px solid #f6d3e0" }}>
      <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1200,
            mx: "auto",
            px: { xs: 2, md: 4 },
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, md: 3 },
          }}
        >
          <Box component={RouterLink} to="/mentee" sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <QueensMatchLogo height={48} />
          </Box>

          <Stack direction="row" spacing={0.5}>
            <Button component={RouterLink} to="/mentee/mentors" size="small" sx={{ fontWeight: 600 }}>
              חיפוש מנטוריות
            </Button>
            <Button component={RouterLink} to="/mentee/meetings" size="small" sx={{ fontWeight: 600 }}>
              הפגישות שלי
            </Button>
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <UserMenu currentUser={currentUser} onLogout={onLogout} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default MenteeNavbar;
