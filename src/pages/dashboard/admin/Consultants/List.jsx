// src/pages/dashboard/admin/Consultants/List.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterPanel from "../../../../components/Filter";
import DataTable from "../../../../components/DataTable";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import StatsCard from "../../../../components/StatsCard";
import useConsultants from "../../../../hooks/useConsultants";
import { ConsultantsService } from "../../../../services/consultantsService";
import {
    EyeIcon,
    UserPlusIcon,
    TrashIcon,
    CloudArrowDownIcon,
    IdentificationIcon,
} from "@heroicons/react/24/outline";

export default function ConsultantsList() {
    const navigate = useNavigate();

    // حالة الفلاتر والبحث (مع ديباونس للبحث)
    const [filters, setFilters] = useState({ filter: "all" });
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const id = setTimeout(() => setSearch(searchInput), 450);
        return () => clearTimeout(id);
    }, [searchInput]);

    const { data, meta, loading, setPage, totals, refetch } = useConsultants({
        filters,
        search,
    });

    // تنسيق التاريخ للعرض العربي
    const formatDate = (iso) => {
        if (!iso) return "-";
        const d = new Date(iso);
        if (isNaN(d)) return "-";
        return d.toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // أعمدة الجدول
    const columns = useMemo(
        () => [
            { header: "#", accessor: "id" },
            { header: "الاسم", accessor: "name" },
            {
                header: "التخصصات",
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
                accessor: "status",
                Cell: (s) => (
                    <span
                        className={`px-2 py-1 text-xs rounded-full ${s === "active"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                    >
                        {s === "active" ? "نشط" : "غير نشط"}
                    </span>
                ),
            },
            { header: "التاريخ", accessor: "created_at", Cell: formatDate },
        ],
        []
    );

    // مجموعات الفلترة
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
                    { value: "active_status", label: "نشط" },
                    { value: "inactive_status", label: "غير نشط" },
                ],
            },
        ],
        []
    );

    // فتح صفحة التفاصيل عند الضغط على الصف
    const onRowClick = (row) => navigate(`/admin/consultants/${row.id}`);

    // إجراء تحويل إلى مدرب
    const handleConvert = async (row) => {
        try {
            await ConsultantsService.convertToTeacher(row.id);
            await refetch();
        } catch (e) {
            console.error("فشل التحويل:", e);
        }
    };

    // حذف فردي
    const handleDelete = async (row) => {
        if (!window.confirm("هل تريد حذف هذا الحساب؟")) return;
        try {
            await ConsultantsService.delete(row.id);
            await refetch();
        } catch (e) {
            console.error("فشل الحذف:", e);
        }
    };

    // حذف جماعي
    const handleBulkDelete = async (selected) => {
        if (!selected?.length) return;
        if (!window.confirm(`حذف ${selected.length} عنصر(عناصر)؟`)) return;
        try {
            await ConsultantsService.bulkDelete(selected);
            await refetch();
        } catch (e) {
            console.error("فشل الحذف الجماعي:", e);
        }
    };

    // تصدير
    const handleExport = async () => {
        try {
            const res = await ConsultantsService.export();
            const blob = new Blob([res.data], { type: res.headers["content-type"] });
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (e) {
            console.error("فشل التصدير:", e);
        }
    };

    if (loading) return <PageSkeleton />;

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            <h2 className="text-xl lg:text-2xl font-bold">الاستشاريون</h2>

            {/* كروت الإحصائيات العلوية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                <StatsCard
                    value={totals.total_consultants}
                    label="إجمالي الاستشاريين"
                    Icon={IdentificationIcon}
                    trend={`${Math.round(totals.consultants_percentage ?? 0)}%`}
                    up={totals.consultants_status === "increase"}
                />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <FilterPanel
                    filterGroups={filterGroups}
                    filters={filters}
                    onFiltersChange={setFilters}
                    searchText={searchInput}
                    onSearchChange={setSearchInput}
                />

                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="bg-secondary text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 text-sm sm:text-base"
                    >
                        <CloudArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5" /> تحميل
                    </button>
                </div>
            </div>

            <DataTable
                data={data}
                columns={columns}
                loading={loading}
                onRowClick={onRowClick}
                serverPagination={{
                    currentPage: meta.current_page,
                    totalPages: meta.last_page,
                    onPageChange: setPage,
                }}
                renderRowActions={(row) => (
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRowClick(row);
                            }}
                            className="bg-primary text-white p-2 rounded-lg"
                            title="عرض"
                        >
                            <EyeIcon className="w-5 h-5" />
                        </button>

                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                await handleConvert(row);
                            }}
                            className="bg-green-100 text-green-700 p-2 rounded-lg"
                            title="تحويل إلى مدرب"
                        >
                            <UserPlusIcon className="w-5 h-5" />
                        </button>

                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                await handleDelete(row);
                            }}
                            className="bg-red-100 text-red-600 p-2 rounded-lg"
                            title="حذف"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
                bulkActions={(selected) => (
                    <div className="flex items-center gap-4">
                        <span>{selected.length} محدد</span>
                        <button
                            onClick={() => handleBulkDelete(selected)}
                            className="p-2 bg-red-100 text-red-600 rounded"
                            title="حذف جماعي"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}
