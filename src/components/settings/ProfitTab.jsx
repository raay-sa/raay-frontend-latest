import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminService } from '../../services/adminService';

export default function ProfitTab() {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProfitPercentage();
    }, []);

    const fetchProfitPercentage = async () => {
        try {
            const res = await AdminService.getSettings();
            setValue(res?.data?.profit_percentage?.toString() || '');
        } catch (err) {
            console.error(err);
            toast.error('فشل تحميل النسبة');
        }
    };

    const handleSubmit = async () => {
        if (!value || isNaN(value)) {
            toast.error('يرجى إدخال رقم صحيح');
            return;
        }

        setLoading(true);
        try {
            await AdminService.updateSettings({ profit_percentage: value });
            toast.success('تم حفظ النسبة بنجاح');
        } catch (err) {
            console.error(err);
            toast.error('فشل حفظ النسبة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 lg:space-y-6 max-w-full lg:max-w-md">
            <label className="block text-sm font-semibold mb-2">نسبة الأرباح</label>
            <input
                type="text"
                placeholder="أدخل نسبة الأرباح"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full border rounded px-3 sm:px-4 py-2 text-sm sm:text-base"
            />

            <div className="flex flex-col sm:flex-row justify-start gap-3 sm:gap-4 mt-4">
                <button
                    type="button"
                    onClick={fetchProfitPercentage}
                    className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-md text-sm sm:text-base"
                >
                    تجاهل
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 sm:px-6 py-2 bg-primary text-white rounded-md text-sm sm:text-base"
                >
                    {loading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
            </div>
        </div>
    );
}
