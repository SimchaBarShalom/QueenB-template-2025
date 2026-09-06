import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import { getMentorMeetingRequests } from "../services/mentorMeetingsService";
import { isMentorUser } from "../utils/areaRouting";

function messageFromRequest(request) {
  const rounds = request.schedulingRounds || [];
  const matchedNotification = request.notifications?.find(
    (notification) => notification.type === "MEETING_MATCHED"
  );
  const latestNotification = request.notifications?.find(
    (notification) => notification.type === "RESCHEDULE_REQUIRED"
  );
  const latestRound = rounds[0];
  const menteeName = request.mentee?.fullName || "החניכה";

  if (matchedNotification) {
    const meeting = request.meetings?.find((item) =>
      ["SCHEDULED", "ATTENDANCE_CONFIRMED"].includes(item.status)
    );
    const date = meeting
      ? new Date(meeting.scheduledStart).toLocaleString("he-IL", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "";

    return {
      id: `notification:${matchedNotification.id}`,
      title: "נקבעה פגישה חדשה",
      text: `${menteeName} בחרה מועד${date ? `: ${date}` : ""}.`,
      createdAt: matchedNotification.createdAt,
    };
  }

  if (
    latestNotification &&
    request.status === "WAITING_FOR_MENTOR_SLOTS" &&
    rounds.length > 0
  ) {
    return {
      id: `notification:${latestNotification.id}`,
      title: "נדרשים זמנים חדשים",
      text: `${menteeName} דחתה את הזמנים שהצעת וממתינה להצעה חדשה.`,
      createdAt: latestNotification.createdAt || latestRound?.createdAt || request.updatedAt,
    };
  }

  if (
    latestNotification &&
    request.status === "CANCELLED" &&
    rounds.some((round) => round.type === "EXTRA_SLOTS")
  ) {
    return {
      id: `notification:${latestNotification.id}`,
      title: "הבקשה נסגרה",
      text: `${menteeName} דחתה גם את סבב הזמנים השני. לא ניתן לקבוע איתה פגישה החודש.`,
      createdAt: latestNotification.createdAt || request.updatedAt,
    };
  }

  return null;
}

function storageKey(userId) {
  return `queensMatchSeenMessages:${userId}`;
}

function MessagesMenu({ currentUser }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [messages, setMessages] = useState([]);
  const [seenIds, setSeenIds] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(storageKey(currentUser.id)) || "[]");
    } catch {
      return [];
    }
  });
  const navigate = useNavigate();
  const mentor = isMentorUser(currentUser);

  const loadMessages = useCallback(async () => {
    if (!mentor) return;

    try {
      const requests = await getMentorMeetingRequests();
      setMessages(
        requests
          .map(messageFromRequest)
          .filter(Boolean)
          .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
      );
    } catch {
      // The meetings page displays API errors; the navbar should remain usable.
    }
  }, [mentor]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const visibleMessages = useMemo(
    () => messages.filter((message) => !seenIds.includes(message.id)),
    [messages, seenIds]
  );

  if (!mentor) return null;

  const markSeen = (messageId) => {
    const nextSeenIds = [...new Set([...seenIds, messageId])];
    setSeenIds(nextSeenIds);
    window.localStorage.setItem(storageKey(currentUser.id), JSON.stringify(nextSeenIds));
  };

  const openMessage = (messageId) => {
    markSeen(messageId);
    setAnchorEl(null);
    navigate("/mentor/meetings");
  };

  return (
    <>
      <IconButton
        aria-label="הודעות"
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
          loadMessages();
        }}
        size="small"
      >
        <Badge badgeContent={visibleMessages.length} color="error">
          <NotificationsOutlinedIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 340, maxWidth: "calc(100vw - 32px)", p: 1 } }}
      >
        <Typography sx={{ px: 1.5, py: 1, fontWeight: 700 }}>הודעות חדשות</Typography>
        <Divider />

        {visibleMessages.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ p: 2 }}>
            אין הודעות חדשות.
          </Typography>
        ) : (
          visibleMessages.map((message) => (
            <Box key={message.id} sx={{ p: 1.5 }}>
              <Stack spacing={0.75}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => openMessage(message.id)}
                  sx={{
                    border: 0,
                    bgcolor: "transparent",
                    p: 0,
                    textAlign: "start",
                    cursor: "pointer",
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {message.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {message.text}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => markSeen(message.id)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  ראיתי
                </Button>
              </Stack>
              <Divider sx={{ mt: 1.5 }} />
            </Box>
          ))
        )}
      </Menu>
    </>
  );
}

export default MessagesMenu;
