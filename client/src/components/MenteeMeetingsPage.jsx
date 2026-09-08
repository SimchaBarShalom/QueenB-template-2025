import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  CompletedMeetingCard,
  ScheduledMeetingCard,
  PendingSlotsMeetingCard,
  SlotsToChooseMeetingCard,
} from "./MeetingStatusCards";

import ComingSoonSnackbar from "./ComingSoonSnackbar";
import SelectSlotDialog from "./SelectSlotDialog";
import FeedbackDialog from "./FeedbackDialog";
import {
  confirmMeetingOutcome,
  selectMeetingSlot,
  submitMeetingFeedback,
} from "../services/meetingsService";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import { AppPage, AppPageHeader, AppSurface } from "./AppPrimitives";

const SECTION_TABS = [
  { id: "completed-section", label: "פגישות שהתקיימו" },
  { id: "scheduled-section", label: "פגישות שנקבעו" },
  {
    id: "waiting-mentor-section",
    label: "ממתינות להצעת זמנים",
  },
  {
    id: "waiting-mentee-section",
    label: "מחכות לבחירת מועד",
  },
];

function formatDate(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toLocaleDateString("he-IL");
}

function formatTime(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTopic(request) {
  const topics =
    request.mentorProfile?.mentoringTopics || [];

  if (topics.length === 0) {
    return "מנטורינג";
  }

  return topics.map((topic) => topic.name).join(", ");
}

function getMentorName(request) {
  return (
    request.mentorProfile?.user?.fullName ||
    "מנטורית"
  );
}

function MenteeMeetingsPage() {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("scheduled-section");
  const [slotRequest, setSlotRequest] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [feedbackMeeting, setFeedbackMeeting] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const currentUser = JSON.parse(
    localStorage.getItem("queensMatchUser") || "null"
  );

  const menteeId = currentUser?.id;

  useEffect(() => {
    async function loadRequests() {
      if (!menteeId) {
        setError("לא נמצאה משתמשת מחוברת.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `/api/mentoring-requests/mentee/${menteeId}`
        );

        setRequests(response.data);
      } catch (requestError) {
        console.error(requestError);
        setError("לא הצלחנו לטעון את הפגישות.");
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [menteeId]);

  const notReady = () => {
    setInfoMessage(
      "הפעולה תתאפשר בקרוב - התכונה עדיין לא מחוברת לשרת."
    );
  };
  const handleCancelRequest = async (request) => {
  try {
    setError("");

    const response = await axios.patch(
      `/api/mentoring-requests/${request.id}/cancel`,
      {
        menteeId,
      }
    );

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, ...response.data } : item
      )
    );
  } catch (requestError) {
    console.error(requestError);
    setError("ביטול הבקשה נכשל.");
  }
};

  const handleTimesDontWork = async (request) => {
    const isSecondDecline = request.extraSlotsUsed;
    const confirmed = window.confirm(
      isSecondDecline
        ? "דחיית הזמנים פעם נוספת תסגור את הבקשה ולא תאפשר לקבוע פגישה עם המנטורית עד סוף החודש. להמשיך?"
        : "לדחות את הזמנים שהוצעו ולבקש מהמנטורית זמנים חדשים?"
    );

    if (!confirmed) return;

    try {
      setError("");
      const response = await axios.patch(
        `/api/mentoring-requests/${request.id}/decline-slots`,
        { menteeId }
      );

      setRequests((current) =>
        current.map((item) =>
          item.id === request.id ? { ...item, ...response.data } : item
        )
      );
    } catch (requestError) {
      console.error(requestError);
      setError("עדכון הבקשה נכשל.");
    }
  };

  const handleChooseSlot = async () => {
    if (!slotRequest || !selectedSlotId) return;

    try {
      setActionLoading(true);
      setError("");
      const updatedRequest = await selectMeetingSlot(slotRequest.id, selectedSlotId);
      setRequests((current) =>
        current.map((request) =>
          request.id === updatedRequest.id ? updatedRequest : request
        )
      );
      setSlotRequest(null);
      setSelectedSlotId(null);
      setActiveTab("scheduled-section");
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "קביעת הפגישה נכשלה."));
    } finally {
      setActionLoading(false);
    }
  };

  const reloadRequests = async () => {
    const response = await axios.get(`/api/mentoring-requests/mentee/${menteeId}`);
    setRequests(response.data);
  };

  const handleCancelMeeting = async (meeting) => {
    try {
      setActionLoading(true);
      setError("");
      await axios.patch(`/api/meetings/${meeting.id}/cancel`, { menteeId });
      await reloadRequests();
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "ביטול הפגישה נכשל."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOutcome = async (meeting, occurred) => {
    try {
      setActionLoading(true);
      setError("");
      await confirmMeetingOutcome(meeting.id, occurred);
      await reloadRequests();
      setActiveTab("completed-section");
      if (occurred) {
        setFeedbackMeeting(meeting);
      }
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "עדכון תוצאת הפגישה נכשל."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedback = async (feedback) => {
    if (!feedbackMeeting) return false;

    try {
      setActionLoading(true);
      setError("");
      await submitMeetingFeedback(feedbackMeeting.id, feedback);
      await reloadRequests();
      return true;
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "שמירת המשוב נכשלה."));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const waitingForMentorSlots = requests
    .filter(
      (request) =>
        request.status ===
        "WAITING_FOR_MENTOR_SLOTS"
    )
    .map((request) => ({
      id: request.id,
      mentorName: getMentorName(request),
      requestDate: formatDate(request.createdAt),
      topic: getTopic(request),
    }));

  const waitingForMenteeSelection = requests
    .filter(
      (request) =>
        request.status ===
        "WAITING_FOR_MENTEE_SELECTION"
    )
    .map((request) => {
      const latestRound =
        request.schedulingRounds?.[0];
      const extraSlotsUsed = (request.schedulingRounds || []).some(
        (round) => round.type === "EXTRA_SLOTS"
      );

      return {
        id: request.id,
        mentorName: getMentorName(request),
        topic: getTopic(request),
        extraSlotsUsed,
        offeredSlots: (latestRound?.offeredSlots || []).map((slot) => ({
          id: slot.id,
          date: formatDate(slot.startTime),
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
        })),
        requestDate: formatDate(request.createdAt),
        respondedDate: formatDate(
          latestRound?.createdAt ||
            request.updatedAt
        ),
      };
    });

  const scheduledMeetings = requests.flatMap(
    (request) =>
      (request.meetings || [])
        .filter(
          (meeting) =>
            (meeting.status === "SCHEDULED" ||
              meeting.status === "ATTENDANCE_CONFIRMED") &&
            new Date(meeting.scheduledStart).getTime() >= Date.now()
        )
        .map((meeting) => ({
          id: meeting.id,
          mentorName: getMentorName(request),
          date: formatDate(
            meeting.scheduledStart
          ),
          startTime: formatTime(
            meeting.scheduledStart
          ),
          endTime: formatTime(
            meeting.scheduledEnd
          ),
          topic: getTopic(request),
        }))
  );

  const completedMeetings = requests.flatMap(
    (request) =>
      (request.meetings || [])
        .filter((meeting) => {
          const endedUnconfirmed =
            ["SCHEDULED", "ATTENDANCE_CONFIRMED"].includes(meeting.status) &&
            new Date(meeting.scheduledEnd).getTime() < Date.now() &&
            !(meeting.outcomeConfirmations || []).some(
              (confirmation) => confirmation.userId === menteeId
            );

          return meeting.status === "COMPLETED" || endedUnconfirmed;
        })
        .map((meeting) => {
          const start = new Date(
            meeting.scheduledStart
          );

          const end = new Date(
            meeting.scheduledEnd
          );

          const durationMinutes = Math.round(
            (end - start) / 60000
          );

          const needsConfirmation =
            meeting.status !== "COMPLETED" &&
            !(meeting.outcomeConfirmations || []).some(
              (confirmation) => confirmation.userId === menteeId
            );

          return {
            id: meeting.id,
            mentorName: getMentorName(request),
            date: formatDate(
              meeting.scheduledStart
            ),
            time: formatTime(
              meeting.scheduledStart
            ),
            durationMinutes,
            topic: getTopic(request),
            needsConfirmation,
            feedbackSubmitted:
              (meeting.feedback || []).some(
                (feedback) => feedback.authorId === menteeId
              ),
          };
        })
  );

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
    <AppPage maxWidth="md">
        <AppPageHeader title="הפגישות שלי" subtitle="ניהול בקשות, מועדים ומשוב במקום אחד." />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <AppSurface
          component={Stack}
          direction="row"
          spacing={1}
          flexWrap="wrap"
          rowGap={1}
          sx={{
            position: "sticky",
            top: { xs: 64, md: 72 },
            zIndex: 1,
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
              sx={{ fontWeight: activeTab === tab.id ? 700 : 400 }}
            >
              {tab.label}
            </Button>
          ))}
        </AppSurface>

        {activeTab === "completed-section" && (
        <Box
          component="section"
          id="completed-section"
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 2 }}
          >
            פגישות שהתקיימו
          </Typography>

          <Stack spacing={2}>
            {completedMeetings.length === 0 ? (
              <Typography color="text.secondary">
                אין פגישות שהתקיימו עדיין.
              </Typography>
            ) : (
              completedMeetings.map((meeting) => (
                <CompletedMeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  loading={actionLoading}
                  onConfirm={handleOutcome}
                  onAddFeedback={setFeedbackMeeting}
                />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "scheduled-section" && (
        <Box
          component="section"
          id="scheduled-section"
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 2 }}
          >
            פגישות שנקבעו
          </Typography>

          <Stack spacing={2}>
            {scheduledMeetings.length === 0 ? (
              <Typography color="text.secondary">
                אין פגישות מתוכננות כרגע.
              </Typography>
            ) : (
              scheduledMeetings.map((meeting) => (
                <ScheduledMeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onReschedule={notReady}
                  onCancel={handleCancelMeeting}
                />
              ))
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "waiting-mentor-section" && (
        <Box
          component="section"
          id="waiting-mentor-section"
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 2 }}
          >
            ממתינות להצעת זמנים
          </Typography>

          <Stack spacing={2}>
            {waitingForMentorSlots.length === 0 ? (
              <Typography color="text.secondary">
                אין בקשות הממתינות להצעת זמנים.
              </Typography>
            ) : (
              waitingForMentorSlots.map(
                (request) => (
                  <PendingSlotsMeetingCard
                    key={request.id}
                    request={request}
                    onCancel={handleCancelRequest}
                  />
                )
              )
            )}
          </Stack>
        </Box>
        )}

        {activeTab === "waiting-mentee-section" && (
        <Box
          component="section"
          id="waiting-mentee-section"
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 2 }}
          >
            מחכות לבחירת מועד
          </Typography>

          <Stack spacing={2}>
            {waitingForMenteeSelection.length ===
            0 ? (
              <Typography color="text.secondary">
                אין בקשות הממתינות לבחירת
                מועד.
              </Typography>
            ) : (
              waitingForMenteeSelection.map(
                (request) => (
                  <SlotsToChooseMeetingCard
                    key={request.id}
                    request={request}
                    onChooseTime={(selectedRequest) => {
                      setSlotRequest(selectedRequest);
                      setSelectedSlotId(null);
                    }}
                    onTimesDontWork={handleTimesDontWork}
                    onCancel={handleCancelRequest}
                  />
                )
              )
            )}
          </Stack>
        </Box>
        )}


      <SelectSlotDialog
        open={Boolean(slotRequest)}
        request={slotRequest}
        selectedSlotId={selectedSlotId}
        loading={actionLoading}
        onSelect={setSelectedSlotId}
        onClose={() => {
          setSlotRequest(null);
          setSelectedSlotId(null);
        }}
        onSubmit={handleChooseSlot}
      />

      <FeedbackDialog
        open={Boolean(feedbackMeeting)}
        loading={actionLoading}
        onClose={() => setFeedbackMeeting(null)}
        onSubmit={handleFeedback}
      />

      <ComingSoonSnackbar
        message={infoMessage}
        onClose={() => setInfoMessage("")}
      />
    </AppPage>
  );
}

export default MenteeMeetingsPage;
