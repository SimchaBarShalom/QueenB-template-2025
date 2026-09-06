import React, { useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import apiClient from "../../api/client";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminLayout from "./AdminLayout";
import { AdminEmpty, AdminError, AdminLoading } from "./AdminState";
import { formatDateTime, getMeetingStatusColor, MEETING_STATUS_LABELS } from "./adminFormatters";

const STATUSES = ["SCHEDULED", "ATTENDANCE_CONFIRMED", "COMPLETED", "NOT_COMPLETED", "CANCELLED"];

function AdminMeetingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [meetings, setMeetings] = useState([]);
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    mentorId: searchParams.get("mentorId") || "",
    menteeId: searchParams.get("menteeId") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    missingFeedback: searchParams.get("missingFeedback") === "true",
    noShow: searchParams.get("noShow") === "true",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  async function loadMeetings(nextFilters = filters) {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/admin/meetings", {
        params: {
          status: nextFilters.status || undefined,
          mentorId: nextFilters.mentorId || undefined,
          menteeId: nextFilters.menteeId || undefined,
          startDate: nextFilters.startDate || undefined,
          endDate: nextFilters.endDate || undefined,
          missingFeedback: nextFilters.missingFeedback ? "true" : undefined,
          noShow: nextFilters.noShow ? "true" : undefined,
        },
      });
      setMeetings(response.data);
    } catch (requestError) {
      console.error(requestError);
      setError("לא הצלחנו לטעון פגישות.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeetings(filters);
    // Initial load uses URL/default filter state; filter changes are applied explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const applyFilters = () => {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = String(value);
    });
    setSearchParams(params);
    loadMeetings(filters);
  };

  const updateStatus = async (meeting, status) => {
    try {
      setError("");
      setSuccess("");
      const response = await apiClient.patch(`/api/admin/meetings/${meeting.id}/status`, { status });
      setMeetings((current) => current.map((item) => (item.id === meeting.id ? response.data : item)));
      setSuccess("סטטוס הפגישה עודכן.");
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "עדכון סטטוס הפגישה נכשל.");
    }
  };

  const requestStatusUpdate = (meeting, status) => {
    const confirmations = {
      NOT_COMPLETED: {
        title: "לסמן שהפגישה לא התקיימה?",
        description: `הפגישה של ${meeting.mentor.fullName} ו-${meeting.mentee.fullName} תיסגר כלא הושלמה.`,
        confirmLabel: "סימון כלא הושלמה",
        confirmColor: "warning",
      },
      CANCELLED: {
        title: "לבטל את הפגישה?",
        description: `הפגישה של ${meeting.mentor.fullName} ו-${meeting.mentee.fullName} תבוטל.`,
        confirmLabel: "ביטול פגישה",
        confirmColor: "error",
      },
    };

    if (!confirmations[status]) {
      updateStatus(meeting, status);
      return;
    }

    setPendingAction({
      ...confirmations[status],
      run: () => updateStatus(meeting, status),
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

  return (
    <AdminLayout>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 800 }}>
        פגישות
      </Typography>
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap" rowGap={2}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>סטטוס</InputLabel>
            <Select label="סטטוס" value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
              <MenuItem value="">הכול</MenuItem>
              {STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {MEETING_STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="מזהה מנטורית" value={filters.mentorId} onChange={(event) => setFilter("mentorId", event.target.value)} />
          <TextField label="מזהה חניכה" value={filters.menteeId} onChange={(event) => setFilter("menteeId", event.target.value)} />
          <TextField type="date" label="מתאריך" InputLabelProps={{ shrink: true }} value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} />
          <TextField type="date" label="עד תאריך" InputLabelProps={{ shrink: true }} value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">חסר פידבק</Typography>
            <Switch checked={filters.missingFeedback} onChange={(event) => setFilter("missingFeedback", event.target.checked)} />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2">אי הגעה</Typography>
            <Switch checked={filters.noShow} onChange={(event) => setFilter("noShow", event.target.checked)} />
          </Stack>
          <Button variant="contained" onClick={applyFilters}>
            סינון
          </Button>
        </Stack>
      </Paper>

      {meetings.length === 0 ? (
        <AdminEmpty title="אין פגישות להצגה" subtitle="נסי לשנות את הסינון." />
      ) : (
        <Paper sx={{ borderRadius: 2, overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>מועד</TableCell>
                <TableCell>מנטורית</TableCell>
                <TableCell>חניכה</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell>פידבק</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell>{formatDateTime(meeting.scheduledStart)}</TableCell>
                  <TableCell>{meeting.mentor.fullName}</TableCell>
                  <TableCell>{meeting.mentee.fullName}</TableCell>
                  <TableCell>
                    <Chip label={MEETING_STATUS_LABELS[meeting.status] || meeting.status} color={getMeetingStatusColor(meeting.status)} size="small" />
                  </TableCell>
                  <TableCell>{meeting.feedbackStatus.count}/2</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button component={RouterLink} to={`/admin/meetings/${meeting.id}`} size="small">
                        פרטים
                      </Button>
                      <Button size="small" disabled={meeting.status === "COMPLETED"} onClick={() => requestStatusUpdate(meeting, "COMPLETED")}>
                        הושלמה
                      </Button>
                      <Button size="small" disabled={meeting.status === "NOT_COMPLETED"} onClick={() => requestStatusUpdate(meeting, "NOT_COMPLETED")}>
                        לא הושלמה
                      </Button>
                      <Button size="small" color="error" disabled={meeting.status === "CANCELLED"} onClick={() => requestStatusUpdate(meeting, "CANCELLED")}>
                        ביטול
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
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

export default AdminMeetingsPage;
