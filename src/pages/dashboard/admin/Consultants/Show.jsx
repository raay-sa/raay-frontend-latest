// src/pages/dashboard/admin/Consultants/Show.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import { ConsultantsService } from "../../../../services/consultantsService";
import {
    ArrowUturnLeftIcon,
    UserPlusIcon,
    TrashIcon,
    DocumentArrowDownIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";

export default function ConsultantShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [row, setRow] = useState(null);
    const [loading, setLoading] = useState(true);

    // تنسيق التاريخ
    const formatDate = (iso) => {
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

    // جلب البيانات
    const load = async () => {
        setLoading(true);
        try {
            const res = await ConsultantsService.show(id);
            if (res.data?.success) {
                setRow(res.data.row || res.data.data || res.data);
            } else {
                setRow(null);
            }
        } catch (e) {
            console.error("فشل الجلب:", e);
            setRow(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // تحويل إلى مدرب
    const handleConvert = async () => {
        try {
            await ConsultantsService.convertToTeacher(row.id);
            await load();
        } catch (e) {
            console.error("فشل التحويل:", e);
        }
    };

    // حذف
    const handleDelete = async () => {
        if (!window.confirm("هل تريد حذف هذا الحساب؟")) return;
        try {
            await ConsultantsService.delete(row.id);
            navigate("/admin/consultants");
        } catch (e) {
            console.error("فشل الحذف:", e);
        }
    };

    if (loading) return <PageSkeleton />;
    if (!row)
        return (
            <div className="p-6">
                <p>لا يوجد بيانات.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
                >
                    رجوع
                </button>
            </div>
        );

    const base = import.meta.env.VITE_BASE_URL;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">تفاصيل الاستشاري #{row.id}</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2"
                    >
                        <ArrowUturnLeftIcon className="w-5 h-5" />
                        رجوع
                    </button>

                    <button
                        onClick={handleConvert}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2"
                    >
                        <UserPlusIcon className="w-5 h-5" />
                        تحويل إلى مدرب
                    </button>

                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg flex items-center gap-2"
                    >
                        <TrashIcon className="w-5 h-5" />
                        حذف
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-6">
                <Field label="الاسم" value={row.name} />
                <Field label="البريد الإلكتروني" value={row.email} />
                <Field label="رقم الاتصال" value={row.phone} />
                <Field label="الحالة" value={row.status === "active" ? "نشط" : "غير نشط"} />
                <Field label="تاريخ الإنشاء" value={formatDate(row.created_at)} />
                <Field label="آخر تحديث" value={formatDate(row.updated_at)} />
                <Field
                    label="التخصصات"
                    value={
                        Array.isArray(row.categories) && row.categories.length
                            ? row.categories.map((c) => c.title).join("، ")
                            : "—"
                    }
                />
                <Field
                    label="السيرة الذاتية"
                    value={
                        row.cv ? (
                            <a
                                href={`${base}/${row.cv}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-primary underline"
                            >
                                <EyeIcon className="w-5 h-5" />
                            </a>
                        ) : "—"
                    }
                />
                <Field
                    label="الشهادة"
                    value={
                        row.certificate ? (
                            <a
                                href={`${base}/${row.certificate}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-primary underline"
                            >
                                <EyeIcon className="w-5 h-5" />
                            </a>
                        ) : "—"
                    }
                />
                <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">النبذة</p>
                    <div className="border rounded-lg p-4 whitespace-pre-wrap">
                        {row.bio || "—"}
                    </div>
                </div>
            </div>
        </div>
    );
}

// مكوّن حقل عرض مبسّط
function Field({ label, value }) {
    return (
        <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="font-medium">{value ?? "—"}</p>
        </div>
    );
}
