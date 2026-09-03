import React, { useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import AppLayout from "./components/AppLayout";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ProfilePage from "./components/ProfilePage";
import RoleAreaPage from "./components/RoleAreaPage";

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = window.localStorage.getItem("queensMatchUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const auth = useMemo(
    () => ({
      currentUser,
      setCurrentUser: (user) => {
        setCurrentUser(user);

        if (user) {
          window.localStorage.setItem("queensMatchUser", JSON.stringify(user));
        } else {
          window.localStorage.removeItem("queensMatchUser");
        }
      },
    }),
    [currentUser]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppLayout currentUser={auth.currentUser} onLogout={() => auth.setCurrentUser(null)}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage onLogin={auth.setCurrentUser} />} />
            <Route
              path="/register/mentee"
              element={<RegisterPage role="MENTEE" onRegister={auth.setCurrentUser} />}
            />
            <Route
              path="/register/mentor"
              element={<RegisterPage role="MENTOR" onRegister={auth.setCurrentUser} />}
            />
            <Route path="/profile" element={<ProfilePage user={auth.currentUser} />} />
            <Route path="/mentee" element={<RoleAreaPage role="MENTEE" />} />
            <Route path="/mentor" element={<RoleAreaPage role="MENTOR" />} />
            <Route path="/admin" element={<RoleAreaPage role="ADMIN" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
