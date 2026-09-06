import axios from "axios";

const TOKEN_KEY = "queensMatchToken";
const USER_KEY = "queensMatchUser";

const apiClient = axios.create();

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const savedUser = window.localStorage.getItem(USER_KEY);
  return savedUser ? JSON.parse(savedUser) : null;
}

export function setAuthToken(token) {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export function storeAuth({ user, token }) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.localStorage.setItem(TOKEN_KEY, token);
  setAuthToken(token);
}

export function clearAuth() {
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  setAuthToken(null);
}

setAuthToken(getStoredToken());

export default apiClient;
