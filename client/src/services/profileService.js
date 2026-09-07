import axios from "axios";

const AUTH_TOKEN_KEY = "queensMatchToken";

export async function updateMentorProfile(profile) {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    throw new Error("Authentication token is missing");
  }

  const response = await axios.patch("/api/users/profile", profile, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.user;
}

export async function updateUserProfile(profile) {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    throw new Error("Authentication token is missing");
  }

  const response = await axios.patch("/api/users/profile", profile, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.user;
}

export async function createMentorProfile(profile) {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    throw new Error("Authentication token is missing");
  }

  const response = await axios.post("/api/users/mentor-profile", profile, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.user;
}
