import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterPanel from '../../../../components/Filter';
import DataTable from '../../../../components/DataTable';
import StatsCard from '../../../../components/StatsCard';
import PageSkeleton from '../../../../components/Loaders/PageSkeleton';
import { gradingService } from '../../../../services/teacher/gradingService';
import assignmentsService from '../../../../services/teacher/assignmentsService';
import { processCategoriesList } from '../../../../utils/index';
import {
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

export default function TeacherExamSolutionsPage() {
    const navigate = useNavigate();

    // filters & search
    const [filters, setFilters] = useState({
        filter: 'latest', // latest | oldest | name | evaluated | not_evaluated
        category_id: null,
    });
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    useEffect(() => {
        const id = setTimeout(() => setSearch(searchInput), 450);
        return () => clearTimeout(id);
    }, [searchInput]);

    const [categories, setCategories] = useState([]);

    // table + meta
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    // stats
    const [totals, setTotals] = useState({
        total_count: 0,
        exams_percentage: 0,
        exams_status: 'stable',
        completed_count: 0,
        completed_percentage: 0,
        completed_status: 'stable',
        uncompleted_count: 0,
        uncompleted_percentage: 0,
        uncompleted_status: 'stable',
    });

    // bootstrap categories
    useEffect(() => {
        assignmentsService.getCategories().then(res => {
            const cats = res?.data?.data ?? res?.data ?? [];
            // Process categories to extract titles from translations
            setCategories(processCategoriesList(cats));
        });
    }, []);

    // fetch list
    useEffect(() => {
        const run = async () => {
            setLoading(true);
            try {
                const params = {
                    page,
                    ...(filters.filter ? { filter: filters.filter } : {}),
                    ...(filters.category_id ? { category_id: filters.category_id } : {}),
                    ...(search ? { search } : {}),
                };
                const { data: res } = await gradingService.listExamSolutions(params);
                const list = res?.data || {};
                setData(list.data || []);
                setMeta({
                    current_page: list.current_page || 1,
                    last_page: list.last_page || 1,
                    total: list.total || 0,
                });

                setTotals({
                    total_count: res?.total_count ?? 0,
                    exams_percentage: res?.exams_percentage ?? 0,
                    exams_status: res?.exams_status ?? 'stable',
                    completed_count: res?.completed_count ?? 0,
                    completed_percentage: res?.completed_percentage ?? 0,
                    completed_status: res?.completed_status ?? 'stable',
                    uncompleted_count: res?.uncompleted_count ?? 0,
                    uncompleted_percentage: res?.uncompleted_percentage ?? 0,
                    uncompleted_status: res?.uncompleted_status ?? 'stable',
                });
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [page, filters, search]);

    const columns = useMemo(() => {
        const Pill = (s) => {
            const label =
                s === 'marked' ? 'مُقيَّم' :
                    s === 'not_marked' ? 'لم يُقيَّم' : '—';
            const cls =
                s === 'marked' ? 'bg-green-100 text-green-700' :
                    s === 'not_marked' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600';
            return <span className={`px-2 py-1 text-xs rounded-full ${cls}`}>{label}</span>;
        };

        return [
            { header: '#', accessor: 'id' },
            {
                header: 'اسم الطالب',
                accessor: 'student_name',
                Cell: (_, row) => row?.student?.name ?? '—',
            },
            {
                header: 'عنوان الاختبار',
                accessor: 'exam_title',
                Cell: (_, row) => row?.exam?.title ?? '—',
            },
            {
                header: 'البرنامج',
                accessor: 'program_title',
                Cell: (_, row) => row?.exam?.program?.title ?? '—',
            },
            {
                header: 'الحالة',
                accessor: 'status',
                Cell: (s) => Pill(s),
            },
        ];
    }, []); 

    const filterGroups = useMemo(() => ([
        {
            key: 'filter',
            label: 'الترتيب / الحالة',
            type: 'radio',
            options: [
                { value: 'latest', label: 'الأحدث أولاً' },
                { value: 'oldest', label: 'الأقدم أولاً' },
                { value: 'name', label: 'حسب الاسم' },
                { value: 'evaluated', label: 'تم التقييم' },
                { value: 'not_evaluated', label: 'لم يُقيَّم' },
            ],
        },
        {
            key: 'category_id',
            label: 'التخصص',
            type: 'radio',
            options: [{ value: null, label: 'الكل' }, ...categories.map(c => ({ value: c.id, label: c.title }))],
        },
    ]), [categories]);

    if (loading && !data.length) return <PageSkeleton />;

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            <h2 className="text-xl lg:text-2xl font-bold">تقييم الاختبارات</h2>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                <StatsCard
                    value={totals.total_count}
                    label="إجمالي الحلول"
                    Icon={ClipboardDocumentListIcon}
                    trend={`${Math.round(totals.exams_percentage)}%`}
                    up={totals.exams_status === 'increase'}
                />
                <StatsCard
                    value={totals.completed_count}
                    label="تم التقييم"
                    Icon={CheckCircleIcon}
                    trend={`${Math.round(totals.completed_percentage)}%`}
                    up={totals.completed_status === 'increase'}
                />
                <StatsCard
                    value={totals.uncompleted_count}
                    label="لم يُقيَّم"
                    Icon={XCircleIcon}
                    trend={`${Math.round(totals.uncompleted_percentage)}%`}
                    up={totals.uncompleted_status === 'increase'}
                />
            </div>

            {/* Filters + search */}
            <div className="flex justify-between items-center">
                <FilterPanel
                    filterGroups={filterGroups}
                    filters={filters}
                    onFiltersChange={(next) => { setFilters(next); setPage(1); }}
                    searchText={searchInput}
                    onSearchChange={setSearchInput}
                />
            </div>

            <DataTable
                data={data}
                columns={columns}
                loading={loading}
                serverPagination={{
                    currentPage: meta.current_page,
                    totalPages: meta.last_page,
                    onPageChange: setPage,
                }}
                showActions
                renderRowActions={(row) => (
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/teacher/assessments/exams/${row.id}`)}
                            className="bg-primary text-white px-3 py-1 rounded-lg text-sm"
                        >
                            تقييم
                        </button>
                    </div>
                )}
            />
        </div>
    );
}
