import React, { useEffect, useMemo, useState } from 'react';
import {
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import {
  UserGroupIcon,
  IdentificationIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';

import Filter from '../../../../components/Filter';
import StatsCard from '../../../../components/StatsCard';
import Pagination from '../../../../components/Pagination';
import DashboardSkeleton from '../../../../components/Loaders/DashboardSkeleton';

import { assignmentsService } from '../../../../services/teacher/assignmentsService';
import { getCategoryName } from '../../../../utils/index';

/* ---------- utils ---------- */
const fmtDate = (str) => {
  if (!str) return null;
  const d = new Date(str.replace(' ', 'T'));
  const date = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
};

export default function TeacherAssignments() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
    total_count: 0,
    assignments_percentage: 0,
    assignments_status: 'increase',
    completed_count: 0,
    completed_percentage: 0,
    completed_status: 'increase',
    uncompleted_count: 0,
    uncompleted_percentage: 0,
    uncompleted_status: 'decrease',
  });

  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);

  const [categories, setCategories] = useState([]);

  const [tab, setTab] = useState('all'); // all | assignment | exam
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    sort: 'all',      // 'all' | 'name' | 'latest' | 'oldest'
    type: 'all',
    category: 'all',  // 'all' | <id string>
  });
  const [page, setPage] = useState(1);
  const perPage = 6;

  const [toDelete, setToDelete] = useState(null); // { kind, id }

  const fetchAssignments = async (opts = {}) => {
    const params = {};
    if (opts.sort && opts.sort !== 'all') params.filter = opts.sort;
    if (opts.category && opts.category !== 'all') params.category_id = opts.category;

    const res = await assignmentsService.getAssignments(params);
    const d = res?.data || {};

    setSummary({
      total_count: d.total_count ?? 0,
      assignments_percentage: d.assignments_percentage ?? 0,
      assignments_status: d.assignments_status ?? 'increase',
      completed_count: d.completed_count ?? 0,
      completed_percentage: d.completed_percentage ?? 0,
      completed_status: d.completed_status ?? 'increase',
      uncompleted_count: d.uncompleted_count ?? 0,
      uncompleted_percentage: d.uncompleted_percentage ?? 0,
      uncompleted_status: d.uncompleted_status ?? 'decrease',
    });

    setAssignments(d.assignments?.data || []);
    setExams(d.exams?.data || []);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const catsRes = await assignmentsService.getCategories();
        if (mounted) {
          const cats = catsRes?.data?.data || [];
          // Process categories to extract titles from translations
          const processedCategories = cats.map(category => {
            if (category.translations && Array.isArray(category.translations)) {
              const arTranslation = category.translations.find(t => t.locale === 'ar');
              return {
                ...category,
                title: arTranslation?.title || category.title || ''
              };
            }
            return category;
          });
          setCategories(processedCategories);
        }
        if (mounted) {
          await fetchAssignments({ sort: filters.sort, category: filters.category });
        }
      } catch (e) {
        console.error('Failed to load teacher assignments:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    fetchAssignments({ sort: filters.sort, category: filters.category }).catch(console.error);
  }, [filters.sort, filters.category]);

  const filterGroups = useMemo(() => ([
    {
      key: 'sort',
      label: 'الترتيب حسب',
      type: 'radio',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'name', label: 'الاسم' },
        { value: 'latest', label: 'الأحدث أولاً' },
        { value: 'oldest', label: 'الأقدم أولاً' },
      ],
    },
    {
      key: 'type',
      label: 'النوع',
      type: 'radio',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'assignment', label: 'مهام' },
        { value: 'exam', label: 'اختبارات' },
      ],
    },
    {
      key: 'category',
      label: 'التخصص',
      type: 'radio',
      options: [
        { value: 'all', label: 'الكل' },
        ...categories.map((c) => ({ value: String(c.id), label: c.title })),
      ],
    },
  ]), [categories]);

  const allItems = useMemo(() => {
    const aCards = (assignments || []).map((a, idx) => ({
      id: a.id,
      idx: idx + 1,
      kind: 'assignment',
      typeLabel: 'مهمة',
      programTitle: a?.program?.title || '-',
      categoryTitle: getCategoryName(a?.program?.category, 'ar') || undefined,
      title: a.title,
      description: a.description,
      due: fmtDate(a.date),
      submissionsCount: a.solutions_count ?? 0,
      totalSubscribers: a?.program?.subscriptions_count ?? 0,
      created_at: a.created_at || a.updated_at || null,
    }));

    const eCards = (exams || []).map((e, idx) => ({
      id: e.id,
      idx: idx + 1,
      kind: 'exam',
      typeLabel: 'اختبار',
      programTitle: e?.program?.title || '-',
      categoryTitle: getCategoryName(e?.program?.category, 'ar') || undefined,
      title: e.title,
      description: null,
      due: null,
      questions: e.questions_count ?? 0,
      duration: e.duration ? `${e.duration} دقائق` : null,
      submissionsCount: e.students_answered_count ?? 0,
      totalSubscribers: e?.program?.subscriptions_count ?? 0,
      created_at: e.created_at || null,
    }));

    return [...aCards, ...eCards];
  }, [assignments, exams]);

  const filtered = useMemo(() => {
    const activeType = tab !== 'all' ? tab : (filters.type !== 'all' ? filters.type : 'all');

    let list = allItems
      .filter((i) => (activeType === 'all' ? true : i.kind === activeType))
      .filter((i) => {
        if (!searchText?.trim()) return true;
        const q = searchText.trim();
        return (
          i.title?.includes(q) ||
          i.description?.includes(q) ||
          i.programTitle?.includes(q)
        );
      });

    if (filters.sort === 'all') {
      list = [...list].sort((a, b) => +new Date(b.created_at || 0) - +new Date(a.created_at || 0));
    }
    return list;
  }, [allItems, filters.sort, filters.type, tab, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [filters.type, tab, searchText]);

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      if (toDelete.kind === 'assignment') {
        await assignmentsService.deleteAssignment(toDelete.id);
        setAssignments((prev) => prev.filter((x) => x.id !== toDelete.id));
      } else {
        await assignmentsService.deleteExam(toDelete.id);
        setExams((prev) => prev.filter((x) => x.id !== toDelete.id));
      }
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setToDelete(null);
    }
  };

  const handleCreate = () => navigate('/teacher/assignments/new');
  const handleEdit = (item) =>
    navigate(`/teacher/assignments/edit?type=${item.kind}&id=${item.id}`);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-8" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl lg:text-3xl font-bold">إدارة المهام والاختبارات</h1>
        <button onClick={handleCreate} className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">
          إضافة المهام والاختبارات +
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatsCard
          value={summary.total_count}
          label="إجمالي المهام والاختبارات"
          Icon={UserGroupIcon}
          trend={`${summary.assignments_percentage}%`}
          up={(summary.assignments_status || '').toLowerCase() === 'increase'}
        />
        <StatsCard
          value={summary.completed_count}
          label="إجمالي المهام والاختبارات المكتملة"
          Icon={IdentificationIcon}
          trend={`${summary.completed_percentage}%`}
          up={(summary.completed_status || '').toLowerCase() === 'increase'}
        />
        <StatsCard
          value={summary.uncompleted_count}
          label="المهام والاختبارات غير مكتملة"
          Icon={StarIcon}
          trend={`${summary.uncompleted_percentage}%`}
          up={(summary.uncompleted_status || '').toLowerCase() === 'increase'}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Filter
            filterGroups={filterGroups}
            filters={filters}
            onFiltersChange={setFilters}
            isSearchEnabled={false}
            searchText={searchText}
            onSearchChange={setSearchText}
          />
          <button
            onClick={() => setTab('all')}
            className={`px-3 sm:px-5 py-2 rounded-lg text-sm sm:text-base ${tab === 'all' ? 'bg-primary text-white' : 'bg-[#F0F0F0]'}`}
          >
            الكل
          </button>
          <button
            onClick={() => setTab('assignment')}
            className={`px-3 sm:px-5 py-2 rounded-lg text-sm sm:text-base ${tab === 'assignment' ? 'bg-primary text-white' : 'bg-[#F0F0F0]'}`}
          >
            المهام
          </button>
          <button
            onClick={() => setTab('exam')}
            className={`px-3 sm:px-5 py-2 rounded-lg text-sm sm:text-base ${tab === 'exam' ? 'bg-primary text-white' : 'bg-[#F0F0F0]'}`}
          >
            الاختبارات
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paged.map((item) => (
          <div key={`${item.kind}-${item.id}`} className="bg-white p-5 rounded-2xl shadow relative">
            <div className="text-[#B3894E] font-semibold mb-2">
              {item.typeLabel} - <span>{item.programTitle}</span>
            </div>

            {item.kind === 'assignment' ? (
              <p className="font-semibold text-gray-900 mb-2 leading-6">
                {item.idx}. {item.title}
              </p>
            ) : (
              <>
                <p className="font-semibold text-gray-900 leading-6">{item.programTitle}</p>
                <p className="font-semibold text-gray-900 mb-2 leading-6">
                  {item.idx}. {item.title}
                </p>
              </>
            )}

            {item.kind === 'assignment' && item.description && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-3 truncate">
                {item.description}
              </p>
            )}

            {item.kind === 'exam' && (
              <div className="text-sm text-gray-700 space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <QuestionMarkCircleIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-black font-semibold">عدد الأسئلة: </span>
                  {item.questions}
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-black font-semibold">مدة الاختبار: </span>
                  {item.duration || '-'}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-700 space-y-2 mb-3">
              {item.kind === 'assignment' && (
                <div>
                  <span className="text-black font-semibold">تاريخ التسليم: </span>
                  {item.due ? `${item.due.date} – الساعة ${item.due.time}` : '-'}
                </div>
              )}
              <div>
                <span className="text-black font-semibold">عدد التسليمات: </span>
                {item.submissionsCount}/{item.totalSubscribers}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Link
                to={item.kind === 'assignment' ? `/teacher/assignments/${item.id}` : `/teacher/exams/${item.id}`}
                className="flex-1 h-11 rounded-2xl bg-primary text-white flex items-center justify-center font-medium shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:opacity-95 transition"
              >
                عرض تفاصيل
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setToDelete({ kind: item.kind, id: item.id })}
                  className="w-10 h-10 grid place-items-center rounded-xl bg-[#EFEFEF] border border-gray-200 shadow-sm hover:bg-gray-200 transition"
                  title="حذف"
                >
                  <TrashIcon className="w-5 h-5 text-gray-700" />
                </button>

                <button
                  onClick={() => handleEdit(item)}
                  className="w-10 h-10 grid place-items-center rounded-xl bg-[#EFEFEF] border border-gray-200 shadow-sm hover:bg-gray-200 transition"
                  title="تعديل"
                >
                  <PencilSquareIcon className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div />
        <Pagination current={page} total={totalPages} onChange={setPage} />
      </div>

      {toDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-[520px]">
            <p className="text-lg font-semibold mb-2 text-center">
              هل أنت متأكد من حذف هذه المهمة بشكل دائم؟
            </p>
            <p className="text-sm text-gray-600 text-center mb-6">
              سيتم إزالة المهمة نهائياً ولن نتمكن من استعادتها لاحقاً.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setToDelete(null)} className="px-6 py-2 rounded-lg border">
                إلغاء
              </button>
              <button onClick={handleConfirmDelete} className="px-6 py-2 rounded-lg bg-primary text-white">
                حذف
              </button>
            </div>
          </div>
        </div>
      )}  
    </div>
  );
}
