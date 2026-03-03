// src/pages/dashboard/admin/ContactUs/Show.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import { ContactUsService } from "../../../../services/contactUsService";
import { ArrowUturnLeftIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import { extractTranslation } from "../../../../utils/translations";

export default function ContactUsShow() {
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
            const res = await ContactUsService.show(id);
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
            await ContactUsService.updateStatus(row.id, 1);
            await load();
        } catch (e) {
            console.error("status update failed", e);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("هل تريد الحذف؟")) return;
        try {
            await ContactUsService.delete(row.id);
            navigate("/admin/contact-us");
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
                <h2 className="text-2xl font-bold">تفاصيل طلب التواصل #{row.id}</h2>
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
                <Field label="الموضوع" value={row.subject} />
                <Field label="تاريخ الإنشاء" value={fmt(row.created_at)} />
                <Field label="آخر تحديث" value={fmt(row.updated_at)} />
                <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">الرسالة</p>
                    <div className="border rounded-lg p-4 whitespace-pre-wrap">{row.message || "—"}</div>
                </div>
            </div>

            {row.program && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold mb-4">معلومات البرنامج</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <Field label="اسم البرنامج" value={extractTranslation(row.program, "title", "ar")} />
                        <Field label="معرف البرنامج" value={row.program.id} />
                        <Field label="النوع" value={row.program.type === "onsite" ? "حضوري" : row.program.type === "online" ? "عن بعد" : "هجين"} />
                        <Field label="المستوى" value={row.program.level} />
                        <Field label="السعر" value={row.program.price ? `${row.program.price} ريال` : "—"} />
                        {row.program.address && (
                            <Field label="العنوان" value={row.program.address} />
                        )}
                        {row.program.date_from && (
                            <Field label="تاريخ البداية" value={fmt(row.program.date_from)} />
                        )}
                        {row.program.date_to && (
                            <Field label="تاريخ النهاية" value={fmt(row.program.date_to)} />
                        )}
                        {row.program.teacher && (
                            <Field label="اسم المدرب" value={row.program.teacher.name} />
                        )}
                        {row.program.category && (
                            <Field label="الفئة" value={extractTranslation(row.program.category, "title", "ar")} />
                        )}
                        <div className="col-span-2">
                            <button
                                onClick={() => navigate(`/admin/programs/${row.program.id}/report`)}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                عرض تفاصيل البرنامج
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
