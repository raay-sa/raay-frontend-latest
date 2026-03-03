import http from "./http";

const StudentCertificatesService = {
  list: (params = {}) =>
    http.get("/student/certificates", {
      params: {
        page: params.page ?? 1,
      },
    }),
};

export default StudentCertificatesService;
