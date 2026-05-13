import { apiClient } from "./client.js";

export function generateTour(payload) {
  return apiClient.post("/tours/generate", payload).then((response) => response.data);
}

export function listTours() {
  return apiClient.get("/tours").then((response) => response.data);
}

export function getTour(id) {
  return apiClient.get(`/tours/${id}`).then((response) => response.data);
}

export function deleteTour(id) {
  return apiClient.delete(`/tours/${id}`).then((response) => response.data);
}

export function publishTour(id, payload = {}) {
  return apiClient.post(`/tours/${id}/share`, payload).then((response) => response.data);
}

export function updateTourShare(id, payload) {
  return apiClient.patch(`/tours/${id}/share`, payload).then((response) => response.data);
}

export function unpublishTour(id) {
  return apiClient.delete(`/tours/${id}/share`).then((response) => response.data);
}

export function shareTourWithFriends(id, friendIds) {
  return apiClient.post(`/tours/${id}/invitations`, { friend_ids: friendIds }).then((response) => response.data);
}
