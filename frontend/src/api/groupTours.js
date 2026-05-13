import { apiClient } from "./client.js";

export function createGroupTour(tourId) {
  return apiClient.post("/group-tours", { tour_id: tourId }).then((response) => response.data);
}
