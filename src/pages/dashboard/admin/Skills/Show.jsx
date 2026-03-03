// src/pages/dashboard/admin/Skills/Show.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SkillsService } from "../../../../services/skillsService";
import { extractTranslation, getCurrentLocale } from "../../../../utils/translations";

export default function SkillShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [row, setRow] = useState(null);
    const [loading, setLoading] = useState(true);

    const fmt = (iso) => {
        if (!iso) return "-";
        const d = new Date(iso);
        if (isNaN(d)) return "-";
        return d.toLocaleString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await SkillsService.show(id);
                if (res.data?.success) {
                    const payload = res.data.row || res.data.data || res.data;
                    const locale = getCurrentLocale();
                    const category = payload?.category;
                    const normalized = category
                        ? { ...payload, category: { ...category, title: extractTranslation(category, "title", locale) } }
                        : payload;
                    setRow(normalized);
                } else setRow(null);
            } catch (e) {
                console.error("fetch failed", e);
                setRow(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div className="p-6">جاري التحميل...</div>;
    if (!row) return (
        <div className="p-6">
            <p>لا يوجد بيانات.</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">رجوع</button>
        </div>
    );

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">تفاصيل السؤال #{row.id}</h2>
                <div className="flex gap-2">
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">رجوع</button>
                    <button onClick={() => navigate(`/admin/skills/${row.id}/edit`)} className="px-4 py-2 bg-primary text-white rounded-lg">تعديل</button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-6">
                <Field label="السؤال" value={row.question} />
                <Field label="التخصص" value={row.category?.title || "—"} />
                <Field label="تاريخ الإنشاء" value={fmt(row.created_at)} />
                <Field label="آخر تحديث" value={fmt(row.updated_at)} />
            </div>
        </div>
    );
}

function Field({ label, value }) {
    return (
        <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="font-medium">{value ?? "—"}</p>
        </div>
    );
}
