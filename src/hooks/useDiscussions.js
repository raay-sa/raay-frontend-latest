// src/pages/dashboard/hooks/useDiscussions.js
import { useEffect, useState } from "react";
import StudentProgramsService from "../services/student/programsService";

export default function useDiscussions({ progId, currentSessionId, filter }) {
  const [items, setItems] = useState([]);
  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(false);

  const load = async (reset = true) => {
    try {
      const page = reset ? 1 : nextPage;
      let list = [];
      let next = null;

      if (filter === "current" && currentSessionId) {
        const res = await StudentProgramsService.getSessionDiscussions(
          currentSessionId,
          page
        );
        const payload = res?.data?.data;
        list = Array.isArray(payload?.data) ? payload.data : [];
        next = payload?.next_page_url || null;
      } else if (progId) {
        const res = await StudentProgramsService.getProgramDiscussions(
          progId,
          page
        );
        const raw = res?.data?.data;
        list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        next = null;
      }

      if (reset) {
        setItems(list);
        setNextPage(2);
      } else {
        setItems((p) => [...p, ...list]);
        setNextPage(page + 1);
      }
      setHasMore(Boolean(next));
    } catch (e) {
      console.error("Failed to load discussions", e);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, currentSessionId, progId]);

  return { items, hasMore, load };
}
