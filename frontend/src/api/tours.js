import { apiClient } from "./client.js";

export async function updateTour(tourId, payload) {
  const response = await apiClient.patch(`/tours/${tourId}`, payload);
  return response.data;
}

export async function deleteTour(tourId) {
  const response = await apiClient.delete(`/tours/${tourId}`);
  return response.data;
}
