// src/hooks/useNotifications.js
import { useEffect, useState } from "react";
import { NotificationsService } from "../services/notificationsService";

// Map UI values → API values
const mapTypeToApi = (v) => {
  if (v === "تنبيه") return "alert";
  if (v === "عرض") return "offer";
  if (v === "اشعار") return "notice";
  return undefined; // 'all' or unknown → no filter
};

const mapTargetToApi = (v) => {
  if (v === "متدرب") return "student";
  if (v === "خبير") return "teacher";
  return undefined; // 'all' → no filter
};

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    type: "all",
    target: "all",
    status: "all", // client-side only
  });

  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        search: searchDebounced || undefined,
        type: mapTypeToApi(filters.type),
        users_type: mapTargetToApi(filters.target),
      };

      const res = await NotificationsService.list(params);
      const pagination = res?.data?.data;

      const raw = pagination?.data ?? [];
      const data = Array.isArray(raw) ? raw : [];

      setNotifications(
        data.map((item) => ({
          id: item.id,
          type:
            item.type === "alert"
              ? "تنبيه"
              : item.type === "offer"
              ? "عرض"
              : "اشعار",
          title: item.title,
          content: item.content,
          target:
            item.users_type?.includes?.("student") &&
            item.users_type?.includes?.("teacher")
              ? "الكل"
              : item.users_type?.includes?.("student")
              ? "متدرب"
              : "خبير",
          status: item.status || "غير مرسل",
          date: new Date(item.created_at).toISOString().split("T")[0],
        }))
      );

      setMeta({
        currentPage: pagination?.current_page ?? 1,
        lastPage: pagination?.last_page ?? 1,
        total: pagination?.total ?? 0,
        perPage: parseInt(pagination?.per_page ?? 10, 10),
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // expose reload for external refetch (after delete)
  const reload = async () => {
    await fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.type, filters.target, searchDebounced]);

  const onPageChange = (pageNum) => setPage(pageNum);
  const onFiltersChange = (next) => {
    setFilters(next);
    setPage(1);
  };
  const onSearchChange = (val) => {
    setSearchInput(val);
    setPage(1);
  };

  return {
    notifications,
    meta,
    isLoading,
    onPageChange,
    filters,
    onFiltersChange,
    search: searchInput,
    onSearchChange,
    reload, // NEW
  };
}
