import http from "../http";

// Assignments grading
export const gradingService = {
  // LIST
  listAssignmentSolutions: (params = {}) =>
    http.get("/teacher/assignment/solutions", { params }),

  // SHOW
  getAssignmentSolution: (solutionId) =>
    http.get(`/teacher/assignment/solutions/${solutionId}`),

  // UPDATE (grade)
  gradeAssignmentSolution: (solutionId, grade) => {
    const fd = new FormData();
    fd.append("_method", "put");
    fd.append("grade", grade);
    return http.post(`/teacher/assignment/solutions/${solutionId}`, fd);
  },

  // Exams grading
  listExamSolutions: (params = {}) =>
    http.get("/teacher/exam_solutions", { params }),

  getExamSolution: (solutionId) =>
    http.get(`/teacher/exam_solutions/${solutionId}`),

  // UPDATE (per-question points)
  gradeExamSolution: (solutionId, questions = []) => {
    const fd = new FormData();
    fd.append("_method", "PUT");
    questions.forEach((q, i) => {
      fd.append(`questions[${i}][id]`, q.id);
      fd.append(`questions[${i}][points]`, q.points);
    });
    return http.post(`/teacher/exam_solutions/${solutionId}`, fd);
  },
};

export default gradingService;
