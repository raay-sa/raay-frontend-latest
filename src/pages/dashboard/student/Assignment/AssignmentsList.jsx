import React, { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

import SingleSelectFilter from '../../../../components/Filters/SingleSelectFilter';
import MultiSelectFilter from '../../../../components/Filters/MultiSelectFilter';
import Pagination from '../../../../components/Pagination';

import PublicService from '../../../../services/publicService';
import StudentAssignmentsService from '../../../../services/student/assignmentsService';
import { getCategoryName } from '../../../../utils/index';
import { extractTranslation } from '../../../../utils/translations';

/* ─────────────────────────────────────────────────────────── */
/* utilities                                                   */
/* ─────────────────────────────────────────────────────────── */
const arDate = (iso) => {
    if (!iso) return { date: '—', time: '' };
    const d = new Date(iso.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
    const date = d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = d.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' });
    return { date, time };
};

const nowHasPassed = (iso) => {
    if (!iso) return false;
    const d = new Date(iso.replace(' ', 'T'));
    return Date.now() > d.getTime();
};

// map UI status → API filter param (only those your API supports)
const STATUS_TO_API = {
    'not-submitted': 'not_submitted',
    'not-submitted-past': 'time_out',
    'submitted': 'submitted',
    'graded-success': 'evaluated',
    'passed': 'passed',
    'not-passed': 'not_passed',
    // "awaiting-mark" is a local-only state (no backend filter)
};

/* ─────────────────────────────────────────────────────────── */
/* page                                                       */
/* ─────────────────────────────────────────────────────────── */
export default function StudentAssignments() {
    const navigate = useNavigate();

    // filters
    const [typeFilter, setTypeFilter] = useState(null); // 'مهمة' | 'اختبار' | null
    const [specialtiesFilter, setSpecialtiesFilter] = useState([]); // category labels
    const [programFilter, setProgramFilter] = useState([]); // program labels
    const [expertFilter, setExpertFilter] = useState(null); // teacher label
    const [statusFilter, setStatusFilter] = useState(null); // UI key string

    // maps for translating labels → ids
    const [catLabelToId, setCatLabelToId] = useState(new Map());
    const [progLabelToId, setProgLabelToId] = useState(new Map());
    const [teacherLabelToId, setTeacherLabelToId] = useState(new Map());

    // options for dropdowns
    const [types] = useState(['مهمة', 'اختبار']);
    const [specialtiesOpts, setSpecialtiesOpts] = useState([]);
    const [programsOpts, setProgramsOpts] = useState([]);
    const [expertsOpts, setExpertsOpts] = useState([]);

    // server data
    const [items, setItems] = useState([]); // unified list (assignments + exams)
    const [loading, setLoading] = useState(false);

    // chart percentages
    const [chart, setChart] = useState({
        completed_assignments: 0,
        uncompleted_assignments: 0,
        success_exams: 0,
        unsuccess_exams: 0,
    });

    // pagination (client-side since we unify lists)
    const [page, setPage] = useState(1);
    const PER_PAGE = 6;

    /* ── bootstrap filter options ───────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const [catsRes, progsRes, teachersRes] = await Promise.all([
                    PublicService.getCategories(),
                    StudentAssignmentsService.programsList(),
                    StudentAssignmentsService.teachersList(),
                ]);

                // categories
                const cats = catsRes?.data || [];
                const categoryTitles = cats.map(c => {
                    const title = getCategoryName(c, 'ar') || 'غير محدد';
                    return title;
                });
                setSpecialtiesOpts(categoryTitles);
                setCatLabelToId(new Map(cats.map((c, index) => [categoryTitles[index], Number(c.id)])));

                // programs
                const progs = progsRes?.data || [];
                const programTitles = progs.map(p => {
                    const title = extractTranslation(p, 'title', 'ar') || 'غير محدد';
                    return title;
                });
                setProgramsOpts(programTitles);
                setProgLabelToId(new Map(progs.map((p, index) => [programTitles[index], Number(p.id)])));

                // teachers (experts)
                const tchs = (teachersRes?.data?.data) || (teachersRes?.data || []);
                setExpertsOpts(tchs.map(t => t.name));
                setTeacherLabelToId(new Map(tchs.map(t => [t.name, Number(t.id)])));
            } catch (e) {
                console.error('Failed loading filter options', e);
            }
        })();
    }, []);

    /* ── fetch list whenever filters change ─────────────────── */
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const catIds = specialtiesFilter.map(l => catLabelToId.get(l)).filter(Boolean);
                const progIds = programFilter.map(l => progLabelToId.get(l)).filter(Boolean);
                const teacherIds = expertFilter ? [teacherLabelToId.get(expertFilter)].filter(Boolean) : [];

                const params = {
                    per_page: 50,
                    ...(statusFilter && STATUS_TO_API[statusFilter] ? { filter: STATUS_TO_API[statusFilter] } : {}),
                    ...(catIds.length ? { 'categories_id[]': catIds } : {}),
                    ...(progIds.length ? { 'programs_id[]': progIds } : {}),
                    ...(teacherIds.length ? { 'teachers_id[]': teacherIds } : {}),
                };

                const { data } = await StudentAssignmentsService.list(params);

                // chart
                setChart({
                    completed_assignments: Number(data?.completed_assignments ?? 0),
                    uncompleted_assignments: Number(data?.uncompleted_assignments ?? 0),
                    success_exams: Number(data?.success_exams ?? 0),
                    unsuccess_exams: Number(data?.unsuccess_exams ?? 0),
                });

                // map assignments to UI
                const assignments = (data?.data?.assignments?.data || []).map(a => {
                    const { date, time } = arDate(a.date);
                    let statusUi = 'not-submitted';
                    if (a.is_solved) {
                        // if solved:
                        statusUi = a.is_marked
                            ? 'graded-success'            // graded, show grade
                            : 'submitted';                 // delivered, waiting mark
                    } else if (nowHasPassed(a.date)) {
                        statusUi = 'not-submitted-past';
                    }
                    return {
                        id: `A-${a.id}`,
                        kind: 'مهمة',
                        programId: a.program_id,
                        path: a.program?.title,
                        title: a.title,
                        description: a.description,
                        dueDate: date,
                        dueTime: time,
                        status: statusUi,
                        isSolved: !!a.is_solved,
                        isMarked: !!a.is_marked,
                        numericGrade: a.solutions_grade != null ? Number(a.solutions_grade) : null,
                        grade: a.solutions_grade != null ? `${a.solutions_grade}%` : null,
                    };
                });

                // map exams to UI
                const exams = (data?.data?.exams?.data || []).map(e => {
                    let statusUi = 'ready-to-start';
                    // new flags are_solved/is_marked from API
                    if (e.is_solved) {
                        statusUi = e.is_marked ? 'marked' : 'awaiting-mark';
                    }
                    if (e.is_marked) {
                        const last = e.last_grade != null ? Number(e.last_grade) : null;
                        const pass = e.success_rate != null ? Number(e.success_rate) : null;
                        if (last != null && pass != null) {
                            statusUi = last >= pass ? 'passed' : 'not-passed';
                        } else if (last != null && pass == null) {
                            statusUi = 'passed';
                        }
                    }

                    const isNumDuration = /^\d+$/.test(String(e.duration || ''));
                    const durationLabel = isNumDuration ? `${e.duration} دقيقة` : (e.duration || '—');

                    return {
                        id: `E-${e.id}`,
                        kind: 'اختبار',
                        programId: e.program_id,
                        path: e.program?.title,
                        title: e.title,
                        questions: e.questions_count ?? 0,
                        duration: durationLabel,
                        status: statusUi,
                        isSolved: !!e.is_solved,
                        isMarked: !!e.is_marked,
                        numericGrade: e.last_grade != null ? Number(e.last_grade) : null,
                        grade: e.last_grade != null ? `${e.last_grade}%` : null,
                        remainingTries: e.remaining_tries ?? 0,
                        successRate: e.success_rate != null ? Number(e.success_rate) : null,
                    };
                });

                setItems([...assignments, ...exams]);
                setPage(1);
            } catch (e) {
                console.error('Failed loading assignments', e);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(specialtiesFilter), JSON.stringify(programFilter), expertFilter, statusFilter]);

    /* ── local filtering and pagination ─────────────────────── */
    const statuses = useMemo(() => ([
        { value: null, label: 'الكل' },
        { value: 'not-submitted', label: 'لم يتم التسليم' },
        { value: 'not-submitted-past', label: 'انتهى الوقت' },
        { value: 'submitted', label: 'تم التسليم' },
        { value: 'graded-success', label: 'تم التصحيح' },
        { value: 'awaiting-mark', label: 'بانتظار التقييم' }, // local-only
        { value: 'passed', label: 'ناجح' },
        { value: 'not-passed', label: 'لم تجتز' },
    ]), []);

    // apply client filters (type only; server handles ids/status)
    const filtered = useMemo(() => {
        return items.filter((it) => {
            if (typeFilter && it.kind !== typeFilter) return false;
            if (statusFilter && statusFilter !== 'awaiting-mark') {
                // other filters handled server-side; just keep for "awaiting-mark"
                // If user picked awaiting-mark, emulate locally:
                if (statusFilter === 'awaiting-mark' && it.status !== 'awaiting-mark') return false;
            }
            return true;
        });
    }, [items, typeFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = useMemo(
        () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
        [filtered, page]
    );

    // chart slices from API
    const chartData = [
        { name: 'مهام مكتملة', value: chart.completed_assignments, color: '#1F77B4' },
        { name: 'مهام غير مكتملة', value: chart.uncompleted_assignments, color: '#DDDFE1' },
        { name: 'اختبارات ناجحة', value: chart.success_exams, color: '#2CA02C' },
        { name: 'اختبارات غير ناجحة', value: chart.unsuccess_exams, color: '#D62728' },
    ];

    return (
        <div className="space-y-6 lg:space-y-8 p-3 lg:p-6">
            <h1 className="text-2xl lg:text-3xl font-bold">المهام والاختبارات</h1>

            {/* Header with donut chart */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6 xl:gap-8">
                    {/* Text content */}
                    <div className="text-center xl:text-right order-2 xl:order-1">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2">وقت التعلّم حسب نوع النشاط</h2>
                        <p className="text-gray-600 text-sm sm:text-base lg:text-lg">نحن نعلم أنك تمتلك الموهبة، دعنا ندفعك نحو أهدافك</p>
                    </div>

                    {/* Chart and metrics */}
                    <div className="flex flex-col lg:flex-row w-full xl:w-3/5 gap-6 lg:gap-8 order-1 xl:order-2">
                        {/* Activity metrics */}
                        <div className="w-full lg:w-1/2 text-center lg:text-right">
                            <h3 className="text-lg sm:text-xl font-semibold mb-4">نشاط المتدرب</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                                {chartData.map((entry) => (
                                    <div key={entry.name} className="flex items-center justify-between lg:justify-end gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                                            <span className="text-xs sm:text-sm font-medium">{entry.name}:</span>
                                        </div>
                                        <span className="text-sm sm:text-base font-bold">{Number(entry.value ?? 0).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="w-full lg:w-1/2 h-48 sm:h-56 lg:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        innerRadius="50%"
                                        outerRadius="80%"
                                        paddingAngle={2}
                                    >
                                        {chartData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters section */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">تصفية النتائج</h3>
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                    {/* Clear all button */}
                    <button
                        onClick={() => {
                            setTypeFilter(null);
                            setSpecialtiesFilter([]);
                            setProgramFilter([]);
                            setExpertFilter(null);
                            setStatusFilter(null);
                            setPage(1);
                        }}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-lg text-sm sm:text-base font-medium hover:bg-primary-dark transition-colors order-1"
                    >
                        الكل
                    </button>

                    {/* Filter dropdowns */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 order-2">
                        <SingleSelectFilter
                            label="نوع"
                            options={types}
                            value={typeFilter}
                            onChange={(v) => { setTypeFilter(v); setPage(1); }}
                        />

                        <MultiSelectFilter
                            label="حسب التخصص"
                            options={specialtiesOpts}
                            selected={specialtiesFilter}
                            onChange={(v) => { setSpecialtiesFilter(v); setPage(1); }}
                        />

                        <MultiSelectFilter
                            label="حسب البرنامج"
                            options={programsOpts}
                            selected={programFilter}
                            onChange={(v) => { setProgramFilter(v); setPage(1); }}
                        />

                        <SingleSelectFilter
                            label="الخبير"
                            options={expertsOpts}
                            value={expertFilter}
                            onChange={(v) => { setExpertFilter(v); setPage(1); }}
                        />

                        <SingleSelectFilter
                            label="الحالة"
                            options={statuses.map(s => s.label)}
                            value={statusFilter ? statuses.find(s => s.value === statusFilter)?.label : null}
                            onChange={(label) => {
                                const s = statuses.find((x) => x.label === label);
                                setStatusFilter(s?.value ?? null);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paged.map((a) => (
                    <div key={a.id} className="bg-white p-4 sm:p-5 lg:p-6 rounded-lg shadow relative hover:shadow-lg transition-shadow">
                        {/* Status badge */}
                        <span
                            className={`absolute top-3 sm:top-4 right-3 sm:right-4 px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full font-medium
              ${a.status === 'not-submitted' ? 'bg-gray-100 text-gray-600'
                                    : a.status === 'not-submitted-past' ? 'bg-red-100 text-red-600'
                                        : a.status === 'submitted' ? 'bg-gray-100 text-gray-600'
                                            : a.status === 'awaiting-mark' ? 'bg-yellow-100 text-yellow-700'
                                                : a.status === 'graded-success' ? 'bg-green-100 text-green-600'
                                                    : a.status === 'not-passed' ? 'bg-red-100 text-red-600'
                                                        : a.status === 'passed' ? 'bg-green-100 text-green-600' : ''}`}
                        >
                            {a.status === 'not-submitted' && 'لم يتم التسليم'}
                            {a.status === 'not-submitted-past' && 'انتهى الوقت'}
                            {a.status === 'submitted' && 'تم التسليم'}
                            {a.status === 'awaiting-mark' && 'قيد التقييم'}
                            {a.status === 'graded-success' && 'تم التصحيح'}
                            {a.status === 'not-passed' && 'لم تجتز'}
                            {a.status === 'passed' && 'ناجح'}
                        </span>

                        {/* Path & title (clickable to view when marked) */}
                        <div className="pr-16 sm:pr-20">
                            <h3 className="font-semibold text-secondary text-sm sm:text-base lg:text-lg mb-2">
                                {a.kind} – {a.path}
                            </h3>
                            {a.kind === 'اختبار' && a.isMarked ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(`/student/assignments/exams/${String(a.id).replace('E-', '')}/review`, {
                                            state: {
                                                score: a.numericGrade ?? 0,
                                                canRetry: (a.remainingTries ?? 0) > 0,
                                                successRate: a.successRate ?? 70,
                                                examMeta: { title: a.title }
                                            }
                                        })
                                    }
                                    className="font-semibold text-gray-800 mb-3 hover:underline text-right block text-sm sm:text-base"
                                >
                                    {a.title}
                                </button>
                            ) : a.kind === 'مهمة' && a.isMarked ? (
                                <Link
                                    to={`/student/assignments/tasks/${String(a.id).replace('A-', '')}`}
                                    className="font-semibold text-gray-800 mb-3 hover:underline block text-right text-sm sm:text-base"
                                >
                                    {a.title}
                                </Link>
                            ) : (
                                <p className="font-semibold text-gray-800 mb-3 text-sm sm:text-base">{a.title}</p>
                            )}
                        </div>

                        {/* Description or test details */}
                        {a.kind === 'مهمة' && a.description && (
                            <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-4">{a.description}</p>
                        )}

                        {a.kind === 'اختبار' && (
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="font-semibold text-gray-700">عدد الأسئلة:</span>
                                    <span className="text-gray-600">{a.questions ?? 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="font-semibold text-gray-700">مدة الاختبار:</span>
                                    <span className="text-gray-600">{a.duration}</span>
                                </div>
                            </div>
                        )}

                        {/* Footer actions */}
                        <div className="space-y-3">
                            {a.kind === 'مهمة' ? (
                                <>
                                    <div className="text-xs sm:text-sm text-gray-600">
                                        <span className="font-semibold text-gray-700">تاريخ التسليم:</span>
                                        <span className="mr-2">{a.dueDate} – الساعة {a.dueTime}</span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        {/* Not submitted → upload */}
                                        {a.status === 'not-submitted' && (
                                            <Link
                                                to={`/student/assignments/tasks/${String(a.id).replace('A-', '')}`}
                                                className="inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-primary-dark transition-colors"
                                            >
                                                إرفاق الملف
                                            </Link>
                                        )}

                                        {/* Marked → show grade */}
                                        {a.status === 'graded-success' && (
                                            <div className="text-green-600 font-semibold text-xs sm:text-sm bg-green-50 px-3 py-2 rounded-lg">
                                                <span className="font-semibold text-gray-700">درجة التقييم:</span>
                                                <span className="mr-2">{a.grade}</span>
                                            </div>
                                        )}

                                        {/* Delivered but not marked */}
                                        {a.status === 'submitted' && (
                                            <span className="text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium">
                                                تم التسليم – بانتظار التقييم
                                            </span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Action buttons */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        {/* Ready to start */}
                                        {a.status === 'ready-to-start' && (
                                            <Link
                                                to={`/student/assignments/exams/${String(a.id).replace('E-', '')}`}
                                                className="inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-primary-dark transition-colors"
                                            >
                                                بدء الاختبار
                                            </Link>
                                        )}

                                        {/* Solved but not marked → no start button */}
                                        {a.status === 'awaiting-mark' && (
                                            <span className="text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium">
                                                تم الإنهاء – بانتظار التقييم
                                            </span>
                                        )}

                                        {/* Failed after marking */}
                                        {a.status === 'not-passed' && (
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                {a.remainingTries > 0 ? (
                                                    <Link
                                                        to={`/student/assignments/exams/${String(a.id).replace('E-', '')}`}
                                                        className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-primary-dark transition-colors"
                                                    >
                                                        إعادة المحاولة
                                                    </Link>
                                                ) : (
                                                    <span className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs sm:text-sm font-medium">
                                                        لا توجد محاولات متبقية
                                                    </span>
                                                )}

                                                {/* View answers / review */}
                                                <Link
                                                    to={`/student/assignments/exams/${String(a.id).replace('E-', '')}/review`}
                                                    state={{
                                                        score: a.numericGrade ?? 0,
                                                        canRetry: (a.remainingTries ?? 0) > 0,
                                                        successRate: a.successRate ?? 70,
                                                        examMeta: { title: a.title }
                                                    }}
                                                    className="px-3 py-2 rounded-lg bg-secondary text-white text-xs sm:text-sm font-medium hover:bg-secondary-dark transition-colors"
                                                >
                                                    عرض الإجابات
                                                </Link>
                                            </div>
                                        )}

                                        {/* Passed */}
                                        {a.status === 'passed' && (
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <div className="text-green-600 font-semibold text-xs sm:text-sm bg-green-50 px-3 py-2 rounded-lg">
                                                    ناجح{a.grade ? ` – درجة ${a.grade}` : ''}
                                                </div>
                                                <Link
                                                    to={`/student/assignments/exams/${String(a.id).replace('E-', '')}/review`}
                                                    state={{
                                                        score: a.numericGrade ?? 0,
                                                        canRetry: false,
                                                        successRate: a.successRate ?? 70,
                                                        examMeta: { title: a.title }
                                                    }}
                                                    className="px-3 py-2 rounded-lg bg-secondary text-white text-xs sm:text-sm font-medium hover:bg-secondary-dark transition-colors"
                                                >
                                                    عرض الإجابات
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* pagination and loading */}
            <div className="flex flex-col items-center gap-4">
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3 text-sm sm:text-base text-gray-500">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            جاري التحميل…
                        </div>
                    </div>
                )}
                
                {!loading && paged.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">لا توجد مهام أو اختبارات</h3>
                        <p className="text-sm sm:text-base text-gray-500">لم يتم العثور على أي مهام أو اختبارات تطابق المعايير المحددة</p>
                    </div>
                )}

                {!loading && paged.length > 0 && (
                    <Pagination current={page} total={totalPages} onChange={(p) => setPage(p)} />
                )}
            </div>
        </div>
    );
}
