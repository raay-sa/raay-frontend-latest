// src/services/faqsService.js
import http from "./http";

const ENDPOINT = "/admin/common_questions";

export const FaqsService = {
  list: (params = {}) => http.get(ENDPOINT, { params }),
  get: (id) => http.get(`${ENDPOINT}/${id}`),
  create: (data) => http.post(ENDPOINT, data),
  update: (id, data) =>
    http.post(`${ENDPOINT}/${id}`, {
      ...data,
    }),

    multiHide: (ids = []) => {
    const form = new FormData();
    (ids || []).forEach((id) => form.append("questions_id[]", id));
    return http.post("/admin/common_questions/multi_hide", form);
  },
};
