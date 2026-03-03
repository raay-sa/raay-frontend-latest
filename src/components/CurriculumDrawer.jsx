// src/components/CurriculumDrawer.jsx
import { Disclosure } from "@headlessui/react";
import { PlayIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { extractTranslation } from "../utils/translations";

export default function CurriculumDrawer({ open, onClose, curriculum, currentSessionId, onSelect }) {
    if (!open) return null;
    return (
        <div className="w-72 bg-white h-1/2 shadow-lg p-4 overflow-auto">
            <div className="mb-4">
                <h2 className="font-semibold text-lg">محتوى البرنامج</h2>
            </div>

            <div className="space-y-4">
                {curriculum.map((section) => {
                    // Process section title from translations if available
                    const sectionTitle = section.translations ? 
                        extractTranslation(section, 'title', 'ar') : 
                        section.title;
                    
                    return (
                        <Disclosure key={section.id} as="div" className="space-y-1">
                            {({ open }) => (
                                <>
                                    <Disclosure.Button className="w-full flex justify-between items-center px-2 py-1 bg-gray-100 rounded">
                                        <div>
                                            <span className="font-medium">{sectionTitle}</span>
                                            <span className="text-xs text-gray-600 mr-2">
                                                {section.count ? `0/${section.count} فيديو` : "0/0 فيديو"} · {section.duration || "0:00"}
                                            </span>
                                        </div>
                                        <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${open ? "rotate-180" : ""}`} />
                                    </Disclosure.Button>

                                    <Disclosure.Panel className="pl-2 pr-1">
                                        {section.lessons.map((lesson) => {
                                            // Handle type mismatch (string vs number) for comparison
                                            const selected = String(lesson.id) === String(currentSessionId);
                                            // Process lesson title from translations if available
                                            const lessonTitle = lesson.translations ? 
                                                extractTranslation(lesson, 'title', 'ar') : 
                                                lesson.title;
                                            
                                            return (
                                                <div
                                                    key={lesson.id}
                                                    className={`flex items-center justify-between text-sm py-2 px-2 rounded cursor-pointer ${selected ? "bg-[#F7F7F7]" : ""}`}
                                                    onClick={() => onSelect(lesson.id)}
                                                    title="تبديل الجلسة (الفيديو)"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input type="checkbox" className="accent-primary" checked={selected} readOnly />
                                                        <div className="flex items-center gap-2">
                                                            <PlayIcon className="w-4 h-4 text-gray-500" />
                                                            <span className="text-gray-800">{lesson.index}. {lessonTitle}</span>
                                                        </div>
                                                        {lesson.hasResources && (
                                                            <span className="text-xs bg-primary text-white rounded-md px-2 py-0.5 mr-2">موارد</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500">{lesson.length}</span>
                                                </div>
                                            );
                                        })}
                                    </Disclosure.Panel>
                                </>
                            )}
                        </Disclosure>
                    );
                })}
            </div>
        </div>
    );
}
