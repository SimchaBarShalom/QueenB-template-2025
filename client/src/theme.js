import { createTheme } from "@mui/material";

const theme = createTheme({
  direction: "rtl",
  palette: {
    primary: {
      main: "#7c2d5a",
    },
    secondary: {
      main: "#0f766e",
    },
    background: {
      default: "#f7f7fb",
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
    fontFamily: "Arial, 'Noto Sans Hebrew', sans-serif",
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

export default theme;

