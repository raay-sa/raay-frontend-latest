// src/hooks/useBanners.js
import { useEffect, useState, useCallback, useMemo } from "react";
import { AdminBannerService } from "../services/bannerService";

const ALLOWED_FILTERS = new Set([
  "all",
  "active",
  "inactive",
  "latest",
  "oldest",
]);

export default function useBanners(initialPage = 1, initialFilters = {}, search = "") {
  const [banners, setBanners] = useState([]);
  const [meta, setMeta] = useState({ 
    current_page: 1, 
    last_page: 1, 
    total: 0 
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState(initialFilters);
  const [stats, setStats] = useState({
    total_banners: 0,
    active_banners: 0,
    total_interested: 0,
    ready_to_start: 0,
  });

  const params = useMemo(() => {
    let f = filters?.filter || "all";
    if (!ALLOWED_FILTERS.has(f)) f = "all";

    const p = {
      page,
      filter: f,
    };

    if (search && String(search).trim()) {
      p.search = String(search).trim();
    }

    return p;
  }, [page, filters, search]);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AdminBannerService.getBanners();
      
      if (response.data?.success !== false) {
        const apiData = response.data?.data;
        const bannersData = apiData?.data || [];
        
        setBanners(Array.isArray(bannersData) ? bannersData : []);
        setMeta({
          current_page: apiData?.current_page || 1,
          last_page: apiData?.last_page || 1,
          total: apiData?.total || 0,
        });

        // Calculate stats from banners data
        const calculatedStats = {
          total_banners: bannersData.length,
          active_banners: bannersData.filter(b => b.status === 'active').length,
          total_interested: bannersData.reduce((sum, b) => sum + (b.interests?.length || 0), 0),
          ready_to_start: bannersData.filter(b => (b.interests?.length || 0) >= (b.min_students || 1)).length,
        };
        setStats(calculatedStats);
      } else {
        setBanners([]);
        setMeta({ current_page: 1, last_page: 1, total: 0 });
        setStats({
          total_banners: 0,
          active_banners: 0,
          total_interested: 0,
          ready_to_start: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch banners:", error);
      setBanners([]);
      setMeta({ current_page: 1, last_page: 1, total: 0 });
      setStats({
        total_banners: 0,
        active_banners: 0,
        total_interested: 0,
        ready_to_start: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Reset to page 1 if filters/search change
  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  const refetch = useCallback(() => {
    fetchBanners();
  }, [fetchBanners]);

  const deleteBanner = useCallback(async (bannerId) => {
    try {
      await AdminBannerService.deleteBanner(bannerId);
      await refetch();
      return true;
    } catch (error) {
      console.error("Failed to delete banner:", error);
      return false;
    }
  }, [refetch]);

  const createBanner = useCallback(async (bannerData) => {
    try {
      const response = await AdminBannerService.createBanner(bannerData);
      await refetch();
      return response;
    } catch (error) {
      console.error("Failed to create banner:", error);
      throw error;
    }
  }, [refetch]);

  const updateBanner = useCallback(async (bannerId, bannerData) => {
    try {
      const response = await AdminBannerService.updateBanner(bannerId, bannerData);
      await refetch();
      return response;
    } catch (error) {
      console.error("Failed to update banner:", error);
      throw error;
    }
  }, [refetch]);

  const getBanner = useCallback(async (bannerId) => {
    try {
      const response = await AdminBannerService.getBanner(bannerId);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Failed to get banner:", error);
      throw error;
    }
  }, []);

  const getInterestedStudents = useCallback(async (bannerId) => {
    try {
      const response = await AdminBannerService.getInterestedStudents(bannerId);
      const studentsData = response.data?.data;
      return studentsData?.data || studentsData || [];
    } catch (error) {
      console.error("Failed to get interested students:", error);
      throw error;
    }
  }, []);

  return {
    banners,
    meta,
    loading,
    page,
    setPage,
    filters,
    setFilters,
    stats,
    refetch,
    deleteBanner,
    createBanner,
    updateBanner,
    getBanner,
    getInterestedStudents,
  };
}
