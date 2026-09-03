import { createTheme } from "@mui/material";

const theme = createTheme({
  direction: "rtl",
  palette: {
    primary: {
      main: "#d81b60",
    },
    secondary: {
      main: "#7b1fa2",
    },
    background: {
      default: "#fff7fb",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

export default theme;


