// src/contexts/PushNotificationsContext.jsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Pusher from "pusher-js";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext"; 

const PushCtx = createContext({
    lastEvent: null,
    isConnected: false,
    addListener: (_channel, _event, _cb) => { },
    removeListener: (_channel, _event, _cb) => { },
});

export function usePushNotifications() {
    return useContext(PushCtx);
}

// ---------------- Helpers ----------------

const eventTitles = {
    "assignment-solution-event": "حلّ واجب جديد",
    "exam-solution-event": "حلّ اختبار جديد",
    "certificate-event": "تم إصدار شهادة",
    "general-notification-event": "إشعار جديد",
    "live-program-event": "جلسة بث مباشر",
    "new-program-event": "برنامج جديد",
    "new-registration-event": "تسجيل جديد",
    "review-event": "تقييم جديد",
    "warning-event": "تحذير جديد",
};

function roleOf(user) {
    // Your app uses: 'admin' | 'student' | 'teacher'
    return user?.type ?? null;
}
function idOf(user) {
    return user?.id ?? null;
}

function channelsFor(role, id) {
    if (!role) return [];
    if (role === "admin") {
        // Channels without {id} are for admins only
        return [
            { name: "new-program-channel", event: "new-program-event" },
            { name: "new-registration-channel", event: "new-registration-event" },
            { name: "review-channel-admin", event: "review-event" },
        ];
    }
    if (role === "teacher") {
        return [
            { name: `private-assignment-solution-channel-teacher-${id}`, event: "assignment-solution-event" },
            { name: `private-exam-solution-channel-teacher-${id}`, event: "exam-solution-event" },
            { name: `private-general-notification-teacher-${id}`, event: "general-notification-event" },
            { name: `private-live-program-teacher-${id}`, event: "live-program-event" },
            { name: `private-review-channel-teacher-${id}`, event: "review-event" },
        ];
    }
    // default student
    return [
        { name: `private-certificate-channel-student-${id}`, event: "certificate-event" },
        { name: `private-general-notification-student-${id}`, event: "general-notification-event" },
        { name: `private-live-program-student-${id}`, event: "live-program-event" },
        { name: `private-warning-channel-student-${id}`, event: "warning-event" },
    ];
}

// ---- Browser notifications (optional) ----
const browserPushEnabled =
    String(import.meta.env.VITE_NOTIFICATIONS_ENABLE_BROWSER ?? "false").toLowerCase() === "true";

async function ensureBrowserPermission() {
    if (!browserPushEnabled) return false;
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    try {
        const res = await Notification.requestPermission();
        return res === "granted";
    } catch {
        return false;
    }
}

function showBrowserNotification(title, body) {
    if (!browserPushEnabled) return;
    try {
        new Notification(title || "إشعار", {
            body: body || "",
            icon: "/favicon.ico",
            dir: "rtl",
        });
    } catch {
        /* noop */
    }
}

// ---------------- Provider ----------------

