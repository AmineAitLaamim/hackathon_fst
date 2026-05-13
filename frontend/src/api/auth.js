import { apiClient } from "./client.js";

export function loginUser(payload) {
  return apiClient.post("/auth/login", payload).then((response) => response.data);
}

export function registerUser(payload) {
  return apiClient.post("/auth/register", payload).then((response) => response.data);
}

export function fetchCurrentUser() {
  return apiClient.get("/auth/me").then((response) => response.data);
}

export function updateCurrentUser(payload) {
  return apiClient.patch("/auth/me", payload).then((response) => response.data);
}

export function logoutUser() {
  return apiClient.post("/auth/logout").then((response) => response.data);
}

export function updateUserInterests(userId, payload) {
  return apiClient.patch(`/users/${userId}/interests`, payload).then((response) => response.data);
}

export function updateUserHealth(userId, payload) {
  return apiClient.patch(`/users/${userId}/health`, payload).then((response) => response.data);
}
