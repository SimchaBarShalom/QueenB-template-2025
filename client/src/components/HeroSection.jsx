import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { useLanguage } from "../i18n/LanguageContext";


/* =========================================================
   ARROW ANIMATION
========================================================= */

const drawArrow = keyframes`
  0% {
    stroke-dashoffset: 600;
    opacity: 0;
  }

  8% {
    opacity: 1;
  }

  62% {
    stroke-dashoffset: 0;
    opacity: 1;
  }

  82% {
    stroke-dashoffset: 0;
    opacity: 1;
  }

  100% {
    stroke-dashoffset: 0;
    opacity: 0;
  }
`;

const drawArrowHead = keyframes`
  0%, 48% {
    stroke-dashoffset: 80;
    opacity: 0;
  }

  60% {
    stroke-dashoffset: 0;
    opacity: 1;
  }

  82% {
    stroke-dashoffset: 0;
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`;

/* =========================================================
   CODE HELPERS
========================================================= */

function CodeLine({ children, indent = false, direction }) {
  return (
    <Box
      component="div"
      dir={direction}
      sx={{
        display: "block",
        direction,
        textAlign: direction === "rtl" ? "right" : "left",
        ps: indent ? 2.5 : 0,
      }}
    >
      {children}
    </Box>
  );
}

function Symbol({ children }) {
  return (
    <Box component="span" sx={{ color: "#f6f6f3" }}>
      {children}
    </Box>
  );
}

function Component({ children }) {
  return (
    <Box
      component="span"
      sx={{
        color: "#ff68a5",
        fontWeight: 700,
      }}
    >
      {children}
    </Box>
  );
}

function Property({ children }) {
  return (
    <Box component="span" sx={{ color: "#bca8ff" }}>
      {children}
    </Box>
  );
}

function StringColor({ children }) {
  return (
    <Box component="span" sx={{ color: "#ffd56a" }}>
      {children}
    </Box>
  );
}

function ArrayColor({ children }) {
  return (
    <Box component="span" sx={{ color: "#62d7ff" }}>
      {children}
    </Box>
  );
}

/* =========================================================
   CODE WINDOW
========================================================= */

function CodeWindow({ direction }) {
  return (
    <Box
      sx={{
        position: "absolute",

        width: {
          xs: "74%",
          sm: "70%",
          md: "68%",
        },

        top: "17%",
        left: "50%",

        transform: "translateX(-50%)",

        overflow: "hidden",

        borderRadius: 3,

        bgcolor: "#1c1b25",

        boxShadow:
          "0 20px 42px rgba(44,25,40,0.25)",

        zIndex: 5,
      }}
    >
      {/* IDE HEADER */}

      <Box
        sx={{
          height: {
            xs: 34,
            md: 42,
          },

          display: "flex",
          alignItems: "center",

          /*
            שלושת העיגולים בצד ימין
            כי ביקשת שהקוד יהיה RTL.
          */
          justifyContent: "flex-start",

          direction,

          gap: 1,

          px: 2,

          bgcolor: "#302b39",

          borderBottom:
            "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            bgcolor: "#ff5f57",
          }}
        />

        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            bgcolor: "#febc2e",
          }}
        />

        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            bgcolor: "#28c840",
          }}
        />
      </Box>

      {/* CODE */}

      <Box
        dir={direction}
        sx={{
          direction,
          textAlign: direction === "rtl" ? "right" : "left",

          px: {
            xs: 2,
            md: 3,
          },

          py: {
            xs: 2,
            md: 2.5,
          },

          fontFamily:
            'Consolas, "Courier New", monospace',

          fontSize: {
            xs: 8,
            sm: 10,
            md: 12,
            lg: 13,
          },

          lineHeight: 1.9,

          whiteSpace: "nowrap",

          overflow: "hidden",
        }}
      >
        <CodeLine direction={direction}>
          <Symbol>{"<"}</Symbol>
          <Component>QueenMatch</Component>
          <Symbol>{">"}</Symbol>
        </CodeLine>

        <CodeLine indent direction={direction}>
          <Symbol>{"<"}</Symbol>

          <Component>FindMentor</Component>

          <Property> skills</Property>

          <Symbol> = </Symbol>

          <ArrayColor>{"{["}</ArrayColor>

          <StringColor>{'"Code"'}</StringColor>

          <Symbol>, </Symbol>

          <StringColor>{'"Career"'}</StringColor>

          <ArrayColor>{"]}"}</ArrayColor>

          <Symbol> /{">"}</Symbol>
        </CodeLine>

        <CodeLine indent direction={direction}>
          <Symbol>{"<"}</Symbol>

          <Component>
            ScheduleMeeting
          </Component>

          <Property> type</Property>

          <Symbol> = </Symbol>

          <StringColor>
            {'"CoffeeChat"'}
          </StringColor>

          <Symbol> /{">"}</Symbol>
        </CodeLine>

        <CodeLine indent direction={direction}>
          <Symbol>{"<"}</Symbol>

          <Component>Process</Component>

          <Property> action</Property>

          <Symbol> = </Symbol>

          <StringColor>
            {'"Learn & Connect"'}
          </StringColor>

          <Symbol> /{">"}</Symbol>
        </CodeLine>

        <CodeLine indent direction={direction}>
          <Symbol>{"<"}</Symbol>

          <Component>Result</Component>

          <Property> status</Property>

          <Symbol> = </Symbol>

          <StringColor>
            {'"Success!"'}
          </StringColor>

          <Symbol> /{">"}</Symbol>
        </CodeLine>

        <CodeLine direction={direction}>
          <Symbol>{"</"}</Symbol>

          <Component>QueenMatch</Component>

          <Symbol>{">"}</Symbol>
        </CodeLine>
      </Box>
    </Box>
  );
}

