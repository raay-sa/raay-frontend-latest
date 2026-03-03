// src/services/teacher/sessionsService.js
import http from "../http";

const SessionsService = {
  // Refresh list of sessions for a section
  getSectionSessions: (sectionId) =>
    http.get(`/teacher/sections/${sectionId}/sessions`),

  // Upload attachments AFTER the session has been created by chunk upload
  uploadAttachments: async (sessionId, files = []) => {
    const fd = new FormData();
    (files || []).forEach((f) => fd.append("files[]", f));
    return http.post(`/teacher/sessions/${sessionId}/attachments`, fd);
  },
  
  // Create session with translations
  createSession: (sectionId, payload) => {
    const fd = new FormData();
    
    if (payload.title && typeof payload.title === "object") {
      if (payload.title.ar) fd.append("title[ar]", payload.title.ar);
      if (payload.title.en) fd.append("title[en]", payload.title.en);
    } else {
      fd.append("title", payload.title ?? "");
    }
    
    if (payload.videoFile) fd.append("file", payload.videoFile);
    
    return http.post(`/teacher/sections/${sectionId}/sessions`, fd);
  },

  // Create session with URL instead of file upload
  createWithUrl: (formData) => {
    return http.post("/teacher/sessions", formData);
  },
  
  // Update session with translations - matches POST /teacher/sessions/{id} with _method: PUT
  updateSession: (sessionId, payload) => {
    const fd = new FormData();
    fd.append("_method", "PUT");
    
    // Title translations
    if (payload.title && typeof payload.title === "object") {
      if (payload.title.ar) fd.append("title[ar]", payload.title.ar);
      if (payload.title.en) fd.append("title[en]", payload.title.en);
    } else {
      fd.append("title", payload.title ?? "");
    }
    
    // Type (registered | live)
    if (payload.type) {
      fd.append("type", payload.type);
    }
    
    // Section ID
    if (payload.section_id) {
      fd.append("section_id", payload.section_id);
    }
    
    // Video file (if new file is being uploaded)
    if (payload.videoFile) {
      fd.append("video", payload.videoFile);
    }
    
    // Video URL (if updating to URL type)
    if (payload.url) {
      fd.append("url", payload.url);
    }
    
    // Duration (for URL videos)
    if (payload.duration) {
      fd.append("duration", payload.duration);
    }
    
    // Attachments/files
    if (Array.isArray(payload.files) && payload.files.length > 0) {
      payload.files.forEach((file) => {
        fd.append("files[]", file);
      });
    }
    
    return http.post(`/teacher/sessions/${sessionId}`, fd);
  },
  
  // Delete session
  deleteSession: (sessionId) =>
    http.delete(`/teacher/sessions/${sessionId}`),
};

export default SessionsService;
