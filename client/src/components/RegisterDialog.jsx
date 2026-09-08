import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  Link,
  Radio,
  RadioGroup,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CancelIcon from "@mui/icons-material/Cancel";
import GoogleIcon from "@mui/icons-material/Google";
import PasswordRequirements from "./PasswordRequirements";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import { getDefaultAreaPath } from "../utils/areaRouting";
import { isValidFullName, splitFullName } from "../utils/nameUtils";
import { isPasswordValid } from "../utils/passwordValidation";
import QueensMatchLogo from "./QueensMatchLogo";
import { queenbColors } from "../theme";
import { useLanguage } from "../i18n/LanguageContext";

const backdropSx = {
  backgroundColor: `${queenbColors.pink}26`,
  backdropFilter: "blur(6px)",
};

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

const SALARY_CONFESSION_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScAEI48E4ofiz9Nwflcl0ipevesef1rjGs7DCyhVTuABhKLbQ/viewform?fbclid=IwY2xjawQro0hleHRuA2FlbQIxMABicmlkETFFSThRdlByem45Sk1YdmNWc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHr9NgWXGqJUOdIML47cx4eZoom92wOLs9yQSsIxsAGFRaqQmlVozD3oLOkk7_aem_ecgYsXjM4wikXICOtF5amQ";

const MEETING_DURATION_OPTIONS = [30, 45, 60, 90];

const initialValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  wantsToBeMentor: false,
  yearsOfExperience: "",
  githubUrl: "",
  linkedinUrl: "",
  background: "",
  technologies: [],
  jobTitle: "",
  workplace: "",
  mentoringTopics: [],
  meetingCapacity: "",
  meetingDurationMinutes: 45,
  filledSalaryConfession: "",
};

