// src/services/student/liveService.js
import http from "../http";

const StudentLiveService = {
  getStream: (programId) =>
    http.get(`/student/get_stream/program/${programId}`),
};

export default StudentLiveService;
