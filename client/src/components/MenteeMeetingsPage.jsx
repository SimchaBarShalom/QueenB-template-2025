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
import { formatDate as formatDateLocale, formatTime as formatTimeLocale } from "../i18n/locales";
import { useLanguage } from "../i18n/LanguageContext";

const SECTION_TABS = [
  { id: "completed-section", labelKey: "meetings.tabCompleted" },
  { id: "scheduled-section", labelKey: "meetings.tabScheduled" },
  { id: "waiting-mentor-section", labelKey: "meetings.tabWaitingMentor" },
  { id: "waiting-mentee-section", labelKey: "meetings.tabWaitingMentee" },
];

function formatDate(dateValue, language) {
  if (!dateValue) return "";

  return formatDateLocale(dateValue, language);
}

function formatTime(dateValue, language) {
  if (!dateValue) return "";

  return formatTimeLocale(dateValue, language);
}

function getTopic(request, mentoringFallback) {
  const topics =
    request.mentorProfile?.mentoringTopics || [];

  if (topics.length === 0) {
    return mentoringFallback;
  }

  return topics.map((topic) => topic.name).join(", ");
}

function getMentorName(request, mentorFallback) {
  return (
    request.mentorProfile?.user?.fullName ||
    mentorFallback
  );
}

function MenteeMeetingsPage() {
  const { t, language } = useLanguage();
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
        setError(t("errors.noUser"));
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
        setError(t("errors.loadMeetings"));
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [menteeId]);

  const notReady = () => {
    setInfoMessage(
      t("errors.comingSoon")
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
    setError(t("errors.cancelRequest"));
  }
};

  const handleTimesDontWork = async (request) => {
    const isSecondDecline = request.extraSlotsUsed;
    const confirmed = window.confirm(
      isSecondDecline
        ? t("meetings.confirmDeclineSecond")
        : t("meetings.confirmDeclineFirst")
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
      setError(t("errors.updateRequest"));
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
      setError(getRequestErrorMessage(requestError, t("errors.scheduleMeeting"), t));
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
      setError(getRequestErrorMessage(requestError, t("errors.cancelMeeting"), t));
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
      setError(getRequestErrorMessage(requestError, t("errors.updateOutcome"), t));
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
      setError(getRequestErrorMessage(requestError, t("errors.saveFeedback"), t));
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
      mentorName: getMentorName(request, t("roles.mentor")),
      requestDate: formatDate(request.createdAt, language),
      topic: getTopic(request, t("roles.mentoring")),
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
        mentorName: getMentorName(request, t("roles.mentor")),
        topic: getTopic(request, t("roles.mentoring")),
        extraSlotsUsed,
        offeredSlots: (latestRound?.offeredSlots || []).map((slot) => ({
          id: slot.id,
          date: formatDate(slot.startTime, language),
          startTime: formatTime(slot.startTime, language),
          endTime: formatTime(slot.endTime, language),
        })),
        requestDate: formatDate(request.createdAt, language),
        respondedDate: formatDate(
          latestRound?.createdAt ||
            request.updatedAt,
          language
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
          mentorName: getMentorName(request, t("roles.mentor")),
          date: formatDate(
            meeting.scheduledStart,
            language
          ),
          startTime: formatTime(
            meeting.scheduledStart,
            language
          ),
          endTime: formatTime(
            meeting.scheduledEnd,
            language
          ),
          topic: getTopic(request, t("roles.mentoring")),
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
            mentorName: getMentorName(request, t("roles.mentor")),
            date: formatDate(
              meeting.scheduledStart,
              language
            ),
            time: formatTime(
              meeting.scheduledStart,
              language
            ),
            durationMinutes,
            topic: getTopic(request, t("roles.mentoring")),
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
        <AppPageHeader title={t("meetings.menteeTitle")} subtitle={t("meetings.menteeSubtitle")} />

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
              {t(tab.labelKey)}
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
            {t("meetings.tabCompleted")}
          </Typography>

          <Stack spacing={2}>
            {completedMeetings.length === 0 ? (
              <Typography color="text.secondary">
                {t("meetings.emptyCompleted")}
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
            {t("meetings.tabScheduled")}
          </Typography>

          <Stack spacing={2}>
            {scheduledMeetings.length === 0 ? (
              <Typography color="text.secondary">
                {t("meetings.emptyScheduled")}
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
            {t("meetings.tabWaitingMentor")}
          </Typography>

          <Stack spacing={2}>
            {waitingForMentorSlots.length === 0 ? (
              <Typography color="text.secondary">
                {t("meetings.emptyWaitingMentor")}
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
            {t("meetings.tabWaitingMentee")}
          </Typography>

          <Stack spacing={2}>
            {waitingForMenteeSelection.length ===
            0 ? (
              <Typography color="text.secondary">
                {t("meetings.emptyWaitingMentee")}
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
