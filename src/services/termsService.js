// src/services/termsService.js
import http from "./http";

export const TermsService = {
  list: (params) => http.get("/admin/privacy_terms", { params }),
  create: (data) => http.post("/admin/privacy_terms", data),
  update: (id, data) => http.post(`/admin/privacy_terms/${id}`, data),
  delete: (id) => http.delete(`/admin/privacy_terms/${id}`),
  show: (id) => http.get(`/admin/privacy_terms/${id}`),
  downloadPdf: (id) =>
    http.get(`/admin/privacy_terms/${id}/pdf`, { responseType: "blob" }),
};
