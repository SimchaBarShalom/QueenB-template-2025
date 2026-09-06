import React from "react";
import { Snackbar, Alert } from "@mui/material";

// Shared feedback for buttons whose backend endpoint doesn't exist yet
// (mentoring requests, scheduling, feedback submission, contact form...).
// Used instead of silently pretending an action succeeded.
function ComingSoonSnackbar({ message, onClose }) {
  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity="info" variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export default ComingSoonSnackbar;
