import http from "./http";

const StudentSubscriptionsService = {
  list: (params = {}) =>
    http.get("/student/subscriptions", {
      params: {
        page: params.page ?? 1,
      },
    }),
};

export default StudentSubscriptionsService;