import React, { useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import getTheme from "./theme";
import { rtlCache, ltrCache } from "./rtlCache";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import AppLayout from "./components/AppLayout";
import HomePage from "./components/HomePage";
import LoginDialog from "./components/LoginDialog";
import RegisterDialog from "./components/RegisterDialog";
import ProfilePage from "./components/ProfilePage";
import RoleAreaPage from "./components/RoleAreaPage";
import MenteeDashboard from "./components/MenteeDashboard";
import MentorSearchPage from "./components/MentorSearchPage";
import MenteeMeetingsPage from "./components/MenteeMeetingsPage";

function ThemedApp() {
  const { direction } = useLanguage();
  const theme = useMemo(() => getTheme(direction), [direction]);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = window.localStorage.getItem("queensMatchUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  // "login" | "register" | null - which auth dialog (if any) is open. Both
  // dialogs are rendered once here so they can be triggered from the public
  // navbar and swapped between ("צור חשבון" / "כניסה" links) without routing.
  const [authDialog, setAuthDialog] = useState(null);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    window.localStorage.setItem("queensMatchUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem("queensMatchUser");
  };

  return (
    <CacheProvider value={direction === "rtl" ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppLayout
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenLogin={() => setAuthDialog("login")}
            onOpenRegister={() => setAuthDialog("register")}
          >
            <Routes>
              <Route path="/" element={<HomePage onOpenRegister={() => setAuthDialog("register")} />} />
              <Route path="/profile" element={<ProfilePage user={currentUser} />} />
              <Route path="/mentee" element={<MenteeDashboard currentUser={currentUser} />} />
              <Route path="/mentee/mentors" element={<MentorSearchPage />} />
              <Route path="/mentee/meetings" element={<MenteeMeetingsPage />} />
              <Route path="/mentor" element={<RoleAreaPage role="MENTOR" />} />
              <Route path="/admin" element={<RoleAreaPage role="ADMIN" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>

          <LoginDialog
            open={authDialog === "login"}
            onClose={() => setAuthDialog(null)}
            onLogin={handleAuthSuccess}
            onSwitchToRegister={() => setAuthDialog("register")}
          />
          <RegisterDialog
            open={authDialog === "register"}
            onClose={() => setAuthDialog(null)}
            onRegister={handleAuthSuccess}
            onSwitchToLogin={() => setAuthDialog("login")}
          />
        </Router>
      </ThemeProvider>
    </CacheProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemedApp />
    </LanguageProvider>
  );
}
export default App;
