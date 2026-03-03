// src/pages/dashboard/admin/Managers/List.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../../components/DataTable";
import Filter from "../../../../components/Filter";
import { ManagersService } from "../../../../services/managersService";
import useManagers from "../../../../hooks/useManagers";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import { toast } from "react-hot-toast";

export default function ManagersList() {
    const navigate = useNavigate();

    // filters & debounced search
    const [filters, setFilters] = useState({
        filter: "all", // all | name | latest | oldest
    });
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        const id = setTimeout(() => setSearch(searchInput), 450);
        return () => clearTimeout(id);
    }, [searchInput]);

    const { items, meta, loading, setPage, refetch } = useManagers(1, filters, search);

    const handleDeleteOne = async (row) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا المدير؟")) return;
        try {
            await ManagersService.delete(row.id);
            toast.success("تم حذف المدير بنجاح");
            await refetch();
        } catch (e) {
            toast.error("تعذر حذف المدير");
            console.error(e);
        }
    };

    const columns = useMemo(() => [
        { header: "#", accessor: "id" },
        { 
            header: "الاسم", 
            accessor: "name",
            Cell: (value, row) => row.name || row.full_name || value || "—"
        },
        { 
            header: "البريد الإلكتروني", 
            accessor: "email",
            Cell: (value) => value || "—"
        },
        { 
            header: "الهاتف", 
            accessor: "phone",
            Cell: (value) => value || "—"
        },
        {
            header: "تاريخ الإضافة",
            accessor: "created_at",
            Cell: (v) => v ? new Date(v).toLocaleDateString("ar-EG") : "—",
        },
    ], []);

    const filterGroups = useMemo(() => ([
        {
            key: "filter",
            label: "الترتيب",
            type: "radio",
            options: [
                { value: "all", label: "الكل" },
                { value: "name", label: "الاسم" },
                { value: "latest", label: "الأحدث أولاً" },
                { value: "oldest", label: "الأقدم أولاً" },
            ],
        },
    ]), []);

    if (loading) return <PageSkeleton />;

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-xl lg:text-2xl font-bold">إدارة المديرين</h1>
                <button
                    onClick={() => navigate("/admin/managers/create")}
                    className="bg-primary text-white px-4 py-2 rounded-lg inline-flex items-center gap-1 text-sm lg:text-base w-full sm:w-auto"
                >
                    <PlusIcon className="w-4 h-4 lg:w-5 lg:h-5" /> إضافة مدير
                </button>
            </div>

            {/* <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <Filter
                    filterGroups={filterGroups}
                    filters={filters}
                    onFiltersChange={setFilters}
                    searchText={searchInput}
                    onSearchChange={setSearchInput}
                />
            </div> */}

            <DataTable
                data={items}
                columns={columns}
                loading={loading}
                serverPagination={{
                    currentPage: meta.current_page,
                    totalPages: meta.last_page,
                    onPageChange: setPage,
                }}
                renderRowActions={(row) => (
                    <div className="flex gap-1 lg:gap-2">
                        <button
                            onClick={() => navigate(`/admin/managers/${row.id}/edit`)}
                            className="bg-primary text-white p-1.5 lg:p-2 rounded-lg"
                            title="تعديل"
                        >
                            <PencilIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                        <button
                            onClick={() => handleDeleteOne(row)}
                            className="bg-red-100 text-red-600 p-1.5 lg:p-2 rounded-lg"
                            title="حذف"
                        >
                            <TrashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}

