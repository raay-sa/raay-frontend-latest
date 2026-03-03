// src/components/Modals/TeacherRequestDetailsModal.jsx
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import RegisterRequestsService from "../../services/registerRequestsService";

export default function TeacherRequestDetailsModal({ open, onClose, teacherId }) {
    const [loading, setLoading] = useState(false);
    const [teacher, setTeacher] = useState(null);

    useEffect(() => {
        if (!open || !teacherId) return;
        (async () => {
            try {
                setLoading(true);
                const { data } = await RegisterRequestsService.showTeacher(teacherId);
                setTeacher(data?.data || data || null);
            } catch (e) {
                console.error("Failed to load teacher", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [open, teacherId]);

    if (!open) return null;

    return (
        <Modal>
            <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-xl mx-auto" dir="rtl">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg lg:text-xl font-bold">تفاصيل المدرب</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-primary text-sm lg:text-base">إغلاق</button>
                </div>

                {loading ? (
                    <div className="py-8 text-center">جاري التحميل…</div>
                ) : !teacher ? (
                    <div className="py-8 text-center text-red-600">تعذر تحميل البيانات</div>
                ) : (
                    <div className="space-y-3 text-sm">
                        <div><span className="font-semibold">الاسم: </span>{teacher.name}</div>
                        <div><span className="font-semibold">البريد: </span>{teacher.email}</div>
                        <div><span className="font-semibold">الهاتف: </span>{teacher.phone ?? "—"}</div>
                        <div><span className="font-semibold">الحالة: </span>{teacher.is_approved ? "مقبول" : "قيد المراجعة"}</div>
                        <div className="mt-2">
                            <span className="font-semibold">التخصصات: </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {(teacher.categories || []).map(c => (
                                    <span key={c.id} className="text-xs bg-gray-100 px-2 py-1 rounded">{c.title}</span>
                                ))}
                                {(!teacher.categories || teacher.categories.length === 0) && <span className="text-gray-500">—</span>}
                            </div>
                        </div>
                        {teacher.created_at && (
                            <div><span className="font-semibold">تاريخ التسجيل: </span>{new Date(teacher.created_at).toLocaleString()}</div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
