import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { queenbColors } from "../theme";

const pinkFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: queenbColors.pinkPale,
    fontWeight: 600,
    "& fieldset": { borderColor: "#f6d3e0" },
    "&:hover fieldset": { borderColor: queenbColors.pink },
    "&.Mui-focused fieldset": { borderColor: queenbColors.pink, borderWidth: 2 },
  },
  "& .MuiInputBase-input": { color: queenbColors.pink, fontWeight: 600 },
  "& .MuiSvgIcon-root": { color: queenbColors.pink },
};

function OfferSlotsDialog({
  open,
  request,
  durationMinutes,
  loading,
  title = "קבלה והצעת זמנים",
  submitLabel = "שליחת זמנים",
  onClose,
  onSubmit,
}) {
  const [startTimes, setStartTimes] = useState([null]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStartTimes([null]);
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
    const parsedStarts = startTimes.map((value) => (value ? value.toDate() : null));

    if (
      parsedStarts.some((date) => !date || Number.isNaN(date.getTime()) || date.getTime() <= Date.now())
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
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EventAvailableIcon sx={{ color: queenbColors.pink }} />
            <span>{title}</span>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack spacing={1.25}>
              <Typography color="text.secondary">
                הציעי לחניכה{" "}
                <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {request?.menteeName || ""}
                </Box>{" "}
                זמן אחד או יותר.
              </Typography>
              <Chip
                label={`${durationMinutes} דקות לפגישה`}
                size="small"
                sx={{
                  alignSelf: "flex-start",
                  bgcolor: queenbColors.pinkPale,
                  color: queenbColors.pink,
                  fontWeight: 600,
                }}
              />
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Stack spacing={1.5}>
              {startTimes.map((startTime, index) => (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid #f6d3e0",
                    bgcolor: "#fff",
                  }}
                >
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: queenbColors.pinkPale,
                      color: queenbColors.pink,
                      fontWeight: 700,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {index + 1}
                  </Box>

                  <DateTimePicker
                    value={startTime}
                    onChange={(value) => setStartTime(index, value && value.isValid() ? value : null)}
                    minDateTime={dayjs()}
                    disabled={loading}
                    ampm={false}
                    format="DD/MM/YYYY HH:mm"
                    slotProps={{
                      textField: {
                        size: "small",
                        required: true,
                        fullWidth: true,
                        inputProps: { "aria-label": `מועד ${index + 1}` },
                        sx: pinkFieldSx,
                      },
                    }}
                  />

                  {startTimes.length > 1 && (
                    <IconButton
                      aria-label="הסרת מועד"
                      onClick={() => removeStartTime(index)}
                      disabled={loading}
                      size="small"
                      sx={{ color: queenbColors.pink }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>

            {startTimes.length < 10 && (
              <Button
                type="button"
                onClick={() => setStartTimes((current) => [...current, null])}
                disabled={loading}
                startIcon={<AddIcon />}
                sx={{
                  py: 1,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: queenbColors.pink,
                  color: queenbColors.pink,
                  "&:hover": {
                    border: "1px dashed",
                    borderColor: queenbColors.pink,
                    bgcolor: queenbColors.pinkPale,
                  },
                }}
              >
                הוספת מועד נוסף
              </Button>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button type="button" onClick={onClose} disabled={loading}>
            ביטול
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: 999, px: 3 }}
          >
            {loading ? "שומרת..." : submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default OfferSlotsDialog;
