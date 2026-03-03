// src/pages/dashboard/admin/ProgramsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  ChartBarIcon,
  PlayIcon,
  DocumentTextIcon,
  TrashIcon,
  CloudArrowDownIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import Filter from '../../../../components/Filter';
import DataTable from '../../../../components/DataTable';
import StatsCard from '../../../../components/StatsCard';
import usePrograms from '../../../../hooks/usePrograms';
import moment from 'moment-hijri';
import { ProgramsService } from '../../../../services/programsService';
import { toast } from 'react-hot-toast';

export default function ProgramsList() {
  const navigate = useNavigate();

  const {
    programs,
    loading,
    pagination,
    filters,
    setFilters,
    setPage,
    stats,
    refetch,
  } = usePrograms(1, {
    filter: 'all',      // name | oldest | latest | active_status | deleted_status | live_type | registered_type
    score: 0,
    price_from: 0,
    price_to: 9000,
    search: '',
  });

  // local search input state with debounce (kept)
  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchText }));
      setPage(1);
    }, 450);
    return () => clearTimeout(id);
  }, [searchText, setFilters, setPage]);

  const rows = useMemo(() => {
    return (programs || []).map(p => ({
      id: p.id,
      image: '/' + p.image,
      programName: p.title,
      transaction_number: p.transaction_number,
      expertName: p.teacher?.name,
      subscriptions_count: p.subscriptions_count ?? 0,
      description: p.description,
      price: p.price,
      type: p.type,
      rating: p.score ?? 0,
      status: p.status,
      date: moment(p.created_at).format('YYYY/MM/DD'),
    }));
  }, [programs]);

  const handleDownload = async () => {
    try {
      const response = await ProgramsService.export();
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  const handleDelete = async (row) => {
    try {
      await ProgramsService.remove(row.id);
      toast.success('تم حذف البرنامج');
      await refetch();
    } catch (e) {
      toast.error('تعذر حذف البرنامج');
      console.error(e);
    }
  };

  // Filter groups
  const filterGroups = [
    {
      key: 'filter',
      label: 'الترتيب / الحالة',
      type: 'radio',
      options: [
        { label: 'الكل', value: 'all' },
        { label: 'الاسم', value: 'name' },
        { label: 'الأحدث أولاً', value: 'latest' },
        { label: 'الأقدم أولاً', value: 'oldest' },
        { label: 'نشط', value: 'active_status' },
        { label: 'جاري البث', value: 'live_type' },
        { label: 'مسجل', value: 'registered_type' },
        { label: 'حضوري', value: 'onsite_type' },
        { label: 'محذوف', value: 'deleted_status' },
      ],
    },
    {
      key: 'score',
      label: 'التقييم',
      type: 'stars',
      options: [{ value: 5 }, { value: 4 }, { value: 3 }, { value: 2 }, { value: 1 }],
    },
    {
      key: 'price',
      label: 'السعر',
      type: 'range',
      range: { min: 0, max: 9000, step: 10 },
    },
  ];

  const columns = [
    { header: '#', accessor: 'id' },
    {
      header: 'صورة البرنامج',
      accessor: 'image',
      Cell: (img) => (
        <img
          src={`${import.meta.env.VITE_BASE_URL}${img}`}
          alt=""
          className="w-12 h-12 rounded-lg object-cover"
        />
      ),
    },
    {
      header: 'اسم البرنامج',
      accessor: 'programName',
      Cell: (name, row) => (
        <button
          onClick={() => navigate(`/admin/programs/${row.id}/report`)}
          className="text-primary hover:underline font-medium text-right"
        >
          {name}
        </button>
      ),
    },
    { 
      header: 'رقم المعاملة', 
      accessor: 'transaction_number',
      Cell: (tn) => tn || '-',
    },
    { 
      header: 'النوع', 
      accessor: 'type',
      Cell: (type) => {
        const typeTranslations = {
          'live': 'مباشر',
          'registered': 'مسجل', 
          'onsite': 'حضوري'
        };
        return typeTranslations[type] || type;
      }
    },
    { header: 'اسم الخبير', accessor: 'expertName' },
    {
      header: 'عدد المتدربين',
      accessor: 'subscriptions_count',
      Cell: (count, row) => (
        <button
          onClick={() => navigate(`/admin/programs/${row.id}/students`)}
          className="text-primary hover:underline font-medium"
        >
          {count}
        </button>
      ),
    },
    {
      header: 'السعر',
      accessor: 'price',
      Cell: p => `${p} ر.س`,
    },
    {
      header: 'الحالة',
      accessor: 'status',
      Cell: s => {        
        const statusValue = parseInt(s);
        const statusText = statusValue === 1 ? 'نشط' : 'غير نشط';
        const isActive = statusValue === 1;
        
        return (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              isActive
                ? 'bg-green-100 text-green-600'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {statusText}
          </span>
        );
      },
    },
    { header: 'التاريخ', accessor: 'date' },
  ];

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      <h1 className="text-xl lg:text-2xl font-bold">إدارة البرامج التدريبية</h1>

      {/* Stats from API */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard
          value={stats.total_count}
          label="إجمالي البرامج"
          Icon={ChartBarIcon}
          trend={`${Math.round(stats.total_program_percentage ?? 0)}%`}
          up={stats.total_program_status === 'increase'}
        />
        <StatsCard
          value={stats.live_programs_count}
          label="البرامج المباشرة"
          Icon={PlayIcon}
          trend={`${Math.round(stats.total_live_program_percentage ?? 0)}%`}
          up={stats.total_live_program_status === 'increase'}
        />
        <StatsCard
          value={stats.registered_programs_count}
          label="البرامج المسجلة"
          Icon={DocumentTextIcon}
          trend={`${Math.round(stats.total_registered_program_percentage ?? 0)}%`}
          up={stats.total_registered_program_status === 'increase'}
        />
        <StatsCard
          value={stats.deleted_programs_count}
          label="البرامج المحذوفة"
          Icon={TrashIcon}
          trend={`${Math.round(stats.total_deleted_program_percentage ?? 0)}%`}
          up={stats.total_deleted_program_status === 'increase'}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Filter
          filterGroups={filterGroups}
          filters={{
            ...filters,
            price: [filters.price_from ?? 0, filters.price_to ?? 9000],
          }}
          onFiltersChange={(next) => {
            setFilters(prev => ({
              ...prev,
              ...next,
              price_from: Array.isArray(next.price) ? next.price[0] : prev.price_from,
              price_to: Array.isArray(next.price) ? next.price[1] : prev.price_to,
            }));
            setPage(1);
          }}
          searchText={searchText}
          onSearchChange={setSearchText}
        />

        <div className="flex flex-row w-1/5 items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/admin/programs/create")}
            className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base text-center"
          >
            + إضافة
          </button>
          <button
            onClick={handleDownload}
            className="bg-secondary text-white px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base"
          >
            تحميل
          </button>
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        pageSizeOptions={[10]}
        loading={loading}
        selectable={false}     // keep selection off
        showActions={true}     // show actions column
        serverPagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          onPageChange: setPage,
        }}
        renderRowActions={(row) => (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/admin/programs/${row.id}/edit`); }}
              className="bg-primary text-white p-2 rounded-lg"
              title="تعديل"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (confirm('هل تريد حذف هذا البرنامج؟')) {
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
