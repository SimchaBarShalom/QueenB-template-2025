import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
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
  MentorMonthlyBlockCard,
  MentorOfferedSlotsCard,
  MentorPastMeetingCard,
  MentorPendingRequestCard,
  MentorUpcomingMeetingCard,
} from "./MentorMeetingCards";
import OfferSlotsDialog from "./OfferSlotsDialog";

const SECTION_TABS = [
  { id: "past-section", label: "פגישות שהתקיימו" },
  { id: "upcoming-section", label: "פגישות קרובות" },
  { id: "pending-section", label: "בקשות שממתינות לך" },
  { id: "offered-section", label: "זמנים שהצעת" },
  { id: "closed-section", label: "בקשות שנסגרו" },
];

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

function toMeetingView(request, meeting) {
  return {
    id: meeting.id,
    menteeName: request.mentee?.fullName || "חניכה",
    topic: getTopic(request),
    date: formatDate(meeting.scheduledStart),
    startTime: formatTime(meeting.scheduledStart),
    endTime: formatTime(meeting.scheduledEnd),
    status: meeting.status,
    timestamp: new Date(meeting.scheduledStart).getTime(),
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
    menteeName: request.mentee?.fullName || "חניכה",
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
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming-section");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState(null);
  const [slotRequest, setSlotRequest] = useState(null);
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
        const view = toMeetingView(request, meeting);

        if (meeting.status === "COMPLETED") {
          past.push(view);
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
            (request.notifications || []).length > 0 &&
            isCancelledThisMonth(request)
        )
        .map(toRequestView),
    };
  }, [requests]);

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

  const handleOfferSlots = async (slots) => {
    if (!slotRequest) return false;

    try {
      setAction({ requestId: slotRequest.id, type: "slots" });
      replaceRequest(await offerMentorSlots(slotRequest.id, slots));
      showNotification("success", "הזמנים נשלחו לחניכה.");
      return true;
    } catch (requestError) {
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

  if (loading) {
    return (
      <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          הפגישות שלי
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          rowGap={1}
          sx={{
            position: "sticky",
            top: { xs: 64, md: 72 },
            zIndex: 1,
            bgcolor: "#fff",
            border: "1px solid #f6d3e0",
            borderRadius: 999,
            p: 1,
            mb: 4,
          }}
        >
          {SECTION_TABS.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? "contained" : "text"}
              size="small"
              sx={{ borderRadius: 999 }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>

        {activeTab === "past-section" && (
        <Box component="section" id="past-section">
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            פגישות שהתקיימו
          </Typography>
          <Stack spacing={2}>
            {pastMeetings.length === 0 ? (
              <EmptyState>אין עדיין היסטוריית פגישות.</EmptyState>
            ) : (
              pastMeetings.map((meeting) => (
                <MentorPastMeetingCard key={meeting.id} meeting={meeting} />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "upcoming-section" && (
        <Box component="section" id="upcoming-section">
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            פגישות קרובות
          </Typography>
          <Stack spacing={2}>
            {upcomingMeetings.length === 0 ? (
              <EmptyState>אין פגישות מתוכננות כרגע.</EmptyState>
            ) : (
              upcomingMeetings.map((meeting) => (
                <MentorUpcomingMeetingCard key={meeting.id} meeting={meeting} />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "pending-section" && (
        <Box component="section" id="pending-section">
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            בקשות שממתינות לך
          </Typography>
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

        {activeTab === "offered-section" && (
        <Box component="section" id="offered-section">
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            זמנים שהצעת
          </Typography>
          <Stack spacing={2}>
            {offeredRequests.length === 0 ? (
              <EmptyState>אין הצעות זמנים שממתינות לבחירת חניכה.</EmptyState>
            ) : (
              offeredRequests.map((request) => (
                <MentorOfferedSlotsCard key={request.id} request={request} />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "closed-section" && (
          <Box component="section" id="closed-section">
            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
              בקשות שנסגרו החודש
            </Typography>
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
      </Container>

      <OfferSlotsDialog
        open={Boolean(slotRequest)}
        request={slotRequest}
        durationMinutes={currentUser.mentorProfile.meetingDurationMinutes}
        loading={action?.type === "slots"}
        onClose={() => setSlotRequest(null)}
        onSubmit={handleOfferSlots}
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
    </Box>
  );
}

export default MentorMeetingsPage;
