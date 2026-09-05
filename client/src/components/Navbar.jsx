import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import LanguageIcon from "@mui/icons-material/Language";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useLanguage } from "../i18n/LanguageContext";

// These pages do not exist yet (see "what not to implement" in the base
// stage plan), so the links are inert placeholders for now instead of
// pointing at pages that would 404.
const PLACEHOLDER_NAV_KEYS = ["about", "info", "aboutUs", "support"];
const LANGUAGE_CODES = ["he", "en", "ar"];

function Navbar({ currentUser, onLogout }) {
  const { t, language, setLanguage } = useLanguage();
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null);

  const handleLanguageSelect = (code) => {
    setLanguage(code);
    setLanguageMenuAnchor(null);
  };

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #f6d3e0" }}>
      <Toolbar sx={{ gap: 1.5, py: 1, flexWrap: "wrap" }}>
        <Box component={RouterLink} to="/" sx={{ display: "flex", alignItems: "center" }}>
          <Box
            component="img"
            src="/assets/queenb/queenb-logo-pink.svg"
            alt="QueenB"
            sx={{ height: 26 }}
          />
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ flexGrow: 1, flexWrap: "wrap", rowGap: 0.5 }}>
          <Button component={RouterLink} to="/register/mentee" size="small">
            {t("nav.register")}
          </Button>
          {PLACEHOLDER_NAV_KEYS.map((key) => (
            <Button key={key} size="small" sx={{ color: "text.secondary" }}>
              {t(`nav.${key}`)}
            </Button>
          ))}
        </Stack>

        {currentUser ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
            {currentUser.isAdmin && (
              <Button component={RouterLink} to="/admin" size="small">
                {t("nav.adminArea")}
              </Button>
            )}
            {currentUser.isMentor && (
              <Button component={RouterLink} to="/mentor" size="small">
                {t("nav.mentorArea")}
              </Button>
            )}
            <Button component={RouterLink} to="/mentee" size="small">
              {t("nav.menteeArea")}
            </Button>
            <Button component={RouterLink} to="/mentors" size="small">
              {t("nav.findMentor")}
            </Button>
            <Button component={RouterLink} to="/goals" size="small">
              {t("nav.myGoals")}
            </Button>
            <Button component={RouterLink} to="/profile" size="small">
              {t("nav.profile")}
            </Button>
            <Typography variant="body2" color="text.secondary" noWrap>
              {currentUser.fullName}
            </Typography>
            <Button variant="contained" size="small" onClick={onLogout}>
              {t("nav.logout")}
            </Button>
          </Stack>
        ) : (
          <Button component={RouterLink} to="/login" variant="contained" size="small">
            {t("nav.login")}
          </Button>
        )}

        <IconButton
          size="small"
          aria-label="language"
          onClick={(event) => setLanguageMenuAnchor(event.currentTarget)}
        >
          <LanguageIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={languageMenuAnchor}
          open={Boolean(languageMenuAnchor)}
          onClose={() => setLanguageMenuAnchor(null)}
        >
          {LANGUAGE_CODES.map((code) => (
            <MenuItem key={code} selected={code === language} onClick={() => handleLanguageSelect(code)}>
              {t(`language.${code}`)}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;