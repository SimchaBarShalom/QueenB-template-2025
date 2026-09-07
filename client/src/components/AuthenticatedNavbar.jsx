import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AppBar, Box, Button, Stack, Toolbar } from "@mui/material";
import UserMenu from "./UserMenu";
import MessagesMenu from "./MessagesMenu";
import QueensMatchLogo from "./QueensMatchLogo";
import { isMentorUser } from "../utils/areaRouting";
import {
  MENTOR_MEETING_TABS,
  MENTOR_MEETINGS_PATH,
  getMentorMeetingTabFromSearch,
  getMentorMeetingsPath,
} from "../utils/meetingNav";

function AuthenticatedNavbar({ currentUser, onLogout }) {
  const location = useLocation();
  const mentor = isMentorUser(currentUser);
  const showingMentorArea = mentor && !location.pathname.startsWith("/mentee");
  const homePath = showingMentorArea ? "/mentor" : "/mentee";
  const activeMentorTab =
    location.pathname === MENTOR_MEETINGS_PATH
      ? getMentorMeetingTabFromSearch(location.search)
      : null;
  const menteeLinks = [
    { path: "/mentee/mentors", label: "חיפוש מנטוריות" },
    { path: "/mentee/meetings", label: "הפגישות שלי" },
  ];
  const dashboardActive = location.pathname === homePath;

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ bgcolor: "#fff", borderBottom: "1px solid #f6d3e0" }}
    >
      <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1200,
            mx: "auto",
            px: { xs: 2, md: 4 },
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, md: 3 },
          }}
        >
          <Box
            component={RouterLink}
            to={homePath}
            sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            <QueensMatchLogo height={48} />
          </Box>

          <Stack component="nav" aria-label="ניווט ראשי" direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Button component={RouterLink} to={homePath} size="small" variant={dashboardActive ? "contained" : "text"} sx={{ fontWeight: dashboardActive ? 700 : 400 }}>
              מסך הבית
            </Button>
            {showingMentorArea
              ? MENTOR_MEETING_TABS.map((tab) => {
                  const isActive = activeMentorTab === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      component={RouterLink}
                      to={getMentorMeetingsPath(tab.id)}
                      size="small"
                      variant={isActive ? "contained" : "text"}
                      sx={{ fontWeight: isActive ? 700 : 400 }}
                    >
                      {tab.label}
                    </Button>
                  );
                })
              : menteeLinks.map((link) => (
                  <Button
                    key={link.path}
                    component={RouterLink}
                    to={link.path}
                    size="small"
                    sx={{ fontWeight: location.pathname === link.path ? 700 : 400 }}
                  >
                    {link.label}
                  </Button>
                ))}
          </Stack>

          <Box sx={{ flexGrow: 1 }} />
          <MessagesMenu currentUser={currentUser} />
          <UserMenu currentUser={currentUser} onLogout={onLogout} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default AuthenticatedNavbar;
