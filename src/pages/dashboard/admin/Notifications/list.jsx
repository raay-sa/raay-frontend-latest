// src/pages/dashboard/admin/Notifications/list.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../../hooks/useNotifications';
import StatsCard from '../../../../components/StatsCard';
import FilterPanel from '../../../../components/Filter';
import DataTable from '../../../../components/DataTable';
import { NotificationsService } from '../../../../services/notificationsService';
import toast from 'react-hot-toast';

import {
  BellIcon,
  BellSlashIcon,
  BellSnoozeIcon,
  PlusIcon,
  TrashIcon,

  
} from '@heroicons/react/24/outline';
import PageSkeleton from '../../../../components/Loaders/PageSkeleton';

export default function NotificationsList() {
  const navigate = useNavigate();
  const {
    notifications,
    meta,
    isLoading,
    onPageChange,
    filters,
    onFiltersChange,
    search,
    onSearchChange,
    reload, // NEW: refetch after delete
  } = useNotifications();

  // force remount table to clear selections after delete
  const [tableKey, setTableKey] = useState(0);

  // ── 1) Stats
  const unsentCount = notifications.filter(n => n.status === 'غير مرسل').length;
  const scheduledCount = notifications.filter(n => n.status === 'مجدول').length;
  const sentCount = notifications.filter(n => n.status === 'تم الإرسال').length;

  // ── 2) Filters & search (unchanged UI)
  const filterGroups = [
    {
      key: 'type',
      label: 'نوع الإشعار',
      type: 'radio',
      options: [
        { label: 'الكل', value: 'all' },
        { label: 'تنبيه', value: 'تنبيه' },
        { label: 'عرض', value: 'عرض' },
        { label: 'اشعار', value: 'اشعار' },
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
    }
  ];

  // ── 3) Apply ONLY status locally (type/target/search already on server)
  const filtered = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    let d = notifications.filter(Boolean);

    if (filters.status !== 'all') {
      d = d.filter(n => n?.status === filters.status);
    }
    return d;
  }, [notifications, filters.status]);

  // ── 4) Table columns
  const columns = [
    { header: '#', accessor: 'id' },
    { header: 'نوع الإشعار', accessor: 'type' },
    { header: 'عنوان الإشعار', accessor: 'title' },
    { header: 'المحتوى', accessor: 'content' },
    { header: 'الفئة المستهدفة', accessor: 'target' },
    { header: 'التاريخ', accessor: 'date' },
  ];

  // Row click → edit
  const handleRowClick = (row) => navigate(`/admin/notifications/${row.id}/edit`);

  // Top add button
  const handleAdd = () => navigate('/admin/notifications/create');

  // ── Bulk delete
  const handleBulkDelete = async (ids = []) => {
    if (!ids.length) return;
    const ok = window.confirm(`هل تريد حذف ${ids.length} عنصرًا؟`);
    if (!ok) return;

    try {
      await NotificationsService.bulkDelete(ids);
      toast.success('تم حذف الإشعارات المحددة');
      await reload();        // refetch current page
      setTableKey(k => k + 1); // reset table selection by remount
    } catch (e) {
      console.error(e);
      toast.error('فشل حذف الإشعارات');
    }
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      {/* page title */}
      <h2 className="text-xl lg:text-2xl font-bold">العروض والإشعارات</h2>

      {/* 1) stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard
          value={unsentCount}
          label="الإشعارات غير مرسلة"
          Icon={BellSlashIcon}
          trend="0.43%"
          up={false}
        />
        <StatsCard
          value={scheduledCount}
          label="الإشعارات المجدولة"
          Icon={BellSnoozeIcon}
          trend="0.43%"
          up={true}
        />
        <StatsCard
          value={sentCount}
          label="الإشعارات المرسلة"
          Icon={BellIcon}
          trend="0.43%"
          up={true}
        />
      </div>

      {/* top actions + filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <FilterPanel
          filterGroups={filterGroups}
          filters={filters}
          onFiltersChange={onFiltersChange}
          searchText={search}
          onSearchChange={onSearchChange}
        />

        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 text-sm sm:text-base"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" /> إضافة إشعار
          </button>
        </div>
      </div>

      {/* 3) data table */}
      <DataTable
        key={tableKey}
        data={filtered}
        columns={columns}
        pageSizeOptions={[5, 10, 20]}
        bulkActions={selected => (
          <div className="flex items-center gap-4">
            <span>{selected.length} محدد</span>
            <button
              onClick={() => handleBulkDelete(selected)}
              className="p-2 bg-grey text-text_grey rounded"
              title="حذف المحدد"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        serverPagination={{
          currentPage: meta?.currentPage || 1,
          totalPages: meta?.lastPage || 1,
          total: meta?.total || 0,
          onPageChange,
        }}
        onPageChange={onPageChange}
        loading={isLoading}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
