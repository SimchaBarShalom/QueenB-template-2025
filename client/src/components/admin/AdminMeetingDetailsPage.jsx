import React, { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Alert, Button, Chip, Divider, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import apiClient from "../../api/client";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminLayout from "./AdminLayout";
import { AdminError, AdminLoading } from "./AdminState";
import { formatDateTime, getMeetingStatusColor, meetingStatusLabel, requestStatusLabel } from "./adminFormatters";
import { useLanguage } from "../../i18n/LanguageContext";

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function AdminMeetingDetailsPage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scheduleForm, setScheduleForm] = useState({ scheduledStart: "", scheduledEnd: "" });
  const [pendingAction, setPendingAction] = useState(null);

  async function loadMeeting() {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(`/api/admin/meetings/${id}`);
      setMeeting(response.data);
      setScheduleForm({
        scheduledStart: toDateTimeLocalValue(response.data.scheduledStart),
        scheduledEnd: toDateTimeLocalValue(response.data.scheduledEnd),
      });
    } catch (requestError) {
      console.error(requestError);
      setError(t("errors.loadMeeting"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (status) => {
    try {
      setError("");
      setSuccess("");
      const response = await apiClient.patch(`/api/admin/meetings/${id}/status`, { status });
      setMeeting(response.data);
      setSuccess(t("admin.meetings.statusUpdated"));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || t("errors.updateMeetingStatus"));
    }
  };

  const updateSchedule = async (event) => {
    event.preventDefault();
    try {
      setSavingSchedule(true);
      setError("");
      setSuccess("");
      const response = await apiClient.patch(`/api/admin/meetings/${id}/schedule`, {
        scheduledStart: new Date(scheduleForm.scheduledStart).toISOString(),
        scheduledEnd: new Date(scheduleForm.scheduledEnd).toISOString(),
      });
      setMeeting(response.data);
      setScheduleForm({
        scheduledStart: toDateTimeLocalValue(response.data.scheduledStart),
        scheduledEnd: toDateTimeLocalValue(response.data.scheduledEnd),
      });
      setSuccess(t("admin.meetings.scheduleUpdated"));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || t("errors.updateSchedule"));
    } finally {
      setSavingSchedule(false);
    }
  };

  const cancelRequest = async () => {
    try {
      setError("");
      setSuccess("");
      await apiClient.patch(`/api/admin/requests/${meeting.requestId}/cancel`);
      await loadMeeting();
      setSuccess(t("admin.meetings.requestCancelled"));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || t("errors.cancelRequest"));
    }
  };

  const requestStatusUpdate = (status) => {
    const confirmations = {
      NOT_COMPLETED: {
        title: t("admin.meetings.confirmNotCompletedTitle"),
        description: t("admin.meetings.confirmNotCompletedDetailsBody"),
        confirmLabel: t("admin.meetings.confirmNotCompletedAction"),
        confirmColor: "warning",
        run: () => updateStatus("NOT_COMPLETED"),
      },
      CANCELLED: {
        title: t("admin.meetings.confirmCancelTitle"),
        description: t("admin.meetings.confirmCancelDetailsBody"),
        confirmLabel: t("admin.meetings.confirmCancelAction"),
        confirmColor: "error",
        run: () => updateStatus("CANCELLED"),
      },
    };

    if (!confirmations[status]) {
      updateStatus(status);
      return;
    }

    setPendingAction(confirmations[status]);
  };

  const requestCancelRequest = () => {
    setPendingAction({
      title: t("admin.meetings.confirmCancelRequestTitle"),
      description: t("admin.meetings.confirmCancelRequestBody"),
      confirmLabel: t("admin.meetings.confirmCancelRequestAction"),
      confirmColor: "error",
      run: cancelRequest,
    });
  };

  const confirmPendingAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action?.run) {
      await action.run();
    }
  };

  if (loading) return <AdminLoading />;

  const canEditSchedule =
    meeting &&
    ["SCHEDULED", "ATTENDANCE_CONFIRMED"].includes(meeting.status) &&
    new Date(meeting.scheduledEnd) > new Date();

  return (
    <AdminLayout>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          {t("admin.meetings.detailsTitle")}
        </Typography>
        <Button component={RouterLink} to="/admin/meetings">
          {t("admin.meetings.backToMeetings")}
        </Button>
      </Stack>
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {meeting && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Chip sx={{ alignSelf: "flex-start" }} label={meetingStatusLabel(meeting.status, t)} color={getMeetingStatusColor(meeting.status)} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatDateTime(meeting.scheduledStart, language)} - {formatDateTime(meeting.scheduledEnd, language)}
                </Typography>
                <Typography>{t("admin.meetings.mentorLine", { name: meeting.mentor.fullName, email: meeting.mentor.email })}</Typography>
                <Typography>{t("admin.meetings.menteeLine", { name: meeting.mentee.fullName, email: meeting.mentee.email })}</Typography>
                <Typography>{t("admin.meetings.requestStatus", { status: requestStatusLabel(meeting.requestStatus, t) })}</Typography>
                <Divider />
                <Paper component="form" onSubmit={updateSchedule} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography sx={{ mb: 2, fontWeight: 700 }}>{t("admin.meetings.editSchedule")}</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      type="datetime-local"
                      label={t("admin.meetings.start")}
                      value={scheduleForm.scheduledStart}
                      onChange={(event) => setScheduleForm((current) => ({ ...current, scheduledStart: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      disabled={!canEditSchedule}
                      fullWidth
                    />
                    <TextField
                      type="datetime-local"
                      label={t("admin.meetings.end")}
                      value={scheduleForm.scheduledEnd}
                      onChange={(event) => setScheduleForm((current) => ({ ...current, scheduledEnd: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      disabled={!canEditSchedule}
                      fullWidth
                    />
                    <Button type="submit" variant="contained" disabled={!canEditSchedule || savingSchedule}>
                      {t("common.save")}
                    </Button>
                  </Stack>
                  {!canEditSchedule && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t("admin.meetings.scheduleLocked")}
                    </Typography>
                  )}
                </Paper>
                <Divider />
                <Typography sx={{ fontWeight: 700 }}>{t("admin.meetings.feedbackTitle")}</Typography>
                <Typography color="text.secondary">
                  {t("admin.meetings.feedbackHidden", { count: meeting.feedbackStatus.count })}
                </Typography>
                <Divider />
                <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                  <Button variant="contained" disabled={meeting.status === "COMPLETED"} onClick={() => requestStatusUpdate("COMPLETED")}>
                    {t("admin.meetings.markCompletedOne")}
                  </Button>
                  <Button variant="outlined" disabled={meeting.status === "NOT_COMPLETED"} onClick={() => requestStatusUpdate("NOT_COMPLETED")}>
                    {t("admin.meetings.markNotCompletedOne")}
                  </Button>
                  <Button variant="outlined" color="error" disabled={meeting.status === "CANCELLED"} onClick={() => requestStatusUpdate("CANCELLED")}>
                    {t("admin.meetings.cancelMeeting")}
                  </Button>
                  <Button variant="outlined" color="error" disabled={meeting.requestStatus === "CANCELLED"} onClick={requestCancelRequest}>
                    {t("admin.meetings.cancelRequest")}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title || ""}
        description={pendingAction?.description || ""}
        confirmLabel={pendingAction?.confirmLabel || t("common.confirm")}
        confirmColor={pendingAction?.confirmColor || "primary"}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </AdminLayout>
  );
}

export default AdminMeetingDetailsPage;
