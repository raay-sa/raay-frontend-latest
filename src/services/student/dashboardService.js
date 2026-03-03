// src/services/student/dashboardService.js
import http from "../http";

const DashboardService = {
  // top stats
  overview: () => http.get("/student/dashboard"),

  // line chart
  progress: (filter = "monthly") =>
    http.get("/student/dashboard/student_progress", { params: { filter } }),

  // pie chart
  contentStats: () => http.get("/student/dashboard/content_stats"),

  // bar chart
  importantData: () => http.get("/student/dashboard/important_data"),

  // cards: continue watching
  keepWatching: () => http.get("/student/dashboard/keep_watching"),

  // lists: recent registered + live
  recentPrograms: () => http.get("/student/dashboard/recent_programs"),

  // suggested courses
  bestPrograms: () => http.get("/student/dashboard/best_programs"),
};

export default DashboardService;
