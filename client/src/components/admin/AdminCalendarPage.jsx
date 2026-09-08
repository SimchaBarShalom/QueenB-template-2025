import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import allLocales from "@fullcalendar/core/locales-all";
import apiClient from "../../api/client";
import AdminLayout from "./AdminLayout";
import { AdminEmpty, AdminError, AdminLoading } from "./AdminState";
import { getCalendarColor, meetingStatusLabel } from "./adminFormatters";
import { FULLCALENDAR_LOCALE_BY_LANGUAGE } from "../../i18n/locales";
import { useLanguage } from "../../i18n/LanguageContext";

const CALENDAR_STATUSES = ["SCHEDULED", "ATTENDANCE_CONFIRMED", "COMPLETED", "NOT_COMPLETED", "CANCELLED"];

function AdminCalendarPage() {
  const { t, direction, language } = useLanguage();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMeetings() {
      try {
        setLoading(true);
        setError("");
        const response = await apiClient.get("/api/admin/meetings");
        setMeetings(response.data);
      } catch (requestError) {
        console.error(requestError);
        setError(t("errors.loadCalendar"));
      } finally {
        setLoading(false);
      }
    }

    loadMeetings();
  }, [t]);

  const events = useMemo(
    () =>
      meetings.map((meeting) => ({
        id: String(meeting.id),
        title: `${meeting.mentor.fullName} / ${meeting.mentee.fullName} - ${meetingStatusLabel(meeting.status, t)}`,
        start: meeting.scheduledStart,
        end: meeting.scheduledEnd,
        backgroundColor: getCalendarColor(meeting.status),
        borderColor: getCalendarColor(meeting.status),
      })),
    [meetings, t]
  );

  if (loading) return <AdminLoading />;

  return (
    <AdminLayout>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 800 }}>
        {t("admin.calendar.title")}
      </Typography>
      <AdminError message={error} />
      {meetings.length === 0 ? (
        <AdminEmpty title={t("admin.calendar.empty")} />
      ) : (
        <Paper sx={{ p: { xs: 1, md: 2 }, borderRadius: 2, overflow: "hidden" }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mb: 2 }}>
            {CALENDAR_STATUSES.map((status) => (
              <Chip
                key={status}
                label={meetingStatusLabel(status, t)}
                size="small"
                icon={<Box component="span" sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: getCalendarColor(status) }} />}
              />
            ))}
          </Stack>
          <Box sx={{ ".fc-event": { cursor: "pointer" }, ".fc-toolbar-title": { fontSize: { xs: "1.1rem", md: "1.5rem" } } }}>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              direction={direction}
              locales={allLocales}
              locale={FULLCALENDAR_LOCALE_BY_LANGUAGE[language]}
              height="auto"
              events={events}
              eventClick={(eventInfo) => navigate(`/admin/meetings/${eventInfo.event.id}`)}
              headerToolbar={{ start: "title", center: "", end: "today prev,next" }}
            />
          </Box>
        </Paper>
      )}
    </AdminLayout>
  );
}

export default AdminCalendarPage;
