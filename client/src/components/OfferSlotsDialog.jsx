import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useLanguage } from "../i18n/LanguageContext";

function localDateTimeMinimum() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 16);
}

function OfferSlotsDialog({
  open,
  request,
  durationMinutes,
  loading,
  title,
  submitLabel,
  onClose,
  onSubmit,
}) {
  const { t } = useLanguage();
  const [startTimes, setStartTimes] = useState([""]);
  const [error, setError] = useState("");
  const dialogTitle = title || t("meetings.offerTitle");
  const dialogSubmit = submitLabel || t("meetings.offerSubmit");

  useEffect(() => {
    if (open) {
      setStartTimes([""]);
      setError("");
    }
  }, [open, request?.id]);

  const setStartTime = (index, value) => {
    setStartTimes((current) =>
      current.map((startTime, itemIndex) => (itemIndex === index ? value : startTime))
    );
    setError("");
  };

  const removeStartTime = (index) => {
    setStartTimes((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedStarts = startTimes.map((value) => new Date(value));

    if (
      startTimes.some((value) => !value) ||
      parsedStarts.some((date) => Number.isNaN(date.getTime()) || date.getTime() <= Date.now())
    ) {
      setError(t("validation.futureTimes"));
      return;
    }

    if (new Set(parsedStarts.map((date) => date.getTime())).size !== parsedStarts.length) {
      setError(t("validation.duplicateTimes"));
      return;
    }

    const slots = parsedStarts.map((startTime) => ({
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + durationMinutes * 60000).toISOString(),
    }));

    const succeeded = await onSubmit(slots);
    if (succeeded) onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              {t("meetings.offerHelp", { name: request?.menteeName || "", minutes: durationMinutes })}
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            {startTimes.map((startTime, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <TextField
                  type="datetime-local"
                  label={t("meetings.slotLabel", { index: index + 1 })}
                  value={startTime}
                  onChange={(event) => setStartTime(index, event.target.value)}
                  inputProps={{ min: localDateTimeMinimum() }}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
                {startTimes.length > 1 && (
                  <IconButton
                    aria-label={t("meetings.removeSlot")}
                    onClick={() => removeStartTime(index)}
                    disabled={loading}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                )}
              </Stack>
            ))}

            {startTimes.length < 10 && (
              <Button
                type="button"
                variant="text"
                onClick={() => setStartTimes((current) => [...current, ""])}
                disabled={loading}
                sx={{ alignSelf: "flex-start" }}
              >
                {t("meetings.addSlot")}
              </Button>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? t("common.saving") : dialogSubmit}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default OfferSlotsDialog;
