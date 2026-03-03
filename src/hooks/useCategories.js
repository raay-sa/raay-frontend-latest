// src/hooks/useCategories.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { CategoriesService } from "../services/categoriesService";

const ALLOWED_FILTERS = new Set(["all", "name", "latest", "oldest"]);

export default function useCategories(
  initialPage = 1,
  initialFilters = {},
  search = ""
) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState(initialFilters);

  const params = useMemo(() => {
    let f = filters?.filter || "all";
    if (!ALLOWED_FILTERS.has(f)) f = "all";

    const p = {
      page,
      filter: f, // all | name | latest | oldest
    };

    if (search && String(search).trim()) p.search = String(search).trim();

    return p;
  }, [page, filters, search]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await CategoriesService.list(params);
      const payload = res?.data?.data;

      // Support paginated (new) or array (legacy)
      let categories = [];
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        categories = Array.isArray(payload.data) ? payload.data : [];
        setMeta({
          current_page: Number(payload.current_page) || 1,
          last_page: Number(payload.last_page) || 1,
          total:
            Number(payload.total) ||
            (Array.isArray(payload.data) ? payload.data.length : 0),
        });
      } else if (Array.isArray(payload)) {
        categories = payload;
        setMeta({ current_page: 1, last_page: 1, total: payload.length });
      } else {
        categories = [];
        setMeta({ current_page: 1, last_page: 1, total: 0 });
      }

      // Process categories to extract titles from translations
      const processedCategories = categories.map(category => {
        if (category.translations && Array.isArray(category.translations)) {
          const arTranslation = category.translations.find(t => t.locale === 'ar');
          const enTranslation = category.translations.find(t => t.locale === 'en');
          
          return {
            ...category,
            title: arTranslation?.title || category.title || '',
            title_ar: arTranslation?.title || '',
            title_en: enTranslation?.title || '',
          };
        }
        return category;
      });

      setItems(processedCategories);
    } catch (e) {
      console.error("Failed to fetch categories", e);
      setItems([]);
      setMeta({ current_page: 1, last_page: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Reset to page 1 if filters/search change
  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  return {
    items,
    meta,
    loading,
    page,
    setPage,
    filters,
    setFilters,
    refetch: fetchList,
  };
}
