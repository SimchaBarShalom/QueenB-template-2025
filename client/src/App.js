import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { CacheProvider } from "@emotion/react";
import { Box, CircularProgress, ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/he";
import "dayjs/locale/ar";
import getTheme from "./theme";
import { rtlCache, ltrCache } from "./rtlCache";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import apiClient, { clearAuth, getStoredToken, getStoredUser, storeAuth } from "./api/client";
import AppLayout from "./components/AppLayout";
import HomePage from "./components/HomePage";
import LoginDialog from "./components/LoginDialog";
import RegisterDialog from "./components/RegisterDialog";
import ProfilePage from "./components/ProfilePage";
import MenteeDashboard from "./components/MenteeDashboard";
import MentorDashboard from "./components/MentorDashboard";
import MentorSearchPage from "./components/MentorSearchPage";
import MenteeMeetingsPage from "./components/MenteeMeetingsPage";
import MentorMeetingsPage from "./components/MentorMeetingsPage";
import AdminDashboardPage from "./components/admin/AdminDashboardPage";
import AdminUsersPage from "./components/admin/AdminUsersPage";
import AdminUserDetailsPage from "./components/admin/AdminUserDetailsPage";
import AdminMeetingsPage from "./components/admin/AdminMeetingsPage";
import AdminMeetingDetailsPage from "./components/admin/AdminMeetingDetailsPage";
import AdminCalendarPage from "./components/admin/AdminCalendarPage";
import AdminAlertsPage from "./components/admin/AdminAlertsPage";
import { getDefaultAreaPath, isMentorUser } from "./utils/areaRouting";

function RequireAuth({ currentUser, authLoading, children }) {
  if (authLoading) {
    return (
      <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RequireAdmin({ currentUser, authLoading, children }) {
  if (authLoading) {
    return (
      <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!currentUser.isAdmin) {
    return <Navigate to={getDefaultAreaPath(currentUser)} replace />;
  }

  return children;
}

function MenteeOnlyRoute({ currentUser, authLoading, children }) {
  return (
    <RequireAuth currentUser={currentUser} authLoading={authLoading}>
      {currentUser?.isAdmin ? <Navigate to="/admin" replace /> : children}
    </RequireAuth>
  );
}

function MentorOnlyRoute({ currentUser, authLoading, children }) {
  return (
    <RequireAuth currentUser={currentUser} authLoading={authLoading}>
      {isMentorUser(currentUser) && !currentUser?.isAdmin ? children : <Navigate to={getDefaultAreaPath(currentUser)} replace />}
    </RequireAuth>
  );
}

function ThemedApp() {
  const { direction } = useLanguage();
  const theme = useMemo(() => getTheme(direction), [direction]);
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [authLoading, setAuthLoading] = useState(Boolean(getStoredToken()));
  // "login" | "register" | null - which auth dialog (if any) is open. Both
  // dialogs are rendered once here so they can be triggered from the public
  // navbar and swapped between ("צור חשבון" / "כניסה" links) without routing.
  const [authDialog, setAuthDialog] = useState(null);

  useEffect(() => {
    async function restoreSession() {
      const token = getStoredToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await apiClient.get("/api/auth/me");
        const user = response.data.user;
        setCurrentUser(user);
        window.localStorage.setItem("queensMatchUser", JSON.stringify(user));
      } catch (error) {
        console.error(error);
        clearAuth();
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, []);

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    storeAuth({ user, token });
  };

  const handleUserUpdated = (user) => {
    setCurrentUser(user);
    window.localStorage.setItem("queensMatchUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    clearAuth();
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
                element={
                  <RequireAuth currentUser={currentUser} authLoading={authLoading}>
                    <ProfilePage user={currentUser} onUserUpdated={handleUserUpdated} />
                  </RequireAuth>
                }
              />
              <Route
                path="/mentee"
                element={
                  <MenteeOnlyRoute currentUser={currentUser} authLoading={authLoading}>
                    <MenteeDashboard currentUser={currentUser} />
                  </MenteeOnlyRoute>
                }
              />
              <Route
                path="/mentee/mentors"
                element={
                  <MenteeOnlyRoute currentUser={currentUser} authLoading={authLoading}>
                    <MentorSearchPage />
                  </MenteeOnlyRoute>
                }
              />
              <Route
                path="/mentee/meetings"
                element={
                  <MenteeOnlyRoute currentUser={currentUser} authLoading={authLoading}>
                    <MenteeMeetingsPage />
                  </MenteeOnlyRoute>
                }
              />
              <Route
                path="/mentor"
                element={
                  <MentorOnlyRoute currentUser={currentUser} authLoading={authLoading}>
                    <MentorDashboard currentUser={currentUser} />
                  </MentorOnlyRoute>
                }
              />
              <Route
                path="/mentor/meetings"
                element={
                  <MentorOnlyRoute currentUser={currentUser} authLoading={authLoading}>
                    <MentorMeetingsPage currentUser={currentUser} />
                  </MentorOnlyRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAdmin currentUser={currentUser} authLoading={authLoading}>
                    <AdminDashboardPage />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RequireAdmin currentUser={currentUser} authLoading={authLoading}>
                    <AdminUsersPage />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/users/:id"
                element={
                  <RequireAdmin currentUser={currentUser} authLoading={authLoading}>
                    <AdminUserDetailsPage />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/meetings"
                element={
                  <RequireAdmin currentUser={currentUser} authLoading={authLoading}>
                    <AdminMeetingsPage />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/meetings/:id"
                element={
                  <RequireAdmin currentUser={currentUser} authLoading={authLoading}>
                    <AdminMeetingDetailsPage />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/calendar"
                element={
                  <RequireAdmin currentUser={currentUser} authLoading={authLoading}>
                    <AdminCalendarPage />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/alerts"
                element={
                  <RequireAdmin currentUser={currentUser} authLoading={authLoading}>
                    <AdminAlertsPage />
                  </RequireAdmin>
                }
              />
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