/* =========================================================
   DRAWING ARROW
========================================================= */

function DrawingArrow() {
  return (
    <Box
      sx={{
        position: "absolute",

        width: "48%",
        height: "31%",

        left: "25%",

        /*
          הורדנו אותו מהקוד,
          אבל העלינו מספיק כדי שהראש כמעט ייגע
          בקצה התחתון של החלון.
        */
        top: "51%",

        zIndex: 6,

        pointerEvents: "none",
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 500 220"
        aria-hidden="true"
        sx={{
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <Box
          component="path"
          d="
            M20 180

            C65 202,
             105 187,
             145 153

            C180 124,
             215 130,
             240 158

            C265 187,
             303 178,
             334 145

            C362 115,
             373 83,
             410 55
          "
          sx={{
            fill: "none",

            stroke: "#ad2061",
            strokeWidth: 4.5,

            strokeLinecap: "round",
            strokeLinejoin: "round",

            strokeDasharray: 600,
            strokeDashoffset: 600,

            animation:
              `${drawArrow} 2s ease-in-out infinite`,
          }}
        />

        <Box
          component="path"
          d="
            M384 61
            L410 55
            L398 79
          "
          sx={{
            fill: "none",

            stroke: "#ad2061",
            strokeWidth: 4.5,

            strokeLinecap: "round",
            strokeLinejoin: "round",

            strokeDasharray: 80,
            strokeDashoffset: 80,

            animation:
              `${drawArrowHead} 2s ease-in-out infinite`,
          }}
        />
      </Box>
    </Box>
  );
}

/* =========================================================
   LEFT VISUAL
========================================================= */

function HeroVisual({ direction }) {
  return (
    <Box
      sx={{
        position: "relative",

        /*
          ממלא את כל הקולונה השמאלית.
        */
        width: "100%",
        height: "100%",

        minHeight: {
          xs: 380,
          md: 560,
        },

        overflow: "hidden",

        /*
          בלי ריבוע קטן באמצע.
          המשבצות עצמן הן כל השטח.
        */
        backgroundImage: `
          linear-gradient(
            rgba(221,77,132,0.18) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(221,77,132,0.18) 1px,
            transparent 1px
          ),
          radial-gradient(
            circle at 82% 12%,
            rgba(250,150,190,0.24),
            transparent 31%
          ),
          radial-gradient(
            circle at 12% 88%,
            rgba(215,165,240,0.17),
            transparent 30%
          ),
          linear-gradient(
            145deg,
            #fff1f6 0%,
            #fde8f1 48%,
            #fff3f7 100%
          )
        `,

        backgroundSize: `
          44px 44px,
          44px 44px,
          auto,
          auto,
          auto
        `,

        backgroundPosition: "0 0",

        borderRadius: 0,
      }}
    >
      <CodeWindow direction={direction} />

      <DrawingArrow />
    </Box>
  );
}

/* =========================================================
   HERO
========================================================= */

function HeroSection({ onOpenRegister }) {
  const { t, direction } = useLanguage();

  return (
    <Box
      sx={{
        /*
          כל אזור ה-Hero ורוד מתגוון.
        */
        background: `
          radial-gradient(
            circle at 10% 15%,
            rgba(255,185,214,0.20),
            transparent 30%
          ),
          radial-gradient(
            circle at 88% 85%,
            rgba(221,184,240,0.14),
            transparent 31%
          ),
          linear-gradient(
            135deg,
            #fff7fa 0%,
            #fdeef4 48%,
            #fff7fa 100%
          )
        `,

        py: {
          xs: 4,
          md: 8,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,

          mx: "auto",

          px: {
            xs: 2,
            md: 4,
          },

          display: "flex",

          flexDirection: {
            xs: "column",
            md: "row",
          },

          /*
            גורם לשני הצדדים להיות באותו גובה,
            ולכן המשבצות ממלאות את כל הצד השמאלי.
          */
          alignItems: {
            xs: "center",
            md: "stretch",
          },

          gap: {
            xs: 4,
            md: 6,
          },
        }}
      >
        {/* RIGHT SIDE - נשאר בדיוק כמו שלך */}

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            width: "100%",

            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              mb: 2,
              lineHeight: 1.25,
            }}
          >
            {t("hero.headline")}
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              fontWeight: 400,
              mb: 4,
              lineHeight: 1.8,
              maxWidth: 520,
            }}
          >
            {t("hero.body")}
          </Typography>

          <Button
            onClick={onOpenRegister}
            variant="contained"
            size="large"
            sx={{
              px: 4,
              py: 1.4,
              borderRadius: 999,
              fontSize: 18,
              alignSelf: "flex-start",
            }}
          >
            {t("hero.cta")}
          </Button>
        </Box>

        {/* LEFT SIDE */}

        <Box
          sx={{
            flex: 1,

            width: "100%",
            minWidth: 0,

            display: "flex",

            alignSelf: "stretch",

            overflow: "hidden",
          }}
        >
          <HeroVisual direction={direction} />
        </Box>
      </Box>
    </Box>
  );
}

export default HeroSection;