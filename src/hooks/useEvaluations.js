import { useEffect, useState, useCallback } from "react";
import { EvaluationsService } from "../services/evaluationsService";

export default function useEvaluations(page = 1) {
  const [evaluations, setEvaluations] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadEvaluations = useCallback(
    async (pageNum) => {
      setLoading(true);
      try {
        const res = await EvaluationsService.list(pageNum || page);
        const payload = res?.data?.data;
        setEvaluations(Array.isArray(payload?.data) ? payload.data : []);
        setPagination({
          currentPage: payload?.current_page ?? 1,
          lastPage: payload?.last_page ?? 1,
          total: payload?.total ?? 0,
        });
      } catch (err) {
        console.error("Failed to fetch evaluations", err);
        setEvaluations([]);
        setPagination({ currentPage: 1, lastPage: 1, total: 0 });
      }
      setLoading(false);
    },
    [page]
  );

  useEffect(() => {
    loadEvaluations(page);
  }, [page, loadEvaluations]);

  return { evaluations, pagination, loading, reload: loadEvaluations };
}
