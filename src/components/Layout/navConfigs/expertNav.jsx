import {
    LockClosedIcon,
    BookOpenIcon,
    ClipboardDocumentListIcon,
    UsersIcon,
    ChartBarIcon,
    CogIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { BiHeadphone, BiHelpCircle } from 'react-icons/bi';

export default [
    { to: '', label: 'لوحة التحكم', icon: LockClosedIcon },
    { to: 'courses', label: 'إدارة البرامج التدريبية', icon: BookOpenIcon },
    { to: 'assignments', label: 'المهام والاختبارات', icon: ClipboardDocumentListIcon },
    { to: 'assessments/assignments', label: 'تقييم المهام', icon: ClipboardDocumentListIcon },
    { to: 'assessments/exams', label: 'تقييم الاختبارات', icon: ClipboardDocumentListIcon },
    { to: 'reports', label: 'التقارير والإحصائيات', icon: ChartBarIcon },
    { to: 'settings', label: 'الإعدادات', icon: CogIcon },
    { to: 'faq', label: 'الأسئلة الشائعة', icon: QuestionMarkCircleIcon },
    { to: 'support', label: 'تواصل معنا', icon: BiHeadphone }
];
