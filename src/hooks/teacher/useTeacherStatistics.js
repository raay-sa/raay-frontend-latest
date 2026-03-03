// src/hooks/teacher/useTeacherStatistics.js
import { useCallback, useEffect, useMemo, useState } from "react";
import statisticsService from "../../services/teacher/statisticsService";

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}
function fmt(date) {
  // dd-MM-yyyy
  const d = new Date(date);
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}
function lastNDaysRange(n = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (n - 1));
  return { start, end };
}

export default function useTeacherStatistics() {
  // Date range (defaults to last 30 days)
  const [{ start, end }, setRange] = useState(lastNDaysRange(30));

  const query = useMemo(
    () => ({
      from_date: fmt(start),
      to_date: fmt(end),
    }),
    [start, end]
  );

  const [loading, setLoading] = useState(true);
  const [profitTotal, setProfitTotal] = useState(0);

  // Charts state
  const [profitSeries, setProfitSeries] = useState([]); // Area
  const [registrationsSeries, setRegistrationsSeries] = useState([]); // Dual Line
  const [reviewsSeries, setReviewsSeries] = useState([]); // Area total
  const [contentPie, setContentPie] = useState([]); // Pie
  const [programBars, setProgramBars] = useState([]); // Bar
  const [achievementsBars, setAchievementsBars] = useState([]); // Stacked Bars
  const [bestTrainees, setBestTrainees] = useState([]); // Table

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        regsRes,
        profitRes,
        contentRes,
        progIntRes,
        reviewsRes,
        achieveRes,
        bestRes,
      ] = await Promise.all([
        statisticsService.getUserRegistrations(query),
        statisticsService.getProfitStats(query),
        statisticsService.getContentStats(query),
        statisticsService.getProgramInteractions(query),
        statisticsService.getReviews(query),
        statisticsService.getAchievements(query),
        statisticsService.getBestTrainers(query),
      ]);

      // Profit
      const labels = profitRes?.data?.labels || [];
      const data = profitRes?.data?.data || [];
      const total = profitRes?.data?.total_profit ?? 0;
      setProfitTotal(total);
      setProfitSeries(
        labels.map((label, i) => ({ label, value: data[i] ?? 0 }))
      );

      // Registrations: current vs last month
      const current = regsRes?.data?.data?.current_month || [];
      const last = regsRes?.data?.data?.last_month || [];
      const byLabel = {};
      current.forEach((r) => {
        byLabel[r.label] = byLabel[r.label] || {
          label: r.label,
          current: 0,
          last: 0,
        };
        byLabel[r.label].current = r.count_students || 0;
      });
      last.forEach((r) => {
        byLabel[r.label] = byLabel[r.label] || {
          label: r.label,
          current: 0,
          last: 0,
        };
        byLabel[r.label].last = r.count_students || 0;
      });
      setRegistrationsSeries(Object.values(byLabel));

      // Content pie
      const c = contentRes?.data?.data || {};
      setContentPie([
        {
          name: "البرامج المسجّلة",
          value: c.registered_programs_percentage || 0,
        },
        { name: "البرامج المباشرة", value: c.live_programs_percentage || 0 },
        { name: "المهام والاختبارات", value: c.tasks_percentage || 0 },
      ]);

      // Program interactions
      const ints = progIntRes?.data?.data || [];
      setProgramBars(
        ints.map((x) => ({
          name: x.program,
          comments: x.reviews || 0, // التعليقات
          tasks: x.assignments || 0, // المهام
        }))
      );

      // Reviews (use total)
      const revs = reviewsRes?.data?.data?.reviews || [];
      setReviewsSeries(
        revs.map((r) => ({ label: r.label, value: r.total || 0 }))
      );

      // Achievements (stacked)
      const ach = achieveRes?.data?.programs || [];
      setAchievementsBars(
        ach.map((p) => ({
          name: p.program_title,
          completed: p.completed_rate || 0,
          inCompleted: p.in_completed_rate || 0,
          notStarted: p.not_started_rate || 0,
        }))
      );

      // Best trainees table
      const best = bestRes?.data?.data || [];
      setBestTrainees(
        best.map((t, idx) => ({
          id: idx + 1,
          name: t.student_name,
          assignments_completion: t.assignments_completion ?? 0,
          exams_completion: t.exams_completion ?? 0,
          avg_grade: t.avg_grade ?? 0,
          total_reviews: t.total_reviews ?? 0,
          // We don't have interactions count -> derive from reviews as a placeholder
          interactions: t.total_reviews ?? 0,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    // state
    loading,
    start,
    end,
    profitTotal,
    profitSeries,
    registrationsSeries,
    reviewsSeries,
    contentPie,
    programBars,
    achievementsBars,
    bestTrainees,

    // actions
    setRange,
    reload: load,
  };
}
