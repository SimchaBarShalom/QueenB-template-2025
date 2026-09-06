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

function localDateTimeMinimum() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 16);
}

function OfferSlotsDialog({ open, request, durationMinutes, loading, onClose, onSubmit }) {
  const [startTimes, setStartTimes] = useState([""]);
  const [error, setError] = useState("");

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
      setError("יש לבחור זמנים עתידיים תקינים.");
      return;
    }

    if (new Set(parsedStarts.map((date) => date.getTime())).size !== parsedStarts.length) {
      setError("לא ניתן להציע את אותו זמן פעמיים.");
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
        <DialogTitle>קבלה והצעת זמנים</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              הציעי לחניכה {request?.menteeName || ""} זמן אחד או יותר. כל פגישה אורכת{" "}
              {durationMinutes} דקות.
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            {startTimes.map((startTime, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <TextField
                  type="datetime-local"
                  label={`מועד ${index + 1}`}
                  value={startTime}
                  onChange={(event) => setStartTime(index, event.target.value)}
                  inputProps={{ min: localDateTimeMinimum() }}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />
                {startTimes.length > 1 && (
                  <IconButton
                    aria-label="הסרת מועד"
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
                הוספת מועד נוסף
              </Button>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose} disabled={loading}>
            ביטול
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "שומרת..." : "שליחת זמנים"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default OfferSlotsDialog;
