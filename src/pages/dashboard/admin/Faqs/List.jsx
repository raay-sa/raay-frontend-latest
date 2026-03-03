// src/pages/dashboard/admin/FAQs/list.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline';
import PageSkeleton from '../../../../components/Loaders/PageSkeleton';
import { useFaqs } from '../../../../hooks/useFaqs';
import { FaqsService } from '../../../../services/faqsService';
import Filter from '../../../../components/Filter';
import DataTable from '../../../../components/DataTable';

export default function FaqsList() {
  const navigate = useNavigate();

  // Hook handles fetching, server pagination, filters, search
  const {
    data: faqs,
    meta,
    loading,
    setPage,
    filters,
    setFilters,
    search,
    setSearch,
    reload,
  } = useFaqs();

  const [actionLoading, setActionLoading] = useState(false);

  // filters - search (UI)
  const filterGroups = [
    {
      key: 'sort',
      label: 'الترتيب حسب',
      type: 'radio',
      options: [
        { label: 'الكل', value: 'all' },
        { label: 'الاسم', value: 'name' },
        { label: 'الأحدث أولاً', value: 'latest' },
        { label: 'الأقدم أولاً', value: 'oldest' },
      ],
    },
    {
      key: 'target',
      label: 'الفئة المستهدفة',
      type: 'radio',
      options: [
        { label: 'الكل', value: 'all' },
        { label: 'متدرب', value: 'متدرب' },
        { label: 'خبير', value: 'خبير' },
      ],
    },
  ];

  // Server already returns filtered data.
  const filtered = useMemo(() => (Array.isArray(faqs) ? faqs : []), [faqs]);

  // columns
const columns = [
    { header: '#', accessor: 'id' },
    { header: 'عنوان السؤال', accessor: 'question' },
    { header: 'المحتوى', accessor: 'content' },
    {
        header: 'الحاله',
        accessor: 'status',
    },
    { header: 'الفئة المستهدفة', accessor: 'target' },
];

  // handlers
  const handleAdd = () => navigate('/admin/faqs/create');
  const handleEdit = row => navigate(`/admin/faqs/${row.id}/edit`);

  const handleToggleVisibility = async (ids = []) => {
    if (!ids || ids.length === 0) return;
    try {
      setActionLoading(true);
      await FaqsService.multiHide(ids);
      await reload();
    } catch (e) {
      console.error('Failed to toggle visibility:', e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && (!meta || meta.currentPage === 1) && filtered.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h2 className="text-2xl font-bold">الأسئلة الشائعة</h2>

      {/* top-bar: filter + actions */}
      <div className="flex justify-between items-center">
        <Filter
          filterGroups={filterGroups}
          filters={filters}
          onFiltersChange={setFilters}
          searchText={search}
          onSearchChange={setSearch}
        />

        <div className="flex gap-2">
          <button
            onClick={() => reload()}
            className="bg-[#AD8B5E] text-white px-4 py-2 rounded-lg flex items-center gap-1"
            disabled={actionLoading}
            title="تحديث"
          >
            <CloudArrowDownIcon className="w-5 h-5" />
            تحديث
          </button>

          <button
            onClick={handleAdd}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-1"
          >
            <PlusIcon className="w-5 h-5" />
            إضافة سؤال
          </button>
        </div>
      </div>

      {/* data-table */}
      <DataTable
        data={filtered}
        columns={columns}
        pageSizeOptions={[5]} // server pagination
        loading={loading || actionLoading}
        renderRowActions={(row) => (
          <div className="flex gap-1">
            {/* Eye → toggle status for a single FAQ */}
            <button
              className="bg-grey rounded-lg px-1 py-1 disabled:opacity-60"
              title="تبديل الحالة"
              onClick={() => handleToggleVisibility([row.id])}
              disabled={actionLoading}
            >
              <EyeIcon className="w-5 h-5 text-text_grey" />
            </button>
            <button
              onClick={() => handleEdit(row)}
              className="bg-primary rounded-lg px-1 py-1"
              title="تعديل"
            >
              <PencilIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
        bulkActions={(selected) => (
          <div className="flex items-center gap-4">
            <span>{selected.length} محدد</span>
            <button className="px-1 py-1 bg-grey rounded-lg" title="حذف" disabled>
              <TrashIcon className="w-5 h-5 text-text_grey" />
            </button>
            {/* Eye → toggle status for selected FAQs */}
            <button
              className="bg-primary rounded-lg px-1 py-1 disabled:opacity-60"
              title="تبديل حالة المحدد"
              onClick={() => handleToggleVisibility(selected)}
              disabled={selected.length === 0 || actionLoading}
            >
              <EyeIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
        serverPagination={{
          currentPage: meta?.currentPage || 1,
          totalPages: meta?.lastPage || 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
