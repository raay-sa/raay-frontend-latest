// src/hooks/useAccounts.js
import { useEffect, useState, useCallback } from "react";
import { AccountsService } from "../services/accountsService";

const ALLOWED_FILTERS = new Set([
  "all",
  "name",
  "oldest",
  "latest",
  "active_status",
  "inactive_status",
]);

export default function useAccounts({ activeTab, filters, search }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, total: 0, last_page: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totals, setTotals] = useState({
    total_students: 0,
    student_percentage: 0,
    student_status: "stable",
    total_teachers: 0,
    teacher_percentage: 0,
    teacher_status: "stable",
    total_profit: 0,
    profit_percentage: 0,
    profit_status: "stable",
  });

  // Reset to page 1 whenever inputs change
  useEffect(() => setPage(1), [activeTab, filters, search]);

  const buildApiParams = useCallback(() => {
    const params = {
      page,
      users_type:
        activeTab === "trainees"
          ? "students"
          : activeTab === "experts"
          ? "teacher"
          : "transactions",
    };

    // search
    if (search && String(search).trim().length > 0) {
      params.search = String(search).trim();
    }

    // unified filter (whitelisted)
    let f = filters?.filter || "all";
    if (!ALLOWED_FILTERS.has(f)) f = "all";
    params.filter = f;

    // price range → price_from / price_to
    if (Array.isArray(filters?.price) && filters.price.length === 2) {
      params.price_from = Number(filters.price[0]);
      params.price_to = Number(filters.price[1]);
    }

    // category (experts only)
    if (activeTab === "experts") {
      if (filters?.category_id !== undefined && filters?.category_id !== null) {
        params.category_id = filters.category_id;
      }
    }

    return params;
  }, [activeTab, page, filters, search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildApiParams();
      const response = await AccountsService.list(params);

      if (response.data.success) {
        const res = response.data;
        let tabData;
        if (activeTab === "trainees") tabData = res.students;
        else if (activeTab === "experts") tabData = res.teachers;
        else tabData = res.transactions;

        setData(tabData.data || []);
        setMeta({
          current_page: tabData.current_page,
          total: tabData.total,
          last_page: tabData.last_page,
        });

        setTotals({
          total_students: res.total_students ?? 0,
          student_percentage: res.student_percentage ?? 0,
          student_status: res.student_status ?? "stable",

          total_teachers: res.total_teachers ?? 0,
          teacher_percentage: res.teacher_percentage ?? 0,
          teacher_status: res.teacher_status ?? "stable",

          total_profit: res.total_profit ?? 0,
          profit_percentage: res.profit_percentage ?? 0,
          profit_status: res.profit_status ?? "stable",
        });
      } else {
        setData([]);
        setMeta({ current_page: 1, total: 0, last_page: 1 });
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
      setData([]);
      setMeta({ current_page: 1, total: 0, last_page: 1 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, buildApiParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, meta, loading, setPage, totals, refetch: fetchData };
}
