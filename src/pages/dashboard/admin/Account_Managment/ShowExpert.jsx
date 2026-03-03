import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import RegisterRequestsService from "../../../../services/registerRequestsService";
import { AccountsService } from "../../../../services/accountsService";

export default function ShowExpert() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [teacher, setTeacher] = useState(null);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            // You can use either service; sticking with AccountsService to match EditExpert’s source
            const res = await AccountsService.getTeacher(id);
            if (res?.data?.success) {
                setTeacher(res.data.row);
            } else {
                setError("تعذر جلب بيانات الخبير.");
            }
        } catch (e) {
            console.error(e);
            setError("حدث خطأ أثناء تحميل بيانات الخبير.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const isInactive = useMemo(() => teacher?.status === "inactive", [teacher]);

    const onApprove = async () => {
        if (!teacher) return;
        try {
            await RegisterRequestsService.approveTeacher(teacher.id);
            await load();
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء قبول الخبير.");
        }
    };

    const onReject = async () => {
        if (!teacher) return;
        if (!window.confirm("هل أنت متأكد من رفض/عدم قبول هذا الخبير؟")) return;
        try {
            await RegisterRequestsService.rejectTeacher(teacher.id);
            // after rejection, navigate back to register-requests list
            navigate("/admin/accounts/register-requests");
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء رفض الخبير.");
        }
    };

    const formatDateTime = (iso) => {
        if (!iso) return "—";
        const d = new Date(iso);
        if (isNaN(d)) return "—";
        return d.toLocaleString("ar-EG", { hour12: true });
    };

    return (
        <div className="p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">إدارة الحسابات</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 rounded-lg bg-primary text-white"
                    >
                        رجوع
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">عرض حساب الخبير</h2>
                    {teacher && (
                        <span
                            className={`px-3 py-1 text-sm rounded-full ${teacher.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}
                            title={`created: ${formatDateTime(teacher.created_at)}`}
                        >
                            {teacher.status === "active" ? "نشط" : "غير نشط"}
                        </span>
                    )}
                </div>

                {loading && <div>جارٍ التحميل...</div>}
                {error && (
                    <div className="text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
                )}

                {!loading && teacher && (
                    <div className="space-y-6">
                        {/* Top section with avatar + basic info */}
                        <div className="flex gap-6 items-start">
                            <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                {teacher.image ? (
                                    <img
                                        src={`/${teacher.image}`}
                                        alt={teacher.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-sm">لا توجد صورة</span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                <div>
                                    <div className="text-gray-500 text-sm mb-1">الاسم</div>
                                    <div className="font-medium">{teacher.name || "—"}</div>
                                </div>

                                <div>
                                    <div className="text-gray-500 text-sm mb-1">البريد الإلكتروني</div>
                                    <div className="font-medium">{teacher.email || "—"}</div>
                                </div>

                                <div>
                                    <div className="text-gray-500 text-sm mb-1">رقم الاتصال</div>
                                    <div className="font-medium">{teacher.phone || "—"}</div>
                                </div>

                                <div>
                                    <div className="text-gray-500 text-sm mb-1">تاريخ الإنشاء</div>
                                    <div className="font-medium">
                                        {formatDateTime(teacher.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <div className="text-gray-500 text-sm mb-2">التخصص</div>
                            <div className="flex flex-wrap gap-2">
                                {Array.isArray(teacher.categories) && teacher.categories.length > 0 ? (
                                    teacher.categories.map((c) => (
                                        <span
                                            key={c.id}
                                            className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                                        >
                                            {c.title}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </div>
                        </div>

                        {/* Certificate / CV / Links */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-gray-500 text-sm mb-1">الشهادة</div>
                                {teacher.certificate ? (
                                    <a
                                        href={`/${teacher.certificate}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        عرض الشهادة
                                    </a>
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </div>

                            <div>
                                <div className="text-gray-500 text-sm mb-1">السيرة الذاتية</div>
                                {teacher.cv ? (
                                    <a
                                        href={`/${teacher.cv}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        عرض السيرة الذاتية
                                    </a>
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </div>
                        </div>

                        {/* Actions when inactive */}
                        {isInactive && (
                            <div className="flex items-center gap-3 pt-4 border-t">
                                <button
                                    onClick={onApprove}
                                    className="px-4 py-2 rounded-lg bg-primary text-white"
                                >
                                    قبول
                                </button>
                                <button
                                    onClick={onReject}
                                    className="px-4 py-2 rounded-lg bg-red-100 text-red-700"
                                >
                                    رفض
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
