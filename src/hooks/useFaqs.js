// src/hooks/useFaqs.js
import { useEffect, useState } from "react";
import { FaqsService } from "../services/faqsService";

// UI ↔ API mappers
const mapTargetToApi = (v) => {
  if (v === "متدرب") return "student";
  if (v === "خبير") return "teacher";
  return undefined; // 'all' → omit
};

const mapFilterToApi = (v) => {
  if (v === "name") return "name";
  if (v === "latest") return "latest";
  if (v === "oldest") return "oldest";
  return undefined; // 'all' → omit
};

const mapUserTypeToUi = (u) => (u === "student" ? "متدرب" : "خبير");

export default function useFaqs(initial = { sort: "all", target: "all" }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState(initial);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        search: search || undefined,
        filter: mapFilterToApi(filters.sort),
        users_type: mapTargetToApi(filters.target),
      };
      const res = await FaqsService.list(params);
      const paged = res?.data?.data;
      const rows = Array.isArray(paged?.data) ? paged.data : [];

      setData(
        rows.map((r) => ({
          id: r.id,
          question: r.question,
          content: r.answer,
          status: r.status === 1 ? "نشط" : "غير نشط",
          target: mapUserTypeToUi(r.user_type),
          created_at: r.created_at,
        }))
      );

      setMeta({
        currentPage: paged?.current_page ?? 1,
        lastPage: paged?.last_page ?? 1,
        total: paged?.total ?? 0,
        perPage: parseInt(paged?.per_page ?? 10, 10),
      });
    } catch (e) {
      console.error("Failed to fetch FAQs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.sort, filters.target, search]);

  const reload = () => fetchFaqs();

  return {
    data,
    meta,
    loading,
    setPage,
    filters,
    setFilters: (next) => {
      setFilters(next);
      setPage(1);
    },
    search: searchInput,
    setSearch: (val) => {
      setSearchInput(val);
      setPage(1);
    },
    reload,
  };
}

export { useFaqs };
