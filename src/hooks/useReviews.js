import { useEffect, useState, useCallback } from "react";
import { ReviewsService } from "../services/reviewsService";

/**
 * API (example):
 * {
 *   success: true,
 *   total: 8,
 *   review_percentage: 85.71,
 *   review_status: "decrease",
 *   positive: 8,
 *   positive_percentage: 85.71,
 *   positive_status: "decrease",
 *   negative: 0,
 *   negative_percentage: 100,
 *   negative_status: "increase",
 *   data: { current_page, last_page, total, data: [...] }
 * }
 */
export default function useReviews({
  page = 1,
  filters = { sort: "all", score: 0 },
  search = "",
}) {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // include all stats fields we need for cards
  const [stats, setStats] = useState({
    total: 0,
    review_percentage: 0,
    review_status: "stable",
    positive: 0,
    positive_percentage: 0,
    positive_status: "stable",
    negative: 0,
    negative_percentage: 0,
    negative_status: "stable",
  });

  const buildParams = useCallback(() => {
    const params = { page };

    // single `filter` param from sort
    if (filters?.sort && filters.sort !== "all") {
      params.filter = filters.sort; // name | latest | oldest
    }

    // score
    if (filters?.score && Number(filters.score) > 0) {
      params.score = Number(filters.score);
    }

    // search
    if (search && String(search).length > 0) {
      params.search = String(search);
    }

    return params;
  }, [page, filters, search]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ReviewsService.list(buildParams());
      const body = res?.data || {};

      // stats
      setStats({
        total: body.total ?? 0,
        review_percentage: body.review_percentage ?? 0,
        review_status: body.review_status ?? "stable",
        positive: body.positive ?? 0,
        positive_percentage: body.positive_percentage ?? 0,
        positive_status: body.positive_status ?? "stable",
        negative: body.negative ?? 0,
        negative_percentage: body.negative_percentage ?? 0,
        negative_status: body.negative_status ?? "stable",
      });

      // data + pagination
      const dataBlock = body.data;
      setReviews(dataBlock?.data || []);
      setPagination({
        currentPage: dataBlock?.current_page ?? 1,
        lastPage: dataBlock?.last_page ?? 1,
        total: dataBlock?.total ?? 0,
      });
    } catch (err) {
      console.error("Failed to fetch reviews", err);
      setReviews([]);
      setPagination({ currentPage: 1, lastPage: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return { reviews, pagination, loading, stats, reload: loadReviews };
}
