import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GroupsIcon from "@mui/icons-material/Groups";

import DashboardSummaryCard from "./DashboardSummaryCard";
import { AppPage, AppPageHeader, AppSectionTitle, AppSurface } from "./AppPrimitives";
import { getMentorMeetingRequests } from "../services/mentorMeetingsService";
import { getMentorMeetingsPath } from "../utils/meetingNav";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";

// Mirrors the server rule in server/lib/capacity.js: a seat belongs to the
// month its meeting is scheduled in, and an unscheduled meeting releases it.
const CAPACITY_MEETING_STATUSES = [
  "SCHEDULED",
  "ATTENDANCE_CONFIRMED",
  "COMPLETED",
];

const UPCOMING_MEETING_STATUSES = ["SCHEDULED", "ATTENDANCE_CONFIRMED"];
const PREVIEW_LIMIT = 3;

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("he-IL");
}

function formatTime(dateValue) {
  return new Date(dateValue).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTopic(request) {
  const topics = request.mentorProfile?.mentoringTopics || [];
  return topics.length > 0 ? topics.map((topic) => topic.name).join(", ") : "מנטורינג";
}

function PreviewCard({ to, title, subtitle, detail }) {
  return (
    <AppSurface
      component={RouterLink}
      to={to}
      variant="outlined"
      sx={{
        p: 2,
        textDecoration: "none",
        color: "inherit",
        display: "block",
        height: "100%",
      }}
    >
      <Typography variant="h6">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
      {detail && (
        <Typography sx={{ fontWeight: 600, mt: 0.75 }}>{detail}</Typography>
      )}
    </AppSurface>
  );
}

function MentorDashboard({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        setRequests(await getMentorMeetingRequests());
      } catch (requestError) {
        console.error(requestError);
        setError(
          getRequestErrorMessage(requestError, "לא הצלחנו לטעון את דף הבית.")
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "WAITING_FOR_MENTOR_SLOTS"),
    [requests]
  );

  const usedCapacity = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return requests.reduce((total, request) => {
      const seats = (request.meetings || []).filter((meeting) => {
        const scheduledStart = new Date(meeting.scheduledStart);

        return (
          CAPACITY_MEETING_STATUSES.includes(meeting.status) &&
          scheduledStart >= start &&
          scheduledStart < end
        );
      });

      return total + seats.length;
    }, 0);
  }, [requests]);

  const meetingCapacity = currentUser?.mentorProfile?.meetingCapacity ?? 0;

  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    const meetings = requests.flatMap((request) =>
      (request.meetings || [])
        .filter(
          (meeting) =>
            UPCOMING_MEETING_STATUSES.includes(meeting.status) &&
            new Date(meeting.scheduledStart) > now
        )
        .map((meeting) => ({
          ...meeting,
          menteeName: request.mentee?.fullName || "מנטית",
          topic: getTopic(request),
        }))
    );

    meetings.sort(
      (first, second) =>
        new Date(first.scheduledStart) - new Date(second.scheduledStart)
    );

    return meetings;
  }, [requests]);

  const nextMeeting = upcomingMeetings[0] || null;

  const attentionItems = useMemo(() => {
    const now = Date.now();
    const items = pendingRequests.map((request) => ({
      id: `request-${request.id}`,
      to: getMentorMeetingsPath("pending"),
      title: request.mentee?.fullName || "מנטית",
      subtitle: "בקשה ממתינה להצעת זמנים",
      detail: getTopic(request),
      sortTime: new Date(request.createdAt).getTime(),
    }));

    requests.forEach((request) => {
      (request.meetings || []).forEach((meeting) => {
        const menteeName = request.mentee?.fullName || "מנטית";
        const endTimestamp = new Date(meeting.scheduledEnd).getTime();
        const startLabel = `${formatDate(meeting.scheduledStart)} · ${formatTime(
          meeting.scheduledStart
        )}`;
        const outcomeSubmitted = (meeting.outcomeConfirmations || []).some(
          (confirmation) => confirmation.userId === currentUser.id
        );
        const feedbackSubmitted = (meeting.feedback || []).some(
          (feedback) => feedback.authorId === currentUser.id
        );
        const endedUnconfirmed =
          UPCOMING_MEETING_STATUSES.includes(meeting.status) &&
          endTimestamp < now &&
          !outcomeSubmitted;

        if (endedUnconfirmed) {
          items.push({
            id: `outcome-${meeting.id}`,
            to: getMentorMeetingsPath("past"),
            title: menteeName,
            subtitle: "ממתינה לאישור תוצאה",
            detail: startLabel,
            sortTime: endTimestamp,
          });
          return;
        }

        if (meeting.status === "COMPLETED" && !feedbackSubmitted) {
          items.push({
            id: `feedback-${meeting.id}`,
            to: getMentorMeetingsPath("past"),
            title: menteeName,
            subtitle: "ממתינה למשוב",
            detail: startLabel,
            sortTime: new Date(meeting.scheduledStart).getTime(),
          });
        }
      });
    });

    return items.sort((first, second) => second.sortTime - first.sortTime);
  }, [currentUser.id, pendingRequests, requests]);

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
        <AppPageHeader title="מסך הבית" subtitle={`שלום, ${currentUser.fullName}`} />

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
            icon={HourglassTopIcon}
            title="בקשות שממתינות לך"
            value={pendingRequests.length}
          />

          <DashboardSummaryCard
            icon={EventNoteIcon}
            title="פגישה קרובה"
            value={nextMeeting ? nextMeeting.menteeName : "אין פגישות קרובות"}
            subtitle={
              nextMeeting
                ? `${formatDate(nextMeeting.scheduledStart)} · ${formatTime(
                    nextMeeting.scheduledStart
                  )}`
                : undefined
            }
          />

          <DashboardSummaryCard
            icon={GroupsIcon}
            title="מכסת פגישות החודש"
            value={`${usedCapacity} / ${meetingCapacity}`}
          />
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mb: 5 }}
        >
          <Button
            component={RouterLink}
            to={getMentorMeetingsPath("pending")}
            variant="contained"
            sx={{ px: 3 }}
          >
            בקשות שממתינות לך
          </Button>

          <Button
            component={RouterLink}
            to={getMentorMeetingsPath("upcoming")}
            variant="outlined"
            sx={{ px: 3 }}
          >
            פגישות קרובות
          </Button>

          <Button
            component={RouterLink}
            to="/profile"
            variant="outlined"
            sx={{ px: 3 }}
          >
            עריכת פרופיל
          </Button>
        </Stack>

        <AppSectionTitle title="דורש את תשומת ליבך" action={
          <Button
            component={RouterLink}
            to={getMentorMeetingsPath(
              pendingRequests.length > 0 ? "pending" : "past"
            )}
            sx={{ fontWeight: 600 }}
          >
            לבקשות הממתינות
          </Button>
        } />

        {attentionItems.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 5 }}>
            אין כרגע פריטים שדורשים טיפול.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
              mb: 5,
            }}
          >
            {attentionItems.slice(0, PREVIEW_LIMIT).map((item) => (
              <PreviewCard
                key={item.id}
                to={item.to}
                title={item.title}
                subtitle={item.subtitle}
                detail={item.detail}
              />
            ))}
          </Box>
        )}

        <AppSectionTitle title="פגישות קרובות" action={
          <Button
            component={RouterLink}
            to={getMentorMeetingsPath("upcoming")}
            sx={{ fontWeight: 600 }}
          >
            לכל הפגישות
          </Button>
        } />

        {upcomingMeetings.length === 0 ? (
          <Typography color="text.secondary">אין פגישות מתוכננות כרגע.</Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 3,
            }}
          >
            {upcomingMeetings.slice(0, PREVIEW_LIMIT).map((meeting) => (
              <PreviewCard
                key={meeting.id}
                to={getMentorMeetingsPath("upcoming")}
                title={meeting.menteeName}
                subtitle={`${formatDate(meeting.scheduledStart)} · ${formatTime(
                  meeting.scheduledStart
                )}`}
                detail={meeting.topic}
              />
            ))}
          </Box>
        )}
    </AppPage>
  );
}

export default MentorDashboard;
