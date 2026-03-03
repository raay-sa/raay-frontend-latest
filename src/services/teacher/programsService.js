import http from "../http";

const ProgramsService = {
  listForTeacher: () => http.get("/teacher/programs/list"),
  list: (params = {}) => http.get("/teacher/programs", { params }),
  getOne: (id) => http.get(`/teacher/programs/${id}`),
  getProgramStudents: (programId, params) => http.get(`/teacher/program/${programId}/students`, { params }),

  // -------- Excel template download (blob) --------
  downloadExcelExample: () =>
    http.get("/teacher/programs/excel_sheet", { responseType: "blob" }),

  // -------- Excel import via the same create endpoint --------
  importFromExcel: (file, fieldName = "excel_file") => {
    const fd = new FormData();
    fd.append(fieldName, file);
    return http.post("/teacher/programs", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  create: async (payload) => {
    const fd = new FormData();

    const normalizedType =
      (payload.type || "").toLowerCase() === "recorded"
        ? "registered"
        : payload.type || "";
    
    // Handle translations for title, description
    if (payload.title && typeof payload.title === "object") {
      if (payload.title.ar) fd.append("title[ar]", payload.title.ar);
      if (payload.title.en) fd.append("title[en]", payload.title.en);
    } else {
      fd.append("title", payload.title ?? "");
    }
    
    fd.append("price", payload.price ?? "");
    fd.append("type", normalizedType);
    
    if (payload.description && typeof payload.description === "object") {
      if (payload.description.ar) fd.append("description[ar]", payload.description.ar);
      if (payload.description.en) fd.append("description[en]", payload.description.en);
    } else {
      fd.append("description", payload.description ?? "");
    }
    
    fd.append("category_id", payload.category_id ?? "");
    fd.append("have_certificate", payload.have_certificate ? 1 : 0);
    fd.append("level", payload.level ?? "");
    fd.append("user_type", payload.user_type ?? "");

    if (payload.image instanceof File) fd.append("image", payload.image);
    if (payload.contentFile) fd.append("file", payload.contentFile);

    // Handle learning translations
    const learningArray = payload.learning || [];
    if (learningArray.length === 0) {
      // Send empty learning array to satisfy API requirements
      fd.append("learning[ar][]", "");
      fd.append("learning[en][]", "");
    } else {
      learningArray.forEach((l, i) => {
        if (typeof l === "object") {
          if (l.ar) fd.append("learning[ar][]", l.ar);
          if (l.en) fd.append("learning[en][]", l.en);
        } else {
          fd.append("learning[]", l);
        }
      });
    }
    
    // Handle requirement translations
    const requirementArray = payload.requirement || [];
    if (requirementArray.length === 0) {
      // Send empty requirement array to satisfy API requirements
      fd.append("requirement[ar][]", "");
      fd.append("requirement[en][]", "");
    } else {
      requirementArray.forEach((r, i) => {
        if (typeof r === "object") {
          if (r.ar) fd.append("requirement[ar][]", r.ar);
          if (r.en) fd.append("requirement[en][]", r.en);
        } else {
          fd.append("requirement[]", r);
        }
      });
    }
    
    // Handle main_axes translations
    const mainAxesArray = payload.main_axes || [];
    if (mainAxesArray.length > 0) {
      mainAxesArray.forEach((axis) => {
        if (typeof axis === "object") {
          if (axis.ar) fd.append("main_axes[ar][]", axis.ar);
          if (axis.en) fd.append("main_axes[en][]", axis.en);
        } else {
          fd.append("main_axes[]", axis);
        }
      });
    }
    
    // Handle notes
    if (payload.notes) {
      fd.append("notes", payload.notes);
    }

    // Handle sections translations
    const sectionsArray = payload.sections || [];
    if (sectionsArray.length === 0) {
      // Send empty sections array to satisfy API requirements
      fd.append("sections[0][title][ar]", "");
      fd.append("sections[0][title][en]", "");
    } else {
      sectionsArray.forEach((section, i) => {
        if (section && typeof section === "object" && section.title) {
          if (typeof section.title === "object") {
            if (section.title.ar) fd.append(`sections[${i}][title][ar]`, section.title.ar);
            if (section.title.en) fd.append(`sections[${i}][title][en]`, section.title.en);
          } else {
            fd.append(`sections[${i}][title]`, String(section.title));
          }
        } else if (section != null && String(section).trim() !== "") {
          fd.append(`sections[${i}][title]`, String(section));
        }
      });
    }

    // Duration can be set for all program types
    if (payload.duration !== undefined && payload.duration !== null && payload.duration !== '') {
      const durationNum = Number(payload.duration);
      if (!isNaN(durationNum) && durationNum > 0) {
        fd.append("duration", durationNum);
      }
    }

    // Live program fields
    if ((normalizedType || "").toLowerCase() === "live") {
      if (payload.date_from) fd.append("date_from", payload.date_from);
      if (payload.date_to) fd.append("date_to", payload.date_to);
      if (payload.time) fd.append("time", payload.time);
    }

    // Registered program fields
    if ((normalizedType || "").toLowerCase() === "registered") {
      if (payload.date_from) fd.append("date_from", payload.date_from);
    }

    // Onsite program fields
    if ((normalizedType || "").toLowerCase() === "onsite") {
      if (payload.date_from) fd.append("date_from", payload.date_from);
      if (payload.date_to) fd.append("date_to", payload.date_to);
      if (payload.address) fd.append("address", payload.address);
      if (payload.url) fd.append("url", payload.url);
    }

    return http.post("/teacher/programs", fd);
  },

  update: async (id, payload) => {
    const fd = new FormData();

    const normalizedType =
      (payload.type || "").toLowerCase() === "recorded"
        ? "registered"
        : payload.type || "";

    fd.append("_method", "PUT");
    
    // Handle translations for title, description
    if (payload.title && typeof payload.title === "object") {
      if (payload.title.ar) fd.append("title[ar]", payload.title.ar);
      if (payload.title.en) fd.append("title[en]", payload.title.en);
    } else {
      fd.append("title", payload.title ?? "");
    }
    
    fd.append("price", payload.price ?? "");
    fd.append("type", normalizedType);
    
    if (payload.description && typeof payload.description === "object") {
      if (payload.description.ar) fd.append("description[ar]", payload.description.ar);
      if (payload.description.en) fd.append("description[en]", payload.description.en);
    } else {
      fd.append("description", payload.description ?? "");
    }
    
    fd.append("category_id", payload.category_id ?? "");
    fd.append("have_certificate", payload.have_certificate ? 1 : 0);
    fd.append("level", payload.level ?? "");
    fd.append("user_type", payload.user_type ?? "");

    if (payload.image instanceof File) fd.append("image", payload.image);
    if (payload.contentFile) fd.append("file", payload.contentFile);

    // Handle learning translations
    const learningArray = payload.learning || [];
    if (learningArray.length === 0) {
      // Send empty learning array to satisfy API requirements
      fd.append("learning[ar][]", "");
      fd.append("learning[en][]", "");
    } else {
      learningArray.forEach((l, i) => {
        if (typeof l === "object") {
          if (l.ar) fd.append("learning[ar][]", l.ar);
          if (l.en) fd.append("learning[en][]", l.en);
        } else {
          fd.append("learning[]", l);
        }
      });
    }
    
    // Handle requirement translations
    const requirementArray = payload.requirement || [];
    if (requirementArray.length === 0) {
      // Send empty requirement array to satisfy API requirements
      fd.append("requirement[ar][]", "");
      fd.append("requirement[en][]", "");
    } else {
      requirementArray.forEach((r, i) => {
        if (typeof r === "object") {
          if (r.ar) fd.append("requirement[ar][]", r.ar);
          if (r.en) fd.append("requirement[en][]", r.en);
        } else {
          fd.append("requirement[]", r);
        }
      });
    }
    
    // Handle main_axes translations
    const mainAxesArray = payload.main_axes || [];
    if (mainAxesArray.length > 0) {
      mainAxesArray.forEach((axis) => {
        if (typeof axis === "object") {
          if (axis.ar) fd.append("main_axes[ar][]", axis.ar);
          if (axis.en) fd.append("main_axes[en][]", axis.en);
        } else {
          fd.append("main_axes[]", axis);
        }
      });
    }
    
    // Handle notes
    if (payload.notes) {
      fd.append("notes", payload.notes);
    }
    
    // Handle sections translations
    const sectionsArray = payload.sections || [];
    if (sectionsArray.length === 0) {
      // Send empty sections array to satisfy API requirements
      fd.append("sections[0][title][ar]", "");
      fd.append("sections[0][title][en]", "");
    } else {
      sectionsArray.forEach((section, i) => {
        if (section && typeof section === "object" && section.title) {
          if (typeof section.title === "object") {
            if (section.title.ar) fd.append(`sections[${i}][title][ar]`, section.title.ar);
            if (section.title.en) fd.append(`sections[${i}][title][en]`, section.title.en);
          } else {
            fd.append(`sections[${i}][title]`, String(section.title));
          }
        } else if (section != null && String(section).trim() !== "") {
          fd.append(`sections[${i}][title]`, String(section));
        }
      });
    }

    // Duration can be set for all program types
    if (payload.duration !== undefined && payload.duration !== null && payload.duration !== '') {
      const durationNum = Number(payload.duration);
      if (!isNaN(durationNum) && durationNum > 0) {
        fd.append("duration", durationNum);
      }
    }

    // Live program fields
    if ((normalizedType || "").toLowerCase() === "live") {
      if (payload.date_from) fd.append("date_from", payload.date_from);
      if (payload.date_to) fd.append("date_to", payload.date_to);
      if (payload.time) fd.append("time", payload.time);
    }

    // Registered program fields
    if ((normalizedType || "").toLowerCase() === "registered") {
      if (payload.date_from) fd.append("date_from", payload.date_from);
    }

    // Onsite program fields
    if ((normalizedType || "").toLowerCase() === "onsite") {
      if (payload.date_from) fd.append("date_from", payload.date_from);
      if (payload.date_to) fd.append("date_to", payload.date_to);
      if (payload.address) fd.append("address", payload.address);
      if (payload.url) fd.append("url", payload.url);
    }

    return http.post(`/teacher/programs/${id}`, fd);
  },
};

export default ProgramsService;
