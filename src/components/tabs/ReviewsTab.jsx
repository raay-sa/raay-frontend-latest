// src/pages/dashboard/components/tabs/ReviewsTab.jsx
import Stars from "../Stars";

export default function ReviewsTab({ course, summary }) {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row items-center gap-8">
                <div className="text-center md:w-1/4">
                    <div className="text-5xl font-extrabold text-gray-900">{Number(summary?.average || 0).toFixed(1)}</div>
                    <Stars score={Number(summary?.average || 0)} size="w-5 h-5" />
                    <div className="text-sm text-gray-500 mt-1">{summary?.total || 0} تقييم</div>
                </div>

                <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((s) => {
                        const pct = Number(summary?.stars?.[String(s)]?.percentage || 0);
                        return (
                            <div key={s} className="flex items-center gap-3">
                                <span className="w-10 text-sm text-gray-700">{s} نجوم</span>
                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
                                </div>
                                <span className="w-12 text-sm text-gray-600 text-left">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4">
                {(course?.reviews || []).filter(r => r.status === 1 || r.status === true)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((r) => (
                        <div key={r.id} className="bg-white p-5 rounded-lg shadow">
                            <div className="flex items-start gap-4">
                                <img className="w-12 h-12 rounded-full object-cover" src="/thumbnails/avatar.png" alt={r.student?.name || "user"} />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">{r.student?.name || "مستخدم"}</p>
                                            <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("ar-EG")}</p>
                                        </div>
                                        <Stars score={r.score} />
                                    </div>
                                    {r.comment && <p className="mt-3 text-gray-700 leading-relaxed">{r.comment}</p>}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}