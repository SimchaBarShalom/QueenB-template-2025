import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { queenbColors } from "../theme";
import { AppSurface } from "./AppPrimitives";
import { useLanguage } from "../i18n/LanguageContext";

// Four status-specific meeting cards for MenteeMeetingsPage. Kept in one
// file since they share the same card shell and are only ever used
// together on that page.

function CardShell({ children }) {
  return (
    <AppSurface sx={{ p: 2 }}>
      <Stack spacing={1.2}>{children}</Stack>
    </AppSurface>
  );
}

function InfoRow({ children }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  );
}

export function CompletedMeetingCard({ meeting, loading, onConfirm, onAddFeedback }) {
  const { t } = useLanguage();
  return (
    <CardShell>
      <Typography variant="h6" component="h3">
        {meeting.mentorName}
      </Typography>
      <InfoRow>
        {t("meetings.durationRow", { date: meeting.date, time: meeting.time, minutes: meeting.durationMinutes })}
      </InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{meeting.topic}</Typography>

      {meeting.needsConfirmation ? (
        <Stack direction="row" spacing={1.5} sx={{ mt: 1, pt: 1.5, borderTop: "1px solid #f6d3e0" }}>
          <Button
            size="small"
            variant="contained"
            disabled={loading}
            onClick={() => onConfirm(meeting, true)}
            sx={{ borderRadius: 999 }}
          >
            {t("meetings.occurred")}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={loading}
            onClick={() => onConfirm(meeting, false)}
            sx={{ borderRadius: 999 }}
          >
            {t("meetings.didNotOccur")}
          </Button>
        </Stack>
      ) : (
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
                {t("meetings.feedbackSubmitted")}
              </Typography>
            </Stack>
          ) : (
            <>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                <Typography variant="body2" color="text.secondary">
                  {t("meetings.feedbackPending")}
                </Typography>
              </Stack>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onAddFeedback(meeting)}
                sx={{ borderRadius: 999 }}
              >
                {t("meetings.addFeedback")}
              </Button>
            </>
          )}
        </Stack>
      )}
    </CardShell>
  );
}

export function ScheduledMeetingCard({ meeting, onReschedule, onCancel }) {
  const { t } = useLanguage();
  return (
    <CardShell>
      <Typography variant="h6" component="h3">
        {meeting.mentorName}
      </Typography>
      <InfoRow>
        {meeting.date} | {meeting.startTime} | {meeting.endTime}
      </InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{meeting.topic}</Typography>

      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
        {meeting.meetLink && <Button size="small" variant="contained" component="a" href={meeting.meetLink} target="_blank" rel="noopener noreferrer" sx={{ borderRadius: 999 }}>הצטרפות ל-Google Meet</Button>}
        <Button size="small" variant="outlined" onClick={() => onReschedule(meeting)} sx={{ borderRadius: 999 }}>
          {t("meetings.reschedule")}
        </Button>
        <Button
          size="small"
          variant="text"
          color="error"
          onClick={() => onCancel(meeting)}
          sx={{ borderRadius: 999 }}
        >
          {t("meetings.cancelMeeting")}
        </Button>
      </Stack>
    </CardShell>
  );
}

export function PendingSlotsMeetingCard({ request, onCancel }) {
  const { t } = useLanguage();
  return (
    <CardShell>
      <Typography variant="h6" component="h3">
        {request.mentorName}
      </Typography>
      <InfoRow>{t("meetings.requestDate", { date: request.requestDate })}</InfoRow>
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
        {t("meetings.waitingForSlots")}
      </Box>

      <Button
        size="small"
        variant="text"
        color="error"
        onClick={() => onCancel(request)}
        sx={{ borderRadius: 999, alignSelf: "flex-start" }}
      >
        {t("meetings.cancelRequest")}
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
  const { t } = useLanguage();
  return (
    <CardShell>
      <Typography variant="h6" component="h3">
        {request.mentorName}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{request.topic}</Typography>
      <InfoRow>
        {t("meetings.requestAndResponse", { requestDate: request.requestDate, respondedDate: request.respondedDate })}
      </InfoRow>

      <Stack direction="row" spacing={1.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="contained"
          onClick={() => onChooseTime(request)}
          sx={{ borderRadius: 999 }}
        >
          {t("meetings.chooseTime")}
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onTimesDontWork(request)}
          sx={{ borderRadius: 999 }}
        >
          {request.extraSlotsUsed ? t("meetings.timesDontWork") : t("meetings.requestNewTimes")}
        </Button>
        <Button
          size="small"
          variant="text"
          color="error"
          onClick={() => onCancel(request)}
          sx={{ borderRadius: 999 }}
        >
          {t("meetings.cancelRequest")}
        </Button>
      </Stack>
    </CardShell>
  );
}
