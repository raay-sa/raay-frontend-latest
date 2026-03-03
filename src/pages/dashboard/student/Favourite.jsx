import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import FavouriteEmpty from '../../../components/FavouriteEmpty';
import SuggestedCourseCard from '../../../components/SuggestedCourseCard';
import Pagination from '../../../components/Pagination';
import StudentShopService from '../../../services/student/shopService';
import { withBaseUrl } from '../../../utils/url';

const PER_PAGE = 6;

export default function Favorites() {
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    // server payload bits
    const [items, setItems] = useState([]);           // flat array of favorite PROGRAMS
    const [lastPage, setLastPage] = useState(1);      // total pages
    const [total, setTotal] = useState(0);            // total favorites

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const { data } = await StudentShopService.listFavorites({ page, per_page: 6 });

                if (!alive) return;

                const section = data?.data;

                // map favorites -> SuggestedCourseCard props
                const mapped = (section?.data || [])
                    .map((fav) => fav?.program)
                    .filter(Boolean)
                    .map((p) => ({
                        id: p.id,
                        imageSrc: withBaseUrl(p.image),
                        badgeLabel: p?.category?.title || '',
                        title: p.title,
                        description: p.description,
                        reviewsCount: p?.reviews_count ?? 0,
                        rating: p?.reviews_avg_score ? parseFloat(p.reviews_avg_score) : 0,
                        price: p?.price ?? 0,
                        instructorName: p?.teacher?.name || '',
                        // avoid empty-string <img src=""> warnings
                        instructorAvatar: withBaseUrl(p?.teacher?.image) || '/images/avatar.png',
                    }));

                setItems(mapped);
                setLastPage(section?.last_page || 1);
                setTotal(section?.total || mapped.length);
            } catch (e) {
                console.error('Failed to load favorites:', e);
                setItems([]);
                setLastPage(1);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [page]);

    // empty state
    if (!loading && total === 0) {
        return <FavouriteEmpty />;
    }

    return (
        <div className="p-3 lg:p-8">
            <h1 className="text-2xl lg:text-3xl font-bold mb-4">المفضلة</h1>

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {items.map((c) => (
                    <NavLink
                        key={c.id}
                        to={`/student/courses/${c.id}`}
                        className="block hover:shadow-lg transition"
                    >
                        <SuggestedCourseCard {...c} />
                    </NavLink>
                ))}
            </div>

            {/* PAGINATION */}
            <Pagination current={page} total={lastPage} onChange={setPage} />

            {loading && (
                <div className="text-center mt-4 text-xs sm:text-sm text-gray-500">
                    جاري التحميل…
                </div>
            )}
        </div>
    );
}
