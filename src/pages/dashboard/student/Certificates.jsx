import React, { useMemo } from 'react';
import useStudentCertificates from '../../../hooks/useStudentCertificates';
import DataTable from '../../../components/DataTable';
import { useNavigate } from 'react-router-dom';
import { ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function StudentCertificates() {
    const {
        loading,
        rows,
        pagination,
        page,
        setPage,
    } = useStudentCertificates();

    const navigate = useNavigate();

    const formatDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (isNaN(d)) return '—';
        return d.toLocaleString('ar-EG', { hour12: true });
    };

    const columns = useMemo(() => ([
        { header: '#', accessor: 'id' },
        {
            header: 'البرنامج',
            accessor: 'program',
            Cell: (program) => program?.title || '—',
        },
        {
            header: 'الفئة',
            accessor: 'program',
            Cell: (program) => program?.category?.title || '—',
        },
        {
            header: 'تاريخ الإصدار',
            accessor: 'created_at',
            Cell: (v) => formatDate(v),
        },
    ]), []);

    const renderRowActions = (row) => {
        const base = import.meta.env.VITE_BASE_URL || '';
        const href = row?.file_path ? `${base}/${row.file_path}` : null;

        return (
            <div className="flex gap-1 sm:gap-2">
                {href && (
                    <>
                        <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-primary text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs"
                        >
                            <EyeIcon className="inline h-3 w-3 sm:h-4 sm:w-4" />
                        </a>
                    </>
                )}
                {row?.program_id && (
                    <button
                        onClick={() => navigate(`/student/courses/${row.program_id}`)}
                        className="bg-secondary text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="inline h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                        </svg>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-xl lg:text-2xl font-bold">شهاداتي</h2>
            </div>

            <div className="bg-white rounded-lg p-2 sm:p-4 shadow">
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
                    emptyText="لا توجد شهادات حتى الآن"
                />
            </div>
        </div>
    );
}
