import React, { useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, IconButton, Stack, TextField, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";

export default function ForgotPasswordDialog({ open, onClose }) {
  const { t } = useLanguage(); const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState("");
  const close = () => { setEmail(""); setDone(false); setError(""); onClose(); };
  const submit = async (event) => { event.preventDefault(); setLoading(true); setError(""); try { await axios.post("/api/auth/forgot-password", { email }); setDone(true); } catch (_) { setError(t("auth.resetRequestError")); } finally { setLoading(false); } };
  return <Dialog open={open} onClose={close} maxWidth="xs" fullWidth><Box sx={{ p: 4, position: "relative" }}><IconButton onClick={close} sx={{ position: "absolute", top: 8, insetInlineEnd: 8 }}><CloseIcon /></IconButton><Typography variant="h6" sx={{ mb: 2 }}>{t("auth.resetTitle")}</Typography>{done ? <Alert severity="success">{t("auth.resetRequestSuccess")}</Alert> : <Box component="form" onSubmit={submit}><Stack spacing={2}><Typography variant="body2">{t("auth.resetRequestBody")}</Typography><TextField label={t("auth.emailAddress")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />{error && <Alert severity="error">{error}</Alert>}<Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={22} /> : t("auth.sendReset")}</Button></Stack></Box>}</Box></Dialog>;
}
