import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import EventNoteIcon from "@mui/icons-material/EventNote";
import GroupsIcon from "@mui/icons-material/Groups";
import DashboardSummaryCard from "./DashboardSummaryCard";
import { AppPage, AppPageHeader, AppSectionTitle, AppSurface } from "./AppPrimitives";
import { getMentorMeetingRequests } from "../services/mentorMeetingsService";
import { getMentorMeetingsPath } from "../utils/meetingNav";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import { formatDate, formatTime } from "../i18n/locales";
import { useLanguage } from "../i18n/LanguageContext";

const ACTIVE_STATUSES = ["SCHEDULED", "ATTENDANCE_CONFIRMED"];
const CAPACITY_STATUSES = [...ACTIVE_STATUSES, "COMPLETED"];
const PREVIEW_LIMIT = 3;

function topicFor(request, fallback) {
  const topics = request.mentorProfile?.mentoringTopics || [];
  return topics.length ? topics.map((topic) => topic.name).join(", ") : fallback;
}

function PreviewCard({ to, title, subtitle, detail }) {
  return <AppSurface component={RouterLink} to={to} variant="outlined" sx={{ p: 2, textDecoration: "none", color: "inherit", height: "100%" }}>
    <Typography variant="h6">{title}</Typography>
    {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
    {detail && <Typography sx={{ fontWeight: 600, mt: 0.75 }}>{detail}</Typography>}
  </AppSurface>;
}

function MentorDashboard({ currentUser }) {
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMentorMeetingRequests().then(setRequests).catch((requestError) => {
      console.error(requestError);
      setError(getRequestErrorMessage(requestError, t("errors.loadHome"), t));
    }).finally(() => setLoading(false));
  }, []);

  const pendingRequests = useMemo(() => requests.filter((request) => request.status === "WAITING_FOR_MENTOR_SLOTS"), [requests]);
  const usedCapacity = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return requests.reduce((total, request) => total + (request.meetings || []).filter((meeting) => {
      const scheduledStart = new Date(meeting.scheduledStart);
      return CAPACITY_STATUSES.includes(meeting.status) && scheduledStart >= start && scheduledStart < end;
    }).length, 0);
  }, [requests]);
  const upcomingMeetings = useMemo(() => requests.flatMap((request) => (request.meetings || [])
    .filter((meeting) => ACTIVE_STATUSES.includes(meeting.status) && new Date(meeting.scheduledStart) > new Date())
    .map((meeting) => ({ ...meeting, menteeName: request.mentee?.fullName || t("roles.mentee"), topic: topicFor(request, t("roles.mentoring")) })))
    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart)), [requests, t]);
  const attentionItems = useMemo(() => {
    const now = Date.now();
    const items = pendingRequests.map((request) => ({ id: `request-${request.id}`, to: getMentorMeetingsPath("pending"), title: request.mentee?.fullName || t("roles.mentee"), subtitle: t("mentorDashboard.waitingForSlots"), detail: topicFor(request, t("roles.mentoring")), sortTime: new Date(request.createdAt).getTime() }));
    requests.forEach((request) => (request.meetings || []).forEach((meeting) => {
      const name = request.mentee?.fullName || t("roles.mentee");
      const start = `${formatDate(meeting.scheduledStart, language)} · ${formatTime(meeting.scheduledStart, language)}`;
      const outcomeSubmitted = (meeting.outcomeConfirmations || []).some((item) => item.userId === currentUser.id);
      const feedbackSubmitted = (meeting.feedback || []).some((item) => item.authorId === currentUser.id);
      if (ACTIVE_STATUSES.includes(meeting.status) && new Date(meeting.scheduledEnd).getTime() < now && !outcomeSubmitted) items.push({ id: `outcome-${meeting.id}`, to: getMentorMeetingsPath("past"), title: name, subtitle: t("mentorDashboard.waitingForOutcome"), detail: start, sortTime: new Date(meeting.scheduledEnd).getTime() });
      else if (meeting.status === "COMPLETED" && !feedbackSubmitted) items.push({ id: `feedback-${meeting.id}`, to: getMentorMeetingsPath("past"), title: name, subtitle: t("mentorDashboard.waitingForFeedback"), detail: start, sortTime: new Date(meeting.scheduledStart).getTime() });
    }));
    return items.sort((a, b) => b.sortTime - a.sortTime);
  }, [currentUser.id, language, pendingRequests, requests, t]);

  if (loading) return <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}><CircularProgress /></Box>;
  const nextMeeting = upcomingMeetings[0];
  const cardGrid = { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 };
  return <AppPage>
    <AppPageHeader title={currentUser?.fullName?.trim() ? t("common.greeting", { name: currentUser.fullName.trim() }) : t("nav.home")} />
    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
    <Box sx={{ ...cardGrid, mb: 4 }}>
      <DashboardSummaryCard icon={HourglassTopIcon} title={t("mentorDashboard.pendingRequests")} value={pendingRequests.length} />
      <DashboardSummaryCard icon={EventNoteIcon} title={t("mentorDashboard.upcomingMeeting")} value={nextMeeting?.menteeName || t("mentorDashboard.noUpcoming")} subtitle={nextMeeting && `${formatDate(nextMeeting.scheduledStart, language)} · ${formatTime(nextMeeting.scheduledStart, language)}`} />
      <DashboardSummaryCard icon={GroupsIcon} title={t("mentorDashboard.meetingQuota")} value={`${usedCapacity} / ${currentUser?.mentorProfile?.meetingCapacity ?? 0}`} />
    </Box>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 5 }}>
      <Button component={RouterLink} to={getMentorMeetingsPath("pending")} variant="contained">{t("mentorDashboard.pendingRequests")}</Button>
      <Button component={RouterLink} to={getMentorMeetingsPath("upcoming")} variant="outlined">{t("mentorDashboard.upcomingMeetings")}</Button>
      <Button component={RouterLink} to="/profile" variant="outlined">{t("mentorDashboard.editProfile")}</Button>
    </Stack>
    <AppSectionTitle title={t("mentorDashboard.needsAttention")} action={<Button component={RouterLink} to={getMentorMeetingsPath(pendingRequests.length ? "pending" : "past")}>{t("mentorDashboard.toPending")}</Button>} />
    {attentionItems.length ? <Box sx={{ ...cardGrid, mb: 5 }}>{attentionItems.slice(0, PREVIEW_LIMIT).map((item) => <PreviewCard key={item.id} {...item} />)}</Box> : <Typography color="text.secondary" sx={{ mb: 5 }}>{t("mentorDashboard.noAttention")}</Typography>}
    <AppSectionTitle title={t("mentorDashboard.upcomingMeetings")} action={<Button component={RouterLink} to={getMentorMeetingsPath("upcoming")}>{t("mentorDashboard.allMeetings")}</Button>} />
    {upcomingMeetings.length ? <Box sx={cardGrid}>{upcomingMeetings.slice(0, PREVIEW_LIMIT).map((meeting) => <PreviewCard key={meeting.id} to={getMentorMeetingsPath("upcoming")} title={meeting.menteeName} subtitle={`${formatDate(meeting.scheduledStart, language)} · ${formatTime(meeting.scheduledStart, language)}`} detail={meeting.topic} />)}</Box> : <Typography color="text.secondary">{t("mentorDashboard.noScheduled")}</Typography>}
  </AppPage>;
}

export default MentorDashboard;
