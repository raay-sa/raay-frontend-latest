import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon, PencilIcon, EyeIcon, UsersIcon } from '@heroicons/react/24/outline';
import DataTable from '../../../../components/DataTable';
import Filter from '../../../../components/Filter';
import StatsCard from '../../../../components/StatsCard';
import useBanners from '../../../../hooks/useBanners';
import { toast } from 'react-hot-toast';
import PageSkeleton from '../../../../components/Loaders/PageSkeleton';

export default function AdminBannersList() {
  const navigate = useNavigate();
  
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ filter: 'all' });
  
  const {
    banners,
    loading,
    meta,
    stats,
    deleteBanner: deleteBannerHook,
    setPage,
  } = useBanners(1, filters, searchInput);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 450);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Remove old fetchBanners function - now handled by useBanners hook

  const handleDelete = async (row) => {
    try {
      const success = await deleteBannerHook(row.id);
      if (success) {
        toast.success('تم حذف البانر بنجاح');
      } else {
        toast.error('تعذر حذف البانر');
      }
    } catch (e) {
      toast.error('تعذر حذف البانر');
      console.error(e);
    }
  };

  const handleViewInterestedStudents = (bannerId) => {
    navigate(`/admin/banners/${bannerId}/interested-students`);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/images/empty.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `${import.meta.env.VITE_BASE_URL || ''}/${imagePath}`;
  };

  const rows = useMemo(() => {
    return banners.map(banner => ({
      id: banner.id,
      image: banner.image,
      title: banner.title,
      description: banner.description,
      interested_students_count: banner.interests?.length || 0,
      min_students: banner.min_students || 0,
      is_active: banner.status === 'active',
      created_at: banner.created_at,
      progress_percentage: Math.min(
        ((banner.interests?.length || 0) / (banner.min_students || 1)) * 100,
        100
      )
    }));
  }, [banners]);

  const filterGroups = [
    {
      key: 'filter',
      label: 'الترتيب / الحالة',
      type: 'radio',
      options: [
        { label: 'الكل', value: 'all' },
        { label: 'نشط', value: 'active' },
        { label: 'غير نشط', value: 'inactive' },
        { label: 'الأحدث أولاً', value: 'latest' },
        { label: 'الأقدم أولاً', value: 'oldest' },
      ],
    },
  ];

  const columns = [
    { header: '#', accessor: 'id' },
    {
      header: 'صورة البانر',
      accessor: 'image',
      Cell: (img) => (
        <img
          src={getImageUrl(img)}
          alt=""
          className="w-12 h-12 rounded-lg object-cover"
        />
      ),
    },
    {
      header: 'عنوان البانر',
      accessor: 'title',
      Cell: (title, row) => (
        <div className="space-y-1">
          <div className="font-medium text-right">{title}</div>
          <div className="text-xs text-gray-500 line-clamp-1">{row.description}</div>
        </div>
      ),
    },
    {
      header: 'المهتمون',
      accessor: 'interested_students_count',
      Cell: (count, row) => (
        <div className="space-y-1">
          <div className="font-medium">{count}</div>
          <div className="text-xs text-gray-500">من {row.min_students}</div>
        </div>
      ),
    },
    {
      header: 'التقدم',
      accessor: 'progress_percentage',
      Cell: (percentage) => (
        <div className="w-20">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">{Math.round(percentage)}%</div>
        </div>
      ),
    },
    {
      header: 'الحالة',
      accessor: 'is_active',
      Cell: (isActive) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            isActive
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {isActive ? 'نشط' : 'غير نشط'}
        </span>
      ),
    },
    {
      header: 'تاريخ الإنشاء',
      accessor: 'created_at',
      Cell: (date) => new Date(date).toLocaleDateString('ar-SA'),
    },
  ];

  // Stats are now provided by the useBanners hook

  if (loading && banners.length === 0) return <PageSkeleton />;

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      <h1 className="text-xl lg:text-2xl font-bold">إدارة البانرات</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard
          value={stats.total_banners}
          label="إجمالي البانرات"
          Icon={PlusIcon}
          trend="0%"
          up={true}
        />
        <StatsCard
          value={stats.active_banners}
          label="البانرات النشطة"
          Icon={EyeIcon}
          trend="0%"
          up={true}
        />
        <StatsCard
          value={stats.total_interested}
          label="إجمالي المهتمين"
          Icon={UsersIcon}
          trend="0%"
          up={true}
        />
        <StatsCard
          value={stats.ready_to_start}
          label="جاهز للبدء"
          Icon={PencilIcon}
          trend="0%"
          up={true}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Filter
          filterGroups={filterGroups}
          filters={filters}
          onFiltersChange={setFilters}
          searchText={searchInput}
          onSearchChange={setSearchInput}
        />

        <div className="flex flex-row w-1/5 items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/admin/banners/create")}
            className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base text-center"
          >
            + إضافة بانر
          </button>
        </div>
      </div>

      <DataTable
        data={rows}
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
        renderRowActions={(row) => (
          <div className="flex gap-2">
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                handleViewInterestedStudents(row.id); 
              }}
              className="bg-blue-100 text-blue-600 p-2 rounded-lg"
              title="عرض المهتمين"
            >
              <UsersIcon className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                navigate(`/admin/banners/${row.id}/edit`); 
              }}
              className="bg-primary text-white p-2 rounded-lg"
              title="تعديل"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm('هل تريد حذف هذا البانر؟')) {
                  await handleDelete(row);
                }
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