import { useCallback, useEffect, useState } from "react";
import TraineesService from "../../services/teacher/traineesService";

export default function useTeacherTrainees({ filters, search }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState({
    students_count: 0,
    students_percentage: 0,
    students_status: "increase",
    programs_count: 0,
    program_percentage: 0,
    program_status: "increase",
    tasks_count: 0,
    tasks_percentage: 0,
    tasks_status: "increase",
    profit: 0,
    profit_percentage: 0,
    profit_status: "increase",
  });

  // reset to first page when filters/search change
  useEffect(() => setPage(1), [filters, search]);

  // one and only "filter" param (API expects a single filter flag)
  const buildParams = useCallback(() => {
    const p = { page };

    if (search?.trim()) p.search = search.trim();

    // precedence: tasks > exams > programType > sort
    if (filters?.tasks && filters.tasks !== "all") {
      p.filter = filters.tasks; // not_started_tasks | not_completed_tasks | completed_tasks
    } else if (filters?.exams && filters.exams !== "all") {
      p.filter = filters.exams === "passed" ? "passed" : "not_passed";
    } else if (filters?.programType === "live") {
      p.filter = "live_type";
    } else if (filters?.programType === "registered") {
      p.filter = "registered_type";
    } else if (filters?.sort === "latest") {
      p.filter = "latest";
    } else if (filters?.sort === "oldest") {
      p.filter = "oldest";
    } else {
      p.filter = "all";
    }

    if (filters?.payment && filters.payment !== "all") {
      p.payment = filters.payment; // successful | failed
    }

    if (Array.isArray(filters?.price)) {
      p.price_min = Number(filters.price[0] ?? 0);
      p.price_max = Number(filters.price[1] ?? 0);
    }

    return p;
  }, [page, filters, search]);

  const mapRow = (r) => ({
    id: r.id,
    idx: r.id,
    trainee_name: r.student?.name || "—",
    trainee_email: r.student?.email || r.student?.phone || "—",
    trainee_img: r.student?.image || null,
    program_title: r.program?.title || "—",
    program_type: r.program?.type || "registered",
    tasks_state: r.program?.assignments_status || "not_started",
    exam_score: Number(r.program?.exam_score ?? 0),
    price: Number(r.price ?? 0),
    pay_state: r.transaction_status || "successful",
    date: (r.created_at || "").split("T")[0]?.replace(/-/g, " / "),
    raw: r,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await TraineesService.list(buildParams());
      const d = res?.data || {};
      const pag = d.data || {};

      setData((pag.data || []).map(mapRow));
      setMeta({
        current_page: pag.current_page || 1,
        last_page: pag.last_page || 1,
        total: pag.total || 0,
      });

      setStats({
        students_count: d.students_count ?? 0,
        students_percentage: d.students_percentage ?? 0,
        students_status: d.students_status ?? "increase",
        programs_count: d.programs_count ?? 0,
        program_percentage: d.program_percentage ?? 0,
        program_status: d.program_status ?? "increase",
        tasks_count: d.tasks_count ?? 0,
        tasks_percentage: d.tasks_percentage ?? 0,
        tasks_status: d.tasks_status ?? "increase",
        profit: d.profit ?? 0,
        profit_percentage: d.profit_percentage ?? 0,
        profit_status: d.profit_status ?? "increase",
      });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    meta, // { current_page, last_page, total }
    loading,
    setPage, // pass to DataTable -> serverPagination.onPageChange
    stats, // header cards
    refresh: fetchData, // optional manual refresh
  };
}
