import React, { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Alert, AppBar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Snackbar, Stack, Toolbar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import QueensMatchLogo from "./QueensMatchLogo";
import MessagesMenu from "./MessagesMenu";
import UserMenu from "./UserMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import { queenbColors } from "../theme";

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

function RoleNavbar({ currentUser, onLogout, homePath, items, ariaLabel, showJoinAsMentor = false, showGoogleCalendar = false, googleCalendarConnected = false, onGoogleCalendarClick, googleCalendarError = "" }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, direction } = useLanguage();
  const navAria = ariaLabel || t("nav.mainAria");
  const drawerAnchor = direction === "rtl" ? "right" : "left";
  const buttonSx = (active) => ({ minHeight: 38, px: 1.75, borderRadius: 2, whiteSpace: "nowrap", fontSize: "0.95rem", ...(active ? activeButtonSx : inactiveButtonSx) });
  const googleCalendarButtonSx = { minHeight: { xs: 36, sm: 38 }, width: "max-content", minWidth: 0, flexShrink: 0, px: { xs: 1, sm: 1.5, md: 2 }, borderRadius: 2, whiteSpace: "nowrap", color: queenbColors.pink, bgcolor: queenbColors.pinkPale, border: `1px solid ${queenbColors.pink}55`, fontWeight: 700, lineHeight: 1.2, fontSize: { xs: "0.72rem", sm: "0.85rem", md: "0.9rem" }, "&:hover": { bgcolor: "#ffd1df", borderColor: queenbColors.pink } };

  return (
    <AppBar className="role-navbar" position="sticky" color="inherit" elevation={0} sx={{ bgcolor: "#fff", borderBottom: "1px solid #f6d3e0" }}>
      <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
        <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>
          <Box component={RouterLink} to={homePath} sx={{ display: "flex", alignItems: "center", flexShrink: showJoinAsMentor ? 1 : 0 }}>
            <QueensMatchLogo height={48} sx={{ height: { xs: 40, md: 48 }, maxWidth: { xs: showJoinAsMentor ? 112 : 142, sm: 180, md: "100%" } }} />
          </Box>
          <Stack component="nav" aria-label={navAria} direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", flexGrow: 1, justifyContent: "center" }}>
            {items.map((item) => {
              const active = isCurrentItem(item, location);
              return <Button key={item.path} component={RouterLink} to={item.path} aria-current={active ? "page" : undefined} sx={buttonSx(active)}>{item.label}</Button>;
            })}
          </Stack>
          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <LanguageSwitcher />
          </Box>
          {showJoinAsMentor && (
            <Button
              component={RouterLink}
              to="/profile"
              size="small"
              sx={{
                minHeight: { xs: 36, sm: 38 },
                width: "max-content",
                minWidth: { xs: 0, sm: 168 },
                maxWidth: "none",
                flexShrink: 0,
                px: { xs: 1, sm: 1.5, md: 2 },
                borderRadius: 2,
                whiteSpace: "nowrap",
                overflow: "visible",
                color: queenbColors.pink,
                bgcolor: queenbColors.pinkPale,
                border: `1px solid ${queenbColors.pink}55`,
                fontWeight: 700,
                lineHeight: 1.2,
                fontSize: { xs: "0.72rem", sm: "0.85rem", md: "0.9rem" },
                "&:hover": { bgcolor: "#ffd1df", borderColor: queenbColors.pink },
              }}
            >
              {t("nav.joinAsMentor")}
            </Button>
          )}
          {showGoogleCalendar && <Button onClick={onGoogleCalendarClick} startIcon={<CalendarMonthIcon />} sx={googleCalendarButtonSx}>{t(googleCalendarConnected ? "nav.googleCalendarConnected" : "nav.googleCalendar")}</Button>}
          <MessagesMenu currentUser={currentUser} />
          <Box sx={{ display: { xs: "none", sm: "block" } }}><UserMenu currentUser={currentUser} onLogout={onLogout} /></Box>
          <IconButton onClick={() => setMobileOpen(true)} aria-label={t("nav.openMenu")} sx={{ display: { xs: "inline-flex", md: "none" }, color: "text.primary" }}><MenuIcon /></IconButton>
        </Box>
      </Toolbar>
      <Drawer anchor={drawerAnchor} open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box className="role-navbar" sx={{ width: 286, p: 2 }} dir={direction}>
          <Box component={RouterLink} to={homePath} onClick={() => setMobileOpen(false)} sx={{ display: "flex", alignItems: "center", mb: 2 }}><QueensMatchLogo height={48} /></Box>
          <Box sx={{ mb: 2 }}><LanguageSwitcher /></Box>
          <List component="nav" aria-label={t("nav.mobileAria", { label: navAria })} sx={{ py: 0 }}>
            {items.map((item) => {
              const active = isCurrentItem(item, location);
              return <ListItemButton key={item.path} component={RouterLink} to={item.path} selected={active} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)} sx={{ mb: 0.5, borderRadius: 2, ...buttonSx(active), "&.Mui-selected, &.Mui-selected:hover": activeButtonSx }}><ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: active ? 700 : 400 }} /></ListItemButton>;
            })}
          </List>
          {showGoogleCalendar && <Button fullWidth onClick={() => { setMobileOpen(false); onGoogleCalendarClick(); }} startIcon={<CalendarMonthIcon />} sx={{ mt: 1, justifyContent: "flex-start", ...googleCalendarButtonSx }}>{t(googleCalendarConnected ? "nav.googleCalendarConnected" : "nav.googleCalendar")}</Button>}
          <Divider sx={{ my: 2 }} />
          <UserMenu currentUser={currentUser} onLogout={onLogout} />
        </Box>
      </Drawer>
      <Snackbar open={Boolean(googleCalendarError)} autoHideDuration={6000}><Alert severity="error" variant="filled">{googleCalendarError}</Alert></Snackbar>
    </AppBar>
  );
}

export default RoleNavbar;
