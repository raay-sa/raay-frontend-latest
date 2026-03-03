import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    UserGroupIcon,
    IdentificationIcon,
} from "@heroicons/react/24/outline";
import useRegisterRequests from "../../../../hooks/useRegisterRequests";
import FilterPanel from "../../../../components/Filter";
import DataTable from "../../../../components/DataTable";
import StatsCard from "../../../../components/StatsCard";

export default function RegisterRequests() {
    // Debounced search (same pattern as AccountsPage)
    const [searchInput, setSearchInput] = useState("");
    const {
        loading,
        filter, setFilter,
        search, setSearch,
        page, setPage,
        summary,
        rows,
        pagination,
        approve,
        reject,
    } = useRegisterRequests();

    useEffect(() => {
        const id = setTimeout(() => setSearch(searchInput), 450);
        return () => clearTimeout(id);
    }, [searchInput, setSearch]);

    // Filter groups
    const filterGroups = useMemo(
        () => [
            {
                key: "filter",
                label: "الترتيب / الحالة",
                type: "radio",
                options: [
                    { value: "all", label: "الكل" },
                    { value: "name", label: "الاسم" },
                    { value: "latest", label: "الأحدث أولاً" },
                    { value: "oldest", label: "الأقدم أولاً" },
                ],
            },
        ],
        []
    );

    const formatDate = (iso) => {
        if (!iso) return "—";
        const d = new Date(iso);
        if (isNaN(d)) return "—";
        return d.toLocaleString("ar-EG", { hour12: true });
        // You can localize further if needed
    };

    const columns = useMemo(
        () => [
            { header: "#", accessor: "id" },
            { header: "اسم المدرب", accessor: "name" },
            {
                header: "التخصص",
                accessor: "categories",
                Cell: (cats) =>
                    Array.isArray(cats) && cats.length
                        ? cats.map((c) => c.title).join(", ")
                        : "—",
            },
            { header: "البريد الإلكتروني", accessor: "email" },
            { header: "رقم الاتصال", accessor: "phone" },
            {
                header: "الحالة",
                accessor: "is_approved",
                Cell: (v) => (
                    <span
                        className={`px-2 py-1 text-xs rounded-full ${v ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                            }`}
                    >
                        {v ? "مقبول" : "قيد المراجعة"}
                    </span>
                ),
            },
            {
                header: "التاريخ",
                accessor: "created_at",
                Cell: (v) => formatDate(v),
            },
        ],
        []
    );

    const renderRowActions = (row) => (
        <div className="flex gap-2">
            <Link
                to={`/admin/experts/${row.id}`}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs"
            >
                عرض
            </Link>
            {!row.is_approved && (
                <button
                    onClick={() => approve(row.id)}
                    className="bg-primary text-white px-3 py-2 rounded-lg text-xs"
                >
                    قبول
                </button>
            )}
            <button
                onClick={() => reject(row.id)}
                className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-xs"
            >
                رفض
            </button>
        </div>
    );

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h2 className="text-2xl font-bold">طلبات تسجيل المدربين</h2>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <StatsCard
                    value={summary.total_students}
                    label="إجمالي المتدربين"
                    Icon={UserGroupIcon}
                    trend={`${Math.round(summary.student_percentage ?? 0)}%`}
                    up={summary.student_status === "increase"}
                />
                <StatsCard
                    value={summary.total_teachers}
                    label="إجمالي الخبراء"
                    Icon={IdentificationIcon}
                    trend={`${Math.round(summary.teacher_percentage ?? 0)}%`}
                    up={summary.teacher_status === "increase"}
                />
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center">
                <FilterPanel
                    filterGroups={filterGroups}
                    filters={{ filter }}
                    onFiltersChange={(f) => {
                        setFilter(f.filter);
                        setPage(1);
                    }}
                    searchText={searchInput}
                    onSearchChange={setSearchInput}
                />
                <div className="flex gap-2">{/* right side actions (optional) */}</div>
            </div>

            {/* Table */}
            <DataTable
                data={rows}
                columns={columns}
                loading={loading}
                showActions
                serverPagination={{
                    currentPage: pagination.current_page,
                    totalPages: pagination.last_page,
                    onPageChange: setPage,
                }}
                renderRowActions={renderRowActions}
            />
        </div>
    );
}
