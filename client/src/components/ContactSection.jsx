import React, { useState } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { queenbColors } from "../theme";

const initialValues = { name: "", email: "", subject: "", message: "" };

const PLACEHOLDERS = {
  name: "לדוגמה: מיכל כהן",
  email: "you@example.com",
  subject: "במה נוכל לעזור?",
  message: "כתבי כאן את השאלה או ההודעה שלך...",
};

// QueenB-pink field borders + light gray placeholders, applied uniformly to
// every field in this form.
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: `${queenbColors.pink}4d` },
    "&:hover fieldset": { borderColor: queenbColors.pink },
    "&.Mui-focused fieldset": { borderColor: queenbColors.pink },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#adb1b8",
    opacity: 1,
  },
};

// There is no /api/contact endpoint on the backend yet. Per the "don't fake
// backend actions" rule, submitting does NOT claim the message was sent -
// it just runs client-side validation and shows an honest note that sending
// isn't wired up yet. Replace handleSubmit's body once a real endpoint
// exists.
function ContactSection() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    Object.entries(values).forEach(([key, value]) => {
      if (!value.trim()) {
        nextErrors[key] = "שדה חובה";
      }
    });

    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "יש להזין אימייל תקין";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setNotice(true);
  };

  return (
    <Box
      id="contact-section"
      sx={{
        scrollMarginTop: 88,
        py: { xs: 6, md: 10 },
        bgcolor: "#fff",
        backgroundImage: `radial-gradient(${queenbColors.pink}30 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      }}
    >
      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
          px: { xs: 2, md: 4 },
          bgcolor: "#fff",
          borderRadius: 4,
          py: { xs: 4, md: 5 },
          boxShadow: "0 24px 60px rgba(230, 49, 122, 0.1)",
        }}
      >
        <Typography variant="h4" component="h2" textAlign="center" sx={{ mb: 1 }}>
          צור קשר
        </Typography>
        <Typography color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          יש לך שאלה על Queens Match? השאירי פרטים ונשמח לחזור אלייך.
        </Typography>

        {notice && (
          <Alert severity="info" sx={{ mb: 3 }} onClose={() => setNotice(false)}>
            טופס יצירת הקשר עדיין אינו מחובר לשרת - הפרטים לא נשלחו בפועל.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label="שם"
              name="name"
              placeholder={PLACEHOLDERS.name}
              value={values.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name}
              required
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="אימייל"
              name="email"
              type="email"
              placeholder={PLACEHOLDERS.email}
              value={values.email}
              onChange={handleChange}
              error={Boolean(errors.email)}
              helperText={errors.email}
              required
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="נושא"
              name="subject"
              placeholder={PLACEHOLDERS.subject}
              value={values.subject}
              onChange={handleChange}
              error={Boolean(errors.subject)}
              helperText={errors.subject}
              required
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label="הודעה"
              name="message"
              placeholder={PLACEHOLDERS.message}
              value={values.message}
              onChange={handleChange}
              error={Boolean(errors.message)}
              helperText={errors.message}
              required
              fullWidth
              multiline
              minRows={4}
              sx={fieldSx}
            />
            <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 999, py: 1.2 }}>
              שליחה
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default ContactSection;
