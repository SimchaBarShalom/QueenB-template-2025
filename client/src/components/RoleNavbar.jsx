import React, { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AppBar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Toolbar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import QueensMatchLogo from "./QueensMatchLogo";
import MessagesMenu from "./MessagesMenu";
import UserMenu from "./UserMenu";

const activeButtonSx = {
  color: "#fff",
  bgcolor: "primary.main",
  fontWeight: 700,
  boxShadow: "0 4px 10px rgba(230, 49, 122, 0.28)",
  "&:hover": { bgcolor: "#c91e63", boxShadow: "0 5px 12px rgba(230, 49, 122, 0.32)" },
};
const inactiveButtonSx = { color: "text.primary", fontWeight: 400, "&:hover": { bgcolor: "#fff0f6", color: "primary.main" } };

function isCurrentItem(item, location) {
  if (item.isActive) return item.isActive(location);
  return item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
}

function RoleNavbar({ currentUser, onLogout, homePath, items, ariaLabel = "ניווט ראשי" }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const buttonSx = (active) => ({ minHeight: 38, px: 1.75, borderRadius: 2, whiteSpace: "nowrap", fontSize: "0.95rem", ...(active ? activeButtonSx : inactiveButtonSx) });

  return (
    <AppBar className="role-navbar" position="sticky" color="inherit" elevation={0} sx={{ bgcolor: "#fff", borderBottom: "1px solid #f6d3e0" }}>
      <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
        <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>
          <Box component={RouterLink} to={homePath} sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <QueensMatchLogo height={48} sx={{ height: { xs: 40, md: 48 }, maxWidth: { xs: 142, sm: 180, md: "100%" } }} />
          </Box>
          <Stack component="nav" aria-label={ariaLabel} direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
            {items.map((item) => {
              const active = isCurrentItem(item, location);
              return <Button key={item.path} component={RouterLink} to={item.path} aria-current={active ? "page" : undefined} sx={buttonSx(active)}>{item.label}</Button>;
            })}
          </Stack>
          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />
          <MessagesMenu currentUser={currentUser} />
          <Box sx={{ display: { xs: "none", sm: "block" } }}><UserMenu currentUser={currentUser} onLogout={onLogout} /></Box>
          <IconButton onClick={() => setMobileOpen(true)} aria-label="פתיחת תפריט" sx={{ display: { xs: "inline-flex", md: "none" }, color: "text.primary" }}><MenuIcon /></IconButton>
        </Box>
      </Toolbar>
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box className="role-navbar" sx={{ width: 286, p: 2 }} dir="rtl">
          <Box component={RouterLink} to={homePath} onClick={() => setMobileOpen(false)} sx={{ display: "flex", alignItems: "center", mb: 2 }}><QueensMatchLogo height={48} /></Box>
          <List component="nav" aria-label={`${ariaLabel} במובייל`} sx={{ py: 0 }}>
            {items.map((item) => {
              const active = isCurrentItem(item, location);
              return <ListItemButton key={item.path} component={RouterLink} to={item.path} selected={active} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)} sx={{ mb: 0.5, borderRadius: 2, ...buttonSx(active), "&.Mui-selected, &.Mui-selected:hover": activeButtonSx }}><ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 400 }} /></ListItemButton>;
            })}
          </List>
          <Divider sx={{ my: 2 }} />
          <UserMenu currentUser={currentUser} onLogout={onLogout} />
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default RoleNavbar;
