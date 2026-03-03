import http from "./http";

const SearchService = {
  searchPrograms: (query) =>
    http.get("/student/search_programs", {
      params: { search: query || "" },
    }),
};

export default SearchService;
