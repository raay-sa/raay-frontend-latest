import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Filter from '../../../../components/Filter';
import DataTable from '../../../../components/DataTable';
import StatsCard from '../../../../components/StatsCard';
import {
    ArrowDownCircleIcon,
    BanknotesIcon,
    CheckCircleIcon,
    EyeIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import useStudentTransactions from '../../../../hooks/useStudentTransactions';
import StudentTransactionsService from '../../../../services/transactionsService';

export default function StudentInvoices() {
    const navigate = useNavigate();

    const {
        loading,
        rows,
        pagination,
        page,
        setPage,
        filter,
        setFilter,
        summary, // { total_count, success_count, failed_count }
    } = useStudentTransactions();

    const filterGroups = useMemo(() => ([
        {
            key: 'filter',
            label: 'الترتيب',
            type: 'radio',
            options: [
                { value: 'all', label: 'الكل' },
                { value: 'latest', label: 'الأحدث أولاً' },
                { value: 'oldest', label: 'الأقدم أولاً' },
            ],
        },
    ]), []);

    // Columns
    const formatDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (isNaN(d)) return '—';
        return d.toLocaleString('ar-EG', { hour12: true });
    };

    const columns = useMemo(() => ([
        { header: '#', accessor: 'id' },
        { header: 'رقم العملية', accessor: 'transaction_id' },
        { header: 'العلامة', accessor: 'payment_brand' },
        {
            header: 'الحالة',
            accessor: 'status',
            Cell: (v) => {
                const isSuccessful = v === 'successful' || v === 'completed';
                return (
                    <span className={`px-2 py-1 text-xs rounded-full ${isSuccessful ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {isSuccessful ? 'ناجحة' : 'فاشلة'}
                    </span>
                );
            },
        },
        {
            header: 'المبلغ',
            accessor: 'total_price',
            Cell: (v, row) => `${v ?? 0} ${row.currency || 'SAR'}`,
        },
        {
            header: 'عدد البرامج',
            accessor: 'programs_count',
            Cell: (v) => v ?? 0,
        },
        {
            header: 'التاريخ',
            accessor: 'created_at',
            Cell: (v) => formatDate(v),
        },
    ]), []);

    // Open PDF in new tab (using blob to preserve auth)
    const openPdf = async (id) => {
        try {
            const res = await StudentTransactionsService.invoiceBlob(id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            // Revoke after a delay to allow the browser to load it
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (e) {
            console.error('Failed to open invoice PDF', e);
            alert('تعذر فتح الفاتورة. حاول مرة أخرى.');
        }
    };

    // Download PDF (using blob + temporary link)
    const downloadPdf = async (id) => {
        try {
            const res = await StudentTransactionsService.invoiceBlob(id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch (e) {
            console.error('Failed to download invoice PDF', e);
            alert('تعذر تحميل الفاتورة. حاول مرة أخرى.');
        }
    };

    const renderRowActions = (row) => (
        <div className="flex gap-2">
            <button
                onClick={() => navigate(`/student/invoices/${row.id}`)}
                className="bg-grey text-text_grey px-3 py-2 rounded-lg text-xs">
                تفاصيل العملية
            </button>
            <button
                onClick={() => openPdf(row.id)}
                className="bg-primary text-white px-3 py-2 rounded-lg text-xs">
                <EyeIcon className="w-4 h-4 inline-block ml-1" />
            </button>
            <button
                onClick={() => downloadPdf(row.id)}
                className="bg-secondary text-white px-3 py-2 rounded-lg text-xs">
                <ArrowDownCircleIcon className="w-4 h-4 inline-block ml-1" />
            </button>
        </div>
    );

    const [filtersState, setFiltersState] = useState({ filter: 'all' });
    useEffect(() => { setFiltersState({ filter }); }, [filter]);

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h2 className="text-2xl font-bold">فواتيري</h2>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard
                    value={summary.total_count ?? 0}
                    label="إجمالي العمليات"
                    Icon={BanknotesIcon}
                    trend=""
                    up
                />
                <StatsCard
                    value={summary.success_count ?? 0}
                    label="العمليات الناجحة"
                    Icon={CheckCircleIcon}
                    trend=""
                    up
                />
                <StatsCard
                    value={summary.failed_count ?? 0}
                    label="العمليات الفاشلة"
                    Icon={XCircleIcon}
                    trend=""
                    up={false}
                />
            </div>

            {/* Filter bar */}
            <div className="flex justify-between items-center">
                <Filter
                    filterGroups={filterGroups}
                    filters={filtersState}
                    onFiltersChange={(next) => { setFilter(next.filter); setPage(1); }}
                    isSearchEnabled={false}
                    searchText=""
                    onSearchChange={() => { }}
                />
                <div />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow">
                <DataTable
                    data={rows}
                    columns={columns}
                    loading={loading}
                    showActions
                    serverPagination={{
                        currentPage: pagination.current_page,
                        totalPages: pagination.last_page,
                        onPageChange: setPage,
                    }}
                    renderRowActions={renderRowActions}
                    emptyText="لا توجد عمليات دفع حتى الآن"
                />
            </div>
        </div>
    );
}
