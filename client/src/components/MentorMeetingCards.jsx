import React from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { queenbColors } from "../theme";
import { AppSurface, AppStatusBadge } from "./AppPrimitives";
import { useLanguage } from "../i18n/LanguageContext";

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

export function MentorPastMeetingCard({ meeting, loading, onConfirm, onFeedback }) {
  const { t } = useLanguage();

  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{meeting.menteeName}</Typography>
        <Chip
          size="small"
          color={meeting.needsConfirmation ? "default" : "success"}
          label={meeting.needsConfirmation ? t("meetings.waitingConfirmation") : t("meetings.occurred")}
        />
      </Stack>
      <InfoRow>
        {meeting.date} | {meeting.startTime}–{meeting.endTime}
      </InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{meeting.topic}</Typography>
      {meeting.needsConfirmation ? (
        <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
          <Button
            variant="contained"
            size="small"
            disabled={loading}
            onClick={() => onConfirm(meeting, true)}
          >
            {t("meetings.occurred")}
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={loading}
            onClick={() => onConfirm(meeting, false)}
          >
            {t("meetings.didNotOccur")}
          </Button>
        </Stack>
      ) : meeting.feedbackSubmitted ? (
        <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
          {t("meetings.feedbackSubmitted")}
        </Typography>
      ) : (
        <Button
          size="small"
          variant="outlined"
          onClick={() => onFeedback(meeting)}
          sx={{ alignSelf: "flex-start" }}
        >
          {t("meetings.addFeedback")}
        </Button>
      )}
    </CardShell>
  );
}

export function MentorUpcomingMeetingCard({ meeting, onReschedule }) {
  const { t } = useLanguage();

  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{meeting.menteeName}</Typography>
        <Chip size="small" color="primary" variant="outlined" label={t("meetings.upcomingChip")} />
      </Stack>
      <InfoRow>
        {meeting.date} | {meeting.startTime}–{meeting.endTime}
      </InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{meeting.topic}</Typography>
      {!meeting.rescheduleUsed && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => onReschedule(meeting)}
          sx={{ alignSelf: "flex-start" }}
        >
          {t("meetings.reschedule")}
        </Button>
      )}
    </CardShell>
  );
}

function StatusChip({ label }) {
  return (
    <AppStatusBadge label={label} />
  );
}

export function MentorPendingRequestCard({
  request,
  actionLoading,
  onReject,
  onOfferSlots,
}) {
  const { t } = useLanguage();

  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{request.menteeName}</Typography>
        <StatusChip
          label={request.needsNewSlots ? t("meetings.needsNewSlots") : t("meetings.waitingYourReply")}
        />
      </Stack>

      <InfoRow>{t("meetings.receivedOn", { date: request.requestDate })}</InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{request.topic}</Typography>

      {request.needsNewSlots && (
        <>
          <Typography variant="body2" sx={{ color: queenbColors.pink, fontWeight: 700 }}>
            {t("meetings.menteeRejectedSlots")}
          </Typography>
          {request.offeredSlots.length > 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t("meetings.slotsThatDidNotFit")}
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
          {request.needsNewSlots ? t("meetings.offerNewSlots") : t("meetings.acceptAndOffer")}
        </Button>
        <Button
          color="error"
          size="small"
          onClick={() => onReject(request)}
          disabled={actionLoading}
        >
          {t("meetings.rejectRequest")}
        </Button>
      </Stack>
    </CardShell>
  );
}

export function MentorMonthlyBlockCard({ notice }) {
  const { t } = useLanguage();

  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{notice.menteeName}</Typography>
        <StatusChip label={t("meetings.blockedUntilMonthEnd")} />
      </Stack>
      <Typography sx={{ fontWeight: 600 }}>{notice.topic}</Typography>
      <Typography variant="body2" sx={{ color: queenbColors.pink, fontWeight: 700 }}>
        {t("meetings.secondDeclineNotice")}
      </Typography>
      {notice.offeredSlots.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {t("meetings.declinedSlots")}
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
  const { t } = useLanguage();

  return (
    <CardShell>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{request.menteeName}</Typography>
        <StatusChip label={t("meetings.waitingMenteeChoice")} />
      </Stack>

      <InfoRow>{t("meetings.receivedOn", { date: request.requestDate })}</InfoRow>
      <Typography sx={{ fontWeight: 600 }}>{request.topic}</Typography>

      {request.offeredSlots.length > 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {t("meetings.slotsYouOffered")}
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
