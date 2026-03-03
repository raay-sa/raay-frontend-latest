import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChartPieIcon,
    UsersIcon,
    BookOpenIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

import CourseCard from '../../../components/CourseCard';
import FilterDropdown from '../../../components/FilterDropdown';
import SuggestedCourseCard from '../../../components/SuggestedCourseCard';
import StatsCard from '../../../components/StatsCard';
import BannerSection from '../../../components/BannerSection';

import {
    ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell,
    BarChart, Bar,
} from 'recharts';

import { withBaseUrl } from '../../../utils/url';
import DashboardService from '../../../services/student/dashboardService';
import { processProgramsList, formatLearningArray } from '../../../utils/translations';
import { getCategoryName } from '../../../utils/index';

const CHART_COLORS = {
    line: '#0B4F6C',
    pieA: '#0B4F6C',
    pieB: '#B19567',
    pieC: '#D1D5DB',
    bar: '#0B4F6C',
};

const PROGRESS_FILTER_LABEL = {
    monthly: 'شهري',
    weekly: 'أسبوعي',
    yearly: 'سنوي',
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        programs_count: 0,
        completed_programs_count: 0,
        in_progress_programs_count: 0,
        not_started_programs_count: 0,
        certificates_count: 0,
    });

    const [progressFilter, setProgressFilter] = useState('monthly');
    const [progressData, setProgressData] = useState([]);

    const [contentStats, setContentStats] = useState({
        registered_programs_percentage: 0,
        live_programs_percentage: 0,
        tasks_percentage: 0,
    });

    const [importantPrograms, setImportantPrograms] = useState([]);
    const [keepWatching, setKeepWatching] = useState([]);
    const [recentRegistered, setRecentRegistered] = useState([]);
    const [livePrograms, setLivePrograms] = useState([]);
    const [bestPrograms, setBestPrograms] = useState([]);

    const [loading, setLoading] = useState(true);
    const [recentFilter, setRecentFilter] = useState('الكل');

    // initial batch fetch
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [
                    overviewRes,
                    contentRes,
                    importantRes,
                    keepRes,
                    recentRes,
                    bestRes,
                ] = await Promise.all([
                    DashboardService.overview(),
                    DashboardService.contentStats(),
                    DashboardService.importantData(),
                    DashboardService.keepWatching(),
                    DashboardService.recentPrograms(),
                    DashboardService.bestPrograms(),
                ]);

                setStats({
                    programs_count: overviewRes?.data?.programs_count ?? 0,
                    completed_programs_count: overviewRes?.data?.completed_programs_count ?? 0,
                    in_progress_programs_count: overviewRes?.data?.in_progress_programs_count ?? 0,
                    not_started_programs_count: overviewRes?.data?.not_started_programs_count ?? 0,
                    certificates_count: overviewRes?.data?.certificates_count ?? 0,
                });

                setContentStats({
                    registered_programs_percentage: contentRes?.data?.data?.registered_programs_percentage ?? 0,
                    live_programs_percentage: contentRes?.data?.data?.live_programs_percentage ?? 0,
                    tasks_percentage: contentRes?.data?.data?.tasks_percentage ?? 0,
                });

                setImportantPrograms(
                    (importantRes?.data?.programs ?? []).map(p => ({
                        title: p.title,
                        interest_percentage: Number(p.interest_percentage) || 0,
                    }))
                ); 
                setKeepWatching(processProgramsList(keepRes?.data?.programs ?? [])); 
                setRecentRegistered(processProgramsList(recentRes?.data?.registered_programs ?? [])); 
                setLivePrograms(processProgramsList(recentRes?.data?.live_programs ?? [])); 
                setBestPrograms(processProgramsList(bestRes?.data?.programs ?? []));
            } catch (e) {
                console.error('Student dashboard fetch failed', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // progress fetch
    useEffect(() => {
        (async () => {
            try {
                const res = await DashboardService.progress(progressFilter);
                setProgressData(res?.data?.data?.counts ?? []);
            } catch (e) {
                console.error('Progress fetch failed', e);
            }
        })();
    }, [progressFilter]);

    const pieData = useMemo(
        () => [
            { name: 'البرامج المسجلة', value: Number(contentStats.registered_programs_percentage) || 0, color: CHART_COLORS.pieA },
            { name: 'البرامج المباشرة', value: Number(contentStats.live_programs_percentage) || 0, color: CHART_COLORS.pieB },
            { name: 'المهام و الاختبارات', value: Number(contentStats.tasks_percentage) || 0, color: CHART_COLORS.pieC },
        ],
        [contentStats]
    );

    const filterOptions = ['الكل', ...new Set(importantPrograms.map((p) => p.title))];

    return (
        <div className="space-y-3 lg:space-y-8 p-3 lg:p-8" dir="rtl">
            <h1 className="text-lg lg:text-2xl font-bold">لوحة التحكم</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <StatsCard value={stats.certificates_count} label="إجمالي الشهادات" Icon={ChartPieIcon} trend="0%" up />
                <StatsCard value={stats.in_progress_programs_count} label="البرامج التدريبية قيد التقدم" Icon={UsersIcon} trend="0%" up />
                <StatsCard value={stats.completed_programs_count} label="البرامج التدريبية الكاملة" Icon={ClipboardDocumentListIcon} trend="0%" up />
                <StatsCard value={stats.programs_count} label="إجمالي البرامج التدريبية" Icon={BookOpenIcon} trend="0%" up />
            </div>

            {/* Banner Section */}
            <BannerSection />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Pie */}
                <div className="bg-white rounded-lg shadow p-3 lg:p-4">
                    <p className="font-semibold mb-3 text-sm lg:text-base">وقت التعلّم حسب نوع النشاط</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                        <div className="h-40 lg:h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <ul className="space-y-2 text-xs lg:text-sm">
                            {pieData.map((d) => (
                                <li key={d.name} className="flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                                    <span className="text-gray-700">{d.name}</span>
                                    <span className="mr-auto font-medium">{d.value}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Line */}
                <div className="bg-white rounded-lg shadow p-3 lg:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                        <p className="font-semibold text-sm lg:text-base">النشاط التعليمي</p>
                        <select
                            className="text-xs lg:text-sm bg-white border rounded-lg px-2 lg:px-3 py-1"
                            value={progressFilter}
                            onChange={(e) => setProgressFilter(e.target.value)}
                        >
                            <option value="monthly">{PROGRESS_FILTER_LABEL.monthly}</option>
                            <option value="weekly">{PROGRESS_FILTER_LABEL.weekly}</option>
                            <option value="yearly">{PROGRESS_FILTER_LABEL.yearly}</option>
                        </select>
                    </div>
                    <div className="h-48 lg:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progressData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                                <CartesianGrid stroke="#eee" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} width={30} />
                                <Tooltip />
                                <Line type="monotone" dataKey="progress" stroke={CHART_COLORS.line} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar */}
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold">الأكثر أهمية</p>
                        <FilterDropdown options={['الكل', ...new Set(importantPrograms.map(p => p.title))]} value={recentFilter} onChange={setRecentFilter} />
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={importantPrograms}>
                                <CartesianGrid stroke="#eee" vertical={false} />
                                <XAxis dataKey="title" tick={{ fontSize: 12 }} interval={0} />
                                <YAxis tick={{ fontSize: 12 }} width={30} />
                                <Tooltip />
                                <Bar dataKey="interest_percentage" fill={CHART_COLORS.bar} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="hidden lg:block" />
            </div>

            {/* Continue Watching */}
            <section className="space-y-4 lg:space-y-6">
                <h2 className="text-lg lg:text-xl font-semibold">واصل المشاهدة</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {keepWatching.map((p) => (
                        <CourseCard
                            key={p.id}
                            id={p.id}
                            imageSrc={withBaseUrl(p.image)}
                            badgeLabel={getCategoryName(p.category, 'ar')}
                            title={p.title}
                            description={p.description}
                            instructorName={p.teacher?.name || '—'}
                            instructorAvatar={withBaseUrl(p.teacher?.image)}
                            rating={0}
                            reviewsCount={0}
                            price={0}
                            onPrimary={() => navigate(`/student/courses/${p.id}`)}
                        />
                    ))}
                    {!keepWatching.length && !loading && (
                        <div className="text-sm text-gray-500">لا يوجد عناصر للعرض الآن.</div>
                    )}
                </div>
            </section>

            {/* Recently Registered + Live */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-white rounded-lg shadow p-3 lg:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                        <h3 className="text-base lg:text-lg font-semibold">البرامج المسجلة حديثاً</h3>
                        <FilterDropdown options={['الكل', ...new Set(importantPrograms.map(p => p.title))]} value={recentFilter} onChange={setRecentFilter} />
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {recentRegistered.map((p) => (
                            <li key={p.id} className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#B19567] rounded-lg flex items-center justify-center text-white">
                                        <BookOpenIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{p.title}</span>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <BookOpenIcon className="w-4 h-4" />
                                                <span>{p.sessions_count || 0} دروس</span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ClockIcon className="w-4 h-4" />
                                                <span>{p.program_duration || '0:00'}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {!recentRegistered.length && !loading && (
                            <li className="py-3 text-sm text-gray-500">لا يوجد بيانات.</li>
                        )}
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold mb-4">البرامج المباشرة</h3>
                    <ul className="divide-y divide-gray-200">
                        {livePrograms.map((p) => (
                            <li key={p.id} className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#B19567] rounded-lg flex items-center justify-center text-white">
                                        <BookOpenIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{p.title}</span>
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <ClockIcon className="w-4 h-4" />
                                            <span>{p.program_duration || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="px-5 py-2 bg-primary text-white text-sm rounded-lg">انضم</button>
                            </li>
                        ))}
                        {!livePrograms.length && !loading && (
                            <li className="py-3 text-sm text-gray-500">لا يوجد بث مباشر حالياً.</li>
                        )}
                    </ul>
                </div>
            </section>

            {/* Suggested */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold">أفضل البرامج التدريبية المقترحة</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {bestPrograms.map((p) => (
                        <SuggestedCourseCard
                            key={p.id}
                            id={p.id}
                            imageSrc={withBaseUrl(p.image)}
                            badgeLabel={getCategoryName(p.category, 'ar')}
                            title={p.title}
                            description={p.description}
                            reviewsCount={p.reviews_count || 0}
                            rating={p.reviews_avg_score ? Number(p.reviews_avg_score).toFixed(1) : 0}
                            price={p.price ?? 0}
                            instructorName={p.teacher?.name || '—'}
                            instructorAvatar={withBaseUrl(p.teacher?.image)}
                        />
                    ))}
                    {!bestPrograms.length && !loading && (
                        <div className="text-sm text-gray-500">لا يوجد مقترحات الآن.</div>
                    )}
                </div>
            </section>
        </div>
    );
}
