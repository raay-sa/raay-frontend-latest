import React, { useState, useEffect } from 'react';
import {
    XMarkIcon,
    ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { EvaluationsService } from '../../services/evaluationsService';

export default function SendEvaluationModal({ onClose, formLink }) {
    const [programs, setPrograms] = useState([]);
    const [programId, setProgramId] = useState('');
    const [smsType, setSmsType] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            const res = await EvaluationsService.getPrograms();
            setPrograms(res?.data?.data || []);
        } catch (err) {
            console.error('فشل تحميل البرامج', err);
        }
    };

    const handleSend = async () => {
        if (!programId || !smsType) {
            alert('يرجى اختيار البرنامج وطريقة الإرسال');
            return;
        }

        setLoading(true);
        try {
            await EvaluationsService.sendEvaluation({
                program_id: parseInt(programId),
                sms_type: smsType,
            });

            onClose();
        } catch (err) {
            console.error('فشل في إرسال النموذج:', err);
            alert('حدث خطأ أثناء الإرسال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-lg p-4 lg:p-6 space-y-4 lg:space-y-5 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-2 left-2 p-1 text-gray-500 hover:text-primary">
                    <XMarkIcon className="w-5 h-5" />
                </button>

                <h2 className="text-lg lg:text-xl font-bold text-center">إرسال استمارة التقييم</h2>

                <label className="block text-sm font-medium">اسم البرنامج</label>
                <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                >
                    <option value="">اختر البرنامج</option>
                    {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.title}
                        </option>
                    ))}
                </select>

                <label className="block text-sm font-medium">طريقة الإرسال</label>
                <select
                    value={smsType}
                    onChange={(e) => setSmsType(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                >
                    <option value="">اختر طريقة الإرسال</option>
                    <option value="link">إرسال رابط مباشر للمتدربين</option>
                    <option value="sms">عن طريق SMS</option>
                </select>

                <label className="block text-sm font-medium">رابط النموذج</label>
                <div className="flex">
                    <input
                        disabled
                        value={formLink}
                        className="flex-1 border-l rounded-l-lg p-2 text-xs bg-gray-50"
                    />
                    <button
                        onClick={() => navigator.clipboard.writeText(formLink)}
                        className="bg-primary text-white px-3 rounded-r-lg text-xs flex items-center gap-1"
                    >
                        <ClipboardDocumentCheckIcon className="w-4 h-4" /> نسخ الرابط
                    </button>
                </div>

                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="w-full bg-primary text-white py-2 rounded-lg mt-2"
                >
                    {loading ? 'جاري الإرسال...' : 'إرسال'}
                </button>
            </div>
        </div>
    );
}
