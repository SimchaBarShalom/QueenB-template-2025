import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Chip, Grid, MenuItem, Select, Stack, Typography } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import apiClient from "../../api/client";
import AdminLayout from "./AdminLayout";
import { AdminPageHeader, AdminSectionTitle, AdminSurface, AdminStatusBadge } from "./AdminPrimitives";
import { AdminError, AdminLoading } from "./AdminState";
import { ALERT_TYPE_LABELS, formatDateTime, MEETING_STATUS_LABELS } from "./adminFormatters";

const CARDS = [
  { key: "usersCount", label: "משתמשות", action: "ניהול משתמשות", path: "/admin/users", icon: <GroupsIcon /> },
  { key: "activeMentorsCount", label: "מנטוריות פעילות", action: "ניהול מנטוריות", path: "/admin/users?capability=mentor", icon: <GroupsIcon /> },
  { key: "scheduledMeetingsCount", label: "פגישות פעילות", action: "ניהול פגישות", path: "/admin/meetings", icon: <EventAvailableIcon /> },
  { key: "unresolvedAlertsCount", label: "התראות פתוחות", action: "טיפול בהתראות", path: "/admin/alerts", icon: <WarningAmberIcon /> },
];

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        setError("");
        setLoading(true);
        const [summaryResponse, analyticsResponse, alertsResponse, meetingsResponse] = await Promise.all([
          apiClient.get("/api/admin/summary"),
          apiClient.get("/api/admin/analytics", { params: { months } }),
          apiClient.get("/api/admin/alerts", { params: { resolved: "unresolved" } }),
          apiClient.get("/api/admin/meetings"),
        ]);
        setSummary(summaryResponse.data);
        setAnalytics(analyticsResponse.data);
        setAlerts(alertsResponse.data);
        setMeetings(meetingsResponse.data);
      } catch (requestError) {
        console.error(requestError);
        setError("לא הצלחנו לטעון את אזור הניהול.");
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [months]);

  if (loading) return <AdminLoading />;

  return (
    <AdminLayout>
      <AdminPageHeader title="חדר ניהול" subtitle="תמונת מצב יומית לפגישות, בקשות והתראות שמצריכות טיפול." />
      <AdminError message={error} />
      <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
        {CARDS.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.key}>
            <AdminSurface
              component={RouterLink}
              to={card.path}
              sx={{
                p: 2,
                height: "100%",
                display: "block",
                transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
                "&:hover": { borderColor: "#f3a8c4", boxShadow: "0 10px 26px rgba(74, 31, 52, 0.09)", transform: "translateY(-1px)" },
                "&:focus-visible": { outline: "3px solid rgba(230, 49, 122, 0.28)", outlineOffset: 2 },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ color: "primary.main", display: "flex", p: 0.75, borderRadius: 1, bgcolor: "#fff0f6" }}>{card.icon}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography dir="ltr" variant="h4" sx={{ fontWeight: 800, lineHeight: 1, textAlign: "right" }}>
                    {summary?.[card.key] ?? 0}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontWeight: 700, mt: 0.5 }}>{card.label}</Typography>
                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800, mt: 0.75 }}>{card.action}</Typography>
                </Box>
              </Stack>
            </AdminSurface>
          </Grid>
        ))}
      </Grid>
      <OperationsSection alerts={alerts} meetings={meetings} />
      {analytics && <AnalyticsSection analytics={analytics} onMonthsChange={setMonths} />}
    </AdminLayout>
  );
}

