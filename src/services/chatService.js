import http from "./http";

const ChatService = {
    // Save chat messages to backend for persistence
    saveMessage: (streamId, message) =>
        http.post(`/chat/save_message`, {
            stream_id: streamId,
            message: message
        }),

    // Get chat history for a stream
    getChatHistory: (streamId) =>
        http.get(`/chat/history/${streamId}`),

    // Delete a message (for moderation)
    deleteMessage: (messageId) =>
        http.delete(`/chat/message/${messageId}`),

    // Report a message
    reportMessage: (messageId, reason) =>
        http.post(`/chat/report_message`, {
            message_id: messageId,
            reason: reason
        }),

    // Get chat settings for a program
    getChatSettings: (programId) =>
        http.get(`/chat/settings/${programId}`),

    // Update chat settings (teacher only)
    updateChatSettings: (programId, settings) =>
        http.put(`/chat/settings/${programId}`, settings),

    // Mute a user in chat
    muteUser: (streamId, userId, duration = null) =>
        http.post(`/chat/mute_user`, {
            stream_id: streamId,
            user_id: userId,
            duration: duration
        }),

    // Unmute a user in chat
    unmuteUser: (streamId, userId) =>
        http.post(`/chat/unmute_user`, {
            stream_id: streamId,
            user_id: userId
        }),

    // Get muted users for a stream
    getMutedUsers: (streamId) =>
        http.get(`/chat/muted_users/${streamId}`),

    // Send private message
    sendPrivateMessage: (streamId, recipientId, message) =>
        http.post(`/chat/private_message`, {
            stream_id: streamId,
            recipient_id: recipientId,
            message: message
        }),

    // Get private messages
    getPrivateMessages: (streamId, userId) =>
        http.get(`/chat/private_messages/${streamId}/${userId}`),

    // Clear chat history for a stream
    clearChatHistory: (streamId) =>
        http.delete(`/chat/clear_history/${streamId}`),

    // Export chat history
    exportChatHistory: (streamId, format = 'json') =>
        http.get(`/chat/export/${streamId}?format=${format}`, {
            responseType: 'blob'
        })
};

export default ChatService;
