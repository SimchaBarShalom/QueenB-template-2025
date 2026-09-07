import React, { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Alert, Button, Chip, Divider, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import apiClient from "../../api/client";
import AdminLayout from "./AdminLayout";
import { AdminEmpty, AdminError, AdminLoading } from "./AdminState";
import { formatDateTime, REQUEST_STATUS_LABELS } from "./adminFormatters";

function listToText(items) {
  return (items || []).join(", ");
}

function textToList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildUserForm(user) {
  return {
    fullName: user?.fullName || "",
    jobTitle: user?.jobTitle || "",
    workplace: user?.workplace || "",
    yearsOfExperience: user?.yearsOfExperience ?? "",
    githubUrl: user?.githubUrl || "",
    linkedinUrl: user?.linkedinUrl || "",
    technologies: listToText(user?.technologies),
  };
}

function buildMentorForm(profile) {
  return {
    background: profile?.background || "",
    meetingCapacity: profile?.meetingCapacity ?? "",
    meetingDurationMinutes: profile?.meetingDurationMinutes ?? "",
    mentoringTopics: listToText(profile?.mentoringTopics),
    isActive: Boolean(profile?.isActive),
  };
}

function AdminUserDetailsPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [savingMentor, setSavingMentor] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userForm, setUserForm] = useState(buildUserForm(null));
  const [mentorForm, setMentorForm] = useState(buildMentorForm(null));

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        setError("");
        const response = await apiClient.get(`/api/admin/users/${id}`);
        setDetail(response.data);
        setUserForm(buildUserForm(response.data.user));
        setMentorForm(buildMentorForm(response.data.user.mentorProfile));
      } catch (requestError) {
        console.error(requestError);
        setError("לא הצלחנו לטעון את פרטי המשתמשת.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [id]);

  const setUserField = (field, value) => setUserForm((current) => ({ ...current, [field]: value }));
  const setMentorField = (field, value) => setMentorForm((current) => ({ ...current, [field]: value }));

  const saveUserProfile = async (event) => {
    event.preventDefault();
    try {
      setSavingUser(true);
      setError("");
      setSuccess("");
      const response = await apiClient.patch(`/api/admin/users/${id}/profile`, {
        ...userForm,
        yearsOfExperience: userForm.yearsOfExperience === "" ? null : Number(userForm.yearsOfExperience),
        technologies: textToList(userForm.technologies),
      });
      setDetail((current) => ({ ...current, user: response.data }));
      setUserForm(buildUserForm(response.data));
      setSuccess("פרטי המשתמשת עודכנו.");
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "שמירת פרטי המשתמשת נכשלה.");
    } finally {
      setSavingUser(false);
    }
  };

  const saveMentorProfile = async (event) => {
    event.preventDefault();
    if (!user?.mentorProfile) return;

    try {
      setSavingMentor(true);
      setError("");
      setSuccess("");
      const response = await apiClient.patch(`/api/admin/mentors/${user.mentorProfile.id}/profile`, {
        ...mentorForm,
        meetingCapacity: Number(mentorForm.meetingCapacity),
        meetingDurationMinutes: Number(mentorForm.meetingDurationMinutes),
        mentoringTopics: textToList(mentorForm.mentoringTopics),
      });
      setDetail((current) => ({
        ...current,
        user: { ...current.user, mentorProfile: response.data, capabilities: { ...current.user.capabilities, mentor: true } },
      }));
      setMentorForm(buildMentorForm(response.data));
      setSuccess("פרטי המנטורית עודכנו.");
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || "שמירת פרטי המנטורית נכשלה.");
    } finally {
      setSavingMentor(false);
    }
  };

  if (loading) return <AdminLoading />;

  const user = detail?.user;

  return (
    <AdminLayout>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          פרטי משתמשת
        </Typography>
        <Button component={RouterLink} to="/admin/users">
          חזרה למשתמשות
        </Button>
      </Stack>
      <AdminError message={error} />
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {user ? (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {user.fullName}
                </Typography>
                <Typography color="text.secondary">{user.email}</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" rowGap={0.5}>
                  <Chip label="מנטית" size="small" />
                  {user.capabilities.mentor && <Chip label="מנטורית" color="secondary" size="small" />}
                  {user.capabilities.admin && <Chip label="מנהלת" color="primary" size="small" />}
                </Stack>
                <Divider />
                <Typography>תפקיד: {user.jobTitle || "לא צוין"}</Typography>
                <Typography>מקום עבודה: {user.workplace || "לא צוין"}</Typography>
                <Typography>ניסיון: {user.yearsOfExperience ?? "לא צוין"}</Typography>
                <Typography>בקשות כמנטית: {detail.counts.requests}</Typography>
                <Typography>פגישות קשורות: {detail.counts.meetings}</Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Paper component="form" onSubmit={saveUserProfile} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  עריכת פרטים
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="שם מלא" value={userForm.fullName} onChange={(event) => setUserField("fullName", event.target.value)} fullWidth required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="תפקיד" value={userForm.jobTitle} onChange={(event) => setUserField("jobTitle", event.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="מקום עבודה" value={userForm.workplace} onChange={(event) => setUserField("workplace", event.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      type="number"
                      label="שנות ניסיון"
                      value={userForm.yearsOfExperience}
                      onChange={(event) => setUserField("yearsOfExperience", event.target.value)}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="GitHub" value={userForm.githubUrl} onChange={(event) => setUserField("githubUrl", event.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="LinkedIn" value={userForm.linkedinUrl} onChange={(event) => setUserField("linkedinUrl", event.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="טכנולוגיות" value={userForm.technologies} onChange={(event) => setUserField("technologies", event.target.value)} fullWidth />
                  </Grid>
                </Grid>
                <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={savingUser}>
                  שמירת פרטי משתמשת
                </Button>
              </Paper>

              {user.mentorProfile && (
                <Paper component="form" onSubmit={saveMentorProfile} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                    עריכת פרטי מנטורית
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="רקע"
                        value={mentorForm.background}
                        onChange={(event) => setMentorField("background", event.target.value)}
                        fullWidth
                        required
                        multiline
                        minRows={3}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="number"
                        label="כמות פגישות"
                        value={mentorForm.meetingCapacity}
                        onChange={(event) => setMentorField("meetingCapacity", event.target.value)}
                        fullWidth
                        required
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        type="number"
                        label="משך פגישה בדקות"
                        value={mentorForm.meetingDurationMinutes}
                        onChange={(event) => setMentorField("meetingDurationMinutes", event.target.value)}
                        fullWidth
                        required
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="תחומי מנטורינג"
                        value={mentorForm.mentoringTopics}
                        onChange={(event) => setMentorField("mentoringTopics", event.target.value)}
                        fullWidth
                        required
                      />
                    </Grid>
                  </Grid>
                  <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={savingMentor}>
                    שמירת פרטי מנטורית
                  </Button>
                </Paper>
              )}

              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  בקשות אחרונות
                </Typography>
                {detail.recentRequests.length === 0 ? (
                  <AdminEmpty title="אין בקשות אחרונות" />
                ) : (
                  <Stack spacing={1.5}>
                    {detail.recentRequests.map((request) => (
                      <Stack key={request.id} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                        <Typography>{request.mentorName}</Typography>
                        <Typography color="text.secondary">{REQUEST_STATUS_LABELS[request.status] || request.status}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>

              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                  פגישות אחרונות
                </Typography>
                {detail.recentMeetings.length === 0 ? (
                  <AdminEmpty title="אין פגישות אחרונות" />
                ) : (
                  <Stack spacing={1.5}>
                    {detail.recentMeetings.map((meeting) => (
                      <Stack key={meeting.id} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                        <Typography>
                          {meeting.mentor.fullName} / {meeting.mentee.fullName}
                        </Typography>
                        <Typography color="text.secondary">{formatDateTime(meeting.scheduledStart)}</Typography>
                        <Button component={RouterLink} to={`/admin/meetings/${meeting.id}`} size="small">
                          פרטים
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      ) : (
        <AdminEmpty title="משתמשת לא נמצאה" />
      )}
    </AdminLayout>
  );
}

export default AdminUserDetailsPage;
