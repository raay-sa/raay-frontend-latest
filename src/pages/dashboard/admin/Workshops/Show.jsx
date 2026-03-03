// src/pages/dashboard/admin/Workshops/Show.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageSkeleton from "../../../../components/Loaders/PageSkeleton";
import { WorkshopsService } from "../../../../services/workshopsService";
import { ArrowUturnLeftIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function WorkshopShow() {
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
      const res = await WorkshopsService.show(id);
      if (res.data?.success) setRow(res.data.data || res.data.row || res.data);
      else setRow(null);
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

  const handleStatus = async (status) => {
    try {
      await WorkshopsService.update(id, { status });
      await load();
    } catch (e) {
      console.error("status update failed", e);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("هل تريد الحذف؟")) return;
    try {
      await WorkshopsService.delete(row.id);
      navigate(-1);
    } catch (e) {
      console.error("delete failed", e);
    }
  };

  if (loading) return <PageSkeleton />;
  if (!row) return <div className="p-6" dir="rtl">غير موجود</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">تفاصيل طلب ورشة العمل</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" /> رجوع
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
          >
            <TrashIcon className="w-5 h-5" /> حذف
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="font-semibold mb-2">البيانات الأساسية</div>
          <div className="space-y-1 text-sm">
            <div>الاسم الكامل: {row.full_name || '-'}</div>
            <div>البريد الإلكتروني: {row.email || '-'}</div>
            <div>رقم الجوال: {row.phone || '-'}</div>
            <div>المنظمة: {row.organization || '-'}</div>
            <div>المسمى الوظيفي: {row.job_title || '-'}</div>
            <div>عنوان الورشة: {row.workshop_title || '-'}</div>
            <div>عدد المشاركين: {row.participants_count ?? '-'}</div>
            <div>تاريخ الإنشاء: {fmt(row.created_at)}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="font-semibold mb-2">طلبات خاصة</div>
          <div className="text-sm whitespace-pre-wrap">{row.special_requests || '-'}</div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="font-semibold mb-2">الحالة</div>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatus("pending")}
              className={`px-3 py-2 rounded-lg ${row.status === "pending" ? "bg-yellow-200" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              قيد المراجعة
            </button>
            <button
              onClick={() => handleStatus("approved")}
              className={`px-3 py-2 rounded-lg ${row.status === "approved" ? "bg-green-200" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              قبول
            </button>
            <button
              onClick={() => handleStatus("rejected")}
              className={`px-3 py-2 rounded-lg ${row.status === "rejected" ? "bg-red-200" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              رفض
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


