import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  TextField,
  Typography,
} from "@mui/material";
import apiClient from "../../api/client";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminLayout from "./AdminLayout";
import { AdminPageHeader, AdminStatusBadge, AdminSurface } from "./AdminPrimitives";
import { AdminEmpty, AdminError, AdminLoading } from "./AdminState";
import { ALERT_TYPE_LABELS, formatDateTime } from "./adminFormatters";

const PRIORITY_LABELS = {
  low: "נמוכה",
  normal: "רגילה",
  high: "גבוהה",
  urgent: "דחופה",
};

function getAlertMeetingLink(alert) {
  if (alert.type === "MISSING_FEEDBACK") return "/admin/meetings?missingFeedback=true";
  if (alert.type === "NO_SHOW") return "/admin/meetings?noShow=true";
  if (alert.links?.meetingId) return `/admin/meetings/${alert.links.meetingId}`;
  return "/admin/meetings";
}

function AdminAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({ type: "", resolved: "unresolved" });
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);

  async function loadAlerts(nextFilters = filters) {
    try {
      setLoading(true);
      setError("");
      const [response, assigneesResponse] = await Promise.all([
        apiClient.get("/api/admin/alerts", {
          params: {
            type: nextFilters.type || undefined,
            resolved: nextFilters.resolved || undefined,
          },
        }),
        apiClient.get("/api/admin/assignees"),
      ]);
      setAlerts(response.data);
      setAssignees(assigneesResponse.data);
      setSelectedKeys([]);
    } catch (requestError) {
      console.error(requestError);
      setError("לא הצלחנו לטעון התראות.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts(filters);
    // Initial load uses URL/default filter state; filter changes are applied explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => loadAlerts(filters);

  const setResolved = async (alert, resolved) => {
    try {
      setError("");
      setSuccess("");
      const path = resolved ? "resolve" : "unresolve";
      await apiClient.patch(`/api/admin/alerts/${encodeURIComponent(alert.key)}/${path}`);
      await loadAlerts(filters);
      setSuccess(resolved ? "ההתראה סומנה כטופלה." : "ההתראה נפתחה מחדש.");
    } catch (requestError) {
      console.error(requestError);
      setError("עדכון ההתראה נכשל.");
    }
  };

  const updateMetadata = async (alert, patch) => {
    try {
      setError("");
      setSuccess("");
      await apiClient.patch(`/api/admin/alerts/${encodeURIComponent(alert.key)}/metadata`, patch);
      await loadAlerts(filters);
      setSuccess("פרטי התור עודכנו.");
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "עדכון פרטי התור נכשל.");
    }
  };

  const toggleSelected = (key) => {
    setSelectedKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const requestBulkAlerts = async (action) => {
    try {
      const preview = await apiClient.post("/api/admin/alerts/bulk", { alertKeys: selectedKeys, action, preview: true });
      setPendingAction({
        title: action === "resolve" ? "לסמן התראות כטופלו?" : "לפתוח התראות מחדש?",
        description: `${preview.data.eligibleCount} התראות יעודכנו. ${preview.data.skipped.length} ידולגו.`,
        confirmLabel: action === "resolve" ? "סימון כטופלו" : "פתיחה מחדש",
        run: async () => {
          const response = await apiClient.post("/api/admin/alerts/bulk", { alertKeys: selectedKeys, action });
          setSuccess(`${response.data.updatedCount} התראות עודכנו. ${response.data.skipped.length} דולגו.`);
          await loadAlerts(filters);
        },
      });
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "הכנת פעולת האצווה נכשלה.");
    }
  };

  const confirmPendingAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action?.run) await action.run();
  };

  if (loading) return <AdminLoading />;

  return (
    <AdminLayout>
      <AdminPageHeader title="התראות תפעוליות" subtitle="תור עבודה לפי חומרה, עדיפות, בעלות טיפול והערות פנימיות." breadcrumbs={[{ label: "התראות" }]} />
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <AdminSurface sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>סוג</InputLabel>
            <Select label="סוג" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
              <MenuItem value="">הכול</MenuItem>
              {Object.entries(ALERT_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>מצב</InputLabel>
            <Select label="מצב" value={filters.resolved} onChange={(event) => setFilters((current) => ({ ...current, resolved: event.target.value }))}>
              <MenuItem value="unresolved">פתוחות</MenuItem>
              <MenuItem value="resolved">טופלו</MenuItem>
              <MenuItem value="">הכול</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={applyFilters}>
            סינון
          </Button>
        </Stack>
      </AdminSurface>

      {selectedKeys.length > 0 && (
        <AdminSurface sx={{ p: 1.5, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Typography sx={{ fontWeight: 700 }}>{selectedKeys.length} התראות נבחרו</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => requestBulkAlerts("resolve")}>סימון כטופלו</Button>
              <Button size="small" variant="outlined" onClick={() => requestBulkAlerts("reopen")}>פתיחה מחדש</Button>
            </Stack>
          </Stack>
        </AdminSurface>
      )}

      {alerts.length === 0 ? (
        <AdminEmpty title="אין התראות להצגה" subtitle="אפשר להציג גם התראות שטופלו דרך הסינון." />
      ) : (
        <AdminSurface sx={{ overflow: "hidden" }}>
          {alerts.map((alert) => (
            <Box
              key={alert.key}
              sx={{
                p: { xs: 1.5, md: 2 },
                borderBottom: "1px solid #f3d9e3",
                "&:last-of-type": { borderBottom: 0 },
              }}
            >
              <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} justifyContent="space-between">
                <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={0.75}>
                    <Checkbox checked={selectedKeys.includes(alert.key)} onChange={() => toggleSelected(alert.key)} sx={{ p: 0.25 }} />
                    <Chip label={ALERT_TYPE_LABELS[alert.type] || alert.type} color={alert.resolved ? "default" : "primary"} size="small" sx={{ fontWeight: 700 }} />
                    <AdminStatusBadge label={PRIORITY_LABELS[alert.priority] || alert.priority} tone={alert.priority} />
                    <Chip label={alert.resolved ? "טופלה" : "פתוחה"} size="small" variant={alert.resolved ? "outlined" : "filled"} color={alert.resolved ? "default" : "warning"} sx={{ fontWeight: 700 }} />
                    <Typography sx={{ fontWeight: 800, lineHeight: 1.35 }}>{alert.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary" variant="body2" sx={{ maxWidth: 840 }}>{alert.description}</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} color="text.secondary" flexWrap="wrap" rowGap={0.5}>
                    <Typography variant="body2">מקור: {formatDateTime(alert.materializedAt)}</Typography>
                    <Typography variant="body2">מטפלת: {alert.assignedAdminName || "לא שובצה"}</Typography>
                    {alert.resolved && <Typography variant="body2">טופל על ידי {alert.resolvedByName || "מנהלת"} ב-{formatDateTime(alert.resolvedAt)}</Typography>}
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "150px 180px minmax(220px, 1fr)" }, gap: 1 }}>
                    <FormControl size="small">
                      <InputLabel>עדיפות</InputLabel>
                      <Select label="עדיפות" value={alert.priority || "normal"} onChange={(event) => updateMetadata(alert, { priority: event.target.value })}>
                        {Object.entries(PRIORITY_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControl size="small">
                      <InputLabel>מטפלת</InputLabel>
                      <Select label="מטפלת" value={alert.assignedAdminId || ""} onChange={(event) => updateMetadata(alert, { assignedAdminId: event.target.value || null })}>
                        <MenuItem value="">ללא שיבוץ</MenuItem>
                        {assignees.map((admin) => <MenuItem key={admin.id} value={admin.id}>{admin.fullName}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField size="small" label="הערה" defaultValue={alert.notes || ""} onBlur={(event) => event.target.value !== (alert.notes || "") && updateMetadata(alert, { notes: event.target.value })} />
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent={{ xs: "flex-start", lg: "flex-end" }} sx={{ flexShrink: 0 }}>
                  <Button component={RouterLink} to={getAlertMeetingLink(alert)} size="small">
                    צפייה בפגישה
                  </Button>
                  {alert.resolved ? (
                    <Button size="small" onClick={() => setResolved(alert, false)}>
                      פתיחה מחדש
                    </Button>
                  ) : (
                    <Button variant="contained" size="small" onClick={() => setResolved(alert, true)}>
                      סימון כטופלה
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          ))}
        </AdminSurface>
      )}
      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title || ""}
        description={pendingAction?.description || ""}
        confirmLabel={pendingAction?.confirmLabel || "אישור"}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </AdminLayout>
  );
}

export default AdminAlertsPage;
