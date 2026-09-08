import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import { isValidFullName } from "../utils/nameUtils";
import { createMentorProfile, updateMentorProfile, updateUserProfile } from "../services/profileService";
import { AppPage, AppPageHeader, AppSurface } from "./AppPrimitives";
import { useLanguage } from "../i18n/LanguageContext";

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
    background: user.background || user.mentorProfile?.background || "",
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
  const { t } = useLanguage();
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
      <AppPage maxWidth="md">
        <Alert
          severity="info"
          action={
            <Button component={RouterLink} to="/" color="inherit" size="small">
              {t("common.backHome")}
            </Button>
          }
        >
          {t("profile.loginRequired")}
        </Alert>
      </AppPage>
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
      nextErrors.fullName = t("validation.fullName");
    }
    const needsMentorDetails = Boolean(user.mentorProfile) || !user.isAdmin;
    if (values.background.trim().length < 2) {
      nextErrors.background = t("validation.backgroundMin");
    }
    if (needsMentorDetails && values.mentoringTopics.length === 0) {
      nextErrors.mentoringTopics = t("validation.atLeastOneTopic");
    }
    if (
      needsMentorDetails &&
      (!Number.isInteger(Number(values.meetingCapacity)) ||
        Number(values.meetingCapacity) < 1 ||
        Number(values.meetingCapacity) > 100)
    ) {
      nextErrors.meetingCapacity = t("validation.meetingCapacityRange");
    }
    if (
      values.yearsOfExperience !== "" &&
      (!Number.isInteger(Number(values.yearsOfExperience)) ||
        Number(values.yearsOfExperience) < 0 ||
        Number(values.yearsOfExperience) > 80)
    ) {
      nextErrors.yearsOfExperience = t("validation.yearsRange");
    }
    if (!isValidOptionalUrl(values.githubUrl)) {
      nextErrors.githubUrl = t("validation.invalidUrl");
    }
    if (!isValidOptionalUrl(values.linkedinUrl)) {
      nextErrors.linkedinUrl = t("validation.invalidUrl");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const baseProfile = {
        fullName: values.fullName,
        background: values.background,
        jobTitle: values.jobTitle,
        workplace: values.workplace,
        yearsOfExperience: values.yearsOfExperience === "" ? null : Number(values.yearsOfExperience),
        githubUrl: values.githubUrl,
        linkedinUrl: values.linkedinUrl,
        technologies: values.technologies,
      };
      const mentorProfile = {
        ...values,
        yearsOfExperience:
          values.yearsOfExperience === "" ? null : Number(values.yearsOfExperience),
        meetingCapacity: Number(values.meetingCapacity),
        meetingDurationMinutes: Number(values.meetingDurationMinutes),
      };
      const updatedUser = user.mentorProfile
        ? await updateMentorProfile(mentorProfile)
        : user.isAdmin
          ? await updateUserProfile(baseProfile)
          : await createMentorProfile(mentorProfile);

      onUserUpdated(updatedUser);
      setValues(formValuesFromUser(updatedUser));
      setEditing(false);
      setNotification({
        open: true,
        severity: "success",
        message: user.mentorProfile || user.isAdmin ? t("profile.updated") : t("profile.mentorCreated"),
      });
    } catch (requestError) {
      setNotification({
        open: true,
        severity: "error",
        message: getRequestErrorMessage(requestError, t("errors.updateProfile"), t),
      });
    } finally {
      setLoading(false);
    }
  };

  const capabilities = [
    t("roles.mentee"),
    user.mentorProfile && t("roles.mentor"),
    user.isAdmin && t("roles.admin"),
  ].filter(Boolean);

  return (
    <AppPage maxWidth="md">
      <AppSurface sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <AppPageHeader title={t("profile.title")} actions={!editing && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={startEditing}>
                {user.mentorProfile || user.isAdmin ? t("profile.edit") : t("profile.joinAsMentor")}
              </Button>
            )} />

          {editing ? (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.5}>
                {!user.isAdmin && !user.mentorProfile && (
                  <Alert severity="info">{t("profile.completeMentor")}</Alert>
                )}

                <TextField
                  label={t("auth.fullNameLabel")}
                  value={values.fullName}
                  onChange={(event) => setField("fullName", event.target.value)}
                  error={Boolean(errors.fullName)}
                  helperText={errors.fullName || t("validation.fullNameHint")}
                  required
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label={t("profile.currentJob")}
                    value={values.jobTitle}
                    onChange={(event) => setField("jobTitle", event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label={t("profile.company")}
                    value={values.workplace}
                    onChange={(event) => setField("workplace", event.target.value)}
                    fullWidth
                  />
                </Stack>

                <TextField
                  label={t("auth.yearsOfExperience")}
                  type="number"
                  value={values.yearsOfExperience}
                  onChange={(event) => setField("yearsOfExperience", event.target.value)}
                  error={Boolean(errors.yearsOfExperience)}
                  helperText={errors.yearsOfExperience}
                  inputProps={{ min: 0, max: 80 }}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label={t("profile.github")}
                    value={values.githubUrl}
                    onChange={(event) => setField("githubUrl", event.target.value)}
                    error={Boolean(errors.githubUrl)}
                    helperText={errors.githubUrl}
                    fullWidth
                  />
                  <TextField
                    label={t("profile.linkedin")}
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
                  renderInput={(params) => <TextField {...params} label={t("profile.technologies")} />}
                />

                {(!user.isAdmin || user.mentorProfile) && <>
                <TextField
                  label={t("profile.background")}
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
                      label={t("auth.mentoringTopics")}
                      error={Boolean(errors.mentoringTopics)}
                      helperText={errors.mentoringTopics}
                      required
                    />
                  )}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label={t("profile.meetingCount")}
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
                    label={t("profile.meetingLength")}
                    value={values.meetingDurationMinutes}
                    onChange={(event) => setField("meetingDurationMinutes", event.target.value)}
                    required
                    fullWidth
                  >
                    {MEETING_DURATION_OPTIONS.map((minutes) => (
                      <MenuItem key={minutes} value={minutes}>
                        {t("common.minutesCount", { minutes })}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
                </>}

                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button type="button" onClick={cancelEditing} disabled={loading}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? <CircularProgress color="inherit" size={22} /> : t("profile.saveChanges")}
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
                <Typography color="text.secondary">{t("auth.fullName")}</Typography>
                <Typography>{user.fullName}</Typography>
              </Box>

              <Box>
                <Typography color="text.secondary">{t("auth.email")}</Typography>
                <Typography>{user.email}</Typography>
              </Box>

              {user.jobTitle && (
                <Box>
                  <Typography color="text.secondary">{t("profile.currentJob")}</Typography>
                  <Typography>
                    {user.jobTitle}
                    {user.workplace ? ` · ${user.workplace}` : ""}
                  </Typography>
                </Box>
              )}

              {(user.background || user.mentorProfile?.background) && (
                <Box>
                  <Typography color="text.secondary">{t("profile.about")}</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {user.background || user.mentorProfile.background}
                  </Typography>
                </Box>
              )}

              {user.technologies.length > 0 && (
                <Box>
                  <Typography color="text.secondary">{t("profile.technologies")}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 0.5 }}>
                    {user.technologies.map((technology) => (
                      <Chip key={technology} label={technology} size="small" />
                    ))}
                  </Stack>
                </Box>
              )}

              {user.mentorProfile && (
                <Box>
                  <Typography color="text.secondary">{t("auth.mentoringTopics")}</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 0.5 }}>
                    {user.mentorProfile.mentoringTopics.map((topic) => (
                      <Chip key={topic} label={topic} size="small" />
                    ))}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t("profile.capacitySummary", {
                      capacity: user.mentorProfile.meetingCapacity,
                      minutes: user.mentorProfile.meetingDurationMinutes,
                    })}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Stack>
      </AppSurface>

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
    </AppPage>
  );
}

export default ProfilePage;
