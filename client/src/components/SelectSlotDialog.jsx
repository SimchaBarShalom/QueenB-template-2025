import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import { useLanguage } from "../i18n/LanguageContext";

function SelectSlotDialog({ open, request, selectedSlotId, loading, onSelect, onClose, onSubmit }) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("meetings.selectTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          {(request?.offeredSlots || []).map((slot) => (
            <Button
              key={slot.id}
              variant={selectedSlotId === slot.id ? "contained" : "outlined"}
              onClick={() => onSelect(slot.id)}
              sx={{ justifyContent: "flex-start" }}
              startIcon={<Radio checked={selectedSlotId === slot.id} />}
            >
              {slot.date} | {slot.startTime}–{slot.endTime}
            </Button>
          ))}
          {(request?.offeredSlots || []).length === 0 && (
            <Typography color="text.secondary">{t("meetings.noSlots")}</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t("common.cancel")}</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading || !selectedSlotId}
        >
          {loading ? t("meetings.scheduling") : t("meetings.confirmMeeting")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SelectSlotDialog;
