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
        <Chip size="small" color="success" label="התקיימה" />
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

function StatusChip({ label }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        bgcolor: queenbColors.pinkPale,
        color: queenbColors.pink,
        fontWeight: 700,
      }}
    />
  );
}

export function MentorPendingRequestCard({
  request,
  actionLoading,
  onReject,
  onOfferSlots,
}) {
  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{request.menteeName}</Typography>
        <StatusChip
          label={request.needsNewSlots ? "נדרשים זמנים חדשים" : "ממתינה לתגובה שלך"}
        />
      </Stack>

      <InfoRow>התקבלה בתאריך {request.requestDate}</InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{request.topic}</Typography>

      {request.needsNewSlots && (
        <>
          <Typography variant="body2" sx={{ color: queenbColors.pink, fontWeight: 700 }}>
            החניכה דחתה את הזמנים שהצעת. יש להציע זמנים חדשים.
          </Typography>
          {request.offeredSlots.length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                הזמנים שלא התאימו:
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
        </>
      )}

      <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => onOfferSlots(request)}
          disabled={actionLoading}
        >
          {request.needsNewSlots ? "הצעת זמנים חדשים" : "קבלה והצעת זמנים"}
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
    </CardShell>
  );
}

export function MentorMonthlyBlockCard({ notice }) {
  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{notice.menteeName}</Typography>
        <StatusChip label="חסום עד סוף החודש" />
      </Stack>
      <Typography sx={{ fontWeight: 600 }}>{notice.topic}</Typography>
      <Typography variant="body2" sx={{ color: queenbColors.pink, fontWeight: 700 }}>
        החניכה דחתה גם את סבב הזמנים השני. לא ניתן לקבוע פגישה נוספת איתה עד סוף החודש.
      </Typography>
      {notice.offeredSlots.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            הזמנים שנדחו:
          </Typography>
          <Stack spacing={0.25}>
            {notice.offeredSlots.map((slot) => (
              <Typography key={slot.id} variant="body2">
                {slot.date} | {slot.startTime}–{slot.endTime}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
    </CardShell>
  );
}

export function MentorOfferedSlotsCard({ request }) {
  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{request.menteeName}</Typography>
        <StatusChip label="ממתינה לבחירת החניכה" />
      </Stack>

      <InfoRow>התקבלה בתאריך {request.requestDate}</InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{request.topic}</Typography>

      {request.offeredSlots.length > 0 && (
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
    </CardShell>
  );
}
