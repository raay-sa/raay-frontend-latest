import React from 'react';

export default function FavouriteEmpty() {
    return (
        <div className='p-8 my-10'>
            <h1 className='text-3xl font-bold mb-4'>المفضلة</h1>
            <div className="flex flex-col items-center justify-center h-full space-y-8 my-10">
                <img
                    src="/images/favempty.png"
                    alt="empty Favorite"
                    className="w-40 h-40"
                />
                <h2 className="text-xl font-semibold">لم تقم باضافة أي برامج الي المفضلة بعد</h2>
                <a
                    href="/student/courses"test noti
                    className="px-5 py-2 bg-primary text-white rounded-lg"
                >
                    تصفح البرامج التدريبية
                </a>
            </div>
        </div>
    );
}

