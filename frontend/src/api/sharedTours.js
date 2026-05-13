import { apiClient } from "./client.js";

export async function getSharedTours({ sort = "rating", page = 1 } = {}) {
  const response = await apiClient.get("/shared-tours", {
    params: { sort, page },
  });
  return response.data;
}

export async function getSharedTour(shareId) {
  const response = await apiClient.get(`/shared-tours/${shareId}`);
  return response.data;
}

export async function getMySharedTourRating(shareId) {
  const response = await apiClient.get(`/shared-tours/${shareId}/rate/me`);
  return response.data;
}

export async function createSharedTourRating(shareId, payload) {
  const response = await apiClient.post(`/shared-tours/${shareId}/rate`, payload);
  return response.data;
}

export async function updateSharedTourRating(shareId, payload) {
  const response = await apiClient.put(`/shared-tours/${shareId}/rate`, payload);
  return response.data;
}

export async function deleteSharedTourRating(shareId) {
  const response = await apiClient.delete(`/shared-tours/${shareId}/rate`);
  return response.data;
}

export async function cloneSharedTour(shareId) {
  const response = await apiClient.post(`/shared-tours/${shareId}/use`);
  return response.data;
}
