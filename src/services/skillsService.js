// src/services/skillsService.js
import http from "./http";

const ENDPOINT = "/admin/skills";

export const SkillsService = {
  list: (params) => http.get(ENDPOINT, { params }), // GET ?filter&search
  show: (id) => http.get(`${ENDPOINT}/${id}`), // GET /id
  create: (payload) => http.post(ENDPOINT, payload), // POST {category_id, question}
  update: (id, payload) => {
    const body = { ...payload, _method: "PUT" };
    return http.post(`${ENDPOINT}/${id}`, body);
  },
  delete: (id) => http.delete(`${ENDPOINT}/${id}`), // DELETE /id
};
