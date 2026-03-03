import React, { useState, useEffect } from 'react';
import BannerSlider from './BannerSlider';
import { StudentBannerService } from '../services/bannerService';

const BannerSection = () => {
  const [hasBanners, setHasBanners] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBanners();
  }, []);

  const checkBanners = async () => {
    try {
      setLoading(true);
      const response = await StudentBannerService.getBanners();
      if (response.data?.success !== false) {
        // API returns data directly in response.data.data as an array
        const banners = response.data?.data || [];
        setHasBanners(Array.isArray(banners) && banners.length > 0);
      } else {
        setHasBanners(false);
      }
    } catch (err) {
      console.error('BannerSection - Failed to check banners:', err);
      setHasBanners(false);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything while loading or if no banners
  if (loading || !hasBanners) {
    return null;
  }

  return (
    <section className="w-full max-w-full overflow-hidden px-2">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">الدورات الجديدة</h2>
      <div className="w-full max-w-full overflow-hidden">
        <BannerSlider />
      </div>
    </section>
  );
};

export default BannerSection;
