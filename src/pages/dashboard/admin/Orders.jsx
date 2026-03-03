// src/pages/dashboard/admin/OrdersPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterPanel from '../../../components/Filter';
import DataTable from '../../../components/DataTable';
import StatsCard from '../../../components/StatsCard';
import {
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useOrders } from '../../../hooks/useOrders';

export default function OrdersPage() {
  const navigate = useNavigate();

  // UI tabs (quick status buckets → map to filter)
  const categories = [
    { label: 'كل الطلبات', value: 'all' },
    { label: 'الطلبات المكتملة', value: 'completed' }, // -> completed_status
    { label: 'الطلبات المرفوضة', value: 'rejected' },  // -> failed_status
  ];
  const [category, setCategory] = useState('all');

  // UI filters (split sort/status in UI; map to API's single `filter` in the hook)
  const [filters, setFilters] = useState({
    sort: 'all',      // name | latest | oldest | all
    status: 'all',    // completed_status | failed_status | all
    payment: 'all',   // maps to payment_method
    price: [0, 1000], // price_from, price_to
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 450);
    return () => clearTimeout(id);
  }, [searchInput]);

  const {
    orders,
    stats,
    isLoading,
    meta,
    onPageChange,
  } = useOrders({ filters, search, category });

  // Filter panel config (values match backend expectations)
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
      key: 'status',
      label: 'حالة الطلب',
      type: 'radio',
      options: [
        { label: 'الكل', value: 'all' },
        { label: 'مكتمل', value: 'completed_status' },
        { label: 'مرفوض', value: 'failed_status' },
      ],
    },
    {
      key: 'payment',
      label: 'طريقة الدفع',
      type: 'radio',
      options: [
        { label: 'الكل', value: 'all' },
        { label: 'بطاقة بنكية', value: 'mada' },
        { label: 'PayPal', value: 'paypal' },
      ],
    },
    {
      key: 'price',
      label: 'السعر',
      type: 'range',
      range: { min: 0, max: 1000, step: 50 },
    },
  ];

  const columns = [
    { header: '#', accessor: 'id' },
    { header: 'اسم المتدرب', accessor: 'student', Cell: v => v?.name || 'غير معروف' },
    { header: 'اسم البرنامج', accessor: 'programs', Cell: v => (v || []).map(p => p.translations?.find(t => t.locale === 'ar')?.title).join(' + ') },
    { header: 'عدد البرامج', accessor: 'programs_count', Cell: v => v || 0 },
    { header: 'إجمالي السعر', accessor: 'total_price', Cell: v => `${v} ر.س` },
    { header: 'وسيلة الدفع', accessor: 'payment_brand', Cell: v => v || 'غير معروف' },
    {
      header: 'الحالة',
      accessor: 'status',
      Cell: v => {
        const isSuccessful = v === 'successful' || v === 'completed';
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${
            isSuccessful ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {isSuccessful ? 'مكتمل' : 'مرفوض'}
          </span>
        );
      },
    },
    {
      header: 'التاريخ',
      accessor: 'created_at',
      Cell: v => new Date(v).toLocaleDateString('ar-EG'),
    },
  ];

  

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
      <h2 className="text-xl lg:text-2xl font-bold">إدارة الطلبات</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <StatsCard value={`${stats.total_profit} ر.س`} label="إجمالي المبيعات" Icon={CurrencyRupeeIcon} trend="" up />
        <StatsCard value={stats.rejected} label="الطلبات المعلقة" Icon={ShoppingCartIcon} trend="" />
        <StatsCard value={stats.completed} label="الطلبات المكتملة" Icon={ShoppingCartIcon} trend="" up />
        <StatsCard value={stats.total_orders} label="إجمالي الطلبات" Icon={ShoppingCartIcon} trend="" up />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 lg:gap-4">
        <FilterPanel
          filterGroups={filterGroups}
          filters={filters}
          onFiltersChange={(next) => {
            setFilters(next);
            // page resets to 1 inside hook when filters change
          }}
          searchText={searchInput}
          onSearchChange={setSearchInput}
        />

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button className="bg-secondary text-white px-3 sm:px-4 py-2 rounded flex items-center justify-center gap-1 text-sm sm:text-base">
            <CloudArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5" /> تحميل
          </button>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-primary text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
          >
            {categories.map((c) => (
              <option className="bg-white text-black" key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        data={orders}
        columns={columns}
        loading={isLoading}
        serverPagination={{
          currentPage: meta?.currentPage ?? 1,
          totalPages: meta?.lastPage ?? 1,
          onPageChange,
        }}
        pageSizeOptions={[10]}
      />
    </div>
  );
}
