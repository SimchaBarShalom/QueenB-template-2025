import apiClient from "../api/client";

export async function getGoogleCalendarStatus() {
  const response = await apiClient.get("/api/google-calendar/status");
  return response.data;
}

export async function connectGoogleCalendar() {
  const response = await apiClient.get("/api/google-calendar/connect");
  window.location.assign(response.data.authorizationUrl);
}
