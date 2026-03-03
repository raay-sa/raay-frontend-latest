// src/pages/dashboard/admin/Categories/List.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../../components/DataTable";
import Filter from "../../../../components/Filter";
import { CategoriesService } from "../../../../services/categoriesService";
import useCategories from "../../../../hooks/useCategories";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import { toast } from "react-hot-toast";
import { processCategoriesList, getCategoryImage } from "../../../../utils/index";

export default function CategoriesList() {
    const navigate = useNavigate();

    // filters & debounced search like other modules
    const [filters, setFilters] = useState({
        filter: "all", // all | name | latest | oldest
    });
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        const id = setTimeout(() => setSearch(searchInput), 450);
        return () => clearTimeout(id);
    }, [searchInput]);

    const { items: rawItems, meta, loading, setPage, refetch } = useCategories(1, filters, search);
    
    // Process items to extract category names from translations
    const items = useMemo(() => processCategoriesList(rawItems), [rawItems]);

    const handleDeleteOne = async (row) => {
        try {
            await CategoriesService.delete(row.id);
            toast.success("تم حذف التخصص");
            await refetch();
        } catch (e) {
            toast.error("تعذر حذف التخصص");
            console.error(e);
        }
    };

    const handleBulkDelete = async (selected) => {
        if (!selected?.length) return;
        try {
            await CategoriesService.bulkDelete(selected);
            toast.success("تم حذف التخصصات المحددة");
            await refetch();
        } catch (e) {
            toast.error("تعذر حذف التخصصات المحددة");
            console.error(e);
        }
    };

    const columns = useMemo(() => [
        { header: "#", accessor: "id" },
        {
            header: "الصورة",
            accessor: "image",
            Cell: (img, row) => {
                // Use the processed image from processCategoriesList (which defaults to Arabic image)
                const imagePath = row.image || img;
                return (
                    <img
                        src={imagePath ? `${import.meta.env.VITE_BASE_URL}/${imagePath}` : "/no-image.png"}
                        className="w-12 h-12 rounded object-cover bg-gray-100"
                        alt=""
                    />
                );
            },
        },
        { 
            header: "اسم التخصص", 
            accessor: "title",
            Cell: (value, row) => (
                <div className="space-y-1">
                    <div className="font-medium">{row.title_ar || value}</div>
                    {row.title_en && (
                        <div className="text-sm text-gray-500">{row.title_en}</div>
                    )}
                </div>
            )
        },
        {
            header: "تاريخ الإضافة", accessor: "created_at",
            Cell: (v) => new Date(v).toLocaleDateString("ar-EG"),
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
                <h1 className="text-xl lg:text-2xl font-bold">إدارة التخصصات</h1>
                <button
                    onClick={() => navigate("/admin/categories/create")}
                    className="bg-primary text-white px-4 py-2 rounded-lg inline-flex items-center gap-1 text-sm lg:text-base w-full sm:w-auto"
                >
                    <PlusIcon className="w-4 h-4 lg:w-5 lg:h-5" /> إضافة تخصص
                </button>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <Filter
                    filterGroups={filterGroups}
                    filters={filters}
                    onFiltersChange={setFilters}
                    searchText={searchInput}
                    onSearchChange={setSearchInput}
                />
            </div>

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
                            onClick={() => navigate(`/admin/categories/${row.id}/edit`)}
                            className="bg-primary text-white p-1.5 lg:p-2 rounded-lg"
                        >
                            <PencilIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                        <button
                            onClick={() => handleDeleteOne(row)}
                            className="bg-red-100 text-red-600 p-1.5 lg:p-2 rounded-lg"
                        >
                            <TrashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                        </button>
                    </div>
                )}
                bulkActions={(selected) => (
                    <div className="flex items-center gap-4">
                        <span>{selected.length} محدد</span>
                        <button
                            onClick={() => handleBulkDelete(selected)}
                            className="p-2 bg-red-100 text-red-600 rounded"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            />
        </div>
    );
}
