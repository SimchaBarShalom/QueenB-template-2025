import React, { useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import PasswordRequirements from "./PasswordRequirements";
import { isPasswordValid } from "../utils/passwordValidation";
import { useLanguage } from "../i18n/LanguageContext";

export default function ResetPasswordPage() {
  const { t } = useLanguage(); const [params] = useSearchParams(); const navigate = useNavigate(); const token = params.get("token") || ""; const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [status, setStatus] = useState("idle"); const [error, setError] = useState("");
  const valid = useMemo(() => isPasswordValid(password) && password === confirm, [password, confirm]);
  const submit = async (event) => { event.preventDefault(); if (!valid) return; setStatus("loading"); try { await axios.post("/api/auth/reset-password", { token, password, confirmPassword: confirm }); setStatus("success"); } catch (_) { setError(t("auth.resetInvalid")); setStatus("error"); } };
  return <Box sx={{ maxWidth: 480, mx: "auto", py: 8, px: 3 }}><Typography variant="h4" sx={{ mb: 3 }}>{t("auth.resetTitle")}</Typography>{status === "success" ? <Stack spacing={2}><Alert severity="success">{t("auth.resetSuccess")}</Alert><Button onClick={() => navigate("/")} variant="contained">{t("common.backHome")}</Button></Stack> : <Box component="form" onSubmit={submit}><Stack spacing={2}><TextField label={t("auth.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth /><PasswordRequirements password={password} /><TextField label={t("auth.confirmPassword")} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={Boolean(confirm) && confirm !== password} required fullWidth />{error && <Alert severity="error">{error}</Alert>}<Button type="submit" variant="contained" disabled={!valid || status === "loading"}>{status === "loading" ? <CircularProgress size={22} /> : t("auth.resetSubmit")}</Button></Stack></Box>}</Box>;
}
