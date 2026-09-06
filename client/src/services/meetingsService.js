import axios from "axios";

function authConfig() {
  const token = window.localStorage.getItem("queensMatchToken");
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function selectMeetingSlot(requestId, slotId) {
  const response = await axios.post(
    `/api/mentoring-requests/${requestId}/select-slot`,
    { slotId },
    authConfig()
  );
  return response.data;
}

export async function offerRescheduleSlots(requestId, slots) {
  const response = await axios.post(
    `/api/mentoring-requests/${requestId}/reschedule-slots`,
    { slots },
    authConfig()
  );
  return response.data;
}

export async function confirmMeetingOutcome(meetingId, occurred) {
  const response = await axios.patch(
    `/api/meetings/${meetingId}/outcome`,
    { occurred },
    authConfig()
  );
  return response.data;
}

export async function submitMeetingFeedback(meetingId, feedback) {
  const response = await axios.post(
    `/api/meetings/${meetingId}/feedback`,
    feedback,
    authConfig()
  );
  return response.data;
}
