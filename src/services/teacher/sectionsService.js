// src/services/teacher/sectionsService.js
import http from "../http";

const SectionsService = {
  getProgramSections: (programId) =>
    http.get(`/teacher/programs/${programId}/sections`),
  getSectionSessions: (sectionId) =>
    http.get(`/teacher/sections/${sectionId}/sessions`),
  
  // Create section with translations
  createSection: (programId, payload) => {
    const fd = new FormData();
    
    if (payload.title && typeof payload.title === "object") {
      if (payload.title.ar) fd.append("title[ar]", payload.title.ar);
      if (payload.title.en) fd.append("title[en]", payload.title.en);
    } else {
      fd.append("title", payload.title ?? "");
    }
    
    return http.post(`/teacher/programs/${programId}/sections`, fd);
  },
  
  // Update section with translations
  updateSection: (sectionId, payload) => {
    const fd = new FormData();
    fd.append("_method", "PUT");
    
    if (payload.title && typeof payload.title === "object") {
      if (payload.title.ar) fd.append("title[ar]", payload.title.ar);
      if (payload.title.en) fd.append("title[en]", payload.title.en);
    } else {
      fd.append("title", payload.title ?? "");
    }
    
    return http.post(`/teacher/sections/${sectionId}`, fd);
  },
  
  // Delete section
  deleteSection: (sectionId) =>
    http.delete(`/teacher/sections/${sectionId}`),
};

export default SectionsService;
