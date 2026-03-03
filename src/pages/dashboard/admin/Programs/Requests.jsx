import React, { useState, useMemo, useEffect } from 'react';
import {
  ChartBarIcon,
  PlayIcon,
  DocumentTextIcon,
  TrashIcon,
  CheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Filter from '../../../../components/Filter';
import DataTable from '../../../../components/DataTable';
import StatsCard from '../../../../components/StatsCard';
import moment from 'moment-hijri';
import { ProgramsService } from '../../../../services/programsService';
import { toast } from 'react-hot-toast';

export default function ProgramRequests() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    filter: 'all',
    search: '',
  });

  // local search input state with debounce
  const [searchText, setSearchText] = useState('');
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchText }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 450);
    return () => clearTimeout(id);
  }, [searchText]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await ProgramsService.getRequests(pagination.currentPage, filters);
      const responseData = response.data;
      
      if (responseData.success) {
        setData(responseData.data.data || []);
        setStats({
          total_count: responseData.total_count,
          total_program_percentage: responseData.total_program_percentage,
          total_program_status: responseData.total_program_status,
          live_programs_count: responseData.live_programs_count,
          total_live_program_percentage: responseData.total_live_program_percentage,
          total_live_program_status: responseData.total_live_program_status,
          registered_programs_count: responseData.registered_programs_count,
          total_registered_program_percentage: responseData.total_registered_program_percentage,
          total_registered_program_status: responseData.total_registered_program_status,
          deleted_programs_count: responseData.deleted_programs_count,
          total_deleted_program_percentage: responseData.total_deleted_program_percentage,
          total_deleted_program_status: responseData.total_deleted_program_status,
        });
        setPagination(prev => ({
          ...prev,
          currentPage: responseData.data.current_page,
          totalPages: responseData.data.last_page,
          total: responseData.data.total,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch program requests:', error);
      toast.error('تعذر تحميل طلبات البرامج');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    return (data || []).map(p => {
      const arTranslation = p.translations?.find(t => t.locale === 'ar');
      const enTranslation = p.translations?.find(t => t.locale === 'en');
      const title = arTranslation?.title || enTranslation?.title || 'بدون عنوان';
      
      return {
        id: p.id,
        image: p.image,
        programName: title,
        teacherName: p.teacher?.name || 'غير محدد',
        category: p.category?.translations?.find(t => t.locale === 'ar')?.title || 
                 p.category?.translations?.find(t => t.locale === 'en')?.title || 'غير محدد',
        price: p.price,
        type: p.type === 'live' ? 'مباشر' : 'مسجل',
        status: p.is_approved ? 'معتمد' : 'في الانتظار',
        date: moment(p.created_at).format('YYYY/MM/DD'),
        is_approved: p.is_approved,
        rawData: p,
      };
    });
  }, [data]);

  const handleApprove = async (selectedIds) => {
    if (selectedIds.length === 0) {
      toast.error('يرجى اختيار برنامج واحد على الأقل');
      return;
    }

    // Filter to only include non-approved programs
    const pendingIds = selectedIds.filter(id => {
      const program = data.find(p => p.id === id);
      return program && !program.is_approved;
    });

    if (pendingIds.length === 0) {
      toast.error('لا توجد برامج في الانتظار للاعتماد');
      return;
    }
    
    try {
      await ProgramsService.approveRequests(pendingIds);
      toast.success(`تم اعتماد ${pendingIds.length} برنامج بنجاح`);
      await fetchData();
    } catch (error) {
      console.error('Failed to approve programs:', error);
      toast.error('تعذر اعتماد البرامج');
    }
  };

  const handleViewDetails = (row) => {
    navigate(`/admin/programs/requests/${row.id}`);
  };

  // Filter groups
  const filterGroups = [
    {
      key: 'filter',
      label: 'الترتيب / الحالة',
      type: 'radio',
      options: [
        { label: 'الكل', value: 'all' },
        { label: 'في الانتظار', value: 'pending' },
        { label: 'معتمد', value: 'approved' },
        { label: 'مباشر', value: 'live' },
        { label: 'مسجل', value: 'registered' },
      ],
    },
  ];

  const columns = [
    { header: '#', accessor: 'id' },
    {
      header: 'صورة البرنامج',
      accessor: 'image',
      Cell: (img) => (
        <img
          src={`${import.meta.env.VITE_BASE_URL}/${img}`}
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
          onClick={() => handleViewDetails(row)}
          className="text-primary hover:underline font-medium text-right"
        >
          {name}
        </button>
      ),
    },
    { header: 'اسم المدرب', accessor: 'teacherName' },
    { header: 'التخصص', accessor: 'category' },
    {
      header: 'السعر',
      accessor: 'price',
      Cell: p => `${p} ر.س`,
    },
    {
      header: 'النوع',
      accessor: 'type',
      Cell: type => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            type === 'مباشر'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-green-100 text-green-600'
          }`}
        >
          {type}
        </span>
      ),
    },
    {
      header: 'الحالة',
      accessor: 'status',
      Cell: status => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            status === 'معتمد'
              ? 'bg-green-100 text-green-600'
              : 'bg-yellow-100 text-yellow-600'
          }`}
        >
          {status}
        </span>
      ),
    },
    { header: 'تاريخ الطلب', accessor: 'date' },
  ];

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      <h1 className="text-xl lg:text-2xl font-bold">طلبات البرامج التدريبية</h1>

      {/* Stats from API */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard
          value={stats.total_count || 0}
          label="إجمالي الطلبات"
          Icon={ChartBarIcon}
          trend={`${Math.round(stats.total_program_percentage || 0)}%`}
          up={stats.total_program_status === 'increase'}
        />
        <StatsCard
          value={stats.live_programs_count || 0}
          label="البرامج المباشرة"
          Icon={PlayIcon}
          trend={`${Math.round(stats.total_live_program_percentage || 0)}%`}
          up={stats.total_live_program_status === 'increase'}
        />
        <StatsCard
          value={stats.registered_programs_count || 0}
          label="البرامج المسجلة"
          Icon={DocumentTextIcon}
          trend={`${Math.round(stats.total_registered_program_percentage || 0)}%`}
          up={stats.total_registered_program_status === 'increase'}
        />
        <StatsCard
          value={stats.deleted_programs_count || 0}
          label="البرامج المحذوفة"
          Icon={TrashIcon}
          trend={`${Math.round(stats.total_deleted_program_percentage || 0)}%`}
          up={stats.total_deleted_program_status === 'increase'}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Filter
          filterGroups={filterGroups}
          filters={filters}
          onFiltersChange={(next) => {
            setFilters(prev => ({ ...prev, ...next }));
            setPagination(prev => ({ ...prev, currentPage: 1 }));
          }}
          searchText={searchText}
          onSearchChange={setSearchText}
        />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        pageSizeOptions={[10]}
        loading={loading}
        selectable={true}
        showActions={true}
        serverPagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          onPageChange: (page) => setPagination(prev => ({ ...prev, currentPage: page })),
        }}
        renderRowActions={(row) => (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(row);
              }}
              className="bg-blue-100 text-blue-600 p-2 rounded-lg"
              title="عرض التفاصيل"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
            {!row.is_approved && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('هل تريد اعتماد هذا البرنامج؟')) {
                    await handleApprove([row.id]);
                  }
                }}
                className="bg-green-100 text-green-600 p-2 rounded-lg"
                title="اعتماد البرنامج"
              >
                <CheckIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        bulkActions={(selected) => {
          // Filter to only show pending programs
          const pendingIds = selected.filter(id => {
            const program = data.find(p => p.id === id);
            return program && !program.is_approved;
          });
          
          if (pendingIds.length === 0) {
            return null;
          }
          
          return (
            <div className="flex items-center gap-4">
              <span>{pendingIds.length} محدد للاعتماد</span>
              <button
                onClick={() => handleApprove(selected)}
                className="p-2 bg-green-100 text-green-600 rounded"
                title="اعتماد المحدد"
              >
                <CheckIcon className="w-5 h-5" />
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}
