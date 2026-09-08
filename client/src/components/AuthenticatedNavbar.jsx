import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import RoleNavbar from "./RoleNavbar";
import { isMentorUser } from "../utils/areaRouting";
import {
  MENTOR_MEETING_TABS,
  MENTOR_MEETINGS_PATH,
  getMentorMeetingTabFromSearch,
  getMentorMeetingsPath,
  MENTEE_MEETING_TABS,
  MENTEE_MEETINGS_PATH,
  getMenteeMeetingTabFromSearch,
  getMenteeMeetingsPath,
} from "../utils/meetingNav";
import { useLanguage } from "../i18n/LanguageContext";
import { connectGoogleCalendar, getGoogleCalendarStatus } from "../services/googleCalendarService";
import getRequestErrorMessage from "../utils/getRequestErrorMessage";

function AuthenticatedNavbar({ currentUser, onLogout }) {
  const location = useLocation();
  const { t } = useLanguage();
  const mentor = isMentorUser(currentUser);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  useEffect(() => {
    if (!mentor || currentUser?.isAdmin) return undefined;
    getGoogleCalendarStatus().then(({ connected }) => setCalendarConnected(Boolean(connected))).catch(() => setCalendarConnected(false));
    return undefined;
  }, [mentor, currentUser?.isAdmin]);
  const showingMentorArea = mentor && !location.pathname.startsWith("/mentee");
  const homePath = showingMentorArea ? "/mentor" : "/mentee";
  const activeMentorTab =
    location.pathname === MENTOR_MEETINGS_PATH
      ? getMentorMeetingTabFromSearch(location.search)
      : null;
  const showingMenteeMeetings = !showingMentorArea && location.pathname === MENTEE_MEETINGS_PATH;
  const activeMenteeTab = showingMenteeMeetings ? getMenteeMeetingTabFromSearch(location.search) : null;
  const items = [
    { path: homePath, label: t("nav.home"), exact: true },
    ...(showingMentorArea
      ? MENTOR_MEETING_TABS.map((tab) => ({
          path: getMentorMeetingsPath(tab.id),
          label: t(tab.labelKey),
          isActive: (currentLocation) => currentLocation.pathname === MENTOR_MEETINGS_PATH && activeMentorTab === tab.id,
        }))
      : [
          { path: "/mentee/mentors", label: t("nav.searchMentors") },
          ...MENTEE_MEETING_TABS.map((tab) => ({
            path: getMenteeMeetingsPath(tab.id),
            label: t(tab.labelKey || "nav.myMeetings"),
            isActive: () => showingMenteeMeetings && activeMenteeTab === tab.id,
          })),
        ]),
  ];

  const showJoinAsMentor = !currentUser?.isAdmin && !mentor;
  const handleGoogleCalendarClick = async () => {
    setCalendarError("");
    try {
      await connectGoogleCalendar();
    } catch (error) {
      setCalendarError(getRequestErrorMessage(error, t("errors.connectGoogleCalendar"), t));
    }
  };

  return <RoleNavbar currentUser={currentUser} onLogout={onLogout} homePath={homePath} items={items} showJoinAsMentor={showJoinAsMentor} showGoogleCalendar={mentor && !currentUser?.isAdmin} googleCalendarConnected={calendarConnected} onGoogleCalendarClick={handleGoogleCalendarClick} googleCalendarError={calendarError} />;
}

export default AuthenticatedNavbar;
