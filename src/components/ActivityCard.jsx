// src/pages/dashboard/components/ActivityCard.jsx
import { Link, useNavigate } from "react-router-dom";

export default function ActivityCard({ a }) {
    const navigate = useNavigate();
    return (
        <div className="bg-white p-5 rounded-lg shadow relative">
            <span
                className={`absolute top-4 left-4 px-2 py-1 text-xs rounded-full
        ${a.status === "not-submitted" ? "bg-gray-100 text-gray-500"
                        : a.status === "not-submitted-past" ? "bg-red-100 text-red-600"
                            : a.status === "submitted" ? "bg-gray-100 text-gray-500"
                                : a.status === "awaiting-mark" ? "bg-yellow-100 text-yellow-700"
                                    : a.status === "graded-success" ? "bg-green-100 text-green-600"
                                        : a.status === "not-passed" ? "bg-red-100 text-red-600"
                                            : a.status === "passed" ? "bg-green-100 text-green-600" : ""}`}
            >
                {a.status === "not-submitted" && "لم يتم التسليم"}
                {a.status === "not-submitted-past" && "انتهى الوقت"}
                {a.status === "submitted" && "تم التسليم"}
                {a.status === "awaiting-mark" && "قيد التقييم"}
                {a.status === "graded-success" && "تم التصحيح"}
                {a.status === "not-passed" && "لم تجتز"}
                {a.status === "passed" && "ناجح"}
            </span>

            <h3 className="font-semibold text-secondary text-lg mb-1">{a.kind} – {a.path}</h3>
            {a.kind === "اختبار" && a.isMarked ? (
                <button
                    type="button"
                    onClick={() =>
                        navigate(`/student/assignments/exams/${String(a.id).replace("E-", "")}/recontentview`, {
                            state: {
                                score: a.numericGrade ?? 0,
                                canRetry: (a.remainingTries ?? 0) > 0,
                                successRate: a.successRate ?? 70,
                                examMeta: { title: a.title },
                            },
                        })
                    }
                    className="font-semibold text-gray-800 mb-2 hover:underline text-right block"
                >
                    {a.title}
                </button>
            ) : a.kind === "مهمة" && a.isMarked ? (
                <Link to={`/student/assignments/tasks/${String(a.id).replace("A-", "")}`} className="font-semibold text-gray-800 mb-2 hover:underline block text-right">
                    {a.title}
                </Link>
            ) : (
                <p className="font-semibold text-gray-800 mb-2">{a.title}</p>
            )}

            {a.kind === "مهمة" && a.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{a.description}</p>
            )}

            {a.kind === "اختبار" && (
                <div className="flex flex-col items-start text-sm text-gray-600 gap-2 mb-3">
                    <div><span className="text-md font-semibold text-black">عدد الأسئلة: </span>{a.questions ?? 0}</div>
                    <div><span className="text-md font-semibold text-black">مدة الاختبار: </span>{a.duration}</div>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
                {a.kind === "مهمة" ? (
                    <>
                        <div className="mb-2">
                            <span className="font-semibold text-black">تاريخ التسليم : </span>
                            {a.dueDate} – الساعة {a.dueTime}
                        </div>

                        {a.status === "not-submitted" && (
                            <Link to={`/student/assignments/tasks/${String(a.id).replace("A-", "")}`} className="inline-flex items-center gap-1 px-4 py-1 bg-primary text-white rounded-lg text-sm">
                                إرفاق الملف
                            </Link>
                        )}

                        {a.status === "graded-success" && (
                            <div className="text-green-600 font-semibold">
                                <span className="font-semibold text-black">درجة التقييم : </span>{a.grade}
                            </div>
                        )}

                        {a.status === "submitted" && (
                            <span className="text-yellow-700 bg-yellow-50 px-3 py-1 rounded-lg">تم التسليم – بانتظار التقييم</span>
                        )}
                    </>
                ) : (
                    <>
                        {a.status === "ready-to-start" && (
                            <Link to={`/student/assignments/exams/${String(a.id).replace("E-", "")}`} className="inline-flex items-center gap-1 px-4 py-1 bg-primary text-white rounded-lg text-sm">
                                بدء الاختبار
                            </Link>
                        )}

                        {a.status === "awaiting-mark" && (
                            <span className="text-yellow-700 bg-yellow-50 px-3 py-1 rounded-lg">تم الإنهاء – بانتظار التقييم</span>
                        )}

                        {a.status === "not-passed" && (
                            <div className="flex items-center gap-2">
                                {a.remainingTries > 0 ? (
                                    <Link to={`/student/assignments/exams/${String(a.id).replace("E-", "")}`} className="px-4 py-1 bg-primary text-white rounded-lg text-sm">
                                        إعادة المحاولة
                                    </Link>
                                ) : (
                                    <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600">لا توجد محاولات متبقية</span>
                                )}
                                <Link
                                    to={`/student/assignments/exams/${String(a.id).replace("E-", "")}/review`}
                                    state={{ score: a.numericGrade ?? 0, canRetry: (a.remainingTries ?? 0) > 0, successRate: a.successRate ?? 70, examMeta: { title: a.title } }}
                                    className="px-3 py-1 rounded-lg bg-secondary text-white text-sm"
                                >
                                    عرض الإجابات
                                </Link>
                            </div>
                        )}

                        {a.status === "passed" && (
                            <div className="flex items-center gap-3">
                                <div className="text-green-600 font-semibold">ناجح{a.grade ? ` – درجة ${a.grade}` : ""}</div>
                                <Link
                                    to={`/student/assignments/exams/${String(a.id).replace("E-", "")}/review`}
                                    state={{ score: a.numericGrade ?? 0, canRetry: false, successRate: a.successRate ?? 70, examMeta: { title: a.title } }}
                                    className="px-3 py-1 rounded-lg bg-secondary text-white text-sm"
                                >
                                    عرض الإجابات
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
