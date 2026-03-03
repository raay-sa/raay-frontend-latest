import React, { useState } from "react";
import toast from "react-hot-toast";

// NEW: student service
import StudentSupportService from "../../../services/student/supportService";
// keep teacher service for teacher usage
import TeacherSupportService from "../../../services/teacher/supportService";

const MAX = 300;

export default function Support({ role = "student" }) {   // ← default student
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        const msg = content.trim();
        if (!msg) return toast.error("الرجاء كتابة رسالتك أولاً.");

        try {
            setLoading(true);
            // choose API by role
            const svc = role === "teacher" ? TeacherSupportService : StudentSupportService;
            await svc.create({ content: msg });
            toast.success("تم إرسال رسالتك بنجاح");
            setContent("");
        } catch (err) {
            console.error(err);
            toast.error("تعذر إرسال الرسالة");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6" dir="rtl">
            <h1 className="text-2xl font-bold text-center mb-6">تواصل معنا</h1>

            <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-4 md:p-6 max-w-5xl">
                <div className="mb-4 text-right">
                    <h2 className="text-xl font-bold mb-2">كيف نقدر نساعدك؟</h2>
                    <label className="font-semibold text-sm text-gray-700">المحتوى</label>
                </div>

                <div className="relative">
                    <textarea
                        rows={7}
                        maxLength={MAX}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="اكتب هنا رسالتك"
                        className="w-full border rounded-lg p-3 text-right outline-none"
                    />
                    <div className="absolute left-3 bottom-3 text-xs text-gray-400">
                        {MAX - content.length}
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !content.trim()}
                        className="bg-primary text-white px-6 py-2 rounded-lg disabled:opacity-60"
                    >
                        {loading ? "جارٍ الإرسال..." : "إضافة سؤال"}
                    </button>
                </div>
            </form>
        </div>
    );
}
