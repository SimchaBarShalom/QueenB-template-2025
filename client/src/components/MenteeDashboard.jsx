import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";

import MentorCard from "./MentorCard";

function SummaryCard({ icon: Icon, title, value, subtitle }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
        borderColor: "#f6d3e0",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "background.default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon color="primary" />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" variant="body2">
            {title}
          </Typography>

          <Typography variant="h6" noWrap>
            {value}
          </Typography>

          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("he-IL");
}

function formatTime(dateValue) {
  return new Date(dateValue).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACTIVE_STATUSES = [
  "WAITING_FOR_MENTOR_SLOTS",
  "WAITING_FOR_MENTEE_SELECTION",
  "MATCHED",
  "ATTENDANCE_CONFIRMED",
];

function MenteeDashboard({ currentUser }) {
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menteeId = currentUser?.id;

  useEffect(() => {
    async function loadDashboard() {
      if (!menteeId) {
        setError("לא נמצאה משתמשת מחוברת.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [mentorsResponse, requestsResponse] =
          await Promise.all([
            axios.get("/api/mentors"),
            axios.get(
              `/api/mentoring-requests/mentee/${menteeId}`
            ),
          ]);

        setMentors(mentorsResponse.data);
        setRequests(requestsResponse.data);
      } catch (requestError) {
        console.error(requestError);
        setError("לא הצלחנו לטעון את דף הבית.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [menteeId]);

  const activeRequestsCount = useMemo(() => {
    return requests.filter((request) =>
      ACTIVE_STATUSES.includes(request.status)
    ).length;
  }, [requests]);

  const upcomingMeeting = useMemo(() => {
    const meetings = requests.flatMap((request) =>
      (request.meetings || [])
        .filter(
          (meeting) =>
            (meeting.status === "SCHEDULED" ||
              meeting.status ===
                "ATTENDANCE_CONFIRMED") &&
            new Date(meeting.scheduledStart) > new Date()
        )
        .map((meeting) => ({
          ...meeting,
          mentorName:
            request.mentorProfile?.user?.fullName ||
            "מנטורית",
        }))
    );

    meetings.sort(
      (a, b) =>
        new Date(a.scheduledStart) -
        new Date(b.scheduledStart)
    );

    return meetings[0] || null;
  }, [requests]);

  const getRequestStatus = useCallback(
    (mentorProfileId) => {
      const mentorRequests = requests.filter(
        (request) =>
          request.mentorProfileId === mentorProfileId &&
          ACTIVE_STATUSES.includes(request.status)
      );

      const scheduledRequest = mentorRequests.find(
        (request) =>
          request.status === "MATCHED" ||
          request.status === "ATTENDANCE_CONFIRMED"
      );

      if (scheduledRequest) {
        return "scheduled";
      }

      if (mentorRequests.length > 0) {
        return "pending";
      }

      return "none";
    },
    [requests]
  );

  const suggestedMentors = useMemo(() => {
    return mentors.slice(0, 2).map((mentor) => ({
      ...mentor,
      requestStatus: getRequestStatus(
        mentor.mentorProfileId
      ),
    }));
  }, [mentors, getRequestStatus]);

  const handleRequestClick = async (mentor) => {
    try {
      setError("");

      const response = await axios.post(
        "/api/mentoring-requests",
        {
          menteeId,
          mentorProfileId: mentor.mentorProfileId,
        }
      );

      setRequests((current) => [
        response.data,
        ...current,
      ]);
    } catch (requestError) {
      console.error(requestError);
      setError("שליחת בקשת הפגישה נכשלה.");
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          py: 8,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",

        width: "100%",
        maxWidth: "100%",

        minHeight: "calc(100vh - 76px)",

        overflowX: "hidden",
        overflowY: "visible",

        py: {
          xs: 3,
          md: 5,
        },

        background: `
          radial-gradient(
            circle at 10% 18%,
            rgba(231, 49, 122, 0.08),
            transparent 28%
          ),
          radial-gradient(
            circle at 88% 72%,
            rgba(190, 126, 222, 0.09),
            transparent 30%
          ),
          linear-gradient(
            135deg,
            #fff9fb 0%,
            #fdeef4 48%,
            #fff7fa 100%
          )
        `,
      }}
    >

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ mb: 3 }}
        >
          שלום, {currentUser.fullName}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(3, 1fr)",
            },
            gap: 2.5,
            mb: 4,
          }}
        >
          <SummaryCard
            icon={SearchIcon}
            title="מנטוריות זמינות"
            value={mentors.length}
          />

          <SummaryCard
            icon={EventNoteIcon}
            title="פגישה קרובה"
            value={
              upcomingMeeting
                ? upcomingMeeting.mentorName
                : "אין פגישות קרובות"
            }
            subtitle={
              upcomingMeeting
                ? `${formatDate(
                    upcomingMeeting.scheduledStart
                  )} · ${formatTime(
                    upcomingMeeting.scheduledStart
                  )}`
                : undefined
            }
          />

          <SummaryCard
            icon={HourglassTopIcon}
            title="בקשות פעילות"
            value={activeRequestsCount}
          />
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mb: 5 }}
        >
          <Button
            component={RouterLink}
            to="/mentee/mentors"
            variant="contained"
            sx={{ borderRadius: 999, px: 3 }}
          >
            חפשי מנטורית
          </Button>

          <Button
            component={RouterLink}
            to="/mentee/meetings"
            variant="outlined"
            sx={{ borderRadius: 999, px: 3 }}
          >
            לכל הפגישות
          </Button>

          <Button
            component={RouterLink}
            to="/mentee/meetings#waiting-mentor-section"
            variant="outlined"
            sx={{ borderRadius: 999, px: 3 }}
          >
            הציגי בקשות
          </Button>
        </Stack>

        <Box
          sx={{
            mb: 2.5,
            width: "100%",
            textAlign: "left",
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{
              mb: 0.5,
              fontWeight: 700,
            }}
          >
            מנטוריות שאולי יתאימו לך
          </Typography>

          <Button
            component={RouterLink}
            to="/mentee/mentors"
            sx={{
              fontWeight: 600,
              px: 0,
              minWidth: 0,
            }}
          >
            לכל המנטוריות
          </Button>
        </Box>

        {suggestedMentors.length === 0 ? (
          <Typography color="text.secondary">
            אין כרגע מנטוריות זמינות.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },

              gap: 3,
            }}
          >
            {suggestedMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onRequestClick={handleRequestClick}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default MenteeDashboard;