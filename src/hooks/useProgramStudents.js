// src/hooks/useProgramStudents.js
import { useState, useEffect, useMemo, useCallback } from "react";
import TraineesService from "../services/admin/traineesService";
import ProgramsService from "../services/teacher/programsService";

export default function useProgramStudents(programId, userType = "admin", initialPage = 1, initialFilters = {}) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(initialPage);

  // Transform filters to match API parameters
  const apiParams = useMemo(() => {
    const { search, ...rest } = filters || {};

    const params = {
      ...rest,
      ...(search && String(search).trim() ? { search: String(search).trim() } : {}),
    };

    // Remove empty values
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    return params;
  }, [filters]);

  const fetchData = useCallback(async (pageNum, params) => {
    setLoading(true);
    try {
      const requestParams = {
        page: pageNum,
        ...params,
      };

      // Use appropriate service based on user type
      const service = userType === "admin" ? TraineesService : ProgramsService;
      const response = await service.getProgramStudents(programId, requestParams);
      const payload = response?.data || {};
      
      // The API response structure: { data: { current_page, data: [...], last_page, ... } }
      const responseData = payload.data?.data || [];
      const responseMeta = payload.data || {};

      // Transform data to match the expected structure
      const transformedData = responseData.map((item, index) => {
        return {
          id: item.id,
          idx: (pageNum - 1) * (responseMeta.per_page || 10) + index + 1,
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          image: item.image,
          type: item.type || 'trainee',
          programs_count: item.programs_count || 0,
          reviews_count: item.reviews_count || 0,
          assignments_status: item.assignments_status || 'not_started',
          assignments_progress: item.assignments_progress || 0,
          exam_score: item.exam_score || 0,
          student_progress: item.student_progress || 0,
          raw: item, // Keep original data
        };
      });

      setData(transformedData);
      setMeta({
        current_page: responseMeta.current_page || 1,
        last_page: responseMeta.last_page || 1,
        per_page: responseMeta.per_page || 10,
        total: responseMeta.total || 0,
      });
    } catch (error) {
      console.error("Error fetching program students:", error);
      setData([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, [programId, userType]);

  useEffect(() => {
    if (programId) {
      fetchData(page, apiParams);
    }
  }, [fetchData, page, apiParams]);

  const refetch = useCallback(
    () => fetchData(page, apiParams),
    [fetchData, page, apiParams]
  );

  return {
    data,
    meta,
    loading,
    filters,
    setFilters,
    setPage,
    refetch,
  };
}
