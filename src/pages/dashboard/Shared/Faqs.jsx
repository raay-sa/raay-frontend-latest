// src/pages/dashboard/Shared/Faqs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import CommonQuestionsService from "../../../services/commonQuestionsService";

export default function Faqs() {
    // Detect role from the current route prefix
    const { pathname } = useLocation();
    const role = useMemo(() => {
        if (pathname.startsWith("/teacher")) return "teacher";
        if (pathname.startsWith("/admin")) return "admin";
        return "student";
    }, [pathname]);

    const [faqs, setFaqs] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await CommonQuestionsService.list(role);
                const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
                const mapped = rows.map((r) => ({
                    id: r.id,
                    question: r.question ?? "—",
                    answer: r.answer ?? "",
                }));
                if (mounted) setFaqs(mapped);
            } catch (e) {
                console.error("Failed to load FAQs:", e);
                if (mounted) setFaqs([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [role]);

    const toggleExpand = (idx) => {
        setExpanded(expanded === idx ? null : idx);
    };

    return (
        <div className="p-8" dir="rtl">
            <h1 className="text-2xl font-bold mb-6">الأسئلة الشائعة</h1>

            <div className="space-y-4">
                {loading ? (
                    <>
                        <div className="h-14 bg-gray-100 rounded animate-pulse" />
                        <div className="h-14 bg-gray-100 rounded animate-pulse" />
                        <div className="h-14 bg-gray-100 rounded animate-pulse" />
                    </>
                ) : faqs.length === 0 ? (
                    <div className="text-gray-500 text-center py-10">لا توجد أسئلة حالياً</div>
                ) : (
                    faqs.map((faq, idx) => (
                        <div key={faq.id ?? idx} className="border rounded-lg overflow-hidden bg-white">
                            <button
                                onClick={() => toggleExpand(idx)}
                                className="w-full flex items-center justify-between px-6 py-4 text-right"
                            >
                                <span className="font-medium">{idx + 1}. {faq.question}</span>
                                {expanded === idx ? (
                                    <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                            {expanded === idx && (
                                <div className="px-6 pb-4 text-gray-700 leading-relaxed">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
