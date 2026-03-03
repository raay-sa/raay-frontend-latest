import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowUturnLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { EvaluationsService } from "../../../services/evaluationsService";

export default function StudentEvaluationForm() {
    const { slug: rawSlug } = useParams();
    const slug = decodeURIComponent(rawSlug || "");
    const nav = useNavigate();

    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(null); // { sections: [...] }
    const [answers, setAnswers] = useState({}); // { [question_id]: string | string[] }
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState(""); // <-- show server error messages here

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await EvaluationsService.getStudentForm(slug);
                const data = res?.data?.data || null;

                setForm({
                    id: data?.id,
                    program_id: data?.program_id,
                    sections: (data?.sections || []).map((sec) => ({
                        id: sec.id,
                        title: sec.title,
                        questions: (sec.questions || []).map((q) => ({
                            id: q.id,
                            text: q.title,
                            type: q.type, // 'radio' | 'text' | (maybe 'checkbox')
                            is_required: !!q.is_required,
                            options: (q.options || []).map((o) => ({ id: o.id, title: o.title })),
                        })),
                    })),
                });

                // init answers
                const init = {};
                for (const sec of data?.sections || []) {
                    for (const q of sec.questions || []) {
                        init[q.id] = q.type === "checkbox" ? [] : "";
                    }
                }
                setAnswers(init);
            } catch (e) {
                console.error("Failed to load evaluation form:", e);
                setForm(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const requiredMissing = useMemo(() => {
        if (!form) return [];
        const missing = [];
        for (const sec of form.sections || []) {
            for (const q of sec.questions || []) {
                if (!q.is_required) continue;
                const v = answers[q.id];
                if (q.type === "checkbox") {
                    if (!Array.isArray(v) || v.length === 0) missing.push(q.id);
                } else {
                    if (v == null || String(v).trim() === "") missing.push(q.id);
                }
            }
        }
        return missing;
    }, [form, answers]);

    const setRadio = (qid, value) => {
        setErrorMsg("");
        setAnswers((prev) => ({ ...prev, [qid]: value }));
    };

    const setText = (qid, value) => {
        setErrorMsg("");
        setAnswers((prev) => ({ ...prev, [qid]: value }));
    };

    const toggleCheckbox = (qid, opt) => {
        setErrorMsg("");
        setAnswers((prev) => {
            const current = Array.isArray(prev[qid]) ? prev[qid] : [];
            const exists = current.includes(opt);
            return { ...prev, [qid]: exists ? current.filter((x) => x !== opt) : [...current, opt] };
        });
    };

    const handleSubmit = async () => {
        if (!form) return;

        if (requiredMissing.length > 0) {
            setErrorMsg("يرجى الإجابة على جميع الأسئلة المطلوبة.");
            // smooth scroll to the error
            setTimeout(() => document.getElementById("eval-error")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            return;
        }

        const payload = {
            program_slug: slug,
            answers: [],
        };

        for (const sec of form.sections || []) {
            for (const q of sec.questions || []) {
                const v = answers[q.id];
                if (q.type === "checkbox") {
                    payload.answers.push({ question_id: q.id, answer: Array.isArray(v) ? v : [] });
                } else {
                    payload.answers.push({ question_id: q.id, answer: v ?? "" });
                }
            }
        }

        try {
            setSubmitting(true);
            setErrorMsg("");
            await EvaluationsService.submitStudentForm(payload);
            setSubmitted(true);
        } catch (e) {
            console.error("Submit evaluation failed:", e);
            const apiMsg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                e?.message ||
                "فشل إرسال الاستمارة. حاول مجددًا.";
            setErrorMsg(apiMsg); // <-- shows "لقد قمت بتقييم هذا النموذج مسبقًا." etc.
            setSubmitted(false);
            setTimeout(() => document.getElementById("eval-error")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-3 lg:p-6">جاري التحميل…</div>;

    if (!form) {
        return (
            <div className="p-3 lg:p-6 space-y-4" dir="rtl">
                <button
                    onClick={() => nav(-1)}
                    className="flex items-center px-3 sm:px-4 py-2 gap-1 text-xs sm:text-sm bg-primary border-primary text-white rounded-lg"
                >
                    <ArrowUturnLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    عودة
                </button>
                <div className="text-red-600 text-sm sm:text-base">تعذر تحميل الاستمارة.</div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="p-3 lg:p-6 space-y-4 lg:space-y-6" dir="rtl">
                <div className="bg-white rounded-lg p-4 sm:p-8 shadow text-center space-y-3">
                    <CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 inline text-green-600" />
                    <h2 className="text-xl sm:text-2xl font-bold">تم استلام استجابتك</h2>
                    <p className="text-gray-600 text-sm sm:text-base">شكرًا لمشاركتك في تحسين جودة البرنامج.</p>
                    <button
                        onClick={() => nav("/student/courses")}
                        className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-sm sm:text-base"
                    >
                        العودة إلى الدورات
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 lg:p-6 space-y-6 lg:space-y-8" dir="rtl">
            <button
                onClick={() => nav(-1)}
                className="flex items-center px-3 sm:px-4 py-2 gap-1 text-xs sm:text-sm bg-primary border-primary text-white rounded-lg"
            >
                <ArrowUturnLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                العودة
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-bold">استمارة تقييم برنامج تدريبي</h1>
                <div className="text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold">اسم البرنامج: </span>
                    <span>{slug || "—"}</span>
                </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
                <div
                    id="eval-error"
                    role="alert"
                    className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3"
                >
                    <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                    <div className="text-xs sm:text-sm">{errorMsg}</div>
                </div>
            )}

            <section className="space-y-4 lg:space-y-6">
                {(form.sections || []).map((section, sIdx) => (
                    <div key={section.id} className="space-y-3 lg:space-y-4">
                        <h2 className="font-semibold text-base sm:text-lg">{section.title}</h2>

                        {(section.questions || []).map((q, qIdx) => {
                            const isMissing = requiredMissing.includes(q.id);
                            return (
                                <div
                                    key={q.id}
                                    className={`space-y-3 border rounded-lg p-3 sm:p-4 ${isMissing ? "bg-red-50 border-red-200" : "bg-gray-50"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-sm sm:text-base">
                                            {qIdx + 1}. {q.text}{" "}
                                            {q.is_required && <span className="text-red-500">*</span>}
                                        </p>
                                    </div>

                                    {q.type === "radio" && (
                                        <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
                                            {(q.options || []).map((opt) => (
                                                <label key={opt.id} className="flex items-center gap-2 text-sm sm:text-base">
                                                    <input
                                                        type="radio"
                                                        name={`q-${q.id}`}
                                                        checked={answers[q.id] === opt.title}
                                                        onChange={() => setRadio(q.id, opt.title)}
                                                    />
                                                    <span>{opt.title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === "checkbox" && (
                                        <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
                                            {(q.options || []).map((opt) => {
                                                const sel = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                                                const checked = sel.includes(opt.title);
                                                return (
                                                    <label key={opt.id} className="flex items-center gap-2 text-sm sm:text-base">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleCheckbox(q.id, opt.title)}
                                                        />
                                                        <span>{opt.title}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {q.type === "text" && (
                                        <textarea
                                            className="w-full border rounded p-2 text-xs sm:text-sm"
                                            placeholder="إجابتك…"
                                            value={answers[q.id] || ""}
                                            onChange={(e) => setText(q.id, e.target.value)}
                                            rows={3}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </section>

            <div className="flex items-center justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-4 sm:px-6 py-2 bg-secondary text-white rounded-lg text-sm sm:text-base"
                >
                    {submitting ? "جارٍ الإرسال…" : "إرسال الاستمارة"}
                </button>
            </div>
        </div>
    );
}
