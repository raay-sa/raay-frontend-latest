import http from "./http";
import ENDPOINTS from "./endpoints";

/* CRUD helpers */
export const FAQService = {
  list: () => http.get(ENDPOINTS.FAQS),
  show: (id) => http.get(`${ENDPOINTS.FAQS}/${id}`),
  create: (payload) => http.post(ENDPOINTS.FAQS, payload),
  update: (id, payload) => http.patch(`${ENDPOINTS.FAQS}/${id}`, payload),
  destroy: (id) => http.delete(`${ENDPOINTS.FAQS}/${id}`),
};
