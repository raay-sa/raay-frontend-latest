// src/pages/dashboard/expert/Program/SectionsManager.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SectionsService from "../../../../services/teacher/sectionsService";
import SessionsService from "../../../../services/teacher/sessionsService";
import { withBaseUrl } from "../../../../utils/url";
import toast from "react-hot-toast";
import Resumable from "resumablejs";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    PlusIcon,
    PlayIcon,
    PaperClipIcon,
    XMarkIcon,
    VideoCameraIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";

// If you store your API base somewhere, use it. Otherwise rely on your axios baseURL.
const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; 

export default function SectionsManager() {
    const { id: programId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState([]);
    const [sessionsMap, setSessionsMap] = useState({});
    const [open, setOpen] = useState({});
    const [forms, setForms] = useState({}); 
    const [editingSession, setEditingSession] = useState(null); // { sessionId, sectionId }

    // per-session video preview toggles
    const [videoOpen, setVideoOpen] = useState({}); 

    // Keep a Resumable instance per section while uploading
    const resumablesRef = useRef({});

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await SectionsService.getProgramSections(programId);
                const list = Array.isArray(data?.data) ? data.data : [];
                
                // Process sections to extract titles from translations
                const processedSections = list.map(section => {
                    if (section.translations && Array.isArray(section.translations)) {
                        const arTranslation = section.translations.find(t => t.locale === 'ar');
                        const enTranslation = section.translations.find(t => t.locale === 'en');
                        return {
                            ...section,
                            title: arTranslation?.title || section.title || '',
                            title_ar: arTranslation?.title || '',
                            title_en: enTranslation?.title || ''
                        };
                    }
                    return section;
                });
                
                setSections(processedSections);

                const map = {};
                await Promise.all(
                    list.map(async (s) => {
                        try {
                            const res = await SectionsService.getSectionSessions(s.id);
                            const sessions = Array.isArray(res?.data?.data) ? res.data.data : [];
                            
                            // Process sessions to extract titles from translations
                            const processedSessions = sessions.map(session => {
                                if (session.translations && Array.isArray(session.translations)) {
                                    const arTranslation = session.translations.find(t => t.locale === 'ar');
                                    const enTranslation = session.translations.find(t => t.locale === 'en');
                                    return {
                                        ...session,
                                        title: arTranslation?.title || session.title || '',
                                        title_ar: arTranslation?.title || '',
                                        title_en: enTranslation?.title || ''
                                    };
                                }
                                return session;
                            });
                            
                            map[s.id] = processedSessions;
                        } catch {
                            map[s.id] = [];
                        }
                    })
                );
                setSessionsMap(map);
            } catch (e) {
                console.error("Failed to load sections", e);
                toast.error("تعذر تحميل الأقسام");
            } finally {
                setLoading(false);
            }
        })();
    }, [programId]);

    const toggleOpen = (sid) => setOpen((o) => ({ ...o, [sid]: !o[sid] }));
    const toggleVideo = (sessionId) =>
        setVideoOpen((v) => ({ ...v, [sessionId]: !v[sessionId] }));

    const ensureForm = (sid) =>
        setForms((prev) =>
            prev[sid]
                ? prev
                : {
                    ...prev,
                    [sid]: {
                        title: { ar: "", en: "" },
                        videoType: "file", // "file" or "url"
                        videoFile: null,
                        videoUrl: "",
                        videoDuration: "", // Duration in HH:MM:SS format
                        attachments: [],
                        progress: 0,
                        uploading: false,
                    },
                }
        );

    const updateForm = (sid, changes) =>
        setForms((prev) => ({ ...prev, [sid]: { ...(prev[sid] || {}), ...changes } }));

    const handleSelectVideo = (sid, file) => {
        ensureForm(sid);
        updateForm(sid, { videoFile: file });
    };

    const handleVideoUrlChange = (sid, url) => {
        ensureForm(sid);
        updateForm(sid, { videoUrl: url });
    };

    const handleVideoTypeChange = (sid, type) => {
        ensureForm(sid);
        updateForm(sid, { 
            videoType: type,
            videoFile: null, // Clear file when switching to URL
            videoUrl: "", // Clear URL when switching to file
            videoDuration: "" // Clear duration when switching
        });
    };

    const handleVideoDurationChange = (sid, duration) => {
        ensureForm(sid);
        updateForm(sid, { videoDuration: duration });
    };

    const handleSelectAttachments = (sid, files) => {
        ensureForm(sid);
        updateForm(sid, { attachments: Array.from(files || []) });
    };

    // Validate duration format (HH:MM:SS)
    const validateDuration = (duration) => {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        return timeRegex.test(duration);
    };

    // Build a usable video URL from various possible keys
    const getVideoUrl = (sessionObj) => {
        // Check for direct URL first
        if (sessionObj?.url) {
            return sessionObj.url;
        }
        // Then check for video file path
        const raw =
            sessionObj?.video_url ||
            sessionObj?.video_path ||
            sessionObj?.video ||
            sessionObj?.media_url ||
            "";
        return raw ? withBaseUrl(raw) : "";
    };

    /**
     * Handle session creation - either upload file or submit URL
     */
    const createSession = async (sid) => {
        const f = forms[sid];
        if (!f) return toast.error("خطأ في النموذج");
        
        if (f.videoType === "file") {
            if (f.videoFile) {
                return uploadWithResumable(sid);
            } else {
                // No video file, create session without video
                return submitWithoutVideo(sid);
            }
        } else {
            if (f.videoUrl?.trim()) {
                if (!f.videoDuration?.trim()) return toast.error("يرجى إدخال مدة الفيديو");
                if (!validateDuration(f.videoDuration)) return toast.error("يرجى إدخال مدة الفيديو بالتنسيق الصحيح (ساعة:دقيقة:ثانية) مثل 02:30:00");
                return submitWithUrl(sid);
            } else {
                // No video URL, create session without video
                return submitWithoutVideo(sid);
            }
        }
    };

    /**
     * Submit session without video (title and attachments only)
     */
    const submitWithoutVideo = async (sid) => {
        const f = forms[sid];
        updateForm(sid, { uploading: true, progress: 0 });

        try {
            // Use the chunk endpoint for all session creation
            const formData = new FormData();
            formData.append('title[ar]', f.title?.ar || '');
            formData.append('title[en]', f.title?.en || '');
            formData.append('section_id', sid);

            const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
            const response = await fetch(`${API_BASE}/teacher/sessions/chunk`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });
            const data = await response.json();
            
            if (data?.success) {
                const sessionId = data.data?.session_id || data.data?.id;
                toast.success("تم إنشاء الجلسة بنجاح");

                // Upload attachments if any
                if (sessionId && Array.isArray(f.attachments) && f.attachments.length) {
                    try {
                        await SessionsService.uploadAttachments(sessionId, f.attachments);
                    } catch (e) {
                        console.warn("attachments upload failed", e);
                        toast.error("تم إنشاء الجلسة، لكن تعذر رفع المرفقات");
                    }
                }

                // Refresh sessions list
                try {
                    const res = await SectionsService.getSectionSessions(sid);
                    const sessions = Array.isArray(res?.data?.data) ? res.data.data : [];
                    
                    // Process sessions to extract titles from translations
                    const processedSessions = sessions.map(session => {
                        if (session.translations && Array.isArray(session.translations)) {
                            const arTranslation = session.translations.find(t => t.locale === 'ar');
                            const enTranslation = session.translations.find(t => t.locale === 'en');
                            return {
                                ...session,
                                title: arTranslation?.title || session.title || '',
                                title_ar: arTranslation?.title || '',
                                title_en: enTranslation?.title || ''
                            };
                        }
                        return session;
                    });
                    
                    setSessionsMap((prev) => ({
                        ...prev,
                        [sid]: processedSessions,
                    }));
                } catch { 
                    // Ignore refresh errors
                }

                // Reset form
                updateForm(sid, {
                    title: { ar: "", en: "" },
                    videoType: "file",
                    videoFile: null,
                    videoUrl: "",
                    videoDuration: "",
                    attachments: [],
                    progress: 0,
                    uploading: false,
                });
            } else {
                // Handle validation errors
                if (data?.errors) {
                    const errorMessages = [];
                    if (data.errors.title) {
                        errorMessages.push(...(Array.isArray(data.errors.title) ? data.errors.title : [data.errors.title]));
                    }
                    if (data.errors.section_id) {
                        errorMessages.push(...(Array.isArray(data.errors.section_id) ? data.errors.section_id : [data.errors.section_id]));
                    }
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages.join(', '));
                    } else {
                        toast.error(data.message || "تعذر إنشاء الجلسة");
                    }
                } else {
                    toast.error(data.message || "تعذر إنشاء الجلسة");
                }
                throw new Error(data.message || "Server did not return success");
            }
        } catch (e) {
            console.error(e);
            if (!e.message || e.message === "Server did not return success") {
                // Error already shown above
            } else {
                toast.error("تعذر إنشاء الجلسة");
            }
            updateForm(sid, { uploading: false });
        }
    };

    /**
     * Submit session with URL instead of file upload
     */
    const submitWithUrl = async (sid) => {
        const f = forms[sid];
        updateForm(sid, { uploading: true, progress: 0 });

        try {
            const formData = new FormData();
            formData.append('title[ar]', f.title.ar || '');
            formData.append('title[en]', f.title.en || '');
            formData.append('section_id', sid);
            formData.append('url', f.videoUrl);
            formData.append('duration', f.videoDuration);

            // Use the chunk endpoint for URL uploads too
            const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
            const response = await fetch(`${API_BASE}/teacher/sessions/chunk`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });
            const data = await response.json();
            
            if (data?.success) {
                const sessionId = data.data?.session_id || data.data?.id;
                toast.success("تم إنشاء الجلسة بنجاح");

                // Upload attachments if any
                if (sessionId && Array.isArray(f.attachments) && f.attachments.length) {
                    try {
                        await SessionsService.uploadAttachments(sessionId, f.attachments);
                    } catch (e) {
                        console.warn("attachments upload failed", e);
                        toast.error("تم إنشاء الجلسة، لكن تعذر رفع المرفقات");
                    }
                }

                // Refresh sessions list
                try {
                    const res = await SectionsService.getSectionSessions(sid);
                    setSessionsMap((prev) => ({
                        ...prev,
                        [sid]: Array.isArray(res?.data?.data) ? res.data.data : [],
                    }));
                } catch { 
                    // Ignore refresh errors
                }

                // Reset form
                updateForm(sid, {
                    title: { ar: "", en: "" },
                    videoType: "file",
                    videoFile: null,
                    videoUrl: "",
                    videoDuration: "",
                    attachments: [],
                    progress: 0,
                    uploading: false,
                });
            } else {
                // Handle validation errors
                if (data?.errors) {
                    const errorMessages = [];
                    if (data.errors.title) {
                        errorMessages.push(...(Array.isArray(data.errors.title) ? data.errors.title : [data.errors.title]));
                    }
                    if (data.errors.section_id) {
                        errorMessages.push(...(Array.isArray(data.errors.section_id) ? data.errors.section_id : [data.errors.section_id]));
                    }
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages.join(', '));
                    } else {
                        toast.error(data.message || "تعذر إنشاء الجلسة");
                    }
                } else {
                    toast.error(data.message || "تعذر إنشاء الجلسة");
                }
                throw new Error(data.message || "Server did not return success");
            }
        } catch (e) {
            console.error(e);
            if (!e.message || e.message === "Server did not return success") {
                // Error already shown above
            } else {
                toast.error("تعذر إنشاء الجلسة");
            }
            updateForm(sid, { uploading: false });
        }
    };

    /**
     * Initialize a Resumable instance and upload once
     * - Sends title/section_id in the request body for every chunk
     * - Controller assembles chunks and creates the session on last chunk
     */
    const uploadWithResumable = (sid) => {
        const f = forms[sid];

        // Validate required fields
        if (!f.title?.ar?.trim() && !f.title?.en?.trim()) {
            toast.error("يرجى إدخال عنوان الجلسة على الأقل بالعربية أو الإنجليزية");
            return;
        }

        // If you need auth header, read your token (adjust to your auth flow)
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token") || "";

        // Create a new instance PER upload
        const r = new Resumable({
            target: `${API_BASE}/teacher/sessions/chunk`,
            // Resumable recommends 1-10MB chunks; 2-4MB is okay for most setups
            chunkSize: 2 * 1024 * 1024,
            forceChunkSize: true,
            testChunks: false, // don't do GET test for existing chunks
            simultaneousUploads: 2,
            fileType: ["mp4", "mov", "avi", "mkv", "webm"],

            // Headers are sent on every chunk
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            // Param name for the file blob must be "file" to match the FileReceiver('file', ...)
            fileParameterName: "file",
        });

        // Store form data for this upload with upload ID for matching
        const uploadFormData = {
            section_id: String(sid),
            'title[ar]': f.title?.ar?.trim() || '',
            'title[en]': f.title?.en?.trim() || '',
        };

        // Track active uploads to handle concurrent uploads
        if (!window._resumableUploads) {
            window._resumableUploads = new Map();
        }
        const uploadId = `${sid}_${Date.now()}_${Math.random()}`;
        window._resumableUploads.set(uploadId, uploadFormData);

        // Intercept XMLHttpRequest to add form fields to the body (only if not already patched)
        if (!XMLHttpRequest.prototype._resumablePatched) {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._resumableUrl = url;
                this._resumableMethod = method;
                return originalOpen.call(this, method, url, ...args);
            };

            XMLHttpRequest.prototype.send = function(body) {
                // Check if this is a chunk upload request (POST to sessions/chunk endpoint)
                const isChunkUpload = this._resumableUrl && 
                    this._resumableMethod === 'POST' &&
                    (this._resumableUrl.includes('/sessions/chunk') || 
                     this._resumableUrl.includes('/teacher/sessions/chunk') ||
                     this._resumableUrl.includes('/admin/sessions/chunk'));
                
                if (isChunkUpload) {
                    // Find matching upload data - try to match by URL or use the most recent
                    let matchedData = null;
                    
                    // Try to find upload data that matches this request
                    // For simplicity, we'll use the most recent upload, but in production
                    // you might want to add a more sophisticated matching mechanism
                    for (const [, data] of window._resumableUploads.entries()) {
                        matchedData = data;
                        break; // Use first active upload
                    }
                    
                    if (matchedData && matchedData.section_id) {
                        // Resumable.js sends FormData, so we need to append to it
                        if (body instanceof FormData) {
                            // Append our fields to the existing FormData
                            body.append('section_id', matchedData.section_id);
                            body.append('title[ar]', matchedData['title[ar]'] || '');
                            body.append('title[en]', matchedData['title[en]'] || '');
                            
                            // Call original send with modified FormData
                            return originalSend.call(this, body);
                        } else if (body instanceof Blob || body instanceof File) {
                            // Fallback: if it's a Blob/File, create new FormData
                            const formData = new FormData();
                            
                            // Add the file chunk
                            formData.append('file', body);
                            
                            // Add section_id and title to the body - ensure they are always sent
                            formData.append('section_id', matchedData.section_id);
                            formData.append('title[ar]', matchedData['title[ar]'] || '');
                            formData.append('title[en]', matchedData['title[en]'] || '');
                            
                            // Call original send with modified FormData
                            return originalSend.call(this, formData);
                        } else {
                            console.warn('Unexpected body type for chunk upload:', typeof body);
                        }
                    } else {
                        console.warn('No matching upload data found for chunk upload');
                    }
                }
                // For other requests, use original behavior
                return originalSend.call(this, body);
            };

            XMLHttpRequest.prototype._resumablePatched = true;
            XMLHttpRequest.prototype._resumableOriginalOpen = originalOpen;
            XMLHttpRequest.prototype._resumableOriginalSend = originalSend;
        }

        // Store upload ID for cleanup
        r._uploadId = uploadId;

        // Save instance so we can abort if needed
        resumablesRef.current[sid] = r;

        // Hook up events
        r.on("fileAdded", () => {
            updateForm(sid, { uploading: true, progress: 0 });
            r.upload();
        });

        r.on("fileProgress", (file) => {
            const pct = Math.floor(file.progress() * 100);
            updateForm(sid, { progress: pct });
        });

        r.on("fileSuccess", async (file, serverMessage) => {
            try {
                const msg = JSON.parse(serverMessage || "{}");
                
                // Check if this is a partial response (chunk progress) or final response
                if (msg?.partial === true) {
                    // This is just progress update, not the final response
                    // The backend will return the final response when all chunks are done
                    return;
                }
                
                if (!msg?.success) {
                    throw new Error(msg?.message || "Server did not return success.");
                }
                
                const sessionId = msg?.data?.session_id;
                
                if (!sessionId) {
                    throw new Error("Session was not created - no session_id in response");
                }

                toast.success("تم رفع الجلسة وإنشاؤها بنجاح");

                // Optional: upload attachments AFTER the session exists
                if (sessionId && Array.isArray(f.attachments) && f.attachments.length) {
                    try {
                        await SessionsService.uploadAttachments(sessionId, f.attachments);
                    } catch (e) {
                        console.warn("attachments upload failed", e);
                        toast.error("تم رفع الفيديو، لكن تعذر رفع المرفقات");
                    }
                }

                // Refresh this section's sessions list
                try {
                    const res = await SectionsService.getSectionSessions(sid);
                    const sessions = Array.isArray(res?.data?.data) ? res.data.data : [];
                    
                    // Process sessions to extract titles from translations
                    const processedSessions = sessions.map(session => {
                        if (session.translations && Array.isArray(session.translations)) {
                            const arTranslation = session.translations.find(t => t.locale === 'ar');
                            const enTranslation = session.translations.find(t => t.locale === 'en');
                            return {
                                ...session,
                                title: arTranslation?.title || session.title || '',
                                title_ar: arTranslation?.title || '',
                                title_en: enTranslation?.title || ''
                            };
                        }
                        return session;
                    });
                    
                    setSessionsMap((prev) => ({
                        ...prev,
                        [sid]: processedSessions,
                    }));
                } catch { 
                    // Ignore refresh errors
                }

                // Reset form
                updateForm(sid, {
                    title: { ar: "", en: "" },
                    videoType: "file",
                    videoFile: null,
                    videoUrl: "",
                    videoDuration: "",
                    attachments: [],
                    progress: 0,
                    uploading: false,
                });
            } catch (e) {
                console.error(e);
                toast.error("حدث خطأ بعد رفع الفيديو");
                updateForm(sid, { uploading: false });
            } finally {
                // Remove this upload from tracking
                if (r._uploadId && window._resumableUploads) {
                    window._resumableUploads.delete(r._uploadId);
                    
                    // If no more active uploads, restore original methods
                    if (window._resumableUploads.size === 0 && XMLHttpRequest.prototype._resumablePatched) {
                        if (XMLHttpRequest.prototype._resumableOriginalOpen) {
                            XMLHttpRequest.prototype.open = XMLHttpRequest.prototype._resumableOriginalOpen;
                        }
                        if (XMLHttpRequest.prototype._resumableOriginalSend) {
                            XMLHttpRequest.prototype.send = XMLHttpRequest.prototype._resumableOriginalSend;
                        }
                        XMLHttpRequest.prototype._resumablePatched = false;
                    }
                }
                delete resumablesRef.current[sid];
            }
        });

        r.on("fileError", (file, message) => {
            console.error("Upload failed:", message);
            
            // Try to parse error message to show validation errors
            try {
                const errorData = typeof message === 'string' ? JSON.parse(message) : message;
                if (errorData?.errors) {
                    // Show validation errors
                    const errorMessages = [];
                    if (errorData.errors.title) {
                        errorMessages.push(...(Array.isArray(errorData.errors.title) ? errorData.errors.title : [errorData.errors.title]));
                    }
                    if (errorData.errors.section_id) {
                        errorMessages.push(...(Array.isArray(errorData.errors.section_id) ? errorData.errors.section_id : [errorData.errors.section_id]));
                    }
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages.join(', '));
                    } else {
                        toast.error(errorData.message || "تعذر رفع الفيديو");
                    }
                } else {
                    toast.error(errorData?.message || "تعذر رفع الفيديو");
                }
            } catch {
                toast.error("تعذر رفع الفيديو");
            }
            
            updateForm(sid, { uploading: false });
            // Remove this upload from tracking
            if (r._uploadId && window._resumableUploads) {
                window._resumableUploads.delete(r._uploadId);
                
                // If no more active uploads, restore original methods
                if (window._resumableUploads.size === 0 && XMLHttpRequest.prototype._resumablePatched) {
                    if (XMLHttpRequest.prototype._resumableOriginalOpen) {
                        XMLHttpRequest.prototype.open = XMLHttpRequest.prototype._resumableOriginalOpen;
                    }
                    if (XMLHttpRequest.prototype._resumableOriginalSend) {
                        XMLHttpRequest.prototype.send = XMLHttpRequest.prototype._resumableOriginalSend;
                    }
                    XMLHttpRequest.prototype._resumablePatched = false;
                }
            }
            delete resumablesRef.current[sid];
        });

        // Add the selected file and start
        r.addFile(f.videoFile);
    };

    /**
     * Start editing a session - populate form with session data
     */
    const startEditSession = (session, sectionId) => {
        // Get current files from session - check both files and attachments
        const sessionFiles = Array.isArray(session.files) ? session.files : [];
        const sessionAttachments = Array.isArray(session.attachments) ? session.attachments : [];
        // Combine both arrays, prioritizing files
        const currentFiles = sessionFiles.length > 0 ? sessionFiles : sessionAttachments;
        
        // Extract title from translations array if title_ar/title_en are not available
        let titleAr = session.title_ar || "";
        let titleEn = session.title_en || "";
        
        // If titles are not in processed format, extract from translations array
        if (!titleAr && !titleEn && Array.isArray(session.translations)) {
            const arTranslation = session.translations.find(t => t.locale === 'ar');
            const enTranslation = session.translations.find(t => t.locale === 'en');
            titleAr = arTranslation?.title || session.title || "";
            titleEn = enTranslation?.title || "";
        } else if (!titleAr) {
            // Fallback to session.title if available
            titleAr = session.title || "";
        }
        
        const editForm = {
            title: {
                ar: titleAr,
                en: titleEn,
            },
            videoType: session.url ? "url" : "file",
            videoFile: null, // Don't pre-populate file
            videoUrl: session.url || "",
            videoDuration: session.formatted_video_duration || session.duration || "",
            currentVideo: session.video || null, // Store current video path for display
            attachments: [], // New files to upload (will replace current ones)
            currentFiles: currentFiles, // Store current files for display
            progress: 0,
            uploading: false,
        };
        
        setEditingSession({ sessionId: session.id, sectionId });
        setForms((prev) => ({ 
            ...prev, 
            [`edit_${session.id}`]: editForm 
        }));
        
        // Ensure section is open
        setOpen((o) => ({ ...o, [sectionId]: true }));
    };

    /**
     * Cancel editing
     */
    const cancelEdit = () => {
        if (editingSession) {
            setForms((prev) => {
                const next = { ...prev };
                delete next[`edit_${editingSession.sessionId}`];
                return next;
            });
        }
        setEditingSession(null);
    };

    /**
     * Update an existing session
     */
    const updateSession = async (sessionId, sectionId) => {
        const formKey = `edit_${sessionId}`;
        const f = forms[formKey];
        if (!f) return toast.error("خطأ في النموذج");

        updateForm(formKey, { uploading: true, progress: 0 });

        try {
            const formData = new FormData();
            formData.append("_method", "PUT");
            formData.append("title[ar]", f.title?.ar || "");
            formData.append("title[en]", f.title?.en || "");
            formData.append("section_id", sectionId);
            
            // Add type if available (default to registered)
            formData.append("type", "registered");

            // Handle video - either file or URL
            if (f.videoType === "file" && f.videoFile) {
                formData.append("video", f.videoFile);
            } else if (f.videoType === "url" && f.videoUrl?.trim()) {
                formData.append("url", f.videoUrl.trim());
                if (f.videoDuration?.trim()) {
                    if (!validateDuration(f.videoDuration)) {
                        toast.error("يرجى إدخال مدة الفيديو بالتنسيق الصحيح (ساعة:دقيقة:ثانية) مثل 02:30:00");
                        updateForm(formKey, { uploading: false });
                        return;
                    }
                    formData.append("duration", f.videoDuration.trim());
                }
            }

            // Add attachments if any
            if (Array.isArray(f.attachments) && f.attachments.length > 0) {
                f.attachments.forEach((file) => {
                    formData.append("files[]", file);
                });
            }

            const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
            const response = await fetch(`${API_BASE}/teacher/sessions/${sessionId}`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            const data = await response.json();

            if (data?.success || response.ok) {
                toast.success("تم تحديث الجلسة بنجاح");

                // Refresh sessions list
                try {
                    const res = await SectionsService.getSectionSessions(sectionId);
                    const sessions = Array.isArray(res?.data?.data) ? res.data.data : [];
                    
                    // Process sessions to extract titles from translations
                    const processedSessions = sessions.map(session => {
                        if (session.translations && Array.isArray(session.translations)) {
                            const arTranslation = session.translations.find(t => t.locale === 'ar');
                            const enTranslation = session.translations.find(t => t.locale === 'en');
                            return {
                                ...session,
                                title: arTranslation?.title || session.title || '',
                                title_ar: arTranslation?.title || '',
                                title_en: enTranslation?.title || ''
                            };
                        }
                        return session;
                    });
                    
                    setSessionsMap((prev) => ({
                        ...prev,
                        [sectionId]: processedSessions,
                    }));
                } catch {
                    // Ignore refresh errors
                }

                // Cancel edit mode
                cancelEdit();
            } else {
                // Handle validation errors
                if (data?.errors) {
                    const errorMessages = [];
                    if (data.errors.title) {
                        errorMessages.push(...(Array.isArray(data.errors.title) ? data.errors.title : [data.errors.title]));
                    }
                    if (data.errors.section_id) {
                        errorMessages.push(...(Array.isArray(data.errors.section_id) ? data.errors.section_id : [data.errors.section_id]));
                    }
                    if (errorMessages.length > 0) {
                        toast.error(errorMessages.join(', '));
                    } else {
                        toast.error(data.message || "تعذر تحديث الجلسة");
                    }
                } else {
                    toast.error(data.message || "تعذر تحديث الجلسة");
                }
                updateForm(formKey, { uploading: false });
            }
        } catch (e) {
            console.error(e);
            toast.error("تعذر تحديث الجلسة");
            updateForm(formKey, { uploading: false });
        }
    };

    /**
     * Delete a session
     */
    const handleDeleteSession = async (sessionId, sectionId, sessionTitle) => {
        if (!window.confirm(`هل أنت متأكد من حذف الجلسة "${sessionTitle}"؟`)) {
            return;
        }

        try {
            await SessionsService.deleteSession(sessionId);
            toast.success("تم حذف الجلسة بنجاح");

            // Refresh sessions list
            try {
                const res = await SectionsService.getSectionSessions(sectionId);
                const sessions = Array.isArray(res?.data?.data) ? res.data.data : [];
                
                // Process sessions to extract titles from translations
                const processedSessions = sessions.map(session => {
                    if (session.translations && Array.isArray(session.translations)) {
                        const arTranslation = session.translations.find(t => t.locale === 'ar');
                        const enTranslation = session.translations.find(t => t.locale === 'en');
                        return {
                            ...session,
                            title: arTranslation?.title || session.title || '',
                            title_ar: arTranslation?.title || '',
                            title_en: enTranslation?.title || ''
                        };
                    }
                    return session;
                });
                
                setSessionsMap((prev) => ({
                    ...prev,
                    [sectionId]: processedSessions,
                }));
            } catch {
                // Ignore refresh errors
            }
        } catch (e) {
            console.error(e);
            toast.error("تعذر حذف الجلسة");
        }
    };

    if (loading) return <div className="p-6 text-sm text-gray-500">جاري التحميل…</div>;

    return (
        <div dir="rtl" className="p-3 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 lg:mb-6 gap-3">
                <h1 className="text-xl lg:text-2xl font-bold">إدارة الأقسام والجلسات</h1>
                <button onClick={() => navigate(-1)} className="px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base">
                    رجوع
                </button>
            </div>

            {sections.length === 0 ? (
                <div className="text-gray-600">لا توجد أقسام لهذا البرنامج.</div>
            ) : (
                <div className="space-y-3 lg:space-y-4">
                    {sections.map((sec) => {
                        const sid = sec.id;
                        const form = forms[sid] || {};
                        const sessions = sessionsMap[sid] || [];

                        return (
                            <div key={sid} className="bg-white rounded-xl shadow border">
                                {/* Header */}
                                <button
                                    onClick={() => {
                                        ensureForm(sid);
                                        toggleOpen(sid);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold">{sec.title}</span>
                                    </div>
                                    {open[sid] ? (
                                        <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                                    ) : (
                                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                                    )}
                                </button>

                                {/* Body */}
                                {open[sid] && (
                                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-4 lg:space-y-5">
                                        {/* Sessions list */}
                                        <div>
                                            <h3 className="font-semibold mb-2">الجلسات الحالية</h3>
                                            {sessions.length === 0 ? (
                                                <div className="text-sm text-gray-600">لا توجد جلسات بعد.</div>
                                            ) : (
                                                <ul className="space-y-3">
                                                    {sessions.map((ss) => {
                                                        const vUrl = getVideoUrl(ss);
                                                        const hasVideo = !!(ss.video || ss.url);
                                                        const hasFiles = Array.isArray(ss.files) && ss.files.length > 0;
                                                        const isOpen = !!videoOpen[ss.id];

                                                        const isEditing = editingSession?.sessionId === ss.id;
                                                        const editFormKey = `edit_${ss.id}`;
                                                        const editForm = forms[editFormKey];

                                                        return (
                                                            <li
                                                                key={ss.id}
                                                                className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                                                            >
                                                                {!isEditing ? (
                                                                    <>
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                <PlayIcon className="w-5 h-5 text-gray-500" />
                                                                                <span className="font-medium">{ss.title}</span>
                                                                            </div>

                                                                            <div className="flex items-center gap-3">
                                                                                {ss.formatted_video_duration && (
                                                                                    <span className="text-xs text-gray-500">
                                                                                        {ss.formatted_video_duration}
                                                                                    </span>
                                                                                )}
                                                                                {hasVideo && (
                                                                                    <button
                                                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs hover:bg-gray-100"
                                                                                        onClick={() => toggleVideo(ss.id)}
                                                                                    >
                                                                                        <VideoCameraIcon className="w-4 h-4" />
                                                                                        {isOpen ? "إخفاء الفيديو" : "عرض الفيديو"}
                                                                                    </button>
                                                                                )}
                                                                                <button
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs hover:bg-blue-50 text-blue-600"
                                                                                    onClick={() => startEditSession(ss, sid)}
                                                                                >
                                                                                    <PencilIcon className="w-4 h-4" />
                                                                                    تعديل
                                                                                </button>
                                                                                <button
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs hover:bg-red-50 text-red-600"
                                                                                    onClick={() => handleDeleteSession(ss.id, sid, ss.title)}
                                                                                >
                                                                                    <TrashIcon className="w-4 h-4" />
                                                                                    حذف
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <h4 className="font-semibold">تعديل الجلسة</h4>
                                                                            <button
                                                                                onClick={cancelEdit}
                                                                                className="text-sm text-gray-600 hover:text-gray-800"
                                                                            >
                                                                                إلغاء
                                                                            </button>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            <div>
                                                                                <label className="block mb-1 text-sm">عنوان الجلسة</label>
                                                                                <div className="space-y-2">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editForm?.title?.ar || ""}
                                                                                        onChange={(e) => updateForm(editFormKey, { title: { ...editForm.title, ar: e.target.value } })}
                                                                                        className="w-full border rounded-xl py-2 px-3 text-sm"
                                                                                        placeholder="عنوان الجلسة بالعربية"
                                                                                    />
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editForm?.title?.en || ""}
                                                                                        onChange={(e) => updateForm(editFormKey, { title: { ...editForm.title, en: e.target.value } })}
                                                                                        className="w-full border rounded-xl py-2 px-3 text-sm"
                                                                                        placeholder="عنوان الجلسة بالإنجليزية"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <div>
                                                                                <label className="block mb-1 text-sm">نوع الفيديو</label>
                                                                                <select
                                                                                    value={editForm?.videoType || "file"}
                                                                                    onChange={(e) => {
                                                                                        updateForm(editFormKey, { 
                                                                                            videoType: e.target.value,
                                                                                            videoFile: null,
                                                                                            videoUrl: e.target.value === "url" ? (editForm?.videoUrl || "") : "",
                                                                                            videoDuration: e.target.value === "url" ? (editForm?.videoDuration || "") : ""
                                                                                        });
                                                                                    }}
                                                                                    className="w-full border rounded-xl py-2 px-3 text-sm mb-3"
                                                                                >
                                                                                    <option value="file">رفع ملف فيديو</option>
                                                                                    <option value="url">رابط فيديو</option>
                                                                                </select>

                                                                                {editForm?.videoType === "file" ? (
                                                                                    <>
                                                                                        {/* Show current video if exists */}
                                                                                        {editForm?.currentVideo && (
                                                                                            <div className="mb-3 p-2 bg-gray-50 rounded-lg border">
                                                                                                <div className="text-xs text-gray-700 mb-1 font-medium">
                                                                                                    الفيديو الحالي:
                                                                                                </div>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <VideoCameraIcon className="w-4 h-4 text-blue-600" />
                                                                                                    <span className="text-xs text-gray-700">
                                                                                                        {(() => {
                                                                                                            const videoPath = editForm.currentVideo;
                                                                                                            return typeof videoPath === 'string' 
                                                                                                                ? videoPath.split("/").pop() || videoPath.split("\\").pop() || videoPath
                                                                                                                : 'Video file';
                                                                                                        })()}
                                                                                                    </span>
                                                                                                    {editForm?.videoDuration && (
                                                                                                        <span className="text-xs text-gray-500">
                                                                                                            ({editForm.videoDuration})
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                        
                                                                                        <label className="block mb-1 text-sm">ملف الفيديو (اختياري - اتركه فارغاً للاحتفاظ بالفيديو الحالي)</label>
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="video/*"
                                                                                            onChange={(e) => updateForm(editFormKey, { videoFile: e.target.files?.[0] || null })}
                                                                                            className="w-full border rounded-xl py-2 px-3 text-sm"
                                                                                        />
                                                                                        {editForm?.videoFile && (
                                                                                            <p className="text-xs text-gray-500 mt-1">
                                                                                                تم اختيار: {editForm.videoFile.name}
                                                                                            </p>
                                                                                        )}
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <label className="block mb-1 text-sm">رابط الفيديو</label>
                                                                                        <input
                                                                                            type="url"
                                                                                            value={editForm?.videoUrl || ""}
                                                                                            onChange={(e) => updateForm(editFormKey, { videoUrl: e.target.value })}
                                                                                            className="w-full border rounded-xl py-2 px-3 text-sm mb-3"
                                                                                            placeholder="https://example.com/video.mp4"
                                                                                        />
                                                                                        
                                                                                        <label className="block mb-1 text-sm">مدة الفيديو (ساعة:دقيقة:ثانية)</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={editForm?.videoDuration || ""}
                                                                                            onChange={(e) => updateForm(editFormKey, { videoDuration: e.target.value })}
                                                                                            className="w-full border rounded-xl py-2 px-3 text-sm"
                                                                                            placeholder="02:30:00"
                                                                                        />
                                                                                    </>
                                                                                )}
                                                                            </div>

                                                                            <div className="md:col-span-2">
                                                                                <label className="block mb-1 text-sm">ملفات مرفقة (اختياري - سيتم استبدال الملفات الحالية بالملفات الجديدة)</label>
                                                                                
                                                                                {/* Show current files */}
                                                                                {(() => {
                                                                                    const currentFiles = editForm?.currentFiles || [];
                                                                                    const hasFiles = Array.isArray(currentFiles) && currentFiles.length > 0;
                                                                                    
                                                                                    if (!hasFiles) {
                                                                                        return (
                                                                                            <div className="mb-3 text-xs text-gray-500">
                                                                                                لا توجد ملفات مرفقة حالياً
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    return (
                                                                                        <div className="mb-3 p-2 bg-gray-50 rounded-lg border">
                                                                                            <div className="text-xs text-gray-700 mb-2 font-medium">
                                                                                                الملفات الحالية:
                                                                                            </div>
                                                                                            <div className="flex flex-wrap gap-2">
                                                                                                {currentFiles.map((file, i) => {
                                                                                                    let filePath = '';
                                                                                                    let fileName = '';
                                                                                                    let fileSize = '';
                                                                                                    
                                                                                                    // Handle different file formats
                                                                                                    if (typeof file === 'string') {
                                                                                                        filePath = file;
                                                                                                        fileName = file.split("/").pop() || file.split("\\").pop() || `File ${i + 1}`;
                                                                                                    } else if (file && typeof file === 'object') {
                                                                                                        filePath = file.path || file.url || file.file || '';
                                                                                                        fileName = file.name || filePath.split("/").pop() || filePath.split("\\").pop() || `File ${i + 1}`;
                                                                                                        fileSize = file.size || '';
                                                                                                    } else {
                                                                                                        fileName = `File ${i + 1}`;
                                                                                                    }
                                                                                                    
                                                                                                    const href = filePath ? withBaseUrl(filePath) : '#';
                                                                                                    
                                                                                                    return (
                                                                                                        <a
                                                                                                            key={i}
                                                                                                            href={href}
                                                                                                            target="_blank"
                                                                                                            rel="noreferrer"
                                                                                                            className="inline-flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100"
                                                                                                        >
                                                                                                            <PaperClipIcon className="w-4 h-4" />
                                                                                                            {fileName}
                                                                                                            {fileSize && (
                                                                                                                <span className="text-gray-500">({fileSize})</span>
                                                                                                            )}
                                                                                                        </a>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })()}
                                                                                
                                                                                <input
                                                                                    type="file"
                                                                                    multiple
                                                                                    onChange={(e) => {
                                                                                        const newFiles = Array.from(e.target.files || []);
                                                                                        // Replace attachments with new files (don't add to existing)
                                                                                        updateForm(editFormKey, { attachments: newFiles });
                                                                                    }}
                                                                                    className="w-full border rounded-xl py-2 px-3 text-sm"
                                                                                />
                                                                                {Array.isArray(editForm?.attachments) && editForm.attachments.length > 0 && (
                                                                                    <div className="mt-2">
                                                                                        <div className="text-xs text-gray-600 mb-2 font-medium">
                                                                                            الملفات الجديدة المحددة (ستستبدل الملفات الحالية):
                                                                                        </div>
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {editForm.attachments.map((f, i) => (
                                                                                                <span
                                                                                                    key={i}
                                                                                                    className="inline-flex items-center gap-1 text-xs bg-green-50 border border-green-200 px-2 py-1 rounded"
                                                                                                >
                                                                                                    <PaperClipIcon className="w-4 h-4" />
                                                                                                    {f.name}
                                                                                                    <button
                                                                                                        className="ml-1"
                                                                                                        onClick={() => {
                                                                                                            const next = [...editForm.attachments];
                                                                                                            next.splice(i, 1);
                                                                                                            updateForm(editFormKey, { attachments: next });
                                                                                                        }}
                                                                                                    >
                                                                                                        <XMarkIcon className="w-4 h-4 text-gray-600" />
                                                                                                    </button>
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {editForm?.uploading && (
                                                                            <div className="space-y-2">
                                                                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className="h-full bg-primary"
                                                                                        style={{ width: `${editForm.progress || 0}%` }}
                                                                                    />
                                                                                </div>
                                                                                <div className="text-xs text-gray-600">{editForm.progress || 0}%</div>
                                                                            </div>
                                                                        )}

                                                                        <div className="flex items-center gap-3">
                                                                            <button
                                                                                onClick={() => updateSession(ss.id, sid)}
                                                                                disabled={!!editForm?.uploading}
                                                                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-60"
                                                                            >
                                                                                حفظ التعديلات
                                                                            </button>
                                                                            <button
                                                                                onClick={cancelEdit}
                                                                                disabled={!!editForm?.uploading}
                                                                                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-60"
                                                                            >
                                                                                إلغاء
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Video preview - show video file or URL (only when not editing) */}
                                                                {!isEditing && isOpen && hasVideo && (
                                                                    <div className="mt-3 space-y-2">
                                                                        {ss.url ? (
                                                                            // External video URL
                                                                            <div>
                                                                                <a
                                                                                    href={ss.url}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="text-sm text-primary underline hover:text-primary/80"
                                                                                >
                                                                                    <VideoCameraIcon className="w-4 h-4 inline mr-1" />
                                                                                    فتح رابط الفيديو
                                                                                </a>
                                                                                {ss.formatted_video_duration && (
                                                                                    <span className="text-xs text-gray-500 mr-2">
                                                                                        ({ss.formatted_video_duration})
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ) : vUrl ? (
                                                                            // Video file
                                                                            <div>
                                                                                <video
                                                                                    key={vUrl}
                                                                                    src={vUrl}
                                                                                    controls
                                                                                    preload="metadata"
                                                                                    className="w-full max-w-3xl rounded-lg border"
                                                                                />
                                                                                <a
                                                                                    href={vUrl}
                                                                                    download
                                                                                    className="text-xs text-primary underline mt-1 inline-block"
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                >
                                                                                    تحميل الفيديو
                                                                                </a>
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                )}

                                                                {/* File attachments (only when not editing) */}
                                                                {!isEditing && hasFiles && (
                                                                    <div className="mt-3">
                                                                        <div className="text-xs text-gray-600 mb-2 font-medium">
                                                                            الملفات المرفقة:
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {ss.files.map((file, i) => {
                                                                                const filePath = typeof file === 'string' ? file : file.path;
                                                                                const fileName = typeof file === 'string' 
                                                                                    ? filePath.split("/").pop() 
                                                                                    : filePath.split("/").pop();
                                                                                const fileSize = typeof file === 'object' && file.size ? file.size : '';
                                                                                const href = withBaseUrl(filePath);
                                                                                return (
                                                                                    <a
                                                                                        key={i}
                                                                                        href={href}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="inline-flex items-center gap-1 text-xs bg-white border rounded px-2 py-1 hover:bg-gray-50"
                                                                                    >
                                                                                        <PaperClipIcon className="w-4 h-4" />
                                                                                        {fileName}
                                                                                        {fileSize && (
                                                                                            <span className="text-gray-500">({fileSize})</span>
                                                                                        )}
                                                                                    </a>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Legacy attachments support (if backend still uses this format) (only when not editing) */}
                                                                {!isEditing && !hasFiles && Array.isArray(ss.attachments) && ss.attachments.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <div className="text-xs text-gray-600 mb-2 font-medium">
                                                                            الملفات المرفقة:
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {ss.attachments.map((p, i) => {
                                                                                const href = withBaseUrl(p);
                                                                                const name = String(p).split("/").pop();
                                                                                return (
                                                                                    <a
                                                                                        key={i}
                                                                                        href={href}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="inline-flex items-center gap-1 text-xs bg-white border rounded px-2 py-1 hover:bg-gray-50"
                                                                                    >
                                                                                        <PaperClipIcon className="w-4 h-4" />
                                                                                        {name}
                                                                                    </a>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            )}
                                        </div>

                                        <hr />

                                        {/* Add session form */}
                                        <div className="space-y-3">
                                            <h3 className="font-semibold">إضافة جلسة جديدة</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block mb-1">عنوان الجلسة</label>
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={form.title?.ar || ""}
                                                            onChange={(e) => updateForm(sid, { title: { ...form.title, ar: e.target.value } })}
                                                            className="w-full border rounded-xl py-2 px-3"
                                                            placeholder="عنوان الجلسة بالعربية"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={form.title?.en || ""}
                                                            onChange={(e) => updateForm(sid, { title: { ...form.title, en: e.target.value } })}
                                                            className="w-full border rounded-xl py-2 px-3"
                                                            placeholder="عنوان الجلسة بالإنجليزية"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block mb-1">نوع الفيديو</label>
                                                    <select
                                                        value={form.videoType || "file"}
                                                        onChange={(e) => handleVideoTypeChange(sid, e.target.value)}
                                                        className="w-full border rounded-xl py-2 px-3 mb-3"
                                                    >
                                                        <option value="file">رفع ملف فيديو</option>
                                                        <option value="url">رابط فيديو</option>
                                                    </select>

                                                    {form.videoType === "file" ? (
                                                        <>
                                                            <label className="block mb-1">ملف الفيديو</label>
                                                            <input
                                                                type="file"
                                                                accept="video/*"
                                                                onChange={(e) => handleSelectVideo(sid, e.target.files?.[0] || null)}
                                                                className="w-full border rounded-xl py-2 px-3"
                                                            />
                                                            {form.videoFile && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    تم اختيار: {form.videoFile.name} —{" "}
                                                                    {(form.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <label className="block mb-1">رابط الفيديو</label>
                                                            <input
                                                                type="url"
                                                                value={form.videoUrl || ""}
                                                                onChange={(e) => handleVideoUrlChange(sid, e.target.value)}
                                                                className="w-full border rounded-xl py-2 px-3 mb-3"
                                                                placeholder="https://example.com/video.mp4"
                                                            />
                                                            
                                                            <label className="block mb-1">مدة الفيديو (ساعة:دقيقة:ثانية)</label>
                                                            <input
                                                                type="text"
                                                                value={form.videoDuration || ""}
                                                                onChange={(e) => handleVideoDurationChange(sid, e.target.value)}
                                                                className="w-full border rounded-xl py-2 px-3"
                                                                placeholder="02:30:00"
                                                                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                مثال: 02:30:00 (ساعتان و 30 دقيقة)
                                                            </p>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block mb-1">ملفات مرفقة (اختياري)</label>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => handleSelectAttachments(sid, e.target.files)}
                                                        className="w-full border rounded-xl py-2 px-3"
                                                    />
                                                    {Array.isArray(form.attachments) && form.attachments.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {form.attachments.map((f, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded"
                                                                >
                                                                    <PaperClipIcon className="w-4 h-4" />
                                                                    {f.name}
                                                                    <button
                                                                        className="ml-1"
                                                                        onClick={() => {
                                                                            const next = [...form.attachments];
                                                                            next.splice(i, 1);
                                                                            updateForm(sid, { attachments: next });
                                                                        }}
                                                                    >
                                                                        <XMarkIcon className="w-4 h-4 text-gray-600" />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {form.uploading && (
                                                <div className="space-y-2">
                                                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${form.progress || 0}%` }}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-gray-600">{form.progress || 0}%</div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => createSession(sid)}
                                                    disabled={!!form.uploading}
                                                    className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 disabled:opacity-60"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                    <span>إضافة الجلسة</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
