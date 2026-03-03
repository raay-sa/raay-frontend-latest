// src/services/teacher/liveService.js
import http from "../http";

const LiveService = {
  createStream: (programId) =>
    http.post(`/teacher/create_stream`, { program_id: programId }),

  // NEW SIGNATURE: delete by streamId only
  deleteStream: (streamId) =>
    http.delete(`/teacher/delete_stream/${encodeURIComponent(streamId)}`),

  markLive: (programId) =>
    http.post(`/teacher/online_program`, { program_id: programId }),

  markOffline: (programId) =>
    http.post(`/teacher/offline_program`, { program_id: programId }),

  checkSystemSettings: () =>
    http.get(`/system-settings`),
};

export default LiveService;
