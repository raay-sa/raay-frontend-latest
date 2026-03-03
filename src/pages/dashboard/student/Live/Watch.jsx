// src/pages/student/Watch.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowsPointingOutIcon, ArrowsPointingInIcon, SpeakerWaveIcon, SpeakerXMarkIcon,
    MicrophoneIcon, VideoCameraIcon, VideoCameraSlashIcon, ComputerDesktopIcon,
    UserGroupIcon, ArrowLeftOnRectangleIcon, HandRaisedIcon,
    ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import { FaMicrophoneSlash } from "react-icons/fa";
import toast from "react-hot-toast";

import { createAdaptor, buildAntWsUrl } from "../../../../lib/ant";
import { 
    parseDataChannelMessage, 
    safeCleanupAdaptor,
    monitorConnection 
} from "../../../../lib/liveStreamingUtils";
import AvatarBadge from "../../../../components/AvatarBadge";
import LiveChat from "../../../../components/LiveChat";
import { useLiveChat } from "../../../../hooks/useLiveChat";
import ConfirmLeaveModal from "../../../../components/Modals/ConfirmLeaveModal";
import StudentLiveService from "../../../../services/student/liveService";
import { useAuth } from "../../../../contexts/AuthContext";

const gridCols = (n) => (n <= 1 ? "grid-cols-1" : n <= 2 ? "grid-cols-2" : n <= 6 ? "grid-cols-3" : "grid-cols-4");

const NameTag = ({ children }) => (
    <div className="absolute left-1 sm:left-2 bottom-1 sm:bottom-2 bg-black/60 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
        {children}
    </div>
);

// Pull the real student identity from AuthContext
function useCurrentUser() {
    const { user } = useAuth();
    return {
        id: user?.id ? String(user.id) : "student-1",
        name: user?.name || user?.full_name || user?.username || "أنت",
        avatarUrl: user?.avatar || user?.avatar_url || user?.image_url || "",
    };
}

