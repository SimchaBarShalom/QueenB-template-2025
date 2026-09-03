import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

function HomePage() {
  const [serverState, setServerState] = useState({ loading: true, error: "", message: "" });

  useEffect(() => {
    let isMounted = true;

    axios
      .get("/api/health")
      .then((response) => {
        if (isMounted) {
          setServerState({ loading: false, error: "", message: response.data.message });
        }
      })
      .catch(() => {
        if (isMounted) {
          setServerState({ loading: false, error: "לא ניתן להתחבר לשרת כרגע.", message: "" });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 2 }}>
          Queens Match
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
          תשתית ראשונית לחיבור בין חניכות, מנטוריות וצוות QueenB. בשלב זה המערכת כוללת כניסה,
          הרשמה ותשתית משותפת להמשך פיתוח.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button component={RouterLink} to="/login" variant="contained" size="large">
          כניסה למערכת
        </Button>
        <Button component={RouterLink} to="/register/mentee" variant="outlined" size="large">
          הרשמת חניכה
        </Button>
        <Button component={RouterLink} to="/register/mentor" variant="outlined" size="large">
          הרשמת מנטורית
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">מצב תשתית</Typography>
          <Divider />
          {serverState.loading && (
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={22} />
              <Typography>בודקת חיבור לשרת...</Typography>
            </Stack>
          )}
          {serverState.error && <Alert severity="error">{serverState.error}</Alert>}
          {serverState.message && <Alert severity="success">{serverState.message}</Alert>}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default HomePage;
