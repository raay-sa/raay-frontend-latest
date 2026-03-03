// src/pages/dashboard/admin/ReportsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar, Cell,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import { CalendarIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { StatisticsService } from '../../../services/statisticsService';

export default function Reports() {
  // ── date picker state ─────────────────────────────────────────────────
  const [openCal, setOpenCal] = useState(false);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const today = new Date();
  const [range, setRange] = useState([firstDayOfMonth, today]);
  const [startDate, endDate] = range;

  // ── helpers ───────────────────────────────────────────────────────────
  const fmtDate = (d) =>
    (d instanceof Date && !Number.isNaN(d.getTime()))
      ? d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';

  const WEEK_LABELS = ['4 الأسبوع', '3 الأسبوع', '2 الأسبوع', '1 الأسبوع'];

  const mapWeeks = (apiArr, pickKeys) => {
    const safe = Array.isArray(apiArr) ? apiArr : [];
    const last4 = safe.slice(-4);
    const padded = Array(4 - last4.length).fill(null).concat(last4);
    return WEEK_LABELS.map((label, idx) => {
      const it = padded[idx];
      const obj = { week: label };
      if (!it) {
        pickKeys.forEach(k => { obj[k.out] = 0; });
        return obj;
      }
      pickKeys.forEach(k => { obj[k.out] = Number(it[k.in] || 0); });
      return obj;
    });
  };

  // ── series state ──────────────────────────────────────────────────────
  const [revenueData, setRevenueData] = useState([
    { week: '4 الأسبوع', amount: 0 },
    { week: '3 الأسبوع', amount: 0 },
    { week: '2 الأسبوع', amount: 0 },
    { week: '1 الأسبوع', amount: 0 },
  ]);
  const [registrationData, setRegistrationData] = useState([
    { week: '4 الأسبوع', trainers: 0, experts: 0 },
    { week: '3 الأسبوع', trainers: 0, experts: 0 },
    { week: '2 الأسبوع', trainers: 0, experts: 0 },
    { week: '1 الأسبوع', trainers: 0, experts: 0 },
  ]);
  const [evaluationsData, setEvaluationsData] = useState([
    { week: '4 الأسبوع', positive: 0, negative: 0 },
    { week: '3 الأسبوع', positive: 0, negative: 0 },
    { week: '2 الأسبوع', positive: 0, negative: 0 },
    { week: '1 الأسبوع', positive: 0, negative: 0 },
  ]);

  // ⬇︎ now from API (instead of static) — we’ll keep your chart UI identical
  const [expertsActivityData, setExpertsActivityData] = useState([]);

  const [participationData, setParticipationData] = useState([
    { category: '—', trainers: 0, sessions: 0 },
  ]);
  const [contentData, setContentData] = useState([
    { name: 'البرامج المسجلة', value: 0 },
    { name: 'البرامج المباشرة', value: 0 },
    { name: 'المهام والاختبارات', value: 0 },
  ]);

  const totalRevenue = useMemo(
    () => revenueData.reduce((s, r) => s + Number(r.amount || 0), 0),
    [revenueData]
  );

  // ── API load ──────────────────────────────────────────────────────────
  const loadAll = async () => {
    if (!startDate || !endDate) return;

    try {
      // 1) Profit
      const profitRes = await StatisticsService.getProfitStats(startDate, endDate);
      const profitArr = profitRes?.data?.data || [];
      setRevenueData(mapWeeks(profitArr, [{ in: 'profit', out: 'amount' }]));

      // 2) User registration
      const regRes = await StatisticsService.getUserRegistration(startDate, endDate);
      const regArr = regRes?.data?.data || [];
      setRegistrationData(mapWeeks(regArr, [
        { in: 'count_student', out: 'trainers' },
        { in: 'count_teacher', out: 'experts' },
      ]));

      // 3) Reviews
      const reviewsRes = await StatisticsService.getReviewsStats(startDate, endDate);
      const reviewsArr = reviewsRes?.data?.data || [];
      setEvaluationsData(mapWeeks(reviewsArr, [
        { in: 'positive_count', out: 'positive' },
        { in: 'negative_count', out: 'negative' },
      ]));

      // 4) Program subscriptions
      const subsRes = await StatisticsService.getProgramSubscriptions(startDate, endDate);
      const subsArr = Array.isArray(subsRes?.data?.data) ? subsRes.data.data : [];
      setParticipationData(
        subsArr.length
          ? subsArr.map((row, i) => ({
            category: row.title ?? `برنامج ${i + 1}`,
            trainers: Number(row.subscriptions_count || 0),
            sessions: Number(row.sessions_count || 0),
          }))
          : [{ category: '—', trainers: 0, sessions: 0 }]
      );

      // 5) Content stats
      const contRes = await StatisticsService.getContentStats(startDate, endDate);
      const c = contRes?.data?.data || {};
      setContentData([
        { name: 'البرامج المسجلة', value: Number(c.registered_programs_percentage || 0) },
        { name: 'البرامج المباشرة', value: Number(c.live_programs_percentage || 0) },
        { name: 'المهام والاختبارات', value: Number(c.tasks_percentage || 0) },
      ]);

      // 6) Teachers activity (names must show fully)
      const taRes = await StatisticsService.getTeachersActivity(startDate, endDate);
      const taArr = Array.isArray(taRes?.data?.data) ? taRes.data.data : [];

      // sort by activity desc like your original screenshot
      const taMapped = taArr
        .map(t => ({
          name: t?.name ?? '—',
          activity: Number(t?.programs_count ?? 0),
        }))
        .sort((a, b) => b.activity - a.activity);

      setExpertsActivityData(taMapped.length ? taMapped : [{ name: '—', activity: 0 }]);
    } catch (e) {
      console.error('Failed to load reports:', e);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate?.getTime?.(), endDate?.getTime?.()]);

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      {/* date + download */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl lg:text-3xl font-bold">التقارير والإحصائيات</h1>
        <div className="flex gap-3 sm:gap-5">

          {/* date picker */}
          <div className="relative inline-block">
            <button
              onClick={() => setOpenCal(o => !o)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 bg-white text-sm sm:text-base"
            >
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <span className="hidden sm:inline">{fmtDate(startDate)} &rarr; {fmtDate(endDate)}</span>
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

      {/* charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* 1) Revenue */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-500">إجمالي الإيرادات</p>
              <p className="text-lg sm:text-xl font-semibold">
                {Number(totalRevenue).toLocaleString('ar-EG')} ر.س
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#04507F" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#04507F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip />
              <Area type="monotone" dataKey="amount" stroke="#04507F" fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2) User Registration */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-500">معدل تسجيل المستخدمين</p>
              <p className="text-lg sm:text-xl font-semibold">0.43% <span className="text-green-500">↑</span></p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={registrationData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 10 }} />
              <Line type="monotone" dataKey="trainers" name="المتدربين" stroke="#1E40AF" dot={false} />
              <Line type="monotone" dataKey="experts" name="الخبراء" stroke="#B19567" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 3) Evaluations */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-500">التقييمات</p>
              <p className="text-lg sm:text-xl font-semibold">0.43% <span className="text-green-500">↑</span></p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={evaluationsData}>
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#666' }} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 10 }} />
              <Line type="monotone" dataKey="positive" name="الإيجابي" stroke="#10B981" dot={false} />
              <Line type="monotone" dataKey="negative" name="السلبي" stroke="#EF4444" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 4) Experts Activity */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <p className="font-semibold mb-2 text-sm sm:text-base">نشاط الخبراء</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={expertsActivityData}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 30, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fill: '#666' }} axisLine={false} />
              {/* ⬇︎ force all labels, give room so the full name is visible */}
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: '#666' }}
                axisLine={false}
                interval={0}
                width={20}
              />
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <Tooltip />
              <Bar dataKey="activity" fill="#04507F" barSize={16}>
                {expertsActivityData.map((_, idx) => (
                  <Cell key={idx} fill="#04507F" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 5) Participation Rate */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <p className="font-semibold mb-2 text-sm sm:text-base">نسبة المشاركة</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={participationData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#666' }} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: 10 }} />
              <Bar dataKey="trainers" name="المتدربين" fill="#04507F" />
              <Bar dataKey="sessions" name="الجلسات" fill="#B19567" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6) Educational Content */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <p className="font-semibold mb-2 text-sm sm:text-base">المحتوى التعليمي</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={contentData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
              >
                {contentData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={idx === 0 ? '#04507F' : idx === 1 ? '#B19567' : '#E0E0E0'}
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                wrapperStyle={{ top: '30%', right: 0 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
