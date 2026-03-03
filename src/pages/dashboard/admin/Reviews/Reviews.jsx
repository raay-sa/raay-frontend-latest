import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StarIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  CloudArrowDownIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import useReviews from '../../../../hooks/useReviews';
import useEvaluations from '../../../../hooks/useEvaluations';
import StatsCard from '../../../../components/StatsCard';
import DataTable from '../../../../components/DataTable';
import FilterPanel from '../../../../components/Filter';
import PageSkeleton from '../../../../components/Loaders/PageSkeleton';
import { ReviewsService } from '../../../../services/reviewsService';

function useClickOutside(ref, cb) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) cb();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState('quick');
  const [dropKey, setDropKey] = useState('all');
  const dropRef = useRef(null);

  // keep a single page state for both tabs (DataTable uses it)
  const [page, setPage] = useState(1);

  // ---- Search (debounced) ----
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 450);
    return () => clearTimeout(id);
  }, [searchInput]);

  // ---- Filters (API: filter=name|oldest|latest, score=1..5) ----
  const [filters, setFilters] = useState({ sort: 'all', score: 0, duration: 'all' });
  const apiFilters = useMemo(() => ({ sort: filters.sort, score: filters.score }), [filters]);

  useClickOutside(dropRef, () => { });

  // ---- Quick Reviews (API) ----
  const {
    reviews,
    pagination: reviewsMeta,
    loading: reviewsLoading,
    stats, // full stats with percentages + status
    reload: reloadReviews,
  } = useReviews({ page, filters: apiFilters, search });

  // ---- Evaluation Forms (API) ----
  const {
    evaluations,
    pagination: evalMeta,
    loading: evalLoading,
    reload: reloadEvals,
  } = useEvaluations(page);

  useEffect(() => {
    setDropKey(view === 'quick' ? 'all' : 'content');
  }, [view]);

  const QUICK_CATS = [
    { key: 'all', label: 'كل التقييمات' },
    { key: 'positive', label: 'تقييم إيجابي' },
    { key: 'negative', label: 'تقييم سلبي' },
  ];

  const FORM_SECTIONS = [
    { key: 'content', label: 'التدريب و المحتوى' },
    { key: 'general', label: 'التقييم العام' },
    { key: 'org', label: 'التنظيم و التواصل' },
    { key: 'notes', label: 'الملاحظات و الاقتراحات' },
  ];

  const BASE_SORT = {
    key: 'sort',
    label: 'الترتيب حسب',
    type: 'radio',
    options: [
      { label: 'لا شيء', value: 'all' },
      { label: 'الاسم', value: 'name' },
      { label: 'الأحدث أولاً', value: 'latest' },
      { label: 'الأقدم أولاً', value: 'oldest' },
    ]
  };

  const GROUP_SCORE = {
    key: 'score',
    label: 'التقييم',
    type: 'stars',
    options: [{ value: 5 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 1 }],
  };

  const filterGroups = view === 'quick'
    ? [BASE_SORT, GROUP_SCORE]
    : [BASE_SORT, GROUP_SCORE];

  // Map reviews to table rows
  const quickData = useMemo(() => {
    let d = reviews.map((r) => ({
      id: r.id,
      name: r.student?.name || 'غير معروف',
      program: r.program?.title || '—',
      comment: r.comment || '',
      score: r.score ?? 0,
      status: r.status === 1 ? 'نشط' : 'معطل',
      rating:
        r.score === 5 ? 'ممتاز'
          : r.score === 4 ? 'جيد'
            : r.score === 3 ? 'مقبول'
              : 'ضعيف',
      date: r.created_at?.split('T')[0] || '',
    }));

    if (dropKey === 'positive') d = d.filter(row => row.score > 2);
    if (dropKey === 'negative') d = d.filter(row => row.score <= 2);

    return d;
  }, [reviews, dropKey]);

  const FORM_DATA = useMemo(() => {
    return evaluations.map((e, i) => ({
      id: i + 1,
      name: e.student_name,
      email: e.student_email,
      program: e.program_title,
      duration: e.program_duration ?? '—',
      created_at: e.created_at?.split('T')[0] ?? '—',
    }));
  }, [evaluations]);

  const COL_QUICK = [
    { header: '#', accessor: 'id' },
    { header: 'اسم المتدرب', accessor: 'name' },
    { header: 'اسم البرنامج', accessor: 'program' },
    { header: 'الحالة', accessor: 'status' },
    { header: 'التعليق', accessor: 'comment' },
    {
      header: 'التقييم',
      accessor: 'score',
      Cell: (score) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              className={`w-4 h-4 ${i < (score || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
      ),
    },
    { header: 'التاريخ', accessor: 'date' },
  ];

  const COL_FORM = [
    { header: '#', accessor: 'id' },
    { header: 'اسم المتدرب', accessor: 'name' },
    { header: 'البريد الإلكتروني', accessor: 'email' },
    { header: 'اسم البرنامج', accessor: 'program' },
    { header: 'مدة البرنامج', accessor: 'duration' },
    { header: 'التاريخ', accessor: 'created_at' },
  ];

  const data = view === 'quick' ? quickData : FORM_DATA;
  const columns = view === 'quick' ? COL_QUICK : COL_FORM;
  const loading = view === 'quick' ? reviewsLoading : evalLoading;
  const meta = view === 'quick' ? reviewsMeta : evalMeta;

  // Stats from API (with trend + up/down)
  const cards = [
    {
      value: stats.total ?? 0,
      label: 'إجمالي التقييمات',
      Icon: StarIcon,
      trend: `${Math.round(Number(stats.review_percentage ?? 0))}%`,
      up: (stats.review_status ?? 'stable') === 'increase',
    },
    {
      value: stats.positive ?? 0,
      label: 'التقييمات الإيجابية',
      Icon: HandThumbUpIcon,
      trend: `${Math.round(Number(stats.positive_percentage ?? 0))}%`,
      up: (stats.positive_status ?? 'stable') === 'increase',
    },
    {
      value: stats.negative ?? 0,
      label: 'التقييمات السلبية',
      Icon: HandThumbDownIcon,
      trend: `${Math.round(Number(stats.negative_percentage ?? 0))}%`,
      up: (stats.negative_status ?? 'stable') === 'increase',
    },
  ];

  const categories = view === 'quick' ? QUICK_CATS : FORM_SECTIONS;
  const [category, setCategory] = useState(dropKey);
  useEffect(() => setCategory(dropKey), [dropKey]);
  useEffect(() => setDropKey(category), [category]);

  // Reset to first page when controls change
  useEffect(() => {
    setPage(1);
  }, [search, filters, view, dropKey]);

  // ------- Bulk Delete -------
  const handleBulkDelete = async (ids = []) => {
    if (!ids.length) return;
    try {
      await ReviewsService.bulkDelete(ids);
      await reloadReviews();
    } catch (e) {
      console.error('Bulk delete failed', e);
    }
  };

  // ------- Bulk Hide -------
  const handleBulkHide = async (ids = []) => {
    if (!ids.length) return;
    try {
      await ReviewsService.bulkHide(ids);
      await reloadReviews();
    } catch (e) {
      console.error('Bulk hide failed', e);
    }
  };

  // ------- Export -------
  const handleExport = async () => {
    try {
      const res = await ReviewsService.export();
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  if (loading && page === 1 && data.length === 0) return <PageSkeleton />;

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
        <h1 className="text-xl lg:text-3xl font-bold">مراجعة التقييمات</h1>
        {view === 'form' && (
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/evaluation-preview')}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              معاينة النموذج
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {cards.map((c, i) => (
          <StatsCard
            key={i}
            value={c.value}
            label={c.label}
            Icon={c.Icon}
            trend={c.trend}
            up={c.up}
          />
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setView('quick')}
          className={`px-4 py-2 rounded-lg text-sm min-w-[120px] ${view === 'quick' ? 'bg-primary text-white' : 'bg-white border'}`}
        >
          تقييم مختصر
        </button>
        <button
          onClick={() => setView('form')}
          className={`px-4 py-2 rounded-lg text-sm min-w-[120px] ${view === 'form' ? 'bg-primary text-white' : 'bg-white border'}`}
        >
          استمارة التقييم
        </button>
      </div>

      <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-start gap-4">
        <FilterPanel
          filterGroups={filterGroups}
          filters={filters}
          onFiltersChange={(next) => setFilters(next)}
          searchText={searchInput}
          onSearchChange={setSearchInput}
        />

        <div className="flex items-center gap-2 relative" ref={dropRef}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-primary text-white px-4 py-2 rounded-lg min-w-[150px]"
          >
            {categories.map((c) => (
              <option className="bg-white text-black" key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-4 py-2 bg-secondary text-white rounded-lg"
          >
            <CloudArrowDownIcon className="w-5 h-5" /> تحميل
          </button>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        pageSizeOptions={[5, 10, 20]}
        renderRowActions={() => null}
        bulkActions={view === 'quick'
          ? (selected) => (
            <div className="flex items-center gap-4">
              <span>{selected.length} محدد</span>
              <button
                onClick={() => handleBulkHide(selected)}
                className="p-2 bg-[#F0F0F0] hover:bg-primary rounded"
                title="إخفاء المحدد"
              >
                <EyeIcon className="w-5 h-5 text-gray-600 hover:text-white" />
              </button>
              <button
                onClick={() => handleBulkDelete(selected)}
                className="p-2 bg-primary text-white rounded "
                title="حذف المحدد"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          )
          : undefined}
        serverPagination={{
          currentPage: meta.currentPage,
          totalPages: meta.lastPage,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
