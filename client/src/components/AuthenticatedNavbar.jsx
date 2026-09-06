import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { AppBar, Box, Button, Stack, Toolbar } from "@mui/material";
import UserMenu from "./UserMenu";
import QueensMatchLogo from "./QueensMatchLogo";
import { getDefaultAreaPath, isMentorUser } from "../utils/areaRouting";

function AuthenticatedNavbar({ currentUser, onLogout }) {
  const mentor = isMentorUser(currentUser);
  const homePath = getDefaultAreaPath(currentUser);
  const links = mentor
    ? [{ path: "/mentor/meetings", label: "הפגישות שלי" }]
    : [
        { path: "/mentee/mentors", label: "חיפוש מנטוריות" },
        { path: "/mentee/meetings", label: "הפגישות שלי" },
      ];

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ bgcolor: "#fff", borderBottom: "1px solid #f6d3e0" }}
    >
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
          <Box
            component={RouterLink}
            to={homePath}
            sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            <QueensMatchLogo height={48} />
          </Box>

          <Stack direction="row" spacing={0.5}>
            {links.map((link) => (
              <Button
                key={link.path}
                component={RouterLink}
                to={link.path}
                size="small"
                sx={{ fontWeight: 600 }}
              >
                {link.label}
              </Button>
            ))}
          </Stack>

          <Box sx={{ flexGrow: 1 }} />
          <UserMenu currentUser={currentUser} onLogout={onLogout} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default AuthenticatedNavbar;
