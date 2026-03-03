// src/hooks/useSkills.js
import { useCallback, useEffect, useState } from "react";
import { SkillsService } from "../services/skillsService";
import { extractTranslation, getCurrentLocale } from "../utils/translations";

const ALLOWED_FILTERS = new Set(["oldest", "latest", "name"]);

export default function useSkills({ filters, search }) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, total: 0, last_page: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [filters, search]);

  const buildParams = useCallback(() => {
    const params = { page };
    let f = filters?.filter || "latest";
    if (!ALLOWED_FILTERS.has(f)) f = "latest";
    params.filter = f;
    if (search && String(search).trim().length > 0) {
      params.search = String(search).trim();
    }
    return params;
  }, [filters, search, page]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const res = await SkillsService.list(params);
      if (res.data?.success) {
        const p = res.data.data;
        const list = Array.isArray(p?.data) ? p.data : [];

        // Normalize category title from translations based on current locale
        const locale = getCurrentLocale();
        const normalized = list.map((item) => {
          const category = item?.category;
          if (category) {
            const title = extractTranslation(category, "title", locale);
            return {
              ...item,
              category: { ...category, title },
            };
          }
          return item;
        });

        setData(normalized);
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
      console.error("Failed to fetch skills:", e);
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