function RegisterDialog({ open, onClose, onRegister, onSwitchToLogin }) {
  const { t } = useLanguage();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const handleClose = () => {
    setValues(initialValues);
    setErrors({});
    setSubmitError("");
    onClose();
  };

  const setField = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const confirmPasswordMatches =
    values.confirmPassword.length > 0 && values.confirmPassword === values.password;
  const confirmPasswordMismatch =
    values.confirmPassword.length > 0 && values.confirmPassword !== values.password;

  const validate = () => {
    const nextErrors = {};

    if (!isValidFullName(values.fullName)) {
      nextErrors.fullName = t("validation.fullName");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = t("validation.invalidEmail");
    }

    if (!isPasswordValid(values.password)) {
      nextErrors.password = t("validation.passwordRequirements");
    }

    if (!confirmPasswordMatches) {
      nextErrors.confirmPassword = t("validation.passwordsMustMatch");
    }

    if (values.background.trim().length < 2) {
      nextErrors.background = t("validation.backgroundMin");
    }

    if (values.wantsToBeMentor) {

      if (values.mentoringTopics.length === 0) {
        nextErrors.mentoringTopics = t("validation.atLeastOneTopic");
      }

      if (!values.meetingCapacity || Number(values.meetingCapacity) <= 0) {
        nextErrors.meetingCapacity = t("validation.meetingCapacity");
      }

      if (values.filledSalaryConfession !== "yes" && values.filledSalaryConfession !== "no") {
        nextErrors.filledSalaryConfession = t("validation.salaryConfession");
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!validate()) {
      return;
    }

    const { firstName, lastName } = splitFullName(values.fullName);

    const payload = {
      firstName,
      lastName,
      email: values.email,
      password: values.password,
      background: values.background,
      yearsOfExperience: values.yearsOfExperience ? Number(values.yearsOfExperience) : undefined,
      githubUrl: values.githubUrl || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
      technologies: values.technologies,
      wantsToBeMentor: values.wantsToBeMentor,
    };

    if (values.wantsToBeMentor) {
      payload.jobTitle = values.jobTitle;
      payload.workplace = values.workplace;
      payload.mentoringTopics = values.mentoringTopics;
      payload.meetingCapacity = Number(values.meetingCapacity);
      payload.meetingDurationMinutes = Number(values.meetingDurationMinutes);
    }

    setLoading(true);

    try {
      const response = await axios.post("/api/auth/register", payload);
      onRegister(response.data.user, response.data.token);
      handleClose();
      navigate(getDefaultAreaPath(response.data.user));
    } catch (requestError) {
      setSubmitError(getRequestErrorMessage(requestError, t("auth.registerFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    setGoogleLoading(true);
    const apiOrigin = process.env.REACT_APP_API_URL || (window.location.port === "3000" ? "http://localhost:5000" : "");
    window.location.assign(`${apiOrigin}/api/auth/google`);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      BackdropProps={{ sx: backdropSx }}
    >
      <Box sx={{ p: { xs: 3, sm: 4 }, position: "relative" }}>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ position: "absolute", top: 12, insetInlineEnd: 12, color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <QueensMatchLogo height={72} />
          <Typography variant="h6" component="h1" textAlign="center">
            {t("auth.registerHeadline")}
          </Typography>
        </Stack>

        <Stack alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={handleGoogleRegister}
            disabled={loading || googleLoading}
            startIcon={googleLoading ? <CircularProgress size={18} /> : <GoogleIcon />}
            aria-label={t("auth.registerWithGoogle")}
            fullWidth
            sx={{ borderRadius: 999, py: 1.1, textTransform: "none" }}
          >
            {t("auth.registerWithGoogle")}
          </Button>
        </Stack>

        <Divider sx={{ mb: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t("common.or")}
          </Typography>
        </Divider>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <FormControlLabel
              sx={{ alignSelf: "flex-start", ml: 0 }}
              control={
                <Checkbox
                  checked={values.wantsToBeMentor}
                  onChange={(event) => setField("wantsToBeMentor", event.target.checked)}
                  icon={<RadioButtonUncheckedIcon />}
                  checkedIcon={<CheckCircleIcon color="primary" />}
                />
              }
              label={t("auth.wantsToBeMentor")}
            />

            <TextField
              label={t("auth.fullNameLabel")}
              value={values.fullName}
              onChange={(event) => setField("fullName", event.target.value)}
              error={Boolean(errors.fullName)}
              helperText={errors.fullName || t("validation.fullNameHint")}
              required
              fullWidth
            />

            <TextField
              label={t("auth.email")}
              type="email"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              error={Boolean(errors.email)}
              helperText={errors.email}
              required
              fullWidth
            />

            <Box>
              <TextField
                label={t("auth.password")}
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={(event) => setField("password", event.target.value)}
                error={Boolean(errors.password)}
                required
                fullWidth                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((current) => !current)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ mt: 1 }}>
                <PasswordRequirements password={values.password} />
              </Box>
            </Box>

            <Box>
              <TextField
                label={t("auth.confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                value={values.confirmPassword}
                onChange={(event) => setField("confirmPassword", event.target.value)}
                error={Boolean(errors.confirmPassword) || confirmPasswordMismatch}
                required
                fullWidth                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        edge="end"
                        size="small"
                        aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {confirmPasswordMatches && (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                  <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
                    {t("auth.confirmed")}
                  </Typography>
                </Stack>
              )}
              {confirmPasswordMismatch && (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <CancelIcon sx={{ fontSize: 16, color: "error.main" }} />
                  <Typography variant="caption" color="error.main">
                    {t("validation.passwordsMustMatch")}
                  </Typography>
                </Stack>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                {t("auth.aboutMe")}
              </Typography>

              <Stack spacing={2.5}>
                <TextField
                  label={t("auth.backgroundRequired")}
                  value={values.background}
                  onChange={(event) => setField("background", event.target.value)}
                  error={Boolean(errors.background)}
                  helperText={errors.background}
                  multiline
                  minRows={3}
                  required
                  fullWidth
                />
                <TextField
                  label={
                    <>
                      {t("auth.yearsOptional")}{" "}
                      <Typography component="span" variant="caption" color="text.disabled">
                        {t("common.optional")}
                      </Typography>
                    </>
                  }
                  type="number"
                  value={values.yearsOfExperience}
                  onChange={(event) => setField("yearsOfExperience", event.target.value)}
                  fullWidth
                  inputProps={{ min: 0 }}
                />

                <TextField
                  label={
                    <>
                      GitHub URL{" "}
                      <Typography component="span" variant="caption" color="text.disabled">
                        {t("common.optional")}
                      </Typography>
                    </>
                  }
                  value={values.githubUrl}
                  onChange={(event) => setField("githubUrl", event.target.value)}
                  fullWidth
                />

                <TextField
                  label={
                    <>
                      LinkedIn URL{" "}
                      <Typography component="span" variant="caption" color="text.disabled">
                        {t("common.optional")}
                      </Typography>
                    </>
                  }
                  value={values.linkedinUrl}
                  onChange={(event) => setField("linkedinUrl", event.target.value)}
                  fullWidth
                />

                <Autocomplete
                  multiple
                  freeSolo
                  options={TECHNOLOGY_SUGGESTIONS}
                  value={values.technologies}
                  onChange={(event, newValue) => setField("technologies", newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={
                        <>
                          {t("auth.technologiesOptional")}{" "}
                          <Typography component="span" variant="caption" color="text.disabled">
                            {t("common.optional")}
                          </Typography>
                        </>
                      }
                    />
                  )}
                />
              </Stack>
            </Box>

            {values.wantsToBeMentor && (
              <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                  <TextField
                    label={t("auth.currentJobOptional")}
                    value={values.jobTitle}
                    onChange={(event) => setField("jobTitle", event.target.value)}
                    error={Boolean(errors.jobTitle)}
                    helperText={errors.jobTitle}
                    fullWidth
                  />
                  <TextField
                    label={t("auth.companyOptional")}
                    value={values.workplace}
                    onChange={(event) => setField("workplace", event.target.value)}
                    error={Boolean(errors.workplace)}
                    helperText={errors.workplace}
                    fullWidth
                  />
                </Stack>

                <Autocomplete
                  multiple
                  options={MENTORING_TOPIC_OPTIONS}
                  value={values.mentoringTopics}
                  onChange={(event, newValue) => setField("mentoringTopics", newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("auth.mentoringTopics")}
                      required={values.mentoringTopics.length === 0}
                      error={Boolean(errors.mentoringTopics)}
                      helperText={errors.mentoringTopics}
                    />
                  )}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                  <TextField
                    label={t("auth.meetingCount")}
                    type="number"
                    value={values.meetingCapacity}
                    onChange={(event) => setField("meetingCapacity", event.target.value)}
                    error={Boolean(errors.meetingCapacity)}
                    helperText={errors.meetingCapacity}
                    required
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                  <TextField
                    select
                    label={t("auth.meetingLength")}
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

                <FormControl
                  error={Boolean(errors.filledSalaryConfession)}
                  required
                >
                  <FormLabel sx={{ fontWeight: 700, color: "text.primary" }}>
                    {t("auth.salaryQuestion")}
                  </FormLabel>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
                    {t("auth.salaryHelp")}{" "}
                    <Link
                      href={SALARY_CONFESSION_FORM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontWeight: 700 }}
                    >
                      {t("auth.salaryFormLink")}
                    </Link>
                  </Typography>
                  <RadioGroup
                    row
                    value={values.filledSalaryConfession}
                    onChange={(event) => setField("filledSalaryConfession", event.target.value)}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label={t("common.yes")} />
                    <FormControlLabel value="no" control={<Radio />} label={t("common.no")} />
                  </RadioGroup>
                  {errors.filledSalaryConfession && (
                    <FormHelperText>{errors.filledSalaryConfession}</FormHelperText>
                  )}
                </FormControl>
              </Stack>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ borderRadius: 999, py: 1.2 }}
            >
              {loading ? <CircularProgress color="inherit" size={22} /> : t("auth.submitRegister")}
            </Button>
          </Stack>
        </Box>

        <Typography textAlign="center" sx={{ mt: 2.5 }}>
          {t("auth.alreadyHaveAccount")}{" "}
          <Box
            component="button"
            type="button"
            onClick={onSwitchToLogin}
            sx={{
              border: 0,
              background: "none",
              color: "primary.main",
              fontWeight: 700,
              cursor: "pointer",
              p: 0,
              font: "inherit",
            }}
          >
            {t("auth.submitLogin")}
          </Box>
        </Typography>
      </Box>
    </Dialog>
  );
}

export default RegisterDialog;
