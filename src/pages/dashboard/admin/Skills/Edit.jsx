// src/pages/dashboard/admin/Skills/Edit.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SkillsService } from "../../../../services/skillsService";
import { PublicService } from "../../../../services/publicService";

export default function SkillEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ category_id: "", question: "" });
    const [loading, setLoading] = useState(true);

    // Fetch categories and existing data
    useEffect(() => {
        const load = async () => {
            try {
                const [catsRes, showRes] = await Promise.all([PublicService.getCategories(), SkillsService.show(id)]);
                const paged = catsRes.data?.data;
                const list = Array.isArray(paged?.data) ? paged.data : (catsRes.data?.data || []);
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

                if (showRes.data?.success) {
                    const row = showRes.data.row || showRes.data.data || showRes.data;
                    setForm({
                        category_id: row.category_id ?? "",
                        question: row.question ?? "",
                    });
                }
            } catch (e) {
                console.error("prefetch failed", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await SkillsService.update(id, {
                category_id: form.category_id,
                question: form.question,
            });
            navigate("/admin/skills");
        } catch (e) {
            console.error("update failed", e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6">جاري التحميل...</div>;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h2 className="text-2xl font-bold">تعديل مهارة</h2>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-6">
                <div>
                    <label className="block mb-1">التخصص</label>
                    <select
                        value={form.category_id}
                        onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                        className="w-full border rounded-xl py-2 px-3"
                        required
                    >
                        <option value="">اختر التخصص</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2">
                    <label className="block mb-1">السؤال</label>
                    <input
                        type="text"
                        value={form.question}
                        onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                        className="w-full border rounded-xl py-2 px-3"
                        placeholder="أدخل السؤال"
                        required
                    />
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
