// src/hooks/useRegisterRequests.js
import { useCallback, useEffect, useState } from "react";
import RegisterRequestsService from "../services/registerRequestsService";

export default function useRegisterRequests() {
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("all"); // all | name | oldest | latest
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [summary, setSummary] = useState({
    total_students: 0,
    student_percentage: 0,
    student_status: "stable",
    total_teachers: 0,
    teacher_percentage: 0,
    teacher_status: "stable",
  });

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await RegisterRequestsService.list({
        page,
        filter,
        search,
      });
      const d = data?.data || data || {};

      setSummary({
        total_students: d.total_students ?? 0,
        student_percentage: d.student_percentage ?? 0,
        student_status: d.student_status ?? "stable",
        total_teachers: d.total_teachers ?? 0,
        teacher_percentage: d.teacher_percentage ?? 0,
        teacher_status: d.teacher_status ?? "stable",
      });

      const t = d.teachers || {};
      setRows(Array.isArray(t.data) ? t.data : []);
      setPagination({
        current_page: t.current_page ?? 1,
        last_page: t.last_page ?? 1,
        total: t.total ?? 0,
        per_page: t.per_page ?? 10,
      });
    } catch (e) {
      console.error("Failed to fetch register requests", e);
      setRows([]);
      setPagination({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const approve = useCallback(
    async (teacherId) => {
      await RegisterRequestsService.approveTeacher(teacherId);
      await fetch();
    },
    [fetch]
  );

  const reject = useCallback(
    async (teacherId) => {
      await RegisterRequestsService.rejectTeacher(teacherId);
      await fetch();
    },
    [fetch]
  );

  return {
    loading,
    filter,
    setFilter,
    search,
    setSearch,
    page,
    setPage,
    summary,
    rows,
    pagination,
    approve,
    reject,
    refetch: fetch,
  };
}
