import React, { useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/he";
import "dayjs/locale/ar";
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
import MentorDashboard from "./components/MentorDashboard";
import MentorSearchPage from "./components/MentorSearchPage";
import MenteeMeetingsPage from "./components/MenteeMeetingsPage";
import MentorMeetingsPage from "./components/MentorMeetingsPage";
import { getDefaultAreaPath, isMentorUser } from "./utils/areaRouting";

function MenteeOnlyRoute({ user, children }) {
  if (!user) return <Navigate to="/" replace />;
  if (isMentorUser(user)) return <Navigate to="/mentor" replace />;
  return children;
}

function MentorOnlyRoute({ user, children }) {
  if (!user) return <Navigate to="/" replace />;
  if (!isMentorUser(user)) return <Navigate to={getDefaultAreaPath(user)} replace />;
  return children;
}

function ThemedApp() {
  const { direction } = useLanguage();
  const theme = useMemo(() => getTheme(direction), [direction]);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = window.localStorage.getItem("queensMatchUser");
    const savedToken = window.localStorage.getItem("queensMatchToken");
    return savedUser && savedToken ? JSON.parse(savedUser) : null;
  });
  // "login" | "register" | null - which auth dialog (if any) is open. Both
  // dialogs are rendered once here so they can be triggered from the public
  // navbar and swapped between ("צור חשבון" / "כניסה" links) without routing.
  const [authDialog, setAuthDialog] = useState(null);

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    window.localStorage.setItem("queensMatchUser", JSON.stringify(user));
    window.localStorage.setItem("queensMatchToken", token);
  };

  const handleUserUpdated = (user) => {
    setCurrentUser(user);
    window.localStorage.setItem("queensMatchUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem("queensMatchUser");
    window.localStorage.removeItem("queensMatchToken");
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
              <Route
                path="/"
                element={
                  currentUser ? (
                    <Navigate to={getDefaultAreaPath(currentUser)} replace />
                  ) : (
                    <HomePage onOpenRegister={() => setAuthDialog("register")} />
                  )
                }
              />
              <Route
                path="/profile"
                element={<ProfilePage user={currentUser} onUserUpdated={handleUserUpdated} />}
              />
              <Route
                path="/mentee"
                element={
                  <MenteeOnlyRoute user={currentUser}>
                    <MenteeDashboard currentUser={currentUser} />
                  </MenteeOnlyRoute>
                }
              />
              <Route
                path="/mentee/mentors"
                element={
                  <MenteeOnlyRoute user={currentUser}>
                    <MentorSearchPage />
                  </MenteeOnlyRoute>
                }
              />
              <Route
                path="/mentee/meetings"
                element={
                  <MenteeOnlyRoute user={currentUser}>
                    <MenteeMeetingsPage />
                  </MenteeOnlyRoute>
                }
              />
              <Route
                path="/mentor"
                element={
                  <MentorOnlyRoute user={currentUser}>
                    <MentorDashboard currentUser={currentUser} />
                  </MentorOnlyRoute>
                }
              />
              <Route
                path="/mentor/meetings"
                element={
                  <MentorOnlyRoute user={currentUser}>
                    <MentorMeetingsPage currentUser={currentUser} />
                  </MentorOnlyRoute>
                }
              />
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

// Date pickers read their month names and first-day-of-week from the dayjs
// locale, so this sits inside LanguageProvider to follow the language switcher.
function LocalizedApp() {
  const { language } = useLanguage();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
      <ThemedApp />
    </LocalizationProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <LocalizedApp />
    </LanguageProvider>
  );
}
export default App;
