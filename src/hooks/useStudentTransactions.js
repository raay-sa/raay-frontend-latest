import { useCallback, useEffect, useState } from "react";
import StudentTransactionsService from "../services/transactionsService";

export default function useStudentTransactions() {
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all | oldest | latest | successful | failed
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });

  const [summary, setSummary] = useState({
    total_count: 0,
    success_count: 0,
    failed_count: 0,
  });

  const baseUrl = import.meta.env.VITE_BASE_URL || "";

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await StudentTransactionsService.list({ page, filter });
      const d = data?.data || data || {};
      const list = Array.isArray(d.data) ? d.data : [];

      setRows(list);
      setPagination({
        current_page: d.current_page ?? 1,
        last_page: d.last_page ?? 1,
        total: d.total ?? list.length,
        per_page: d.per_page ?? 10,
      });

      setSummary({
        total_count: data?.total_count ?? 0,
        success_count: data?.success_count ?? 0,
        failed_count: data?.failed_count ?? 0,
      });
    } catch (e) {
      console.error("Failed to fetch transactions", e);
      setRows([]);
      setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
      setSummary({ total_count: 0, success_count: 0, failed_count: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    loading,
    rows,
    pagination,
    page,
    setPage,
    filter,
    setFilter,
    summary,
    baseUrl,
    refetch: fetch,
  };
}
