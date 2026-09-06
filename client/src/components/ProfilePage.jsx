import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import { isValidFullName } from "../utils/nameUtils";
import { updateMentorProfile } from "../services/profileService";

const MENTORING_TOPIC_OPTIONS = [
  "קריירה",
  "הכנה לראיונות",
  "כתיבת קורות חיים",
  "הכוונה מקצועית",
  "Frontend",
  "Backend",
  "Data",
  "DevOps",
];

const TECHNOLOGY_SUGGESTIONS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "React",
  "Node.js",
  "SQL",
  "AWS",
  "Docker",
  "C#",
];

const MEETING_DURATION_OPTIONS = [30, 45, 60, 90];

function formValuesFromUser(user) {
  return {
    fullName: user.fullName || "",
    jobTitle: user.jobTitle || "",
    workplace: user.workplace || "",
    yearsOfExperience: user.yearsOfExperience ?? "",
    githubUrl: user.githubUrl || "",
    linkedinUrl: user.linkedinUrl || "",
    technologies: user.technologies || [],
    background: user.mentorProfile?.background || "",
    mentoringTopics: user.mentorProfile?.mentoringTopics || [],
    meetingCapacity: user.mentorProfile?.meetingCapacity ?? "",
    meetingDurationMinutes: user.mentorProfile?.meetingDurationMinutes ?? 45,
  };
}

