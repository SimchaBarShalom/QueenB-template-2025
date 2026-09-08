export const MENTOR_MEETINGS_PATH = "/mentor/meetings";
export const MENTEE_MEETINGS_PATH = "/mentee/meetings";

export const MENTOR_MEETING_TAB_QUERY = "tab";

export const MENTOR_MEETING_TABS = [
  { id: "past", label: "פגישות שהתקיימו" },
  { id: "upcoming", label: "פגישות קרובות" },
  { id: "pending", label: "בקשות שממתינות לך" },
  { id: "offered", label: "זמנים שהצעת" },
  { id: "closed", label: "בקשות שנסגרו" },
];

export const MENTEE_MEETING_TABS = [
  { id: "completed-section", label: "פגישות שהתקיימו" },
  { id: "scheduled-section", label: "פגישות שנקבעו" },
  { id: "waiting-mentor-section", label: "ממתינות להצעת זמנים" },
  { id: "waiting-mentee-section", label: "מחכות לבחירת מועד" },
];

export const DEFAULT_MENTOR_MEETING_TAB = "upcoming";

export function isMentorMeetingTab(tabId) {
  return MENTOR_MEETING_TABS.some((tab) => tab.id === tabId);
}

export function resolveMentorMeetingTab(tabId) {
  return isMentorMeetingTab(tabId) ? tabId : DEFAULT_MENTOR_MEETING_TAB;
}

export function getMentorMeetingsPath(tabId) {
  return `${MENTOR_MEETINGS_PATH}?${MENTOR_MEETING_TAB_QUERY}=${resolveMentorMeetingTab(tabId)}`;
}

export function getMentorMeetingTabFromSearch(search) {
  const params =
    search instanceof URLSearchParams ? search : new URLSearchParams(search || "");
  return resolveMentorMeetingTab(params.get(MENTOR_MEETING_TAB_QUERY));
}

export const DEFAULT_MENTEE_MEETING_TAB = "scheduled-section";
export function isMenteeMeetingTab(tabId) {
  return MENTEE_MEETING_TABS.some((tab) => tab.id === tabId);
}
export function resolveMenteeMeetingTab(tabId) {
  return isMenteeMeetingTab(tabId) ? tabId : DEFAULT_MENTEE_MEETING_TAB;
}
export function getMenteeMeetingsPath(tabId) {
  return `${MENTEE_MEETINGS_PATH}?${MENTOR_MEETING_TAB_QUERY}=${resolveMenteeMeetingTab(tabId)}`;
}
export function getMenteeMeetingTabFromSearch(search) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search || "");
  return resolveMenteeMeetingTab(params.get(MENTOR_MEETING_TAB_QUERY));
}
