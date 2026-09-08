import { createTheme } from "@mui/material";

export const queenbColors = {
  pink: "#E6317A",
  pinkLight: "#FF7D9C",
  pinkPale: "#FFE3EC",
  purple: "#715CF3",
  pageBackground: "#FFF8FA",
};

function getTheme(direction = "rtl") {
  return createTheme({
    direction,

    palette: {
      primary: {
        main: queenbColors.pink,
        light: queenbColors.pinkLight,
      },

      secondary: {
        main: queenbColors.purple,
      },

      background: {
        default: queenbColors.pageBackground,
        paper: "#ffffff",
      },

      text: {
        primary: "#1f2937",
        secondary: "#5b6472",
      },
    },

    shape: {
      borderRadius: 8,
    },

    typography: {
      fontFamily: "Arial, 'Noto Sans Hebrew', 'Noto Sans Arabic', sans-serif",

      h3: {
        fontWeight: 800,
      },

      h4: {
        fontWeight: 700,
      },

      h6: {
        fontWeight: 700,
      },

      button: {
        fontWeight: 700,
        textTransform: "none",
      },
    },
  });
}

export default getTheme;