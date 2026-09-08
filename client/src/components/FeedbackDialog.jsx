import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLanguage } from "../i18n/LanguageContext";

function FeedbackDialog({ open, loading, onClose, onSubmit }) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) {
      setRating(0);
      setText("");
    }
  }, [open]);

  const handleSubmit = async () => {
    const succeeded = await onSubmit({ rating, text });
    if (succeeded) onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("meetings.feedbackTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Stack spacing={0.5}>
            <Typography>{t("meetings.rating")}</Typography>
            <Rating
              value={rating}
              onChange={(_, value) => setRating(value || 0)}
              size="large"
            />
          </Stack>
          <TextField
            label={t("meetings.noteOptional")}
            value={text}
            onChange={(event) => setText(event.target.value)}
            multiline
            minRows={3}
            inputProps={{ maxLength: 1000 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading || rating === 0}>
          {loading ? t("common.saving") : t("meetings.sendFeedback")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FeedbackDialog;
