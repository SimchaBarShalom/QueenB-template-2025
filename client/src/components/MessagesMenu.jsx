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
import apiClient from "../api/client";
import { isMentorUser } from "../utils/areaRouting";

const NOTIFICATION_CONTENT = {
  MENTORING_REQUEST_RECEIVED: ["בקשת מנטורינג חדשה", "נכנסה בקשה חדשה שממתינה לטיפול שלך."],
  REQUEST_REJECTED: ["הבקשה נדחתה", "בקשת המנטורינג עודכנה."],
  SLOTS_AVAILABLE: ["זמנים חדשים זמינים", "נוספו מועדים חדשים לבחירה."],
  MEETING_MATCHED: ["נקבעה פגישה חדשה", "נבחר מועד לפגישה."],
  RESCHEDULE_REQUIRED: ["נדרשים זמנים חדשים", "יש בקשה לעדכון מועדי הפגישה."],
  ATTENDANCE_CONFIRMATION_REQUEST: ["נדרש אישור פגישה", "יש לאשר את תוצאת הפגישה."],
  POST_MEETING_CHECK: ["עדכון לאחר פגישה", "נדרש לעדכן אם הפגישה התקיימה."],
  FEEDBACK_REMINDER: ["משוב ממתין", "נשמח לקבל את המשוב שלך על הפגישה."],
};

function messageFromNotification(notification) {
  const [title, text] = NOTIFICATION_CONTENT[notification.type] || ["התראה חדשה", "יש עדכון חדש בחשבון שלך."];
  return { id: `notification:${notification.id}`, title, text, createdAt: notification.createdAt };
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

  const loadMessages = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/notifications/me");
      setMessages(response.data.map(messageFromNotification));
    } catch {
      // The meetings page displays API errors; the navbar should remain usable.
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const visibleMessages = useMemo(
    () => messages.filter((message) => !seenIds.includes(message.id)),
    [messages, seenIds]
  );

  const markSeen = (messageId) => {
    const nextSeenIds = [...new Set([...seenIds, messageId])];
    setSeenIds(nextSeenIds);
    window.localStorage.setItem(storageKey(currentUser.id), JSON.stringify(nextSeenIds));
  };

  const openMessage = (messageId) => {
    markSeen(messageId);
    setAnchorEl(null);
    navigate(
      currentUser.isAdmin
        ? "/admin/alerts"
        : isMentorUser(currentUser)
          ? "/mentor/meetings"
          : "/mentee/meetings"
    );
  };

  return (
    <>
      <IconButton
        aria-label="התראות"
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
        <Typography sx={{ px: 1.5, py: 1, fontWeight: 700 }}>התראות</Typography>
        <Divider />

        {visibleMessages.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ p: 2 }}>
            אין התראות חדשות.
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
