import React, { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Alert, Button, Chip, Divider, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import apiClient from "../../api/client";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminLayout from "./AdminLayout";
import { AdminError, AdminLoading } from "./AdminState";
import { formatDateTime, getMeetingStatusColor, MEETING_STATUS_LABELS, REQUEST_STATUS_LABELS } from "./adminFormatters";

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function AdminMeetingDetailsPage() {
  const { id } = useParams();
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
      setError("לא הצלחנו לטעון את פרטי הפגישה.");
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
      setSuccess("סטטוס הפגישה עודכן.");
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "עדכון סטטוס הפגישה נכשל.");
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
      setSuccess("מועד הפגישה עודכן.");
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "עדכון מועד הפגישה נכשל.");
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
      setSuccess("הבקשה והפגישות הפעילות שלה בוטלו.");
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "ביטול הבקשה נכשל.");
    }
  };

  const requestStatusUpdate = (status) => {
    const confirmations = {
      NOT_COMPLETED: {
        title: "לסמן שהפגישה לא התקיימה?",
        description: "הפגישה תיסגר כלא הושלמה וגם סטטוס הבקשה יעודכן.",
        confirmLabel: "סימון כלא הושלמה",
        confirmColor: "warning",
        run: () => updateStatus("NOT_COMPLETED"),
      },
      CANCELLED: {
        title: "לבטל את הפגישה?",
        description: "הפגישה תבוטל. אם אין פגישות פעילות נוספות לבקשה, גם הבקשה תבוטל.",
        confirmLabel: "ביטול פגישה",
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
      title: "לבטל את הבקשה?",
      description: "הבקשה וכל הפגישות הפעילות שלה יבוטלו. פגישות היסטוריות יישארו ללא שינוי.",
      confirmLabel: "ביטול בקשה",
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
          פרטי פגישה
        </Typography>
        <Button component={RouterLink} to="/admin/meetings">
          חזרה לפגישות
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
                <Chip sx={{ alignSelf: "flex-start" }} label={MEETING_STATUS_LABELS[meeting.status] || meeting.status} color={getMeetingStatusColor(meeting.status)} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatDateTime(meeting.scheduledStart)} - {formatDateTime(meeting.scheduledEnd)}
                </Typography>
                <Typography>מנטורית: {meeting.mentor.fullName} ({meeting.mentor.email})</Typography>
                <Typography>מנטית: {meeting.mentee.fullName} ({meeting.mentee.email})</Typography>
                <Typography>סטטוס בקשה: {REQUEST_STATUS_LABELS[meeting.requestStatus] || meeting.requestStatus}</Typography>
                <Divider />
                <Paper component="form" onSubmit={updateSchedule} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography sx={{ mb: 2, fontWeight: 700 }}>עריכת מועד</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      type="datetime-local"
                      label="התחלה"
                      value={scheduleForm.scheduledStart}
                      onChange={(event) => setScheduleForm((current) => ({ ...current, scheduledStart: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      disabled={!canEditSchedule}
                      fullWidth
                    />
                    <TextField
                      type="datetime-local"
                      label="סיום"
                      value={scheduleForm.scheduledEnd}
                      onChange={(event) => setScheduleForm((current) => ({ ...current, scheduledEnd: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      disabled={!canEditSchedule}
                      fullWidth
                    />
                    <Button type="submit" variant="contained" disabled={!canEditSchedule || savingSchedule}>
                      שמירה
                    </Button>
                  </Stack>
                  {!canEditSchedule && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      אפשר לערוך מועד רק לפגישה פעילה ועתידית.
                    </Typography>
                  )}
                </Paper>
                <Divider />
                <Typography sx={{ fontWeight: 700 }}>פידבק</Typography>
                <Typography color="text.secondary">
                  {meeting.feedbackStatus.count}/2 הוגשו. תוכן הפידבק לא מוצג ולא ניתן לעריכה באזור הניהול.
                </Typography>
                <Divider />
                <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                  <Button variant="contained" disabled={meeting.status === "COMPLETED"} onClick={() => requestStatusUpdate("COMPLETED")}>
                    סימון כהושלמה
                  </Button>
                  <Button variant="outlined" disabled={meeting.status === "NOT_COMPLETED"} onClick={() => requestStatusUpdate("NOT_COMPLETED")}>
                    סימון כלא הושלמה
                  </Button>
                  <Button variant="outlined" color="error" disabled={meeting.status === "CANCELLED"} onClick={() => requestStatusUpdate("CANCELLED")}>
                    ביטול פגישה
                  </Button>
                  <Button variant="outlined" color="error" disabled={meeting.requestStatus === "CANCELLED"} onClick={requestCancelRequest}>
                    ביטול בקשה
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
        confirmLabel={pendingAction?.confirmLabel || "אישור"}
        confirmColor={pendingAction?.confirmColor || "primary"}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </AdminLayout>
  );
}

export default AdminMeetingDetailsPage;
