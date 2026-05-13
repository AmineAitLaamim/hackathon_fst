import { apiClient } from "./client.js";

export async function getSharedTours({ sort = "rating", page = 1 } = {}) {
  const response = await apiClient.get("/shared-tours", {
    params: { sort, page },
  });
  return response.data;
}
