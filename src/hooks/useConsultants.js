// src/hooks/useConsultants.js
import { useCallback, useEffect, useState } from "react";
import { ConsultantsService } from "../services/consultantsService";

const ALLOWED_FILTERS = new Set([
  "all",
  "name",
  "oldest",
  "latest",
  "active_status",
  "inactive_status",
]);

export default function useConsultants({ filters, search }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, total: 0, last_page: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Totals for top stats
  const [totals, setTotals] = useState({
    total_consultants: 0,
    consultants_percentage: 0,
    consultants_status: "stable",
  });

  // Reset to page 1 when filters/search change
  useEffect(() => setPage(1), [filters, search]);

  const buildParams = useCallback(() => {
    const params = { page };

    // filter (whitelisted)
    let f = filters?.filter || "all";
    if (!ALLOWED_FILTERS.has(f)) f = "all";
    params.filter = f;

    // search
    if (search && String(search).trim().length > 0) {
      params.search = String(search).trim();
    }

    return params;
  }, [filters, search, page]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const res = await ConsultantsService.list(params);
      if (res.data?.success) {
        const payload = res.data;
        const paged = payload.data;

        setData(paged?.data || []);
        setMeta({
          current_page: paged?.current_page ?? 1,
          total: paged?.total ?? 0,
          last_page: paged?.last_page ?? 1,
        });

        setTotals({
          total_consultants: payload.total_consultants ?? 0,
          consultants_percentage: payload.consultants_percentage ?? 0,
          consultants_status: payload.consultants_status ?? "stable",
        });
      } else {
        setData([]);
        setMeta({ current_page: 1, total: 0, last_page: 1 });
      }
    } catch (e) {
      console.error("Failed to fetch consultants:", e);
      setData([]);
      setMeta({ current_page: 1, total: 0, last_page: 1 });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, setPage, totals, refetch: fetchData };
}
