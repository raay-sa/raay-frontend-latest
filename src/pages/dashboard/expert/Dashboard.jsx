// src/pages/dashboard/teacher/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  IdentificationIcon,
  BookOpenIcon,
  StarIcon,
  CurrencyRupeeIcon,
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
  Legend,
} from 'recharts';
import StatsCard from '../../../components/StatsCard';
import DashboardSkeleton from '../../../components/Loaders/DashboardSkeleton';
import { dashboardService } from '../../../services/teacher/dashboardService';

const CONTENT_COLORS = ['#005B99', '#B3894E', '#CCCCCC'];

export default function AdminDashboard() {
  // ── State ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);

  // top cards
  const [stats, setStats] = useState(null);

  // charts
  const [revenueFilter, setRevenueFilter] = useState('monthly'); // monthly | weekly | yearly (UI shows monthly/weekly)
  const [revenueData, setRevenueData] = useState([]);

  // REGISTRATIONS (STUDENTS ONLY): current vs last month
  const [registrationData, setRegistrationData] = useState([]);

  const [reviewsFilter, setReviewsFilter] = useState('monthly'); // monthly | weekly | yearly (UI shows monthly/weekly)
  const [reviewsData, setReviewsData] = useState([]); // weekly buckets

  const [contentData, setContentData] = useState([]); // pie

  const [participationData, setParticipationData] = useState([]); // bars

  // latest transactions table
  const [activities, setActivities] = useState([]);

  // ── Effects: data fetching ───────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const [
          summaryRes,
          regsRes,
          profitRes,
          contentRes,
          interactionsRes,
          reviewsRes,
          txRes,
        ] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getUserRegistrations(),
          dashboardService.getProfitStats(revenueFilter),
          dashboardService.getContentStats(),
          dashboardService.getProgramInteractions(),
          dashboardService.getReviews(reviewsFilter),
          dashboardService.getLastTransactions(),
        ]);

        if (!mounted) return;

        // summary / stats cards
        setStats(summaryRes?.data?.data || null);

        // ── REGISTRATIONS (students only): map current_month & last_month to two series (current/last)
        const current = regsRes?.data?.data?.current_month || [];
        const last = regsRes?.data?.data?.last_month || [];

        const byLabel = {};
        current.forEach((r) => {
          byLabel[r.label] = byLabel[r.label] || { week: r.label, current: 0, last: 0 };
          byLabel[r.label].current = r.count_students || 0; // الشهر الحالي
        });
        last.forEach((r) => {
          byLabel[r.label] = byLabel[r.label] || { week: r.label, current: 0, last: 0 };
          byLabel[r.label].last = r.count_students || 0; // الشهر السابق
        });
        setRegistrationData(Object.values(byLabel));

        // profit stats
        const prof = profitRes?.data?.data || [];
        setRevenueData(
          prof.map((p) => ({
            week: p.label,
            value: p.profit ?? 0,
          }))
        );

        // content pie
        const c = contentRes?.data?.data || {};
        setContentData([
          { name: 'البرامج المسجلة', value: c.registered_programs_percentage || 0 },
          { name: 'البرامج المباشرة', value: c.live_programs_percentage || 0 },
          { name: 'المهام والاختبارات', value: c.tasks_percentage || 0 },
        ]);

        // program interactions -> bars
        const ints = interactionsRes?.data?.data || [];
        setParticipationData(
          ints.map((x) => ({
            category: x.program,
            // keep existing keys in your chart ("trainees" & "sessions") mapped to labels in legend
            trainees: x.reviews || 0,     // "التعليقات"
            sessions: x.assignments || 0, // "المهام"
          }))
        );

        // reviews -> line
        const revs = reviewsRes?.data?.data || [];
        setReviewsData(
          revs.map((r) => ({
            week: r.label,
            value: r.count || 0,
          }))
        );

        // latest transactions
        const tx = txRes?.data?.data || [];
        setActivities(tx);
      } catch (e) {
        console.error('Teacher dashboard load failed:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initial load

  // refetch on filters change
  useEffect(() => {
    dashboardService.getProfitStats(revenueFilter)
      .then((res) => {
        const prof = res?.data?.data || [];
        setRevenueData(prof.map((p) => ({ week: p.label, value: p.profit ?? 0 })));
      })
      .catch((e) => console.error(e));
  }, [revenueFilter]);

  useEffect(() => {
    dashboardService.getReviews(reviewsFilter)
      .then((res) => {
        const revs = res?.data?.data || [];
        setReviewsData(revs.map((r) => ({ week: r.label, value: r.count || 0 })));
      })
      .catch((e) => console.error(e));
  }, [reviewsFilter]);

  const totalSales = stats?.total_profit ?? 0; // used in the header box under "صافي الأرباح"

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard
          value={stats?.total_students ?? 0}
          label="إجمالي المتدربين"
          Icon={UserGroupIcon}
          trend={`${stats?.student_percentage ?? 0}%`}
          up={(stats?.student_status || '').toLowerCase() === 'increase'}
        />
        <StatsCard
          value={stats?.total_programs ?? 0}
          label=" إجمالي البرامج"
          Icon={IdentificationIcon}
          trend={`${stats?.program_percentage ?? 0}%`}
          up={(stats?.program_status || '').toLowerCase() === 'increase'}
        />
        <StatsCard
          value={stats?.total_reviews ?? 0}
          label="اجمالي التقييمات"
          Icon={StarIcon}
          trend={`${stats?.review_percentage ?? 0}%`}
          up={(stats?.review_status || '').toLowerCase() === 'increase'}
        />
        <StatsCard
          value={stats?.total_profit ?? 0}
          label="صافي الأرباح"
          Icon={CurrencyRupeeIcon}
          trend={`${stats?.profit_percentage ?? 0}%`}
          up={(stats?.profit_status || '').toLowerCase() === 'increase'}
        />
      </div>

      {/* Top Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div>
              <h1 className="text-sm sm:text-base font-semibold">صافي الأرباح</h1>
              <p className="text-lg sm:text-xl font-bold text-secondary">
                <span className="icon-saudi_riyal">&#xea;</span>
                {totalSales}
              </p>
            </div>
            <select
              value={revenueFilter}
              onChange={(e) => setRevenueFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
            >
              <option value="monthly">شهري</option>
              <option value="weekly">أسبوعي</option>
              <option value="yearly">سنوي</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#005B99"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Registrations (students only: current vs last month) */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
            <h1 className="text-sm sm:text-base font-semibold">
              معدل تسجيل المتدربين
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-4 gap-2 sm:gap-3 text-xs sm:text-sm">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#005B99] rounded-full" />
                الشهر الحالي
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-[#B3894E] rounded-full" />
                الشهر السابق
              </span>
            </div>
          </div>
          <p className="text-green-500 text-xs sm:text-sm mb-2">0.43% ↑</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              {/* الشهر الحالي */}
              <Line
                type="monotone"
                dataKey="current"
                stroke="#005B99"
                strokeWidth={2}
                dot={false}
              />
              {/* الشهر السابق */}
              <Line
                type="monotone"
                dataKey="last"
                stroke="#B3894E"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reviews */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div>
              <h1 className="text-sm sm:text-base font-semibold">إجمالي التقييمات</h1>
              <p className="text-xs sm:text-sm text-green-500">0.43% ↑</p>
            </div>
            <select
              value={reviewsFilter}
              onChange={(e) => setReviewsFilter(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
            >
              <option value="monthly">شهري</option>
              <option value="weekly">أسبوعي</option>
              <option value="yearly">سنوي</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={reviewsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#005B99"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Content & Participation */}
        <div className="space-y-3 sm:space-y-4">
          {/* Pie */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
            <div className="flex-1 text-right">
              <h3 className="text-sm sm:text-base font-semibold mb-2">المحتوى التعليمي</h3>
              {contentData.map((entry, i) => (
                <p key={entry.name} className="text-xs sm:text-sm flex items-center gap-2 mb-1">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: CONTENT_COLORS[i] }}
                  />
                  {entry.name} — {entry.value}%
                </p>
              ))}
            </div>
            <PieChart width={100} height={100}>
              <Pie
                data={contentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
              >
                {contentData.map((_, idx) => (
                  <Cell key={idx} fill={CONTENT_COLORS[idx]} />
                ))}
              </Pie>
            </PieChart>
          </div>

          {/* Bar */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
              <h1 className='text-sm sm:text-base font-semibold'>التفاعل داخل البرامج</h1>
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm gap-2 sm:gap-3">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-[#005B99] rounded-full" />
                  التعليقات
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-[#B3894E] rounded-full" />
                  المهام
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
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

      {/* Latest Activities Table */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow overflow-auto">
        <div className='flex justify-between my-3 sm:my-5'>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">أحدث المعاملات المالية</h2>
        </div>
        <table className="min-w-full table-auto text-xs sm:text-sm text-right">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 sm:px-4 py-2">#</th>
              <th className="px-2 sm:px-4 py-2">الاسم</th>
              <th className="px-2 sm:px-4 py-2 hidden sm:table-cell">النوع</th>
              <th className="px-2 sm:px-4 py-2">نوع العملية</th>
              <th className="px-2 sm:px-4 py-2 hidden md:table-cell">التفاصيل</th>
              <th className="px-2 sm:px-4 py-2">القيمة</th>
              <th className="px-2 sm:px-4 py-2 hidden lg:table-cell">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act, i) => (
              <tr key={act.id} className="border-t">
                <td className="px-2 sm:px-4 py-2">{i + 1}</td>
                <td className="px-2 sm:px-4 py-2">{act.student_name}</td>
                <td className="px-2 sm:px-4 py-2 hidden sm:table-cell">متدرب</td>
                <td className="px-2 sm:px-4 py-2">شراء برنامج</td>
                <td className="px-2 sm:px-4 py-2 hidden md:table-cell">
                  {Array.isArray(act.programs) ? act.programs.map(p => p.title).join('، ') : '-'}
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <span className="icon-saudi_riyal">&#xea;</span>
                  {act.total_price}
                </td>
                <td className="px-2 sm:px-4 py-2 hidden lg:table-cell">
                  {typeof act.created_at === 'string' ? (act.created_at.split('T')[0]) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
