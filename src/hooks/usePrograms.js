// src/hooks/usePrograms.js
import { useEffect, useMemo, useState, useCallback } from "react";
import { ProgramsService } from "../services/programsService";
import { processProgramsList } from "../utils/translations";

export default function usePrograms(initialPage = 1, initialFilters = {}) {
  const [programs, setPrograms] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(initialPage);

  const [stats, setStats] = useState({
    total_count: 0,
    total_program_percentage: 0,
    total_program_status: "stable",
    live_programs_count: 0,
    total_live_program_percentage: 0,
    total_live_program_status: "stable",
    registered_programs_count: 0,
    total_registered_program_percentage: 0,
    total_registered_program_status: "stable",
    deleted_programs_count: 0,
    total_deleted_program_percentage: 0,
    total_deleted_program_status: "stable",
  });

  const apiParams = useMemo(() => {
    const { filter, score, price, price_from, price_to, search, ...rest } =
      filters || {};

    let from = typeof price_from === "number" ? price_from : undefined;
    let to = typeof price_to === "number" ? price_to : undefined;

    if (Array.isArray(price) && price.length === 2) {
      const [min, max] = price;
      if (typeof from !== "number") from = min;
      if (typeof to !== "number") to = max;
    }

    const params = {
      ...rest,
      ...(filter && filter !== "all" ? { filter } : {}),
      ...(typeof score === "number" && score > 0 ? { score } : {}),
      ...(typeof from === "number" ? { price_from: from } : {}),
      ...(typeof to === "number" ? { price_to: to } : {}),
      ...(search && String(search).trim()
        ? { search: String(search).trim() }
        : {}),
    };

    return params;
  }, [filters]);

  const fetchPrograms = useCallback(async (pageNum, params) => {
    setLoading(true);
    try {
      const res = await ProgramsService.list(pageNum, params);
      const payload = res?.data || {};

      const result = payload.data;
      const programsList = Array.isArray(result?.data) ? result.data : [];
      
      // Process programs to extract translations using the utility function
      const processedPrograms = processProgramsList(programsList);
      
      setPrograms(processedPrograms);
      setPagination({
        currentPage: Number(result?.current_page) || 1,
        totalPages: Number(result?.last_page) || 1,
      });

      setStats({
        total_count: payload.total_count ?? 0,
        total_program_percentage: payload.total_program_percentage ?? 0,
        total_program_status: payload.total_program_status ?? "stable",

        live_programs_count: payload.live_programs_count ?? 0,
        total_live_program_percentage:
          payload.total_live_program_percentage ?? 0,
        total_live_program_status:
          payload.total_live_program_status ?? "stable",

        registered_programs_count: payload.registered_programs_count ?? 0,
        total_registered_program_percentage:
          payload.total_registered_program_percentage ?? 0,
        total_registered_program_status:
          payload.total_registered_program_status ?? "stable",

        deleted_programs_count: payload.deleted_programs_count ?? 0,
        total_deleted_program_percentage:
          payload.total_deleted_program_percentage ?? 0,
        total_deleted_program_status:
          payload.total_deleted_program_status ?? "stable",
      });
    } catch (error) {
      console.error("Failed to fetch programs:", error);
      setPrograms([]);
      setPagination({ currentPage: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms(page, apiParams);
  }, [page, apiParams, fetchPrograms]);

  const refetch = useCallback(
    () => fetchPrograms(page, apiParams),
    [fetchPrograms, page, apiParams]
  );

  return {
    programs,
    loading,
    pagination,
    filters,
    setFilters,
    setPage,
    stats,
    refetch,
  };
}
