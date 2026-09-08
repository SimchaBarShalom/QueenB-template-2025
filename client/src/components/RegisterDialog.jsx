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
import PasswordRequirements from "./PasswordRequirements";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import { getDefaultAreaPath } from "../utils/areaRouting";
import { isValidFullName, splitFullName } from "../utils/nameUtils";
import { isPasswordValid } from "../utils/passwordValidation";
import QueensMatchLogo from "./QueensMatchLogo";
import { queenbColors } from "../theme";

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

const MEETING_DURATION_OPTIONS = [
  { value: 30, label: "30 דקות" },
  { value: 45, label: "45 דקות" },
  { value: 60, label: "60 דקות" },
  { value: 90, label: "90 דקות" },
];

const initialValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  wantsToBeMentor: false,
  yearsOfExperience: "",
  githubUrl: "",
  linkedinUrl: "",
  technologies: [],
  jobTitle: "",
  workplace: "",
  mentoringTopics: [],
  meetingCapacity: "",
  meetingDurationMinutes: 45,
  filledSalaryConfession: "",
};

function RegisterDialog({ open, onClose, onRegister, onSwitchToLogin }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
      nextErrors.fullName = "יש להזין שם פרטי ושם משפחה, לפחות 2 תווים בכל אחד";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "יש להזין אימייל תקין";
    }

    if (!isPasswordValid(values.password)) {
      nextErrors.password = "הסיסמה אינה עומדת בדרישות";
    }

    if (!confirmPasswordMatches) {
      nextErrors.confirmPassword = "הסיסמאות אינן תואמות";
    }

    if (values.wantsToBeMentor) {

      if (values.mentoringTopics.length === 0) {
        nextErrors.mentoringTopics = "יש לבחור לפחות תחום מנטורינג אחד";
      }

      if (!values.meetingCapacity || Number(values.meetingCapacity) <= 0) {
        nextErrors.meetingCapacity = "יש להזין מספר מפגשים";
      }

      if (values.filledSalaryConfession !== "yes" && values.filledSalaryConfession !== "no") {
        nextErrors.filledSalaryConfession = "יש לציין האם מילאת את טופס וידויי השכר";
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
      setSubmitError(getRequestErrorMessage(requestError, "ההרשמה נכשלה. בדקי את הפרטים ונסי שוב."));
    } finally {
      setLoading(false);
    }
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
            הירשמי והצטרפי לקהילת Queens Match
          </Typography>
        </Stack>

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
              label="אני רוצה להיות מנטורית"
            />

            <TextField
              label="שם מלא (שם פרטי ושם משפחה)"
              value={values.fullName}
              onChange={(event) => setField("fullName", event.target.value)}
              error={Boolean(errors.fullName)}
              helperText={errors.fullName || "לדוגמה: נועה כהן — לפחות 2 תווים בכל חלק"}
              required
              fullWidth
            />

            <TextField
              label="אימייל"
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
                label="סיסמה"
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
                        aria-label={showPassword ? "הסתרת סיסמה" : "הצגת סיסמה"}
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
                label="אימות סיסמה"
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
                        aria-label={showConfirmPassword ? "הסתרת סיסמה" : "הצגת סיסמה"}
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
                    אומת בהצלחה
                  </Typography>
                </Stack>
              )}
              {confirmPasswordMismatch && (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <CancelIcon sx={{ fontSize: 16, color: "error.main" }} />
                  <Typography variant="caption" color="error.main">
                    הסיסמאות אינן תואמות
                  </Typography>
                </Stack>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                קצת מידע עליי
              </Typography>

              <Stack spacing={2.5}>
                <TextField
                  label={
                    <>
                      שנות ניסיון{" "}
                      <Typography component="span" variant="caption" color="text.disabled">
                        (אופציונלי)
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
                        (אופציונלי)
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
                        (אופציונלי)
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
                          טכנולוגיות / שפות תכנות{" "}
                          <Typography component="span" variant="caption" color="text.disabled">
                            (אופציונלי)
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
                    label="תפקיד נוכחי (אופציונלי)"
                    value={values.jobTitle}
                    onChange={(event) => setField("jobTitle", event.target.value)}
                    error={Boolean(errors.jobTitle)}
                    helperText={errors.jobTitle}
                    required
                    fullWidth
                  />
                  <TextField
                    label="חברה (אופציונלי)"
                    value={values.workplace}
                    onChange={(event) => setField("workplace", event.target.value)}
                    error={Boolean(errors.workplace)}
                    helperText={errors.workplace}
                    required
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
                      label="תחומי מנטורינג"
                      required={values.mentoringTopics.length === 0}
                      error={Boolean(errors.mentoringTopics)}
                      helperText={errors.mentoringTopics}
                    />
                  )}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                  <TextField
                    label="מספר מפגשים שאני יכולה לקיים"
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
                    label="אורך פגישה"
                    value={values.meetingDurationMinutes}
                    onChange={(event) => setField("meetingDurationMinutes", event.target.value)}
                    required
                    fullWidth
                  >
                    {MEETING_DURATION_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <FormControl
                  error={Boolean(errors.filledSalaryConfession)}
                  required
                >
                  <FormLabel sx={{ fontWeight: 700, color: "text.primary" }}>
                    האם מילאת את טופס וידויי שכר של Queen B?
                  </FormLabel>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
                    הטופס אנונימי ועוזר לפענח את מצב השכר בשוק.{" "}
                    <Link
                      href={SALARY_CONFESSION_FORM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontWeight: 700 }}
                    >
                      למילוי הטופס
                    </Link>
                  </Typography>
                  <RadioGroup
                    row
                    value={values.filledSalaryConfession}
                    onChange={(event) => setField("filledSalaryConfession", event.target.value)}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="כן" />
                    <FormControlLabel value="no" control={<Radio />} label="לא" />
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
              {loading ? <CircularProgress color="inherit" size={22} /> : "הרשמה"}
            </Button>
          </Stack>
        </Box>

        <Typography textAlign="center" sx={{ mt: 2.5 }}>
          כבר יש לך חשבון?{" "}
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
            כניסה
          </Box>
        </Typography>
      </Box>
    </Dialog>
  );
}

export default RegisterDialog;
