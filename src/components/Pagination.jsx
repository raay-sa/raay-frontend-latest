// src/components/Pagination.jsx
import React from 'react';

export default function Pagination({ current, total, onChange }) {
    // Utility to build the page list with ellipses
    const buildPages = () => {
        const pages = [];

        if (total <= 5) {
            // Show all if few pages
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            // Always show first page
            pages.push(1);

            // Ellipsis before middle range
            if (current > 3) {
                pages.push('start-ellipsis');
            }

            // Determine middle range: current±1
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            for (let i = start; i <= end; i++) pages.push(i);

            // Ellipsis after middle range
            if (current < total - 2) {
                pages.push('end-ellipsis');
            }

            // Always show last page
            pages.push(total);
        }

        return pages;
    };

    const pages = buildPages();

    return (
        <div dir="rtl" className="flex items-center justify-center gap-2 py-6">
            {/* Previous button */}
            <button
                onClick={() => onChange(current - 1)}
                disabled={current === 1}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${current === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700'
                    }`}
            >
                سابقاً
            </button>

            {/* Page numbers */}
            {pages.map((p, idx) =>
                p === 'start-ellipsis' || p === 'end-ellipsis' ? (
                    <span key={p + idx} className="px-2 text-gray-500">
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${p === current
                                ? 'bg-primary text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {p}
                    </button>
                )
            )}

            {/* Next button */}
            <button
                onClick={() => onChange(current + 1)}
                disabled={current === total}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${current === total
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700'
                    }`}
            >
                التالي
            </button>
        </div>
    );
}
