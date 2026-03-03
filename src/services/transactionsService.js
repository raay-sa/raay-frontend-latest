import http from "./http";

const StudentTransactionsService = {
  list: (params = {}) =>
    http.get("/student/transactions", {
      params: {
        page: params.page ?? 1,
        filter: params.filter ?? "all",
      },
    }),

  show: (id) => http.get(`/student/transactions/${id}`),

  invoiceBlob: async (id) => {
    const res = await http.get(`/student/transactions/${id}/invoice`, {
      responseType: "blob",
    });
    return res;
  },
};

export default StudentTransactionsService;