export function PushNotificationsProvider({
    children,
    pusherKey = import.meta.env.VITE_PUSHER_KEY,
    pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER || "eu",
    logToConsole = import.meta.env.DEV,
}) {
    const { user, loading } = useAuth(); 
    const role = roleOf(user);
    const uid = idOf(user);

    const pusherRef = useRef(null);
    const subsRef = useRef([]); 
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState(null);

    // Dispose all subs and (optionally) the client
    const cleanupAll = useCallback(() => {
        const instance = pusherRef.current;
        if (!instance) return;
        try {
            subsRef.current.forEach(({ channel, event, cb, name }) => {
                channel?.unbind?.(event, cb);
                instance?.unsubscribe?.(name);
            });
        } catch { }
        subsRef.current = [];
    }, []);

    // Tear down the client itself
    const teardownClient = useCallback(() => {
        try {
            cleanupAll();
            pusherRef.current?.disconnect?.();
        } catch { }
        pusherRef.current = null;
        setIsConnected(false);
    }, [cleanupAll]);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            teardownClient();
            return;
        }

        if (!role || (role !== "admin" && !uid)) return;
        if (!pusherKey || !pusherCluster) {
            console.error('Pusher configuration missing:', { pusherKey, pusherCluster });
            return;
        }

        // Log the Pusher configuration being used
        console.log('Pusher config:', { 
            key: pusherKey, 
            cluster: pusherCluster,
            keyLength: pusherKey?.length 
        });

        // Initialize client once
        if (!pusherRef.current) {
            if (typeof Pusher !== "undefined") {
                Pusher.logToConsole = !!logToConsole;
            }
            pusherRef.current = new Pusher(pusherKey, {
                cluster: pusherCluster,
                forceTLS: true,
                authorizer: (channel) => {
                    return {
                        authorize: (socketId, callback) => {
                            const token = localStorage.getItem('token');
                            if (!token) {
                                callback('No token found', null);
                                return;
                            }

                            fetch('/api/broadcasting/auth', {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    socket_id: socketId,
                                    channel_name: channel.name
                                })
                            })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Auth request failed: ${response.status} ${response.statusText}`);
                                }
                                return response.json();
                            })
                            .then(data => {
                                // Validate that the auth response contains the correct key
                                if (data && typeof data === 'string') {
                                    // Auth string format: "key:signature"
                                    const authKey = data.split(':')[0];
                                    if (authKey !== pusherKey) {
                                        console.error('Key mismatch detected!', {
                                            frontendKey: pusherKey,
                                            backendAuthKey: authKey,
                                            message: 'The backend is using a different Pusher key than the frontend. They must match.'
                                        });
                                    }
                                } else if (data && data.auth) {
                                    // Auth object format: { auth: "key:signature" }
                                    const authKey = data.auth.split(':')[0];
                                    if (authKey !== pusherKey) {
                                        console.error('Key mismatch detected!', {
                                            frontendKey: pusherKey,
                                            backendAuthKey: authKey,
                                            message: 'The backend is using a different Pusher key than the frontend. They must match.'
                                        });
                                    }
                                }
                                callback(null, data);
                            })
                            .catch(error => {
                                console.error('Auth error:', error);
                                callback(error, null);
                            });
                        }
                    };
                }
            });

            const instance = pusherRef.current;
            instance.connection.bind("connected", () => {
                console.log('Pusher connected successfully');
                setIsConnected(true);
            });
            instance.connection.bind("disconnected", () => {
                console.log('Pusher disconnected');
                setIsConnected(false);
            });
            instance.connection.bind("error", (error) => {
                console.error('Pusher connection error:', error);
                setIsConnected(false);
            });
        }

        // Resubscribe for the current role/id
        const instance = pusherRef.current;
        const chs = channelsFor(role, uid);
        cleanupAll();

        const bound = chs.map(({ name, event }) => {
            console.log(`Subscribing to channel: ${name} for event: ${event}`);
            const ch = instance.subscribe(name);
            const cb = (data) => {
                console.log(`Received event ${event} on channel ${name}:`, data);
                handleIncoming(event, data, { role, uid, setLastEvent });
            };
            ch.bind(event, cb);
            return { channel: ch, name, event, cb };
        });

        subsRef.current = bound;

        // Ask notification permission once
        ensureBrowserPermission();

        // Cleanup when role/id changes or on unmount
        return () => {
            cleanupAll();
        };
    }, [loading, user, role, uid, pusherKey, pusherCluster, logToConsole, cleanupAll, teardownClient]);

    // Public ad-hoc listener APIs (optional)
    const addListener = useCallback((channelName, eventName, cb) => {
        const instance = pusherRef.current;
        if (!instance) return;
        const ch = instance.subscribe(channelName);
        ch.bind(eventName, cb);
        subsRef.current.push({ channel: ch, name: channelName, event: eventName, cb });
    }, []);

    const removeListener = useCallback((channelName, eventName, cb) => {
        const instance = pusherRef.current;
        if (!instance) return;
        const idx = subsRef.current.findIndex(
            (s) => s.name === channelName && s.event === eventName && s.cb === cb
        );
        if (idx >= 0) {
            const sub = subsRef.current[idx];
            try {
                sub.channel?.unbind?.(eventName, cb);
                // Unsubscribe only if no other handlers use this channel
                const stillUsed = subsRef.current.some((s, i) => i !== idx && s.name === channelName);
                if (!stillUsed) instance.unsubscribe(channelName);
            } catch { }
            subsRef.current.splice(idx, 1);
        }
    }, []);

    const value = useMemo(
        () => ({ lastEvent, isConnected, addListener , removeListener }),
        [lastEvent, isConnected, addListener, removeListener]
    );

    return <PushCtx.Provider value={value}>{children}</PushCtx.Provider>;
}

// How to show the toast + optional browser push
function handleIncoming(eventName, payload, { role, uid, setLastEvent }) {
    console.log(`handleIncoming called with event: ${eventName}, payload:`, payload);
    
    const title = eventTitles[eventName] || "إشعار";
    const body =
        typeof payload === "string"
            ? payload
            : payload?.message || payload?.title || payload?.body || JSON.stringify(payload);

    console.log(`Showing toast with title: ${title}, body: ${body}`);
    setLastEvent({ event: eventName, payload, at: Date.now() });

    toast.custom((t) => (
        <div
            className={`rtl bg-white border rounded-xl p-3 shadow-md w-[360px] ${t.visible ? "animate-in fade-in zoom-in" : "animate-out fade-out zoom-out"
                }`}
        >
            <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                <div className="flex-1">
                    <div className="font-semibold">{title}</div>
                    <div className="text-sm text-gray-700 mt-0.5 break-words">
                        {payload?.message ?? payload?.title ?? payload?.body ?? body}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                        {role ? `الدور: ${role}` : null} {uid ? `• المستخدم: ${uid}` : null}
                    </div>
                </div>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                    إغلاق
                </button>
            </div>
        </div>
    ));

    showBrowserNotification(title, typeof body === "string" ? body : "");
}
