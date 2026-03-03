// src/pages/dashboard/admin/Trainees/List.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    BanknotesIcon,
    ClipboardDocumentCheckIcon,
    RectangleGroupIcon,
    UsersIcon,
    PencilSquareIcon,
} from "@heroicons/react/24/outline";

import DataTable from "../../../../components/DataTable";
import Filter from "../../../../components/Filter";
import StatsCard from "../../../../components/StatsCard";
import useAdminTrainees from "../../../../hooks/admin/useAdminTrainees";

const AR = {
    live: "مباشر",
    registered: "مسجل",
    successful: "مدفوع",
    failed: "ملغي",
    assignments: {
        completed: "مكتملة",
        not_completed: "غير مكتملة",
        not_started: "لم يبدأ",
    },
};

const badge = (text, color) => (
    <span
        className={`text-xs px-2 py-1 rounded-md ${color === "green"
            ? "bg-green-100 text-green-700"
            : color === "amber"
                ? "bg-amber-100 text-amber-700"
                : color === "gray"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-red-100 text-red-700"
            }`}
    >
        {text}
    </span>
);

export default function AdminTraineesList() {
    const nav = useNavigate();

    const {
        data: rows,
        meta,
        loading,
        filters,
        setFilters,
        setPage,
        stats,
    } = useAdminTrainees(1, {
        sort: "all",               // all | latest | oldest | name
        programType: "all",        // all | live_type | registered_type
        tasks: "all",              // all | not_started_tasks | not_completed_tasks | completed_tasks
        exams: "all",              // all | passed | not_passed
        search: "",                // search term
    });

    // local search input state with debounce
    const [searchText, setSearchText] = useState('');
    useEffect(() => {
        const id = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchText }));
            setPage(1);
        }, 450);
        return () => clearTimeout(id);
    }, [searchText, setFilters, setPage]);


    // filter panel config
    const filterGroups = useMemo(
        () => [
            {
                key: "sort",
                label: "الترتيب حسب:",
                type: "radio",
                options: [
                    { value: "all", label: "الكل" },
                    { value: "name", label: "الاسم" },
                    { value: "latest", label: "الأحدث أولاً" },
                    { value: "oldest", label: "الأقدم أولاً" },
                ],
            },
            {
                key: "programType",
                label: "نوع البرنامج:",
                type: "radio",
                options: [
                    { value: "all", label: "الكل" },
                    { value: "live_type", label: "مباشر" },
                    { value: "registered_type", label: "مسجل" },
                ],
            },
            {
                key: "exams",
                label: "حالة الاختبارات:",
                type: "radio",
                options: [
                    { value: "all", label: "الكل" },
                    { value: "passed", label: "ناجح" },
                    { value: "not_passed", label: "لم يجتز" },
                ],
            },
            {
                key: "tasks",
                label: "حالة المهام:",
                type: "radio",
                options: [
                    { value: "all", label: "الكل" },
                    { value: "not_started_tasks", label: AR.assignments.not_started },
                    { value: "not_completed_tasks", label: AR.assignments.not_completed },
                    { value: "completed_tasks", label: AR.assignments.completed },
                ],
            },
        ],
        []
    );

    // table columns
    const columns = useMemo(
        () => [
            { header: "#", accessor: "idx" },
            { header: "اسم المتدرب", accessor: "trainee_name" },
            { header: "البريد الإلكتروني", accessor: "trainee_email" },
            {
                header: "اسم البرنامج",
                accessor: "program_title",
                Cell: (v) => (
                    <div className="flex items-center gap-2">
                        <span className="truncate max-w-[160px]" title={v}>
                            {v}
                        </span>
                    </div>
                ),
            },
            {
                header: "نسبه الانجاز",
                accessor: "student_progress",
                Cell: (v) => (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                        v >= 80 ? 'bg-green-100 text-green-600' :
                        v >= 60 ? 'bg-yellow-100 text-yellow-600' :
                        v >= 40 ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                    }`}>
                        {v}%
                    </span>
                ),
            },
            {
                header: "القيمة",
                accessor: "price",
                Cell: (v) => `ر.س ${Number(v).toLocaleString("ar-EG")}`,
            },
            {
                header: "حالة الدفع",
                accessor: "pay_state",
                Cell: (v) =>
                    v === "successful" ? badge(AR.successful, "green") : badge(AR.failed, "red"),
            },
            { header: "التاريخ", accessor: "date" },
        ],
        []
    );

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            <h1 className="text-xl lg:text-2xl font-bold">إدارة المتدربين</h1>

            {/* stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                <StatsCard
                    value={`${stats.profit.toLocaleString("ar-EG")} ر.س`}
                    label="صافي الأرباح"
                    Icon={BanknotesIcon}
                    trend={`${stats.profit_percentage}%`}
                    up={stats.profit_status === "increase"}
                />
                <StatsCard
                    value={stats.tasks_count}
                    label="إجمالي المهام والاختبارات"
                    Icon={ClipboardDocumentCheckIcon}
                    trend={`${stats.tasks_percentage}%`}
                    up={stats.tasks_status === "increase"}
                />
                <StatsCard
                    value={stats.programs_count}
                    label="إجمالي البرامج"
                    Icon={RectangleGroupIcon}
                    trend={`${stats.program_percentage}%`}
                    up={stats.program_status === "increase"}
                />
                <StatsCard
                    value={stats.students_count}
                    label="إجمالي المتدربين"
                    Icon={UsersIcon}
                    trend={`${stats.students_percentage}%`}
                    up={stats.students_status === "increase"}
                />
            </div>

            {/* actions row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <Filter
                    filterGroups={filterGroups}
                    filters={filters}
                    onFiltersChange={(next) => {
                        setFilters(prev => ({
                            ...prev,
                            ...next,
                        }));
                        setPage(1);
                    }}
                    searchText={searchText}
                    onSearchChange={setSearchText}
                />

                <div className="flex flex-row  w-1/5 items-stretch sm:items-center gap-2 sm:gap-3">
                    <Link
                        to="/admin/trainees/create"
                        className="bg-primary text-white w-100 px-5 sm:px-4 py-3 rounded-lg text-sm sm:text-base text-center">
                        + إضافة
                    </Link>

                    <button className="bg-secondary text-white px-5 sm:px-4 py-2 rounded-lg border text-sm sm:text-base">
                        تحميل
                    </button>
                </div>
            </div>

            {/* table */}
            <DataTable
                data={rows}
                columns={columns}
                loading={loading}
                selectable={false}
                showActions={true}
                serverPagination={{
                    currentPage: meta.current_page || 1,
                    totalPages: meta.last_page || 1,
                    onPageChange: setPage,
                }}
                renderRowActions={(row) =>
                    row && row.id ? (
                        <button
                            className="bg-primary text-white p-2 rounded-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                nav(`/admin/trainees/${row.id}/edit`);
                            }}
                            title="تعديل"
                        >
                            <PencilSquareIcon className="w-4 h-4" />
                        </button>
                    ) : null
                }
                bulkActions={() => null}
            />

  
        </div>
    );
}
