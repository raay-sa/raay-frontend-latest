// src/pages/dashboard/admin/Skills/Create.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SkillsService } from "../../../../services/skillsService";
import { PublicService } from "../../../../services/publicService";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function SkillCreate() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ category_id: "", questions: [""] });

    // Fetch categories for dropdown
    useEffect(() => {
        PublicService.getCategories().then((res) => {
            const paged = res.data?.data;
            const list = Array.isArray(paged?.data) ? paged.data : (res.data?.data || []);
            // Process categories to extract titles from translations
            const processedCategories = list.map(category => {
                if (category.translations && Array.isArray(category.translations)) {
                    const arTranslation = category.translations.find(t => t.locale === 'ar');
                    return {
                        ...category,
                        title: arTranslation?.title || category.title || ''
                    };
                }
                return category;
            });
            setCategories(processedCategories);
        });
    }, []);

    const handleAddQuestion = () => {
        setForm((f) => ({ ...f, questions: [...f.questions, ""] }));
    };

    const handleRemoveQuestion = (index) => {
        setForm((f) => ({
            ...f,
            questions: f.questions.filter((_, i) => i !== index),
        }));
    };

    const handleQuestionChange = (index, value) => {
        setForm((f) => ({
            ...f,
            questions: f.questions.map((q, i) => (i === index ? value : q)),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Filter out empty questions
        const validQuestions = form.questions
            .map(q => q.trim())
            .filter(q => q !== "");
        
        if (validQuestions.length === 0) {
            alert("يرجى إدخال سؤال واحد على الأقل");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                category_id: form.category_id,
            };
            
            // If single question, send 'question', otherwise send 'questions' array
            if (validQuestions.length === 1) {
                payload.question = validQuestions[0];
            } else {
                payload.questions = validQuestions;
            }
            
            await SkillsService.create(payload);
            navigate("/admin/skills");
        } catch (e) {
            console.error("create failed", e);
            alert("فشل إنشاء المهارة. يرجى المحاولة مرة أخرى.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h2 className="text-2xl font-bold">إضافة مهارة</h2>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-6">
                <div>
                    <label className="block mb-1">التخصص</label>
                    <select
                        value={form.category_id}
                        onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                        className="w-full border rounded-xl py-2 px-3"
                        required>
                        <option value="">اختر التخصص</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2">
                    <div className="flex items-center justify-between mb-3">
                        <label className="block">الأسئلة</label>
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                            <PlusIcon className="w-4 h-4" />
                            إضافة سؤال
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {form.questions.map((question, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                                    className="flex-1 border rounded-xl py-2 px-3"
                                    placeholder={`السؤال ${index + 1}`}
                                    required={form.questions.length === 1}
                                />
                                {form.questions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestion(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="حذف السؤال"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-2 flex gap-3">
                    <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg">إلغاء</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg">
                        {saving ? "جاري الحفظ..." : "حفظ"}
                    </button>
                </div>
            </form>
        </div>
    );
}
