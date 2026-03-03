// src/hooks/useWorkshops.js
import { useCallback, useEffect, useState } from "react";
import { WorkshopsService } from "../services/workshopsService";

const STATUS = ["pending", "approved", "rejected"]; // backend constraint

export default function useWorkshops({ status, search }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, total: 0, last_page: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [status, search]);

  const buildParams = useCallback(() => {
    const params = { page };
    if (status && STATUS.includes(status)) params.status = status;
    if (search && String(search).trim().length > 0) params.search = String(search).trim();
    return params;
  }, [status, search, page]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const res = await WorkshopsService.list(params);
      if (res.data?.success) {
        const p = res.data.data;
        setData(p?.data || []);
        setMeta({
          current_page: p?.current_page ?? 1,
          total: p?.total ?? 0,
          last_page: p?.last_page ?? 1,
        });
      } else {
        setData([]);
        setMeta({ current_page: 1, total: 0, last_page: 1 });
      }
    } catch (e) {
      console.error("Failed to fetch workshops:", e);
      setData([]);
      setMeta({ current_page: 1, total: 0, last_page: 1 });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, meta, loading, setPage, refetch: fetchData };
}


