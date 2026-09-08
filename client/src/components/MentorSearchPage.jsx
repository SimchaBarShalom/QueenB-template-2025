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
  Pagination,
  TextField,
  Typography,
} from "@mui/material";

import MentorCard from "./MentorCard";
import { AppPage, AppPageHeader, AppSurface } from "./AppPrimitives";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";
import { useLanguage } from "../i18n/LanguageContext";

const initialFilters = {
  jobTitle: "",
  workplace: "",
  topic: "",
};

function MentorSearchPage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState(initialFilters);

  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pageCount: 1, total: 0 });

  const currentUser = JSON.parse(
    localStorage.getItem("queensMatchUser") || "null"
  );

  const menteeId = currentUser?.id;

  useEffect(() => {
    async function loadData() {
      if (!menteeId) {
        setError(t("errors.noUser"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [mentorsResponse, requestsResponse] =
          await Promise.all([
            axios.get("/api/mentors", { params: { page, pageSize: 12, ...filters } }),
            axios.get(
              `/api/mentoring-requests/mentee/${menteeId}`
            ),
          ]);

        setMentors(mentorsResponse.data.data || mentorsResponse.data);
        setPagination(mentorsResponse.data.pagination || { pageCount: 1, total: mentorsResponse.data.length });
        setRequests(requestsResponse.data.data || requestsResponse.data);
      } catch (requestError) {
        console.error(requestError);
        setError(t("errors.loadMentors"));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [menteeId, page, filters, t]);

  const changeFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

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

  const filteredMentors = mentorsWithStatus;

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
        getRequestErrorMessage(requestError, t("errors.sendRequest"), t)
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
        <AppPageHeader title={t("mentors.title")} subtitle={t("mentors.subtitle")} />

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
            label={t("mentors.jobTitle")}
            value={filters.jobTitle}
            onChange={(event) =>
              changeFilter("jobTitle", event.target.value)
            }
            fullWidth
          >
            <MenuItem value="">{t("common.all")}</MenuItem>

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
            label={t("mentors.company")}
            value={filters.workplace}
            onChange={(event) =>
              changeFilter("workplace", event.target.value)
            }
            fullWidth
          >
            <MenuItem value="">{t("common.all")}</MenuItem>

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
            label={t("mentors.topic")}
            value={filters.topic}
            onChange={(event) =>
              changeFilter("topic", event.target.value)
            }
            fullWidth
          >
            <MenuItem value="">{t("common.all")}</MenuItem>

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
            {t("mentors.noMentorsFound")}
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
        {pagination.pageCount > 1 && (
          <Pagination sx={{ mt: 4, display: "flex", justifyContent: "center" }} count={pagination.pageCount} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" />
        )}
    </AppPage>
  );
}

export default MentorSearchPage;
