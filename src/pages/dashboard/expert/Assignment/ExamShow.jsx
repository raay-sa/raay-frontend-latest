// src/pages/dashboard/teacher/ExamShow.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    PencilSquareIcon,
    TrashIcon,
    ClockIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import examsService from '../../../../services/teacher/examsService';
import DashboardSkeleton from '../../../../components/Loaders/DashboardSkeleton';

export default function TeacherExamShow() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await examsService.getOne(id);
                if (!mounted) return;
                setExam(res?.data?.data || null);
            } catch (e) {
                console.error('Failed to fetch exam:', e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const sortedQuestions = useMemo(() => {
        const qs = exam?.questions || [];
        return [...qs].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    }, [exam]);

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            {/* header chips & buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="bg-primary px-3 py-1 rounded-full flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm">
                    <Link to="/teacher/assignments" className="px-3 py-1 rounded-full text-white">
                        إدارة المهام والاختبارات
                    </Link>
                    <span className="px-3 py-1 rounded-full text-white">
                        اختبار • {exam?.program?.title || '-'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-3 py-2 rounded-lg bg-primary text-white text-sm sm:text-base">
                        <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button className="px-3 py-2 rounded-lg bg-grey text-text_grey text-sm sm:text-base">
                        <PencilSquareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            {/* title */}
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{exam?.title || '-'}</h1>

            {/* top meta chips */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="px-3 py-1 rounded-full bg-[#F3F6F8] text-gray-700 inline-flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    مدة الاختبار: {exam?.duration || '-'}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F3F6F8] text-gray-700">
                    نسبة النجاح المطلوبة: {exam?.success_rate ?? '-'}%
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F3F6F8] text-gray-700">
                    عدد التسليمات: {exam?.students_answered_count ?? 0}/{exam?.program?.subscriptions_count ?? 0}
                </span>
            </div>

            {/* questions list */}
            <div className="space-y-4 lg:space-y-6">
                {sortedQuestions.map((q, i) => (
                    <div key={q.id} className="bg-white rounded-xl shadow p-3 sm:p-5">
                        {/* question header */}
                        <div className="flex items-start justify-between">
                            {/* question text */}
                            <p className="mt-2 font-semibold text-gray-900">
                                {i + 1}. {q.question}
                            </p>

                            <button className="px-3 py-1 rounded-lg bg-[#F0F0F0] text-gray-700 hidden md:inline-flex">
                                {q.points ?? 0} نقطة
                            </button>

                        </div>

                        {/* answers / inputs */}
                        <div className="mt-4">
                            {q.type === 'multiple_choice' && (
                                <div className="space-y-3">
                                    {(q.options || []).map((opt) => (
                                        <label
                                            key={opt.id}
                                            className="flex items-center gap-2 text-gray-800"
                                        >
                                            <input
                                                type="checkbox"
                                                disabled
                                                checked={!!opt.is_correct}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <span className={opt.is_correct ? 'font-medium' : ''}>
                                                {opt.option}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type !== 'multiple_choice' && (
                                <div className="space-y-2">
                                    <textarea
                                        disabled
                                        rows={5}
                                        placeholder="اكتب الإجابة"
                                        className="w-full border rounded-xl p-3 bg-[#F8FAFB] text-gray-700"
                                    />
                                    {/* correct answer hint (read-only) */}
                                    {q.answer && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">الإجابة الصحيحة (للمراجعة): </span>
                                            {q.answer}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* result badge (visual row like your mock) */}
                        <div className="mt-4 rounded-lg bg-[#E7F6EA] text-[#1A7F37] px-4 py-3 flex items-center gap-2 text-sm">
                            <CheckCircleIcon className="w-5 h-5" />
                            الإجابة غير صحيحة
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">تفسير الإجابة</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
