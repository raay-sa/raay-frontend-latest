import { useState, useEffect, useCallback, useRef } from 'react';
import ChatService from '../services/chatService';

const MessageTypes = {
    TEXT: 'text',
    SYSTEM: 'system',
    PRIVATE: 'private',
    REACTION: 'reaction',
    CHAT_MESSAGE: 'chat_message',
    CHAT_REACTION: 'chat_reaction',
    CHAT_SYSTEM: 'chat_system',
    CHAT_PRIVATE: 'chat_private'
};

export const useLiveChat = (streamId, currentUser, adaptor, isTeacher = false) => {
    const [messages, setMessages] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [mutedUsers, setMutedUsers] = useState(new Set());
    const [chatSettings, setChatSettings] = useState({
        allowReactions: true
    });
    
    const messagesRef = useRef([]);
    const lastMessageIdRef = useRef(0);

    // Update messages ref when messages change
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Live messages only - no history loading

    // Simple live chat - no settings needed

    const loadChatHistory = async () => {
        try {
            const { data } = await ChatService.getChatHistory(streamId);
            if (data && Array.isArray(data.messages)) {
                setMessages(data.messages);
                lastMessageIdRef.current = Math.max(...data.messages.map(m => m.id), 0);
            }
        } catch (error) {
            console.warn('Failed to load chat history:', error);
        }
    };

    const loadChatSettings = async () => {
        try {
            const { data } = await ChatService.getChatSettings(streamId);
            if (data) {
                setChatSettings(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.warn('Failed to load chat settings:', error);
        }
    };

    const generateMessageId = () => {
        return ++lastMessageIdRef.current;
    };

    const addSystemMessage = useCallback((text, type = MessageTypes.SYSTEM) => {
        const message = {
            id: generateMessageId(),
            text,
            type,
            timestamp: Date.now(),
            senderId: 'system',
            senderName: 'النظام',
            senderAvatar: ''
        };
        
        setMessages(prev => [...prev, message]);
        return message;
    }, []);

    const sendMessage = useCallback(async (messageData) => {
        if (!adaptor || !streamId) {
            console.warn('No adaptor or streamId available for sending message');
            return;
        }

        // Check if user is muted
        if (mutedUsers.has(currentUser.id)) {
            addSystemMessage('تم كتمك في المحادثة', MessageTypes.SYSTEM);
            return;
        }

        // Simple live chat - no restrictions

        const message = {
            id: generateMessageId(),
            ...messageData,
            timestamp: Date.now(),
            streamId,
            isTeacher
        };


        // Add to local messages immediately for better UX
        setMessages(prev => [...prev, message]);

        // Send via WebRTC data channel
        try {
            const chatMessage = {
                type: MessageTypes.CHAT_MESSAGE,
                message: message
            };
            
            adaptor.sendDataSafe(streamId, chatMessage);
            
            // Live messages only - no backend saving
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove from local messages if sending failed
            setMessages(prev => prev.filter(m => m.id !== message.id));
            addSystemMessage('فشل في إرسال الرسالة', MessageTypes.SYSTEM);
        }
    }, [adaptor, streamId, currentUser.id, mutedUsers, chatSettings, isTeacher, addSystemMessage]);

    const reactToMessage = useCallback(async (messageId, emoji) => {
        if (!adaptor || !streamId) {
            console.warn('No adaptor or streamId available for sending reaction');
            return;
        }

        if (!chatSettings.allowReactions) {
            addSystemMessage('التفاعلات غير متاحة', MessageTypes.SYSTEM);
            return;
        }

        // Update local state immediately for better UX
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const reactions = { ...msg.reactions };
                reactions[emoji] = (reactions[emoji] || 0) + 1;
                return { ...msg, reactions };
            }
            return msg;
        }));

        const reaction = {
            id: generateMessageId(),
            type: MessageTypes.CHAT_REACTION,
            messageId,
            emoji,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatarUrl,
            timestamp: Date.now(),
            streamId
        };


        try {
            adaptor.sendDataSafe(streamId, reaction);
        } catch (error) {
            console.error('Failed to send reaction:', error);
            // Revert local state if sending failed
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    const reactions = { ...msg.reactions };
                    reactions[emoji] = Math.max(0, (reactions[emoji] || 0) - 1);
                    if (reactions[emoji] === 0) {
                        delete reactions[emoji];
                    }
                    return { ...msg, reactions };
                }
                return msg;
            }));
        }
    }, [adaptor, streamId, currentUser, chatSettings.allowReactions, addSystemMessage]);

    const sendPrivateMessage = useCallback(async (recipientId, text) => {
        if (!adaptor || !streamId) {
            console.warn('No adaptor or streamId available for sending private message');
            return;
        }

        // Simple live chat - no private messages

        const message = {
            id: generateMessageId(),
            text,
            type: MessageTypes.CHAT_PRIVATE,
            recipientId,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatarUrl,
            timestamp: Date.now(),
            streamId
        };

        try {
            adaptor.sendDataSafe(streamId, message);
            
            // Add to local messages
            setMessages(prev => [...prev, message]);
            
            // Live messages only - no backend saving
        } catch (error) {
            console.error('Failed to send private message:', error);
        }
    }, [adaptor, streamId, currentUser, chatSettings, addSystemMessage]);

    // Simple live chat - no teacher controls needed

    // Handle incoming chat messages from WebRTC data channel
    const handleIncomingMessage = useCallback((data) => {
        if (!data || !data.type) return;


        switch (data.type) {
            case MessageTypes.CHAT_MESSAGE:
                if (data.message && data.message.id) {
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === data.message.id)) {
                            return prev;
                        }
                        return [...prev, data.message];
                    });
                }
                break;

            case MessageTypes.CHAT_REACTION:
                if (data.messageId && data.emoji) {
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === data.messageId) {
                            const reactions = { ...msg.reactions };
                            reactions[data.emoji] = (reactions[data.emoji] || 0) + 1;
                            return { ...msg, reactions };
                        }
                        return msg;
                    }));
                }
                break;

            case MessageTypes.CHAT_PRIVATE:
                if (data.recipientId === currentUser.id || data.senderId === currentUser.id) {
                    setMessages(prev => [...prev, data]);
                }
                break;

            case 'chat_mute':
                if (data.userId === currentUser.id) {
                    setMutedUsers(prev => new Set([...prev, data.userId]));
                    addSystemMessage('تم كتمك في المحادثة', MessageTypes.SYSTEM);
                }
                break;

            case 'chat_unmute':
                if (data.userId === currentUser.id) {
                    setMutedUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.userId);
                        return newSet;
                    });
                    addSystemMessage('تم إلغاء كتمك في المحادثة', MessageTypes.SYSTEM);
                }
                break;

            case 'chat_clear':
                setMessages([]);
                addSystemMessage('تم مسح المحادثة من قبل المعلّم', MessageTypes.SYSTEM);
                break;

            case 'chat_settings_update':
                if (data.settings) {
                    setChatSettings(prev => ({ ...prev, ...data.settings }));
                }
                break;

            default:
                break;
        }
    }, [currentUser.id, addSystemMessage]);

    return {
        messages,
        isChatOpen,
        setIsChatOpen,
        sendMessage,
        reactToMessage,
        handleIncomingMessage,
        addSystemMessage
    };
};

export { MessageTypes };
