import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAccounts from '../../../../hooks/useAccounts';
import FilterPanel from '../../../../components/Filter';
import DataTable from '../../../../components/DataTable';
import StatsCard from '../../../../components/StatsCard';
import { AccountsService } from '../../../../services/accountsService';
import { processCategoriesList } from '../../../../utils/index';
import {
  PlusIcon,
  CloudArrowDownIcon,
  TrashIcon,
  UserGroupIcon,
  IdentificationIcon,
  CurrencyRupeeIcon,
  PencilIcon,
  ArrowUpOnSquareIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { BiUserMinus } from 'react-icons/bi';
import PageSkeleton from '../../../../components/Loaders/PageSkeleton';

// ⬇️ official toast API
import { toast } from 'react-hot-toast';

export default function AccountsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trainees');
  const [filters, setFilters] = useState({
    filter: 'all',
    price: [0, 10000],
    category_id: null,
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 450);
    return () => clearTimeout(id);
  }, [searchInput]);

  const [categories, setCategories] = useState([]);

  const { data: rawData, meta, loading, setPage, totals, refetch } = useAccounts({ activeTab, filters, search });

  const handleAdd = () => {
    if (activeTab === 'trainees') navigate('/admin/students/create');
    else if (activeTab === 'experts') navigate('/admin/experts/create');
  };

  const handleDelete = async (row) => {
    try {
      if (activeTab === 'trainees') {
        await AccountsService.deleteStudent(row.id);
      } else if (activeTab === 'experts') {
        await AccountsService.deleteTeacher(row.id);
      }
      await refetch();
      toast.success('تم حذف السجل بنجاح.');
    } catch (e) {
      console.error('Delete failed', e);
      toast.error('تعذر حذف السجل. حاول مرة أخرى.');
    }
  };

  const handleEdit = (row) => {
    if (activeTab === 'trainees') navigate(`/admin/students/${row.id}/edit`);
    else if (activeTab === 'experts') navigate(`/admin/experts/${row.id}/edit`);
  };

  // ===== Export current list =====
  const handleDownload = async () => {
    try {
      let response;
      if (activeTab === 'trainees') {
        response = await AccountsService.exportStudents();
      } else if (activeTab === 'experts') {
        response = await AccountsService.exportTeachers();
      } else if (activeTab === 'transactions') {
        response = await AccountsService.exportTransactions();
      }
      openBlobInNewTab(response);
      toast.success('سيتم تنزيل الملف حالاً.');
    } catch (error) {
      console.error('Download failed', error);
      toast.error('تعذر تحميل الملف. حاول مرة أخرى.');
    }
  };

  // ===== Download Excel example/template =====
  const handleDownloadExample = async () => {
    if (activeTab === 'transactions') return;
    try {
      const response = activeTab === 'trainees'
        ? await AccountsService.getStudentExcelExample()
        : await AccountsService.getTeacherExcelExample();
      openBlobInNewTab(response, activeTab === 'trainees' ? 'students_template.xlsx' : 'teachers_template.xlsx');
      toast.success('تم تنزيل نموذج الإكسل بنجاح.');
    } catch (error) {
      console.error('Download example failed', error);
      toast.error('تعذر تحميل نموذج الإكسل. حاول مرة أخرى.');
    }
  };

  // ===== Import sheet via the same create endpoints =====
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const triggerImport = () => {
    if (activeTab === 'transactions') return;
    fileInputRef.current?.click();
  };

  const handleImportChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      let response;
      if (activeTab === 'trainees') {
        response = await AccountsService.importStudentsSheet(file, 'file'); // backend expects "file"
      } else {
        response = await AccountsService.importTeachersSheet(file, 'file');
      }

      const res = response?.data ?? {};
      const roleTitle = activeTab === 'trainees' ? 'المتدربين' : 'الخبراء';

      // support both misspelled & correct keys
      const failedList =
        res.faliled_students_list ??
        res.failed_students_list ??
        res.faliled_teachers_list ??
        res.failed_teachers_list ??
        [];

      const createdCount = Number(res.created_count ?? 0);
      const failedCount = Number(res.failed_count ?? failedList.length ?? 0);
      const reason = res.reason || (failedCount ? 'تم استبعاد بعض الصفوف.' : null);
      const baseMsg = res.message || (createdCount > 0 ? 'تم اضافة البيانات بنجاح' : 'تمت المعالجة');

      // nice compact custom toast with RTL/tailwind
      toast.custom((t) => (
        <div className={`rtl bg-white border rounded-xl p-3 shadow-md w-[360px] ${t.visible ? 'animate-in fade-in zoom-in' : 'animate-out fade-out zoom-out'}`}>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div className="flex-1">
              <div className="font-semibold">استيراد {roleTitle}</div>
              <div className="text-sm text-gray-700 mt-0.5">{baseMsg}</div>
              <div className="text-sm mt-1">
                تمت الإضافة: <b>{createdCount}</b> | تم الاستبعاد: <b>{failedCount}</b>
              </div>
              {reason ? <div className="text-xs text-gray-500 mt-1">{reason}</div> : null}
              {!!failedList?.length && (
                <div className="pt-2 text-xs">
                  <div className="font-medium">عينة من الصفوف المستبعدة:</div>
                  <ul className="list-disc pr-5 space-y-0.5 max-h-28 overflow-auto">
                    {failedList.slice(0, 5).map((it, idx) => (
                      <li key={idx} className="truncate">
                        {it?.name || 'بدون اسم'} — {it?.phone || 'بدون هاتف'} — {it?.email || 'بدون بريد'}
                      </li>
                    ))}
                    {failedList.length > 5 && (
                      <li>وعدد {failedList.length - 5} صفوف أخرى…</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              إغلاق
            </button>
          </div>
        </div>
      ));

      await refetch();
    } catch (error) {
      console.error('Import failed', error);
      toast.error('تعذر استيراد الملف. تأكد من صحة الصيغة ثم حاول مرة أخرى.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helpers
  const openBlobInNewTab = (response, fallbackName = 'download.xlsx') => {
    const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
    let filename = fallbackName;
    const cd = response.headers['content-disposition'];
    if (cd && typeof cd === 'string') {
      const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)/i);
      if (match && match[1]) filename = decodeURIComponent(match[1]);
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    AccountsService.fetchCategories().then(res => {
      if (res.data.success) {
        const categoriesData = res.data.data;
        // Process categories to extract titles from translations
        setCategories(processCategoriesList(categoriesData));
      }
    });
  }, []);

  const formatDate = (isoDate) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    if (isNaN(date)) return '-';
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const columns = useMemo(() => {
    if (activeTab === 'experts') {
      return [
        { header: '#', accessor: 'id' },
        { header: 'اسم الخبير', accessor: 'name' },
        {
          header: 'التخصص',
          accessor: 'categories',
          Cell: categories => categories?.map(c => c.title).join(', ') || '-',
        },
        { header: 'البريد الإلكتروني', accessor: 'email' },
        { header: 'رقم الاتصال', accessor: 'phone' },
        {
          header: 'الحالة',
          accessor: 'status',
          Cell: s => (
            <span className={`px-2 py-1 text-xs rounded-full ${s === 'active'
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-600'}`}>
              {s === 'active' ? 'نشط' : 'غير نشط'}
            </span>
          ),
        },
        { header: 'التاريخ', accessor: 'created_at', Cell: value => formatDate(value) },
      ];
    } else if (activeTab === 'trainees') {
      return [
        { header: '#', accessor: 'id' },
        { header: 'اسم المتدرب', accessor: 'name' },
        { header: 'رقم الاتصال', accessor: 'phone' },
        { header: 'البريد الإلكتروني', accessor: 'email' },
        { header: 'عدد البرامج', accessor: 'subscriptions_count' },
        { header: 'نسبة الإنجاز', accessor: 'progress' },
        {
          header: 'الحالة',
          accessor: 'status',
          Cell: s => (
            <span className={`px-2 py-1 text-xs rounded-full ${s === 'active'
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-600'}`}>
              {s === 'active' ? 'نشط' : 'غير نشط'}
            </span>
          ),
        },
        { header: 'التاريخ', accessor: 'created_at', Cell: value => formatDate(value) },
      ];
    } else {
      // TRANSACTIONS
      return [
        { header: '#', accessor: 'id' },
        {
          header: 'اسم الطالب',
          accessor: 'student_name',
          Cell: (_, row) => row?.student?.name ?? '-',
        },
        {
          header: 'البرنامج',
          accessor: 'program_titles',
          Cell: (_, row) =>
            Array.isArray(row?.programs) && row.programs.length
              ? row.programs.map(p => p.title).join(', ')
              : '-',
        },
        {
          header: 'القيمة',
          accessor: 'total_price',
          Cell: v => `${v} ر.س`,
        },
        {
          header: 'الحالة',
          accessor: 'status',
          Cell: s => {
            const ok = s === 'successful' || s === 'تم';
            return (
              <span className={`px-2 py-1 text-xs rounded-full ${ok
                ? 'bg-green-100 text-green-600'
                : 'bg-yellow-100 text-yellow-600'}`}>
                {ok ? 'مكتملة' : 'ملغية'}
              </span>
            );
          },
        },
        { header: 'التاريخ', accessor: 'created_at', Cell: value => formatDate(value) },
      ];
    }
  }, [activeTab]);

  const filterGroups = useMemo(() => {
    const base = [
      {
        key: 'filter',
        label: 'الترتيب / الحالة',
        type: 'radio',
        options: [
          { value: 'all', label: 'الكل' },
          { value: 'name', label: 'الاسم' },
          { value: 'latest', label: 'الأحدث أولاً' },
          { value: 'oldest', label: 'الأقدم أولاً' },
          { value: 'active_status', label: 'نشط' },
          { value: 'inactive_status', label: 'غير نشط' },
        ],
      },
      {
        key: 'price',
        label: 'القيمة',
        type: 'range',
        range: { min: 0, max: 10000, step: 100 },
      },
    ];

    if (activeTab === 'experts') {
      base.splice(1, 0, {
        key: 'category_id',
        label: 'التخصص',
        type: 'radio',
        options: [
          { value: null, label: 'الكل' },
          ...categories.map((c) => ({ value: c.id, label: c.title })),
        ],
      });
    }

    return base;
  }, [activeTab, categories]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      <h2 className="text-xl lg:text-2xl font-bold">إدارة الحسابات</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard
          value={totals.total_students}
          label="إجمالي المتدربين"
          Icon={UserGroupIcon}
          trend={`${Math.round(totals.student_percentage ?? 0)}%`}
          up={totals.student_status === 'increase'}
        />
        <StatsCard
          value={totals.total_teachers}
          label="إجمالي الخبراء"
          Icon={IdentificationIcon}
          trend={`${Math.round(totals.teacher_percentage ?? 0)}%`}
          up={totals.teacher_status === 'increase'}
        />
        <StatsCard
          value={`${totals.total_profit} ر.س`}
          label="إجمالي المعاملات"
          Icon={CurrencyRupeeIcon}
          trend={`${Math.round(totals.profit_percentage ?? 0)}%`}
          up={totals.profit_status === 'increase'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'trainees', label: 'المتدربين' },
          { key: 'experts', label: 'الخبراء' },
          { key: 'transactions', label: 'المعاملات المالية' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm ${activeTab === tab.key
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 border border-gray-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <FilterPanel
          filterGroups={filterGroups}
          filters={filters}
          onFiltersChange={setFilters}
          searchText={searchInput}
          onSearchChange={setSearchInput}
        />

        <div className="flex gap-2 items-center">
          {/* Import Excel */}
          {activeTab !== 'transactions' && (
            <>
              <button
                onClick={triggerImport}
                disabled={importing}
                className={`px-4 py-2 rounded-lg flex items-center gap-1 ${importing ? 'bg-gray-300 text-gray-600' : 'bg-white text-gray-700 border border-gray-300'}`}
                title="استيراد ملف إكسل"
              >
                <ArrowUpOnSquareIcon className="w-5 h-5" />
                {importing ? 'جارٍ الاستيراد...' : 'استيراد ملف إكسل'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportChange}
              />

              {/* Download Excel template */}
              <button
                onClick={handleDownloadExample}
                className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-1"
                title="تحميل نموذج إكسل"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                نموذج إكسل
              </button>
            </>
          )}

          {/* Export current list */}
          <button
            onClick={handleDownload}
            className="bg-secondary text-white px-4 py-2 rounded-lg flex items-center gap-1"
            title="تصدير"
          >
            <CloudArrowDownIcon className="w-5 h-5" /> تحميل
          </button>

          {activeTab !== 'transactions' && (
            <button
              onClick={handleAdd}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <PlusIcon className="w-5 h-5" /> إضافة حساب
            </button>
          )}
        </div>
      </div>

      <DataTable
        data={rawData}
        columns={columns}
        loading={loading}
        showActions={activeTab !== 'transactions'}
        serverPagination={{
          currentPage: meta.current_page,
          totalPages: meta.last_page,
          onPageChange: setPage,
        }}
        renderRowActions={row => (
          (activeTab === 'trainees' || activeTab === 'experts') ? (
            <div className="flex gap-2">
              <button onClick={() => handleEdit(row)} className="bg-primary text-white p-2 rounded-lg">
                <PencilIcon className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(row)} className="bg-grey text-text_grey p-2 rounded-lg">
                <BiUserMinus className="w-5 h-5" />
              </button>
            </div>
          ) : null
        )}
        bulkActions={(selected) => (
          activeTab === 'transactions' ? null : (
            <div className="flex items-center gap-4">
              <span>{selected.length} محدد</span>
              <button className="p-2 bg-red-100 text-red-600 rounded">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          )
        )}
      />
    </div>
  );
}
