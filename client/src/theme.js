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
      fontFamily: "Assistant, 'Noto Sans Hebrew', Arial, sans-serif",

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
        fontWeight: 400,
        textTransform: "none",
      },
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, minHeight: 36, fontWeight: 400 },
          contained: { fontWeight: 700 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: { borderColor: "#f1d1dd" },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { backgroundColor: "#fff", borderRadius: 8 },
          notchedOutline: { borderColor: "#f1d1dd" },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottomColor: "#f3d9e3", paddingTop: 12, paddingBottom: 12 },
          head: { fontWeight: 700, color: "#1f2937", backgroundColor: "#fff8fb" },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 6, fontWeight: 700 } },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 8, borderColor: "#f1d1dd", boxShadow: "0 8px 24px rgba(74, 31, 52, 0.055)" },
        },
      },
    },
  });
}

export default getTheme;
