import http from "./http";

const ENDPOINT = "/admin/programs";

export const ProgramsService = {
  list: (page = 1, filters = {}) => {
    const params = new URLSearchParams({ page });
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(`${key}[]`, v));
      } else {
        params.append(key, value);
      }
    });
    return http.get(`${ENDPOINT}?${params.toString()}`);
  },

  get: (id) => http.get(`${ENDPOINT}/${id}`),

  create: (formDataOrObject) => {
    // If FormData provided, send as-is
    if (
      typeof FormData !== "undefined" &&
      formDataOrObject instanceof FormData
    ) {
      // Let the browser set the correct multipart boundary automatically
      return http.post(`${ENDPOINT}`, formDataOrObject);
    }

    // Otherwise build FormData here
    const fd = new FormData();

    Object.entries(formDataOrObject || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // Handle translations for title, description, learning, requirement
      if (key === "title" && typeof value === "object") {
        if (value.ar) fd.append("title[ar]", value.ar);
        if (value.en) fd.append("title[en]", value.en);
        return;
      }
      if (key === "description" && typeof value === "object") {
        if (value.ar) fd.append("description[ar]", value.ar);
        if (value.en) fd.append("description[en]", value.en);
        return;
      }
      if (key === "learning" && Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "object") {
            if (v.ar) fd.append("learning[ar][]", v.ar);
            if (v.en) fd.append("learning[en][]", v.en);
          } else {
            fd.append("learning[]", v);
          }
        });
        return;
      }
      if (key === "requirement" && Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "object") {
            if (v.ar) fd.append("requirement[ar][]", v.ar);
            if (v.en) fd.append("requirement[en][]", v.en);
          } else {
            fd.append("requirement[]", v);
          }
        });
        return;
      }
      if (key === "main_axes" && Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "object") {
            if (v.ar) fd.append("main_axes[ar][]", v.ar);
            if (v.en) fd.append("main_axes[en][]", v.en);
          } else {
            fd.append("main_axes[]", v);
          }
        });
        return;
      }
      if (key === "sections" && Array.isArray(value)) {
        value.forEach((s, i) => {
          if (s?.title && typeof s.title === "object") {
            if (s.title.ar) fd.append(`sections[${i}][title][ar]`, s.title.ar);
            if (s.title.en) fd.append(`sections[${i}][title][en]`, s.title.en);
          } else {
            fd.append(`sections[${i}][title]`, s?.title ?? "");
          }
        });
        return;
      }

      // image must be a real File
      if (key === "image") {
        if (value instanceof File) {
          fd.append("image", value);
        }
        return;
      }

      // teacher_id
      if (key === "teacher_id") {
        fd.append("teacher_id", value);
        return;
      }

      fd.append(key, value);
    });

    // Let the browser set the correct multipart boundary automatically
    return http.post(`${ENDPOINT}`, fd);
  },

  update: (id, formDataOrObject) => {
    // If FormData provided, send as-is
    if (
      typeof FormData !== "undefined" &&
      formDataOrObject instanceof FormData
    ) {
      if (!formDataOrObject.has("_method"))
        formDataOrObject.append("_method", "PUT");
      // Let the browser set the correct multipart boundary automatically
      return http.post(`${ENDPOINT}/${id}`, formDataOrObject);
    }

    // Otherwise build FormData here
    const fd = new FormData();
    fd.append("_method", "PUT");

    Object.entries(formDataOrObject || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // Handle translations for title, description, learning, requirement
      if (key === "title" && typeof value === "object") {
        if (value.ar) fd.append("title[ar]", value.ar);
        if (value.en) fd.append("title[en]", value.en);
        return;
      }
      if (key === "description" && typeof value === "object") {
        if (value.ar) fd.append("description[ar]", value.ar);
        if (value.en) fd.append("description[en]", value.en);
        return;
      }
      if (key === "learning" && Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "object") {
            if (v.ar) fd.append("learning[ar][]", v.ar);
            if (v.en) fd.append("learning[en][]", v.en);
          } else {
            fd.append("learning[]", v);
          }
        });
        return;
      }
      if (key === "requirement" && Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "object") {
            if (v.ar) fd.append("requirement[ar][]", v.ar);
            if (v.en) fd.append("requirement[en][]", v.en);
          } else {
            fd.append("requirement[]", v);
          }
        });
        return;
      }
      if (key === "main_axes" && Array.isArray(value)) {
        value.forEach((v) => {
          if (typeof v === "object") {
            if (v.ar) fd.append("main_axes[ar][]", v.ar);
            if (v.en) fd.append("main_axes[en][]", v.en);
          } else {
            fd.append("main_axes[]", v);
          }
        });
        return;
      }
      if (key === "sections" && Array.isArray(value)) {
        value.forEach((s, i) => {
          if (s?.title && typeof s.title === "object") {
            if (s.title.ar) fd.append(`sections[${i}][title][ar]`, s.title.ar);
            if (s.title.en) fd.append(`sections[${i}][title][en]`, s.title.en);
          } else {
            fd.append(`sections[${i}][title]`, s?.title ?? "");
          }
        });
        return;
      }

      // image must be a real File
      if (key === "image") {
        if (value instanceof File) {
          fd.append("image", value);
        }
        return;
      }

      // teacher_id
      if (key === "teacher_id") {
        fd.append("teacher_id", value);
        return;
      }

      fd.append(key, value);
    });

    // Let the browser set the correct multipart boundary automatically
    return http.post(`${ENDPOINT}/${id}`, fd);
  },

  remove: (id) => http.delete(`${ENDPOINT}/${id}/force`),

  export: () => http.get(`admin/program/download`, { responseType: "blob" }),

  // Export reports Excel file
  exportReports: () => http.get(`/admin/program/24/report_excel`, { responseType: "blob" }),

  // Export specific program report Excel file
  exportProgramReport: (programId) => http.get(`/admin/program/${programId}/report_excel`, { responseType: "blob" }),

  getTeacherList: () => http.get("/admin/teachers_list"),

  // Program requests endpoints
  getRequests: (page = 1, filters = {}) => {
    const params = new URLSearchParams({ page });
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(`${key}[]`, v));
      } else {
        params.append(key, value);
      }
    });
    return http.get(`/admin/programs/requests?${params.toString()}`);
  },

  approveRequests: (programIds) => {
    return http.post("/admin/programs/requests/approve", {
      programs_id: programIds
    });
  },

  // Get teacher-specific categories
  getTeacherCategories: (teacherId) => {
    return http.get(`/admin/teacher/${teacherId}/categories`);
  },
};
