import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  getMentorMeetingRequests,
  offerMentorSlots,
  rejectMentorRequest,
} from "../services/mentorMeetingsService";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import {
  DEFAULT_MENTOR_MEETING_TAB,
  getMentorMeetingTabFromSearch,
  isMentorMeetingTab,
  MENTOR_MEETING_TAB_QUERY,
} from "../utils/meetingNav";
import {
  MentorMonthlyBlockCard,
  MentorOfferedSlotsCard,
  MentorPastMeetingCard,
  MentorPendingRequestCard,
  MentorUpcomingMeetingCard,
} from "./MentorMeetingCards";
import OfferSlotsDialog from "./OfferSlotsDialog";
import FeedbackDialog from "./FeedbackDialog";
import {
  confirmMeetingOutcome,
  offerRescheduleSlots,
  submitMeetingFeedback,
} from "../services/meetingsService";
import { AppPage, AppPageHeader, AppSectionTitle } from "./AppPrimitives";

function formatDate(value) {
  return new Date(value).toLocaleDateString("he-IL");
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTopic(request) {
  const topics = request.mentorProfile?.mentoringTopics || [];
  return topics.length > 0 ? topics.map((topic) => topic.name).join(", ") : "מנטורינג";
}

function toMeetingView(request, meeting, currentUserId) {
  return {
    id: meeting.id,
    requestId: request.id,
    menteeName: request.mentee?.fullName || "מנטית",
    topic: getTopic(request),
    date: formatDate(meeting.scheduledStart),
    startTime: formatTime(meeting.scheduledStart),
    endTime: formatTime(meeting.scheduledEnd),
    status: meeting.status,
    timestamp: new Date(meeting.scheduledStart).getTime(),
    endTimestamp: new Date(meeting.scheduledEnd).getTime(),
    rescheduleUsed: (request.schedulingRounds || []).some(
      (round) => round.type === "RESCHEDULE_BEFORE_MEETING"
    ),
    feedbackSubmitted: (meeting.feedback || []).some(
      (feedback) => feedback.authorId === currentUserId
    ),
    outcomeSubmitted: (meeting.outcomeConfirmations || []).some(
      (confirmation) => confirmation.userId === currentUserId
    ),
  };
}

function toRequestView(request) {
  const latestRound = request.schedulingRounds?.[0];
  const needsNewSlots =
    request.status === "WAITING_FOR_MENTOR_SLOTS" &&
    (request.schedulingRounds || []).length > 0;

  return {
    id: request.id,
    status: request.status,
    menteeName: request.mentee?.fullName || "מנטית",
    topic: getTopic(request),
    requestDate: formatDate(request.createdAt),
    needsNewSlots,
    offeredSlots: (latestRound?.offeredSlots || []).map((slot) => ({
      id: slot.id,
      date: formatDate(slot.startTime),
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime),
    })),
  };
}

function isCancelledThisMonth(request) {
  const updatedAt = new Date(request.updatedAt);
  const now = new Date();
  return (
    updatedAt.getFullYear() === now.getFullYear() &&
    updatedAt.getMonth() === now.getMonth()
  );
}

function hasExtraSlotsRound(request) {
  return (request.schedulingRounds || []).some((round) => round.type === "EXTRA_SLOTS");
}

// 404/409 mean the request was already handled (or removed) since the page
// loaded, so the card on screen no longer reflects the server.
function isStaleRequestError(error) {
  return [404, 409].includes(error.response?.status);
}

function EmptyState({ children }) {
  return <Typography color="text.secondary">{children}</Typography>;
}

