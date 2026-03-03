import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import BackButton from '../../../../components/BackButton';
import StudentAssignmentsService from '../../../../services/student/assignmentsService';

export default function AssignmentReview() {
    const { examId } = useParams();
    const state = useLocation().state || {};

    // If we arrive with full context, we could use it.
    // But we also support opening the page later: fetch from /solution.
    const [loading, setLoading] = useState(false);
    const [solution, setSolution] = useState(null);

    const shouldFetch = !state.exam || state.fetchSolution;

    useEffect(() => {
        if (!shouldFetch) return;
        (async () => {
            try {
                setLoading(true);
                const { data } = await StudentAssignmentsService.getExamSolution(examId);
                setSolution(data?.data || null);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [examId, shouldFetch]);

    // Normalize sources (state vs fetched)
    const examObj = useMemo(() => {
        if (solution) return solution;
        if (state.exam) return state.exam;
        return null;
    }, [solution, state.exam]);

    const score = useMemo(() => {
        if (solution?.last_grade != null) return Number(solution.last_grade);
        if (state.score != null) return Number(state.score);
        return null;
    }, [solution, state.score]);

    const successRate = useMemo(() => {
        if (solution?.success_rate != null) return Number(solution.success_rate);
        if (state.successRate != null) return Number(state.successRate);
        return 70;
    }, [solution, state.successRate]);

    const canRetry = useMemo(() => {
        if (solution?.remaining_tries != null) return Number(solution.remaining_tries) > 0;
        return Boolean(state.canRetry);
    }, [solution, state.canRetry]);

    const hasScore = Number.isFinite(score);
    const passed = hasScore ? score >= successRate : false;

    // Build review data
    const reviewData = useMemo(() => {
        // From /solution: questions[] + student_answers[]
        if (solution?.questions?.length) {
            const group = new Map();
            (solution.student_answers || []).forEach(a => {
                if (!group.has(a.question_id)) group.set(a.question_id, []);
                group.get(a.question_id).push(a);
            });

            return solution.questions.map((q) => {
                const answersForQ = group.get(q.id) || [];
                const isObjective = q.type !== 'string';

                let status = 'pending';
                if (isObjective) {
                    // if any objective answer is incorrect -> incorrect; else correct
                    if (!answersForQ.length) status = 'incorrect';
                    else status = answersForQ.every(a => a.is_correct) ? 'correct' : 'incorrect';
                } else {
                    // string: if points present we show yellow (manual graded) but not strict T/F
                    const hasPoints = answersForQ.some(a => a.points != null);
                    status = hasPoints ? 'graded_text' : 'pending';
                }

                return {
                    id: q.id,
                    text: q.question,
                    type: q.type,
                    points: q.points ?? null,
                    options: (q.options || []).map(o => ({
                        id: o.id,
                        text: o.option,
                        isCorrect: !!o.is_correct,
                    })),
                    studentAnswerText: answersForQ.find(a => a.text_answer != null)?.text_answer ?? '',
                    studentOptionIds: answersForQ.filter(a => a.option_id != null).map(a => a.option_id),
                    status,
                    awardedPoints: answersForQ.find(a => a.points != null)?.points ?? null,
                };
            });
        }

        // Fallback: state.exam + state.submit (older flow)
        if (state.exam && state.submit) {
            const idx = new Map((state.submit.answers || []).map(a => [a.question_id, a]));
            return (state.exam.questions || []).map(q => {
                const a = idx.get(q.id);
                const isObjective = q.type !== 'string';
                const status = isObjective
                    ? (a?.is_correct ? 'correct' : 'incorrect')
                    : (a?.is_correct === null ? 'pending' : a?.is_correct ? 'correct' : 'incorrect');
                return {
                    id: q.id,
                    text: q.question,
                    type: q.type,
                    points: q.points ?? null,
                    options: (q.options || []).map(o => ({
                        id: o.id,
                        text: o.option,
                        isCorrect: !!o.is_correct,
                    })),
                    studentAnswerText: a?.text_answer ?? '',
                    studentOptionIds: a?.option_id ? [a.option_id] : [],
                    status,
                    awardedPoints: a?.points ?? null,
                };
            });
        }

        return [];
    }, [solution, state.exam, state.submit]);

    if (loading) return <div className="p-3 lg:p-6">جاري التحميل…</div>;

    if (!examObj && !reviewData.length && !hasScore) {
        return (
            <div className="p-3 lg:p-6">
                <BackButton to="/student/assignments" />
                <div className="bg-[#F0F0F0] rounded-lg px-3 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                    <div>
                        <h1 className="text-base sm:text-lg font-semibold text-gray-800">لا توجد بيانات للمراجعة</h1>
                        <p className="text-gray-700 mt-1 text-sm sm:text-base">يمكنك العودة لقائمة الاختبارات أو بدء الاختبار إن كان متاحًا.</p>
                    </div>
                    <Link to={`/student/assignments/exams/${examId}`} className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">
                        العودة للاختبار
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 lg:p-6 mx-auto space-y-4 lg:space-y-6" dir="rtl">
            <BackButton to="/student/assignments" />

            {/* Score banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-[#F0F0F0] rounded-lg px-3 sm:px-6 py-4 gap-4">
                <div className="text-center sm:text-right">
                    <h1 className="text-lg sm:text-xl font-bold">
                        {hasScore
                            ? (passed ? 'أحسنت! لقد اجتزت الاختبار' : 'للأسف لم تحقق النسبة المطلوبة')
                            : 'تم استلام إجاباتك – بانتظار التقييم'}
                    </h1>
                    {hasScore ? (
                        <p className="text-sm sm:text-base">لاجتياز الاختبار {Number(successRate)}% أو أعلى</p>
                    ) : (
                        <p className="text-sm sm:text-base">سيتم إعلامك فور اكتمال التقييم اليدوي.</p>
                    )}
                    {!passed && hasScore && (
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">
                            {canRetry ? 'يمكنك إعادة المحاولة مرة واحدة' : 'لقد استهلكت المحاولات، لا يمكنك إعادة المحاولة'}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {hasScore ? (
                        passed ? (
                            <Link to="/student/courses" className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">استمر في التعلم</Link>
                        ) : canRetry ? (
                            <Link to={`/student/assignments/exams/${examId}`} className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">
                                إعادة المحاولة
                            </Link>
                        ) : (
                            <Link to="/student/courses" className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">العودة إلى البرنامج</Link>
                        )
                    ) : (
                        <Link to="/student/assignments" className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">
                            العودة إلى المهام والاختبارات
                        </Link>
                    )}

                    <div className="hidden sm:block h-16 border border-[#A0A0A0]" />
                    <div className="flex flex-col text-center sm:text-left">
                        <span className="text-gray-600 text-sm">التقييم</span>
                        <span className={`text-xl sm:text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                            {hasScore ? `${Number(score)}%` : '—'}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <h1 className="text-xl sm:text-2xl font-bold">اختبار: {examObj?.title ?? state.examMeta?.title ?? '—'}</h1>
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 py-3 sm:py-5">
                    {examObj?.questions_count != null && (
                        <span className='bg-[#F0F0F0] py-1 px-2 rounded-xl'>عدد الأسئلة: {examObj.questions?.length ?? examObj.questions_count}</span>
                    )}
                    <span className='bg-[#F0F0F0] py-1 px-2 rounded-xl'>نسبة النجاح المطلوبة: {Number(successRate)}%</span>
                </div>
            </div>

            {/* Questions */}
            {reviewData.length > 0 ? (
                <div className="space-y-4 lg:space-y-6">
                    {reviewData.map((q, idx) => (
                        <div key={q.id} className="bg-white p-3 sm:p-6 rounded-lg shadow space-y-3 sm:space-y-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                <h3 className="font-semibold text-sm sm:text-base">{idx + 1}. {q.text}</h3>
                                {q.points != null && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded self-start sm:self-auto">{q.points} نقطة</span>
                                )}
                            </div>

                            {/* Options / essay answer */}
                            {q.type === 'string' ? (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs sm:text-sm text-gray-600 mb-1">إجابتك:</div>
                                    <div className="text-gray-800 text-sm sm:text-base">{q.studentAnswerText || '—'}</div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {q.options.map(opt => {
                                        const picked = q.studentOptionIds.includes(opt.id);
                                        const good = opt.isCorrect;
                                        return (
                                            <div
                                                key={opt.id}
                                                className={`px-3 py-2 rounded border ${good ? 'bg-green-50 border-green-200' :
                                                    picked ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <label className="flex items-center gap-2">
                                                    <input type="checkbox" disabled checked={picked} className="form-checkbox text-primary" />
                                                    <span className={`text-sm sm:text-base ${good ? 'text-green-700' : picked ? 'text-red-700' : 'text-gray-700'}`}>
                                                        {opt.text}
                                                    </span>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Status stripe */}
                            {q.status === 'correct' && (
                                <div className="bg-[#D4EDDA] rounded-lg p-3 flex items-center gap-2 text-sm sm:text-lg font-bold">
                                    <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#27AE60]" />
                                    <span>الإجابة صحيحة</span>
                                </div>
                            )}
                            {q.status === 'incorrect' && (
                                <div className="bg-[#FAE1DF] rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-sm sm:text-lg font-bold">
                                        <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#EB5757]" />
                                        <span>الإجابة غير صحيحة</span>
                                    </div>
                                </div>
                            )}
                            {q.status === 'graded_text' && (
                                <div className="bg-[#FFF3B3] rounded-lg p-3 text-sm sm:text-base">
                                    تم منحك {q.awardedPoints ?? 0}{q.points != null ? ` / ${q.points}` : ''} نقطة لهذا السؤال.
                                </div>
                            )}
                            {q.status === 'pending' && (
                                <div className="bg-[#FFF3B3] rounded-lg p-3 text-sm sm:text-base">
                                    سيتم تصحيح هذا السؤال يدوياً من قبل الخبير.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-3 sm:p-6 rounded-lg shadow text-gray-600 text-sm sm:text-base">
                    لا تتوفر تفاصيل الأسئلة حالياً.
                </div>
            )}
        </div>
    );
}
