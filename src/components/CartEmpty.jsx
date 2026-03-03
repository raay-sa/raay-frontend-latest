import React from 'react';

export default function CartEmpty() {
    return (
        <div className='p-4 sm:p-6 lg:p-8 min-h-screen'>
            <h1 className='text-2xl sm:text-3xl font-bold mb-4 sm:mb-6'>السلة</h1>
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 sm:space-y-8">
                <img
                    src="/images/empty.png"
                    alt="empty cart"
                    className="w-32 h-32 sm:w-40 sm:h-40"
                />
                <h2 className="text-lg sm:text-xl font-semibold text-center px-4">
                    لم تقم بطلب أي طلبات بعد
                </h2>
                <a
                    href="/student/courses"
                    className="px-4 sm:px-5 py-2 sm:py-3 bg-primary text-white rounded-lg text-sm sm:text-base font-medium hover:bg-primary-dark transition-colors"
                >
                    اكتشف البرامج التدريبية الآن
                </a>
            </div>
        </div>
    );
}
