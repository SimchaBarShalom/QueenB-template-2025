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


const CENTER_LINKS = [
  {  label: "צור קשר", href: "/#contact-section" },
  { label: "שאלות נפוצות", href: "/#faq-section" },
    {label: "על התוכנית", href: "/#about-section" },

];

// The public navbar has three PHYSICAL zones that must stay put regardless
// of RTL text direction: logo always physical-left, nav links always
// physical-center, auth actions always physical-right. Wrapping the row in
// dir="ltr" makes flex/grid placement follow plain left-to-right physical
// order while the Hebrew labels inside still render correctly (Unicode
// bidi handles glyph order regardless of the container's dir).
function Navbar({ onOpenLogin, onOpenRegister }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ bgcolor: "#fff", borderBottom: "1px solid #f6d3e0" }}>
      <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 76 } }}>
        <Box
          dir="ltr"
          sx={{
            width: "100%",
            maxWidth: 1280,
            mx: "auto",
            pl: { xs: 1, md: 1.5 },
            pr: { xs: 2, md: 4 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr auto", md: "1fr auto 1fr" },
            alignItems: "center",
            columnGap: 2,
          }}
        >
          {/* physical LEFT: logo - deliberately large and unboxed (no pale
              background container), close to the edge */}
          <Box
            component={RouterLink}
            to="/"
            sx={{ justifySelf: "start", display: "flex", alignItems: "center" }}
          >
           <Box
  component="img"
  src="/queen-match-logo.png"
  alt="Queen Match By QueenB"
  sx={{
    display: "block",
    height: {
      xs: 55,
      md: 72,
    },
    width: "auto",
    maxWidth: {
      xs: 170,
      md: 220,
    },
    objectFit: "contain",
  }}
/>
          </Box>

          {/* physical CENTER: main navigation links (desktop only) */}
          <Box
            sx={{
              justifySelf: "center",
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 3,
            }}
          >
            {CENTER_LINKS.map((link) => (
              <Button
                key={link.href}
                component="a"
                href={link.href}
                sx={{ color: "text.primary", fontWeight: 600 }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          {/* physical RIGHT: auth actions (desktop) / hamburger (mobile) */}
          <Box sx={{ justifySelf: "end", display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1.5 }}>
            <Button onClick={onOpenLogin} sx={{ color: "primary.main", fontWeight: 700 }}>
              התחברות
            </Button>
            <Button
              onClick={onOpenRegister}
              variant="contained"
              sx={{ color: "#fff", borderRadius: 999, px: 3, py: 1 }}
            >
              הרשמה
            </Button>
          </Box>

          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: "flex", md: "none" }, justifySelf: "end" }}
            aria-label="פתיחת תפריט"
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }} dir="rtl">
          <List>
            {CENTER_LINKS.map((link) => (
              <ListItemButton
                key={link.href}
                component="a"
                href={link.href}
                onClick={() => setMobileOpen(false)}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ px: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                setMobileOpen(false);
                onOpenRegister();
              }}
              sx={{ color: "#fff", borderRadius: 999 }}
            >
              הרשמה
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setMobileOpen(false);
                onOpenLogin();
              }}
              sx={{ borderRadius: 999 }}
            >
              התחברות
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default Navbar;
