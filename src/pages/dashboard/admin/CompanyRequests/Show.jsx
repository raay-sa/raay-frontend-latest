// src/pages/dashboard/admin/CompanyRequests/Show.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import { CompanyRequestService } from "../../../../services/companyRequestService";
import {
    ArrowUturnLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

export default function CompanyRequestShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [row, setRow] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const load = async () => {
        setLoading(true);
        try {
            const res = await CompanyRequestService.show(id);
            if (res.data?.success) {
                setRow(res.data.data || res.data.row || res.data); // مرونة حسب الاستجابة
            } else {
                setRow(null);
            }
        } catch (e) {
            console.error("fetch show failed", e);
            setRow(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const toggleStatus = async () => {
        if (!row) return;
        const next = String(row.status) === "1" ? 0 : 1;
        try {
            await CompanyRequestService.updateStatus(row.id, next);
            await load();
        } catch (e) {
            console.error("toggle failed", e);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("هل تريد حذف هذا الطلب؟")) return;
        try {
            await CompanyRequestService.delete(row.id);
            navigate("/admin/company-requests");
        } catch (e) {
            console.error("delete failed", e);
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

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">تفاصيل طلب الشركة #{row.id}</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2"
                    >
                        <ArrowUturnLeftIcon className="w-5 h-5" />
                        رجوع
                    </button>
                    <button
                        onClick={toggleStatus}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${String(row.status) === "1"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                    >
                        {String(row.status) === "1" ? (
                            <>
                                <XCircleIcon className="w-5 h-5" /> تحديد كغير مقروء
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-5 h-5" /> تحديد كمقروء
                            </>
                        )}
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
                <Field label="الشركة" value={row.company} />
                <Field label="البرنامج" value={row.program || "—"} />
                <Field label="المسمى الوظيفي" value={row.job_title} />
                <Field label="عدد المتدربين" value={row.trainers_count ?? 0} />
                <Field
                    label="الحالة"
                    value={String(row.status) === "1" ? "مقروء" : "غير مقروء"}
                />
                <Field label="تاريخ الإنشاء" value={formatDate(row.created_at)} />
                <Field label="آخر تحديث" value={formatDate(row.updated_at)} />
                <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">الملاحظات</p>
                    <div className="border rounded-lg p-4 whitespace-pre-wrap">
                        {row.notes || "—"}
                    </div>
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
