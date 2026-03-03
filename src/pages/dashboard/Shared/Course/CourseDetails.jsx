// src/pages/dashboard/Shared/Course/CourseDetails.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Tab, Disclosure } from '@headlessui/react';
import {
  PlayIcon, CheckIcon, ClockIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon,
  UsersIcon, ClipboardDocumentListIcon, HandThumbUpIcon, HandThumbDownIcon, HeartIcon,
  ExclamationCircleIcon, VideoCameraIcon, VideoCameraSlashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import SuggestedCourseCard from '../../../../components/SuggestedCourseCard';
import InstructorCard from '../../../../components/InstructorCard';
import StudentProgramsService from '../../../../services/student/programsService';
import StudentShopService from '../../../../services/student/shopService';
import StudentLiveService from '../../../../services/student/liveService';
import { withBaseUrl } from '../../../../utils/url';
import { processProgram, processProgramsList } from '../../../../utils/translations';
import toast from 'react-hot-toast';

const parseArraySafe = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try { const arr = JSON.parse(v); return Array.isArray(arr) ? arr : []; }
    catch { return []; }
  }
  return [];
};

const fmtMonthYear = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const fmtArFullDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState(null);
  const [summary, setSummary] = useState(null);
  const [suggested, setSuggested] = useState([]);

  const [favBusy, setFavBusy] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);

  // flags from API
  const [isFavorited, setIsFavorited] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribedAt, setSubscribedAt] = useState(null); // optional if backend sends it

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // First, fetch the program details
        const { data: showRes } = await StudentProgramsService.getOne(courseId);

        if (!alive) return;
        const d = showRes?.data || null;
        setRaw(d);
        setSummary(showRes?.reviews_summary || null);

        setIsFavorited(!!d?.is_favorited);
        setIsInCart(!!d?.is_in_cart);
        setIsSubscribed(!!d?.is_subscribed);

        // pick any possible subscription date key the backend might expose
        setSubscribedAt(
          d?.subscribed_at || d?.enrolled_at || d?.subscription_date || d?.student_subscribed_at || null
        );

        // Then, fetch suggested programs with category_id from current program
        const categoryId = d?.category_id || d?.category?.id || null;
        const suggParams = categoryId ? { category_id: categoryId } : {};
        const { data: suggRes } = await StudentProgramsService.bestPrograms(suggParams);

        if (!alive) return;
        setSuggested(Array.isArray(suggRes?.programs) ? suggRes.programs : []);
      } catch (e) {
        console.error('Failed to load course details:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [courseId]);

  const course = useMemo(() => {
    if (!raw) return null;

    // Process the raw data to extract translations
    const processedRaw = processProgram(raw);

    const ratingAvg =
      raw.reviews_avg_score != null
        ? Number.parseFloat(raw.reviews_avg_score)
        : (summary?.average ?? 0);

    // Determine if course is live and broadcasting
    const isLive = (raw?.type || '').toLowerCase() === 'live';
    const isBroadcasting = !!raw?.is_live;

    const sections = Array.isArray(raw.sections) ? raw.sections : [];
    const curriculum = sections.map((s) => {
      // Process section title from translations
      const sectionTitle = s.translations?.find(t => t.locale === 'ar')?.title || s.title || '';
      
      return {
        id: s.id,
        title: sectionTitle,
        count: s.video_count || (s.sessions || []).length,
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
      id: raw.id,
      type: raw?.type || 'registered', // 'live' | 'registered'
      imageSrc: withBaseUrl(raw.image),
      title: processedRaw.title,
      description: processedRaw.description,
      price: raw.price ?? 0,
      rating: Number.isFinite(ratingAvg) ? ratingAvg : 0,
      reviews: summary?.total ?? raw.reviews_count ?? 0,
      students: raw.subscriptions_count ?? 0,
      updated: fmtMonthYear(raw.updated_at),
      isLive,
      isBroadcasting,
      instructor: {
        name: raw.teacher?.name || '—',
        avatar: withBaseUrl(raw.teacher?.image) || '/images/avatar.png',
        role: raw.teacher?.role || 'خبير',
        expertRating: Number.isFinite(ratingAvg) ? ratingAvg : 0,
        coursesCount: raw.teacher?.programs_count || 0,
        traineesCount: raw.teacher?.trainees_count || (raw.subscriptions_count ?? 0),
        bio: raw.teacher?.bio || '',
      },
      features: [
        { icon: ClockIcon, label: `${raw.program_duration || '0:00'} مدة البرنامج` },
        { icon: ClipboardDocumentListIcon, label: `${raw.files_count || 0} ملفات` },
        { icon: CheckIcon, label: `مستوى البرنامج: ${raw.level || '—'}` },
        { icon: UsersIcon, label: `${raw.subscriptions_count || 0} متدرب` },
        { icon: StarIcon, label: raw.have_certificate ? 'شهادة إتمام' : 'بدون شهادة' },
      ],
      curriculum,
      reviewsDistribution,
      comments: Array.isArray(raw.reviews)
        ? raw.reviews
          .filter((r) => r.status === 1)
          .map((r) => ({
            id: r.id,
            name: r.student?.name || 'مستخدم',
            avatar: withBaseUrl(r.student?.image) || '/images/avatar.png',
            rating: r.score || 0,
            time: new Date(r.created_at).toLocaleDateString('ar-eg'),
            text: r.comment || '',
          }))
        : [],
      learning: processedRaw.learning,
      requirement: processedRaw.requirement,
    };
  }, [raw, summary]);

  const suggestedCards = useMemo(() => {
    // Process programs to extract translations (title, description, category)
    const processedPrograms = processProgramsList(suggested || [], 'ar');
    
    return processedPrograms.map((p) => ({
      id: p.id,
      imageSrc: withBaseUrl(p.image),
      badgeLabel: p?.category?.title || '',
      title: p.title || '',
      description: p.description || '',
      reviewsCount: p?.reviews_count ?? 0,
      rating: p?.reviews_avg_score ? parseFloat(p.reviews_avg_score) : 0,
      price: p?.price ?? 0,
      instructorName: p?.teacher?.name || '',
      instructorAvatar: withBaseUrl(p?.teacher?.image) || '',
    }));
  }, [suggested]);

  if (loading) return <div className="p-3 lg:p-6 text-xs sm:text-sm text-gray-500">جاري التحميل…</div>;
  if (!course) return <div className="p-3 lg:p-6 text-xs sm:text-sm text-red-600">تعذر تحميل بيانات البرنامج.</div>;

  const safeCourseImg = (course.imageSrc || '').trim() || null;
  const safeInstructorImg = (course.instructor.avatar || '').trim() || null;
  const isLive = (course.type || '').toLowerCase() === 'live';

  const handleFavorite = async () => {
    if (favBusy) return;
    try {
      setFavBusy(true);
      await StudentShopService.toggleFavorite(course.id);
      setIsFavorited((v) => !v);
      toast.success(!isFavorited ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة');
    } catch (e) {
      console.error('favorite failed', e);
      toast.error('تعذر تحديث المفضلة');
    } finally {
      setFavBusy(false);
    }
  };

  const handleAddToCart = async () => {
    if (cartBusy) return;
    if (isSubscribed) {
      toast('أنت مشترك بالفعل بهذا البرنامج');
      return;
    }
    try {
      setCartBusy(true);
      const { data } = await StudentShopService.addToCart(course.id);
      if (data && data.success === false) {
        // Backend returned a handled error in payload
        toast.error(data.message || 'تعذر الإضافة إلى السلة');
        return;
      }
      setIsInCart(true);
      toast.success('أُضيف إلى السلة');
    } catch (e) {
      console.error('add to cart failed', e);
      const msg = e?.response?.data?.message || e?.message || 'تعذر الإضافة إلى السلة';
      toast.error(msg);
    } finally {
      setCartBusy(false);
    }
  };

  const handleBuyNow = async () => {
    if (isSubscribed) {
      toast('أنت مشترك بالفعل بهذا البرنامج');
      return;
    }
    if (!isInCart) {
      await handleAddToCart();
    }
    navigate('/student/cart');
  };

  const gotoOverview = async () => {
    // Check if it's a live course and currently broadcasting
    if (isLive && isSubscribed) {
      try {
        const { data } = await StudentLiveService.getStream(course.id);
        const streamId = data?.streamId || data?.stream_id;
        if (streamId) {
          // Course is live and broadcasting, join the live session
          navigate(`/student/live/${course.id}`, { state: { streamId } });
          return;
        }
      } catch (e) {
        console.error('Failed to check live stream:', e);
        // If live check fails, continue to overview
      }
    }
    // Default behavior: go to course overview
    navigate(`/student/courses/${course.id}/overview`);
  };

  // derived UI states
  const addDisabled = cartBusy || isSubscribed || isInCart;
  const addLabel = isSubscribed ? 'مشترك بالفعل' : isInCart ? 'في السلة' : 'أضف إلى السلة';

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Breadcrumbs */}
      <div className="flex justify-start items-center gap-2 text-xs sm:text-sm p-3 lg:p-6">
        <div className="px-2 sm:px-4 bg-primary text-white rounded-xl flex items-center gap-1">
          <NavLink
            to="/student/courses"
            className="px-1 py-1 sm:py-2 border border-primary rounded-lg hover:bg-primary hover:text-white transition text-xs sm:text-sm"
          >
            <span>البرامج التدريبية</span>
          </NavLink>
          <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm truncate">{course.title}</span>
        </div>
      </div>

      {/* Top Section */}
      <div className="relative bg-secondary" style={{ minHeight: '12rem' }}>
        <div className="absolute inset-0" />
        <div className="relative max-w-7xl mx-auto h-full px-3 sm:px-6 pt-4 sm:pt-8 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Info */}
          <div className="lg:col-span-3 text-white space-y-3 sm:space-y-5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{course.title}</h1>
            <p className="opacity-90 text-sm sm:text-base">{course.description}</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <span>{course.students} متدرب</span>
              <span>({course.reviews} تقييم) {course.rating.toFixed(1)}</span>
              <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            </div>
            <div className="flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
              {safeInstructorImg ? (
                <img src={safeInstructorImg} alt={course.instructor.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200" />
              )}
              <div>
                <p className="font-medium text-sm sm:text-base">{course.instructor.name}</p>
                <p className="text-xs sm:text-sm opacity-90">آخر تحديث {course.updated}</p>
              </div>
            </div>
          </div>

          {/* Purchase card - Desktop: side-by-side, Mobile: below */}
          <div className="lg:col-span-1 relative">
            {/* Desktop: positioned as before */}
            <div className="hidden lg:block absolute right-0 top-1/2 transform -translate-y-1/3 w-full max-w-xs">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="relative">
                  {safeCourseImg ? (
                    <img src={safeCourseImg} alt={course.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-100" />
                  )}
                  {/* overlay play */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <PlayIcon className="w-10 h-10 text-white" />
                  </div>
                  {console.log(course)
                  }
                  {/* live chip (top-right) */}
                  {course.isLive && (
                    <div className={`absolute top-2 right-2 ${course.isBroadcasting ? "bg-red-100" : "bg-gray-100"} px-1 py-1 rounded-xl`}>
                      <div className={`flex flex-col items-center text-xs font-bold ${course.isBroadcasting ? "text-red-600" : "text-gray-600"}`}>
                        {course.isBroadcasting ? (
                          <VideoCameraIcon className="w-4 h-4" />
                        ) : (
                          <VideoCameraSlashIcon className="w-4 h-4" />
                        )}
                        <span className={`border rounded-full px-2 text-[10px] leading-4 ${course.isBroadcasting ? "border-red-600" : "border-gray-400"}`}>
                          مباشر
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* ===== Subscribed variants (FIGMA) ===== */}
                  {isSubscribed ? (
                    <>
                      <div className="text-center font-bold text-primary leading-5">
                        <div className="inline-flex items-center gap-1">
                          <ExclamationCircleIcon className="w-4 h-4 text-primary" />
                          <span>لقد اشتريت هذا البرنامج في</span>
                        </div>
                        {subscribedAt && (
                          <div className="text-[#224161]">{fmtArFullDate(subscribedAt)}</div>
                        )}
                      </div>

                      <button
                        onClick={gotoOverview}
                        className="w-full h-10 rounded-lg bg-primary text-white text-sm font-medium"
                      >
                        {course.isLive && course.isBroadcasting ? 'انضم الآن' : course.isLive ? 'انتظر البث' : 'انتقل إلى البرنامج'}
                      </button>

                      {/* show features only for non-live (per figma) */}
                      {!isLive && (
                        <ul className="mt-2 space-y-2 text-sm text-gray-600">
                          <h1 className="font-bold text-lg text-black">هذا البرنامج تتضمن:</h1>
                          {course.features.map(({ icon: Icon, label }, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <Icon className="w-5 h-5 text-[#5F5F5F]" />
                              {label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <>
                      {/* ===== Normal purchase (not subscribed) ===== */}
                      <div className="text-xl font-bold text-primary text-right">
                        <span className="icon-saudi_riyal">&#xea;</span>
                        {course.price}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleFavorite}
                          disabled={favBusy}
                          className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60"
                          aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                          title={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                        >
                          <HeartIcon className={`w-5 h-5 ${isFavorited ? 'text-red-500' : 'text-gray-600'}`} />
                        </button>

                        <button
                          onClick={handleAddToCart}
                          disabled={cartBusy || isInCart}
                          className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-60"
                        >
                          {isInCart ? 'في السلة' : 'أضف إلى السلة'}
                        </button>
                      </div>

                      <button
                        onClick={handleBuyNow}
                        disabled={cartBusy}
                        className="w-full h-10 rounded-lg text-white disabled:opacity-60"
                        style={{ backgroundColor: '#B19567' }}
                      >
                        اشترِ الآن
                      </button>

                      <ul className="mt-4 space-y-2 text-sm text-gray-600">
                        <h1 className="font-bold text-lg text-black">هذا البرنامج تتضمن:</h1>
                        {course.features.map(({ icon: Icon, label }, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-[#5F5F5F]" />
                            {label}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Course card positioned below header */}
      <div className="lg:hidden px-3 sm:px-6 -mt-8 sm:-mt-12">
        <div className="max-w-sm mx-auto">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="relative">
              {safeCourseImg ? (
                <img src={safeCourseImg} alt={course.title} className="w-full h-40 sm:h-48 object-cover" />
              ) : (
                <div className="w-full h-40 sm:h-48 bg-gray-100" />
              )}
              {/* overlay play */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              {/* live chip (top-right) */}
              {course.isLive && (
                <div className={`absolute top-2 right-2 ${course.isBroadcasting ? "bg-red-100" : "bg-gray-100"} px-1 py-1 rounded-xl`}>
                  <div className={`flex flex-col items-center text-xs font-bold ${course.isBroadcasting ? "text-red-600" : "text-gray-600"}`}>
                    {course.isBroadcasting ? (
                      <VideoCameraIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <VideoCameraSlashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    <span className={`border rounded-full px-1 sm:px-2 text-[8px] sm:text-[10px] leading-3 sm:leading-4 ${course.isBroadcasting ? "border-red-600" : "border-gray-400"}`}>
                      مباشر
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* ===== Subscribed variants (FIGMA) ===== */}
              {isSubscribed ? (
                <>
                  <div className="text-center font-bold text-primary leading-4 sm:leading-5">
                    <div className="inline-flex items-center gap-1">
                      <ExclamationCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      <span className="text-xs sm:text-sm">لقد اشتريت هذا البرنامج في</span>
                    </div>
                    {subscribedAt && (
                      <div className="text-[#224161] text-xs sm:text-sm">{fmtArFullDate(subscribedAt)}</div>
                    )}
                  </div>

                  <button
                    onClick={gotoOverview}
                    className="w-full h-8 sm:h-10 rounded-lg bg-primary text-white text-xs sm:text-sm font-medium"
                  >
                    {course.isLive && course.isBroadcasting ? 'انضم الآن' : course.isLive ? 'انتظر البث' : 'انتقل إلى البرنامج'}
                  </button>

                  {/* show features only for non-live (per figma) */}
                  {!isLive && (
                    <ul className="mt-2 space-y-2 text-xs sm:text-sm text-gray-600">
                      <h1 className="font-bold text-sm sm:text-lg text-black">هذا البرنامج تتضمن:</h1>
                      {course.features.map(({ icon: Icon, label }, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#5F5F5F]" />
                          <span className="text-xs sm:text-sm">{label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  {/* ===== Normal purchase (not subscribed) ===== */}
                  <div className="text-lg sm:text-xl font-bold text-primary text-right">
                    <span className="icon-saudi_riyal">&#xea;</span>
                    {course.price}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={handleFavorite}
                      disabled={favBusy}
                      className="p-2 sm:p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60"
                      aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      title={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <HeartIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorited ? 'text-red-500' : 'text-gray-600'}`} />
                    </button>

                    <button
                      onClick={handleAddToCart}
                      disabled={cartBusy || isInCart}
                      className="flex-1 h-8 sm:h-10 rounded-lg bg-primary text-white text-xs sm:text-sm font-medium disabled:opacity-60"
                    >
                      {isInCart ? 'في السلة' : 'أضف إلى السلة'}
                    </button>
                  </div>

                  <button
                    onClick={handleBuyNow}
                    disabled={cartBusy}
                    className="w-full h-8 sm:h-10 rounded-lg text-white disabled:opacity-60 text-xs sm:text-sm font-medium"
                    style={{ backgroundColor: '#B19567' }}
                  >
                    اشترِ الآن
                  </button>

                  <ul className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm text-gray-600">
                    <h1 className="font-bold text-sm sm:text-lg text-black">هذا البرنامج تتضمن:</h1>
                    {course.features.map(({ icon: Icon, label }, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#5F5F5F]" />
                        <span className="text-xs sm:text-sm">{label}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 sm:px-6 py-4 sm:py-8 -mt-4 sm:-mt-8 lg:w-8/12">
        <Tab.Group>
          <Tab.List className="flex flex-wrap border-b overflow-x-auto">
            {['نظرة عامة', 'محتوى البرنامج', 'الخبير', 'التقييم', 'مقترحات'].map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `px-2 sm:px-4 py-2 text-sm sm:text-lg font-semibold whitespace-nowrap ${selected ? 'border-b-2 border-primary text-primary focus:outline-none' : 'text-[#5F5F5F] hover:text-primary'}`
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="space-y-6 sm:space-y-8">
            {/* Overview */}
            <Tab.Panel className="space-y-6 sm:space-y-8 py-3 sm:py-5">
              <div>
                <h1 className='text-xl sm:text-2xl font-bold'>نظرة عامة</h1>
                <p className="mt-3 sm:mt-4 text-[#5F5F5F] text-sm sm:text-base">{course.description}</p>
              </div>

              {!!course.learning?.length && (
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold mb-2">ما ستتعلمه في هذا البرنامج</h3>
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
              )}

              {!!course.requirement?.length && (
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold mb-2">متطلبات البرنامج</h3>
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
              )}
            </Tab.Panel>

            {/* Content */}
            <Tab.Panel className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold mb-2">محتوى البرنامج</h3>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{raw?.program_duration || '0:00'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{raw?.video_count || 0} فيديو</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClipboardDocumentListIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{raw?.sections_count || 0} أقسام</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {course.curriculum.map((section) => (
                    <Disclosure key={section.id}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="w-full flex justify-between items-center bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm sm:text-base block truncate">{section.title}</span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {section.count} فيديو • {section.duration}
                              </span>
                            </div>
                            {open ? (
                              <ChevronUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                            )}
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-3 sm:px-4 py-2 bg-white rounded-b-lg border border-t-0 border-gray-200">
                            <ul className="space-y-2">
                              {section.lessons.map((lesson) => (
                                <li key={lesson.id} className="flex items-center justify-between text-xs sm:text-sm text-gray-700">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                                    <span className="truncate">{lesson.title}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 flex-shrink-0">
                                    {lesson.length} {lesson.size ? `• ${lesson.size}` : ''}
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

            {/* Instructor */}
            <Tab.Panel>
              <InstructorCard
                name={course.instructor.name}
                role={course.instructor.role}
                avatar={course.instructor.avatar}
                bio={course.instructor.bio}
                rating={course.instructor.expertRating}
                trainees={course.instructor.traineesCount}
                courses={course.instructor.coursesCount}
                showStats={true}
                showSocials={false}
              />
            </Tab.Panel>

            {/* Reviews */}
            <Tab.Panel className="space-y-4 sm:space-y-6">
              <h3 className="text-lg sm:text-xl font-semibold">التقييم والمراجعة</h3>
              <div className="bg-white rounded-lg shadow p-3 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      <img src={c.avatar} alt={c.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0" />
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
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

                <div className="text-center">
                  <button className="px-4 sm:px-6 py-2 bg-primary text-white rounded-lg text-sm sm:text-base">تحميل المزيد</button>
                </div>
              </div>
            </Tab.Panel>

            {/* Suggested */}
            <Tab.Panel>
              <h3 className="text-lg sm:text-xl font-semibold mb-4">أفضل البرامج التدريبية المقترحة</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {suggestedCards.map((c) => (
                  <SuggestedCourseCard key={c.id} {...c} />
                ))}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
