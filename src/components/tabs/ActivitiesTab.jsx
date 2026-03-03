// src/pages/dashboard/components/tabs/ActivitiesTab.jsx
import ActivityCard from "../ActivityCard";

export default function ActivitiesTab({ loading, items }) {
    if (loading) return <div className="text-gray-600">جاري التحميل…</div>;
    if (items.length === 0) return <div className="text-gray-600">لا توجد مهام أو اختبارات لهذا البرنامج.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((a) => <ActivityCard key={a.id} a={a} />)}
        </div>
    );
}
