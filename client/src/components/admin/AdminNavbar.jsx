import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
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
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isSelected = (item) => (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path));

  return (
    <AppBar className="admin-navbar" position="sticky" color="inherit" elevation={0} sx={{ bgcolor: "#fff", borderBottom: "1px solid #f6d3e0" }}>
      <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1180,
            mx: "auto",
            paddingInlineStart: { xs: 5, md: 4 },
            paddingInlineEnd: { xs: 2, md: 4 },
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, md: 2 },
          }}
        >
          <Box component={RouterLink} to="/admin" sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <QueensMatchLogo height={48} sx={{ height: { xs: 40, md: 48 }, maxWidth: { xs: 142, sm: 180, md: "100%" } }} />
          </Box>

          <Stack
            component="nav"
            aria-label="ניווט ניהול"
            direction="row"
            spacing={0.5}
            sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1, justifyContent: "center" }}
          >
            {NAV_ITEMS.map((item) => {
              const selected = isSelected(item);
              return (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  size="small"
                  startIcon={item.icon}
                  aria-current={selected ? "page" : undefined}
                  sx={{
                    minHeight: 40,
                    px: 1.5,
                    fontWeight: selected ? 800 : 700,
                    whiteSpace: "nowrap",
                    color: selected ? "primary.main" : "text.primary",
                    bgcolor: selected ? "#fff0f6" : "transparent",
                    border: "1px solid",
                    borderColor: selected ? "#f3a8c4" : "transparent",
                    "&:hover": { bgcolor: selected ? "#fff0f6" : "#fff8fb" },
                    "& .MuiButton-startIcon": { ml: 0.75, mr: 0 },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <UserMenu currentUser={currentUser} onLogout={onLogout} />
          </Box>
          <IconButton
            onClick={() => setMobileOpen(true)}
            aria-label="פתיחת תפריט ניהול"
            sx={{ display: { xs: "inline-flex", md: "none" }, color: "text.primary" }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box className="admin-navbar" sx={{ width: 286, p: 2 }} dir="rtl">
          <Box component={RouterLink} to="/admin" onClick={() => setMobileOpen(false)} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <QueensMatchLogo height={52} />
          </Box>
          <List component="nav" aria-label="ניווט ניהול במובייל" sx={{ py: 0 }}>
            {NAV_ITEMS.map((item) => {
              const selected = isSelected(item);
              return (
                <ListItemButton
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  selected={selected}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    mb: 0.5,
                    borderRadius: 1,
                    color: selected ? "primary.main" : "text.primary",
                    bgcolor: selected ? "#fff0f6" : "transparent",
                    border: "1px solid",
                    borderColor: selected ? "#f3a8c4" : "transparent",
                    "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "#fff0f6" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: selected ? 800 : 700 }} />
                </ListItemButton>
              );
            })}
          </List>
          <Divider sx={{ my: 2 }} />
          <UserMenu currentUser={currentUser} onLogout={onLogout} />
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default AdminNavbar;
