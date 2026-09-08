export const MENTOR_MEETINGS_PATH = "/mentor/meetings";

export const MENTOR_MEETING_TAB_QUERY = "tab";

export const MENTOR_MEETING_TABS = [
  { id: "past", labelKey: "meetings.tabPast" },
  { id: "upcoming", labelKey: "meetings.tabUpcoming" },
  { id: "pending", labelKey: "meetings.tabPending" },
  { id: "offered", labelKey: "meetings.tabOffered" },
  { id: "closed", labelKey: "meetings.tabClosed" },
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
