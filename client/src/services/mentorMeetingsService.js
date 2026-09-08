import axios from "axios";

function authConfig() {
  const token = window.localStorage.getItem("queensMatchToken");

  if (!token) {
    throw new Error("Authentication token is missing");
  }

  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function getMentorMeetingRequests(options = {}) {
  const response = await axios.get("/api/mentoring-requests/mentor/me", { ...authConfig(), params: options });
  return response.data.data || response.data;
}

export async function rejectMentorRequest(requestId) {
  const response = await axios.patch(
    `/api/mentoring-requests/${requestId}/reject`,
    {},
    authConfig()
  );
  return response.data;
}

export async function offerMentorSlots(
  requestId,
  slots,
  { confirmOverCapacity = false } = {}
) {
  const response = await axios.post(
    `/api/mentoring-requests/${requestId}/slots`,
    { slots, confirmOverCapacity },
    authConfig()
  );
  return response.data;
}
