// src/hooks/admin/useAdminTrainees.js
import { useState, useEffect, useMemo, useCallback } from "react";
import TraineesService from "../../services/admin/traineesService";

export default function useAdminTrainees(initialPage = 1, initialFilters = {}) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [stats, setStats] = useState({
    profit: 0,
    profit_percentage: 0,
    profit_status: "increase",
    tasks_count: 0,
    tasks_percentage: 0,
    tasks_status: "increase",
    programs_count: 0,
    program_percentage: 0,
    program_status: "increase",
    students_count: 0,
    students_percentage: 0,
    students_status: "increase",
  });

  // Transform filters to match API parameters
  const apiParams = useMemo(() => {
    const { sort, programType, tasks, exams, search, ...rest } = filters || {};

    let filter = "all";
    
    // Map UI filters to API filter values
    if (sort && sort !== "all") {
      filter = sort; // name, oldest, latest
    } else if (programType && programType !== "all") {
      filter = programType; // live_type, registered_type
    } else if (tasks && tasks !== "all") {
      filter = tasks; // not_started_tasks, not_completed_tasks, completed_tasks
    } else if (exams && exams !== "all") {
      filter = exams; // passed, not_passed
    }

    const params = {
      ...rest,
      ...(filter && filter !== "all" ? { filter } : {}),
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

      const response = await TraineesService.list(requestParams);
      const payload = response?.data || {};
      
      // The API response structure: { data: { current_page, data: [...], last_page, ... }, students_count, ... }
      const responseData = payload.data?.data || [];
      const responseMeta = payload.data || {};
      const responseStats = {
        profit: payload.profit || 0,
        profit_percentage: payload.profit_percentage || 0,
        profit_status: payload.profit_status || "increase",
        tasks_count: payload.tasks_count || 0,
        tasks_percentage: payload.tasks_percentage || 0,
        tasks_status: payload.tasks_status || "increase",
        programs_count: payload.programs_count || 0,
        program_percentage: payload.program_percentage || 0,
        program_status: payload.program_status || "increase",
        students_count: payload.students_count || 0,
        students_percentage: payload.students_percentage || 0,
        students_status: payload.students_status || "increase",
      };

      // Transform data to match the expected structure
      const transformedData = responseData.map((item, index) => {
        const student = item.student || {};
        const program = item.program || {};
        const translations = program.translations || [];
        const arTranslation = translations.find(t => t.locale === 'ar') || translations[0] || {};
        
        return {
          id: item.id,
          idx: (pageNum - 1) * (responseMeta.per_page || 10) + index + 1,
          trainee_name: student.name || '',
          trainee_email: student.email || '',
          trainee_img: student.image,
          program_title: arTranslation.title || '',
          program_type: program.type || 'registered',
          tasks_state: program.assignments_status || 'not_started',
          exam_score: program.exam_score || 0,
          student_progress: program.student_progress || 0,
          price: item.price || 0,
          pay_state: 'successful', // This might need to be determined from other fields
          date: new Date(item.created_at).toLocaleDateString('ar-SA'),
          raw: item, // Keep original data for expanded row details
        };
      });

      setData(transformedData);
      setMeta({
        current_page: responseMeta.current_page || 1,
        last_page: responseMeta.last_page || 1,
        per_page: responseMeta.per_page || 10,
        total: responseMeta.total || 0,
      });
      setStats(responseStats);
    } catch (error) {
      console.error("Error fetching trainees data:", error);
      setData([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, apiParams);
  }, [page, apiParams, fetchData]);

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
    stats,
    refetch,
  };
}
