// src/services/contactUsService.js
import http from "./http";

const ENDPOINT = "/admin/contact_us";

export const ContactUsService = {
  list: (params) => http.get(ENDPOINT, { params }), 
  show: (id) => http.get(`${ENDPOINT}/${id}`), 
  updateStatus: (id, status) => {
    const form = new FormData();
    form.append("_method", "Put");
    form.append("status", status);
    return http.post(`${ENDPOINT}/${id}`, form);
  },
  delete: (id) => http.delete(`${ENDPOINT}/${id}`), 
};
