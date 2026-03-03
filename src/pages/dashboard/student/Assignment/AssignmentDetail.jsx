import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ClockIcon } from '@heroicons/react/24/outline';
import BackButton from '../../../../components/BackButton';
import StudentAssignmentsService from '../../../../services/student/assignmentsService';

const arDate = (iso) => {
    if (!iso) return { date: '—', time: '' };
    const d = new Date(String(iso).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
    return {
        date: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: d.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' }),
    };
};

export default function AssignmentDetail() {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState(null);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await StudentAssignmentsService.getAssignment(assignmentId);
                setAssignment(data?.data || null);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [assignmentId]);

    const handleFileChange = (e) => setFile(e.target.files?.[0] || null);

    const handleSubmit = async () => {
        if (!file) return;
        try {
            setSubmitting(true);
            await StudentAssignmentsService.submitAssignmentSolution({
                assignment_id: Number(assignmentId),
                file,
            });
            // after upload, go back to list (teacher will grade later)
            navigate('/student/assignments', { state: { justSubmitted: true } });
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-3 lg:p-6">جاري التحميل…</div>;
    if (!assignment) return <div className="p-3 lg:p-6 text-red-600">تعذر تحميل المهمة</div>;

    const { date, time } = arDate(assignment.date);
    const isMarked = assignment?.solutions_grade != null;

    return (
        <div className="p-3 lg:p-6 space-y-4 lg:space-y-6">
            <BackButton to="/student/assignments" />

            {/* === Summary Banner (marked) === */}
            {isMarked && (
                <div className="bg-gray-100 rounded-lg px-3 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img src="/images/success.png" className="w-8 sm:w-10 mx-auto" alt="success" />
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold">أحسنت!</h1>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link to="/student/courses" className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">
                            استمر في التعلم
                        </Link>
                        <div className="hidden sm:block h-16 border border-[#A0A0A0]" />
                        <div className="flex flex-col items-center sm:items-start">
                            <span className="text-gray-600 text-sm">التقييم</span>
                            <span className="text-xl sm:text-2xl font-bold text-green-600">
                                {Number(assignment.solutions_grade ?? 0)}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* === Detail Card === */}
            <div className="bg-white shadow rounded-lg p-3 sm:p-6 space-y-4 lg:space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-3 lg:space-y-5">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{assignment.title}</h1>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <span className="bg-[#F0F0F0] py-1 px-2 rounded-xl flex items-center gap-1">
                                <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                تاريخ التسليم: {date} – الساعة {time}
                            </span>
                            {!isMarked && (
                                <span className="bg-[#F0F0F0] py-1 px-2 rounded-xl">تم التسليم / بانتظار التقييم</span>
                            )}
                        </div>
                    </div>

                    {/* Upload zone only when not marked */}
                    {!isMarked && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                            <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} />
                            <label htmlFor="file-upload" className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg cursor-pointer text-sm sm:text-base">
                                إرفاق الملف
                            </label>
                            <button
                                onClick={handleSubmit}
                                disabled={!file || submitting}
                                className="px-3 sm:px-4 py-2 bg-secondary text-white rounded-lg disabled:opacity-60 text-sm sm:text-base"
                            >
                                {submitting ? 'جاري التسليم...' : 'تسليم المهمة'}
                            </button>
                        </div>
                    )}
                </div>

                {!!assignment.description && (
                    <div className="space-y-2">
                        <h2 className="font-semibold text-sm sm:text-base">الوصف:</h2>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{assignment.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
