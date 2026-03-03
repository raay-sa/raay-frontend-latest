// src/hooks/useManagers.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { ManagersService } from "../services/managersService";

const ALLOWED_FILTERS = new Set(["all", "latest", "oldest", "name"]);

export default function useManagers(initialPage = 1, initialFilters = {}, search = "") {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState(initialFilters);

  const params = useMemo(() => {
    let f = filters?.filter || "all";
    if (!ALLOWED_FILTERS.has(f)) f = "all";

    const p = {
      page,
      filter: f,
    };

    if (search && String(search).trim()) {
      p.search = String(search).trim();
    }

    return p;
  }, [page, filters, search]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ManagersService.list(params);
      const payload = res?.data?.data || res?.data;

      // Support paginated (new) or array (legacy) response
      let managers = [];
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        managers = Array.isArray(payload.data) ? payload.data : [];
        setMeta({
          current_page: Number(payload.current_page) || 1,
          last_page: Number(payload.last_page) || 1,
          total: Number(payload.total) || 0,
        });
      } else if (Array.isArray(payload)) {
        managers = payload;
        setMeta({ current_page: 1, last_page: 1, total: payload.length });
      } else {
        managers = [];
        setMeta({ current_page: 1, last_page: 1, total: 0 });
      }

      setItems(managers);
    } catch (e) {
      console.error("Failed to fetch managers", e);
      setItems([]);
      setMeta({ current_page: 1, last_page: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Reset to page 1 if filters/search change
  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  return {
    items,
    meta,
    loading,
    page,
    setPage,
    filters,
    setFilters,
    refetch: fetchList,
  };
}

