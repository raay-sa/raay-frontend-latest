// src/components/StatsCard.jsx
import React from 'react';

export default function StatsCard({ value, label, Icon, trend, up }) {
    return (
        <div className="bg-white px-2 sm:px-3 lg:px-10 py-2 sm:py-3 lg:py-5 rounded-lg shadow-lg flex items-center gap-1 sm:gap-2 lg:gap-10">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-8 lg:h-8 text-gray-300 flex-shrink-0" />
            <div className="text-right space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                <p className="text-sm sm:text-base lg:text-2xl font-semibold">{value}</p>
                <p className="text-xs sm:text-xs lg:text-sm text-gray-500 leading-tight truncate">{label}</p>
                <p className={`text-xs ${up ? 'text-green-500' : 'text-red-500'}`}>
                    {trend} {up ? '↑' : '↓'}
                </p>
            </div>
        </div>
    );
}
