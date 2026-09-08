import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
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

import SelectSlotDialog from "./SelectSlotDialog";
import FeedbackDialog from "./FeedbackDialog";
import {
  confirmMeetingOutcome,
  cancelMeeting,
  requestMeetingReschedule,
  selectMeetingSlot,
  submitMeetingFeedback,
} from "../services/meetingsService";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import { AppPage } from "./AppPrimitives";
import {
  DEFAULT_MENTEE_MEETING_TAB,
  getMenteeMeetingTabFromSearch,
  isMenteeMeetingTab,
  MENTOR_MEETING_TAB_QUERY,
} from "../utils/meetingNav";
import { formatDate as formatDateLocale, formatTime as formatTimeLocale } from "../i18n/locales";
import { useLanguage } from "../i18n/LanguageContext";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const [requests, setRequests] = useState([]);
  const activeTab = getMenteeMeetingTabFromSearch(searchParams);
  const [slotRequest, setSlotRequest] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [feedbackMeeting, setFeedbackMeeting] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = JSON.parse(
    localStorage.getItem("queensMatchUser") || "null"
  );

  const menteeId = currentUser?.id;

  const setActiveTab = (tabId) => {
    const next = new URLSearchParams(searchParams);
    next.set(MENTOR_MEETING_TAB_QUERY, tabId);
    setSearchParams(next);
  };

  useEffect(() => {
    if (!isMenteeMeetingTab(searchParams.get(MENTOR_MEETING_TAB_QUERY))) {
      const next = new URLSearchParams(searchParams);
      next.set(MENTOR_MEETING_TAB_QUERY, DEFAULT_MENTEE_MEETING_TAB);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

        setRequests(response.data.data || response.data);
      } catch (requestError) {
        console.error(requestError);
        setError(t("errors.loadMeetings"));
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [menteeId, t]);

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
    setRequests(response.data.data || response.data);
  };

  const handleCancelMeeting = async (meeting) => {
    try {
      setActionLoading(true);
      setError("");
      await cancelMeeting(meeting.id);
      await reloadRequests();
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, t("errors.cancelMeeting"), t));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleMeeting = async (meeting) => {
    if (!window.confirm("לבקש מהמנטורית להציע מועדים חדשים?")) return;

    try {
      setActionLoading(true);
      setError("");
      await requestMeetingReschedule(meeting.id);
      await reloadRequests();
      setActiveTab("waiting-mentor-section");
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, "בקשת שינוי המועד נכשלה."));
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
          meetLink: meeting.googleMeetLink,
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {activeTab === "completed-section" && (
        <Box
          component="section"
          id="completed-section"
        >
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
                  onReschedule={handleRescheduleMeeting}
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

    </AppPage>
  );
}

export default MenteeMeetingsPage;
