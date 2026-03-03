// src/pages/dashboard/admin/Skills/List.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterPanel from "../../../../components/Filter";
import DataTable from "../../../../components/DataTable";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import useSkills from "../../../../hooks/useSkills";
import { SkillsService } from "../../../../services/skillsService";
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon } from "@heroicons/react/24/outline";

export default function SkillsList() {
    const navigate = useNavigate();

    // Filters + debounced search
    const [filters, setFilters] = useState({ filter: "latest" });
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        const id = setTimeout(() => setSearch(searchInput), 450);
        return () => clearTimeout(id);
    }, [searchInput]);

    const { data, meta, loading, setPage, refetch } = useSkills({ filters, search });

    const columns = useMemo(
        () => [
            { header: "#", accessor: "id" },
            { header: "السؤال", accessor: "question" },
            { header: "التخصص", accessor: "category", Cell: (c) => c?.title || "—" },
        ],
        []
    );

    const filterGroups = useMemo(
        () => [
            {
                key: "filter",
                label: "الترتيب",
                type: "radio",
                options: [
                    { value: "latest", label: "الأحدث أولاً" },
                    { value: "oldest", label: "الأقدم أولاً" },
                    { value: "name", label: "الاسم" },
                ],
            },
        ],
        []
    );

    const handleDelete = async (row) => {
        if (!window.confirm("حذف هذا السؤال؟")) return;
        try {
            await SkillsService.delete(row.id);
            await refetch();
        } catch (e) {
            console.error("delete failed", e);
        }
    };

    if (loading) return <PageSkeleton />;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">المهارات</h2>
                <button
                    onClick={() => navigate("/admin/skills/create")}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" /> إضافة مهارة
                </button>
            </div>

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
                onRowClick={(row) => navigate(`/admin/skills/${row.id}`)}
                serverPagination={{
                    currentPage: meta.current_page,
                    totalPages: meta.last_page,
                    onPageChange: setPage,
                }}
                renderRowActions={(row) => (
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/skills/${row.id}`); }}
                            className="bg-primary text-white p-2 rounded-lg"
                            title="عرض"
                        >
                            <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/skills/${row.id}/edit`); }}
                            className="bg-secondary text-white p-2 rounded-lg"
                            title="تعديل"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
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
