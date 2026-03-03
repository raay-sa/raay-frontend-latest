import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function DashboardSkeleton() {
    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="grid grid-cols-5 gap-4">
                {Array(5).fill().map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow">
                        <Skeleton height={24} width={80} className="mb-2" />
                        <Skeleton height={20} width={100} />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {Array(2).fill().map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow">
                        <Skeleton height={200} />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {Array(2).fill().map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow">
                        <Skeleton height={200} />
                    </div>
                ))}
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <Skeleton height={40} className="mb-2" />
                <Skeleton count={6} height={24} />
            </div>
        </div>
    );
}
