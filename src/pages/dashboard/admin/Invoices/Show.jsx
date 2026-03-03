import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StudentTransactionsService from '../../../../services/transactionsService';
import { withBaseUrl } from '../../../../utils/url';
import { getCategoryImage } from '../../../../utils/index';

export default function StudentInvoiceShow() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [row, setRow] = useState(null);

    // PDF preview blob URL
    const [pdfUrl, setPdfUrl] = useState('');

    useEffect(() => {
        let revokeTimer;
        (async () => {
            try {
                // Fetch JSON details
                const { data } = await StudentTransactionsService.show(id);
                setRow(data?.data || null);

                // Fetch PDF as blob for inline preview
                const res = await StudentTransactionsService.invoiceBlob(id);
                const blob = new Blob([res.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);

                // revoke later
                revokeTimer = setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 5 * 60 * 1000);
            } catch (e) {
                console.error('Failed to fetch transaction/invoice', e);
                setRow(null);
            } finally {
                setLoading(false);
            }
        })();

        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            if (revokeTimer) clearTimeout(revokeTimer);
        };
    }, [id]); // intentionally excluding pdfUrl so cleanup runs once

    const formatDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (isNaN(d)) return '—';
        return d.toLocaleString('ar-EG', { hour12: true });
    };

    // Helper to get program title from translations or direct title
    const getProgramTitle = (program) => {
        if (!program) return '—';
        if (program.translations && Array.isArray(program.translations)) {
            const arTranslation = program.translations.find(t => t.locale === 'ar');
            return arTranslation?.title || program.title || '—';
        }
        return program.title || '—';
    };

    // Helper to get category title from translations or direct title
    const getCategoryTitle = (category) => {
        if (!category) return '—';
        if (category.translations && Array.isArray(category.translations)) {
            const arTranslation = category.translations.find(t => t.locale === 'ar');
            return arTranslation?.title || category.title || '—';
        }
        return category.title || '—';
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const statusMap = {
            'completed': { text: 'مكتملة', color: 'bg-green-100 text-green-800' },
            'successful': { text: 'ناجحة', color: 'bg-green-100 text-green-800' },
            'paid': { text: 'مدفوعة', color: 'bg-green-100 text-green-800' },
            'pending': { text: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' },
            'failed': { text: 'فاشلة', color: 'bg-red-100 text-red-800' },
            'cancelled': { text: 'ملغاة', color: 'bg-gray-100 text-gray-800' },
        };
        const statusInfo = statusMap[status?.toLowerCase()] || { text: status || '—', color: 'bg-gray-100 text-gray-800' };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.text}
            </span>
        );
    };

    const downloadPdf = async () => {
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

    if (loading) return <div className="p-6">جارٍ التحميل...</div>;
    if (!row) return <div className="p-6">لم يتم العثور على بيانات العملية.</div>;

    // Debug: Log invoice_summary to console
    if (row.invoice_summary) {
        console.log('Invoice Summary:', row.invoice_summary);
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">تفاصيل العملية #{row.id}</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                        className="bg-primary text-white px-3 py-2 rounded-lg text-sm"
                        disabled={!pdfUrl}
                    >
                        عرض الفاتورة
                    </button>
                    <button
                        onClick={downloadPdf}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm"
                    >
                        تحميل الفاتورة
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Price and Tax Summary - Prominent Display */}
                {(() => {
                    // Use invoice_summary from API (priority: invoice_summary > tax_breakdown > price_breakdown)
                    const invoiceSummary = row?.invoice_summary || row?.tax_breakdown || row?.price_breakdown;
                    
                    // Parse values as numbers, ensuring we get the actual values from API
                    // Handle both string and number formats
                    let subtotal = 0;
                    let taxAmount = 0;
                    let total = 0;
                    let currency = row?.currency || 'SAR';
                    let taxRate = 15;
                    
                    if (invoiceSummary && typeof invoiceSummary === 'object') {
                        // Parse values - handle both string and number, use Number() for more reliable parsing
                        subtotal = invoiceSummary.subtotal != null && invoiceSummary.subtotal !== '' 
                            ? Number(invoiceSummary.subtotal) || 0 
                            : 0;
                        taxAmount = invoiceSummary.tax_amount != null && invoiceSummary.tax_amount !== '' 
                            ? Number(invoiceSummary.tax_amount) || 0 
                            : 0;
                        total = invoiceSummary.total != null && invoiceSummary.total !== '' 
                            ? Number(invoiceSummary.total) || 0 
                            : 0;
                        currency = invoiceSummary.currency || currency;
                        taxRate = invoiceSummary.tax_rate != null && invoiceSummary.tax_rate !== '' 
                            ? Number(invoiceSummary.tax_rate) || 15 
                            : 15;
                    }
                    
                    // If we still don't have values, try to get from row directly
                    if (total === 0 && row?.total_price != null) {
                        total = Number(row.total_price) || 0;
                    }
                    
                    // If subtotal is 0 but we have total and tax, calculate subtotal
                    if (subtotal === 0 && total > 0) {
                        if (taxAmount > 0) {
                            subtotal = total - taxAmount;
                        } else if (taxRate > 0) {
                            // Calculate subtotal from total and tax rate
                            subtotal = total / (1 + taxRate / 100);
                            taxAmount = total - subtotal;
                        }
                    }
                    
                    const fmt = (v) => {
                        const num = Number(v) || 0;
                        return num.toFixed(2);
                    };
                    
                    return (
                        <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                            <h3 className="text-xl font-bold mb-4">ملخص الفاتورة</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-lg">
                                    <span className="text-gray-700">قيمة البرامج:</span>
                                    <span className="font-bold text-gray-900">{fmt(subtotal)} {currency}</span>
                                </div>
                                <div className="flex items-center justify-between text-lg">
                                    <span className="text-gray-700">ضريبة القيمة المضافة ({taxRate}%):</span>
                                    <span className="font-bold text-gray-900">{fmt(taxAmount)} {currency}</span>
                                </div>
                                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                                    <div className="flex items-center justify-between text-xl">
                                        <span className="font-bold text-gray-900">الإجمالي:</span>
                                        <span className="font-bold text-primary text-2xl">{fmt(total)} {currency}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Programs Table */}
                {row.programs && row.programs.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold mb-4">البرامج المشتراة</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-4 py-3 text-right font-bold">اسم البرنامج</th>
                                        <th className="border border-gray-300 px-4 py-3 text-right font-bold">التصنيف</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {row.programs.map((program) => {
                                        const categoryImage = program.category ? getCategoryImage(program.category, 'ar') : '';
                                        const categoryImageUrl = categoryImage ? withBaseUrl(categoryImage) : '';
                                        
                                        return (
                                            <tr key={program.id} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-3">
                                                    <span className="font-medium">{getProgramTitle(program)}</span>
                                                </td>
                                                <td className="border border-gray-300 px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {categoryImageUrl && (
                                                            <img 
                                                                src={categoryImageUrl} 
                                                                alt={getCategoryTitle(program.category)}
                                                                className="w-10 h-10 object-cover rounded"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                        <span className="text-gray-600">{getCategoryTitle(program.category)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Transaction Details */}
                <div className="mt-6">
                    <h3 className="text-lg font-bold mb-4">تفاصيل العملية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Info label="رقم العملية" value={row.transaction_id} />
                        <Info label="رقم الفاتورة" value={row.invoice_id} />
                        <Info label="حالة العملية" value={getStatusBadge(row.status)} />
                        <Info label="حالة الدفع" value={getStatusBadge(row.result_status)} />
                        <Info label="صاحب البطاقة" value={row.holder_name || '—'} />
                        <Info label="نوع البطاقة" value={row.payment_brand ? row.payment_brand.toUpperCase() : '—'} />
                        <Info label="كود النتيجة" value={row.result_code || '—'} />
                        <Info label="رسالة النتيجة" value={row.result_message || '—'} />
                        <Info label="تاريخ الإنشاء" value={formatDate(row.created_at)} />
                        <Info label="آخر تحديث" value={formatDate(row.updated_at)} />
                        {row.merchant_id && <Info label="معرف المتجر" value={row.merchant_id} />}
                        {row.payment_id && <Info label="معرف الدفع" value={row.payment_id} />}
                    </div>
                </div>

                {/* Inline PDF preview */}
                <div className="mt-6">
                    <h3 className="text-lg font-bold mb-2">معاينة الفاتورة</h3>
                    {pdfUrl ? (
                        <div className="border rounded-lg overflow-hidden" style={{ height: '70vh' }}>
                            <iframe
                                title="invoice-pdf"
                                src={pdfUrl}
                                className="w-full h-full"
                            />
                        </div>
                    ) : (
                        <div className="text-gray-600">لا يمكن عرض الفاتورة حالياً.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Info({ label, value }) {
    // Handle React elements (like status badges)
    const isReactElement = typeof value === 'object' && value !== null && value.$$typeof;
    
    return (
        <div className="flex items-center justify-between border-b pb-2 last:border-b-0">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-900">{isReactElement ? value : (value ?? '—')}</span>
        </div>
    );
}
