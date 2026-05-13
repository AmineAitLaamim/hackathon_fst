import { apiClient } from "./client.js";

export async function generateTour(payload) {
  const response = await apiClient.post("/tours/generate", payload);
  return response.data;
}

export async function listTours() {
  const response = await apiClient.get("/tours");
  return response.data;
}

export async function getTour(id) {
  const response = await apiClient.get(`/tours/${id}`);
  return response.data;
}

export async function updateTour(tourId, payload) {
  const response = await apiClient.patch(`/tours/${tourId}`, payload);
  return response.data;
}

export async function deleteTour(tourId) {
  const response = await apiClient.delete(`/tours/${tourId}`);
  return response.data;
}

export async function getSharedWithMeTours() {
  const response = await apiClient.get("/tours/shared-with-me");
  return response.data;
}

export async function publishTour(id, payload = {}) {
  const response = await apiClient.post(`/tours/${id}/share`, payload);
  return response.data;
}

export async function updateTourShare(id, payload) {
  const response = await apiClient.patch(`/tours/${id}/share`, payload);
  return response.data;
}

export async function unpublishTour(id) {
  const response = await apiClient.delete(`/tours/${id}/share`);
  return response.data;
}

export async function shareTourWithFriends(id, friendIds) {
  const response = await apiClient.post(`/tours/${id}/invitations`, { friend_ids: friendIds });
  return response.data;
}
