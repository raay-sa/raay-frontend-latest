// src/pages/dashboard/admin/Workshops/List.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Filter from "../../../../components/Filter";
import DataTable from "../../../../components/DataTable";
import useWorkshops from "../../../../hooks/useWorkshops";
import { WorkshopsService } from "../../../../services/workshopsService";
import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function WorkshopsList() {
  const navigate = useNavigate();

  // match programs list shape
  const [filters, setFilters] = useState({ status: "" });
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchText), 450);
    return () => clearTimeout(id);
  }, [searchText]);

  const { data, meta, loading, setPage, refetch } = useWorkshops({ status: filters.status, search });

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
      { header: "الاسم الكامل", accessor: "full_name" },
      { header: "البريد الإلكتروني", accessor: "email" },
      { header: "رقم الجوال", accessor: "phone" },
      { header: "عنوان الورشة", accessor: "workshop_title" },
      {
        header: "الحالة",
        accessor: "status",
        Cell: (s) => (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              String(s) === "approved"
                ? "bg-green-100 text-green-600"
                : String(s) === "rejected"
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {String(s) === "approved"
              ? "مقبول"
              : String(s) === "rejected"
              ? "مرفوض"
              : "قيد المراجعة"}
          </span>
        ),
      },
      { header: "التاريخ", accessor: "created_at", Cell: (v) => fmt(v) },
    ],
    []
  );

  const filterGroups = useMemo(
    () => [
      {
        key: "status",
        label: "الترتيب / الحالة",
        type: "radio",
        options: [
          { label: "الكل", value: "" },
          { label: "قيد المراجعة", value: "pending" },
          { label: "مقبول", value: "approved" },
          { label: "مرفوض", value: "rejected" },
        ],
      },
    ],
    []
  );

  const handleDelete = async (row) => {
    if (!window.confirm("هل تريد حذف هذا الطلب؟")) return;
    try {
      await WorkshopsService.delete(row.id);
      await refetch();
    } catch (e) {
      console.error("delete failed", e);
    }
  };

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      <h1 className="text-xl lg:text-2xl font-bold">إدارة ورش العمل</h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Filter
          filterGroups={filterGroups}
          filters={filters}
          onFiltersChange={(next) => {
            setFilters((prev) => ({ ...prev, ...next }));
            setPage(1);
          }}
          searchText={searchText}
          onSearchChange={setSearchText}
        />

        <div className="flex flex-row w-1/5 items-stretch sm:items-center gap-2 sm:gap-3">
          {/* reserved for future actions (export/create) */}
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        pageSizeOptions={[10]}
        loading={loading}
        selectable={false}
        showActions={true}
        serverPagination={{
          currentPage: meta.current_page,
          totalPages: meta.last_page,
          onPageChange: setPage,
        }}
        onRowClick={(row) => navigate(`/admin/workshops/${row.id}`)}
        renderRowActions={(row) => (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/admin/workshops/${row.id}`); }}
              className="bg-primary text-white p-2 rounded-lg"
              title="عرض"
            >
              <EyeIcon className="w-5 h-5" />
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
        bulkActions={() => null}
      />
    </div>
  );
}


