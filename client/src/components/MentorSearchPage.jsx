import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import MentorCard from "./MentorCard";
import { AppPage, AppPageHeader, AppSurface } from "./AppPrimitives";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";

const initialFilters = {
  jobTitle: "",
  workplace: "",
  topic: "",
};

function MentorSearchPage() {
  const [filters, setFilters] = useState(initialFilters);

  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = JSON.parse(
    localStorage.getItem("queensMatchUser") || "null"
  );

  const menteeId = currentUser?.id;

  useEffect(() => {
    async function loadData() {
      if (!menteeId) {
        setError("לא נמצאה משתמשת מחוברת.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [mentorsResponse, requestsResponse] =
          await Promise.all([
            axios.get("/api/mentors"),
            axios.get(
              `/api/mentoring-requests/mentee/${menteeId}`
            ),
          ]);

        setMentors(mentorsResponse.data);
        setRequests(requestsResponse.data);
      } catch (requestError) {
        console.error(requestError);
        setError("לא הצלחנו לטעון את המנטוריות.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [menteeId]);

const getRequestStatus = useCallback((mentorProfileId) => {
    const mentorRequests = requests
      .filter(
        (request) =>
          request.mentorProfileId === mentorProfileId
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );

    if (mentorRequests.length === 0) {
      return "none";
    }

    const latestRequest = mentorRequests[0];

    if (
      latestRequest.status ===
        "WAITING_FOR_MENTOR_SLOTS" ||
      latestRequest.status ===
        "WAITING_FOR_MENTEE_SELECTION"
    ) {
      return "pending";
    }

    if (
      latestRequest.status === "MATCHED" ||
      latestRequest.status ===
        "ATTENDANCE_CONFIRMED"
    ) {
      return "scheduled";
    }

    if (latestRequest.status === "CANCELLED") {
      const extraSlotsUsed = (latestRequest.schedulingRounds || []).some(
        (round) => round.type === "EXTRA_SLOTS"
      );
      const updatedAt = new Date(latestRequest.updatedAt);
      const now = new Date();
      const thisMonth =
        updatedAt.getFullYear() === now.getFullYear() &&
        updatedAt.getMonth() === now.getMonth();

      if (extraSlotsUsed && thisMonth) {
        return "blocked";
      }
    }

    return "none";
  }, [requests]);

  const mentorsWithStatus = useMemo(() => {
    return mentors.map((mentor) => {
      const pairStatus = getRequestStatus(
        mentor.mentorProfileId
      );

      return {
        ...mentor,
        requestStatus:
          mentor.isFull && pairStatus === "none"
            ? "full"
            : pairStatus,
      };
    });
  }, [mentors, getRequestStatus]);

  const jobTitles = useMemo(() => {
    return Array.from(
      new Set(
        mentors
          .map((mentor) => mentor.jobTitle)
          .filter(Boolean)
      )
    );
  }, [mentors]);

  const workplaces = useMemo(() => {
    return Array.from(
      new Set(
        mentors
          .map((mentor) => mentor.workplace)
          .filter(Boolean)
      )
    );
  }, [mentors]);

  const mentoringTopics = useMemo(() => {
    return Array.from(
      new Set(
        mentors.flatMap(
          (mentor) => mentor.mentoringTopics || []
        )
      )
    );
  }, [mentors]);

  const filteredMentors = useMemo(() => {
    return mentorsWithStatus.filter((mentor) => {
      if (
        filters.jobTitle &&
        mentor.jobTitle !== filters.jobTitle
      ) {
        return false;
      }

      if (
        filters.workplace &&
        mentor.workplace !== filters.workplace
      ) {
        return false;
      }

      if (
        filters.topic &&
        !mentor.mentoringTopics.includes(
          filters.topic
        )
      ) {
        return false;
      }

      return true;
    });
  }, [mentorsWithStatus, filters]);

  const handleRequestClick = async (mentor) => {
    try {
      setError("");

      const response = await axios.post(
        "/api/mentoring-requests",
        {
          menteeId,
          mentorProfileId: mentor.mentorProfileId,
        }
      );

      setRequests((current) => [
        response.data,
        ...current,
      ]);
    } catch (requestError) {
      console.error(requestError);
      setError(
        getRequestErrorMessage(requestError, "שליחת בקשת הפגישה נכשלה.")
      );
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          py: 8,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AppPage>
        <AppPageHeader title="חיפוש מנטוריות" subtitle="מצאי מנטורית לפי תפקיד, חברה או תחום מקצועי." />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <AppSurface
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr 1fr",
            },
            gap: 2,
            mb: 4,
            p: 2,
          }}
        >
          <TextField
            select
            label="תפקיד"
            value={filters.jobTitle}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                jobTitle: event.target.value,
              }))
            }
            fullWidth
          >
            <MenuItem value="">הכל</MenuItem>

            {jobTitles.map((title) => (
              <MenuItem
                key={title}
                value={title}
              >
                {title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="חברה"
            value={filters.workplace}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                workplace: event.target.value,
              }))
            }
            fullWidth
          >
            <MenuItem value="">הכל</MenuItem>

            {workplaces.map((workplace) => (
              <MenuItem
                key={workplace}
                value={workplace}
              >
                {workplace}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="תחום מנטורינג"
            value={filters.topic}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                topic: event.target.value,
              }))
            }
            fullWidth
          >
            <MenuItem value="">הכל</MenuItem>

            {mentoringTopics.map((topic) => (
              <MenuItem
                key={topic}
                value={topic}
              >
                {topic}
              </MenuItem>
            ))}
          </TextField>
        </AppSurface>

        {filteredMentors.length === 0 ? (
          <Typography color="text.secondary">
            לא נמצאו מנטוריות מתאימות.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              },
              gap: 3,
            }}
          >
            {filteredMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onRequestClick={
                  handleRequestClick
                }
              />
            ))}
          </Box>
        )}
    </AppPage>
  );
}

export default MentorSearchPage;
