// src/pages/dashboard/teacher/AssignmentShow.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    PencilSquareIcon,
    TrashIcon,
    CalendarDaysIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

import DashboardSkeleton from '../../../../components/Loaders/DashboardSkeleton';
import { assignmentsService } from '../../../../services/teacher/assignmentsService';

const formatArDateTime = (str) => {
    if (!str) return { date: '-', time: '-' };
    const d = new Date(str.replace(' ', 'T'));
    const date = d.toLocaleDateString('ar-Eg', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
};

export default function TeacherAssignmentShow() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [item, setItem] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await assignmentsService.getOne(id);
                if (!mounted) return;
                setItem(res?.data?.data || null);
            } catch (e) {
                console.error('Failed to fetch assignment:', e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const due = useMemo(() => formatArDateTime(item?.date), [item]);

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            {/* breadcrumb-ish header buttons */}
            <div className=" flex items-center justify-between">
                <div className="bg-primary px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                    <Link to="/teacher/assignments" className="px-3 py-1 rounded-full  text-white">
                        إدارة المهام والاختبارات
                    </Link>
                    <span className="px-3 py-1 rounded-full text-white">
                        مهمة • {item?.program?.title || '-'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-3 py-2 rounded-lg bg-[#F0F0F0] text-text_grey">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    <button className="px-3 py-2 rounded-lg bg-primary text-white">
                        <PencilSquareIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* title */}
            <h1 className="text-2xl font-bold text-gray-900">{item?.title || '-'}</h1>

            {/* chips row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="px-3 py-1 rounded-full bg-[#F3F6F8] text-gray-700">
                    عدد التسليمات: {item?.solutions_count ?? 0}/{item?.program?.subscriptions_count ?? 0}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F3F6F8] text-gray-700 inline-flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    الساعة {due.time}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F3F6F8] text-gray-700 inline-flex items-center gap-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    {due.date}
                </span>
            </div>

            {/* main description block */}
            <div className="bg-white rounded-xl shadow p-5 space-y-6">
                <div>
                    <p className="font-semibold mb-2">الوصف التفصيلي:</p>
                    <div className="bg-[#F8FAFB] rounded-lg p-4 text-gray-700 leading-7">
                        {item?.description ? (
                            <p className="whitespace-pre-wrap">{item.description}</p>
                        ) : (
                            <p className="text-gray-500">—</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
