// src/pages/dashboard/teacher/AssignmentsCreateEdit.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TrashIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import ProgramsService from '../../../../services/teacher/programsService';
import { assignmentsService } from '../../../../services/teacher/assignmentsService';
import examsService from '../../../../services/teacher/examsService';
import DashboardSkeleton from '../../../../components/Loaders/DashboardSkeleton';
import { useLocation, useNavigate } from 'react-router-dom';

const toDateTimeString = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return '';
    return `${dateStr} ${timeStr}:00`;
};

const useQuery = () => {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
};

export default function AssignmentsCreateEdit() {
    const navigate = useNavigate();
    const query = useQuery();
    const editType = query.get('type'); // 'assignment' | 'exam'
    const editId = query.get('id');     // numeric id

    const [loading, setLoading] = useState(true);
    const [programs, setPrograms] = useState([]);
    const [serverErrors, setServerErrors] = useState([]);

    /* ---------------- Assignment form ---------------- */
    const {
        register: regA,
        handleSubmit: handleSubmitA,
        reset: resetA,
        formState: { errors: errorsA },
    } = useForm({
        defaultValues: {
            program_id: '',
            title: '',
            description: '',
            due_date: '',
            due_time: '',
        },
    });

    /* ---------------- Exam form ---------------- */
    const {
        register: regE,
        handleSubmit: handleSubmitE,
        setValue: setValueE,
        reset: resetE,
        watch: watchE,
        formState: { errors: errorsE },
    } = useForm({
        defaultValues: {
            program_id: '',
            title: '',
            description: '',
            duration: '',
            success_rate: '',
            tries_count: '',
            exam_link: '',
            file: null,
            user_type: 'student', // default
        },
    });

    // Question builder (exam)
    const [questions, setQuestions] = useState([]);
    const [qForm, setQForm] = useState({
        type: 'string', // 'string' | 'multiple_choice'
        points: '',
        question: '',
        answer: '',
        options: [{ option: '', is_correct: false }],
    });
    const fileValue = watchE('file');

    /* ---------------- Load initial data ---------------- */
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const progRes = await ProgramsService.listForTeacher();
                if (mounted) setPrograms(progRes?.data?.data || []);

                if (editId && editType === 'assignment') {
                    const res = await assignmentsService.getAssignment(editId);
                    const a = res?.data?.data || res?.data;
                    if (a) {
                        const dt = new Date((a.date || '').replace(' ', 'T'));
                        const valid = !Number.isNaN(dt.getTime());
                        resetA({
                            program_id: String(a.program_id ?? a?.program?.id ?? ''),
                            title: a.title || '',
                            description: a.description || '',
                            due_date: valid ? dt.toISOString().slice(0, 10) : '',
                            due_time: valid ? dt.toTimeString().slice(0, 5) : '',
                        });
                    }
                }

                if (editId && editType === 'exam') {
                    const res = await examsService.getExam(editId);
                    const e = res?.data?.data || res?.data;
                    if (e) {
                        resetE({
                            program_id: String(e.program_id ?? e?.program?.id ?? ''),
                            title: e.title || '',
                            description: e.description || '',
                            duration: e.duration ? String(e.duration) : '',
                            success_rate: e.success_rate ? String(e.success_rate) : '',
                            tries_count: e.tries_count ? String(e.tries_count) : '',
                            exam_link: e.exam_link || '',
                            file: null,
                            user_type: e.user_type || 'student',
                        });
                        setQuestions(
                            (e.questions || []).map((q) => ({
                                type: q.type || 'string',
                                points: q.points || 0,
                                question: q.question || '',
                                answer: q.answer || '',
                                sort: q.sort || 1,
                                options:
                                    (q.options || []).map((op) => ({
                                        option: op.option,
                                        is_correct: !!(op.is_correct ?? op.correct),
                                    })) || [],
                            }))
                        );
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---------------- Helpers: build final questions list ---------------- */
    const collectQuestionsForSubmit = () => {
        const list = [...questions];

        // If there's an in-progress question in qForm (not "Added" yet), include it:
        if (qForm?.question?.trim()) {
            if (qForm.type === 'multiple_choice') {
                const validOps = (qForm.options || []).filter(o => o.option?.trim());
                if (validOps.length) {
                    const correct = validOps.filter(o => o.is_correct);
                    const answer = correct.length
                        ? correct.map(o => o.option.trim()).join(', ')
                        : '';
                    list.push({
                        ...qForm,
                        options: validOps,
                        answer,
                        sort: list.length + 1,
                    });
                }
            } else {
                // string question requires an answer
                if (qForm.answer?.trim()) {
                    list.push({
                        ...qForm,
                        sort: list.length + 1,
                    });
                }
            }
        }

        // Normalize the shape to match backend expectations
        return list.map((q, idx) => {
            const isMCQ = q.type === 'multiple_choice';
            const answer = isMCQ
                ? ((q.answer && q.answer.trim()) ||
                    (q.options || [])
                        .filter(o => o.is_correct && o.option?.trim())
                        .map(o => o.option.trim())
                        .join(', '))
                : (q.answer ?? '');

            return {
                question: q.question,
                answer,
                type: q.type,
                points: Number(q.points || 0),
                sort: q.sort ?? idx + 1,
                image: null,
                file: null,
                ...(isMCQ
                    ? {
                        options: (q.options || []).map(op => ({
                            option: op.option,
                            is_correct: op.is_correct ? 1 : 0,
                        })),
                    }
                    : {}),
            };
        });
    };

    /* ---------------- Handlers: Assignment ---------------- */
    const submitAssignment = async (form) => {
        setServerErrors([]);
        const payload = {
            title: form.title,
            description: form.description,
            date: toDateTimeString(form.due_date, form.due_time),
            program_id: Number(form.program_id),
        };

        try {
            if (editId && editType === 'assignment') {
                await assignmentsService.updateAssignment(editId, payload);
            } else {
                await assignmentsService.createAssignment(payload);
            }
            navigate('/teacher/assignments');
        } catch (err) {
            const msgs = [];
            const m = err?.response?.data?.errors;
            if (m) Object.values(m).forEach((arr) => msgs.push(...arr));
            setServerErrors(msgs.length ? msgs : ['Failed to save. Please try again.']);
            console.error(err);
        }
    };

    /* ---------------- Handlers: Exam ---------------- */
    const submitExam = async (form) => {
        setServerErrors([]);

        const payload = {
            title: form.title,
            description: form.description,
            tries_count: Number(form.tries_count || 0),
            success_rate: Number(form.success_rate || 0),
            duration: String(form.duration || ''),
            file: form.file || null,
            exam_link: form.exam_link || '',
            program_id: Number(form.program_id),
            user_type: form.user_type || 'student',
            // ✅ include both saved questions and the current qForm if filled
            questions: collectQuestionsForSubmit(),
        };

        try {
            if (editId && editType === 'exam') {
                await examsService.updateExam(editId, payload);
            } else {
                await examsService.createExam(payload);
            }
            navigate('/teacher/assignments');
        } catch (err) {
            const msgs = [];
            const m = err?.response?.data?.errors;
            if (m) Object.entries(m).forEach(([, arr]) => msgs.push(...arr));
            setServerErrors(msgs.length ? msgs : ['Failed to save. Please try again.']);
            console.error(err);
        }
    };

    /* ---------------- Question builder helpers ---------------- */
    const resetQForm = () =>
        setQForm({
            type: 'string',
            points: '',
            question: '',
            answer: '',
            options: [{ option: '', is_correct: false }],
        });

    const addQuestion = () => {
        setServerErrors([]);
        if (!qForm.question?.trim()) {
            setServerErrors(['Enter a question text.']);
            return;
        }

        if (qForm.type === 'multiple_choice') {
            const validOps = (qForm.options || []).filter((o) => o.option?.trim());
            if (!validOps.length) {
                setServerErrors(['Add at least one option.']);
                return;
            }
            const correct = validOps.filter((o) => o.is_correct);
            if (!correct.length) {
                setServerErrors(['Mark at least one correct option.']);
                return;
            }
            const answer = correct.map((o) => o.option.trim()).join(', ');
            setQuestions((prev) => [...prev, { ...qForm, options: validOps, answer, sort: prev.length + 1 }]);
            resetQForm();
            return;
        }

        // string question
        if (!qForm.answer?.trim()) {
            setServerErrors(['Enter an answer for the short-text question.']);
            return;
        }
        setQuestions((prev) => [...prev, { ...qForm, sort: prev.length + 1 }]);
        resetQForm();
    };

    const removeQuestion = (idx) =>
        setQuestions((prev) => prev.filter((_, i) => i !== idx));

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h1 className="text-3xl font-bold mb-2">إدارة المهام والاختبارات</h1>

            {serverErrors.length > 0 && (
                <div className="bg-red-100 text-red-700 border border-red-300 rounded-lg px-4 py-3 space-y-1">
                    {serverErrors.map((msg, i) => (
                        <p key={i} className="text-sm">{msg}</p>
                    ))}
                </div>
            )}

            {/* -------------------- ASSIGNMENT CARD -------------------- */}
            <div className="bg-white rounded-2xl shadow p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">إضافة مهام</h2>
                    <button
                        onClick={handleSubmitA(submitAssignment)}
                        className="px-4 py-2 bg-primary text-white rounded-lg"
                    >
                        {editId && editType === 'assignment' ? 'تحديث مهمة' : 'إضافة مهام'}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Program */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="block mb-1">اسم البرنامج</label>
                        <select
                            {...regA('program_id', { required: 'اختر اسم البرنامج' })}
                            className="w-full border rounded-xl px-3 py-2"
                        >
                            <option value="">اختر اسم البرنامج</option>
                            {programs.map((p) => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        {errorsA.program_id && (
                            <p className="text-xs text-red-600 mt-1">{errorsA.program_id.message}</p>
                        )}
                    </div>

                    <div className="col-span-2 md:col-span-1" />

                    {/* Title */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="block mb-1">العنوان</label>
                        <input
                            type="text"
                            placeholder="أدخل العنوان"
                            {...regA('title', { required: 'أدخل العنوان' })}
                            className="w-full border rounded-xl px-3 py-2"
                        />
                        {errorsA.title && (
                            <p className="text-xs text-red-600 mt-1">{errorsA.title.message}</p>
                        )}
                    </div>

                    <div className="col-span-2 md:col-span-1" />

                    {/* Due time header */}
                    <div className="col-span-2 text-center font-semibold mt-1">
                        وقت التسليم
                    </div>

                    {/* Due date */}
                    <div>
                        <input
                            type="date"
                            {...regA('due_date', { required: 'حدد وقت التسليم' })}
                            className="w-full border rounded-xl px-3 py-2"
                        />
                        {errorsA.due_date && (
                            <p className="text-xs text-red-600 mt-1">{errorsA.due_date.message}</p>
                        )}
                    </div>
                    {/* Due time */}
                    <div>
                        <input
                            type="time"
                            {...regA('due_time', { required: 'حدد وقت التسليم' })}
                            className="w-full border rounded-xl px-3 py-2"
                        />
                        {errorsA.due_time && (
                            <p className="text-xs text-red-600 mt-1">{errorsA.due_time.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                        <label className="block mb-1">الوصف</label>
                        <textarea
                            rows={6}
                            placeholder="أدخل الوصف"
                            {...regA('description')}
                            className="w-full border rounded-xl px-3 py-2 resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* -------------------- EXAM CARD -------------------- */}
            <div className="bg-white rounded-2xl shadow p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">إضافة اختبارات</h2>
                    <button
                        onClick={handleSubmitE(submitExam)}
                        className="px-4 py-2 bg-primary text-white rounded-lg"
                    >
                        {editId && editType === 'exam' ? 'تحديث اختبار' : 'إضافة اختبارات'}
                    </button>
                </div>

                {/* Program */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block mb-1">اسم البرنامج</label>
                        <select
                            {...regE('program_id', { required: 'اختر اسم البرنامج' })}
                            className="w-full border rounded-xl px-3 py-2"
                        >
                            <option value="">اختر اسم البرنامج</option>
                            {programs.map((p) => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        {errorsE.program_id && (
                            <p className="text-xs text-red-600 mt-1">{errorsE.program_id.message}</p>
                        )}
                    </div>
                    <div className="col-span-2 md:col-span-1" />

                    {/* Title / Duration */}
                    <div>
                        <label className="block mb-1">العنوان</label>
                        <input
                            type="text"
                            placeholder="أدخل العنوان"
                            {...regE('title', { required: 'أدخل العنوان' })}
                            className="w-full border rounded-xl px-3 py-2"
                        />
                        {errorsE.title && (
                            <p className="text-xs text-red-600 mt-1">{errorsE.title.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1">مدة الاختبار</label>
                        <input
                            type="number"
                            placeholder="حدد مدة الاختبار"
                            {...regE('duration', { required: 'حدد مدة الاختبار' })}
                            className="w-full border rounded-xl px-3 py-2"
                        />
                        {errorsE.duration && (
                            <p className="text-xs text-red-600 mt-1">{errorsE.duration.message}</p>
                        )}
                    </div>

                    {/* Success rate / tries */}
                    <div>
                        <label className="block mb-1">نسبة النجاح</label>
                        <input
                            type="number"
                            placeholder="حدد نسبة النجاح"
                            {...regE('success_rate', { required: 'حدد نسبة النجاح' })}
                            className="w-full border rounded-xl px-3 py-2"
                        />
                        {errorsE.success_rate && (
                            <p className="text-xs text-red-600 mt-1">{errorsE.success_rate.message}</p>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1">عدد المحاولات المسموحة</label>
                        <input
                            type="number"
                            placeholder="أدخل عدد المحاولات المسموحة"
                            {...regE('tries_count', { required: 'حدد عدد المحاولات' })}
                            className="w-full border rounded-xl px-3 py-2"
                        />
                        {errorsE.tries_count && (
                            <p className="text-xs text-red-600 mt-1">{errorsE.tries_count.message}</p>
                        )}
                    </div>

                    {/* user_type */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="block mb-1">نوع المستخدم</label>
                        <select
                            {...regE('user_type', { required: 'اختر نوع المستخدم' })}
                            className="w-full border rounded-xl px-3 py-2"
                        >
                            <option value="student">طالب</option>
                            <option value="trainee">متدرب</option>
                        </select>
                        {errorsE.user_type && (
                            <p className="text-xs text-red-600 mt-1">{errorsE.user_type.message}</p>
                        )}
                    </div>
                    <div className="col-span-2 md:col-span-1" />

                    {/* Description */}
                    <div className="col-span-2">
                        <label className="block mb-1">الوصف</label>
                        <textarea
                            rows={6}
                            placeholder="أدخل الوصف"
                            {...regE('description')}
                            className="w-full border rounded-xl px-3 py-2 resize-none"
                        />
                    </div>
                </div>

                {/* ---------- Question Builder (optional) ---------- */}
                <div className="pt-2">
                    <h3 className="text-lg font-bold mb-3">تحديد الاسئلة (اختياري)</h3>

                    {/* New question row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1">نوع السؤال</label>
                            <select
                                value={qForm.type}
                                onChange={(e) => setQForm((s) => ({ ...s, type: e.target.value }))}
                                className="w-full border rounded-xl px-3 py-2"
                            >
                                <option value="string">نصي (إجابة قصيرة)</option>
                                <option value="multiple_choice">اختيار متعدد</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1">درجة السؤال</label>
                            <input
                                type="number"
                                value={qForm.points}
                                onChange={(e) => setQForm((s) => ({ ...s, points: e.target.value }))}
                                placeholder="أدخل درجة السؤال"
                                className="w-full border rounded-xl px-3 py-2"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block mb-1">السؤال</label>
                            <input
                                type="text"
                                value={qForm.question}
                                onChange={(e) => setQForm((s) => ({ ...s, question: e.target.value }))}
                                placeholder="أدخل السؤال"
                                className="w-full border rounded-xl px-3 py-2"
                            />
                        </div>

                        {/* MCQ options */}
                        {qForm.type === 'multiple_choice' && (
                            <div className="col-span-2">
                                <div className="flex items-center justify-between">
                                    <label className="block mb-2">الخيارات</label>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setQForm((s) => ({
                                                ...s,
                                                options: [...(s.options || []), { option: '', is_correct: false }],
                                            }))
                                        }
                                        className="px-3 py-1 bg-primary text-white rounded-lg text-sm"
                                    >
                                        إضافة خيار +
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {(qForm.options || []).map((op, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={op.option}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setQForm((s) => {
                                                        const copy = [...s.options];
                                                        copy[i] = { ...copy[i], option: val };
                                                        return { ...s, options: copy };
                                                    });
                                                }}
                                                className="flex-1 border rounded-xl px-3 py-2"
                                                placeholder={`الخيار ${i + 1}`}
                                            />
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={!!op.is_correct}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setQForm((s) => {
                                                            const copy = [...s.options];
                                                            copy[i] = { ...copy[i], is_correct: checked };
                                                            return { ...s, options: copy };
                                                        });
                                                    }}
                                                />
                                                صحيح
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setQForm((s) => ({
                                                        ...s,
                                                        options: s.options.filter((_, idx) => idx !== i),
                                                    }))
                                                }
                                                className="p-2 rounded-lg bg-[#EFEFEF]"
                                                title="حذف"
                                            >
                                                <TrashIcon className="w-4 h-4 text-gray-700" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}

                        {/* Answer (string) */}
                        {qForm.type === 'string' && (
                            <div className="col-span-2">
                                <label className="block mb-1">الإجابة</label>
                                <input
                                    type="text"
                                    value={qForm.answer}
                                    onChange={(e) => setQForm((s) => ({ ...s, answer: e.target.value }))}
                                    placeholder="أدخل الإجابة"
                                    className="w-full border rounded-xl px-3 py-2"
                                />
                            </div>
                        )}

                        <div className="col-span-2">
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="px-4 py-2 bg-primary text-white rounded-lg"
                            >
                                إضافة +
                            </button>
                        </div>
                    </div>

                    {/* Current questions list */}
                    {questions.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {questions.map((q, idx) => (
                                <div
                                    key={idx}
                                    className="border rounded-xl px-3 py-2 flex items-center justify-between"
                                >
                                    <div className="text-sm">
                                        <div className="font-semibold">
                                            {idx + 1}. ({q.type === 'multiple_choice' ? 'اختيار متعدد' : 'نصي'}) – {q.points} نقطة
                                        </div>
                                        <div className="text-gray-700">{q.question}</div>
                                        {q.type === 'string' ? (
                                            <div className="text-gray-500">الإجابة: {q.answer}</div>
                                        ) : (
                                            <div className="text-gray-500">
                                                الخيارات: {(q.options || [])
                                                    .map((o) => `${o.option}${o.is_correct ? ' (صحيح)' : ''}`)
                                                    .join('، ')}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(idx)}
                                        className="p-2 rounded-lg bg-[#EFEFEF]"
                                    >
                                        <TrashIcon className="w-5 h-5 text-gray-700" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
