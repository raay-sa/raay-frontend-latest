import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageSkeleton from '../../../../components/Loaders/PageSkeleton';
import { gradingService } from '../../../../services/teacher/gradingService';

export default function TeacherAssignmentSolutionEdit() {
    const { solutionId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [row, setRow] = useState(null);
    const [grade, setGrade] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const { data } = await gradingService.getAssignmentSolution(solutionId);
                const r = data?.data || null;
                setRow(r);
                setGrade(r?.grade ?? '');
            } finally {
                setLoading(false);
            }
        })();
    }, [solutionId]);

    const onSave = async () => {
        const val = String(grade).trim();
        if (val === '' || Number.isNaN(Number(val))) return;
        await gradingService.gradeAssignmentSolution(solutionId, val);
        navigate('/teacher/assessments/assignments');
    };

    if (loading) return <PageSkeleton />;
    if (!row) return <div className="p-6 text-red-600">تعذر تحميل التسليم</div>;

    const fileUrl = row.file ? `${import.meta.env.VITE_BASE_URL}/${row.file}` : null;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">تقييم مهمة</h2>
                <Link className="text-primary underline" to="/teacher/assessments/assignments">عودة للقائمة</Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-gray-500">الطالب</div>
                        <div className="font-semibold">{row?.student?.name || '—'}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">المهمة</div>
                        <div className="font-semibold">{row?.assignment?.title || '—'}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">البرنامج</div>
                        <div className="font-semibold">{row?.assignment?.program?.title || '—'}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">الملف المُرسل</div>
                        {fileUrl ? <a href={fileUrl} className="text-primary underline" target="_blank">عرض الملف</a> : '—'}
                    </div>
                </div>

                <div className="pt-4">
                    <label className="block text-sm text-gray-600 mb-1">الدرجة</label>
                    <input
                        type="number"
                        value={grade}
                        onChange={e => setGrade(e.target.value)}
                        className="border rounded-lg px-3 py-2 w-48"
                        min="0"
                        max="100"
                        placeholder="0 - 100"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={onSave} className="bg-primary text-white px-4 py-2 rounded-lg">حفظ</button>
                    <button onClick={() => navigate(-1)} className="bg-gray-100 px-4 py-2 rounded-lg">إلغاء</button>
                </div>
            </div>
        </div>
    );
}
