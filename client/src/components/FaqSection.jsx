import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { queenbColors } from "../theme";

// Edit here to change the FAQ content - one array, easy for anyone on the
// team to update without touching the accordion markup.
const FAQ_ITEMS = [
  {
    question: "למי מיועדת התוכנית?",
    answer: "התוכנית מיועדת לכל חברות קהילת QueenB המעוניינות בליווי וייעוץ מקצועי ממנטורית מנוסה.",
  },
  {
    question: "איך מתבצע החיבור למנטורית?",
    answer:
      "לאחר הרשמה ניתן לחפש מנטורית מתאימה לפי תפקיד, חברה או תחום מנטורינג, ולשלוח בקשת פגישה.",
  },
  {
    question: "האם אפשר להיות גם מנטית וגם מנטורית?",
    answer: "כן. אותו חשבון יכול לשמש גם לקבלת ליווי כמנטית וגם למתן ליווי כמנטורית.",
  },
  {
    question: "כמה זמן נמשך תהליך הליווי?",
    answer: "משך התהליך משתנה בהתאם לצרכים ולזמינות, ונקבע יחד עם המנטורית המתאימה.",
  },
  {
    question: "האם ניתן להחליף מנטורית?",
    answer: "כן, ניתן לפנות ולבקש התאמה למנטורית אחרת בכל שלב בתהליך.",
  },
];

function FaqSection() {
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
          שאלות נפוצות
        </Typography>

        {FAQ_ITEMS.map((item) => (
          <Accordion
            key={item.question}
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
              <Typography sx={{ fontWeight: 700 }}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}

export default FaqSection;
