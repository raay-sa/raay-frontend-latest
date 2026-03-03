import React, { useEffect, useMemo, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChartBarSquareIcon,
  RectangleGroupIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  ArrowUpOnSquareIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

import SingleSelectFilter from '../../../../components/Filters/SingleSelectFilter';
import MultiSelectFilter from '../../../../components/Filters/MultiSelectFilter';
import RatingFilter from '../../../../components/Filters/RatingFilter';
import PriceRangeFilter from '../../../../components/Filters/PriceRangeFilter';
import Pagination from '../../../../components/Pagination';
import CourseCard from '../../../../components/CourseCard';
import StatsCard from '../../../../components/StatsCard';
import FilterDrawer from '../../../../components/Filter';

import ProgramsService from '../../../../services/teacher/programsService';
import StudentProgramsService from '../../../../services/student/programsService';
import StudentLiveService from '../../../../services/student/liveService';
import PublicService from '../../../../services/publicService';
import { withBaseUrl } from '../../../../utils/url';
import LiveService from '../../../../services/teacher/liveService';
import toast from 'react-hot-toast';
import { processProgramsList } from '../../../../utils/translations';
import { processCategoriesList, getCategoryName } from '../../../../utils/index';

/* ─────────────────────────────────────────────────────────── */
export default function Courses({ role = 'student' }) {
  return role === 'teacher' ? <TeacherCourses /> : <StudentCourses />;
}

/* ─────────────────────────────────────────────────────────── */
/* STUDENT                                                     */
/* ─────────────────────────────────────────────────────────── */
function StudentCourses() {
  const navigate = useNavigate();

  // dropdown options (labels shown in UI)
  const [specializationOpts, setSpecializationOpts] = useState([]);
  const [programOpts, setProgramOpts] = useState([]);

  const [catLabelToId, setCatLabelToId] = useState(new Map());
  const [progLabelToId, setProgLabelToId] = useState(new Map());

  // filters
  const [specLabel, setSpecLabel] = useState(null);
  const [programLabels, setProgramLabels] = useState([]);
  const [minRating, setMinRating] = useState(null);
  const [priceRange, setPriceRange] = useState([0, 9000]);

  // server list + pagination
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;
  const [lastPage, setLastPage] = useState(1);

  // load categories + one page of programs to populate dropdowns
  useEffect(() => {
    (async () => {
      try {
        const [catsRes, firstRes] = await Promise.all([
          PublicService.getCategories(),
          StudentProgramsService.list({ page: 1, per_page: 20 }),
        ]);

        const cats = Array.isArray(catsRes?.data?.data) ? catsRes.data.data : (catsRes?.data || []);
        // Process categories to extract titles from translations
        const processedCats = processCategoriesList(cats);
        const catLabels = processedCats.map(c => c.title);
        setSpecializationOpts(catLabels);
        setCatLabelToId(new Map(processedCats.map(c => [c.title, Number(c.id)])));

        const list = firstRes?.data?.data?.data || [];
        const uniquePrograms = [];
        const map = new Map();
        list.forEach(p => {
          if (!map.has(p.title)) {
            map.set(p.title, p.id);
            uniquePrograms.push(p.title);
          }
        });
        setProgramOpts(uniquePrograms);
        setProgLabelToId(map);
      } catch (e) {
        console.error('Failed to load filters (categories/programs)', e);
      }
    })();
  }, []);

  // fetch list whenever filters/page change
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const catId = specLabel ? catLabelToId.get(specLabel) : null;
        const programIds = (programLabels || []).map(l => progLabelToId.get(l)).filter(Boolean);

        const params = {
          page,
          per_page: PER_PAGE,
          ...(catId ? { 'categories_id[]': [catId] } : {}),
          ...(programIds.length ? { 'programs_id[]': programIds } : {}),
          ...(minRating ? { score: minRating } : {}),
          price_from: priceRange?.[0] ?? 0,
          price_to: priceRange?.[1] ?? 9000,
        };

        const res = await StudentProgramsService.list(params);
        const paged = res?.data?.data;
        const list = paged?.data || [];

        // Process programs with translations
        const processedList = processProgramsList(list);
        setItems(processedList.map(mapStudentProgramToCard));
        setLastPage(paged?.last_page || 1);
      } catch (e) {
        console.error('Failed to load student programs:', e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, specLabel, JSON.stringify(programLabels), minRating, JSON.stringify(priceRange), catLabelToId, progLabelToId]);

  const priceBounds = { min: 0, max: 9000 };

  const handleStudentPrimary = async (course) => {
    // Join live only if: it's a live program AND currently broadcasting AND the student is subscribed
    if (course.isLive && course.isBroadcasting && course.isSubscribed) {
      try {
        const { data } = await StudentLiveService.getStream(course.id);
        const streamId = data?.streamId || data?.stream_id;
        if (!streamId) {
          toast.error('البث غير متاح حالياً');
          return;
        }
        navigate(`/student/live/${course.id}`, { state: { streamId } });
        return;
      } catch (e) {
        console.error(e);
        toast.error('تعذر الانضمام إلى البث');
        return;
      }
    }

    // If already subscribed, go to details
    if (course.isSubscribed) {
      navigate(`/student/courses/${course.id}`);
      return;
    }

    // For unsubscribed courses, go to details page instead of adding to cart
    navigate(`/student/courses/${course.id}`);
  };

  return (
    <div dir="rtl" className="flex p-6">
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">البرامج التدريبية</h1>

        {/* FILTER ROW */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SingleSelectFilter
            label="حسب التخصص"
            options={specializationOpts}
            value={specLabel}
            onChange={(label) => { setSpecLabel(label); setPage(1); }}
          />
          <MultiSelectFilter
            label="البرامج"
            options={programOpts}
            selected={programLabels}
            onChange={(labels) => { setProgramLabels(labels); setPage(1); }}
          />
          <RatingFilter
            label="حسب التقييم"
            options={[5, 4, 3, 2, 1]}
            value={minRating}
            onChange={(v) => { setMinRating(v); setPage(1); }}
          />
          <PriceRangeFilter
            label="حسب السعر"
            min={priceBounds.min}
            max={priceBounds.max}
            value={priceRange}
            onChange={(rng) => { setPriceRange(rng); setPage(1); }}
          />

          <button
            onClick={() => {
              setSpecLabel(null);
              setProgramLabels([]);
              setMinRating(null);
              setPriceRange([priceBounds.min, priceBounds.max]);
              setPage(1);
            }}
            className="ml-auto px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            مسح الكل
          </button>
        </div>

        {/* GRID — click handled by button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((c) => (
            <CourseCard
              key={c.id}
              {...c}
              role="student"
              onPrimary={() => handleStudentPrimary(c)}
            />
          ))}
        </div>

        <Pagination current={page} total={lastPage} onChange={setPage} />

        {loading && <div className="text-center mt-4 text-sm text-gray-500">جاري التحميل...</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* TEACHER — now with Excel import/template                    */
/* ─────────────────────────────────────────────────────────── */
function TeacherCourses() {
  const navigate = useNavigate();

  const TABS = [
    { key: 'all', label: 'الكل' },
    { key: 'live', label: 'البرامج المباشرة' },
    { key: 'recorded', label: 'البرامج المسجلة' },
    { key: 'deleted', label: 'البرامج المحذوفة' },
  ];
  const [activeTab, setActiveTab] = useState('all');

  const filterGroups = [
    {
      key: 'order', label: 'الترتيب حسب', type: 'radio',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'name', label: 'الاسم' },
        { value: 'latest', label: 'الأحدث أولاً' },
        { value: 'oldest', label: 'الأقدم أولاً' },
      ],
    },
    {
      key: 'status', label: 'حالة البرنامج', type: 'radio',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'active_status', label: 'تم النشر' },
        { value: 'deleted_status', label: 'محذوف' },
      ],
    },
    {
      key: 'type', label: 'نوع البرنامج', type: 'radio',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'registered_type', label: 'مسجل' },
        { value: 'live_type', label: 'مباشر' },
      ],
    },
    {
      key: 'rating', label: 'التقييم', type: 'stars',
      options: [{ value: 5 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 1 }],
    },
    { key: 'price', label: 'السعر', type: 'range', range: { min: 0, max: 9000, step: 1 } },
  ];

  const [filters, setFilters] = useState({
    order: 'all', status: 'all', type: 'all', rating: 'all', price: [0, 9000],
  });
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [startingId, setStartingId] = useState(null);
  const PER_PAGE = 6;

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_programs_count: 0, program_percentage: 0, program_status: 'increase',
    registered_programs_count: 0, registered_programs_percentage: 0, registered_programs_status: 'increase',
    live_programs_count: 0, live_programs_percentage: 0, live_programs_status: 'increase',
  });

  const [serverLists, setServerLists] = useState({
    all: { items: [], last_page: 1, total: 0 },
    live: { items: [], last_page: 1, total: 0 },
    recorded: { items: [], last_page: 1, total: 0 },
    deleted: { items: [], last_page: 1, total: 0 },
  });

  const buildParams = () => {
    const params = { page, per_page: PER_PAGE };
    if (activeTab === 'live') params.filter = 'live_type';
    else if (activeTab === 'recorded') params.filter = 'registered_type';
    else if (activeTab === 'deleted') params.filter = 'deleted_status';
    else {
      if (filters.status !== 'all') params.filter = filters.status;
      else if (filters.type !== 'all') params.filter = filters.type;
      else if (['name', 'latest', 'oldest'].includes(filters.order)) params.filter = filters.order;
    }
    if (filters.rating !== 'all') params.score = Number(filters.rating);
    if (Array.isArray(filters.price)) {
      params.price_from = filters.price[0];
      params.price_to = filters.price[1];
    }
    if (searchText.trim()) params.search = searchText.trim();
    return params;
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const { data } = await ProgramsService.list(buildParams());

      setStats({
        total_programs_count: data?.total_programs_count ?? 0,
        program_percentage: data?.program_percentage ?? 0,
        program_status: data?.program_status ?? 'increase',
        registered_programs_count: data?.registered_programs_count ?? 0,
        registered_programs_percentage: data?.registered_programs_percentage ?? 0,
        registered_programs_status: data?.registered_programs_status ?? 'increase',
        live_programs_count: data?.live_programs_count ?? 0,
        live_programs_percentage: data?.live_programs_percentage ?? 0,
        live_programs_status: data?.live_programs_status ?? 'increase',
      });

      const normalize = (section) => ({
        items: processProgramsList(section?.data || []).map(mapProgramToCard),
        last_page: section?.last_page || 1,
        total: section?.total || (section?.data?.length ?? 0),
      });

      setServerLists({
        all: normalize(data?.data),
        live: normalize(data?.live_programs),
        recorded: normalize(data?.registered_programs),
        deleted: normalize(data?.deleted_programs),
      });
    } catch (e) {
      console.error('Failed to load programs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLive = async (course) => {
    try {
      setStartingId(course.id);
      const { data } = await LiveService.createStream(course.id);
      const streamId = data?.streamId || data?.stream_id;
      if (!streamId) throw new Error("Missing streamId");
      navigate(`/teacher/live/${course.id}`, { state: { streamId } });
    } catch (e) {
      console.error(e);
      toast.error("تعذر بدء البرنامج المباشر");
    } finally {
      setStartingId(null);
    }
  };

  useEffect(() => { fetchPrograms(); /* eslint-disable-next-line */ }, [
    activeTab, page, filters.order, filters.status, filters.type, filters.rating, JSON.stringify(filters.price), searchText
  ]);
  useEffect(() => { setPage(1); }, [activeTab, filters.order, filters.status, filters.type, filters.rating, JSON.stringify(filters.price), searchText]);

  const currentList = useMemo(() => {
    const base =
      activeTab === 'live' ? serverLists.live :
        activeTab === 'recorded' ? serverLists.recorded :
          activeTab === 'deleted' ? serverLists.deleted : serverLists.all;

    let ordered = [...base.items];
    if (filters.order === 'name') ordered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else if (filters.order === 'latest') ordered.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    else if (filters.order === 'oldest') ordered.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

    const searched = searchText.trim()
      ? ordered.filter(c => (c.title || '').toLowerCase().includes(searchText.trim().toLowerCase()))
      : ordered;

    return { ...base, items: searched };
  }, [serverLists, activeTab, filters.order, searchText]);

  // ────────── NEW: Excel import/template for programs ──────────
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const triggerImport = () => fileInputRef.current?.click();

  const handleImportChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      // backend expects key "excel_file"
      const response = await ProgramsService.importFromExcel(file, 'excel_file');
      const res = response?.data ?? {};

      const failedList =
        res.faliled_programs_list ??
        res.failed_programs_list ??
        res.faliled_list ??
        res.failed_list ??
        [];

      const createdCount = Number(res.created_count ?? 0);
      const failedCount = Number(res.failed_count ?? failedList.length ?? 0);
      const reason = res.reason || (failedCount ? 'تم استبعاد بعض الصفوف.' : null);
      const baseMsg = res.message || (createdCount > 0 ? 'تم اضافة البيانات بنجاح' : 'تمت المعالجة');

      toast.custom((t) => (
        <div className={`rtl bg-white border rounded-xl p-3 shadow-md w-[360px] ${t.visible ? 'animate-in fade-in zoom-in' : 'animate-out fade-out zoom-out'}`}>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div className="flex-1">
              <div className="font-semibold">استيراد البرامج</div>
              <div className="text-sm text-gray-700 mt-0.5">{baseMsg}</div>
              <div className="text-sm mt-1">
                تمت الإضافة: <b>{createdCount}</b> | تم الاستبعاد: <b>{failedCount}</b>
              </div>
              {reason ? <div className="text-xs text-gray-500 mt-1">{reason}</div> : null}
              {!!failedList?.length && (
                <div className="pt-2 text-xs">
                  <div className="font-medium">عينة من الصفوف المستبعدة:</div>
                  <ul className="list-disc pr-5 space-y-0.5 max-h-28 overflow-auto">
                    {failedList.slice(0, 5).map((it, idx) => (
                      <li key={idx} className="truncate">
                        {(it?.title || it?.name || 'بدون عنوان')} — {(it?.category || it?.category_id || 'فئة غير محددة')}
                      </li>
                    ))}
                    {failedList.length > 5 && (
                      <li>وعدد {failedList.length - 5} صفوف أخرى…</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              إغلاق
            </button>
          </div>
        </div>
      ));

      await fetchPrograms();
    } catch (error) {
      console.error('Programs import failed', error);
      toast.error('تعذر استيراد الملف. تأكد من صحة الصيغة ثم حاول مرة أخرى.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadExample = async () => {
    try {
      const res = await ProgramsService.downloadExcelExample();
      openBlobInNewTab(res, 'programs_template.xlsx');
      toast.success('تم تنزيل نموذج الإكسل بنجاح.');
    } catch (e) {
      console.error('Programs example download failed', e);
      toast.error('تعذر تحميل نموذج الإكسل. حاول مرة أخرى.');
    }
  };

  const openBlobInNewTab = (response, fallbackName = 'download.xlsx') => {
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
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
  };

  return (
    <div dir="rtl" className="flex p-6">
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">إدارة البرامج التدريبية</h1>

          <div className="flex items-center gap-2">
            {/* NEW: Import Excel */}
            <button
              onClick={triggerImport}
              disabled={importing}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${importing ? 'bg-gray-300 text-gray-600' : 'bg-white text-gray-700 border'}`}
              title="استيراد ملف إكسل"
            >
              <ArrowUpOnSquareIcon className="w-5 h-5" />
              {importing ? 'جارٍ الاستيراد...' : 'استيراد ملف إكسل'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportChange}
            />

            {/* NEW: Download Excel template */}
            <button
              onClick={handleDownloadExample}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-white text-gray-700 border"
              title="تحميل نموذج إكسل"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              نموذج إكسل
            </button>

            {/* Existing: Add program */}
            <NavLink to="/teacher/courses/create" className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg shadow">
              <PlusIcon className="w-5 h-5" />
              <span>إضافة برنامج</span>
            </NavLink>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-6">
          <StatsCard value={stats.total_programs_count} label="إجمالي البرامج" Icon={RectangleGroupIcon} trend={`${stats.program_percentage || 0}%`} up={(stats.program_status || '').toLowerCase() === 'increase'} />
          <StatsCard value={stats.live_programs_count} label="البرامج المباشرة" Icon={ChartBarSquareIcon} trend={`${stats.live_programs_percentage || 0}%`} up={(stats.live_programs_status || '').toLowerCase() === 'increase'} />
          <StatsCard value={stats.registered_programs_count} label="البرامج المسجلة" Icon={ArrowsUpDownIcon} trend={`${stats.registered_programs_percentage || 0}%`} up={(stats.registered_programs_status || '').toLowerCase() === 'increase'} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === t.key ? 'bg-primary text-white' : 'bg-white border'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <FilterDrawer
            filterGroups={filterGroups}
            filters={filters}
            onFiltersChange={(next) => setFilters(prev => ({
              ...prev,
              ...next,
              ...(next.price ? { price: next.price } : {}),
            }))}
            isSearchEnabled={false}
            searchText={searchText}
            onSearchChange={setSearchText}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {currentList.items.map((c) => (
            <CourseCard
              key={c.id}
              {...c}
              role="teacher"
              onDetails={() => navigate(`/teacher/courses/${c.id}`)}
              onEdit={() => navigate(`/teacher/courses/${c.id}/edit`)}
              onStudents={() => navigate(`/teacher/programs/${c.id}/students`)}
              onStart={() => handleStartLive(c)}
              onManage={() => navigate(`/teacher/courses/${c.id}/sections`)}
              startLoading={startingId === c.id}
            />
          ))}
        </div>

        <Pagination current={page} total={currentList.last_page} onChange={setPage} />
        {loading && <div className="text-center mt-4 text-sm text-gray-500">جاري التحميل...</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Helpers                                                     */
/* ─────────────────────────────────────────────────────────── */
function mapProgramToCard(p) {
  const rating = p?.reviews_avg_score != null ? parseFloat(p.reviews_avg_score) : (p?.reviews_count ? 4 : 0);
  return {
    id: p.id,
    imageSrc: withBaseUrl(p.image),
    badgeLabel: getCategoryName(p?.category, 'ar'),
    title: p.title,
    description: p.description,
    reviewsCount: p?.reviews_count ?? 0,
    rating: Number.isFinite(rating) ? rating : 0,
    duration: '',
    price: p?.price ?? 0,
    instructorName: p?.teacher?.name || '',
    instructorAvatar: withBaseUrl(p?.teacher?.avatar) || '',
    status: p?.type === 'live' ? 'live' : 'published',
    isLive: p?.type === 'live',
  };
}

function mapStudentProgramToCard(p) {
  const rating = p?.reviews_avg_score != null ? parseFloat(p.reviews_avg_score) : 0;
  const isLiveType = (p?.type || '').toLowerCase() === 'live';
  const isBroadcasting = !!p?.is_live; 
  return {
    id: p.id,
    imageSrc: withBaseUrl(p.image),
    badgeLabel: getCategoryName(p?.category, 'ar'),
    title: p.title,
    description: p.description,
    reviewsCount: p?.reviews_count ?? 0,
    rating: Number.isFinite(rating) ? rating : 0,
    duration: '',
    price: p?.price ?? 0,
    instructorName: p?.teacher?.name || '',
    instructorAvatar: withBaseUrl(p?.teacher?.image) || '',
    status: isLiveType ? 'live' : 'published',
    isLive: isLiveType,
    isBroadcasting,
    isSubscribed: !!p?.is_subscribed,
  };
}
