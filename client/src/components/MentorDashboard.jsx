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
import { formatDate as formatDateLocale, formatTime as formatTimeLocale } from "../i18n/locales";
import { useLanguage } from "../i18n/LanguageContext";

const CAPACITY_STATUSES = [
  "MATCHED",
  "ATTENDANCE_CONFIRMED",
  "COMPLETED",
  "FEEDBACK_COMPLETED",
];

const UPCOMING_MEETING_STATUSES = ["SCHEDULED", "ATTENDANCE_CONFIRMED"];
const PREVIEW_LIMIT = 3;

function formatDate(dateValue, language) {
  return formatDateLocale(dateValue, language);
}

function formatTime(dateValue, language) {
  return formatTimeLocale(dateValue, language);
}

function getTopic(request, mentoringFallback) {
  const topics = request.mentorProfile?.mentoringTopics || [];
  return topics.length > 0 ? topics.map((topic) => topic.name).join(", ") : mentoringFallback;
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
  const { t, language } = useLanguage();
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
          getRequestErrorMessage(requestError, t("errors.loadHome"), t)
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

  const usedCapacity = useMemo(
    () => requests.filter((request) => CAPACITY_STATUSES.includes(request.status)).length,
    [requests]
  );

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
          menteeName: request.mentee?.fullName || t("roles.mentee"),
          topic: getTopic(request, t("roles.mentoring")),
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
      title: request.mentee?.fullName || t("roles.mentee"),
      subtitle: t("mentorDashboard.waitingForSlots"),
      detail: getTopic(request, t("roles.mentoring")),
      sortTime: new Date(request.createdAt).getTime(),
    }));

    requests.forEach((request) => {
      (request.meetings || []).forEach((meeting) => {
        const menteeName = request.mentee?.fullName || t("roles.mentee");
        const endTimestamp = new Date(meeting.scheduledEnd).getTime();
        const startLabel = `${formatDate(meeting.scheduledStart, language)} · ${formatTime(
          meeting.scheduledStart,
          language
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
            subtitle: t("mentorDashboard.waitingForOutcome"),
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
            subtitle: t("mentorDashboard.waitingForFeedback"),
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
        <AppPageHeader title={t("mentorDashboard.home")} subtitle={t("common.greeting", { name: currentUser.fullName })} />

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
            title={t("mentorDashboard.pendingRequests")}
            value={pendingRequests.length}
          />

          <DashboardSummaryCard
            icon={EventNoteIcon}
            title={t("mentorDashboard.upcomingMeeting")}
            value={nextMeeting ? nextMeeting.menteeName : t("mentorDashboard.noUpcoming")}
            subtitle={
              nextMeeting
                ? `${formatDate(nextMeeting.scheduledStart, language)} · ${formatTime(
                    nextMeeting.scheduledStart,
                    language
                  )}`
                : undefined
            }
          />

          <DashboardSummaryCard
            icon={GroupsIcon}
            title={t("mentorDashboard.meetingQuota")}
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
            {t("mentorDashboard.pendingRequests")}
          </Button>

          <Button
            component={RouterLink}
            to={getMentorMeetingsPath("upcoming")}
            variant="outlined"
            sx={{ px: 3 }}
          >
            {t("mentorDashboard.upcomingMeetings")}
          </Button>

          <Button
            component={RouterLink}
            to="/profile"
            variant="outlined"
            sx={{ px: 3 }}
          >
            {t("mentorDashboard.editProfile")}
          </Button>
        </Stack>

        <AppSectionTitle title={t("mentorDashboard.needsAttention")} action={
          <Button
            component={RouterLink}
            to={getMentorMeetingsPath(
              pendingRequests.length > 0 ? "pending" : "past"
            )}
            sx={{ fontWeight: 600 }}
          >
            {t("mentorDashboard.toPending")}
          </Button>
        } />

        {attentionItems.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 5 }}>
            {t("mentorDashboard.noAttention")}
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

        <AppSectionTitle title={t("mentorDashboard.upcomingMeetings")} action={
          <Button
            component={RouterLink}
            to={getMentorMeetingsPath("upcoming")}
            sx={{ fontWeight: 600 }}
          >
            {t("mentorDashboard.allMeetings")}
          </Button>
        } />

        {upcomingMeetings.length === 0 ? (
          <Typography color="text.secondary">{t("mentorDashboard.noScheduled")}</Typography>
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
                subtitle={`${formatDate(meeting.scheduledStart, language)} · ${formatTime(
                    meeting.scheduledStart,
                    language
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
