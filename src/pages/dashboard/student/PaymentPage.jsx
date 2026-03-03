// src/pages/dashboard/student/PaymentPage.jsx
import React, { useState } from 'react';
import StudentShopService from '../../../services/student/shopService';

export default function PaymentPage({ total = 0 }) {
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const onPay = async () => {
        setErr('');
        if (!total || Number(total) <= 0) {
            setErr('قيمة السلة غير صالحة.');
            return;
        }

        try {
            setLoading(true);
            const { data } = await StudentShopService.createTapPayment({
                amount: Number(total),
            });

            const url = data?.payment_url;

            if (!url) {
                setErr('تعذر إنشاء جلسة الدفع. حاول مرة أخرى.');
                return;
            }

            // Full page redirect to Tap checkout
            window.location.href = url;
        } catch (e) {
            console.error(e);
            setErr(
                e?.response?.data?.message ||
                'فشل بدء عملية الدفع. برجاء المحاولة مرة أخرى.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow" dir="rtl">
            <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">الدفع</h2>

            <div className="mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                    سيتم توجيهك إلى صفحة الدفع الآمنة لإتمام عملية الشراء
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 gap-3">
                <div className="text-gray-700 text-sm sm:text-base">
                    الإجمالي: <span className="font-semibold">{Number(total).toFixed(2)} ريال</span>
                </div>

                <button
                    onClick={onPay}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg bg-primary text-white disabled:opacity-60 text-sm sm:text-base"
                >
                    {loading ? 'جاري التحويل…' : 'ادفع الآن'}
                </button>
            </div>

            {err ? <p className="mt-4 text-red-600 text-xs sm:text-sm">{err}</p> : null}
        </div>
    );
}
