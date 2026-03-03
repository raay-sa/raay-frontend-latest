// src/services/student/assignmentsService.js
import http from "../http";

const StudentAssignmentsService = {
  // list assignments + exams with filters
  list: (params = {}) => http.get("/student/assignments", { params }),

  // helpers to feed filters
  programsList: () => http.get("/student/programs/list"),
  teachersList: () => http.get("/student/teachers_list"),
  getExam: (examId) => http.get(`/student/exams/${examId}`),
  submitExam: (payload) => http.post(`/student/exams`, payload),

  getAssignment: (assignmentId) =>
    http.get(`/student/assignments/${assignmentId}`),
  submitAssignmentSolution: ({ assignment_id, file }) => {
    const fd = new FormData();
    fd.append("assignment_id", assignment_id);
    fd.append("file", file);
    return http.post(`/student/assignment/solutions`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getExamSolution: (examId) => http.get(`/student/exam/${examId}/solution`),
};

export default StudentAssignmentsService;
