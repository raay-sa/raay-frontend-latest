import http from "./http";

// Student Banner Service
export const StudentBannerService = {
  // Get all active banners (for slider)
  getBanners: () => http.get("/student/banners"),

  // Get specific banner
  getBanner: (id) => http.get(`/student/banners/${id}`),

  // Register interest in banner
  registerInterest: (id) =>
    http.post(`/student/banners/${id}/register-interest`),

  // Remove interest from banner
  removeInterest: (id) => http.delete(`/student/banners/${id}/remove-interest`),

  // Get student's interested banners
  getMyInterests: () => http.get("/student/my-interests"),

  // Get banner with interest status
  getBannerWithInterest: (id) =>
    http.get(`/student/banners/${id}/with-interest`),
};

// Admin Banner Service
export const AdminBannerService = {
  // Get all banners (admin view)
  getBanners: () => http.get("/admin/banners"),

  // Get specific banner (admin view)
  getBanner: (id) => http.get(`/admin/banners/${id}`),

  // Get interested students for a banner
  getInterestedStudents: (id) =>
    http.get(`/admin/banners/${id}/interested-students`),

  // Link banner to program
  linkToProgram: (id, programId, emailData = {}) =>
    http.post(`/admin/banners/${id}/link-to-program`, {
      program_id: programId,
      email_subject: emailData.email_subject || "",
      email_body: emailData.email_body || "",
    }),

  // Get banner statistics
  getBannerStatistics: () => http.get("/admin/banners-statistics"),

  // Create banner
  createBanner: (data) => http.post("/admin/banners", data),

  // Update banner
  updateBanner: (id, data) => http.post(`/admin/banners/${id}`, data),

  // Delete banner
  deleteBanner: (id) => http.delete(`/admin/banners/${id}`),
};

// Default export for backward compatibility (student service)
export default StudentBannerService;
