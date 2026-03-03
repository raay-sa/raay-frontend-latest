// src/pages/dashboard/expert/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
    ResponsiveContainer,
    AreaChart, Area,
    LineChart, Line,
    BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

import statisticsService from "../../../services/teacher/statisticsService";

// ألوان مطابقة للتصميم
const BLUE = "#005B99";
const GOLD = "#B3894E";
const GRAY = "#CCCCCC";
const PIE_COLORS = [BLUE, GOLD, GRAY];

// ===== helpers =====
function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }
function toDMY(date) {
    const d = new Date(date);
    return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}
const fmtAr = (d) =>
    (d instanceof Date && !Number.isNaN(d.getTime()))
        ? d.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })
        : "—";

/**
 * تنسيق محاور X بذكاء:
 * - YYYY-MM  ➜  "أغسطس 2025"
 * - week 3   ➜  "3 الأسبوع"
 * - غير ذلك  ➜  كما هو
 */
const isMonthKey = (s) => typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
const isWeekEn = (s) => typeof s === "string" && /week\s*\d+/i.test(s);
const formatTickAr = (label) => {
    if (isMonthKey(label)) {
        const dt = new Date(`${label}-01T00:00:00`);
        return dt.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
    }
    if (isWeekEn(label)) {
        const n = label.match(/\d+/)?.[0];
        return n ? `${n} الأسبوع` : label;
    }
    return label;
};

