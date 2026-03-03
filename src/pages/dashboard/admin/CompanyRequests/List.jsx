// src/pages/dashboard/admin/CompanyRequests/List.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterPanel from "../../../../components/Filter";
import DataTable from "../../../../components/DataTable";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import useCompanyRequests from "../../../../hooks/useCompanyRequests";
import { CompanyRequestService } from "../../../../services/companyRequestService";
import {
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

export default function CompanyRequestsList() {
    const navigate = useNavigate();

    // فلاتر موحّدة + بحث بمؤقت (ديباونس خارجي بسيط)
    const [filters, setFilters] = useState({ filter: "latest" });
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        const id = setTimeout(() => setSearch(searchInput), 450);
        return () => clearTimeout(id);
    }, [searchInput]);

    const { data, meta, loading, setPage, refetch } = useCompanyRequests({
        filters,
        search,
    });

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

    const columns = useMemo(
        () => [
            { header: "#", accessor: "id" },
            { header: "الاسم", accessor: "name" },
            { header: "البريد الإلكتروني", accessor: "email" },
            { header: "رقم الاتصال", accessor: "phone" },
            { header: "الشركة", accessor: "company" },
            {
                header: "عدد المتدربين",
                accessor: "trainers_count",
                Cell: (v) => (v ?? 0),
            },
            {
                header: "الحالة",
                accessor: "status",
                Cell: (s) => (
                    <span
                        className={`px-2 py-1 text-xs rounded-full ${String(s) === "1"
                                ? "bg-green-100 text-green-600"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                    >
                        {String(s) === "1" ? "مقروء" : "غير مقروء"}
                    </span>
                ),
            },
            { header: "تاريخ الإنشاء", accessor: "created_at", Cell: formatDate },
        ],
        []
    );

    // مجموعات الفلتر لعنصر FilterPanel الموجود لديك
    const filterGroups = useMemo(
        () => [
            {
                key: "filter",
                label: "الترتيب / الحالة",
                type: "radio",
                options: [
                    { value: "latest", label: "الأحدث أولاً" },
                    { value: "oldest", label: "الأقدم أولاً" },
                    { value: "name", label: "الاسم" },
                    { value: "readable", label: "المقروءة" },
                    { value: "not_readable", label: "غير المقروءة" },
                ],
            },
        ],
        []
    );

    const handleToggleStatus = async (row) => {
        try {
            const next = String(row.status) === "1" ? 0 : 1;
            await CompanyRequestService.updateStatus(row.id, next);
            await refetch();
        } catch (e) {
            console.error("toggle status failed", e);
        }
    };

    const handleDelete = async (row) => {
        if (!window.confirm("هل تريد حذف هذا الطلب؟")) return;
        try {
            await CompanyRequestService.delete(row.id);
            await refetch();
        } catch (e) {
            console.error("delete failed", e);
        }
    };

    const onRowClick = (row) => {
        navigate(`/admin/company-requests/${row.id}`);
    };

    if (loading) return <PageSkeleton />;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h2 className="text-2xl font-bold">طلبات الشركات</h2>

            <div className="flex justify-between items-center">
                <FilterPanel
                    filterGroups={filterGroups}
                    filters={filters}
                    onFiltersChange={setFilters}
                    searchText={searchInput}
                    onSearchChange={setSearchInput}
                />
                <div />
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
                                await handleToggleStatus(row);
                            }}
                            className={`p-2 rounded-lg ${String(row.status) === "1"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                            title={
                                String(row.status) === "1" ? "تحديد كغير مقروء" : "تحديد كمقروء"
                            }
                        >
                            {String(row.status) === "1" ? (
                                <XCircleIcon className="w-5 h-5" />
                            ) : (
                                <CheckCircleIcon className="w-5 h-5" />
                            )}
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
            />
        </div>
    );
}
