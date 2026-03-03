import React, { useState } from 'react';
import ProfileTab from '../../../components/settings/ProfileTab';
import NotificationsTab from '../../../components/settings/NotificationsTab';
import TermsTab from '../../../components/settings/TermsTab';
import ProfitTab from '../../../components/settings/ProfitTab';

export default function AdminSettings({ role = 'student' }) {
    const tabs = ['الملف الشخصي', 'الإشعارات', 'الشروط والأحكام', 'نسبة الأرباح'];
    const [currentTab, setCurrentTab] = useState(tabs[0]);

    return (
        <div className="p-3 lg:p-8" dir="rtl">
            <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">الإعدادات</h1>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 lg:mb-8">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setCurrentTab(tab)}
                        className={`px-3 sm:px-4 py-2 font-bold rounded-xl transition text-sm sm:text-base ${currentTab === tab
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-black shadow-xl border-gray-300'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {currentTab === 'الملف الشخصي' && <ProfileTab role={role} />}
            {currentTab === 'الإشعارات' && <NotificationsTab role={role} />}
            {currentTab === 'الشروط والأحكام' && <TermsTab role={role} />}
            {currentTab === 'نسبة الأرباح' && <ProfitTab />}
        </div>
    );
}