function isValidOptionalUrl(value) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ProfilePage({ user, onUserUpdated }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => (user ? formValuesFromUser(user) : {}));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Alert
          severity="info"
          action={
            <Button component={RouterLink} to="/" color="inherit" size="small">
              לדף הבית
            </Button>
          }
        >
          יש להתחבר כדי לראות את הפרופיל.
        </Alert>
      </Container>
    );
  }

  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const startEditing = () => {
    setValues(formValuesFromUser(user));
    setErrors({});
    setEditing(true);
  };

  const cancelEditing = () => {
    setValues(formValuesFromUser(user));
    setErrors({});
    setEditing(false);
  };

  const validate = () => {
    const nextErrors = {};

    if (!isValidFullName(values.fullName)) {
      nextErrors.fullName = "יש להזין שם פרטי ושם משפחה, לפחות 2 תווים בכל אחד";
    }
    if (values.background.trim().length < 2) {
      nextErrors.background = "יש להזין תיאור של לפחות 2 תווים";
    }
    if (values.mentoringTopics.length === 0) {
      nextErrors.mentoringTopics = "יש לבחור לפחות תחום מנטורינג אחד";
    }
    if (
      !Number.isInteger(Number(values.meetingCapacity)) ||
      Number(values.meetingCapacity) < 1 ||
      Number(values.meetingCapacity) > 100
    ) {
      nextErrors.meetingCapacity = "יש להזין מספר שלם בין 1 ל-100";
    }
    if (
      values.yearsOfExperience !== "" &&
      (!Number.isInteger(Number(values.yearsOfExperience)) ||
        Number(values.yearsOfExperience) < 0 ||
        Number(values.yearsOfExperience) > 80)
    ) {
      nextErrors.yearsOfExperience = "יש להזין מספר שלם בין 0 ל-80";
    }
    if (!isValidOptionalUrl(values.githubUrl)) {
      nextErrors.githubUrl = "יש להזין כתובת http או https תקינה";
    }
    if (!isValidOptionalUrl(values.linkedinUrl)) {
      nextErrors.linkedinUrl = "יש להזין כתובת http או https תקינה";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const updatedUser = await updateMentorProfile({
        ...values,
        yearsOfExperience:
          values.yearsOfExperience === "" ? null : Number(values.yearsOfExperience),
        meetingCapacity: Number(values.meetingCapacity),
        meetingDurationMinutes: Number(values.meetingDurationMinutes),
      });

      onUserUpdated(updatedUser);
      setValues(formValuesFromUser(updatedUser));
      setEditing(false);
      setNotification({
        open: true,
        severity: "success",
        message: "הפרופיל עודכן בהצלחה",
      });
    } catch (requestError) {
      setNotification({
        open: true,
        severity: "error",
        message: getRequestErrorMessage(requestError, "עדכון הפרופיל נכשל. נסי שוב."),
      });
    } finally {
      setLoading(false);
    }
  };

  const capabilities = [
    "חניכה",
    user.mentorProfile && "מנטורית",
    user.isAdmin && "מנהלת",
  ].filter(Boolean);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, borderColor: "#f6d3e0" }}>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1">
              פרופיל
            </Typography>
            {user.mentorProfile && !editing && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={startEditing}>
                עריכת פרופיל
              </Button>
            )}
          </Stack>

          {editing ? (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.5}>
                <TextField
                  label="שם מלא (שם פרטי ושם משפחה)"
                  value={values.fullName}
                  onChange={(event) => setField("fullName", event.target.value)}
                  error={Boolean(errors.fullName)}
                  helperText={errors.fullName || "לדוגמה: נועה כהן — לפחות 2 תווים בכל חלק"}
                  required
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="תפקיד נוכחי"
                    value={values.jobTitle}
                    onChange={(event) => setField("jobTitle", event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="חברה"
                    value={values.workplace}
                    onChange={(event) => setField("workplace", event.target.value)}
                    fullWidth
                  />
                </Stack>

                <TextField
                  label="שנות ניסיון"
                  type="number"
                  value={values.yearsOfExperience}
                  onChange={(event) => setField("yearsOfExperience", event.target.value)}
                  error={Boolean(errors.yearsOfExperience)}
                  helperText={errors.yearsOfExperience}
                  inputProps={{ min: 0, max: 80 }}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="GitHub URL"
                    value={values.githubUrl}
                    onChange={(event) => setField("githubUrl", event.target.value)}
                    error={Boolean(errors.githubUrl)}
                    helperText={errors.githubUrl}
                    fullWidth
                  />
                  <TextField
                    label="LinkedIn URL"
                    value={values.linkedinUrl}
                    onChange={(event) => setField("linkedinUrl", event.target.value)}
                    error={Boolean(errors.linkedinUrl)}
                    helperText={errors.linkedinUrl}
                    fullWidth
                  />
                </Stack>

                <Autocomplete
                  multiple
                  freeSolo
                  options={TECHNOLOGY_SUGGESTIONS}
                  value={values.technologies}
                  onChange={(event, newValue) => setField("technologies", newValue)}
                  renderInput={(params) => <TextField {...params} label="טכנולוגיות" />}
                />

                <TextField
                  label="אודות / רקע מקצועי"
                  value={values.background}
                  onChange={(event) => setField("background", event.target.value)}
                  error={Boolean(errors.background)}
                  helperText={errors.background}
                  multiline
                  minRows={4}
                  required
                />

                <Autocomplete
                  multiple
                  freeSolo
                  options={MENTORING_TOPIC_OPTIONS}
                  value={values.mentoringTopics}
                  onChange={(event, newValue) => setField("mentoringTopics", newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="תחומי מנטורינג"
                      error={Boolean(errors.mentoringTopics)}
                      helperText={errors.mentoringTopics}
                      required
                    />
                  )}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="מספר מפגשים"
                    type="number"
                    value={values.meetingCapacity}
                    onChange={(event) => setField("meetingCapacity", event.target.value)}
                    error={Boolean(errors.meetingCapacity)}
                    helperText={errors.meetingCapacity}
                    inputProps={{ min: 1, max: 100 }}
                    required
                    fullWidth
                  />
                  <TextField
                    select
                    label="אורך פגישה"
                    value={values.meetingDurationMinutes}
                    onChange={(event) => setField("meetingDurationMinutes", event.target.value)}
                    required
                    fullWidth
                  >
                    {MEETING_DURATION_OPTIONS.map((minutes) => (
                      <MenuItem key={minutes} value={minutes}>
                        {minutes} דקות
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button type="button" onClick={cancelEditing} disabled={loading}>
                    ביטול
                  </Button>
                  <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? <CircularProgress color="inherit" size={22} /> : "שמירת שינויים"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ) : (
            <>
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                {capabilities.map((label) => (
                  <Chip key={label} label={label} color="primary" variant="outlined" />
                ))}
              </Stack>

              <Box>
                <Typography color="text.secondary">שם מלא</Typography>
                <Typography>{user.fullName}</Typography>
              </Box>

              <Box>
                <Typography color="text.secondary">אימייל</Typography>
                <Typography>{user.email}</Typography>
              </Box>

              {user.jobTitle && (
                <Box>
                  <Typography color="text.secondary">תפקיד נוכחי</Typography>
                  <Typography>
                    {user.jobTitle}
                    {user.workplace ? ` · ${user.workplace}` : ""}
                  </Typography>
                </Box>
              )}

              {user.mentorProfile?.background && (
                <Box>
                  <Typography color="text.secondary">אודות</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {user.mentorProfile.background}
                  </Typography>
                </Box>
              )}

              {user.technologies.length > 0 && (
                <Box>
                  <Typography color="text.secondary">טכנולוגיות</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 0.5 }}>
                    {user.technologies.map((technology) => (
                      <Chip key={technology} label={technology} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}

              {user.mentorProfile && (
                <Box>
                  <Typography color="text.secondary">תחומי מנטורינג</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 0.5 }}>
                    {user.mentorProfile.mentoringTopics.map((topic) => (
                      <Chip key={topic} label={topic} size="small" />
                    ))}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {user.mentorProfile.meetingCapacity} מפגשים ·{" "}
                    {user.mentorProfile.meetingDurationMinutes} דקות למפגש
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Stack>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification((current) => ({ ...current, open: false }))}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ProfilePage;
