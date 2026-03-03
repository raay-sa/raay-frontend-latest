// src/lib/liveStreamingUtils.js
// Utility functions for live streaming

/**
 * Validates incoming data channel messages
 * @param {any} raw - Raw message data
 * @param {string[]} allowedTypes - Array of allowed message types
 * @returns {object|null} - Parsed and validated message or null
 */
export function validateDataChannelMessage(raw, allowedTypes = []) {
    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        
        // Validate structure
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        
        // Check if type is allowed
        if (allowedTypes.length > 0 && !allowedTypes.includes(parsed.type)) {
            console.warn(`Unauthorized message type: ${parsed.type}`);
            return null;
        }
        
        // Sanitize string fields to prevent XSS
        if (parsed.profile?.name) {
            parsed.profile.name = String(parsed.profile.name).slice(0, 100);
        }
        
        return parsed;
    } catch (error) {
        console.warn('Failed to parse data channel message:', error);
        return null;
    }
}

/**
 * Creates a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Creates a throttled function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} - Result of the function
 */
export async function retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            const waitTime = delay * Math.pow(2, i);
            console.warn(`Retry ${i + 1}/${maxRetries} failed, waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

/**
 * Safe cleanup for WebRTC adaptor
 * @param {object} adaptor - WebRTC adaptor instance
 * @param {string} streamId - Stream ID to stop
 */
export async function safeCleanupAdaptor(adaptor, streamId) {
    if (!adaptor) return;
    
    try {
        // Stop the stream
        if (streamId) {
            adaptor.stop?.(streamId);
        }
    } catch (e) {
        console.warn('Failed to stop stream:', e);
    }
    
    try {
        // Close WebSocket
        adaptor.closeWebSocket?.();
    } catch (e) {
        console.warn('Failed to close WebSocket:', e);
    }
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Monitor WebSocket connection health
 * @param {object} adaptor - WebRTC adaptor instance
 * @param {Function} onDisconnect - Callback when disconnected
 * @returns {Function} - Cleanup function
 */
export function monitorConnection(adaptor, onDisconnect) {
    if (!adaptor?.websocket) return () => {};
    
    const checkInterval = setInterval(() => {
        const ws = adaptor.websocket;
        if (ws && ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CONNECTING) {
            console.warn('WebSocket disconnected, state:', ws.readyState);
            onDisconnect?.();
        }
    }, 5000);
    
    return () => clearInterval(checkInterval);
}

/**
 * Allowed message types for data channel (security whitelist)
 */
export const TEACHER_MESSAGE_TYPES = [
    'join', 'leave', 'peerPublish', 'peerStopped', 'raise_hand', 
    'screenShare', 'student_mic_status',
    // Chat message types
    'chat_message', 'chat_reaction', 'chat_deleted', 'chat_edited'
];

export const STUDENT_MESSAGE_TYPES = [
    'sync_request', 'roster_set', 'end', 'mute_all_students', 
    'mute_specific_student', 'teacher_cam', 'teacher_screen_share', 
    'peerPublish', 'peerStopped', 'screenShare',
    // Chat message types
    'chat_message', 'chat_reaction', 'chat_deleted', 'chat_edited'
];

/**
 * Parse incoming data channel message
 * @param {any} raw - Raw message data
 * @param {boolean} isTeacher - Whether the user is a teacher
 * @returns {object|null} - Parsed message or null
 */
export function parseDataChannelMessage(raw, isTeacher = false) {
    try {
        const o = typeof raw === "string" ? JSON.parse(raw) : raw;
        
        // Filter out noise events
        if (o?.eventType && (
            o.eventType === "UPDATE_AUDIO_LEVEL" || 
            o.eventType === "VIDEO_TRACK_ASSIGNMENT_LIST"
        )) {
            return null;
        }
        
        // Handle payload array
        if (o?.payload?.length) {
            const p = typeof o.payload[0] === "string" ? JSON.parse(o.payload[0]) : o.payload[0];
            if (!p?.type) return null;
            
            // Validate message type
            const allowedTypes = isTeacher ? TEACHER_MESSAGE_TYPES : STUDENT_MESSAGE_TYPES;
            return validateDataChannelMessage(p, allowedTypes);
        }
        
        if (!o?.type) return null;
        
        // Validate message type
        const allowedTypes = isTeacher ? TEACHER_MESSAGE_TYPES : STUDENT_MESSAGE_TYPES;
        return validateDataChannelMessage(o, allowedTypes);
    } catch (error) {
        console.warn('Failed to parse message:', error);
        return null;
    }
}

