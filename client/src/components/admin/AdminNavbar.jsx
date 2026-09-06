import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AppBar, Box, Button, Stack, Toolbar } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import QueensMatchLogo from "../QueensMatchLogo";
import UserMenu from "../UserMenu";

const NAV_ITEMS = [
  { path: "/admin", label: "סקירה", icon: <DashboardIcon fontSize="small" />, exact: true },
  { path: "/admin/users", label: "משתמשות", icon: <GroupsIcon fontSize="small" /> },
  { path: "/admin/meetings", label: "פגישות", icon: <EventNoteIcon fontSize="small" /> },
  { path: "/admin/calendar", label: "לוח שנה", icon: <CalendarMonthIcon fontSize="small" /> },
  { path: "/admin/alerts", label: "התראות", icon: <NotificationsActiveIcon fontSize="small" /> },
];

function AdminNavbar({ currentUser, onLogout }) {
  const location = useLocation();

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ bgcolor: "#fff", borderBottom: "1px solid #f6d3e0" }}>
      <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1280,
            mx: "auto",
            px: { xs: 2, md: 4 },
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, md: 3 },
          }}
        >
          <Box component={RouterLink} to="/admin" sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <QueensMatchLogo height={48} />
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ overflowX: "auto", flexGrow: 1 }}>
            {NAV_ITEMS.map((item) => {
              const selected = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
              return (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  size="small"
                  startIcon={item.icon}
                  sx={{
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    color: selected ? "primary.main" : "text.primary",
                    bgcolor: selected ? "#fff0f6" : "transparent",
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          <UserMenu currentUser={currentUser} onLogout={onLogout} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default AdminNavbar;
