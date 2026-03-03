import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {
    UserGroupIcon,
    IdentificationIcon,
    BookOpenIcon,
    StarIcon,
    CurrencyRupeeIcon,
    CloudArrowDownIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';

import { DashboardService } from '../../../services/dashboardService';
import DashboardSkeleton from '../../../components/Loaders/DashboardSkeleton';
import { toast } from 'react-hot-toast';

const CONTENT_COLORS = ['#005B99', '#B3894E', '#CCCCCC'];

/** Filename-safe download from axios response (blob) */
const openBlobDownload = (response, fallbackName = 'download.xlsx') => {
    try {
        const blob = new Blob([response.data], {
            type: response.headers['content-type'] || 'application/octet-stream',
        });
        let filename = fallbackName;
        const cd = response.headers['content-disposition'];
        if (cd && typeof cd === 'string') {
            const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
            if (match && match[1]) filename = decodeURIComponent(match[1]);
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (e) {
        console.error(e);
        toast.error('تعذر تنزيل الملف.');
    }
};

export default function AdminDashboard() {
    // ── date range (default: first day of current month → today) ─────────
    const firstDayOfMonth = useMemo(
        () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        []
    );
    const today = useMemo(() => new Date(), []);
    const [range, setRange] = useState([firstDayOfMonth, today]);
    const [startDate, endDate] = range;
    const [openCal, setOpenCal] = useState(false);

    // ── dashboard state ───────────────────────────────────────────────────
    const [summary, setSummary] = useState([]);
    const [registrationData, setRegistrationData] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [contentData, setContentData] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // static samples for charts kept from your UI
    const participationData = [
        { category: 'المخاطر في المؤسسات', trainees: 800, sessions: 900 },
        { category: 'التحول المؤسسي', trainees: 700, sessions: 800 },
        { category: 'التحول الرقمي', trainees: 900, sessions: 1000 },
        { category: 'الأمن السيبراني', trainees: 1200, sessions: 1300 },
    ];
    const reviewsData = [
        { week: '4 الأسبوع', value: 90 },
        { week: '3 الأسبوع', value: 75 },
        { week: '2 الأسبوع', value: 85 },
        { week: '1 الأسبوع', value: 20 },
    ];

    // ── load everything with same from_date & to_date ─────────────────────
    const loadAll = async () => {
        if (!startDate || !endDate) return;

        try {
            setLoading(true);

            // 1) Summary
            const summaryRes = await DashboardService.getSummary(startDate, endDate);
            const d = summaryRes?.data?.data || {};
            setSummary([
                { title: 'إجمالي المتدربين', value: d.total_students, rate: '0.43%', icon: UserGroupIcon },
                { title: 'إجمالي الخبراء', value: d.total_teachers, rate: '0.43%', icon: IdentificationIcon },
                { title: 'إجمالي البرامج', value: d.total_programs, rate: '0.43%', icon: BookOpenIcon },
                { title: 'إجمالي التقييمات', value: d.total_reviews, rate: '0.43%', icon: StarIcon },
                { title: 'إجمالي الإيرادات', value: d.total_profit, rate: '0.43%', icon: CurrencyRupeeIcon },
            ]);

            // 2) Registrations
            const regRes = await DashboardService.getUserRegistrations(startDate, endDate);
            const regCounts = regRes?.data?.data?.counts || [];
            setRegistrationData(
                regCounts.map((r) => ({
                    week: r.label,
                    trainees: r.count_student,
                    experts: r.count_teacher,
                }))
            );

            // 3) Profit stats
            const profitRes = await DashboardService.getProfitStats(startDate, endDate);
            const prof = profitRes?.data?.data || [];
            setRevenueData(
                prof.map((p) => ({
                    week: p.label,
                    value: p.profit,
                }))
            );

            // 4) Content stats
            const contentRes = await DashboardService.getContentStats(startDate, endDate);
            const c = contentRes?.data?.data || {};
            setContentData([
                { name: 'البرامج المسجلة', value: c.registered_programs_percentage || 0 },
                { name: 'البرامج المباشرة', value: c.live_programs_percentage || 0 },
                { name: 'المهام والاختبارات', value: c.tasks_percentage || 0 },
            ]);

            // 5) Last transactions
            const txRes = await DashboardService.getLastTransactions(startDate, endDate);
            setTransactions(txRes?.data?.data || []);
        } catch (e) {
            console.error('Failed to load dashboard:', e);
            toast.error('تعذر تحميل البيانات. حاول مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate?.getTime?.(), endDate?.getTime?.()]);

    // ── Excel downloads (use same global date range) ──────────────────────
    const [downloadingReg, setDownloadingReg] = useState(false);
    const [downloadingProfit, setDownloadingProfit] = useState(false);
    const [downloadingSubs, setDownloadingSubs] = useState(false);

    const downloadUserRegistrationExcel = async () => {
        if (!startDate || !endDate) return toast.error('الرجاء اختيار المدة الزمنية.');
        setDownloadingReg(true);
        try {
            const res = await DashboardService.exportUserRegistrationExcel(startDate, endDate);
            openBlobDownload(res, 'user_registration.xlsx');
            toast.success('تم تنزيل ملف تسجيل المستخدمين.');
        } catch (e) {
            console.error(e);
            toast.error('فشل تنزيل ملف تسجيل المستخدمين.');
        } finally {
            setDownloadingReg(false);
        }
    };

    const downloadProfitStatsExcel = async () => {
        if (!startDate || !endDate) return toast.error('الرجاء اختيار المدة الزمنية.');
        setDownloadingProfit(true);
        try {
            const res = await DashboardService.exportProfitStatsExcel(startDate, endDate);
            openBlobDownload(res, 'profit_stats.xlsx');
            toast.success('تم تنزيل ملف إحصائيات الإيرادات.');
        } catch (e) {
            console.error(e);
            toast.error('فشل تنزيل ملف إحصائيات الإيرادات.');
        } finally {
            setDownloadingProfit(false);
        }
    };

    const downloadProgramSubscriptionsExcel = async () => {
        if (!startDate || !endDate) return toast.error('الرجاء اختيار المدة الزمنية.');
        setDownloadingSubs(true);
        try {
            const res = await DashboardService.exportProgramSubscriptionsExcel(startDate, endDate);
            openBlobDownload(res, 'program_subscriptions.xlsx');
            toast.success('تم تنزيل ملف اشتراكات البرامج.');
        } catch (e) {
            console.error(e);
            toast.error('فشل تنزيل ملف اشتراكات البرامج.');
        } finally {
            setDownloadingSubs(false);
        }
    };

    if (loading) return <DashboardSkeleton />;

    // ── helpers for header display ────────────────────────────────────────
    const fmtHuman = (d) =>
        d instanceof Date && !Number.isNaN(d.getTime())
            ? d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
            : '—';

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            {/* Top bar: title + global date range ONLY */}
            <div className="bg-white p-3 lg:p-4 rounded-lg shadow flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <h1 className="text-xl lg:text-2xl font-bold">لوحة التحكم</h1>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Date range picker (same style as Reports page) */}
                    <div className="relative inline-block">
                        <button
                            onClick={() => setOpenCal(o => !o)}
                            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 bg-white"
                        >
                            <CalendarIcon className="w-5 h-5 text-gray-600" />
                            <span>{fmtHuman(startDate)} &rarr; {fmtHuman(endDate)}</span>
                        </button>
                        {openCal && (
                            <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg">
                                <DatePicker
                                    selectsRange
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={(update) => {
                                        const [s, e] = update || [];
                                        setRange([s ?? null, e ?? null]);
                                    }}
                                    inline
                                    shouldCloseOnSelect={false}
                                    calendarStartDay={0}
                                />
                                <div className="flex justify-between p-2">
                                    <button
                                        onClick={() => setRange([firstDayOfMonth, today])}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg"
                                    >
                                        إعادة تعيين
                                    </button>
                                    <button
                                        onClick={() => setOpenCal(false)}
                                        className="px-4 py-2 text-sm bg-primary text-white rounded-lg"
                                    >
                                        تطبيق
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                {summary.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.title} className="bg-white p-3 lg:p-4 rounded-lg shadow flex items-center justify-between">
                            <div className="space-y-0.5 lg:space-y-1 text-right flex-1 min-w-0">
                                <p className="text-lg lg:text-2xl font-semibold">{card.value}</p>
                                <p className="text-xs lg:text-sm text-gray-500 truncate">{card.title}</p>
                                <p className="text-xs text-green-500 flex items-center gap-1">
                                    {card.rate}<span className="transform rotate-45 inline-block">↑</span>
                                </p>
                            </div>
                            <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-gray-300 flex-shrink-0" />
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Profit (chart + its download button) */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className='text-2xl font-bold'> إجمالي الإيرادات </h1>
                        <button
                            onClick={downloadProfitStatsExcel}
                            disabled={downloadingProfit}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm ${downloadingProfit ? 'bg-gray-300 text-gray-600' : 'bg-secondary text-white'}`}
                            title="تحميل Excel للإيرادات"
                        >
                            <CloudArrowDownIcon className="w-5 h-5" />
                            {downloadingProfit ? 'جارٍ التحميل...' : 'تحميل Excel'}
                        </button>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#005B99" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Registrations (chart + its download button) */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                        <h1 className="text-xl font-bold">معدل تسجيل المستخدمين</h1>
                        <button
                            onClick={downloadUserRegistrationExcel}
                            disabled={downloadingReg}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm ${downloadingReg ? 'bg-gray-300 text-gray-600' : 'bg-secondary text-white'}`}
                            title="تحميل Excel لتسجيل المستخدمين"
                        >
                            <CloudArrowDownIcon className="w-5 h-5" />
                            {downloadingReg ? 'جارٍ التحميل...' : 'تحميل Excel'}
                        </button>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={registrationData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="trainees" stroke="#005B99" strokeWidth={2} />
                            <Line type="monotone" dataKey="experts" stroke="#B3894E" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Reviews */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold">إجمالي التقييمات </h1>
                    </div>
                    <p className="text-lg text-green-500">0.43% ↑</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={reviewsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#005B99" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Content distribution + legend */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow flex items-center">
                        <div className="flex-1 text-right space-y-5">
                            <h3 className="font-semibold">المحتوى التعليمي</h3>
                            {contentData.map((entry, i) => (
                                <p key={entry.name} className="text-sm flex items-center gap-2 mb-1">
                                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: CONTENT_COLORS[i] }} />
                                    {entry.name} — {entry.value}%
                                </p>
                            ))}
                        </div>
                        <PieChart width={120} height={120}>
                            <Pie data={contentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2}>
                                {contentData.map((_, idx) => (
                                    <Cell key={idx} fill={CONTENT_COLORS[idx]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </div>

                    {/* Participation sample */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-2">
                            <h1 className="text-xl font-bold">نسبة المشاركة</h1>
                            <div className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 bg-[#005B99] rounded-full" /> المتدربين
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 bg-[#B3894E] rounded-full" /> الجلسات
                                </span>
                            </div>

                            <button
                                onClick={downloadProgramSubscriptionsExcel}
                                disabled={downloadingSubs}
                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm ${downloadingSubs ? 'bg-gray-300 text-gray-600' : 'bg-secondary text-white'}`}
                                title="تحميل Excel لاشتراكات البرامج"
                            >
                                <CloudArrowDownIcon className="w-5 h-5" />
                                {downloadingSubs ? 'جارٍ التحميل...' : 'تحميل Excel'}
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={participationData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="trainees" fill="#005B99" barSize={20} />
                                <Bar dataKey="sessions" fill="#B3894E" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Last transactions */}
            <div className="bg-white p-4 rounded-lg shadow overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">أحدث المعاملات</h2>
                </div>
                <table className="min-w-full table-auto text-sm text-right">
                    <thead>
                        <tr className="bg-[#F0F0F0]">
                            <th className="px-4 py-2">#</th>
                            <th className="px-4 py-2">الاسم</th>
                            <th className="px-4 py-2">التفاصيل</th>
                            <th className="px-4 py-2">القيمة</th>
                            <th className="px-4 py-2">التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((act, i) => (
                            <tr key={act.id ?? i} className="border-t">
                                <td className="px-4 py-2">{i + 1}</td>
                                <td className="px-4 py-2">{act.student_name}</td>
                                <td className="px-4 py-2">{Array.isArray(act.programs) ? act.programs.map(p => p.title).join(', ') : '-'}</td>
                                <td className="px-4 py-2">{act.total_price} ر.س</td>
                                <td className="px-4 py-2">
                                    {typeof act.created_at === 'string'
                                        ? (act.created_at.split('T')[0] || act.created_at)
                                        : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
