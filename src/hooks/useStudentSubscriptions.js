import { useCallback, useEffect, useState } from "react";
import StudentSubscriptionsService from "../services/subscriptionsService";
import { processProgramsList } from "../utils/translations";

export default function useStudentSubscriptions() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await StudentSubscriptionsService.list({ page });
      const d = data?.data || data || {};
      const list = Array.isArray(d.data) ? d.data : [];

      setRows(processProgramsList(list));
      setPagination({
        current_page: d.current_page ?? 1,
        last_page: d.last_page ?? 1,
        total: d.total ?? list.length,
        per_page: d.per_page ?? 10,
      });
    } catch (e) {
      console.error("Failed to load subscriptions", e);
      setRows([]);
      setPagination((p) => ({ ...p, current_page: 1, last_page: 1, total: 0 }));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    loading,
    rows,
    pagination,
    page,
    setPage,
    refetch: fetch,
  };
}
