// src/pages/dashboard/admin/ContactUs/List.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterPanel from "../../../../components/Filter";
import DataTable from "../../../../components/DataTable";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import useContactUs from "../../../../hooks/useContactUs";
import { ContactUsService } from "../../../../services/contactUsService";
import { EyeIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import { extractTranslation } from "../../../../utils/translations";

export default function ContactUsList() {
    const navigate = useNavigate();

    // Filters + debounced search
    const [filters, setFilters] = useState({ filter: "latest" });
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        const id = setTimeout(() => setSearch(searchInput), 450);
        return () => clearTimeout(id);
    }, [searchInput]);

    const { data, meta, loading, setPage, refetch } = useContactUs({ filters, search });

    const fmt = (iso) => {
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
            {
                header: "البرنامج",
                accessor: "program",
                Cell: (program) => {
                    if (!program) return <span className="text-gray-400">—</span>;
                    const title = extractTranslation(program, "title", "ar");
                    return (
                        <span className="text-sm text-gray-700" title={title}>
                            {title || "—"}
                        </span>
                    );
                },
            },
            {
                header: "الحالة",
                accessor: "status",
                Cell: (s) => (
                    <span
                        className={`px-2 py-1 text-xs rounded-full ${Number(s) === 1 ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-700"
                            }`}
                    >
                        {Number(s) === 1 ? "مقروء" : "غير مقروء"}
                    </span>
                ),
            },
            { header: "أُنشئ في", accessor: "created_at", Cell: fmt },
        ],
        []
    );

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

    const onRowClick = (row) => navigate(`/admin/contact-us/${row.id}`);

    const markAsRead = async (row) => {
        try {
            await ContactUsService.updateStatus(row.id, 1);
            await refetch();
        } catch (e) {
            console.error("status update failed", e);
        }
    };

    const handleDelete = async (row) => {
        if (!window.confirm("هل تريد الحذف؟")) return;
        try {
            await ContactUsService.delete(row.id);
            await refetch();
        } catch (e) {
            console.error("delete failed", e);
        }
    };

    if (loading) return <PageSkeleton />;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h2 className="text-2xl font-bold">طلبات التواصل</h2>

            <div className="flex justify-between items-center">
                <FilterPanel
                    filterGroups={filterGroups}
                    filters={filters}
                    onFiltersChange={setFilters}
                    searchText={searchInput}
                    onSearchChange={setSearchInput}
                />
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
                showActions
                selectable={false}
                renderRowActions={(row) => (
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRowClick(row); }}
                            className="bg-primary text-white p-2 rounded-lg"
                            title="عرض"
                        >
                            <EyeIcon className="w-5 h-5" />
                        </button>
                        {Number(row.status) !== 1 && (
                            <button
                                onClick={async (e) => { e.stopPropagation(); await markAsRead(row); }}
                                className="bg-green-100 text-green-700 p-2 rounded-lg"
                                title="تعيين كمقروء"
                            >
                                <CheckIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={async (e) => { e.stopPropagation(); await handleDelete(row); }}
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
