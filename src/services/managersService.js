// src/services/managersService.js
import http from "./http";

const ENDPOINT = "/admin/managers";

export const ManagersService = {
  list: (params) => http.get(ENDPOINT, { params }),

  get: (id) => http.get(`${ENDPOINT}/${id}`),

  create: (data) => {
    // If FormData provided, send as-is
    if (typeof FormData !== "undefined" && data instanceof FormData) {
      return http.post(ENDPOINT, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    
    // Otherwise send as JSON
    return http.post(ENDPOINT, data);
  },

  update: (id, data) => {
    // If FormData provided, use method spoofing
    if (typeof FormData !== "undefined" && data instanceof FormData) {
      data.append("_method", "PUT");
      return http.post(`${ENDPOINT}/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    
    // Otherwise send as JSON with method spoofing
    return http.post(`${ENDPOINT}/${id}`, {
      ...data,
      _method: "PUT",
    });
  },

  delete: (id) => http.delete(`${ENDPOINT}/${id}`),
};

