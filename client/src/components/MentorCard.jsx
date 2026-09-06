import React from "react";
import { Box, Card, Chip, IconButton, Stack, Typography } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { queenbColors } from "../theme";

const STATUS_LABELS = {
  pending: "ממתין למענה",
  scheduled: "נקבעה פגישה",
  blocked: "לא ניתן לקבוע החודש",
};

// requestStatus is "none" | "pending" | "scheduled", scoped to this
// mentee+mentor pair - never a global mentor status.
function MentorCard({ mentor, onRequestClick }) {
  const { fullName, jobTitle, workplace, mentoringTopics, githubUrl, linkedinUrl, technologies, requestStatus } =
    mentor;

  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderColor: "#f6d3e0",
      }}
    >
      <Typography variant="h6" component="h3">
        {fullName}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 1.5 }}>
        {jobTitle} · {workplace}
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mb: 1.5 }}>
        {mentoringTopics.map((topic) => (
          <Chip
            key={topic}
            label={topic}
            size="small"
            sx={{ bgcolor: queenbColors.pinkPale, color: queenbColors.pink, fontWeight: 600 }}
          />
        ))}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {technologies.join(" | ")}
      </Typography>

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

      <Box sx={{ mt: "auto" }}>
        {requestStatus === "none" ? (
          <Box
            component="button"
            type="button"
            onClick={() => onRequestClick(mentor)}
            sx={{
              width: "100%",
              border: 0,
              borderRadius: 999,
              py: 1.1,
              bgcolor: "primary.main",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            בקשת פגישה
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              textAlign: "center",
              borderRadius: 999,
              py: 1.1,
              bgcolor: queenbColors.pinkPale,
              color: "text.secondary",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {STATUS_LABELS[requestStatus]}
          </Box>
        )}
      </Box>
    </Card>
  );
}

export default MentorCard;
