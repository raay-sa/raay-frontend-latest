// src/pages/dashboard/admin/Website/Consulting/Show.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import { ConsultingService } from "../../../../services/consultingService";
import { ArrowUturnLeftIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function ConsultingShow() {
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

    const load = async () => {
        setLoading(true);
        try {
            const res = await ConsultingService.show(id);
            if (res.data?.success) setRow(res.data.data || res.data.row || res.data);
            else setRow(null);
        } catch (e) {
            console.error("fetch show failed", e);
            setRow(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

    const markAsRead = async () => {
        try {
            await ConsultingService.updateStatus(row.id, 1);
            await load();
        } catch (e) {
            console.error("status update failed", e);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("هل تريد الحذف؟")) return;
        try {
            await ConsultingService.delete(row.id);
            navigate("/admin/consulting");
        } catch (e) {
            console.error("delete failed", e);
        }
    };

    if (loading) return <PageSkeleton />;
    if (!row) return (
        <div className="p-6">
            <p>لا يوجد بيانات.</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">رجوع</button>
        </div>
    );

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">تفاصيل طلب الاستشارة #{row.id}</h2>
                <div className="flex gap-2">
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2">
                        <ArrowUturnLeftIcon className="w-5 h-5" /> رجوع
                    </button>
                    {Number(row.status) !== 1 && (
                        <button onClick={markAsRead} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                            <CheckIcon className="w-5 h-5" /> تعيين كمقروء
                        </button>
                    )}
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg flex items-center gap-2">
                        <TrashIcon className="w-5 h-5" /> حذف
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-6">
                <Field label="الاسم" value={row.name} />
                <Field label="البريد الإلكتروني" value={row.email} />
                <Field label="رقم الاتصال" value={row.phone} />
                <Field label="الشركة" value={row.company} />
                <Field label="التخصص" value={row.type} />
                <Field label="المسمى الوظيفي" value={row.job_title} />
                <Field label="التاريخ" value={row.date} />
                <Field label="طريقة التواصل" value={row.contact_way} />
                <Field label="تاريخ الإنشاء" value={fmt(row.created_at)} />
                <Field label="آخر تحديث" value={fmt(row.updated_at)} />
                <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">الوصف</p>
                    <div className="border rounded-lg p-4 whitespace-pre-wrap">{row.description || "—"}</div>
                </div>
                <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">معلومات إضافية</p>
                    <div className="border rounded-lg p-4 whitespace-pre-wrap">{row.additional_info || "—"}</div>
                </div>
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
