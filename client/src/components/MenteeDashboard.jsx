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
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";

import MentorCard from "./MentorCard";
import DashboardSummaryCard from "./DashboardSummaryCard";
import { AppPage, AppPageHeader, AppSectionTitle } from "./AppPrimitives";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";

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

      const now = new Date();
      const blockedThisMonth = requests.some((request) => {
        if (
          request.mentorProfileId !== mentorProfileId ||
          request.status !== "CANCELLED"
        ) {
          return false;
        }

        const extraSlotsUsed = (
          request.schedulingRounds || []
        ).some((round) => round.type === "EXTRA_SLOTS");
        const updatedAt = new Date(request.updatedAt);

        return (
          extraSlotsUsed &&
          updatedAt.getFullYear() === now.getFullYear() &&
          updatedAt.getMonth() === now.getMonth()
        );
      });

      return blockedThisMonth ? "blocked" : "none";
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
      setError(
        getRequestErrorMessage(requestError, "שליחת בקשת הפגישה נכשלה.")
      );
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
    <AppPage>
        <AppPageHeader
          title={
            currentUser?.fullName?.trim() ? (
              <span dir="rtl">שלום {currentUser.fullName.trim()},</span>
            ) : (
              "מסך הבית"
            )
          }
          subtitle={`שלום, ${currentUser.fullName}`}
        />

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
          <DashboardSummaryCard
            icon={SearchIcon}
            title="מנטוריות זמינות"
            value={mentors.length}
          />

          <DashboardSummaryCard
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

          <DashboardSummaryCard
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
            sx={{ px: 3 }}
          >
            חפשי מנטורית
          </Button>

          <Button
            component={RouterLink}
            to="/mentee/meetings"
            variant="outlined"
            sx={{ px: 3 }}
          >
            לכל הפגישות
          </Button>

          <Button
            component={RouterLink}
            to="/mentee/meetings?tab=waiting-mentor-section"
            variant="outlined"
            sx={{ px: 3 }}
          >
            הציגי בקשות
          </Button>

          {!currentUser.isAdmin && !currentUser.mentorProfile && (
            <Button component={RouterLink} to="/profile" variant="outlined" sx={{ px: 3 }}>
              הצטרפי כמנטורית
            </Button>
          )}
        </Stack>

        <AppSectionTitle title="מנטוריות שאולי יתאימו לך" action={
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
        } />

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
    </AppPage>
  );
}

export default MenteeDashboard;
