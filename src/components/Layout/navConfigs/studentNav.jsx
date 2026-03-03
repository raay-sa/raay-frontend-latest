import {
    LockClosedIcon,
    BookOpenIcon,
    ClipboardDocumentListIcon,
    ShoppingCartIcon,
    BookmarkIcon,
    CogIcon,
    QuestionMarkCircleIcon,
    AcademicCapIcon,
    PlayCircleIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import { BiHeadphone } from 'react-icons/bi';

export default [
    { to: '', label: 'لوحة التحكم', icon: LockClosedIcon },
    { to: 'courses', label: 'البرامج التدريبية', icon: BookOpenIcon },
    { to: 'my-courses', label: 'دوراتي', icon: PlayCircleIcon },
    { to: 'assignments', label: 'المهام والاختبارات', icon: ClipboardDocumentListIcon },
    { to: 'certificates', label: 'شهاداتي', icon: AcademicCapIcon },
    { to: 'cart', label: 'السلة', icon: ShoppingCartIcon },
    { to: 'invoices', label: 'فواتيري', icon: CreditCardIcon },
    { to: 'favorites', label: 'المفضلة', icon: BookmarkIcon },
    { to: 'settings', label: 'الإعدادات', icon: CogIcon },
    { to: 'faq', label: 'الأسئلة الشائعة', icon: QuestionMarkCircleIcon },
    { to: 'support', label: 'تواصل معنا', icon: BiHeadphone }

];