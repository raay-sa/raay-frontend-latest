// src/services/consultantsService.js
import http from "./http";

const ENDPOINT = "/admin/consultants";

export const ConsultantsService = {
  // List with server-side pagination, filter, search
  list: (params) => http.get(ENDPOINT, { params }),

  // Show one
  show: (id) => http.get(`${ENDPOINT}/${id}`),

  // Delete one
  delete: (id) => http.delete(`${ENDPOINT}/${id}`),

  bulkDelete: (ids) => {
    const form = new FormData();
    (ids || []).forEach((id) => form.append("consultants_id[]", id));
    return http.post(`${ENDPOINT}/multi_delete`, form);
  },

  // Export (download)
  export: () => http.get(`${ENDPOINT}/download`, { responseType: "blob" }),

  // Convert to teacher
  convertToTeacher: (consultantId) =>
    http.post(`${ENDPOINT}/convert_to_teacher`, {
      consultant_id: consultantId,
    }),
};
