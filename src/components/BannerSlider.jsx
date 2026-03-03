import React, { useEffect, useState } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import BannerCard from './BannerCard';
import { StudentBannerService } from '../services/bannerService';

const BannerSlider = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await StudentBannerService.getBanners();
        setBanners(Array.isArray(res?.data?.data) ? res.data.data : []);
      } catch (e) {
        console.error(e);
        setError('Failed to load banners');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading banners...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 bg-red-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!banners.length) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No banners available</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <Splide
        options={{
          // Enforce consistent card dimensions across slides
          fixedWidth: '320px',
          height: '420px',
          perMove: 1,
          gap: '1rem',
          autoplay: true,
          interval: 5000,
          pauseOnHover: true,
          pagination: true,
          arrows: true,
          direction: 'rtl',
          // Keep responsiveness while using fixed slide width
          breakpoints: {
            1280: { fixedWidth: '320px' },
            1024: { fixedWidth: '300px' },
            768: { fixedWidth: '280px' },
            480: { fixedWidth: '260px' },
            360: { fixedWidth: '240px' },
          },
        }}
        aria-label="Banner Slider"
      >
        {banners.map((banner) => (
          <SplideSlide key={banner.id}>
            <BannerCard banner={banner} />
          </SplideSlide>
        ))}
      </Splide>
    </div>
  );
};

export default BannerSlider;