function OperationsSection({ alerts, meetings }) {
  const now = new Date();
  const activeMeetings = meetings.filter((meeting) => ["SCHEDULED", "ATTENDANCE_CONFIRMED"].includes(meeting.status));
  const overdue = activeMeetings.filter((meeting) => new Date(meeting.scheduledEnd) < now).slice(0, 5);
  const upcoming = activeMeetings.filter((meeting) => new Date(meeting.scheduledStart) >= now).slice(0, 5);

  return (
    <Grid container spacing={2} sx={{ width: "100%", m: 0, mt: 0.5 }}>
      <Grid item xs={12} lg={4}>
        <AdminSurface sx={{ p: 2, height: "100%" }}>
          <AdminSectionTitle title="התראות פתוחות" subtitle="הפריטים הראשונים בתור הטיפול." />
          <Stack divider={<Box sx={{ borderTop: "1px solid #f3d9e3" }} />}>
            {alerts.slice(0, 5).map((alert) => (
              <Stack key={alert.key} direction="row" justifyContent="space-between" spacing={1.25} sx={{ py: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>{alert.title}</Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" rowGap={0.5} sx={{ mt: 0.5 }}>
                    <AdminStatusBadge label={ALERT_TYPE_LABELS[alert.type] || alert.type} tone={alert.priority || "normal"} />
                    <Typography variant="body2" color="text.secondary">{formatDateTime(alert.materializedAt)}</Typography>
                  </Stack>
                </Box>
                <Button size="small" component={RouterLink} to="/admin/alerts" sx={{ flexShrink: 0 }}>טיפול</Button>
              </Stack>
            ))}
            {!alerts.length && <Typography color="text.secondary" sx={{ py: 1 }}>אין התראות פתוחות.</Typography>}
          </Stack>
        </AdminSurface>
      </Grid>
      <Grid item xs={12} lg={4}>
        <AdminSurface sx={{ p: 2, height: "100%" }}>
          <AdminSectionTitle title="פגישות שעברו" subtitle="פגישות פעילות שצריך לסגור." />
          <Stack divider={<Box sx={{ borderTop: "1px solid #f3d9e3" }} />}>
            {overdue.map((meeting) => <MeetingLine key={meeting.id} meeting={meeting} />)}
            {!overdue.length && <Typography color="text.secondary" sx={{ py: 1 }}>אין פגישות באיחור.</Typography>}
          </Stack>
        </AdminSurface>
      </Grid>
      <Grid item xs={12} lg={4}>
        <AdminSurface sx={{ p: 2, height: "100%" }}>
          <AdminSectionTitle title="פגישות קרובות" subtitle="לוודא שהיומן נראה תקין." />
          <Stack divider={<Box sx={{ borderTop: "1px solid #f3d9e3" }} />}>
            {upcoming.map((meeting) => <MeetingLine key={meeting.id} meeting={meeting} />)}
            {!upcoming.length && <Typography color="text.secondary" sx={{ py: 1 }}>אין פגישות קרובות.</Typography>}
          </Stack>
        </AdminSurface>
      </Grid>
    </Grid>
  );
}

function MeetingLine({ meeting }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={1.25} sx={{ py: 1 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }} noWrap>{meeting.mentor.fullName} / {meeting.mentee.fullName}</Typography>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" rowGap={0.5} sx={{ mt: 0.5 }}>
          <Chip label={MEETING_STATUS_LABELS[meeting.status] || meeting.status} color="default" size="small" sx={{ height: 22, fontWeight: 700 }} />
          <Typography variant="body2" color="text.secondary">{formatDateTime(meeting.scheduledStart)}</Typography>
        </Stack>
      </Box>
      <Button size="small" component={RouterLink} to={`/admin/meetings/${meeting.id}`} sx={{ flexShrink: 0 }}>פרטים</Button>
    </Stack>
  );
}

function AnalyticsSection({ analytics, onMonthsChange }) {
  const maxMonthlyValue = Math.max(...analytics.monthly.map((item) => Math.max(item.meetings, item.requests, item.users)), 1);
  const maxMentorValue = Math.max(...analytics.mentorLoad.map((item) => item.completed), 1);
  const statusTotal = analytics.statusBreakdown.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <Stack spacing={2} sx={{ mt: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>אנליטיקה</Typography>
          <Typography color="text.secondary">פעילות, ביצועי פגישות ועומס מנטוריות</Typography>
        </Box>
        <Select size="small" value={analytics.period.months} onChange={(event) => onMonthsChange(event.target.value)} aria-label="תקופה" sx={{ minWidth: 130 }}>
          <MenuItem value={3}>3 חודשים</MenuItem>
          <MenuItem value={6}>6 חודשים</MenuItem>
          <MenuItem value={12}>12 חודשים</MenuItem>
        </Select>
      </Stack>
      <Grid container spacing={2} sx={{ width: "100%", m: 0 }}>
        <Grid item xs={12} lg={8}>
          <AdminSurface sx={{ p: 2.5, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>מגמת פעילות חודשית</Typography>
            <Box sx={{ display: "flex", alignItems: "stretch", gap: { xs: 1, sm: 2 }, height: 230, borderBottom: "1px solid", borderColor: "divider", pt: 1 }}>
              {analytics.monthly.map((item) => (
                <Stack key={item.key} spacing={0.75} justifyContent="flex-end" alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="flex-end" spacing={0.35} sx={{ height: 185, width: "100%", justifyContent: "center" }}>
                    <Box title={`משתמשות: ${item.users}`} sx={{ width: "25%", maxWidth: 16, height: `${Math.max((item.users / maxMonthlyValue) * 100, item.users ? 5 : 0)}%`, bgcolor: "#E6317A", borderRadius: "4px 4px 0 0" }} />
                    <Box title={`בקשות: ${item.requests}`} sx={{ width: "25%", maxWidth: 16, height: `${Math.max((item.requests / maxMonthlyValue) * 100, item.requests ? 5 : 0)}%`, bgcolor: "#7B61FF", borderRadius: "4px 4px 0 0" }} />
                    <Box title={`פגישות: ${item.meetings}`} sx={{ width: "25%", maxWidth: 16, height: `${Math.max((item.meetings / maxMonthlyValue) * 100, item.meetings ? 5 : 0)}%`, bgcolor: "#0288D1", borderRadius: "4px 4px 0 0" }} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap>{item.label}</Typography>
                </Stack>
              ))}
            </Box>
            <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
              <Legend color="#E6317A" label="משתמשות" />
              <Legend color="#7B61FF" label="בקשות" />
              <Legend color="#0288D1" label="פגישות" />
            </Stack>
          </AdminSurface>
        </Grid>
        <Grid item xs={12} lg={4}>
          <AdminSurface sx={{ p: 2.5, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>סטטוס פגישות</Typography>
            <Stack spacing={1.5}>
              {analytics.statusBreakdown.map((item) => (
                <Box key={item.status}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2">{MEETING_STATUS_LABELS[item.status] || item.status}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.count}</Typography>
                  </Stack>
                  <Box sx={{ height: 8, bgcolor: "action.hover", borderRadius: 4, overflow: "hidden" }}>
                    <Box sx={{ width: `${(item.count / statusTotal) * 100}%`, height: "100%", bgcolor: statusBarColor(item.status), borderRadius: 4 }} />
                  </Box>
                </Box>
              ))}
              {!analytics.statusBreakdown.length && <Typography color="text.secondary">אין נתונים לתקופה.</Typography>}
            </Stack>
            <Typography sx={{ mt: 3, fontWeight: 700 }}>השלמת פידבק: {analytics.totals.feedbackCompletionRate}%</Typography>
          </AdminSurface>
        </Grid>
        <Grid item xs={12}>
          <AdminSurface sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>פגישות שהושלמו לפי מנטורית</Typography>
            <Stack spacing={1.25}>
              {analytics.mentorLoad.map((item) => (
                <Stack key={item.mentorProfileId} direction="row" spacing={1.5} alignItems="center">
                  <Typography sx={{ width: { xs: 110, sm: 180 }, flexShrink: 0 }} noWrap>{item.fullName}</Typography>
                  <Box sx={{ flex: 1, height: 12, bgcolor: "action.hover", borderRadius: 6, overflow: "hidden" }}>
                    <Box sx={{ width: `${(item.completed / maxMentorValue) * 100}%`, height: "100%", bgcolor: "secondary.main", borderRadius: 6 }} />
                  </Box>
                  <Typography sx={{ width: 28, textAlign: "end", fontWeight: 700 }}>{item.completed}</Typography>
                </Stack>
              ))}
              {!analytics.mentorLoad.length && <Typography color="text.secondary">אין מנטוריות פעילות עם נתונים.</Typography>}
            </Stack>
          </AdminSurface>
        </Grid>
      </Grid>
    </Stack>
  );
}

function Legend({ color, label }) {
  return <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: 1 }} /><Typography variant="caption">{label}</Typography></Stack>;
}

function statusBarColor(status) {
  return {
    COMPLETED: "#2e7d32",
    NOT_COMPLETED: "#ed6c02",
    CANCELLED: "#757575",
    ATTENDANCE_CONFIRMED: "#0288d1",
    SCHEDULED: "#E6317A",
  }[status] || "#7B61FF";
}

export default AdminDashboardPage;
