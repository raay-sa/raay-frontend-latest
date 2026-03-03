// src/services/teacher/assignmentsService.js
import http from "../http";

const BASE = "/teacher/assignments";

export const assignmentsService = {
  // Fetches summary + paginated assignments & exams
  getAssignments: (params = {}) => http.get(BASE, { params }),
  getOne: (id) => http.get(`${BASE}/${id}`),

  getCategories: () => http.get("/teacher/categories"),
  getAssignment: (id) => http.get(`${BASE}/${id}`),
  createAssignment: (body) => http.post(BASE, body),
  updateAssignment: (id, body) => http.put(`${BASE}/${id}`, body),
  deleteAssignment: (id) => http.delete(`/teacher/assignments/${id}`),
  deleteExam: (id) => http.delete(`/teacher/assignments/${id}`),  
};

export default assignmentsService;
