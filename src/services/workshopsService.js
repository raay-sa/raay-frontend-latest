// src/services/workshopsService.js
import http from "./http";

const ENDPOINT = "/admin/workshops";

export const WorkshopsService = {
  list: (params) => http.get(ENDPOINT, { params }),
  show: (id) => http.get(`${ENDPOINT}/${id}`),
  create: (payload) => http.post(ENDPOINT, payload),
  update: (id, payload) => {
    // Supports method spoofing for Laravel if needed
    const isFormData = payload instanceof FormData;
    if (isFormData) {
      payload.append("_method", "PUT");
      return http.post(`${ENDPOINT}/${id}`, payload);
    }
    return http.put(`${ENDPOINT}/${id}`, payload);
  },
  delete: (id) => http.delete(`${ENDPOINT}/${id}`),
};


