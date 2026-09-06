import React from "react";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { queenbColors } from "../theme";

// Four status-specific meeting cards for MenteeMeetingsPage. Kept in one
// file since they share the same card shell and are only ever used
// together on that page.

function CardShell({ children }) {
  return (
    <Card variant="outlined" sx={{ p: 3, borderRadius: 3, borderColor: "#f6d3e0" }}>
      <Stack spacing={1.2}>{children}</Stack>
    </Card>
  );
}

function InfoRow({ children }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  );
}

export function CompletedMeetingCard({ meeting, onAddFeedback }) {
  return (
    <CardShell>
      <Typography variant="h6" component="h3">
        {meeting.mentorName}
      </Typography>
      <InfoRow>
        {meeting.date} | {meeting.time} | {meeting.durationMinutes} דקות
      </InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{meeting.topic}</Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mt: 1, pt: 1.5, borderTop: "1px solid #f6d3e0" }}
      >
        {meeting.feedbackSubmitted ? (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <CheckCircleIcon sx={{ fontSize: 18, color: "success.main" }} />
            <Typography variant="body2" sx={{ color: "success.main", fontWeight: 700 }}>
              המשוב הוגש
            </Typography>
          </Stack>
        ) : (
          <>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
              <Typography variant="body2" color="text.secondary">
                טרם הוגש משוב
              </Typography>
            </Stack>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onAddFeedback(meeting)}
              sx={{ borderRadius: 999 }}
            >
              הוספת משוב
            </Button>
          </>
        )}
      </Stack>
    </CardShell>
  );
}

export function ScheduledMeetingCard({ meeting, onReschedule, onCancel }) {
  return (
    <CardShell>
      <Typography variant="h6" component="h3">
        {meeting.mentorName}
      </Typography>
      <InfoRow>
        {meeting.date} | {meeting.startTime} | {meeting.endTime}
      </InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{meeting.topic}</Typography>

      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
        <Button size="small" variant="outlined" onClick={() => onReschedule(meeting)} sx={{ borderRadius: 999 }}>
          שינוי מועד
        </Button>
        <Button
          size="small"
          variant="text"
          color="error"
          onClick={() => onCancel(meeting)}
          sx={{ borderRadius: 999 }}
        >
          ביטול פגישה
        </Button>
      </Stack>
    </CardShell>
  );
}

export function PendingSlotsMeetingCard({ request, onCancel }) {
  return (
    <CardShell>
      <Typography variant="h6" component="h3">
        {request.mentorName}
      </Typography>
      <InfoRow>תאריך הבקשה: {request.requestDate}</InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{request.topic}</Typography>

      <Box
        sx={{
          alignSelf: "flex-start",
          bgcolor: queenbColors.pinkPale,
          color: queenbColors.pink,
          fontWeight: 700,
          fontSize: 13,
          borderRadius: 999,
          px: 1.5,
          py: 0.5,
        }}
      >
        ממתינה להצעת זמנים
      </Box>

      <Button
        size="small"
        variant="text"
        color="error"
        onClick={() => onCancel(request)}
        sx={{ borderRadius: 999, alignSelf: "flex-start" }}
      >
        ביטול הבקשה
      </Button>
    </CardShell>
  );
}

export function SlotsToChooseMeetingCard({
  request,
  onChooseTime,
  onTimesDontWork,
  onCancel,
}) {
  return (
    <CardShell>
      <Typography variant="h6" component="h3">
        {request.mentorName}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{request.topic}</Typography>
      <InfoRow>
        תאריך הבקשה: {request.requestDate} | תאריך המענה: {request.respondedDate}
      </InfoRow>

      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="contained"
          onClick={() => onChooseTime(request)}
          sx={{ borderRadius: 999 }}
        >
          בחירת מועד
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onTimesDontWork(request)}
          sx={{ borderRadius: 999 }}
        >
          {request.extraSlotsUsed ? "הזמנים לא מתאימים" : "בקשת זמנים חדשים"}
        </Button>
        <Button
          size="small"
          variant="text"
          color="error"
          onClick={() => onCancel(request)}
          sx={{ borderRadius: 999 }}
        >
          ביטול הבקשה
        </Button>
      </Stack>
    </CardShell>
  );
}