function MentorMeetingsPage({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const activeTab = getMentorMeetingTabFromSearch(searchParams);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState(null);
  const [slotRequest, setSlotRequest] = useState(null);
  const [rescheduleMeeting, setRescheduleMeeting] = useState(null);
  const [feedbackMeeting, setFeedbackMeeting] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const loadRequests = useCallback(async ({ withSpinner = false } = {}) => {
    try {
      if (withSpinner) setLoading(true);
      setError("");
      setRequests(await getMentorMeetingRequests());
    } catch (requestError) {
      setError(
        getRequestErrorMessage(requestError, "לא הצלחנו לטעון את הפגישות והבקשות.")
      );
    } finally {
      if (withSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests({ withSpinner: true });
  }, [loadRequests]);

  useEffect(() => {
    const rawTab = searchParams.get(MENTOR_MEETING_TAB_QUERY);
    if (!isMentorMeetingTab(rawTab)) {
      const next = new URLSearchParams(searchParams);
      next.set(MENTOR_MEETING_TAB_QUERY, DEFAULT_MENTOR_MEETING_TAB);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const {
    pastMeetings,
    upcomingMeetings,
    pendingRequests,
    offeredRequests,
    monthlyBlocks,
  } = useMemo(() => {
    const now = Date.now();
    const past = [];
    const upcoming = [];

    requests.forEach((request) => {
      (request.meetings || []).forEach((meeting) => {
        const view = toMeetingView(request, meeting, currentUser.id);
        const endedUnconfirmed =
          ["SCHEDULED", "ATTENDANCE_CONFIRMED"].includes(meeting.status) &&
          view.endTimestamp < now &&
          !view.outcomeSubmitted;

        if (meeting.status === "COMPLETED" || endedUnconfirmed) {
          past.push({ ...view, needsConfirmation: endedUnconfirmed });
        } else if (
          ["SCHEDULED", "ATTENDANCE_CONFIRMED"].includes(meeting.status) &&
          view.timestamp >= now
        ) {
          upcoming.push(view);
        }
      });
    });

    return {
      pastMeetings: past.sort((first, second) => second.timestamp - first.timestamp),
      upcomingMeetings: upcoming.sort((first, second) => first.timestamp - second.timestamp),
      pendingRequests: requests
        .filter((request) => request.status === "WAITING_FOR_MENTOR_SLOTS")
        .map(toRequestView),
      offeredRequests: requests
        .filter((request) => request.status === "WAITING_FOR_MENTEE_SELECTION")
        .map(toRequestView),
      monthlyBlocks: requests
        .filter(
          (request) =>
            request.status === "CANCELLED" &&
            hasExtraSlotsRound(request) &&
            (request.notifications || []).some(
              (notification) => notification.type === "RESCHEDULE_REQUIRED"
            ) &&
            isCancelledThisMonth(request)
        )
        .map(toRequestView),
    };
  }, [currentUser.id, requests]);

  const replaceRequest = (updatedRequest) => {
    setRequests((current) =>
      current.map((request) => (request.id === updatedRequest.id ? updatedRequest : request))
    );
  };

  const showNotification = (severity, message) => {
    setNotification({ open: true, severity, message });
  };

  const handleReject = async (request) => {
    if (!window.confirm(`לדחות את הבקשה של ${request.menteeName}?`)) return;

    try {
      setAction({ requestId: request.id, type: "reject" });
      replaceRequest(await rejectMentorRequest(request.id));
      showNotification("success", "הבקשה נדחתה.");
    } catch (requestError) {
      showNotification(
        "error",
        getRequestErrorMessage(requestError, "דחיית הבקשה נכשלה.")
      );
      if (isStaleRequestError(requestError)) await loadRequests();
    } finally {
      setAction(null);
    }
  };

  const handleOfferSlots = async (slots, { confirmOverCapacity = false } = {}) => {
    if (!slotRequest) return false;

    try {
      setAction({ requestId: slotRequest.id, type: "slots" });
      replaceRequest(
        await offerMentorSlots(slotRequest.id, slots, { confirmOverCapacity })
      );
      showNotification("success", "הזמנים נשלחו למנטית.");
      return true;
    } catch (requestError) {
      const capacity = requestError.response?.data;

      if (capacity?.code === "CAPACITY_EXCEEDED" && !confirmOverCapacity) {
        const proceed = window.confirm(
          `כבר קבעת ${capacity.usedCapacity} מתוך ${capacity.meetingCapacity} מפגשים החודש. ` +
            "להציע זמנים בכל זאת ולחרוג מהמכסה? " +
            "חניכות נוספות עדיין לא יוכלו לשלוח לך בקשות חדשות."
        );

        if (!proceed) return false;

        return handleOfferSlots(slots, { confirmOverCapacity: true });
      }

      showNotification(
        "error",
        getRequestErrorMessage(requestError, "שליחת הזמנים נכשלה.")
      );

      if (isStaleRequestError(requestError)) {
        setSlotRequest(null);
        await loadRequests();
      }

      return false;
    } finally {
      setAction(null);
    }
  };

  const handleReschedule = async (slots) => {
    if (!rescheduleMeeting) return false;

    try {
      setAction({ requestId: rescheduleMeeting.requestId, type: "reschedule" });
      await offerRescheduleSlots(rescheduleMeeting.requestId, slots);
      await loadRequests();
      showNotification("success", "הזמנים החדשים נשלחו למנטית.");
      return true;
    } catch (requestError) {
      showNotification(
        "error",
        getRequestErrorMessage(requestError, "שינוי מועד הפגישה נכשל.")
      );
      return false;
    } finally {
      setAction(null);
    }
  };

  const handleOutcome = async (meeting, occurred) => {
    try {
      setAction({ meetingId: meeting.id, type: "outcome" });
      await confirmMeetingOutcome(meeting.id, occurred);
      await loadRequests();
      if (occurred) {
        setFeedbackMeeting(meeting);
      } else {
        showNotification("success", "הפגישה סומנה כלא התקיימה.");
      }
    } catch (requestError) {
      showNotification(
        "error",
        getRequestErrorMessage(requestError, "עדכון תוצאת הפגישה נכשל.")
      );
    } finally {
      setAction(null);
    }
  };

  const handleFeedback = async (feedback) => {
    if (!feedbackMeeting) return false;

    try {
      setAction({ meetingId: feedbackMeeting.id, type: "feedback" });
      await submitMeetingFeedback(feedbackMeeting.id, feedback);
      await loadRequests();
      showNotification("success", "המשוב נשמר.");
      return true;
    } catch (requestError) {
      showNotification(
        "error",
        getRequestErrorMessage(requestError, "שמירת המשוב נכשלה.")
      );
      return false;
    } finally {
      setAction(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AppPage maxWidth="md">
        <AppPageHeader title="הפגישות שלי" subtitle="בקשות נכנסות, מועדים ומשוב במקום אחד." actions={
          <Button component={RouterLink} to="/mentee" variant="outlined">
            מעבר לאזור המנטיות
          </Button>
        } />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {activeTab === "past" && (
        <Box component="section" id="past-section">
          <AppSectionTitle title="פגישות שהתקיימו" />
          <Stack spacing={2}>
            {pastMeetings.length === 0 ? (
              <EmptyState>אין עדיין היסטוריית פגישות.</EmptyState>
            ) : (
              pastMeetings.map((meeting) => (
                <MentorPastMeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  loading={action?.meetingId === meeting.id}
                  onConfirm={handleOutcome}
                  onFeedback={setFeedbackMeeting}
                />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "upcoming" && (
        <Box component="section" id="upcoming-section">
          <AppSectionTitle title="פגישות קרובות" />
          <Stack spacing={2}>
            {upcomingMeetings.length === 0 ? (
              <EmptyState>אין פגישות מתוכננות כרגע.</EmptyState>
            ) : (
              upcomingMeetings.map((meeting) => (
                <MentorUpcomingMeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onReschedule={setRescheduleMeeting}
                />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "pending" && (
        <Box component="section" id="pending-section">
          <AppSectionTitle title="בקשות שממתינות לך" />
          <Stack spacing={2}>
            {pendingRequests.length === 0 ? (
              <EmptyState>אין בקשות שממתינות לטיפול.</EmptyState>
            ) : (
              pendingRequests.map((request) => (
                <MentorPendingRequestCard
                  key={request.id}
                  request={request}
                  actionLoading={action?.requestId === request.id}
                  onReject={handleReject}
                  onOfferSlots={setSlotRequest}
                />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "offered" && (
        <Box component="section" id="offered-section">
          <AppSectionTitle title="זמנים שהצעת" />
          <Stack spacing={2}>
            {offeredRequests.length === 0 ? (
              <EmptyState>אין הצעות זמנים שממתינות לבחירת מנטית.</EmptyState>
            ) : (
              offeredRequests.map((request) => (
                <MentorOfferedSlotsCard key={request.id} request={request} />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "closed" && (
          <Box component="section" id="closed-section">
            <AppSectionTitle title="בקשות שנסגרו החודש" />
            <Stack spacing={2}>
              {monthlyBlocks.length === 0 ? (
                <EmptyState>אין בקשות שנסגרו החודש.</EmptyState>
              ) : (
                monthlyBlocks.map((notice) => (
                  <MentorMonthlyBlockCard key={notice.id} notice={notice} />
                ))
              )}
            </Stack>
          </Box>
        )}


      <OfferSlotsDialog
        open={Boolean(slotRequest)}
        request={slotRequest}
        durationMinutes={currentUser.mentorProfile.meetingDurationMinutes}
        loading={action?.type === "slots"}
        onClose={() => setSlotRequest(null)}
        onSubmit={handleOfferSlots}
      />

      <OfferSlotsDialog
        open={Boolean(rescheduleMeeting)}
        request={{ menteeName: rescheduleMeeting?.menteeName }}
        durationMinutes={currentUser.mentorProfile.meetingDurationMinutes}
        loading={action?.type === "reschedule"}
        title="שינוי מועד והצעת זמנים"
        submitLabel="שליחת זמנים חדשים"
        onClose={() => setRescheduleMeeting(null)}
        onSubmit={handleReschedule}
      />

      <FeedbackDialog
        open={Boolean(feedbackMeeting)}
        loading={action?.type === "feedback"}
        onClose={() => setFeedbackMeeting(null)}
        onSubmit={handleFeedback}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          onClose={() => setNotification((current) => ({ ...current, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </AppPage>
  );
}

export default MentorMeetingsPage;
