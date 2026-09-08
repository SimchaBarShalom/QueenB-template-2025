import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { queenbColors } from "../theme";
import { useLanguage } from "../i18n/LanguageContext";

const FAQ_ITEMS = ["audience", "match", "bothRoles", "duration", "switch"];

function FaqSection() {
  const { t } = useLanguage();

  return (
    <Box
      id="faq-section"
      sx={{
        scrollMarginTop: 88,
        py: { xs: 6, md: 10 },
        background: `linear-gradient(160deg, ${queenbColors.pinkPale} 0%, #fff 45%, ${queenbColors.purple}14 100%)`,
      }}
    >
      <Box sx={{ maxWidth: 800, mx: "auto", px: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h2" textAlign="center" sx={{ mb: { xs: 4, md: 6 } }}>
          {t("faq.title")}
        </Typography>

        {FAQ_ITEMS.map((item) => (
          <Accordion
            key={item}
            disableGutters
            sx={{
              mb: 1.5,
              borderRadius: 2,
              "&:before": { display: "none" },
              boxShadow: "none",
              border: "1px solid #f6d3e0",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 700 }}>{t(`faq.${item}Q`)}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{t(`faq.${item}A`)}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}

export default FaqSection;
