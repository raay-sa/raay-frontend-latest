// src/services/student/programsService.js
import http from "../http";

const StudentProgramsService = {
  list: (params = {}) => http.get("/student/programs", { params }),
  getOne: (id) => http.get(`/student/programs/${id}`),
  bestPrograms: (params = {}) => http.get("/student/programs/best_programs", { params }),

  // Discussions
  getProgramDiscussions: (programId, page = 1) =>
    http.get(`/student/program/${programId}/discussions`, { params: { page } }),

  getSessionDiscussions: (sessionId, page = 1) =>
    http.get(`/student/session/${sessionId}/discussions`, { params: { page } }),

  createDiscussion: (payload) =>
    http.post(`/student/session_discussions`, payload),

  getProgramCertificate: (programId) =>
    http.get(`/student/certificate/program/${programId}`),

  // PDF (blob) – generates & returns the PDF
  generateCertificate: (programId) =>
    http.post(
      `/student/certificates`,
      { program_id: programId },
      { responseType: "blob" }
    ),
    
  // Helper function to extract translated content
  extractTranslation: (item, field, locale = 'ar') => {
    if (!item || !item.translations) return item[field] || '';
    const translation = item.translations.find(t => t.locale === locale);
    return translation?.[field] || item[field] || '';
  },
  
  // Helper function to process program list with translations
  processProgramsList: (programs) => {
    if (!Array.isArray(programs)) return [];
    return programs.map(program => ({
      ...program,
      title: StudentProgramsService.extractTranslation(program, 'title'),
      description: StudentProgramsService.extractTranslation(program, 'description'),
      learning: StudentProgramsService.extractTranslation(program, 'learning') || [],
      requirement: StudentProgramsService.extractTranslation(program, 'requirement') || [],
      category: program.category ? {
        ...program.category,
        title: StudentProgramsService.extractTranslation(program.category, 'title')
      } : null
    }));
  },
  
  // Helper function to process single program with translations
  processProgram: (program) => {
    if (!program) return null;
    return {
      ...program,
      title: StudentProgramsService.extractTranslation(program, 'title'),
      description: StudentProgramsService.extractTranslation(program, 'description'),
      learning: StudentProgramsService.extractTranslation(program, 'learning') || [],
      requirement: StudentProgramsService.extractTranslation(program, 'requirement') || [],
      sections: Array.isArray(program.sections) ? program.sections.map(section => ({
        ...section,
        title: StudentProgramsService.extractTranslation(section, 'title')
      })) : []
    };
  }
};

export default StudentProgramsService;
