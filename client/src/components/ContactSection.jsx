import React, { useState } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { queenbColors } from "../theme";
import { useLanguage } from "../i18n/LanguageContext";

const initialValues = { name: "", email: "", subject: "", message: "" };

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

function ContactSection() {
  const { t } = useLanguage();
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
        nextErrors[key] = t("validation.required");
      }
    });

    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = t("validation.invalidEmail");
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
          {t("contact.title")}
        </Typography>
        <Typography color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          {t("contact.intro")}
        </Typography>

        {notice && (
          <Alert severity="info" sx={{ mb: 3 }} onClose={() => setNotice(false)}>
            {t("contact.notice")}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              label={t("contact.name")}
              name="name"
              placeholder={t("contact.namePlaceholder")}
              value={values.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name}
              required
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label={t("contact.email")}
              name="email"
              type="email"
              placeholder={t("contact.emailPlaceholder")}
              value={values.email}
              onChange={handleChange}
              error={Boolean(errors.email)}
              helperText={errors.email}
              required
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label={t("contact.subject")}
              name="subject"
              placeholder={t("contact.subjectPlaceholder")}
              value={values.subject}
              onChange={handleChange}
              error={Boolean(errors.subject)}
              helperText={errors.subject}
              required
              fullWidth
              sx={fieldSx}
            />
            <TextField
              label={t("contact.message")}
              name="message"
              placeholder={t("contact.messagePlaceholder")}
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
              {t("contact.submit")}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default ContactSection;
