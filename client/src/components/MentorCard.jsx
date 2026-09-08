import React, { useState } from "react";

import {
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

import { queenbColors } from "../theme";
import { AppSurface } from "./AppPrimitives";
import { useLanguage } from "../i18n/LanguageContext";

// מיפוי בין סטטוס הבקשה לבין הטקסט שיופיע בכפתור.
// pending = נשלחה בקשה ועדיין מחכים למנטורית.
// scheduled = כבר נקבעה פגישה.
const STATUS_KEYS = {
  pending: "mentors.pending",
  scheduled: "mentors.scheduled",
  blocked: "mentors.blocked",
  full: "mentors.full",
};

// requestStatus is "none" | "pending" | "scheduled" | "blocked", scoped to this
// mentee+mentor pair, except "full" which is a global mentor status.
function MentorCard({ mentor, onRequestClick }) {
  const { t } = useLanguage();
  // פירוק הפרטים שאנחנו צריכות מתוך אובייקט המנטורית.
  const {
    fullName,
    jobTitle,
    workplace,
    mentoringTopics,
    githubUrl,
    linkedinUrl,
    technologies,
    requestStatus,
    remainingCapacity,
    isFull,
    background,
  } = mentor;
  const [expanded, setExpanded] = useState(false);

  return (
    // הכרטיס הראשי של המנטורית.
    <AppSurface
      sx={{
        // רווח פנימי בתוך הכרטיס.
        p: 3,

        // עיגול הפינות.

        // הכרטיס יתפוס את כל הגובה הזמין.
        height: "100%",

        // Flex מאפשר לנו לשים את הכפתור תמיד בתחתית הכרטיס.
        display: "flex",
        flexDirection: "column",

        // צבע המסגרת של הכרטיס.
      }}
    >
      {/* שם המנטורית */}
      <Typography
        variant="h6"
        component="h3"
      >
        {fullName}
      </Typography>

      {/* תפקיד ומקום עבודה */}
      <Typography
        color="text.secondary"
        sx={{
          mb: 1.5,
        }}
      >
        {jobTitle} · {workplace}
      </Typography>

      <Typography variant="body2" sx={{ mb: 1.5, display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: expanded ? "unset" : 2, overflow: "hidden", whiteSpace: "pre-wrap" }}>
        {background}
      </Typography>
      {background && background.length > 120 && (
        <ButtonBaseReadMore expanded={expanded} onClick={() => setExpanded((value) => !value)} label={expanded ? t("mentors.readLess") : t("mentors.readMore")} />
      )}

      {/* תחומי המנטורינג של המנטורית */}
      <Stack
        direction="row"
        spacing={1}
        flexWrap="wrap"
        rowGap={1}
        sx={{
          mb: 1.5,
        }}
      >
        {mentoringTopics.map((topic) => (
          // כל תחום מנטורינג מוצג כ-Chip קטן.
          <Chip
            key={topic}
            label={topic}
            size="small"
            sx={{
              // רקע ורוד בהיר.
              bgcolor: queenbColors.pinkPale,

              // טקסט ורוד.
              color: queenbColors.pink,

              fontWeight: 600,
            }}
          />
        ))}
      </Stack>

      {/* הטכנולוגיות שהמנטורית מכירה */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 1.5,
        }}
      >
        {technologies.join(" | ")}
      </Typography>

      {typeof remainingCapacity === "number" && (
        <Chip
          label={`מקומות פנויים החודש: ${remainingCapacity}`}
          size="small"
          variant="outlined"
          sx={{ alignSelf: "flex-start", mb: 1.5, borderColor: "#f6d3e0", color: "text.secondary" }}
        />
      )}

      <Stack direction="row" spacing={0.5} sx={{ mb: 2.5 }}>
        {githubUrl && (
          <IconButton
            component="a"
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            aria-label="GitHub"
          >
            <GitHubIcon fontSize="small" />
          </IconButton>
        )}

        {/* אם למנטורית יש LinkedIn, נציג אייקון */}
        {linkedinUrl && (
          <IconButton
            component="a"
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            aria-label="LinkedIn"
          >
            <LinkedInIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {/* אזור הכפתור בתחתית הכרטיס */}
      <Box
        sx={{
          // דוחף את הכפתור לתחתית הכרטיס.
          mt: "auto",
        }}
      >
        {requestStatus === "none" && !isFull ? (
          // אם עדיין אין בקשה פעילה למנטורית,
          // מציגים כפתור ורוד שאפשר ללחוץ עליו.
          <Box
            component="button"
            type="button"
            onClick={() => onRequestClick(mentor)}
            sx={{
              // הכפתור תופס את כל רוחב הכרטיס.
              width: "100%",

              // בלי מסגרת ברירת מחדל של button.
              border: 0,

              // כפתור מעוגל.
              borderRadius: 999,

              // גובה פנימי.
              py: 1.1,

              // צבע ורוד פעיל.
              bgcolor: "primary.main",

              // טקסט לבן.
              color: "#fff",

              fontWeight: 700,
              fontSize: 14,

              // מראה של כפתור פעיל.
              cursor: "pointer",

              // שינוי צבע בזמן hover.
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            {t("mentors.requestButton")}
          </Box>
        ) : (
          // אם כבר קיימת בקשה או פגישה,
          // מציגים כפתור disabled שלא ניתן ללחוץ עליו.
          <Box
            component="button"
            type="button"
            disabled
            sx={{
              width: "100%",
              border: 0,
              borderRadius: 999,
              py: 1.1,

              // אם הפגישה כבר נקבעה,
              // הכפתור יהיה ירוק בהיר.
              // אם עדיין ממתינים למענה,
              // הכפתור יהיה ורוד בהיר.
              bgcolor:
                requestStatus === "scheduled"
                  ? "#dff4e5"
                  : queenbColors.pinkPale,

              // גם צבע הטקסט משתנה לפי הסטטוס.
              color:
                requestStatus === "scheduled"
                  ? "#2e7d32"
                  : queenbColors.pink,

              fontWeight: 700,
              fontSize: 14,

              // לא מציגים cursor של לחיצה.
              cursor: "default",

              // שומרים על הצבעים גם כשהכפתור disabled.
              opacity: 1,

              "&:disabled": {
                opacity: 1,
              },
            }}
          >
            {/* הטקסט נקבע לפי הסטטוס */}
            {isFull && requestStatus === "none" ? t("mentors.full") : t(STATUS_KEYS[requestStatus])}
          </Box>
        )}
      </Box>
    </AppSurface>
  );
}

function ButtonBaseReadMore({ label, onClick }) {
  return <Box component="button" type="button" onClick={onClick} sx={{ border: 0, bgcolor: "transparent", color: "primary.main", p: 0, mb: 1.5, alignSelf: "flex-start", cursor: "pointer", fontWeight: 700 }}>{label}</Box>;
}

// ייצוא הקומפוננטה כדי שנוכל להשתמש בה
// בדף החיפוש ובדשבורד של המנטית.
export default MentorCard;
