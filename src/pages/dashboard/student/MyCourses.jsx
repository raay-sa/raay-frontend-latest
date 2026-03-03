// src/pages/dashboard/student/MyCourses.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useStudentSubscriptions from '../../../hooks/useStudentSubscriptions';
import CourseCard from '../../../components/CourseCard';
import StudentLiveService from '../../../services/student/liveService';
import { withBaseUrl } from '../../../utils/url';
import toast from 'react-hot-toast';
import { processProgramsList } from '../../../utils/translations';

export default function StudentMyCourses() {
    const { loading, rows, pagination, page, setPage } = useStudentSubscriptions();
    const navigate = useNavigate();

    // Map subscription API row -> CourseCard props (same style as Courses.jsx)
    const cards = useMemo(() => rows.map(mapSubscriptionToCard), [rows]);

    const handlePrimary = async (c) => {
        // For "دوراتي", the user is already subscribed.
        const isSubscribed = true;
        if (c.isLive && c.isBroadcasting && isSubscribed) {
            try {
                const { data } = await StudentLiveService.getStream(c.id);
                const streamId = data?.streamId || data?.stream_id;
                if (!streamId) {
                    toast.error('البث غير متاح حالياً');
                    return;
                }
                navigate(`/student/live/${c.id}`, { state: { streamId } });
                return;
            } catch (e) {
                console.error(e);
                toast.error('تعذر الانضمام إلى البث');
                return;
            }
        }
        navigate(`/student/courses/${c.id}`);
    };

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-xl lg:text-2xl font-bold">دوراتي</h2>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
                {loading && <div className="p-4 text-gray-600">جارٍ التحميل...</div>}

                {!loading && cards.length === 0 && (
                    <div className="p-6 text-gray-600 text-center">
                        لا توجد دورات مشترك بها حتى الآن.
                    </div>
                )}

                {!loading && cards.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {cards.map((c) => (
                                <CourseCard
                                    key={c.id}
                                    {...c}
                                    role="student"
                                    onPrimary={() => handlePrimary(c)}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <button
                                disabled={pagination.current_page <= 1}
                                onClick={() => setPage(Math.max(1, pagination.current_page - 1))}
                                className={`px-4 py-2 rounded border ${pagination.current_page <= 1
                                        ? 'text-gray-400 bg-gray-100'
                                        : 'bg-white hover:bg-gray-50'
                                    }`}
                            >
                                السابق
                            </button>
                            <div className="text-sm text-gray-600">
                                الصفحة {pagination.current_page} من {pagination.last_page}
                            </div>
                            <button
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() =>
                                    setPage(Math.min(pagination.last_page, pagination.current_page + 1))
                                }
                                className={`px-4 py-2 rounded border ${pagination.current_page >= pagination.last_page
                                        ? 'text-gray-400 bg-gray-100'
                                        : 'bg-white hover:bg-gray-50'
                                    }`}
                            >
                                التالي
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ----------------- helpers (same mapping style as Courses.jsx) ----------------- */
function mapSubscriptionToCard(p) {
    // Subscriptions list shape matches program card expectations closely
    const rating =
        p?.reviews_avg_score != null ? parseFloat(p.reviews_avg_score) : 0;

    const isLiveType = (p?.type || '').toLowerCase() === 'live';
    const isBroadcasting = !!p?.is_live; // backend sends 1/0 for active broadcast

    return {
        id: p.id,
        imageSrc: withBaseUrl(p.image),
        badgeLabel: p?.category?.title || '',
        title: p.title,
        description: p.description,
        reviewsCount: p?.reviews_count ?? 0,
        rating: Number.isFinite(rating) ? rating : 0,
        duration: '',
        price: p?.price ?? 0,
        instructorName: p?.teacher?.name || '',
        instructorAvatar: withBaseUrl(p?.teacher?.image) || '',
        status: isLiveType ? 'live' : 'published',
        isLive: isLiveType,
        isBroadcasting,
        isSubscribed: true,
    };
}
