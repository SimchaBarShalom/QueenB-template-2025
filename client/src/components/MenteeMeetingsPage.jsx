import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
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
        item.id === request.id
          ? {
              ...item,
              status: response.data.status,
            }
          : item
      )
    );
  } catch (requestError) {
    console.error(requestError);
    setError("ביטול הבקשה נכשל.");
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

      return {
        id: request.id,
        mentorName: getMentorName(request),
        topic: getTopic(request),
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
            meeting.status === "SCHEDULED" ||
            meeting.status ===
              "ATTENDANCE_CONFIRMED"
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
        .filter(
          (meeting) =>
            meeting.status === "COMPLETED"
        )
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
            feedbackSubmitted:
              request.status ===
              "FEEDBACK_COMPLETED",
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
    <Box sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        <Typography
          variant="h4"
          component="h1"
          sx={{ mb: 3 }}
        >
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
              component="a"
              href={`#${tab.id}`}
              size="small"
              sx={{ borderRadius: 999 }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>

        <Box
          component="section"
          id="completed-section"
          sx={{
            scrollMarginTop: 140,
            mb: 6,
          }}
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
                  onAddFeedback={notReady}
                />
              ))
            )}
          </Stack>
        </Box>

        <Box
          component="section"
          id="scheduled-section"
          sx={{
            scrollMarginTop: 140,
            mb: 6,
          }}
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
                  onCancel={notReady}
                />
              ))
            )}
          </Stack>
        </Box>

        <Box
          component="section"
          id="waiting-mentor-section"
          sx={{
            scrollMarginTop: 140,
            mb: 6,
          }}
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

        <Box
          component="section"
          id="waiting-mentee-section"
          sx={{ scrollMarginTop: 140 }}
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
                    onChooseTime={notReady}
                    onCancel={handleCancelRequest}
                  />
                )
              )
            )}
          </Stack>
        </Box>
      </Container>

      <ComingSoonSnackbar
        message={infoMessage}
        onClose={() => setInfoMessage("")}
      />
    </Box>
  );
}

export default MenteeMeetingsPage;