export default function Reports() {
    // ===== date range (نفس كود الأدمن) =====
    const [openCal, setOpenCal] = useState(false);
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const today = new Date();
    const [range, setRange] = useState([firstDayOfMonth, today]);
    const [startDate, endDate] = range;

    const params = useMemo(() => {
        if (!startDate || !endDate) return null;
        return { from_date: toDMY(startDate), to_date: toDMY(endDate) };
    }, [startDate, endDate]);

    // ===== charts state =====
    const [profitTotal, setProfitTotal] = useState(0);
    const [profitSeries, setProfitSeries] = useState([]);                 // Area: [{label,value}]
    const [registrationsSeries, setRegistrationsSeries] = useState([]);   // Line: [{label,current,last}]
    const [reviewsSeries, setReviewsSeries] = useState([]);               // Line: [{label,registered,live}]
    const [contentPie, setContentPie] = useState([]);                     // Pie
    const [programBars, setProgramBars] = useState([]);                   // Bar
    const [achievementsBars, setAchievementsBars] = useState([]);         // Stacked Bars
    const [bestTrainees, setBestTrainees] = useState([]);                 // Table
    const [loading, setLoading] = useState(true);

    // ===== load from APIs =====
    useEffect(() => {
        const load = async () => {
            if (!params) return;
            setLoading(true);
            try {
                // 1) Profit
                const profitRes = await statisticsService.getProfitStats(params);
                const labels = profitRes?.data?.labels || [];
                const data = profitRes?.data?.data || [];
                setProfitTotal(profitRes?.data?.total_profit ?? 0);
                setProfitSeries(labels.map((label, i) => ({ label, value: Number(data[i] || 0) })));

                // 2) Registrations (current vs last month)
                const regsRes = await statisticsService.getUserRegistrations(params);
                const current = regsRes?.data?.data?.current_month || [];
                const last = regsRes?.data?.data?.last_month || [];
                const map = {};
                current.forEach(r => {
                    map[r.label] = map[r.label] || { label: r.label, current: 0, last: 0 };
                    map[r.label].current = Number(r.count_students || 0);
                });
                last.forEach(r => {
                    map[r.label] = map[r.label] || { label: r.label, current: 0, last: 0 };
                    map[r.label].last = Number(r.count_students || 0);
                });
                setRegistrationsSeries(Object.values(map));

                // 3) Content pie
                const contentRes = await statisticsService.getContentStats(params);
                const c = contentRes?.data?.data || {};
                setContentPie([
                    { name: "البرامج المسجّلة", value: Number(c.registered_programs_percentage || 0) },
                    { name: "البرامج المباشرة", value: Number(c.live_programs_percentage || 0) },
                    { name: "المهام والاختبارات", value: Number(c.tasks_percentage || 0) },
                ]);

                // 4) Program interactions
                const piRes = await statisticsService.getProgramInteractions(params);
                const ints = Array.isArray(piRes?.data?.data) ? piRes.data.data : [];
                setProgramBars(
                    ints.map(row => ({
                        name: row.program ?? "—",
                        comments: Number(row.reviews || 0),
                        tasks: Number(row.assignments || 0),
                    }))
                );

                // 5) Reviews ➜ خطّين (registered + live)
                const revRes = await statisticsService.getReviews(params);
                const revs = revRes?.data?.data?.reviews || [];
                setReviewsSeries(
                    revs.map(r => ({
                        label: r.label, // قد تكون "week 1" أو "2025-07"
                        registered: Number(r.registered || 0),
                        live: Number(r.live || 0),
                    }))
                );

                // 6) Achievements (stacked)
                const achRes = await statisticsService.getAchievements(params);
                const ach = achRes?.data?.programs || [];
                setAchievementsBars(
                    ach.map(p => ({
                        name: p.program_title ?? "—",
                        completed: Number(p.completed_rate || 0),
                        inCompleted: Number(p.in_completed_rate || 0),
                        notStarted: Number(p.not_started_rate || 0),
                    }))
                );

                // 7) Best trainees table
                const btRes = await statisticsService.getBestTrainers(params);
                const best = btRes?.data?.data || [];
                setBestTrainees(
                    best.map((t, i) => ({
                        id: i + 1,
                        name: t.student_name ?? "—",
                        assignments_completion: Number(t.assignments_completion ?? 0),
                        exams_completion: Number(t.exams_completion ?? 0),
                        avg_grade: Number(t.avg_grade ?? 0),
                        total_reviews: Number(t.total_reviews ?? 0),
                        interactions: Number(t.total_reviews ?? 0), // لا يوجد مفتاح للتفاعلات في الـ API
                    }))
                );
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [params]);

    if (loading) {
        return (
            <div className="p-6" dir="rtl">
                <div className="h-8 w-40 animate-pulse rounded bg-gray-200 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-[260px] rounded-xl bg-gray-100 animate-pulse" />
                    <div className="h-[260px] rounded-xl bg-gray-100 animate-pulse" />
                    <div className="h-[260px] rounded-xl bg-gray-100 animate-pulse" />
                    <div className="h-[260px] rounded-xl bg-gray-100 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-5" dir="rtl">
            {/* ===== Header: نفس date range تبع صفحة الأدمن ===== */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-lg sm:text-xl font-bold">التقارير والإحصائيات</h1>

                {/* نفس كود الأدمن بالضبط */}
                <div className="relative inline-block">
                    <button
                        onClick={() => setOpenCal(o => !o)}
                        className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 bg-white text-sm sm:text-base"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M8 2v4M16 2v4M3 10h18M4 6h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
                        </svg>
                        <span className="hidden sm:inline">{fmtAr(startDate)} &rarr; {fmtAr(endDate)}</span>
                        <span className="sm:hidden">اختيار التاريخ</span>
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
                                calendarStartDay={6} // السبت
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
                                    className="px-4 py-2 text-sm bg-[#005B99] text-white rounded-lg"
                                >
                                    تطبيق
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== Row 1 ===== */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                {/* Profit Area */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-right">
                            <p className="text-sm sm:text-lg font-bold">صافي الأرباح</p>
                            <p className="text-sm sm:text-lg font-bold text-secondary">
                                <span className="icon-saudi_riyal align-middle mr-1">&#xea;</span>
                                {profitTotal}
                            </p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={profitSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.35} />
                                    <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tickFormatter={formatTickAr} />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke={BLUE} strokeWidth={2} fill="url(#profitGradient)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Registrations Dual Line */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                        <div className="text-right">
                            <p className="text-sm sm:text-lg font-bold text-black">معدل تسجيل المتدربين</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs">
                            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: BLUE }}></span>الشهر الحالي</span>
                            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: GOLD }}></span>الشهر السابق</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={registrationsSeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tickFormatter={formatTickAr} />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="current" name="الشهر الحالي" stroke={BLUE} strokeWidth={2.2} dot={false} />
                            <Line type="monotone" dataKey="last" name="الشهر السابق" stroke={GOLD} strokeWidth={2.2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ===== Row 2 ===== */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                {/* Reviews — خطّين (المسجّلة + المباشرة) */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                        <div className="text-right">
                            <p className="text-sm sm:text-lg font-bold text-black">إجمالي التقييمات</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs">
                            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: BLUE }}></span>البرامج المسجّلة</span>
                            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: GOLD }}></span>البرامج المباشرة</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={reviewsSeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tickFormatter={formatTickAr} />
                            <YAxis />
                            <Tooltip />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 10 }} />
                            <Line type="monotone" dataKey="registered" name="البرامج المسجّلة" stroke={BLUE} dot={false} strokeWidth={2} />
                            <Line type="monotone" dataKey="live" name="البرامج المباشرة" stroke={GOLD} dot={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie + Program Bars */}
                <div className="space-y-3 sm:space-y-4">
                    {/* Content Pie */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                        <div className="mb-2 sm:mb-3">
                            <h3 className="text-sm sm:text-[15px] font-semibold">المحتوى التعليمي</h3>
                        </div>
                        <div className="flex items-center">
                            <div className="flex-1 space-y-1 text-xs sm:text-sm">
                                {contentPie.map((e, i) => (
                                    <div key={e.name} className="flex items-center gap-2">
                                        <span className="inline-block h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i] }}></span>
                                        <span>{e.name}</span>
                                        <span className="text-gray-500">— {e.value}%</span>
                                    </div>
                                ))}
                            </div>
                            <PieChart width={120} height={120}>
                                <Pie data={contentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2}>
                                    {contentPie.map((_, idx) => (<Cell key={idx} fill={PIE_COLORS[idx]} />))}
                                </Pie>
                            </PieChart>
                        </div>
                    </div>

                    {/* Program Interactions */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm sm:text-[15px] font-semibold">التفاعل داخل البرامج</h3>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs">
                                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: BLUE }}></span>التعليقات</span>
                                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: GOLD }}></span>المهام</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={programBars}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="comments" fill={BLUE} barSize={18} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="tasks" fill={GOLD} barSize={18} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ===== Row 3 ===== */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* Achievements stacked bars */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm sm:text-[15px] font-semibold">معدل إنجاز المهام والاختبارات</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={achievementsBars}
                            barCategoryGap="80%"
                            maxBarSize={28}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                            <Tooltip />
                            <Legend
                                verticalAlign="top"
                                iconType="circle"
                                formatter={(v) => (
                                    <span className="text-xs">
                                        {v === "notStarted" ? "لم يبدأ" : v === "inCompleted" ? "غير مكتمل" : "مكتمل"}
                                    </span>
                                )}
                            />
                            <Bar dataKey="completed" stackId="a" fill={BLUE} />
                            <Bar dataKey="inCompleted" stackId="a" fill={GOLD} />
                            <Bar dataKey="notStarted" stackId="a" fill={GRAY} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Best Trainees table */}
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                    <h3 className="text-sm sm:text-[15px] font-semibold mb-2 sm:mb-3">أفضل المتدربين</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto text-xs sm:text-sm text-right">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-2 sm:px-4 py-2">#</th>
                                    <th className="px-2 sm:px-4 py-2">اسم المتدرب</th>
                                    <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">نسبة إنجاز المهام</th>
                                    <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">نسبة إنجاز الاختبارات</th>
                                    <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">متوسط الدرجات</th>
                                    <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">إجمالي التقييمات</th>
                                    <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">عدد التفاعلات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bestTrainees.map((t, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="px-2 sm:px-4 py-2">{i + 1}</td>
                                        <td className="px-2 sm:px-4 py-2">{t.name}</td>
                                        <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">{t.assignments_completion}%</td>
                                        <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">{t.exams_completion}%</td>
                                        <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">{t.avg_grade}%</td>
                                        <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">{t.total_reviews}</td>
                                        <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">{t.interactions}</td>
                                    </tr>
                                ))}
                                {bestTrainees.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-6 text-center text-gray-500">لا توجد بيانات</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
