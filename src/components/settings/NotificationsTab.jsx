// src/components/settings/NotificationsTab.jsx
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminService } from '../../services/adminService';
import TeacherSettingsService from '../../services/teacher/settingsService';
import StudentSettingsService from '../../services/student/settingsService';

export default function NotificationsTab({ role = 'student' }) {
    const isAdmin = role === 'admin';
    const isTeacher = role === 'teacher';

    const ADMIN_LABELS = {
        create_account_noti: ' إشعار عند حساب جديد',
        create_new_program_noti: 'إشعارات البرامج المباشرة',
        receiving_review_noti: 'إشعار عند الحصول على شهادة',
        offers_noti: 'إشعارات العروض والخصومات',
        global_noti: 'إشعارات عامة',
    };

    const TEACHER_LABELS = {
        receiving_review_noti: 'إشعار عند الحصول على تقييم',
        receiving_assignments_noti: 'إشعارات استلام المهام والاختبارات',
        global_noti: 'إشعارات عامة',
    };

    const STUDENT_LABELS = {
        live_program_noti: 'إشعارات البرامج المباشرة',
        certificate_noti: 'إشعار عند الحصول على شهادة',
        offers_noti: 'إشعارات العروض والخصومات',
        global_noti: 'إشعارات عامة',
    };

    const labels = isAdmin ? ADMIN_LABELS : isTeacher ? TEACHER_LABELS : STUDENT_LABELS;

    const [settingId, setSettingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toggles, setToggles] = useState(
        Object.keys(labels).reduce((acc, k) => ({ ...acc, [k]: false }), {})
    );

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    const fetchSettings = async () => {
        try {
            if (isAdmin) {
                const res = await AdminService.getNotificationSettings();
                const data = res?.data?.data || {};
                setSettingId(data.id);
                setToggles({
                    create_account_noti: !!data.create_account_noti,
                    create_new_program_noti: !!data.create_new_program_noti,
                    receiving_review_noti: !!data.receiving_review_noti,
                    offers_noti: !!data.offers_noti,
                    global_noti: !!data.global_noti,
                });
            } else if (isTeacher) {
                const res = await TeacherSettingsService.getNotificationSettings();
                const data = res?.data?.data || {};
                setSettingId(data.id);
                setToggles({
                    receiving_review_noti: !!data.receiving_review_noti,
                    receiving_assignments_noti: !!data.receiving_assignments_noti,
                    global_noti: !!data.global_noti,
                });
            } else {
                const res = await StudentSettingsService.getNotificationSettings();
                const data = res?.data?.data || {};
                setSettingId(data.id);
                setToggles({
                    live_program_noti: !!data.live_program_noti,
                    certificate_noti: !!data.certificate_noti,
                    offers_noti: !!data.offers_noti,
                    global_noti: !!data.global_noti,
                });
            }
        } catch (err) {
            console.error(err);
            toast.error('فشل تحميل الإعدادات');
        }
    };

    const toggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

    const handleSave = async () => {
        if (!settingId) return;
        setLoading(true);

        try {
            const payload = new FormData();
            payload.append('_method', 'PUT');
            Object.keys(toggles).forEach(k => payload.append(k, toggles[k] ? 1 : 0));

            if (isAdmin) {
                await AdminService.updateNotificationSettings(settingId, payload);
            } else if (isTeacher) {
                await TeacherSettingsService.updateNotificationSettings(settingId, payload);
            } else {
                await StudentSettingsService.updateNotificationSettings(settingId, payload);
            }

            toast.success('تم حفظ الإعدادات بنجاح');
        } catch (err) {
            console.error(err);
            toast.error('فشل حفظ الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 lg:space-y-6 max-w-full lg:max-w-md">
            {Object.keys(labels).map((key) => (
                <div key={key} className="flex items-center gap-3 sm:gap-5 px-2 sm:px-4 py-3">
                    <div
                        dir="ltr"
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${toggles[key] ? 'bg-primary' : 'bg-gray-300'
                            }`}
                        onClick={() => toggle(key)}
                    >
                        <div
                            className={`w-4 h-4 bg-white rounded-full shadow transform transition ${toggles[key] ? 'translate-x-4' : ''
                                }`}
                        />
                    </div>

                    <span className="text-sm sm:text-base">{labels[key]}</span>

                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!toggles[key]}
                            onChange={() => toggle(key)}
                            className="sr-only"
                        />
                    </label>
                </div>
            ))}

            <div className="flex flex-col sm:flex-row justify-start gap-3 sm:gap-4">
                <button type="button" className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-md text-sm sm:text-base" onClick={fetchSettings}>
                    تجاهل
                </button>
                <button type="button" onClick={handleSave} disabled={loading} className="px-4 sm:px-6 py-2 bg-primary text-white rounded-md text-sm sm:text-base">
                    {loading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
            </div>
        </div>
    );
}
