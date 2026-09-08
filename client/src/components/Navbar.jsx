import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import QueensMatchLogo from "./QueensMatchLogo";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";

const CENTER_LINKS = [
  { labelKey: "nav.contact", href: "/#contact-section" },
  { labelKey: "nav.faq", href: "/#faq-section" },
  { labelKey: "nav.about", href: "/#about-section" },
];

function Navbar({ onOpenLogin, onOpenRegister }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, direction } = useLanguage();
  const drawerAnchor = direction === "rtl" ? "right" : "left";

  return (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ bgcolor: "#fff", borderBottom: "1px solid #f6d3e0" }}>
      <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 76 } }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1280,
            mx: "auto",
            pl: { xs: 1, md: 1.5 },
            pr: { xs: 2, md: 4 },
            display: "grid",
            gridTemplateColumns: { xs: "auto 1fr", md: "1fr auto 1fr" },
            alignItems: "center",
            columnGap: 2,
          }}
        >
          <Box
            component={RouterLink}
            to="/"
            sx={{ justifySelf: "end", display: "flex", alignItems: "center" }}
          >
            <QueensMatchLogo height={48} sx={{ height: { xs: 40, md: 48 }, maxWidth: { xs: 142, sm: 180, md: "100%" } }} />
          </Box>

          <Box sx={{ justifySelf: "center", display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1.5 }}>
            <Button onClick={onOpenRegister} variant="contained" sx={{ color: "#fff", px: 2.25 }}>
              {t("nav.register")}
            </Button>
            <Button onClick={onOpenLogin} sx={{ color: "primary.main", fontWeight: 400 }}>
              {t("nav.login")}
            </Button>
            {CENTER_LINKS.map((link) => (
              <Button
                key={link.href}
                component="a"
                href={link.href}
                sx={{ color: "text.primary", fontWeight: 400 }}
              >
                {t(link.labelKey)}
              </Button>
            ))}
          </Box>

          <Box sx={{ justifySelf: "start", display: { xs: "none", md: "flex" }, alignItems: "center" }}>
            <LanguageSwitcher />
          </Box>

          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: "flex", md: "none" }, justifySelf: "start" }}
            aria-label={t("nav.openMenu")}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Drawer anchor={drawerAnchor} open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }} dir={direction}>
          <Box sx={{ px: 2, pb: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <LanguageSwitcher />
            <Button fullWidth variant="contained" onClick={() => { setMobileOpen(false); onOpenRegister(); }} sx={{ color: "#fff" }}>
              {t("nav.register")}
            </Button>
            <Button fullWidth variant="outlined" onClick={() => { setMobileOpen(false); onOpenLogin(); }}>
              {t("nav.login")}
            </Button>
          </Box>
          <List>
            {CENTER_LINKS.map((link) => (
              <ListItemButton
                key={link.href}
                component="a"
                href={link.href}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={t(link.labelKey)} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default Navbar;
