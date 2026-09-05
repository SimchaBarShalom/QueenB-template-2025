import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { useLanguage } from "../i18n/LanguageContext";
import { queenbColors } from "../theme";

// The sticker badge enters with a small slide/scale/rotate, then settles
// into a very gentle infinite float so it stays lively without being
// distracting.
const stickerEnter = keyframes`
  0% { opacity: 0; transform: translateY(26px) scale(0.6) rotate(-18deg); }
  70% { opacity: 1; transform: translateY(-6px) scale(1.05) rotate(6deg); }
  100% { opacity: 1; transform: translateY(0) scale(1) rotate(-6deg); }
`;

const stickerFloat = keyframes`
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50% { transform: translateY(-10px) rotate(-2deg); }
`;

// A repeating square grid, built purely from two layered CSS gradients
// (no image file needed) to echo the grid pattern used on queenb.org.il.
const gridBackgroundSx = {
  backgroundColor: queenbColors.pinkPale,
  backgroundImage:
    `linear-gradient(90deg, ${queenbColors.pinkLight}55 1px, transparent 1px), ` +
    `linear-gradient(0deg, ${queenbColors.pinkLight}55 1px, transparent 1px)`,
  backgroundSize: "26px 26px",
};

function CodeWindow() {
  const { t } = useLanguage();

  return (
    <Box
      sx={{
        bgcolor: "#22222e",
        borderRadius: 3,
        boxShadow: "0 20px 45px rgba(31, 15, 25, 0.28)",
        width: { xs: 240, sm: 320 },
        overflow: "hidden",
      }}
    >
      <Stack direction="row" spacing={0.8} sx={{ px: 1.5, py: 1, bgcolor: "#16161f" }}>
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#ff5f57" }} />
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#febc2e" }} />
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#28c840" }} />
      </Stack>
      <Box
        sx={{
          p: 2,
          fontFamily: "'Courier New', monospace",
          fontSize: 13,
          lineHeight: 1.9,
          direction: "ltr",
          textAlign: "left",
        }}
      >
        <Box sx={{ color: "#8be9fd" }}>{"<QueensMatch>"}</Box>
        <Box sx={{ color: "#f8f8f2", pl: 2.5 }}>{t("hero.codeBody")}</Box>
        <Box sx={{ color: "#8be9fd" }}>{"</QueensMatch>"}</Box>
      </Box>
    </Box>
  );
}

function StickerBadge() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: { xs: 8, md: 20 },
        insetInlineEnd: { xs: 8, md: 20 },
        width: { xs: 76, md: 100 },
        height: { xs: 76, md: 100 },
        borderRadius: "50%",
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 12px 28px ${queenbColors.pink}59`,
        animation: `${stickerEnter} 0.9s ease-out both, ${stickerFloat} 4.5s ease-in-out 0.9s infinite`,
      }}
    >
      <Box component="img" src="/assets/queenb/queenb-favicon.png" alt="QueenB" sx={{ width: "60%" }} />
    </Box>
  );
}

function HeroVisual() {
  return (
    <Box
      sx={{
        position: "relative",
        ...gridBackgroundSx,
        borderRadius: 4,
        minHeight: { xs: 300, md: 420 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* A second, faded window peeking out behind the front one gives the
          "overlapping browser windows" look from the reference site. */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: 24, md: 46 },
          insetInlineStart: { xs: 16, md: 36 },
          transform: "rotate(-7deg)",
          opacity: 0.5,
          display: { xs: "none", sm: "block" },
        }}
      >
        <CodeWindow />
      </Box>

      <Box sx={{ transform: "rotate(2deg)" }}>
        <CodeWindow />
      </Box>

      <Box
        component="img"
        src="/assets/queenb/decorative-arrow.svg"
        alt=""
        aria-hidden="true"
        sx={{
          position: "absolute",
          bottom: { xs: 8, md: 22 },
          insetInlineStart: { xs: 8, md: 24 },
          width: { xs: 80, md: 120 },
          opacity: 0.9,
        }}
      />

      <StickerBadge />
    </Box>
  );
}

function HeroSection() {
  const { t } = useLanguage();

  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: { xs: 4, md: 8 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        gap: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
        <Typography variant="h3" component="h1" sx={{ mb: 2, lineHeight: 1.25 }}>
          {t("hero.headline")}
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 400, mb: 4, lineHeight: 1.8, maxWidth: 520 }}
        >
          {t("hero.body")}
        </Typography>
        <Button
          component={RouterLink}
          to="/register/mentee"
          variant="contained"
          size="large"
          sx={{ px: 4, py: 1.4, borderRadius: 999, fontSize: 18 }}
        >
          {t("hero.cta")}
        </Button>
      </Box>

      <Box sx={{ flex: 1, width: "100%", minWidth: 0 }}>
        <HeroVisual />
      </Box>
    </Box>
  );
}

export default HeroSection;