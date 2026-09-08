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
import { alertTypeLabel, formatDateTime } from "./adminFormatters";
import { useLanguage } from "../../i18n/LanguageContext";

const ALERT_TYPES = ["NO_SHOW", "MISSING_FEEDBACK", "STALE_REQUEST", "PAST_PENDING_MEETING", "MENTOR_LOAD"];
const PRIORITY_KEYS = ["low", "normal", "high", "urgent"];
const PRIORITY_LABEL_KEYS = {
  low: "admin.alerts.priorityLow",
  normal: "admin.alerts.priorityNormal",
  high: "admin.alerts.priorityHigh",
  urgent: "admin.alerts.priorityUrgent",
};

function getAlertMeetingLink(alert) {
  if (alert.type === "MISSING_FEEDBACK") return "/admin/meetings?missingFeedback=true";
  if (alert.type === "NO_SHOW") return "/admin/meetings?noShow=true";
  if (alert.links?.meetingId) return `/admin/meetings/${alert.links.meetingId}`;
  return "/admin/meetings";
}

function AdminAlertsPage() {
  const { t, language } = useLanguage();
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
      setError(t("errors.loadAlerts"));
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
      setSuccess(resolved ? t("admin.alerts.markedResolved") : t("admin.alerts.reopened"));
    } catch (requestError) {
      console.error(requestError);
      setError(t("errors.updateAlert"));
    }
  };

  const updateMetadata = async (alert, patch) => {
    try {
      setError("");
      setSuccess("");
      await apiClient.patch(`/api/admin/alerts/${encodeURIComponent(alert.key)}/metadata`, patch);
      await loadAlerts(filters);
      setSuccess(t("admin.alerts.queueUpdated"));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || t("errors.updateQueue"));
    }
  };

  const toggleSelected = (key) => {
    setSelectedKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const requestBulkAlerts = async (action) => {
    try {
      const preview = await apiClient.post("/api/admin/alerts/bulk", { alertKeys: selectedKeys, action, preview: true });
      setPendingAction({
        title: action === "resolve" ? t("admin.alerts.confirmResolveTitle") : t("admin.alerts.confirmReopenTitle"),
        description: t("admin.alerts.bulkBody", { eligible: preview.data.eligibleCount, skipped: preview.data.skipped.length }),
        confirmLabel: action === "resolve" ? t("admin.alerts.markResolvedBulk") : t("admin.alerts.reopenBulk"),
        run: async () => {
          const response = await apiClient.post("/api/admin/alerts/bulk", { alertKeys: selectedKeys, action });
          setSuccess(t("admin.alerts.bulkSuccess", { updated: response.data.updatedCount, skipped: response.data.skipped.length }));
          await loadAlerts(filters);
        },
      });
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || t("errors.bulkPrepare"));
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
      <AdminPageHeader title={t("admin.alerts.title")} subtitle={t("admin.alerts.subtitle")} breadcrumbs={[{ label: t("admin.alerts.breadcrumb") }]} />
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <AdminSurface sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t("admin.alerts.type")}</InputLabel>
            <Select label={t("admin.alerts.type")} value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
              <MenuItem value="">{t("admin.all")}</MenuItem>
              {ALERT_TYPES.map((value) => (
                <MenuItem key={value} value={value}>
                  {alertTypeLabel(value, t)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t("admin.alerts.state")}</InputLabel>
            <Select label={t("admin.alerts.state")} value={filters.resolved} onChange={(event) => setFilters((current) => ({ ...current, resolved: event.target.value }))}>
              <MenuItem value="unresolved">{t("admin.alerts.open")}</MenuItem>
              <MenuItem value="resolved">{t("admin.alerts.resolved")}</MenuItem>
              <MenuItem value="">{t("admin.all")}</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={applyFilters}>
            {t("common.filter")}
          </Button>
        </Stack>
      </AdminSurface>

      {selectedKeys.length > 0 && (
        <AdminSurface sx={{ p: 1.5, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Typography sx={{ fontWeight: 700 }}>{t("admin.alerts.selectedCount", { count: selectedKeys.length })}</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => requestBulkAlerts("resolve")}>{t("admin.alerts.markResolvedBulk")}</Button>
              <Button size="small" variant="outlined" onClick={() => requestBulkAlerts("reopen")}>{t("admin.alerts.reopenBulk")}</Button>
            </Stack>
          </Stack>
        </AdminSurface>
      )}

      {alerts.length === 0 ? (
        <AdminEmpty title={t("admin.alerts.emptyTitle")} subtitle={t("admin.alerts.emptySubtitle")} />
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
                    <Chip label={alertTypeLabel(alert.type, t)} color={alert.resolved ? "default" : "primary"} size="small" sx={{ fontWeight: 700 }} />
                    <AdminStatusBadge label={t(PRIORITY_LABEL_KEYS[alert.priority] || PRIORITY_LABEL_KEYS.normal)} tone={alert.priority} />
                    <Chip label={alert.resolved ? t("admin.alerts.resolvedChip") : t("admin.alerts.openChip")} size="small" variant={alert.resolved ? "outlined" : "filled"} color={alert.resolved ? "default" : "warning"} sx={{ fontWeight: 700 }} />
                    <Typography sx={{ fontWeight: 800, lineHeight: 1.35 }}>{alert.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary" variant="body2" sx={{ maxWidth: 840 }}>{alert.description}</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} color="text.secondary" flexWrap="wrap" rowGap={0.5}>
                    <Typography variant="body2">{t("admin.alerts.source", { value: formatDateTime(alert.materializedAt, language) })}</Typography>
                    <Typography variant="body2">{t("admin.alerts.assignee", { name: alert.assignedAdminName || t("admin.alerts.unassigned") })}</Typography>
                    {alert.resolved && (
                      <Typography variant="body2">
                        {t("admin.alerts.resolvedBy", {
                          name: alert.resolvedByName || t("admin.alerts.defaultResolver"),
                          when: formatDateTime(alert.resolvedAt, language),
                        })}
                      </Typography>
                    )}
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "150px 180px minmax(220px, 1fr)" }, gap: 1 }}>
                    <FormControl size="small">
                      <InputLabel>{t("admin.alerts.priority")}</InputLabel>
                      <Select label={t("admin.alerts.priority")} value={alert.priority || "normal"} onChange={(event) => updateMetadata(alert, { priority: event.target.value })}>
                        {PRIORITY_KEYS.map((value) => (
                          <MenuItem key={value} value={value}>{t(PRIORITY_LABEL_KEYS[value])}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small">
                      <InputLabel>{t("admin.alerts.assigneeLabel")}</InputLabel>
                      <Select label={t("admin.alerts.assigneeLabel")} value={alert.assignedAdminId || ""} onChange={(event) => updateMetadata(alert, { assignedAdminId: event.target.value || null })}>
                        <MenuItem value="">{t("admin.alerts.noAssignee")}</MenuItem>
                        {assignees.map((admin) => <MenuItem key={admin.id} value={admin.id}>{admin.fullName}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField size="small" label={t("admin.alerts.note")} defaultValue={alert.notes || ""} onBlur={(event) => event.target.value !== (alert.notes || "") && updateMetadata(alert, { notes: event.target.value })} />
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent={{ xs: "flex-start", lg: "flex-end" }} sx={{ flexShrink: 0 }}>
                  <Button component={RouterLink} to={getAlertMeetingLink(alert)} size="small">
                    {t("admin.alerts.viewMeeting")}
                  </Button>
                  {alert.resolved ? (
                    <Button size="small" onClick={() => setResolved(alert, false)}>
                      {t("admin.alerts.reopen")}
                    </Button>
                  ) : (
                    <Button variant="contained" size="small" onClick={() => setResolved(alert, true)}>
                      {t("admin.alerts.markResolved")}
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
        confirmLabel={pendingAction?.confirmLabel || t("common.confirm")}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
    </AdminLayout>
  );
}

export default AdminAlertsPage;
