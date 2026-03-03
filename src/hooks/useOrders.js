// src/hooks/useOrders.js
import { useEffect, useMemo, useState, useCallback } from "react";
import { OrdersService } from "../services/ordersService";


export function useOrders({ filters, search, category }) {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
    const [stats, setStats] = useState({
    total_orders: 0,
    total_profit: 0,
    completed: 0,
    rejected: 0,
  });

  // Reset to page 1 when any control changes
  useEffect(() => setPage(1), [filters, search, category]);

  // Map UI state to API params
  const buildParams = useCallback(() => {
    const params = { page };

    // Single `filter` param: category (quick tab) overrides status/sort
    if (category && category !== "all") {
      if (category === "completed") params.filter = "completed_status";
      else if (category === "rejected") params.filter = "failed_status";
    } else {
      if (filters?.status && filters.status !== "all") {
        // Map frontend status to backend filter
        if (filters.status === "completed") params.filter = "completed_status";
        else if (filters.status === "successful") params.filter = "completed_status";
        else params.filter = filters.status; // failed_status, etc.
      } else if (filters?.sort && filters.sort !== "all") {
        params.filter = filters.sort; // name | latest | oldest
      }
    }

    // search
    if (search && String(search).length > 0) {
      params.search = String(search);
    }

    // payment_method
    if (filters?.payment && filters.payment !== "all") {
      params.payment_method = filters.payment;
    }

    // price range
    if (Array.isArray(filters?.price) && filters.price.length === 2) {
      params.price_from = filters.price[0];
      params.price_to = filters.price[1];
    }

    return params;
  }, [page, category, filters, search]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await OrdersService.list(buildParams());
      const data = res.data?.data || {};
      setOrders(data.data || []);
      setMeta({
        currentPage: data.current_page || 1,
        lastPage: data.last_page || 1,
        total: data.total || 0,
        perPage: data.per_page || 10,
      });

  setStats( {
     total_orders : res.data.total_orders,
     completed : res.data.completed_ordered,
     rejected : res.data.failed_ordered,
     total_profit : res.data.total_profit
  });

    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const onPageChange = (n) => setPage(n);

  return {
    orders,
    stats,
    meta,
    isLoading,
    onPageChange,
  };
}
