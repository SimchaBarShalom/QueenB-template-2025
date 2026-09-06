import React, { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Grid, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import apiClient from "../../api/client";
import AdminLayout from "./AdminLayout";
import { AdminError, AdminLoading } from "./AdminState";
import { MEETING_STATUS_LABELS } from "./adminFormatters";

const CARDS = [
  { key: "usersCount", label: "משתמשות", path: "/admin/users", icon: <GroupsIcon /> },
  { key: "activeMentorsCount", label: "מנטוריות פעילות", path: "/admin/users?capability=mentor", icon: <GroupsIcon /> },
  { key: "scheduledMeetingsCount", label: "פגישות פעילות", path: "/admin/meetings", icon: <EventAvailableIcon /> },
  { key: "unresolvedAlertsCount", label: "התראות פתוחות", path: "/admin/alerts", icon: <WarningAmberIcon /> },
];

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      try {
        setError("");
        setLoading(true);
        const [summaryResponse, analyticsResponse] = await Promise.all([
          apiClient.get("/api/admin/summary"),
          apiClient.get("/api/admin/analytics", { params: { months } }),
        ]);
        setSummary(summaryResponse.data);
        setAnalytics(analyticsResponse.data);
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
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 800 }}>
        אזור ניהול
      </Typography>
      <AdminError message={error} />
      <Grid container spacing={2}>
        {CARDS.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.key}>
            <Paper sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
              <Stack spacing={1.5}>
                <Box sx={{ color: "primary.main" }}>{card.icon}</Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {summary?.[card.key] ?? 0}
                </Typography>
                <Typography color="text.secondary">{card.label}</Typography>
                <Button component={RouterLink} to={card.path} size="small" sx={{ alignSelf: "flex-start" }}>
                  מעבר
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
      {analytics && <AnalyticsSection analytics={analytics} onMonthsChange={setMonths} />}
    </AdminLayout>
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
      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
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
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
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
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
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
          </Paper>
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
