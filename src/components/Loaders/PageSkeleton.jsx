import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function PageSkeleton() {
    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h2 className="text-2xl font-bold">
                <Skeleton width={200} height={28} />
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg shadow">
                        <Skeleton height={24} width={100} />
                        <Skeleton height={36} width={80} />
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} height={36} width={120} borderRadius={8} />
                ))}
            </div>

            {/* Filter and Actions */}
            <div className="flex justify-between items-center">
                <div className="flex-1">
                    <Skeleton height={80} />
                </div>
                <div className="flex gap-2">
                    <Skeleton height={36} width={100} borderRadius={8} />
                    <Skeleton height={36} width={120} borderRadius={8} />
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="bg-white p-4 rounded-lg shadow">
                <Skeleton height={40} className="mb-2" />
                {Array.from({ length: 6 }).map((_, idx) => (
                    <Skeleton key={idx} height={32} className="mb-2" />
                ))}
                <Skeleton height={30} width={200} className="mt-4" />
            </div>
        </div>
    );
}
