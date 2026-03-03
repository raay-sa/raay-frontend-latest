// src/services/teacher/traineesService.js
import http from "../http";

const TraineesService = {
  list: (params) => http.get("/admin/trainees", { params }),
  create: (data) => http.post("/admin/trainees", data),
  show: (id) => http.get(`/admin/trainees/${id}`),
  update: (id, data) => http.post(`/admin/trainees/${id}`, data),
  studentsList: () => http.get("/admin/students_list"),
  getExcelSheet: () =>
    http.get("/admin/trainees/excel_sheet", { responseType: "blob" }),
};

export default TraineesService;
