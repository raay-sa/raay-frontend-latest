// src/pages/dashboard/components/tabs/OverviewTab.jsx
import { StarIcon, ClockIcon, PlayIcon, ClipboardDocumentListIcon, CheckIcon } from "@heroicons/react/24/outline";
import InstructorCard from "../InstructorCard";
import { BASE_URL, joinUrl } from "../../utils";
import { processProgram } from "../../utils/translations";

export default function OverviewTab({ course, reviewsSummary, topStats, onShowCertificate }) {
    // Process course data to extract translations
    const processedCourse = processProgram(course);
    
    return (
        <div className="space-y-4">
            <h1 className="font-bold text-2xl">{processedCourse.title}</h1>
            <p className="text-gray-700 leading-relaxed">{processedCourse.description}</p>

            <div className="flex items-center gap-4 text-gray-600">
                <StarIcon className="w-5 h-5 text-yellow-400" />
                <span className="font-medium">{Number(reviewsSummary?.average || 0).toFixed(1)}</span>
                <span>({reviewsSummary?.total || 0} تقييم)</span>
                <span>{course?.subscriptions_count ?? 0} متدرب</span>
            </div>
            <p className="text-md text-[#5F5F5F]">
                آخر تحديث {new Date(course.updated_at || course.created_at).toLocaleDateString("ar-EG")}
            </p>

            <hr />
            <div>
                <h1 className="font-bold text-2xl">وصف</h1>
                <p>{processedCourse.description}</p>
            </div>
            <hr />

            {/* Learning Objectives */}
            {processedCourse.learning && processedCourse.learning.length > 0 && (
                <>
                    <div>
                        <h1 className="font-bold text-2xl mb-4">ما ستتعلمه في هذا البرنامج</h1>
                        <ul className="space-y-2">
                            {processedCourse.learning.map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <div className='bg-[#4CAF50] rounded-full p-1'>
                                        <CheckIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <hr />
                </>
            )}

            {/* Requirements */}
            {processedCourse.requirement && processedCourse.requirement.length > 0 && (
                <>
                    <div>
                        <h1 className="font-bold text-2xl mb-4">متطلبات البرنامج</h1>
                        <ul className="space-y-2">
                            {processedCourse.requirement.map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <div className='bg-[#4CAF50] rounded-full p-1'>
                                        <CheckIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <hr />
                </>
            )}

            <InstructorCard
                name={course.teacher?.name || "—"}
                role={course.teacher?.categories?.map((c) => c.title).join("، ") || "—"}
                avatar={course.teacher?.image ? joinUrl(BASE_URL, course.teacher.image) : "/thumbnails/avatar.png"}
                bio={course.teacher?.bio || ""}
                rating={Number(reviewsSummary?.average || 0)}
                trainees={course.teacher?.trainees_count ?? 0}
                courses={course.teacher?.programs_count ?? 0}
                showStats={false}
                showSocials={true}
            />
        </div>
    );
}
