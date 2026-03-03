import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';
import '@abdulrysr/saudi-riyal-new-symbol-font/style.css';

export default function SuggestedCourseCard({
    id,
    imageSrc,
    badgeLabel,
    title,
    description,
    reviewsCount,
    rating,
    price,
    instructorName,
    instructorAvatar,
}) {
    const navigate = useNavigate();
    const safeImage = useMemo(() => {
        const v = (imageSrc ?? '').trim();
        return v.length ? v : undefined;
    }, [imageSrc]);

    const safeAvatar = useMemo(() => {
        const v = (instructorAvatar ?? '').trim();
        return v.length ? v : undefined;
    }, [instructorAvatar]);

    return (
        <div dir="rtl" className="relative bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative">
                {safeImage ? (
                    <img src={safeImage} alt={title} className="w-full h-40 sm:h-48 object-cover" />
                ) : (
                    <div className="w-full h-40 sm:h-48 bg-gray-100" />
                )}
                {badgeLabel && (
                    <span
                        className="absolute bottom-0 transform ms-3 px-3 py-1 text-xs font-semibold text-white rounded-t-lg"
                        style={{ backgroundColor: '#bb9b6b' }}
                    >
                        {badgeLabel}
                    </span>
                )}
            </div>

            <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                    <span>{Number.isFinite(+rating) ? (+rating).toFixed(1) : rating}</span>
                    <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    <span>({reviewsCount || 0})</span>
                </div>

                <h3 className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-2">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{description}</p>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                        {safeAvatar ? (
                            <img
                                src={safeAvatar}
                                alt={instructorName || '—'}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200" />
                        )}
                        <span className="text-xs sm:text-sm text-gray-800 truncate">{instructorName || '—'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-secondary">
                        <span>{price ?? 0}</span>
                        <span className="icon-saudi_riyal">&#xea;</span>
                    </div>
                </div>

                <button 
                    onClick={() => navigate(`/student/courses/${id}`)}
                    className="mt-auto w-full py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-medium"
                >
                    سجل الآن
                </button>
            </div>
        </div>
    );
}