export default function StudentWatchLive() {
    const me = useCurrentUser();
    const { programId } = useParams();
    const navigate = useNavigate();

    const [teacherStreamId, setTeacherStreamId] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [muted, setMuted] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // my publish
    const [pubActive, setPubActive] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [camOn, setCamOn] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [displayStream, setDisplayStream] = useState(null);

    // roster + peers
    const [roster, setRoster] = useState({});
    const [peerStreams, setPeerStreams] = useState([]);
    const [teacherScreenSharing, setTeacherScreenSharing] = useState(false);
    const [studentScreenSharing, setStudentScreenSharing] = useState({});

    const teacherVideoRef = useRef(null);
    const stageRef = useRef(null);
    const tilesVideoRef = useRef({});

    const playerRef = useRef(null);
    const pubRef = useRef(null);
    const playingSet = useRef(new Set());
    const isLeavingIntentionally = useRef(false); // Track intentional navigation
    const connectionMonitorRef = useRef(null); // Connection health monitor
    
    // Modal state for navigation confirmation
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [pendingNavigationHref, setPendingNavigationHref] = useState(null);

    // Chat functionality
    const {
        messages,
        isChatOpen,
        setIsChatOpen,
        sendMessage,
        reactToMessage,
        handleIncomingMessage
    } = useLiveChat(teacherStreamId, me, playerRef.current, false);

    const clientId = useMemo(
        () => (globalThis.crypto?.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random()),
        []
    );
    const myPeerStreamId = useMemo(
        () => (teacherStreamId ? `${teacherStreamId}__peer__${clientId}` : ""),
        [teacherStreamId, clientId]
    );

    // Check if someone is screen sharing
    const someoneScreenSharing = teacherScreenSharing || sharing || Object.values(studentScreenSharing).some(Boolean);
    const screenSharingStudentId = Object.keys(studentScreenSharing).find(id => studentScreenSharing[id]);

    const playIfNeeded = (id) => {
        if (!id || playingSet.current.has(id)) return;
        playingSet.current.add(id);
        try { playerRef.current?.safePlay?.(id); } catch (e) { console.warn("Failed to play stream:", e); }
    };

    // 1) get teacher stream id with enhanced error handling
    useEffect(() => {
        (async () => {
            try {
                const { data } = await StudentLiveService.getStream(Number(programId));
                const sid = data?.streamId || data?.stream_id;
                if (!sid) throw new Error("No stream id");
                setTeacherStreamId(String(sid));
            } catch (e) {
                console.error(e);

                // Enhanced error handling based on backend response
                if (e.response?.status === 403) {
                    const errorMessage = e.response?.data?.message;
                    if (errorMessage?.includes('subscription') || errorMessage?.includes('اشتراك')) {
                        toast.error("يجب الاشتراك في البرنامج أولاً للوصول للبث المباشر");
                    } else if (errorMessage?.includes('expired') || errorMessage?.includes('منتهي')) {
                        toast.error("انتهت صلاحية الاشتراك في هذا البرنامج");
                    } else if (errorMessage?.includes('student_access_required')) {
                        toast.error("يجب تسجيل الدخول أولاً");
                    } else {
                        toast.error("غير مصرح لك بالوصول لهذا البث");
                    }
                } else if (e.response?.status === 404) {
                    toast.error("البرنامج غير موجود أو تم حذفه");
                } else if (e.response?.status === 401) {
                    toast.error("انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مرة أخرى");
                } else {
                    toast.error("البث غير متاح حالياً، يرجى المحاولة لاحقاً");
                }

                // Navigate back to course page
                navigate(`/student/courses/${programId}`);
            }
        })();
    }, [programId, navigate]);

    // Add warning when trying to leave the page (browser close/refresh)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isLeavingIntentionally.current && teacherStreamId) {
                e.preventDefault();
                e.returnValue = 'هل أنت متأكد من مغادرة البث المباشر؟';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [teacherStreamId]);

    // Block internal navigation (React Router) when live
    useEffect(() => {
        if (!teacherStreamId) return;

        const handleNavigation = (e) => {
            // Check if clicking on a link or button with navigation
            const target = e.target.closest('a, button[type="button"], [role="link"]');
            if (target && !isLeavingIntentionally.current) {
                const href = target.getAttribute('href');
                
                // Check if this is a navigation element (has href or navigates)
                const isNavigationElement = href || target.closest('nav') || target.closest('[role="navigation"]');
                
                // Only block navigation to different routes (not live page, not leave button)
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
    }, [teacherStreamId, myPeerStreamId]);

    // 2) player, presence, play peers
    useEffect(() => {
        if (!teacherStreamId || playerRef.current) return;
        setConnecting(true);

        const currentPlayingSet = playingSet.current;
        const ws = buildAntWsUrl();
        const player = createAdaptor({
            websocket_url: ws,
            mediaConstraints: { video: false, audio: false },
            onInfo: (info, obj) => {

                if (info === "initialized") {
                    playIfNeeded(teacherStreamId);
                }

                if (info === "newStreamAvailable") {
                    if (obj.streamId === teacherStreamId) {
                        if (teacherVideoRef.current) {
                            teacherVideoRef.current.muted = true;
                            teacherVideoRef.current.srcObject = obj.stream;
                            teacherVideoRef.current.play().catch((e) => { console.warn("Failed to play teacher video:", e); });
                        }
                        setConnecting(false);
                    } else {
                        const el = tilesVideoRef.current[obj.streamId];
                        if (el) { el.srcObject = obj.stream; el.play().catch((e) => { console.warn("Failed to play video:", e); }); }
                    }
                }

                if (info === "play_started" && obj?.streamId === teacherStreamId) {
                    // announce presence once play starts — include my REAL name/avatar
                    player.sendDataSafe?.(teacherStreamId, {
                        type: "join",
                        id: myPeerStreamId,
                        profile: { name: me.name, avatarUrl: me.avatarUrl },
                    });
                    
                    // Send initial mic status
                    if (pubActive) {
                        player.sendDataSafe?.(teacherStreamId, {
                            type: "student_mic_status",
                            peerStreamId: myPeerStreamId,
                            muted: !micOn
                        });
                    }
                }

                if (info === "play_finished") {
                    playingSet.current.delete(obj?.streamId);
                    setTimeout(() => playIfNeeded(teacherStreamId), 800);
                }

                if (info === "data_received") {
                    // Use validated message parser with security checks
                    const msg = parseDataChannelMessage(obj?.data, false); // false = isTeacher
                    if (!msg) return;

                    // Handle chat messages
                    if (msg.type && msg.type.startsWith('chat_')) {
                        handleIncomingMessage(msg);
                        return;
                    }

                    // Teacher camera state is handled by the teacher

                    // respond to teacher presence pings so my tile appears even with camera OFF
                    if (msg.type === "sync_request") {
                        try {
                            player.sendDataSafe?.(teacherStreamId, {
                                type: "join",
                                id: myPeerStreamId,
                                profile: { name: me.name, avatarUrl: me.avatarUrl },
                            });
                            
                            // Also send current mic status with sync response
                            if (pubActive) {
                                player.sendDataSafe?.(teacherStreamId, {
                                    type: "student_mic_status",
                                    peerStreamId: myPeerStreamId,
                                    muted: !micOn
                                });
                            }
                        } catch (e) {
                            console.warn("Failed to send sync response:", e);
                        }
                    }

                    if (msg.type === "roster_set" && Array.isArray(msg.members)) {
                        const next = {};
                        msg.members.forEach(({ id, profile }) => { next[id] = profile || { name: "مشترك", avatarUrl: "" }; });
                        setRoster(next);
                    }

                    if (msg.type === "peerPublish" && msg.peerStreamId) {
                        setPeerStreams((arr) => (arr.includes(msg.peerStreamId) ? arr : [...arr, msg.peerStreamId]));
                        if (msg.peerStreamId !== myPeerStreamId) playIfNeeded(msg.peerStreamId);
                    }
                    if (msg.type === "peerStopped" && msg.peerStreamId) {
                        const pid = String(msg.peerStreamId);
                        setPeerStreams((arr) => arr.filter((x) => x !== pid));
                    }

                    if (msg.type === "end") {
                        navigate(`/student/courses/${programId}`); return;
                    }

                    if (msg.type === "mute_all_students") {
                        if (msg.mute && pubRef.current) {
                            // Mute both track and Ant Media
                            try {
                                const stream = pubRef.current.localStream;
                                if (stream) {
                                    const audioTracks = stream.getAudioTracks();
                                    audioTracks.forEach(track => track.enabled = false);
                                }
                                pubRef.current.muteLocalMic();
                            } catch (e) {
                                console.warn("Failed to mute mic:", e);
                            }
                            setMicOn(false);
                            
                            // Confirm mute status to teacher
                            try {
                                player.sendDataSafe?.(teacherStreamId, {
                                    type: "student_mic_status",
                                    peerStreamId: myPeerStreamId,
                                    muted: true
                                });
                            } catch (e) {
                                console.warn("Failed to send mute confirmation:", e);
                            }
                            
                            toast("تم كتم الميكروفون من قبل المعلّم");
                        } else if (!msg.mute && pubRef.current) {
                            // Unmute both track and Ant Media
                            try {
                                const stream = pubRef.current.localStream;
                                if (stream) {
                                    const audioTracks = stream.getAudioTracks();
                                    audioTracks.forEach(track => track.enabled = true);
                                }
                                pubRef.current.unmuteLocalMic();
                            } catch (e) {
                                console.warn("Failed to unmute mic:", e);
                            }
                            setMicOn(true);
                            
                            // Confirm unmute status to teacher
                            try {
                                player.sendDataSafe?.(teacherStreamId, {
                                    type: "student_mic_status",
                                    peerStreamId: myPeerStreamId,
                                    muted: false
                                });
                            } catch (e) {
                                console.warn("Failed to send unmute confirmation:", e);
                            }
                            
                            toast("تم إلغاء كتم الميكروفون من قبل المعلّم");
                        }
                    }

                    if (msg.type === "mute_specific_student" && msg.studentId === myPeerStreamId) {
                        if (msg.mute && pubRef.current) {
                            // Mute both track and Ant Media
                            try {
                                const stream = pubRef.current.localStream;
                                if (stream) {
                                    const audioTracks = stream.getAudioTracks();
                                    audioTracks.forEach(track => track.enabled = false);
                                }
                                pubRef.current.muteLocalMic();
                            } catch (e) {
                                console.warn("Failed to mute mic:", e);
                            }
                            setMicOn(false);
                            
                            // Confirm mute status to teacher
                            try {
                                player.sendDataSafe?.(teacherStreamId, {
                                    type: "student_mic_status",
                                    peerStreamId: myPeerStreamId,
                                    muted: true
                                });
                            } catch (e) {
                                console.warn("Failed to send mute confirmation:", e);
                            }
                            
                            toast("تم كتم الميكروفون من قبل المعلّم");
                        } else if (!msg.mute && pubRef.current) {
                            // Unmute both track and Ant Media
                            try {
                                const stream = pubRef.current.localStream;
                                if (stream) {
                                    const audioTracks = stream.getAudioTracks();
                                    audioTracks.forEach(track => track.enabled = true);
                                }
                                pubRef.current.unmuteLocalMic();
                            } catch (e) {
                                console.warn("Failed to unmute mic:", e);
                            }
                            setMicOn(true);
                            
                            // Confirm unmute status to teacher
                            try {
                                player.sendDataSafe?.(teacherStreamId, {
                                    type: "student_mic_status",
                                    peerStreamId: myPeerStreamId,
                                    muted: false
                                });
                            } catch (e) {
                                console.warn("Failed to send unmute confirmation:", e);
                            }
                            
                            toast("تم إلغاء كتم الميكروفون من قبل المعلّم");
                        }
                    }

                    // Handle teacher screen sharing
                    if (msg.type === "teacher_screen_share") {
                        setTeacherScreenSharing(msg.sharing);
                    }

                    // Handle student screen sharing
                    if (msg.type === "screenShare" && msg.peerStreamId) {
                        const pid = String(msg.peerStreamId);
                        if (pid !== myPeerStreamId) {
                            setStudentScreenSharing((prev) => ({
                                ...prev,
                                [pid]: msg.sharing
                            }));
                        }
                    }
                }
            },
            onError: (err, msg) => {
                console.warn("Student player error:", err, msg);
                setConnecting(false);
            },
        });

        playerRef.current = player;
        
        // Monitor connection health
        connectionMonitorRef.current = monitorConnection(player, () => {
            if (!isLeavingIntentionally.current) {
                console.warn('Connection lost, attempting to reconnect...');
                toast.error('انقطع الاتصال، جاري إعادة المحاولة...');
                // Attempt to rejoin
                setTimeout(() => {
                    if (playerRef.current && teacherStreamId) {
                        playIfNeeded(teacherStreamId);
                    }
                }, 3000);
            }
        });

        // show my placeholder i/mmediately (grid split) — include my REAL name/avatar
        setRoster((r) => ({ ...r, [myPeerStreamId]: { name: me.name, avatarUrl: me.avatarUrl } }));

        // send leave on unload
        const onUnload = () => {
            try { playerRef.current?.sendDataSafe?.(teacherStreamId, { type: "leave", id: myPeerStreamId }); } catch (e) { console.warn("Failed to send leave message:", e); }
        };
        window.addEventListener("beforeunload", onUnload);

        return () => {
            window.removeEventListener("beforeunload", onUnload);
            
            // Stop connection monitor
            if (connectionMonitorRef.current) {
                connectionMonitorRef.current();
                connectionMonitorRef.current = null;
            }
            
            // Send leave message
            try { 
                playerRef.current?.sendDataSafe?.(teacherStreamId, { type: "leave", id: myPeerStreamId }); 
            } catch (e) { 
                console.warn("Failed to send leave message:", e); 
            }
            
            // Clean up player
            safeCleanupAdaptor(playerRef.current, teacherStreamId).then(() => {
                playerRef.current = null;
            });
            
            // Clear local state
            currentPlayingSet.clear();
            setPeerStreams([]);
            tilesVideoRef.current = {};
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teacherStreamId, myPeerStreamId, me.name, me.avatarUrl, navigate, programId, handleIncomingMessage]);

    // Track what the user wants to enable when starting publishing
    const pendingMediaRef = useRef({ mic: false, cam: false });

    // 3) publish my camera/mic/screen on demand
    const startPublishing = async (enableMic = false, enableCam = false) => {
        if (pubRef.current || !teacherStreamId) return;
        
        // Store what we need to enable after publishing starts
        pendingMediaRef.current = { mic: enableMic, cam: enableCam };
        
        const ws = buildAntWsUrl();
        const pub = createAdaptor({
            websocket_url: ws,
            localVideoId: "studentLocal",
            mediaConstraints: { video: true, audio: true }, // Start with both enabled
            onInfo: async (info) => {
                if (info === "initialized") pub.publish(myPeerStreamId);
                if (info === "publish_started") {
                    setPubActive(true);

                    // Get what we need to enable
                    const { mic: shouldEnableMic, cam: shouldEnableCam } = pendingMediaRef.current;
                    
                    // Directly enable/disable tracks instead of using Ant Media methods
                    try {
                        const stream = pub.localStream;
                        if (stream) {
                            // Enable/disable audio track
                            const audioTracks = stream.getAudioTracks();
                            audioTracks.forEach(track => {
                                track.enabled = shouldEnableMic;
                            });
                            
                            // Enable/disable video track
                            const videoTracks = stream.getVideoTracks();
                            videoTracks.forEach(track => {
                                track.enabled = shouldEnableCam;
                            });
                        }
                    } catch (e) {
                        console.warn("Failed to set initial track states:", e);
                    }
                    
                    // Set states based on what's enabled
                    setCamOn(shouldEnableCam);
                    setMicOn(shouldEnableMic);
                    
                    // Notify teacher
                    try {
                        playerRef.current?.sendDataSafe?.(teacherStreamId, {
                            type: "peerPublish",
                            peerStreamId: myPeerStreamId,
                            profile: { name: me.name, avatarUrl: me.avatarUrl },
                        });
                        
                        // Send initial mic status
                        playerRef.current?.sendDataSafe?.(teacherStreamId, {
                            type: "student_mic_status",
                            peerStreamId: myPeerStreamId,
                            muted: !shouldEnableMic
                        });
                    } catch (e) {
                        console.warn("Failed to send peer publish message:", e);
                    }
                    setPeerStreams((arr) => (arr.includes(myPeerStreamId) ? arr : [...arr, myPeerStreamId]));
                }
                if (info === "publish_finished") {
                    setPubActive(false); setCamOn(false); setMicOn(false); setSharing(false);
                    try {
                        playerRef.current?.sendDataSafe?.(teacherStreamId, { type: "peerStopped", peerStreamId: myPeerStreamId });
                    } catch (e) {
                        console.warn("Failed to send peer stopped message:", e);
                    }
                    setPeerStreams((arr) => arr.filter((x) => x !== myPeerStreamId));
                }
            },
            onError: () => toast.error("تعذر تشغيل الكاميرا/الميكروفون"),
        });
        pubRef.current = pub;
    };

    const stopPublishing = () => {
        try { pubRef.current?.stop?.(myPeerStreamId); } catch (e) { console.warn("Failed to stop publisher:", e); }
        try { pubRef.current?.safeClose?.(); } catch (e) { console.warn("Failed to close publisher:", e); }
        // Clean up dummy video track
        pubRef.current = null;
    };

    const toggleCam = async () => {
        // If not publishing yet, start with camera ONLY (mic stays off)
        if (!pubActive) {
            await startPublishing(false, true); // enableMic=false, enableCam=true
            return;
        }
        
        const a = pubRef.current; if (!a) return;
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
    };

    const toggleMic = async () => {
        // If not publishing yet, start with mic ONLY (camera stays off)
        if (!pubActive) {
            await startPublishing(true, false); // enableMic=true, enableCam=false
            return;
        }
        
        const a = pubRef.current; if (!a) return;
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
        
        // Notify teacher about mic status change
        try {
            if (playerRef.current && teacherStreamId) {
                playerRef.current.sendDataSafe?.(teacherStreamId, {
                    type: "student_mic_status",
                    peerStreamId: myPeerStreamId,
                    muted: !newMicState // muted is opposite of micOn
                });
            }
        } catch (e) {
            console.warn("Failed to send mic status:", e);
        }
    };
    const toggleRaiseHand = () => {
        const newHandRaised = !handRaised;
        setHandRaised(newHandRaised);
        try {
            if (playerRef.current && teacherStreamId) {
                playerRef.current.sendDataSafe?.(teacherStreamId, {
                    type: "raise_hand",
                    peerStreamId: myPeerStreamId,
                    raised: newHandRaised,
                    profile: { name: me.name, avatarUrl: me.avatarUrl }
                });
            }
        } catch (e) {
            console.warn("Failed to send raise hand message:", e);
        }
    };
    const shareScreen = async () => {
        const a = pubRef.current; if (!a || !pubActive) return;

        // If already sharing, stop sharing
        if (sharing) {
            try {
                if (displayStream) {
                    displayStream.getTracks().forEach(track => track.stop());
                    setDisplayStream(null);
                }
                setSharing(false);
                // Notify teacher that screen sharing stopped
                if (playerRef.current && teacherStreamId) {
                    playerRef.current.sendDataSafe?.(teacherStreamId, {
                        type: "screenShare",
                        peerStreamId: myPeerStreamId,
                        sharing: false
                    });
                }
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
                a.switchDesktopCapture(myPeerStreamId, () => {
                    setSharing(false);
                    setDisplayStream(null);
                    // Notify teacher that screen sharing stopped
                    if (playerRef.current && teacherStreamId) {
                        playerRef.current.sendDataSafe?.(teacherStreamId, {
                            type: "screenShare",
                            peerStreamId: myPeerStreamId,
                            sharing: false
                        });
                    }
                });
                setSharing(true);
                // Notify teacher that screen sharing started
                if (playerRef.current && teacherStreamId) {
                    playerRef.current.sendDataSafe?.(teacherStreamId, {
                        type: "screenShare",
                        peerStreamId: myPeerStreamId,
                        sharing: true
                    });
                }
            } else {
                // Fallback: manual screen sharing
                const display = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true // Enable audio to prevent the error
                });

                setDisplayStream(display);
                setSharing(true);
                // Notify teacher that screen sharing started
                if (playerRef.current && teacherStreamId) {
                    playerRef.current.sendDataSafe?.(teacherStreamId, {
                        type: "screenShare",
                        peerStreamId: myPeerStreamId,
                        sharing: true
                    });
                }

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
                    // Notify teacher that screen sharing stopped
                    if (playerRef.current && teacherStreamId) {
                        playerRef.current.sendDataSafe?.(teacherStreamId, {
                            type: "screenShare",
                            peerStreamId: myPeerStreamId,
                            sharing: false
                        });
                    }
                };
            }
        } catch (error) {
            console.warn("Screen sharing error:", error);
            toast.error("تعذر مشاركة الشاشة");
        }
    };

    const toggleMutePlayback = () => {
        if (!teacherVideoRef.current) return;
        teacherVideoRef.current.muted = !teacherVideoRef.current.muted;
        setMuted(teacherVideoRef.current.muted);
    };
    const toggleFullscreen = async () => {
        try {
            if (!stageRef.current) return;
            if (!document.fullscreenElement) await stageRef.current.requestFullscreen();
            else await document.exitFullscreen();
            setIsFullscreen(!!document.fullscreenElement);
        } catch (e) { console.warn("Failed to toggle fullscreen:", e); }
    };
    const leave = async () => {
        // Mark as intentional leaving to prevent warning
        isLeavingIntentionally.current = true;
        
        try {
            // Send leave message
            if (playerRef.current && teacherStreamId) {
                playerRef.current.sendDataSafe?.(teacherStreamId, { type: "leave", id: myPeerStreamId });
            }
            
            // Stop connection monitor
            if (connectionMonitorRef.current) {
                connectionMonitorRef.current();
                connectionMonitorRef.current = null;
            }
            
            // Stop publishing if active
            stopPublishing();
            
            // Clean up player
            await safeCleanupAdaptor(playerRef.current, teacherStreamId);
            playerRef.current = null;
        } catch (e) {
            console.warn("Error leaving session:", e);
        } finally {
            navigate(`/student/courses/${programId}`);
        }
    };

    const handleConfirmLeave = async () => {
        isLeavingIntentionally.current = true;
        
        try {
            // Send leave message
            if (playerRef.current && teacherStreamId) {
                playerRef.current.sendDataSafe?.(teacherStreamId, { type: "leave", id: myPeerStreamId });
            }
            
            // Stop connection monitor
            if (connectionMonitorRef.current) {
                connectionMonitorRef.current();
                connectionMonitorRef.current = null;
            }
            
            // Stop publishing if active
            if (pubRef.current) {
                await safeCleanupAdaptor(pubRef.current, myPeerStreamId);
                pubRef.current = null;
            }
            
            // Clean up player
            await safeCleanupAdaptor(playerRef.current, teacherStreamId);
            playerRef.current = null;
            
            // Force navigation
            window.location.href = pendingNavigationHref;
        } catch (e) {
            console.warn("Cleanup error:", e);
            window.location.href = pendingNavigationHref;
        }
    };

    const participantIds = Object.keys(roster);
    const tilesCount = 1 + participantIds.length;

    return (
        <div className="p-3 sm:p-4 md:p-6" dir="rtl">
            <div className="mb-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                <button onClick={leave} className="inline-flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded border hover:bg-gray-50">الرجوع</button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`inline-flex items-center gap-1 text-xs px-2 sm:px-3 py-1 rounded-full ${isChatOpen ? 'bg-[#0e7490] text-white' : 'bg-gray-100 text-gray-700'
                            }`}
                    >
                        <ChatBubbleLeftRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        المحادثة
                    </button>
                    <button onClick={leave} className="inline-flex items-center gap-1 sm:gap-2 text-xs bg-red-600 text-white px-2 sm:px-3 py-1 rounded-full">
                        <ArrowLeftOnRectangleIcon className="w-3 h-3 sm:w-4 sm:h-4" /> مغادرة
                    </button>
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 sm:px-3 py-1">
                        <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4" /><span>{participantIds.length}</span>
                    </span>
                </div>
            </div>

            <div ref={stageRef} className="bg-white rounded-xl shadow overflow-hidden">
                {/* Spotlight Mode: Screen Sharing */}
                {someoneScreenSharing ? (
                    <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 p-2 sm:p-4">
                        {/* Main Screen (Screen Share) */}
                        <div className="flex-1 relative rounded-xl overflow-hidden bg-black">
                            {teacherScreenSharing ? (
                                // Teacher's screen
                                <>
                                    <video ref={teacherVideoRef} className="w-full h-full object-contain" autoPlay playsInline muted={muted} />
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                                        <ComputerDesktopIcon className="w-4 h-4 inline-block ml-1" />
                                        المعلّم يشارك الشاشة
                                    </div>
                                </>
                            ) : sharing ? (
                                // My screen
                                <>
                                    <video 
                                        id="studentLocal"
                                        className="w-full h-full object-contain"
                                        autoPlay
                                        playsInline
                                        muted
                                    />
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                                        <ComputerDesktopIcon className="w-4 h-4 inline-block ml-1" />
                                        أنت تشارك الشاشة
                                    </div>
                                </>
                            ) : screenSharingStudentId ? (
                                // Another student's screen
                                <>
                                    <video
                                        ref={(el) => { if (el) tilesVideoRef.current[screenSharingStudentId] = el; }}
                                        className="w-full h-full object-contain"
                                        autoPlay
                                        playsInline
                                    />
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                                        <ComputerDesktopIcon className="w-4 h-4 inline-block ml-1" />
                                        {roster[screenSharingStudentId]?.name || "طالب"} يشارك الشاشة
                                    </div>
                                </>
                            ) : null}
                        </div>
                        
                        {/* Sidebar with small participant tiles */}
                        <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto">
                            {/* Teacher tile (small) */}
                            {!teacherScreenSharing && (
                                <div className="relative rounded-xl overflow-hidden bg-black w-40 lg:w-full aspect-video flex-shrink-0">
                                    <video ref={teacherVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted={muted} />
                                    <NameTag>المعلّم</NameTag>
                                    <button onClick={toggleMutePlayback} className="absolute bottom-2 right-2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1">
                                        {muted ? <SpeakerXMarkIcon className="w-3 h-3" /> : <SpeakerWaveIcon className="w-3 h-3" />}
                                    </button>
                                </div>
                            )}
                            
                            {/* Participant tiles (small) */}
                            {participantIds.filter(id => !studentScreenSharing[id] && !(sharing && id === myPeerStreamId)).map((id) => {
                                const profile = roster[id] || {};
                                const hasVideo = peerStreams.includes(id);
                                const isMe = id === myPeerStreamId;
                                return (
                                    <div key={id} className="relative rounded-xl overflow-hidden bg-black w-40 lg:w-full aspect-video flex-shrink-0">
                                        {isMe && !sharing && (
                                            <video
                                                id="studentLocal"
                                                className="w-full h-full object-cover"
                                                autoPlay
                                                playsInline
                                                muted
                                            />
                                        )}
                                        {!isMe && hasVideo && (
                                            <video
                                                ref={(el) => { if (el) tilesVideoRef.current[id] = el; }}
                                                className="w-full h-full object-cover"
                                                autoPlay
                                                playsInline
                                            />
                                        )}
                                        <AvatarBadge
                                            name={isMe ? (me.name || "أنت") : (profile.name || "مشترك")}
                                            avatarUrl={isMe ? me.avatarUrl : profile.avatarUrl}
                                            bottomRight={isMe ? (me.name || "أنت") : (profile.name || "مشترك")}
                                        />
                                        <NameTag>{isMe ? (me.name || "أنت") : (profile.name || "مشترك")}</NameTag>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* Normal Grid Mode: No Screen Sharing */
                    <div className={`grid ${gridCols(tilesCount)} gap-2 sm:gap-3 p-2 sm:p-4`}>
                        {/* Teacher */}
                        <div className="relative rounded-xl overflow-hidden bg-black">
                            <video ref={teacherVideoRef} className="w-full aspect-video object-cover" autoPlay playsInline muted={muted} />
                            <NameTag>المعلّم</NameTag>
                            <button onClick={toggleFullscreen} className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2">
                                {isFullscreen ? <ArrowsPointingInIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowsPointingOutIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                            <button onClick={toggleMutePlayback} className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 sm:p-2">
                                {muted ? <SpeakerXMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                            {connecting && <div className="absolute inset-0 flex items-center justify-center text-white/80 text-xs sm:text-sm">جاري الاتصال بالبث...</div>}
                        </div>

                    {/* Participants (incl. me) */}
                    {participantIds.map((id) => {
                        const profile = roster[id] || {};
                        const hasVideo = peerStreams.includes(id);
                        const isMe = id === myPeerStreamId;
                        return (
                            <div key={id} className="relative rounded-xl overflow-hidden bg-black">
                                {isMe && (
                                    <video
                                        id="studentLocal"
                                        className="w-full aspect-video object-cover"
                                        autoPlay
                                        playsInline
                                        muted
                                    />
                                )}
                                {!isMe && hasVideo && (
                                    <video
                                        ref={(el) => { if (el) tilesVideoRef.current[id] = el; }}
                                        className="w-full aspect-video object-cover"
                                        autoPlay
                                        playsInline
                                    />
                                )}
                                <AvatarBadge
                                    name={isMe ? (me.name || "أنت") : (profile.name || "مشترك")}
                                    avatarUrl={isMe ? me.avatarUrl : profile.avatarUrl}
                                    bottomRight={isMe ? (me.name || "أنت") : (profile.name || "مشترك")}
                                />
                                <NameTag>{isMe ? (me.name || "أنت") : (profile.name || "مشترك")}</NameTag>
                            </div>
                        );
                    })}
                </div>
                )}

                {/* Controls (shown in both modes) */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4 pb-2 sm:pb-4">
                    <button onClick={shareScreen} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow ${sharing ? "bg-[#0e7490] text-white" : "bg-gray-100 text-gray-700"}`}>
                        <ComputerDesktopIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button onClick={toggleCam} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow ${camOn ? "bg-[#0e7490] text-white" : "bg-gray-100 text-gray-700"}`}>
                        {camOn ? <VideoCameraIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoCameraSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <button onClick={toggleMic} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow ${micOn ? "bg-[#0e7490] text-white" : "bg-gray-100 text-gray-700"}`}>
                        {micOn ? <MicrophoneIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <FaMicrophoneSlash className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <button onClick={toggleRaiseHand} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow ${handRaised ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                        <HandRaisedIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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
                currentUser={me}
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
                message="سيتم قطع الاتصال بالبث. هل تريد المتابعة؟"
                confirmText="نعم، مغادرة"
                cancelText="إلغاء"
            />
        </div>
    );
}