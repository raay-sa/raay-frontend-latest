import React, { useState, useEffect } from 'react';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { StudentBannerService } from '../services/bannerService';

const BannerCard = ({ banner, onInterestChange }) => {
    const [loading, setLoading] = useState(false);
    const [hasInterest, setHasInterest] = useState(banner.has_registered_interest || false);

    // Update hasInterest when banner prop changes
    useEffect(() => {
        setHasInterest(banner.has_registered_interest || false);
    }, [banner.has_registered_interest]);

    // Debug logging removed for cleaner output

    const handleInterestToggle = async () => {
        if (loading) return;

        setLoading(true);
        try {
            let response;
            if (hasInterest) {
                response = await StudentBannerService.removeInterest(banner.id);
            } else {
                response = await StudentBannerService.registerInterest(banner.id);
            }

            if (response.data?.success !== false) {
                setHasInterest(!hasInterest);
                if (onInterestChange) {
                    onInterestChange();
                }
            } else {
                alert(response.data?.message || 'حدث خطأ ما');
            }
        } catch (error) {
            console.error('Failed to update interest:', error);
            alert('فشل في تحديث الاهتمام');
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/images/empty.png';
        // Handle both relative and absolute paths
        if (imagePath.startsWith('http')) return imagePath;
        return `${import.meta.env.VITE_BASE_URL || ''}/${imagePath}`;
    };


    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 h-[420px] flex flex-col w-[320px]">
            {/* Banner Image */}
            <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                    src={getImageUrl(banner.image)}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.src = '/images/empty.png';
                        e.target.onerror = null; // Prevent infinite loop
                    }}
                    onLoad={(e) => {
                        e.target.style.display = 'block';
                    }}
                />
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                {/* Fallback placeholder */}
                {!banner.image && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <div className="text-gray-400 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Banner Content */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                    {banner.title}
                </h3>

                {banner.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                        {banner.description}
                    </p>
                )}

                {/* Action Button */}
                <button
                    onClick={handleInterestToggle}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${hasInterest
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            جاري التحميل...
                        </>
                    ) : (
                        <>
                            {hasInterest ? (
                                <>
                                    <HeartSolid className="w-4 h-4" />
                                    إزالة الاهتمام
                                </>
                            ) : (
                                <>
                                    <HeartOutline className="w-4 h-4" />
                                    سجل اهتمامك
                                </>
                            )}
                        </>
                    )}
                </button>

                {/* Status Message */}
                {banner.interested_students_count >= banner.min_students && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 text-xs text-center font-medium">
                            ✅ جاهز للبدء! سيكون البرنامج متاحاً قريباً.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BannerCard;
