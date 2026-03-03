// src/hooks/useCompanyRequests.js
import { useCallback, useEffect, useState } from "react";
import { CompanyRequestService } from "../services/companyRequestService";

const ALLOWED_FILTERS = new Set([
  "oldest",
  "latest",
  "name",
  "readable",
  "not_readable",
]);

export default function useCompanyRequests({ filters, search }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, total: 0, last_page: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // اعد الضبط لأول صفحة عند تغير الفلاتر أو البحث
  useEffect(() => setPage(1), [filters, search]);

  const buildParams = useCallback(() => {
    const params = { page };

    // فلتر
    let f = filters?.filter || "latest";
    if (!ALLOWED_FILTERS.has(f)) f = "latest";
    params.filter = f;

    // بحث
    if (search && String(search).trim().length > 0) {
      params.search = String(search).trim();
    }

    return params;
  }, [filters, search, page]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const res = await CompanyRequestService.list(params);
      if (res.data?.success) {
        const paged = res.data.data;
        setData(paged.data || []);
        setMeta({
          current_page: paged.current_page,
          total: paged.total,
          last_page: paged.last_page,
        });
      } else {
        setData([]);
        setMeta({ current_page: 1, total: 0, last_page: 1 });
      }
    } catch (e) {
      console.error("Failed to fetch company requests:", e);
      setData([]);
      setMeta({ current_page: 1, total: 0, last_page: 1 });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    meta,
    loading,
    setPage,
    refetch: fetchData,
  };
}
