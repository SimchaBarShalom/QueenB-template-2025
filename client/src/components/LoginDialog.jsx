import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import GoogleIcon from "@mui/icons-material/Google";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import { getDefaultAreaPath } from "../utils/areaRouting";
import ComingSoonSnackbar from "./ComingSoonSnackbar";
import QueensMatchLogo from "./QueensMatchLogo";
import { queenbColors } from "../theme";
import { useLanguage } from "../i18n/LanguageContext";

const backdropSx = {
  backgroundColor: `${queenbColors.pink}26`,
  backdropFilter: "blur(6px)",
};

const initialValues = { email: "", password: "" };

function LoginDialog({ open, onClose, onLogin, onSwitchToRegister }) {
  const { t } = useLanguage();
  const [values, setValues] = useState(initialValues);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const navigate = useNavigate();

  const handleClose = () => {
    setValues(initialValues);
    setError("");
    setShowPassword(false);
    onClose();
  };

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/login", values);
      onLogin(response.data.user, response.data.token);
      handleClose();
      navigate(getDefaultAreaPath(response.data.user));
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, t("auth.loginFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in is not wired to a real provider yet: there is no
  // REACT_APP_GOOGLE_CLIENT_ID / OAuth consent screen configured anywhere in
  // this project. This handler is the integration point a teammate should
  // replace (e.g. with @react-oauth/google's useGoogleLogin, posting the
  // returned credential to a new /api/auth/google backend route) - it must
  // not simulate a successful login in the meantime.
  const handleGoogleLogin = () => {
    setInfoMessage(t("auth.googleComingSoon"));
  };

  const handleForgotPassword = () => {
    setInfoMessage(t("auth.forgotComingSoon"));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
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

        <Stack alignItems="center" spacing={0.5} sx={{ mb: 3 }}>
          <QueensMatchLogo height={80} />
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack alignItems="center" sx={{ mb: 2.5 }}>
          <IconButton
            onClick={handleGoogleLogin}
            aria-label={t("auth.continueWithGoogle")}
            sx={{
              width: 48,
              height: 48,
              border: "1px solid",
              borderColor: "divider",
              "&:hover": { bgcolor: queenbColors.pinkPale },
            }}
          >
            <GoogleIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            {t("common.or")}
          </Typography>
        </Divider>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label={t("auth.emailAddress")}
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              label={t("auth.password")}
              name="password"
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={handleChange}
              required
              fullWidth
              InputProps={{
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

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ borderRadius: 999, py: 1.2 }}
            >
              {loading ? <CircularProgress color="inherit" size={22} /> : t("auth.submitLogin")}
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2.5 }}>
          <Link component="button" type="button" onClick={onSwitchToRegister} underline="hover" sx={{ fontWeight: 700 }}>
            {t("auth.createAccount")}
          </Link>
          <Link component="button" type="button" onClick={handleForgotPassword} underline="hover">
            {t("auth.forgotPassword")}
          </Link>
        </Stack>
      </Box>

      <ComingSoonSnackbar message={infoMessage} onClose={() => setInfoMessage("")} />
    </Dialog>
  );
}

export default LoginDialog;
