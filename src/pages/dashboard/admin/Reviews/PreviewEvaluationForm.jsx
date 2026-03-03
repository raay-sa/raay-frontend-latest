// src/pages/dashboard/admin/Reviews/PreviewEvaluationForm.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowUturnLeftIcon,
    PencilIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import SendEvaluationModal from '../../../../components/Modals/SendEvaluationModal';
import { EvaluationsService } from '../../../../services/evaluationsService';

const BASE_URL = import.meta.env.VITE_DASHBOARD_URL || '';

const QUESTION_TYPES = [
    { value: 'radio', label: 'اختيار من متعدد' },
    { value: 'text', label: 'سؤال مفتوح' },
];

export default function PreviewEvaluationForm() {
    const nav = useNavigate();
    const [editMode, setEditMode] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);
    const [submissionLink, setSubmissionLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [programs, setPrograms] = useState([]);
    const [form, setForm] = useState({ program_id: '', sections: [] });

    useEffect(() => {
        fetchPrograms();
        fetchFormView();
    }, []);

    const fetchPrograms = async () => {
        try {
            const res = await EvaluationsService.getPrograms();
            setPrograms(res?.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch programs', err);
        }
    };

    const fetchFormView = async () => {
        try {
            const res = await EvaluationsService.getFormView();
            const data = res?.data?.data;
            setForm({
                program_id: data.program_id?.toString() || '',
                sections: (data.sections || []).map(section => ({
                    title: section.title,
                    questions: section.questions.map(q => ({
                        id: q.id,
                        text: q.title,
                        type: q.type,
                        is_required: !!q.is_required,
                        choices_count: q.choices_count,
                        options: q.options?.map(o => o.title) || [],
                    })),
                })),
            });
        } catch (err) {
            console.error('Failed to fetch default form', err);
        }
    };

    const handleQuestionChange = (sectionIndex, questionIndex, value) => {
        const updated = [...form.sections];
        updated[sectionIndex].questions[questionIndex].text = value;
        setForm(prev => ({ ...prev, sections: updated }));
    };

    const handleQuestionTypeChange = (sectionIndex, questionIndex, value) => {
        const updated = [...form.sections];
        updated[sectionIndex].questions[questionIndex].type = value;
        updated[sectionIndex].questions[questionIndex].options = value === 'text' ? [] : [''];
        setForm(prev => ({ ...prev, sections: updated }));
    };

    const handleOptionChange = (sectionIndex, questionIndex, optionIndex, value) => {
        const updated = [...form.sections];
        updated[sectionIndex].questions[questionIndex].options[optionIndex] = value;
        setForm(prev => ({ ...prev, sections: updated }));
    };

    const addOption = (sectionIndex, questionIndex) => {
        const updated = [...form.sections];
        updated[sectionIndex].questions[questionIndex].options.push('');
        setForm(prev => ({ ...prev, sections: updated }));
    };

    const removeOption = (sectionIndex, questionIndex, optionIndex) => {
        const updated = [...form.sections];
        updated[sectionIndex].questions[questionIndex].options.splice(optionIndex, 1);
        setForm(prev => ({ ...prev, sections: updated }));
    };

    const addQuestion = (sectionIndex) => {
        const updated = [...form.sections];
        updated[sectionIndex].questions.push({
            id: Date.now(),
            text: '',
            type: 'radio',
            is_required: true,
            choices_count: 5,
            options: ['1', '2', '3', '4', '5'],
        });
        setForm(prev => ({ ...prev, sections: updated }));
    };

    const removeQuestion = (sectionIndex, questionIndex) => {
        const updated = [...form.sections];
        updated[sectionIndex].questions.splice(questionIndex, 1);
        setForm(prev => ({ ...prev, sections: updated }));
    };

    const handleSave = async () => {
        if (!form.program_id) {
            alert('يرجى اختيار اسم البرنامج');
            return;
        }

        const selectedProgram = programs.find(p => p.id === parseInt(form.program_id));

        setLoading(true);
        try {
            const payload = {
                program_id: parseInt(form.program_id),
                status: true,
                sections: form.sections.map(section => ({
                    title: section.title,
                    questions: section.questions.map(q => ({
                        title: q.text,
                        type: q.type,
                        is_required: q.is_required,
                        choices_count: q.options.length,
                        options: q.options,
                    })),
                })),
            };

            const res = await EvaluationsService.create(payload);
            const slug = selectedProgram.slug;
            const url = `${BASE_URL}/student/evaluation/forms/program/${slug}`;

            setSubmissionLink(url);
            setSendOpen(true);
        } catch (err) {
            console.error('Error submitting form:', err);
            alert('فشل في إرسال النموذج');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-8" dir="rtl">
            <button
                onClick={() => nav(-1)}
                className="flex items-center px-4 py-2 gap-1 text-sm bg-primary border-primary text-white rounded-lg"
            >
                <ArrowUturnLeftIcon className="w-4 h-4" />
                العودة إلى مراجعة التقييمات
            </button>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-center">استمارة تقييم برنامج تدريبي</h1>
                <div className="flex gap-2">
                    {!editMode && (
                        <button
                            onClick={() => setEditMode(true)}
                            className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-1"
                        >
                            <PencilIcon className="w-4 h-4" />
                            تعديل
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-secondary text-white rounded-lg"
                    >
                        {loading ? 'جاري الإرسال...' : 'إرسال'}
                    </button>
                </div>
            </div>

            <div className="max-w-md">
                <label className="block text-sm font-medium mb-1">اسم البرنامج</label>
                <select
                    value={form.program_id}
                    onChange={e => setForm(prev => ({ ...prev, program_id: e.target.value }))}
                    className="w-full border rounded-lg p-2 text-sm"
                >
                    <option value="">اختر البرنامج</option>
                    {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
            </div>

            <section className="space-y-6">
                {form.sections.map((section, sIdx) => (
                    <div key={sIdx}>
                        <h2 className="font-semibold text-lg mb-2">{section.title}</h2>
                        {section.questions.map((q, qIdx) => (
                            <div key={qIdx} className="space-y-3 border rounded-lg p-4 bg-gray-50 mb-4">
                                {editMode ? (
                                    <>
                                        <p className="font-medium">السؤال {qIdx + 1}</p>
                                        <input
                                            value={q.text}
                                            onChange={e => handleQuestionChange(sIdx, qIdx, e.target.value)}
                                            className="border px-3 py-2 rounded w-full text-sm mb-2"
                                            placeholder="نص السؤال"
                                        />

                                        <div className="mb-2">
                                            <label className="text-sm font-medium">نوع السؤال</label>
                                            <select
                                                value={q.type}
                                                onChange={e => handleQuestionTypeChange(sIdx, qIdx, e.target.value)}
                                                className="w-full border rounded px-2 py-1 mt-1 text-sm"
                                            >
                                                {QUESTION_TYPES.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {q.type === 'radio' && (
                                            <>
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className="flex items-center gap-2 mb-1">
                                                        <input
                                                            value={opt}
                                                            onChange={e =>
                                                                handleOptionChange(sIdx, qIdx, i, e.target.value)
                                                            }
                                                            className="border px-3 py-1 rounded w-full text-sm"
                                                            placeholder={`الخيار ${i + 1}`}
                                                        />
                                                        {q.options.length > 1 && (
                                                            <button
                                                                onClick={() => removeOption(sIdx, qIdx, i)}
                                                                className="text-red-500 text-xs hover:underline"
                                                            >
                                                                حذف
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addOption(sIdx, qIdx)}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    + إضافة خيار
                                                </button>
                                            </>
                                        )}

                                        <div className="text-left pt-2">
                                            <button
                                                onClick={() => removeQuestion(sIdx, qIdx)}
                                                className="text-red-500 text-xs hover:underline"
                                            >
                                                حذف السؤال
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium">{qIdx + 1}. {q.text}</p>
                                        {q.type === 'radio' && (
                                            <div className="flex flex-wrap gap-4 items-center">
                                                {q.options.map((opt, i) => (
                                                    <label key={i} className="flex items-center gap-1">
                                                        <input type="radio" disabled />
                                                        {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {q.type === 'text' && (
                                            <textarea disabled className="w-full border rounded p-2 text-sm" />
                                        )}
                                    </>
                                )}
                            </div>
                        ))}

                        {editMode && (
                            <button
                                onClick={() => addQuestion(sIdx)}
                                className="flex items-center gap-1 text-primary text-sm hover:underline mt-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                إضافة سؤال
                            </button>
                        )}
                    </div>
                ))}
            </section>

            {sendOpen && (
                <SendEvaluationModal
                    onClose={() => setSendOpen(false)}
                    formLink={submissionLink}
                />
            )}
        </div>
    );
}
