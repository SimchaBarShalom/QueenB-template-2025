import React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function AuthForm({
  title,
  subtitle,
  fields,
  values,
  onChange,
  onSubmit,
  submitLabel,
  loading,
  error,
}) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 560, mx: "auto" }}>
      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {fields.map((field) => (
            <TextField
              key={field.name}
              label={field.label}
              name={field.name}
              type={field.type || "text"}
              value={values[field.name]}
              onChange={onChange}
              required
              fullWidth
              inputProps={{ dir: field.type === "email" || field.type === "password" ? "ltr" : "rtl" }}
            />
          ))}

          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? <CircularProgress color="inherit" size={22} /> : submitLabel}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}

export default AuthForm;
