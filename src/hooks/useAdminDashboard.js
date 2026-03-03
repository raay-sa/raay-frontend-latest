import { useEffect, useState } from "react";
import { DashboardService } from "../services/dashboardService";

export default function useAdminDashboard(filter = "weekly") {
  const [summary, setSummary] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [registrationData, setRegistrationData] = useState([]);
  const [reviewsData, setReviewsData] = useState([]);
  const [contentData, setContentData] = useState([]);
  const [participationData, setParticipationData] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [filter]);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, regRes, profitRes, contentRes, transRes] =
        await Promise.all([
          DashboardService.getSummary(),
          DashboardService.getUserRegistrations(filter),
          DashboardService.getProfitStats(filter),
          DashboardService.getContentStats(filter),
          DashboardService.getLastTransactions(filter),
        ]);

      const s = summaryRes.data.data;
      setSummary([
        {
          title: "إجمالي المتدربين",
          value: s.total_students,
          rate: "0.43%",
          icon: "UserGroupIcon",
        },
        {
          title: "إجمالي الخبراء",
          value: s.total_teachers,
          rate: "0.43%",
          icon: "IdentificationIcon",
        },
        {
          title: "إجمالي البرامج",
          value: s.total_programs,
          rate: "0.43%",
          icon: "BookOpenIcon",
        },
        {
          title: "إجمالي التقييمات",
          value: s.total_reviews,
          rate: "0.43%",
          icon: "StarIcon",
        },
        {
          title: "إجمالي الإيرادات",
          value: s.total_profit,
          rate: "0.43%",
          icon: "CurrencyRupeeIcon",
        },
      ]);

      setRevenueData(
        profitRes.data.data.map((p) => ({
          week: p.label,
          value: p.profit,
        }))
      );

      setRegistrationData(
        regRes.data.data.counts.map((r) => ({
          week: r.label,
          trainees: r.count_student,
          experts: r.count_teacher,
        }))
      );

      const c = contentRes.data.data;
      setContentData([
        {
          name: "البرامج المسجلة",
          value: c.registered_programs_percentage || 0,
        },
        { name: "البرامج المباشرة", value: c.live_programs_percentage || 0 },
        { name: "المهام والاختبارات", value: c.tasks_percentage || 0 },
      ]);

      setActivities(
        transRes.data.data.map((a, i) => ({
          id: i + 1,
          name: a.student_name,
          details: a.programs?.map((p) => p.title).join(", ") || "",
          value: a.total_price,
          date: a.created_at?.split("T")[0],
        }))
      );

      // Placeholder for reviews and participation
      setReviewsData([
        { week: "الأسبوع 4", value: 0 },
        { week: "الأسبوع 3", value: 0 },
        { week: "الأسبوع 2", value: 0 },
        { week: "الأسبوع 1", value: 0 },
      ]);

      setParticipationData([
        { category: "المخاطر في المؤسسات", trainees: 0, sessions: 0 },
        { category: "التحول المؤسسي", trainees: 0, sessions: 0 },
        { category: "التحول الرقمي", trainees: 0, sessions: 0 },
        { category: "الأمن السيبراني", trainees: 0, sessions: 0 },
      ]);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  return {
    summary,
    revenueData,
    registrationData,
    reviewsData,
    contentData,
    participationData,
    activities,
  };
}
