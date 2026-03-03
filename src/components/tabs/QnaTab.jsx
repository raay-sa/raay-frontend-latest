// src/pages/dashboard/components/tabs/QnaTab.jsx
import { useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export default function QnaTab({
    discussions, hasMore, loadMore, submitQuestion, submitReply,
    currentSessionId, setQnaFilter, qnaFilter
}) {
    const [askMode, setAskMode] = useState(false);
    const [qTitle, setQTitle] = useState("");
    const [qBody, setQBody] = useState("");
    const [replyOpen, setReplyOpen] = useState({});
    const [replyText, setReplyText] = useState({});

    return askMode ? (
        <div className="mt-8 space-y-4">
            <button onClick={() => setAskMode(false)} className="px-4 py-2  bg-primary text-white rounded-lg">العودة إلى الأسئلة</button>
            <div className="space-y-5 font-bold">
                <label>العنوان او الملخص</label>
                <input className="w-full border border-gray-300 rounded-lg px-4 py-2" value={qTitle} onChange={(e) => setQTitle(e.target.value)} />
            </div>
            <div className="space-y-5 font-bold">
                <label>التفاصيل (اختياري)</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32" value={qBody} onChange={(e) => setQBody(e.target.value)} />
            </div>
            <button onClick={() => submitQuestion(qTitle, qBody, () => { setQTitle(""); setQBody(""); setAskMode(false); })} className="w-full py-2 bg-primary text-white rounded-lg">نشر</button>
        </div>
    ) : (
        <>
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative inline-block">
                    <button onClick={() => setQnaFilter(qnaFilter === "all" ? "current" : "all")} className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm">
                        {qnaFilter === "all" ? "جميع الجلسات" : "الجلسة الحالية"}
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <button onClick={() => setAskMode(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">أضف سؤال</button>
            </div>

            <div className="space-y-6 mt-4">
                {discussions.map((d) => (
                    <div key={d.id} className="space-y-2">
                        <div className="flex items-start">
                            <div className="flex items-center gap-4">
                                <img src="/thumbnails/avatar.png" alt={d.sender?.name || "user"} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-medium">{d.sender?.name || "—"}</p>
                                    <p className="text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString("ar-EG")}</p>
                                </div>
                            </div>
                        </div>
                        <h1 className="text-lg font-semibold text-black">{d.title}</h1>
                        <p className="text-gray-700 leading-relaxed">{d.description}</p>

                        <div className="flex items-center gap-4 text-sm">
                            <button className="px-3 py-1 bg-primary text-white rounded-lg">تعليقات</button>
                            <button className="px-3 py-1 bg-gray-100 rounded-lg" onClick={() => setReplyOpen((m) => ({ ...m, [d.id]: !m[d.id] }))}>الردود</button>
                        </div>

                        {replyOpen[d.id] && (
                            <>
                                <div className="pl-12 space-y-1">
                                    {(d.replies || []).map((r) => (
                                        <div key={r.id} className="space-y-1 mb-2">
                                            <div className="flex items-center gap-4">
                                                <img src="/thumbnails/avatar.png" alt={r.sender?.name || "user"} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className="font-medium">{r.sender?.name || "—"}</p>
                                                    <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("ar-EG")}</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-700">{r.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pl-12">
                                    <div className="flex items-center gap-2">
                                        <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2}
                                            value={replyText[d.id] || ""} onChange={(e) => setReplyText((m) => ({ ...m, [d.id]: e.target.value }))} />
                                        <button onClick={() => submitReply(d, replyText[d.id], () => setReplyText((m) => ({ ...m, [d.id]: "" })))} className="px-4 py-2 bg-primary text-white rounded-lg">إرسال</button>
                                    </div>
                                </div>
                            </>
                        )}
                        <hr />
                    </div>
                ))}
                {hasMore && <button onClick={loadMore} className="px-6 py-2 bg-primary text-white rounded-lg">تحميل المزيد</button>}
            </div>
        </>
    );
}
