import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
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
  cancelMeeting,
  offerRescheduleSlots,
  submitMeetingFeedback,
} from "../services/meetingsService";
import { AppPage } from "./AppPrimitives";
import { formatDate as formatDateLocale, formatTime as formatTimeLocale } from "../i18n/locales";
import { useLanguage } from "../i18n/LanguageContext";

function formatDate(value, language) {
  return formatDateLocale(value, language);
}

function formatTime(value, language) {
  return formatTimeLocale(value, language);
}

function getTopic(request, mentoringFallback) {
  const topics = request.mentorProfile?.mentoringTopics || [];
  return topics.length > 0 ? topics.map((topic) => topic.name).join(", ") : mentoringFallback;
}

function toMeetingView(request, meeting, currentUserId, t, language) {
  return {
    id: meeting.id,
    requestId: request.id,
    menteeName: request.mentee?.fullName || t("roles.mentee"),
    topic: getTopic(request, t("roles.mentoring")),
    date: formatDate(meeting.scheduledStart, language),
    startTime: formatTime(meeting.scheduledStart, language),
    endTime: formatTime(meeting.scheduledEnd, language),
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

function toRequestView(request, t, language) {
  const latestRound = request.schedulingRounds?.[0];
  const needsNewSlots =
    request.status === "WAITING_FOR_MENTOR_SLOTS" &&
    (request.schedulingRounds || []).length > 0;

  return {
    id: request.id,
    status: request.status,
    menteeName: request.mentee?.fullName || t("roles.mentee"),
    topic: getTopic(request, t("roles.mentoring")),
    requestDate: formatDate(request.createdAt, language),
    needsNewSlots,
    offeredSlots: (latestRound?.offeredSlots || []).map((slot) => ({
      id: slot.id,
      date: formatDate(slot.startTime, language),
      startTime: formatTime(slot.startTime, language),
      endTime: formatTime(slot.endTime, language),
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
  const { t, language } = useLanguage();
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
        getRequestErrorMessage(requestError, t("errors.loadMeetingsAndRequests"), t)
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
        const view = toMeetingView(request, meeting, currentUser.id, t, language);
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
        .map((request) => toRequestView(request, t, language)),
      offeredRequests: requests
        .filter((request) => request.status === "WAITING_FOR_MENTEE_SELECTION")
        .map((request) => toRequestView(request, t, language)),
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
        .map((request) => toRequestView(request, t, language)),
    };
  }, [currentUser.id, requests, t, language]);

  const replaceRequest = (updatedRequest) => {
    setRequests((current) =>
      current.map((request) => (request.id === updatedRequest.id ? updatedRequest : request))
    );
  };

  const showNotification = (severity, message) => {
    setNotification({ open: true, severity, message });
  };

  const handleReject = async (request) => {
    if (!window.confirm(t("meetings.confirmReject", { name: request.menteeName }))) return;

    try {
      setAction({ requestId: request.id, type: "reject" });
      replaceRequest(await rejectMentorRequest(request.id));
      showNotification("success", t("meetings.rejected"));
    } catch (requestError) {
      showNotification(
        "error",
        getRequestErrorMessage(requestError, t("errors.rejectRequest"), t)
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
      showNotification("success", t("meetings.slotsSent"));
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
        getRequestErrorMessage(requestError, t("errors.sendSlots"), t)
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
      showNotification("success", t("meetings.newSlotsSent"));
      return true;
    } catch (requestError) {
      showNotification(
        "error",
        getRequestErrorMessage(requestError, t("errors.reschedule"), t)
      );
      return false;
    } finally {
      setAction(null);
    }
  };

  const handleCancelMeeting = async (meeting) => {
    if (!window.confirm("לבטל את הפגישה?") ) return;

    try {
      setAction({ meetingId: meeting.id, type: "cancel" });
      await cancelMeeting(meeting.id);
      await loadRequests();
      showNotification("success", "הפגישה בוטלה.");
    } catch (requestError) {
      showNotification("error", getRequestErrorMessage(requestError, "ביטול הפגישה נכשל."));
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
        showNotification("success", t("meetings.markedNotOccurred"));
      }
    } catch (requestError) {
      showNotification(
        "error",
        getRequestErrorMessage(requestError, t("errors.updateOutcome"), t)
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
      showNotification("success", t("meetings.feedbackSaved"));
      return true;
    } catch (requestError) {
      showNotification(
        "error",
        getRequestErrorMessage(requestError, t("errors.saveFeedback"), t)
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {activeTab === "past" && (
        <Box component="section" id="past-section">
          <Stack spacing={2}>
            {pastMeetings.length === 0 ? (
              <EmptyState>{t("meetings.emptyPast")}</EmptyState>
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
          <Stack spacing={2}>
            {upcomingMeetings.length === 0 ? (
              <EmptyState>{t("meetings.emptyUpcoming")}</EmptyState>
            ) : (
              upcomingMeetings.map((meeting) => (
                <MentorUpcomingMeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onReschedule={setRescheduleMeeting}
                  onCancel={handleCancelMeeting}
                />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "pending" && (
        <Box component="section" id="pending-section">
          <Stack spacing={2}>
            {pendingRequests.length === 0 ? (
              <EmptyState>{t("meetings.emptyPending")}</EmptyState>
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
          <Stack spacing={2}>
            {offeredRequests.length === 0 ? (
              <EmptyState>{t("meetings.emptyOffered")}</EmptyState>
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
            <Stack spacing={2}>
              {monthlyBlocks.length === 0 ? (
                <EmptyState>{t("meetings.emptyClosed")}</EmptyState>
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
        title={t("meetings.rescheduleTitle")}
        submitLabel={t("meetings.rescheduleSubmit")}
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
