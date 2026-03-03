import http from "./http";

const ENDPOINT = "/admin/evaluations/forms";

export const EvaluationsService = {
  list: (page = 1) => http.get(`${ENDPOINT}?page=${page}`),
  create: (data) => http.post(`${ENDPOINT}`, data),
  getPrograms: () => http.get(`admin/program/list`),
  getFormView: () => http.get(`${ENDPOINT}/view`),
  sendEvaluation: (data) => http.post(`${ENDPOINT}/send`, data),

  // For Students
  getStudentForm: (slug) =>
    http.get(`/student/evaluation/forms/program/${encodeURIComponent(slug)}`),

  submitStudentForm: (payload) =>
    http.post("/student/evaluation/forms", payload),
};
