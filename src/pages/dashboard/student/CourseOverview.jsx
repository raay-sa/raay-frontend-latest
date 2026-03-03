// src/pages/dashboard/Shared/Course/CourseOverviewPage.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { Tab } from "@headlessui/react";
import { ClockIcon, PlayIcon, ClipboardDocumentListIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import useProgramId from "../../../hooks/useProgramId";
import useCourse from "../../../hooks/useCourse";
import useActivities from "../../../hooks/useActivities";
import useDiscussions from "../../../hooks/useDiscussions";
import CurriculumDrawer from "../../../components/CurriculumDrawer";
import OverviewTab from "../../../components/tabs/OverviewTab";
import QnaTab from "../../../components/tabs/QnaTab";
import ActivitiesTab from "../../../components/tabs/ActivitiesTab";
import ReviewsTab from "../../../components/tabs/ReviewsTab";
import { useNavigate } from "react-router-dom";

export default function CourseOverviewPage() {
    const navigate = useNavigate();
    const progId = useProgramId();
    const videoKeyRef = useRef(0);
    const prevSessionIdRef = useRef(null);
    const prevVideoUrlRef = useRef(null);

    const { loading, course, reviewsSummary, curriculum, selectedVideoUrl, selectedVideoType, currentSessionId, setCurrentSessionId, currentSessionFiles } =
        useCourse(progId);

    // Increment key when session or URL changes to force iframe remount
    useEffect(() => {
        if (currentSessionId !== prevSessionIdRef.current || selectedVideoUrl !== prevVideoUrlRef.current) {
            console.log('Video key incrementing:', {
                currentSessionId,
                prevSessionId: prevSessionIdRef.current,
                selectedVideoUrl,
                prevVideoUrl: prevVideoUrlRef.current
            });
            videoKeyRef.current += 1;
            prevSessionIdRef.current = currentSessionId;
            prevVideoUrlRef.current = selectedVideoUrl;
        }
    }, [currentSessionId, selectedVideoUrl]);

    const topStats = useMemo(() => {
        const rating = Number(reviewsSummary?.average || 0);
        const reviews = reviewsSummary?.total || 0;
        const students = course?.subscriptions_count ?? 0;
        const sectionsCount = course?.sections_count ?? course?.sections?.length ?? 0;
        const videoCount = course?.video_count ?? 0;
        const progress = Number(course?.progressPercentage || 0);
        return { rating, reviews, students, sectionsCount, videoCount, progress };
    }, [course, reviewsSummary]);

    const { loading: aeLoading, items: aeItems } = useActivities(progId);

    const [qnaFilter, setQnaFilter] = useState("all");
    const { items: discussions, hasMore, load } = useDiscussions({ progId, currentSessionId, filter: qnaFilter });

    const submitQuestion = async (title, body, done) => {
        // delegate to service through old page if you like; omitted for brevity
        // You can keep the exact logic you had and call done() when finished.
        if (typeof done === "function") done();
        await load(true);
    };
    const submitReply = async (parent, text, done) => {
        // same note as above; call done() when finished.
        if (typeof done === "function") done();
        await load(true);
    };

    const [drawerOpen, setDrawerOpen] = useState(true);
    const goToCertificate = () => navigate(`/student/certificates/program/${progId}`);

    if (loading) return <div className="p-3 lg:p-6">جاري التحميل…</div>;
    if (!course) return <div className="p-3 lg:p-6">لم يتم العثور على البرنامج.</div>;
    if (course.is_subscribed === false) {
        return <div className="p-3 lg:p-6">لست مشتركًا في هذا البرنامج.</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row h-full p-3 lg:p-6">
            {/* Main area */}
            <div className="flex-1 p-3 lg:p-6 overflow-auto space-y-4 lg:space-y-6">
                <div key={`video-container-${currentSessionId}-${selectedVideoUrl}`} className="w-full bg-black rounded-lg overflow-hidden shadow">
                    {selectedVideoType === 'url' && selectedVideoUrl ? (
                        // External video URL - try to embed YouTube/Vimeo, otherwise show link
                        (() => {
                            const url = selectedVideoUrl;
                            // Check if it's a YouTube URL
                            const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
                            const youtubeMatch = url.match(youtubeRegex);
                            
                            // Check if it's a Vimeo URL
                            const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
                            const vimeoMatch = url.match(vimeoRegex);
                            
                            if (youtubeMatch) {
                                const videoId = youtubeMatch[1];
                                // Add session ID as query param to prevent caching and force reload
                                const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1&t=0&session=${currentSessionId || 'none'}`;
                                return (
                                    <div key={`youtube-${currentSessionId}-${videoId}-${selectedVideoUrl}`} className="w-full h-48 sm:h-56 lg:h-64">
                                        <iframe
                                            key={`youtube-iframe-${currentSessionId}-${videoId}-${selectedVideoUrl}-${videoKeyRef.current}`}
                                            className="w-full h-full"
                                            src={embedUrl}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                );
                            } else if (vimeoMatch) {
                                const videoId = vimeoMatch[1];
                                // Add session ID as query param to prevent caching and force reload
                                const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=0&t=0&session=${currentSessionId || 'none'}`;
                                return (
                                    <div key={`vimeo-${currentSessionId}-${videoId}-${selectedVideoUrl}`} className="w-full h-48 sm:h-56 lg:h-64">
                                        <iframe
                                            key={`vimeo-iframe-${currentSessionId}-${videoId}-${selectedVideoUrl}-${videoKeyRef.current}`}
                                            className="w-full h-full"
                                            src={embedUrl}
                                            title="Vimeo video player"
                                            frameBorder="0"
                                            allow="autoplay; fullscreen; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                );
                            } else {
                                // Generic external URL - show as clickable link
                                return (
                                    <div key={`external-${currentSessionId}-${url}`} className="w-full h-48 sm:h-56 lg:h-64 flex items-center justify-center bg-gray-900">
                                        <div className="text-center p-4">
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                <PlayIcon className="w-5 h-5" />
                                                <span>فتح رابط الفيديو</span>
                                            </a>
                                            <p className="text-gray-400 text-sm mt-2">فيديو خارجي</p>
                                        </div>
                                    </div>
                                );
                            }
                        })()
                    ) : selectedVideoUrl ? (
                        // Video file - show video player
                        <video 
                            key={`video-${currentSessionId}-${selectedVideoUrl}`}
                            className="w-full h-48 sm:h-56 lg:h-64" 
                            controls
                            src={selectedVideoUrl} 
                        />
                    ) : (   
                        // No video available
                        <div className="w-full h-48 sm:h-56 lg:h-64 flex items-center justify-center bg-gray-900">
                            <p className="text-gray-400">لا يوجد فيديو متاح</p>
                        </div>
                    )}
                </div>

                {/* Session Files */}
                {currentSessionFiles && currentSessionFiles.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm font-semibold text-gray-700 mb-3">الملفات المرفقة:</div>
                        <div className="flex flex-wrap gap-2">
                            {currentSessionFiles.map((file, i) => {
                                const fileName = file.path ? file.path.split("/").pop() : '';
                                return (
                                    <a
                                        key={i}
                                        href={file.path}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                                    >
                                        <PaperClipIcon className="w-4 h-4 text-gray-600" />
                                        <span className="text-gray-800">{fileName}</span>
                                        {file.size && (
                                            <span className="text-gray-500">({file.size})</span>
                                        )}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1"><ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" /><span>{course?.program_duration || "0:00"}</span></div>
                    <div className="flex items-center gap-1"><PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" /><span>{topStats.videoCount} فيديو</span></div>
                    <div className="flex items-center gap-1"><ClipboardDocumentListIcon className="w-4 h-4 sm:w-5 sm:h-5" /><span>{topStats.sectionsCount} أقسام</span></div>
                    <div className="flex-1" />
                    {topStats.progress >= 50 && (
                        <button onClick={goToCertificate} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#224161] text-white text-xs sm:text-sm" title="عرض الشهادة">
                            🎓 عرض الشهادة
                        </button>
                    )}
                </div>

                <Tab.Group>
                    <Tab.List className="flex flex-wrap gap-2 sm:gap-5 border-gray-200">
                        {["نظرة عامة", "أسئلة وأجوبة", "المهام والاختبارات", "التقييم"].map((tab) => (
                            <Tab key={tab} className={({ selected }) =>
                                `pb-2 text-sm sm:text-base font-semibold transition focus:outline-none ${selected ? "text-primary border-b-4 border-primary" : "text-gray-500 hover:text-primary"}`
                            }>{tab}</Tab>
                        ))}
                    </Tab.List>

                    <Tab.Panels className="mt-4 lg:mt-6 space-y-4 lg:space-y-6">
                        <Tab.Panel><OverviewTab course={course} reviewsSummary={reviewsSummary} topStats={topStats} onShowCertificate={goToCertificate} /></Tab.Panel>
                        <Tab.Panel>
                            <QnaTab
                                discussions={discussions}
                                hasMore={hasMore}
                                loadMore={() => load(false)}
                                submitQuestion={submitQuestion}
                                submitReply={submitReply}
                                currentSessionId={currentSessionId}
                                qnaFilter={qnaFilter}
                                setQnaFilter={setQnaFilter}
                            />
                        </Tab.Panel>
                        <Tab.Panel><ActivitiesTab loading={aeLoading} items={aeItems} /></Tab.Panel>
                        <Tab.Panel><ReviewsTab course={course} summary={reviewsSummary} /></Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>

            <CurriculumDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                curriculum={curriculum}
                currentSessionId={currentSessionId}
                onSelect={setCurrentSessionId}
            />
        </div>
    );
}
