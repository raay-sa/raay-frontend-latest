import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Tab, Disclosure } from '@headlessui/react';
import {
    PlayIcon, CheckIcon, ClockIcon, ChevronRightIcon,
    ChevronDownIcon, ChevronUpIcon, UsersIcon,
    ClipboardDocumentListIcon, HandThumbUpIcon, HandThumbDownIcon, TrashIcon, PencilIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import ProgramsService from '../../../../services/teacher/programsService';
import { withBaseUrl } from '../../../../utils/url';
import { processProgram, formatLearningArray } from '../../../../utils/translations';

const parseArraySafe = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') { try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; } }
    return [];
};

const fmtMonthYear = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function TeacherCourseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await ProgramsService.getOne(id);
                if (!mounted) return;
                setData(res?.data?.data || null);
                setSummary(res?.data?.reviews_summary || null);
            } catch (e) {
                console.error('Failed to load program details', e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const course = useMemo(() => {
        if (!data) return null;

        // Process the raw data to extract translations
        const processedData = processProgram(data);

        const ratingAvg = data.reviews_avg_score != null
            ? parseFloat(data.reviews_avg_score)
            : (summary?.average ?? 0);

        const sections = Array.isArray(data.sections) ? data.sections : [];
        const curriculum = sections.map((s) => {
            // Process section title from translations
            const sectionTitle = s.translations?.find(t => t.locale === 'ar')?.title || s.title || '';
            
            return {
                id: s.id,
                title: sectionTitle,
                count: (s.sessions || []).length,
                duration: s.section_duration || '0:00',
                lessons: [
                    ...(Array.isArray(s.sessions) ? s.sessions : []).map((sess) => {
                        // Process session title from translations
                        const sessionTitle = sess.translations?.find(t => t.locale === 'ar')?.title || sess.title || '';
                        
                        return {
                            id: `sess-${sess.id}`,
                            title: sessionTitle,
                            type: 'video',
                            length: sess.formatted_video_duration || '0:00',
                            size: '',
                        };
                    }),
                    ...(Array.isArray(s.free_materials) ? s.free_materials : []).map((fm) => ({
                        id: `free-${fm.id}`,
                        title: fm.title,
                        type: 'free',
                        length: fm.formatted_video_duration || '0:00',
                        size: (Array.isArray(fm.files) && fm.files[0]?.size) ? fm.files[0].size : '',
                    })),
                ],
            };
        });

        const reviewsDistribution = summary?.stars
            ? [5, 4, 3, 2, 1].map((s) => ({ stars: s, percent: summary.stars[String(s)]?.percentage ?? 0 }))
            : [];

        return {
            id: data.id,
            imageSrc: withBaseUrl(data.image),
            title: processedData.title,
            description: processedData.description,
            price: data.price ?? 0,
            rating: Number.isFinite(ratingAvg) ? ratingAvg : 0,
            reviews: summary?.total ?? data.reviews_count ?? 0,
            students: data.subscriptions_count ?? 0,
            updated: fmtMonthYear(data.updated_at),
            instructor: {
                name: data.teacher?.name || '—',
                avatar: withBaseUrl(data.teacher?.avatar) || undefined,
            },
            features: [
                { icon: ClockIcon, label: `${data.program_duration || '0:00'} مدة البرنامج` },
                { icon: ClipboardDocumentListIcon, label: `${data.files_count || 0} ملفات` },
                { icon: CheckIcon, label: `مستوى البرنامج: ${data.level || '—'}` },
                { icon: UsersIcon, label: `${data.subscriptions_count || 0} متدرب` },
                { icon: StarIcon, label: data.have_certificate ? 'شهادة إتمام' : 'بدون شهادة' },
            ],
            curriculum,
            reviewsDistribution,
            comments: Array.isArray(data.reviews)
                ? data.reviews
                    .filter((r) => r.status === 1)
                    .map((r) => ({
                        id: r.id,
                        name: r.student?.name || 'مستخدم',
                        avatar: withBaseUrl(r.student?.image) || undefined,
                        rating: r.score || 0,
                        time: new Date(r.created_at).toLocaleDateString('ar-SA'),
                        text: r.comment || '',
                    }))
                : [],
            learning: processedData.learning,
            requirement: processedData.requirement,
        };
    }, [data, summary]);

    if (loading) return <div className="p-6 text-sm text-gray-500">جاري التحميل…</div>;
    if (!course) return <div className="p-6 text-sm text-red-600">تعذر تحميل بيانات البرنامج.</div>;

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Breadcrumbs (teacher) */}
            <div className="flex justify-start items-center gap-2 text-xs sm:text-sm p-3 sm:p-6">
                <div className="px-2 sm:px-4 bg-primary text-white rounded-xl flex items-center gap-1">
                    <NavLink to="/teacher/courses" className="px-1 py-2 border border-primary rounded-lg hover:bg-primary hover:text-white transition">
                        <span>إدارة البرامج التدريبية</span>
                    </NavLink>
                    <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{course.title}</span>
                </div>
            </div>

            {/* Top Section – teacher card with actions */}
            <div className="relative bg-secondary" style={{ minHeight: '12rem' }}>
                <div className="absolute inset-0" />
                <div className="relative max-w-7xl mx-auto h-full px-3 sm:px-6 pt-4 sm:pt-8 grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                    {/* Info */}
                    <div className="md:col-span-3 text-white space-y-3 sm:space-y-5">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{course.title}</h1>
                        <p className="opacity-90 text-sm sm:text-base">{course.description}</p>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                            <span>{course.students} متدرب</span>
                            <span>({course.reviews} تقييم) {course.rating.toFixed(1)}</span>
                            <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        </div>
                    </div>

                    {/* Price + actions card */}
                    <div className="md:col-span-1 relative">
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/3 w-full max-w-xs">
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="relative">
                                    {course.imageSrc
                                        ? <img src={course.imageSrc} alt={course.title} className="w-full h-40 sm:h-48 object-cover" />
                                        : <div className="w-full h-40 sm:h-48 bg-gray-100" />
                                    }
                                </div>
                                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                                    <div className="text-lg sm:text-xl font-bold text-primary text-right">
                                        <span className="icon-saudi_riyal">&#xea;</span>
                                        {course.price}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/teacher/courses/${course.id}/edit`)}
                                            className="flex-1 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                            تعديل
                                        </button>
                                        <button className="p-2 bg-[#F0F0F0] rounded-lg" title="حذف">
                                            <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                        </button>
                                    </div>

                                    <ul className="mt-2 space-y-2 text-xs sm:text-sm text-gray-600">
                                        <h1 className="font-bold text-sm sm:text-lg text-black">هذا البرنامج يتضمن:</h1>
                                        {course.features.map(({ icon: Icon, label }, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#5F5F5F]" />
                                                <span className="text-xs sm:text-sm">{label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs (same structure as student, filled with API data) */}
            <div className="px-3 sm:px-6 -mt-4 sm:-mt-8 md:w-8/12">
                <Tab.Group>
                    <Tab.List className="flex flex-wrap border-b overflow-x-auto">
                        {['نظرة عامة', 'محتوى البرنامج', 'التقييم'].map((tab) => (
                            <Tab
                                key={tab}
                                className={({ selected }) =>
                                    `px-3 sm:px-4 py-2 text-sm sm:text-lg font-semibold ${selected
                                        ? 'border-b-2 border-primary text-primary focus:outline-none'
                                        : 'text-[#5F5F5F] hover:text-primary'}`
                                }
                            >
                                {tab}
                            </Tab>
                        ))}
                    </Tab.List>

                    <Tab.Panels className="space-y-6 sm:space-y-8">
                        {/* Overview */}
                        <Tab.Panel className="space-y-6 sm:space-y-8 py-4 sm:py-5">
                            <div>
                                <h1 className='text-xl sm:text-2xl font-bold'>نظرة عامة</h1>
                                <p className="mt-3 sm:mt-4 text-[#5F5F5F] text-sm sm:text-base">{course.description}</p>
                            </div>

                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold mb-2">ما ستتعلمه في هذا البرنامج</h3>
                                <ul className="space-y-2">
                                    {course.learning.map((item, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <div className='bg-[#4CAF50] rounded-full p-1'>
                                                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                            </div>
                                            <span className="text-sm sm:text-base">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold mb-2">متطلبات البرنامج</h3>
                                <ul className="space-y-2">
                                    {course.requirement.map((item, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <div className='bg-[#4CAF50] rounded-full p-1'>
                                                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                            </div>
                                            <span className="text-sm sm:text-base">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Tab.Panel>

                        {/* Content */}
                        <Tab.Panel className="space-y-4 sm:space-y-6">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold mb-2">محتوى البرنامج</h3>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                    <div className="flex items-center gap-1">
                                        <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>{data?.program_duration || '0:00'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>{data?.video_count || 0} فيديو</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ClipboardDocumentListIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span>{data?.sections_count || 0} أقسام</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {course.curriculum.map((section) => (
                                        <Disclosure key={section.id}>
                                            {({ open }) => (
                                                <>
                                                    <Disclosure.Button className="w-full flex justify-between items-center bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                                                        <div>
                                                            <span className="font-medium text-sm sm:text-base">{section.title}</span>
                                                            <span className="text-xs sm:text-sm text-gray-500 mr-2 sm:mr-4">
                                                                {section.count} فيديو • {section.duration}
                                                            </span>
                                                        </div>
                                                        {open ? (
                                                            <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                                        ) : (
                                                            <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                                        )}
                                                    </Disclosure.Button>
                                                    <Disclosure.Panel className="px-3 sm:px-4 py-2 bg-white rounded-b-lg border border-t-0 border-gray-200">
                                                        <ul className="space-y-2">
                                                            {section.lessons.map((lesson) => (
                                                                <li key={lesson.id} className="flex items-center justify-between text-xs sm:text-sm text-gray-700">
                                                                    <div className="flex items-center gap-2">
                                                                        <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                                                        <span className="truncate">{lesson.title}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 flex-shrink-0">
                                                                        {lesson.length}{lesson.size ? ` • ${lesson.size}` : ''}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </Disclosure.Panel>
                                                </>
                                            )}
                                        </Disclosure>
                                    ))}
                                </div>
                            </div>
                        </Tab.Panel>

                        {/* Reviews */}
                        <Tab.Panel className="space-y-4 sm:space-y-6">
                            <h3 className="text-lg sm:text-xl font-semibold">التقييم والمراجعة</h3>
                            <div className="bg-white rounded-lg shadow p-3 sm:p-6 space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        {course.reviewsDistribution.map(({ stars, percent }) => (
                                            <div key={stars} className="flex items-center gap-2">
                                                <span className="text-xs sm:text-sm">{stars} نجوم</span>
                                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                                                </div>
                                                <span className="text-xs sm:text-sm text-gray-600">{percent}%</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <p className="text-3xl sm:text-5xl font-bold">{course.rating.toFixed(1)}</p>
                                        <div className="flex mt-1 text-yellow-400">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <StarIcon key={i} className="w-4 h-4 sm:w-6 sm:h-6" />
                                            ))}
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">بناء على {course.reviews} تقييمات</p>
                                    </div>
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    {course.comments.map((c) => (
                                        <div key={c.id} className="flex items-start gap-3 sm:gap-4">
                                            {c.avatar && (
                                                <img src={c.avatar} alt={c.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
                                            )}
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-sm sm:text-base">{c.name}</p>
                                                        <span className="text-xs text-gray-500">{c.time}</span>
                                                    </div>
                                                    <div className="flex text-yellow-400">
                                                        {Array.from({ length: c.rating }).map((_, i) => (
                                                            <StarIcon key={i} className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 text-xs sm:text-sm">{c.text}</p>
                                                <div className="flex items-center gap-3 sm:gap-4 text-gray-500 text-xs sm:text-sm">
                                                    <button className="flex items-center gap-1">
                                                        <HandThumbUpIcon className="w-4 h-4 sm:w-5 sm:h-5" /> مفيد؟
                                                    </button>
                                                    <button className="flex items-center gap-1">
                                                        <HandThumbDownIcon className="w-4 h-4 sm:w-5 sm:h-5" /> لا
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </div>
    );
}
