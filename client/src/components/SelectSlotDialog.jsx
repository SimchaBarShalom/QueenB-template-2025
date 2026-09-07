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

function SelectSlotDialog({ open, request, selectedSlotId, loading, onSelect, onClose, onSubmit }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>בחירת מועד</DialogTitle>
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
            <Typography color="text.secondary">לא נמצאו זמנים זמינים.</Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>ביטול</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={loading || !selectedSlotId}
        >
          {loading ? "קובעת..." : "קביעת הפגישה"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SelectSlotDialog;
