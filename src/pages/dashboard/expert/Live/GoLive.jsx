// src/pages/teacher/GoLive.jsx
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { createAdaptor, buildAntWsUrl } from "../../../../lib/ant";
import { 
    parseDataChannelMessage, 
    safeCleanupAdaptor,
    monitorConnection 
} from "../../../../lib/liveStreamingUtils";
import LiveService from "../../../../services/teacher/liveService";
import AvatarBadge from "../../../../components/AvatarBadge";
import LiveChat from "../../../../components/LiveChat";
import { useLiveChat } from "../../../../hooks/useLiveChat";
import ConfirmLeaveModal from "../../../../components/Modals/ConfirmLeaveModal";
import {
    UserGroupIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon,
    MicrophoneIcon, VideoCameraIcon, VideoCameraSlashIcon, ComputerDesktopIcon,
    HandRaisedIcon, SpeakerXMarkIcon, ArrowLeftOnRectangleIcon,
    ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import { FaMicrophoneSlash } from "react-icons/fa";
import { useAuth } from "../../../../contexts/AuthContext";

const gridCols = (n) => (n <= 1 ? "grid-cols-1" : n <= 2 ? "grid-cols-2" : n <= 6 ? "grid-cols-3" : "grid-cols-4");

const NameTag = ({ children }) => (
    <div className="absolute left-2 bottom-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {children}
    </div>
);

export default function TeacherGoLive() {
    const { programId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const teacherName = user?.name || user?.full_name || user?.username || "المعلّم";
    
    // Current user for chat
    const currentUser = {
        id: 'teacher',
        name: teacherName,
        avatarUrl: user?.avatar || user?.avatar_url || user?.image_url || ""
    };

    const [streamId, setStreamId] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [camOn, setCamOn] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [displayStream, setDisplayStream] = useState(null);

    const [roster, setRoster] = useState({});
    const [peerStreams, setPeerStreams] = useState([]);
    const [raisedHands, setRaisedHands] = useState({});
    const [mutedStudents, setMutedStudents] = useState({}); // Track muted students
    const [screenSharingStudents, setScreenSharingStudents] = useState({}); // Track who is screen sharing
    const watcherIds = Object.keys(roster);
    
    // Check if all ACTIVE students are muted (only count students who are publishing)
    const activeStudents = watcherIds.filter(id => peerStreams.includes(id));
    const allStudentsMuted = activeStudents.length > 0 && activeStudents.every(id => mutedStudents[id]);
    const mutedCount = activeStudents.filter(id => mutedStudents[id]).length;
    const unmutedCount = activeStudents.length - mutedCount;
    
    // Check if someone is screen sharing (teacher or student)
    const someoneScreenSharing = sharing || Object.values(screenSharingStudents).some(Boolean);
    const screenSharingStudentId = Object.keys(screenSharingStudents).find(id => screenSharingStudents[id]);

    const videoElsRef = useRef({});
    const playingSet = useRef(new Set());

    const adaptorRef = useRef(null);
    const stageRef = useRef(null);
    const syncIvRef = useRef(null);
    const liveMarkedRef = useRef(false);
    const isLeavingIntentionally = useRef(false); // Track intentional navigation
    const connectionMonitorRef = useRef(null); // Connection health monitor
    
    // Modal state for navigation confirmation
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [pendingNavigationHref, setPendingNavigationHref] = useState(null);
    
    // Modal state for subscription error
    const [showSubscriptionErrorModal, setShowSubscriptionErrorModal] = useState(false);

    // Chat functionality
    const {
        messages,
        isChatOpen,
        setIsChatOpen,
        sendMessage,
        reactToMessage,
        handleIncomingMessage,
        addSystemMessage
    } = useLiveChat(streamId, currentUser, adaptorRef.current, true);

    const playIfNeeded = (id) => {
        if (!id || playingSet.current.has(id)) return;
        playingSet.current.add(id);
        try { 
            adaptorRef.current?.play?.(id);
        } catch (e) { 
            playingSet.current.delete(id);
            // Retry after a short delay
            setTimeout(() => {
                if (!playingSet.current.has(id)) {
                    try {
                        adaptorRef.current?.play?.(id);
                        playingSet.current.add(id);
                    } catch (retryError) {
                        console.warn("Retry failed to play stream:", retryError);
                    }
                }
            }, 1000);
        }
    };

    // 1) get streamId - check ant_media first
    useEffect(() => {
        (async () => {
            try {
                // First check if live streaming is enabled
                const settingsRes = await LiveService.checkSystemSettings();
                const antMedia = settingsRes?.data?.ant_media;
                
                if (antMedia !== 1) {
                    setShowSubscriptionErrorModal(true);
                    return;
                }

                // If enabled, proceed with stream creation
                const { data } = await LiveService.createStream(Number(programId));
                const sid = String(data?.streamId || data?.stream_id);
                if (!sid) throw new Error("No stream id");
                setStreamId(sid);
            } catch (error) {
                const errorData = error.response?.data;
                
                // Check if it's a subscription error from backend
                if (errorData?.error === 'subscription_required' || errorData?.ant_media === 0) {
                    setShowSubscriptionErrorModal(true);
                } else {
                    toast.error(errorData?.message || "تعذر تجهيز البث");
                    navigate("/teacher/courses");
                }
            }
        })();
    }, [programId, navigate]);

    // Add warning when trying to leave the page (browser close/refresh)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isLeavingIntentionally.current && publishing) {
                e.preventDefault();
                e.returnValue = 'هل أنت متأكد من مغادرة البث المباشر؟ سيتم إنهاء البث لجميع الطلاب.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [publishing]);

    // Block internal navigation (React Router) when live
    useEffect(() => {
        if (!publishing) return;

        const handleNavigation = (e) => {
            // Check if clicking on a link or button with navigation
            const target = e.target.closest('a, button[type="button"], [role="link"]');
            if (target && !isLeavingIntentionally.current) {
                const href = target.getAttribute('href');
                
                // Check if this is a navigation element (has href or navigates)
                const isNavigationElement = href || target.closest('nav') || target.closest('[role="navigation"]');
                
                // Only block navigation to different routes (not live page, not end session button)
                if (isNavigationElement && href && !href.includes('/live/')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Show modal instead of window.confirm
                    setPendingNavigationHref(href);
                    setShowLeaveModal(true);
                }
            }
        };

        document.addEventListener('click', handleNavigation, true);

        return () => {
            document.removeEventListener('click', handleNavigation, true);
        };
    }, [publishing, streamId, programId]);

    // 2) publish + presence + peer videos
    useEffect(() => {
        if (!streamId) return;
        
        // Capture ref value for cleanup
        const currentPlayingSet = playingSet.current;

        (async () => {
            setConnecting(true);

            // quick permission check
            try {
                const test = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const el = document.getElementById("localVideo");
                if (el) { el.srcObject = test; await el.play().catch(() => { }); }
                test.getTracks().forEach(t => t.stop());
            } catch {
                toast.error("المتصفح رفض الوصول للكاميرا/الميكروفون");
                setConnecting(false);
                return;
            }

            const ws = buildAntWsUrl();
            const adaptor = createAdaptor({
                websocket_url: ws,
                localVideoId: "localVideo",
                mediaConstraints: { video: true, audio: true }, // Start with both enabled
                onInfo: async (info, obj) => {
                    if (info === "initialized") {
                        adaptor.publish(streamId);
                    }

                    if (info === "publish_started") {
                        setPublishing(true);
                        setConnecting(false);
                        
                        // Set initial states - start with both camera and mic OFF
                        setMicOn(false);
                        setCamOn(false);
                        
                        // Disable tracks directly instead of turning them off (keeps them alive for later use)
                        try {
                            const stream = adaptor.localStream;
                            if (stream) {
                                // Mute audio track
                                const audioTracks = stream.getAudioTracks();
                                audioTracks.forEach(track => track.enabled = false);
                                
                                // Disable video track
                                const videoTracks = stream.getVideoTracks();
                                videoTracks.forEach(track => track.enabled = false);
                            }
                        } catch (e) {
                            console.warn("Failed to disable tracks initially:", e);
                        }
                        
                        try { await LiveService.markLive(Number(programId)); liveMarkedRef.current = true; } catch (e) { console.warn("Failed to mark live:", e); }
                        adaptor.sendDataSafe(streamId, { type: "sync_request" });
                        if (!syncIvRef.current) {
                            syncIvRef.current = setInterval(() => {
                                adaptor.sendDataSafe(streamId, { type: "sync_request" });
                            }, 5000);
                        }
                        // Add welcome message to chat
                        addSystemMessage("مرحباً! بدأ البث المباشر", "system");
                    }

                    if (info === "data_channel_opened") {
                        adaptor.sendDataSafe(streamId, { type: "sync_request" });
                    }

                    if (info === "newStreamAvailable") {
                        const el = videoElsRef.current[obj.streamId];
                        if (el) { el.srcObject = obj.stream; el.play().catch((e) => { console.warn("Failed to play video:", e); }); }
                    }

                    if (info === "play_finished") {
                        playingSet.current.delete(obj?.streamId);
                        setPeerStreams((arr) => arr.filter((x) => x !== obj?.streamId));
                        try { delete videoElsRef.current[obj?.streamId]; } catch (e) { console.warn("Failed to delete video element:", e); }
                    }

                    if (info === "data_received") {
                        // Use validated message parser with security checks
                        const msg = parseDataChannelMessage(obj?.data, true); // true = isTeacher
                        if (!msg) return;

                        // Handle chat messages
                        if (msg.type && msg.type.startsWith('chat_')) {
                            handleIncomingMessage(msg);
                            return;
                        }

                        if (msg.type === "join" && msg.id) {
                            setRoster((r) => {
                                const isNewStudent = !r[msg.id];
                                const next = { ...r, [msg.id]: msg.profile || { name: "مشترك", avatarUrl: "" } };
                                
                                // Only mark as muted if it's a NEW student (first join)
                                if (isNewStudent) {
                                    setMutedStudents((prev) => ({
                                        ...prev,
                                        [msg.id]: true
                                    }));
                                }
                                
                                // Send roster update if new student
                                if (isNewStudent) {
                                    try {
                                        adaptor.sendDataSafe(streamId, {
                                            type: "roster_set",
                                            members: Object.entries(next).map(([id, profile]) => ({ id, profile })),
                                        });
                                    } catch (e) { console.warn("Failed to send roster set:", e); }
                                }
                                
                                return next;
                            });
                        }

                        if (msg.type === "leave" && msg.id) {
                            setRoster((r) => {
                                const next = { ...r }; delete next[msg.id];
                                try {
                                    adaptor.sendDataSafe(streamId, {
                                        type: "roster_set",
                                        members: Object.entries(next).map(([id, profile]) => ({ id, profile })),
                                    });
                                } catch (e) { console.warn("Failed to send roster set:", e); }
                                return next;
                            });
                            setPeerStreams((arr) => arr.filter((x) => x !== msg.id));
                            // Remove from muted students list
                            setMutedStudents((prev) => {
                                const next = { ...prev };
                                delete next[msg.id];
                                return next;
                            });
                        }

                        if (msg.type === "peerPublish" && msg.peerStreamId) {
                            const pid = String(msg.peerStreamId);
                            const profile = msg.profile || { name: "مشترك", avatarUrl: "" };
                            setRoster((r) => ({ ...r, [pid]: r[pid] || profile }));
                            setPeerStreams((arr) => (arr.includes(pid) ? arr : [...arr, pid]));
                            playIfNeeded(pid);
                        }

                        if (msg.type === "peerStopped" && msg.peerStreamId) {
                            const pid = String(msg.peerStreamId);
                            try { adaptor.stop(pid); } catch (e) { console.warn("Failed to stop stream:", e); }
                            setPeerStreams((arr) => arr.filter((x) => x !== pid));
                            playingSet.current.delete(pid);
                        }

                        if (msg.type === "raise_hand" && msg.peerStreamId) {
                            const pid = String(msg.peerStreamId);
                            setRaisedHands((prev) => ({
                                ...prev,
                                [pid]: msg.raised
                            }));
                        }

                        if (msg.type === "screenShare" && msg.peerStreamId) {
                            const pid = String(msg.peerStreamId);
                            setScreenSharingStudents((prev) => ({
                                ...prev,
                                [pid]: msg.sharing
                            }));
                        }

                        // Handle student mic status updates
                        if (msg.type === "student_mic_status" && msg.peerStreamId) {
                            const pid = String(msg.peerStreamId);
                            console.log(`Student ${pid} mic status: ${msg.muted ? 'MUTED' : 'UNMUTED'}`);
                            setMutedStudents((prev) => ({
                                ...prev,
                                [pid]: msg.muted
                            }));
                        }
                    }

                    if (info === "publish_finished") {
                        setPublishing(false);
                    }
                },
                onError: (error, msg) => {
                    console.warn("Teacher adaptor error:", error, msg);
                    // Don't show error toast for ICE candidate errors as they're handled gracefully
                    if (!msg || !msg.includes("ice candiate")) {
                        toast.error("تعذر الاتصال بالبث");
                    }
                    setConnecting(false);
                },
            });

            adaptorRef.current = adaptor;
            
            // Monitor connection health
            connectionMonitorRef.current = monitorConnection(adaptor, () => {
                if (!isLeavingIntentionally.current) {
                    console.warn('Connection lost, attempting to recover...');
                    toast.error('انقطع الاتصال، جاري المحاولة...');
                }
            });
        })();

        return () => {
            // Stop connection monitor
            if (connectionMonitorRef.current) {
                connectionMonitorRef.current();
                connectionMonitorRef.current = null;
            }
            
            // Clear sync interval
            if (syncIvRef.current) { 
                clearInterval(syncIvRef.current); 
                syncIvRef.current = null; 
            }
            
            // Use safe cleanup utility
            safeCleanupAdaptor(adaptorRef.current, streamId).then(() => {
                adaptorRef.current = null;
            });
            
            // Mark offline in backend
            if (liveMarkedRef.current) {
                LiveService.markOffline(Number(programId))
                    .catch((e) => console.warn("Failed to mark offline:", e))
                    .finally(() => {
                        liveMarkedRef.current = false;
                    });
            }
            
            // Clear local state
            currentPlayingSet.clear();
            setPeerStreams([]);
            videoElsRef.current = {};
            setRoster({});
        };
    }, [streamId, programId, addSystemMessage, handleIncomingMessage]);

    const toggleMic = async () => {
        const a = adaptorRef.current; if (!a) return;
        
        const newMicState = !micOn;
        
        // Use hybrid approach: track.enabled + Ant Media methods
        try {
            const stream = a.localStream;
            if (stream) {
                const audioTracks = stream.getAudioTracks();
                audioTracks.forEach(track => {
                    track.enabled = newMicState;
                });
            }
            
            // Also call Ant Media methods for proper signaling
            if (newMicState) {
                a.unmuteLocalMic?.();
            } else {
                a.muteLocalMic?.();
            }
        } catch (e) {
            console.warn("Failed to toggle mic:", e);
        }
        
        setMicOn(newMicState);
    };
    const toggleCam = async () => {
        const a = adaptorRef.current; if (!a) return;
        
        const next = !camOn;
        
        // Use hybrid approach: track.enabled + Ant Media methods
        try {
            const stream = a.localStream;
            if (stream) {
                const videoTracks = stream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.enabled = next;
                });
            }
            
            // Also call Ant Media methods for proper signaling
            if (next) {
                a.turnOnLocalCamera?.();
            } else {
                a.turnOffLocalCamera?.();
            }
        } catch (e) {
            console.warn("Failed to toggle camera:", e);
        }
        
        setCamOn(next);
        a.sendDataSafe(streamId, { type: "teacher_cam", on: next });
    };
    const shareScreen = async () => {
        const a = adaptorRef.current; if (!a || !publishing) return;
        
        // If already sharing, stop sharing
        if (sharing) {
            try {
                if (displayStream) {
                    displayStream.getTracks().forEach(track => track.stop());
                    setDisplayStream(null);
                }
                setSharing(false);
                // Notify students that screen sharing stopped
                a.sendDataSafe(streamId, { type: "teacher_screen_share", sharing: false });
                console.log("Teacher screen sharing stopped manually");
            } catch (error) {
                console.warn("Failed to stop screen sharing:", error);
                setSharing(false);
            }
            return;
        }
        
        // Start screen sharing
        try {
            // Use Ant Media's built-in screen sharing method
            if (typeof a.switchDesktopCapture === "function") {
                a.switchDesktopCapture(streamId, () => {
                    setSharing(false);
                    setDisplayStream(null);
                    a.sendDataSafe(streamId, { type: "teacher_screen_share", sharing: false });
                });
                setSharing(true);
                // Notify students that screen sharing started
                a.sendDataSafe(streamId, { type: "teacher_screen_share", sharing: true });
            } else {
                // Fallback: manual screen sharing
                const display = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true, 
                    audio: true // Enable audio to prevent the error
                });
                
                setDisplayStream(display);
                setSharing(true);
                // Notify students that screen sharing started
                a.sendDataSafe(streamId, { type: "teacher_screen_share", sharing: true });
                
                // Replace the video track in the peer connection
                const pc = a.peerconnection;
                const sender = pc?.getSenders?.().find((x) => x.track?.kind === "video");
                if (sender && display.getVideoTracks()[0]) {
                    await sender.replaceTrack(display.getVideoTracks()[0]);
                }
                
                display.getVideoTracks()[0].onended = () => {
                    const s2 = pc?.getSenders?.().find((x) => x.track?.kind === "video");
                    if (s2) {
                        // If camera is on, use real camera; otherwise turn off video
                        if (camOn) {
                            const cam = a?.localStream?.getVideoTracks?.()[0];
                            if (cam) s2.replaceTrack(cam);
                        } else {
                            // Just turn off the video track
                            a.turnOffLocalCamera();
                        }
                    }
                    setSharing(false);
                    setDisplayStream(null);
                };
            }
        } catch (error) {
            console.warn("Screen sharing error:", error);
            toast.error("تعذر مشاركة الشاشة");
        }
    };
    
    const muteAllStudents = () => {
        const a = adaptorRef.current; if (!a) return;
        try {
            a.sendDataSafe(streamId, { type: "mute_all_students", mute: true });
            
            // Mark all students as muted using callback form
            setMutedStudents((prev) => {
                const allMuted = { ...prev };
                watcherIds.forEach(id => {
                    allMuted[id] = true;
                });
                return allMuted;
            });
            
            toast("تم كتم جميع الطلاب");
        } catch (e) {
            console.warn("Failed to mute all students:", e);
        }
    };
    
    const muteSpecificStudent = (studentId) => {
        const a = adaptorRef.current; if (!a) return;
        try {
            a.sendDataSafe(streamId, { type: "mute_specific_student", studentId, mute: true });
            
            // Mark this student as muted
            setMutedStudents((prev) => ({
                ...prev,
                [studentId]: true
            }));
            
            toast(`تم كتم الطالب`);
        } catch (e) {
            console.warn("Failed to mute student:", e);
        }
    };
    
    const toggleFullscreen = async () => {
        try {
            if (!stageRef.current) return;
            if (!document.fullscreenElement) await stageRef.current.requestFullscreen();
            else await document.exitFullscreen();
            setIsFullscreen(!!document.fullscreenElement);
        } catch (e) { console.warn("Failed to toggle fullscreen:", e); }
    };

    const unmuteSpecificStudent = (studentId) => {
        try {
            const message = { 
                type: "mute_specific_student",
                studentId: studentId,
                mute: false 
            };
            adaptorRef.current?.sendDataSafe?.(streamId, message);
            
            // Mark this student as unmuted
            setMutedStudents((prev) => ({
                ...prev,
                [studentId]: false
            }));
            
            toast.success("تم إلغاء كتم الطالب");
        } catch (error) {
            console.warn("Failed to unmute specific student:", error);
        }
    };

    const endSession = async () => {
        // Mark as intentional leaving to prevent warning
        isLeavingIntentionally.current = true;
        
        try {
            // Notify students that session is ending
            adaptorRef.current?.sendDataSafe?.(streamId, { type: "end" });
            
            // Stop connection monitor
            if (connectionMonitorRef.current) {
                connectionMonitorRef.current();
                connectionMonitorRef.current = null;
            }
            
            // Clean up adaptor
            await safeCleanupAdaptor(adaptorRef.current, streamId);
            adaptorRef.current = null;
            
            // Mark offline in backend
            if (liveMarkedRef.current) {
                await LiveService.markOffline(Number(programId));
                liveMarkedRef.current = false;
            }
            
            // Delete stream
            await LiveService.deleteStream(streamId).catch((e) => { console.warn("Failed to delete stream:", e); });
            
            toast.success("تم إنهاء البث");
        } catch (e) {
            console.warn("Error ending session:", e);
            toast.error("حدث خطأ أثناء إنهاء البث");
        } finally { 
            navigate("/teacher/courses"); 
        }
    };

    const handleConfirmLeave = async () => {
        isLeavingIntentionally.current = true;
        
        try {
            // Notify students
            adaptorRef.current?.sendDataSafe?.(streamId, { type: "end" });
            
            // Stop connection monitor
            if (connectionMonitorRef.current) {
                connectionMonitorRef.current();
                connectionMonitorRef.current = null;
            }
            
            // Clean up adaptor
            await safeCleanupAdaptor(adaptorRef.current, streamId);
            
            // Mark offline
            if (liveMarkedRef.current) {
                await LiveService.markOffline(Number(programId));
                liveMarkedRef.current = false;
            }
            
            // Delete stream
            await LiveService.deleteStream(streamId).catch(() => {});
            
            // Force navigation
            window.location.href = pendingNavigationHref;
        } catch (e) {
            console.warn("Cleanup error:", e);
            window.location.href = pendingNavigationHref;
        }
    };

    return (
        <div className="p-3 lg:p-4" dir="rtl">
            <div className="mb-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                <button onClick={endSession} className="inline-flex items-center gap-1 sm:gap-2 text-xs bg-red-600 text-white px-2 sm:px-3 py-1 rounded-full">
                    <ArrowLeftOnRectangleIcon className="w-3 h-3 sm:w-4 sm:h-4" /> إنهاء البث
                </button>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`inline-flex items-center gap-1 text-xs px-2 sm:px-3 py-1 rounded-full ${
                            isChatOpen ? 'bg-[#0e7490] text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        <ChatBubbleLeftRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        المحادثة
                    </button>
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 sm:px-3 py-1">
                        <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{watcherIds.length}</span>
                    </span>
                    {/* Mic status indicator */}
                    {activeStudents.length > 0 && (
                        <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 sm:px-3 py-1 ${
                            unmutedCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                            <MicrophoneIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{unmutedCount}/{activeStudents.length}</span>
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 sm:px-3 py-1">
                        <span>{publishing ? "البث مباشر" : connecting ? "جاري الاتصال..." : (streamId ? "جاهز" : "ينشئ البث...")}</span>
                    </span>
                </div>
            </div>

            <div ref={stageRef} className="bg-white rounded-xl shadow overflow-hidden">
                {/* Spotlight Mode: Screen Sharing */}
                {someoneScreenSharing ? (
                    <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 p-2 sm:p-4">
                        {/* Main Screen (Screen Share) */}
                        <div className="flex-1 relative rounded-xl overflow-hidden bg-black">
                            {sharing ? (
                                // Teacher's screen
                                <video 
                                    id="localVideo" 
                                    className="w-full h-full object-contain" 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                />
                            ) : screenSharingStudentId ? (
                                // Student's screen
                                <video
                                    ref={(el) => { if (el) videoElsRef.current[screenSharingStudentId] = el; }}
                                    className="w-full h-full object-contain"
                                    autoPlay
                                    playsInline
                                />
                            ) : null}
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                                <ComputerDesktopIcon className="w-4 h-4 inline-block ml-1" />
                                {sharing ? "أنت تشارك الشاشة" : `${roster[screenSharingStudentId]?.name || "طالب"} يشارك الشاشة`}
                            </div>
                        </div>
                        
                        {/* Sidebar with small participant tiles */}
                        <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto">
                            {/* Teacher tile (small) */}
                            {!sharing && (
                                <div className="relative rounded-xl overflow-hidden bg-black w-40 lg:w-full aspect-video flex-shrink-0">
                                    <video 
                                        id="localVideo" 
                                        className="w-full h-full object-cover" 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                    />
                                    {!camOn && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                            <VideoCameraSlashIcon className="w-8 h-8 text-white opacity-50" />
                                        </div>
                                    )}
                                    <NameTag>{teacherName} (أنت)</NameTag>
                                </div>
                            )}
                            
                            {/* Student tiles (small) */}
                            {watcherIds.filter(id => !screenSharingStudents[id]).map((id) => {
                                const profile = roster[id] || {};
                                const hasVideo = peerStreams.includes(id);
                                const isHandRaised = raisedHands[id];
                                const isMuted = mutedStudents[id];
                                return (
                                    <div key={id} className="relative rounded-xl overflow-hidden bg-black w-40 lg:w-full aspect-video flex-shrink-0">
                                        {hasVideo && (
                                            <video
                                                ref={(el) => { if (el) videoElsRef.current[id] = el; }}
                                                className="w-full h-full object-cover"
                                                autoPlay
                                                playsInline
                                            />
                                        )}
                                        <AvatarBadge name={profile.name || "مشترك"} avatarUrl={profile.avatarUrl} bottomRight={profile.name || "مشترك"} />
                                        <NameTag>{profile.name || "مشترك"}</NameTag>
                                        
                                        {/* Mic indicator - More prominent */}
                                        <div className="absolute bottom-2 left-2">
                                            {isMuted || isMuted === undefined ? (
                                                <div className="bg-red-600 text-white rounded-full p-1.5 shadow-lg">
                                                    <FaMicrophoneSlash className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="bg-green-600 text-white rounded-full p-1.5 shadow-lg animate-pulse">
                                                    <MicrophoneIcon className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {isHandRaised && (
                                            <div className="absolute top-2 left-2 bg-yellow-500 text-white rounded-full p-1">
                                                <HandRaisedIcon className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Normal Grid Mode: No Screen Sharing */
                    <div className={`grid ${gridCols(1 + watcherIds.length)} gap-2 sm:gap-3 p-2 sm:p-4`}>
                        {/* Teacher */}
                        <div className="relative rounded-xl overflow-hidden bg-black">
                        <video 
                            id="localVideo" 
                            className="w-full aspect-video object-cover" 
                            autoPlay 
                            playsInline 
                            muted 
                        />
                        {!camOn && !sharing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                <div className="text-center text-white">
                                    <VideoCameraSlashIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm opacity-75">الكاميرا مغلقة</p>
                                </div>
                            </div>
                        )}
                        <NameTag>{teacherName}</NameTag>
                        <button onClick={toggleFullscreen} className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2">
                            {isFullscreen ? <ArrowsPointingInIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowsPointingOutIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                    </div>

                    {/* Participants */}
                    {watcherIds.map((id) => {
                        const profile = roster[id] || {};
                        const hasVideo = peerStreams.includes(id);
                        const isHandRaised = raisedHands[id];
                        const isMuted = mutedStudents[id];
                        return (
                            <div key={id} className="relative rounded-xl overflow-hidden bg-black">
                                {hasVideo && (
                                    <video
                                        ref={(el) => { if (el) videoElsRef.current[id] = el; }}
                                        className="w-full aspect-video object-cover"
                                        autoPlay
                                        playsInline
                                    />
                                )}
                                <AvatarBadge name={profile.name || "مشترك"} avatarUrl={profile.avatarUrl} bottomRight={profile.name || "مشترك"} />
                                <NameTag>{profile.name || "مشترك"}</NameTag>
                                
                                {/* Mic indicator - More prominent */}
                                <div className="absolute bottom-2 left-2">
                                    {isMuted || isMuted === undefined ? (
                                        <div className="bg-red-600 text-white rounded-full p-2 shadow-lg">
                                            <FaMicrophoneSlash className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="bg-green-600 text-white rounded-full p-2 shadow-lg animate-pulse">
                                            <MicrophoneIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                
                                {isHandRaised && (
                                    <div className="absolute top-2 left-2 bg-yellow-500 text-white rounded-full p-1">
                                        <HandRaisedIcon className="w-4 h-4" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button 
                                        onClick={() => muteSpecificStudent(id)}
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                                        title="كتم الطالب"
                                    >
                                        <SpeakerXMarkIcon className="w-3 h-3" />
                                    </button>
                                    <button 
                                        onClick={() => unmuteSpecificStudent(id)}
                                        className="bg-green-600 hover:bg-green-700 text-white rounded-full p-1"
                                        title="إلغاء كتم الطالب"
                                    >
                                        <MicrophoneIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                )}

                {/* Controls (shown in both modes) */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4 pb-2 sm:pb-4">
                    <button onClick={toggleMic} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow ${micOn ? "bg-[#0e7490] text-white" : "bg-gray-100 text-gray-700"}`}>
                        {micOn ? <MicrophoneIcon className="w-5 h-5" /> : <FaMicrophoneSlash className="w-5 h-5" />}
                    </button>
                    <button onClick={toggleCam} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow ${camOn ? "bg-[#0e7490] text-white" : "bg-gray-100 text-gray-700"}`}>
                        {camOn ? <VideoCameraIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoCameraSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <button onClick={shareScreen} disabled={!publishing} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow ${sharing ? "bg-[#0e7490] text-white" : "bg-gray-100 text-gray-700"} disabled:opacity-50`}>
                        <ComputerDesktopIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button 
                        onClick={muteAllStudents} 
                        className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow transition-colors ${
                            allStudentsMuted 
                                ? "bg-green-600 text-white" 
                                : unmutedCount > 0
                                ? "bg-red-600 text-white animate-pulse"
                                : "bg-gray-400 text-white"
                        }`}
                        title={allStudentsMuted ? `جميع الطلاب مكتومون (${mutedCount}/${activeStudents.length})` : `كتم جميع الطلاب (${unmutedCount} غير مكتوم)`}
                        disabled={activeStudents.length === 0}
                    >
                        <SpeakerXMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        {/* Badge showing unmuted count */}
                        {unmutedCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                                {unmutedCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Live Chat Component */}
            <LiveChat
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={messages}
                onSendMessage={sendMessage}
                onReactToMessage={reactToMessage}
                currentUser={currentUser}
                participants={roster}
            />

            {/* Confirm Leave Modal */}
            <ConfirmLeaveModal
                open={showLeaveModal}
                onClose={() => {
                    setShowLeaveModal(false);
                    setPendingNavigationHref(null);
                }}
                onConfirm={handleConfirmLeave}
                title="هل أنت متأكد من مغادرة البث المباشر؟"
                message="سيتم إنهاء البث لجميع الطلاب. هل تريد المتابعة؟"
                confirmText="نعم، إنهاء البث"
                cancelText="إلغاء"
            />

            {/* Subscription Error Modal */}
            {showSubscriptionErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                خطأ في الاتصال
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                يجب الاشتراك في Ant Media Server لاستخدام ميزة البث المباشر.
                                <br />
                                يرجى التواصل مع الدعم الفني لإتمام عملية الاشتراك.
                            </p>
                            <button
                                onClick={() => {
                                    setShowSubscriptionErrorModal(false);
                                    navigate(`/expert/courses/${programId}`);
                                }}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                العودة
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
