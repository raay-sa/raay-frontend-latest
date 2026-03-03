// src/navConfigs/adminNav.js
import {
    LockClosedIcon,
    UserCircleIcon,
    BookOpenIcon,
    ShoppingCartIcon,
    StarIcon,
    ChartBarIcon,
    BellIcon,
    CogIcon,
    TagIcon,
    QuestionMarkCircleIcon,
    ChatBubbleLeftRightIcon,
    BriefcaseIcon,
    AcademicCapIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

/**
 * Supports grouped nav items:
 * - Group: { type: 'group', label, icon, children: [ {to,label,icon?}, ... ] }
 * - Single: { to, label, icon }
 */
export default [
    { to: '', label: 'لوحة التحكم', icon: LockClosedIcon },

    // Accounts management group (kept as requested previously)
    {
        type: 'group',
        label: 'إدارة الحسابات',
        icon: UserCircleIcon,
        children: [
            { to: 'accounts', label: 'إدارة الحسابات', icon: UserCircleIcon },
            { to: 'managers', label: 'إدارة المديرين', icon: UserCircleIcon },
            { to: 'accounts/register-requests', label: 'طلبات تسجيل المدربين', icon: UserCircleIcon },
            { to: 'company-requests', label: 'طلبات الشركات', icon: TagIcon },
            { to: 'consultants', label: 'الاستشاريون', icon: AcademicCapIcon },
            { to: 'trainees', label: 'إدارة المتدربين', icon: UsersIcon },
        ],
    },

    // Programs management group (kept as requested previously)
    {
        type: 'group',
        label: 'إدارة البرامج التدريبية',
        icon: BookOpenIcon,
        children: [
            { to: 'programs', label: 'إدارة البرامج التدريبية', icon: BookOpenIcon },
            { to: 'programs/requests', label: 'طلبات البرامج', icon: BookOpenIcon },
            { to: 'categories', label: 'إدارة التخصصات', icon: TagIcon },
            { to: 'banners', label: 'إدارة البانرات', icon: BookOpenIcon },
        ],
    },

    // Website data group (NEW)
    {
        type: 'group',
        label: 'بيانات الموقع',
        icon: BriefcaseIcon,
        children: [
            { to: 'consulting', label: 'طلبات الاستشارات', icon: ChatBubbleLeftRightIcon },
            { to: 'contact-us', label: 'طلبات التواصل', icon: ChatBubbleLeftRightIcon },
            { to: 'workshops', label: 'ورش العمل', icon: BriefcaseIcon },
        ],
    },

    { to: 'orders', label: 'إدارة الطلبات', icon: ShoppingCartIcon },
    { to: 'reviews', label: 'مراجعة التقييمات', icon: StarIcon },
    { to: 'reports', label: 'التقارير والإحصائيات', icon: ChartBarIcon },
    { to: 'notifications', label: 'الإشعارات', icon: BellIcon },

    // Settings group (NEW as parent) with Skills inside
    {
        type: 'group',
        label: 'الإعدادات',
        icon: CogIcon,
        children: [
            { to: 'settings', label: 'الإعدادات', icon: CogIcon },
            { to: 'skills', label: 'المهارات', icon: TagIcon },
        ],
    },

    { to: 'faq', label: 'الأسئلة الشائعة', icon: QuestionMarkCircleIcon },
];
