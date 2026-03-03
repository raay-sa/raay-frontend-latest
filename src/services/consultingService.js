// src/services/consultingService.js

import http from "./http";

const ENDPOINT = "/admin/consulting";

export const ConsultingService = {
  list: (params) => http.get(ENDPOINT, { params }), // GET ?filter&search
  show: (id) => http.get(`${ENDPOINT}/${id}`), // GET /id
  updateStatus: (id, status) => {
    const form = new FormData();
    form.append("_method", "Put");
    form.append("status", status);
    return http.post(`${ENDPOINT}/${id}`, form);
  },
  delete: (id) => http.delete(`${ENDPOINT}/${id}`), // DELETE /id
};
