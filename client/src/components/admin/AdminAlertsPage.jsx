import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  Typography,
} from "@mui/material";
import apiClient from "../../api/client";
import AdminLayout from "./AdminLayout";
import { AdminEmpty, AdminError, AdminLoading } from "./AdminState";
import { ALERT_TYPE_LABELS, formatDateTime } from "./adminFormatters";

function getAlertMeetingLink(alert) {
  if (alert.type === "MISSING_FEEDBACK") return "/admin/meetings?missingFeedback=true";
  if (alert.type === "NO_SHOW") return "/admin/meetings?noShow=true";
  if (alert.links?.meetingId) return `/admin/meetings/${alert.links.meetingId}`;
  return "/admin/meetings";
}

function AdminAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({ type: "", resolved: "unresolved" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAlerts(nextFilters = filters) {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/admin/alerts", {
        params: {
          type: nextFilters.type || undefined,
          resolved: nextFilters.resolved || undefined,
        },
      });
      setAlerts(response.data);
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

  if (loading) return <AdminLoading />;

  return (
    <AdminLayout>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 800 }}>
        התראות תפעוליות
      </Typography>
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
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
      </Paper>

      {alerts.length === 0 ? (
        <AdminEmpty title="אין התראות להצגה" subtitle="אפשר להציג גם התראות שטופלו דרך הסינון." />
      ) : (
        <Stack spacing={2}>
          {alerts.map((alert) => (
            <Paper key={alert.key} sx={{ p: 2.5, borderRadius: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
                    <Chip label={ALERT_TYPE_LABELS[alert.type] || alert.type} color={alert.resolved ? "default" : "primary"} size="small" />
                    <Typography sx={{ fontWeight: 800 }}>{alert.title}</Typography>
                  </Stack>
                  <Typography color="text.secondary">{alert.description}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    עודכן: {formatDateTime(alert.materializedAt)}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button component={RouterLink} to={getAlertMeetingLink(alert)} size="small">
                    מעבר
                  </Button>
                  {alert.resolved ? (
                    <Button size="small" onClick={() => setResolved(alert, false)}>
                      פתיחה מחדש
                    </Button>
                  ) : (
                    <Button variant="contained" size="small" onClick={() => setResolved(alert, true)}>
                      טופל
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </AdminLayout>
  );
}

export default AdminAlertsPage;
