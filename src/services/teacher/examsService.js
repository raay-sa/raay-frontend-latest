import http from "../http";

const examsService = {
  getExam: (id) => http.get(`/teacher/exams/${id}`),
  getOne: (id) => http.get(`/teacher/exams/${id}`),

  createExam: async (payload) => {
    if (payload.file) {
      const fd = new FormData();
      Object.entries({ ...payload, file: undefined }).forEach(([k, v]) => {
        if (k === "questions") {
          fd.append("questions", JSON.stringify(v || []));
        } else {
          fd.append(k, v ?? "");
        }
      });
      fd.append("file", payload.file);
      return http.post("/teacher/exams", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return http.post("/teacher/exams", payload);
  },

  updateExam: async (id, payload) => {
    if (payload.file instanceof File) {
      const fd = new FormData();
      Object.entries({ ...payload, file: undefined }).forEach(([k, v]) => {
        if (k === "questions") {
          fd.append("questions", JSON.stringify(v || []));
        } else {
          fd.append(k, v ?? "");
        }
      });
      fd.append("file", payload.file);
      return http.post(`/teacher/exams/${id}?_method=PUT`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return http.put(`/teacher/exams/${id}`, payload);
  },
};

export default examsService;
