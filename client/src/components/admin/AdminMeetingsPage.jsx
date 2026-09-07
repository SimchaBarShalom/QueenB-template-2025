import React, { useEffect, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
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
import { AdminPageHeader, AdminSurface } from "./AdminPrimitives";
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
  const [selectedIds, setSelectedIds] = useState([]);

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
      setSelectedIds([]);
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

  const toggleSelected = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const requestBulkStatusUpdate = async (status) => {
    try {
      setError("");
      const preview = await apiClient.post("/api/admin/meetings/bulk-status", { meetingIds: selectedIds, status, preview: true });
      setPendingAction({
        title: "עדכון סטטוס באצווה",
        description: `${preview.data.eligibleCount} פגישות יעודכנו ל-${MEETING_STATUS_LABELS[status]}. ${preview.data.skipped.length} ידולגו.`,
        confirmLabel: "עדכון פגישות",
        confirmColor: status === "CANCELLED" ? "error" : status === "NOT_COMPLETED" ? "warning" : "primary",
        run: async () => {
          const response = await apiClient.post("/api/admin/meetings/bulk-status", { meetingIds: selectedIds, status });
          setSuccess(`${response.data.updatedCount} פגישות עודכנו. ${response.data.skipped.length} דולגו.`);
          await loadMeetings(filters);
        },
      });
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "הכנת פעולת האצווה נכשלה.");
    }
  };

  if (loading) return <AdminLoading />;

  return (
    <AdminLayout>
      <AdminPageHeader title="פגישות" subtitle="איתור פגישות בעייתיות, עדכון סטטוסים וכניסה מהירה לפרטי פגישה." breadcrumbs={[{ label: "פגישות" }]} />
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <AdminSurface sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1} alignItems={{ lg: "center" }} sx={{ "& .MuiInputBase-root": { fontSize: "0.875rem" } }}>
          <FormControl size="small" sx={{ minWidth: 130, flexShrink: 0 }}>
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
          <TextField size="small" label="חיפוש מנטורית" value={filters.mentorId} onChange={(event) => setFilter("mentorId", event.target.value)} sx={{ width: 145, flexShrink: 0 }} />
          <TextField size="small" label="חיפוש מנטית" value={filters.menteeId} onChange={(event) => setFilter("menteeId", event.target.value)} sx={{ width: 135, flexShrink: 0 }} />
          <TextField size="small" type="date" label="מתאריך" InputLabelProps={{ shrink: true }} value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} sx={{ width: 135, flexShrink: 0 }} />
          <TextField size="small" type="date" label="עד תאריך" InputLabelProps={{ shrink: true }} value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} sx={{ width: 135, flexShrink: 0 }} />
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
            <Typography variant="body2">חסר פידבק</Typography>
            <Switch checked={filters.missingFeedback} onChange={(event) => setFilter("missingFeedback", event.target.checked)} />
          </Stack>
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
            <Typography variant="body2">אי הגעה</Typography>
            <Switch checked={filters.noShow} onChange={(event) => setFilter("noShow", event.target.checked)} />
          </Stack>
          <Button variant="contained" onClick={applyFilters}>
            סינון
          </Button>
        </Stack>
      </AdminSurface>

      {selectedIds.length > 0 && (
        <AdminSurface sx={{ p: 1.5, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Typography sx={{ fontWeight: 700 }}>{selectedIds.length} פגישות נבחרו</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              <Button size="small" variant="outlined" onClick={() => requestBulkStatusUpdate("COMPLETED")}>סימון כהושלמו</Button>
              <Button size="small" variant="outlined" color="warning" onClick={() => requestBulkStatusUpdate("NOT_COMPLETED")}>סימון כלא הושלמו</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => requestBulkStatusUpdate("CANCELLED")}>ביטול</Button>
            </Stack>
          </Stack>
        </AdminSurface>
      )}

      {meetings.length === 0 ? (
        <AdminEmpty title="אין פגישות להצגה" subtitle="נסי לשנות את הסינון." />
      ) : (
        <>
        <AdminSurface sx={{ overflowX: "auto", display: { xs: "none", md: "block" } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>מועד</TableCell>
                <TableCell>מנטורית</TableCell>
                <TableCell>מנטית</TableCell>
                <TableCell>סטטוס</TableCell>
                <TableCell>פידבק</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.includes(meeting.id)} onChange={() => toggleSelected(meeting.id)} />
                  </TableCell>
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
        </AdminSurface>
        <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
          {meetings.map((meeting) => (
            <AdminSurface key={meeting.id} sx={{ p: 2 }}>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{formatDateTime(meeting.scheduledStart)}</Typography>
                    <Typography variant="body2" color="text.secondary">{meeting.mentor.fullName} / {meeting.mentee.fullName}</Typography>
                  </Box>
                  <Checkbox checked={selectedIds.includes(meeting.id)} onChange={() => toggleSelected(meeting.id)} />
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={MEETING_STATUS_LABELS[meeting.status] || meeting.status} color={getMeetingStatusColor(meeting.status)} size="small" />
                  <Typography variant="body2" color="text.secondary">פידבק {meeting.feedbackStatus.count}/2</Typography>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                  <Button component={RouterLink} to={`/admin/meetings/${meeting.id}`} size="small">פרטים</Button>
                  <Button size="small" disabled={meeting.status === "COMPLETED"} onClick={() => requestStatusUpdate(meeting, "COMPLETED")}>הושלמה</Button>
                  <Button size="small" disabled={meeting.status === "NOT_COMPLETED"} onClick={() => requestStatusUpdate(meeting, "NOT_COMPLETED")}>לא הושלמה</Button>
                  <Button size="small" color="error" disabled={meeting.status === "CANCELLED"} onClick={() => requestStatusUpdate(meeting, "CANCELLED")}>ביטול</Button>
                </Stack>
              </Stack>
            </AdminSurface>
          ))}
        </Stack>
        </>
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
