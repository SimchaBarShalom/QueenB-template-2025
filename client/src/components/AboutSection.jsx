import React from "react";
import { Box, Card, Stack, Typography } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SchoolIcon from "@mui/icons-material/School";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupsIcon from "@mui/icons-material/Groups";
import { queenbColors } from "../theme";
import { useLanguage } from "../i18n/LanguageContext";

const ABOUT_CARDS = [
  { icon: FavoriteIcon, titleKey: "about.personalTitle", textKey: "about.personalText" },
  { icon: SchoolIcon, titleKey: "about.learningTitle", textKey: "about.learningText" },
  { icon: TrendingUpIcon, titleKey: "about.growthTitle", textKey: "about.growthText" },
  { icon: GroupsIcon, titleKey: "about.communityTitle", textKey: "about.communityText" },
];

function AboutSection() {
  const { t } = useLanguage();

  return (
    <Box
      id="about-section"
      sx={{
        scrollMarginTop: 88,
        py: { xs: 6, md: 10 },
        bgcolor: "#fff",
        backgroundImage:
          `linear-gradient(90deg, ${queenbColors.pinkLight}22 1px, transparent 1px), ` +
          `linear-gradient(0deg, ${queenbColors.pinkLight}22 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h2" textAlign="center" sx={{ mb: 2 }}>
          {t("about.title")}
        </Typography>
        <Typography
          color="text.secondary"
          textAlign="center"
          sx={{ maxWidth: 640, mx: "auto", mb: { xs: 4, md: 6 }, fontSize: 18 }}
        >
          {t("about.intro")}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 3,
          }}
        >
          {ABOUT_CARDS.map(({ icon: Icon, titleKey, textKey }) => (
            <Card
              key={titleKey}
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 3,
                textAlign: "center",
                borderColor: "#f6d3e0",
                height: "100%",
              }}
            >
              <Stack alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: queenbColors.pinkPale,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon sx={{ color: queenbColors.pink, fontSize: 28 }} />
                </Box>
                <Typography variant="h6" component="h3">
                  {t(titleKey)}
                </Typography>
                <Typography color="text.secondary">{t(textKey)}</Typography>
              </Stack>
            </Card>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default AboutSection;
