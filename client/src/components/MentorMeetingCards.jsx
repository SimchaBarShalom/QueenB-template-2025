import React from "react";
import { Box, Button, Card, Chip, Stack, Typography } from "@mui/material";
import { queenbColors } from "../theme";

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

export function MentorPastMeetingCard({ meeting }) {
  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{meeting.menteeName}</Typography>
        <Chip
          size="small"
          color={meeting.status === "COMPLETED" ? "success" : "default"}
          label={meeting.status === "COMPLETED" ? "התקיימה" : "לא התקיימה"}
        />
      </Stack>
      <InfoRow>
        {meeting.date} | {meeting.startTime}–{meeting.endTime}
      </InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{meeting.topic}</Typography>
    </CardShell>
  );
}

export function MentorUpcomingMeetingCard({ meeting }) {
  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{meeting.menteeName}</Typography>
        <Chip size="small" color="primary" variant="outlined" label="פגישה קרובה" />
      </Stack>
      <InfoRow>
        {meeting.date} | {meeting.startTime}–{meeting.endTime}
      </InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{meeting.topic}</Typography>
    </CardShell>
  );
}

export function MentorPendingRequestCard({
  request,
  actionLoading,
  onReject,
  onOfferSlots,
}) {
  const waitingForMentor = request.status === "WAITING_FOR_MENTOR_SLOTS";

  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{request.menteeName}</Typography>
        <Chip
          size="small"
          label={waitingForMentor ? "ממתינה לתגובה שלך" : "ממתינה לבחירת החניכה"}
          sx={{
            bgcolor: queenbColors.pinkPale,
            color: queenbColors.pink,
            fontWeight: 700,
          }}
        />
      </Stack>

      <InfoRow>התקבלה בתאריך {request.requestDate}</InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{request.topic}</Typography>

      {!waitingForMentor && request.offeredSlots.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            הזמנים שהצעת:
          </Typography>
          <Stack spacing={0.25}>
            {request.offeredSlots.map((slot) => (
              <Typography key={slot.id} variant="body2">
                {slot.date} | {slot.startTime}–{slot.endTime}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {waitingForMentor && (
        <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => onOfferSlots(request)}
            disabled={actionLoading}
          >
            קבלה והצעת זמנים
          </Button>
          <Button
            color="error"
            size="small"
            onClick={() => onReject(request)}
            disabled={actionLoading}
          >
            דחיית הבקשה
          </Button>
        </Stack>
      )}
    </CardShell>
  );
}
