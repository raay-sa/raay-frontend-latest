import React, { useState, useEffect, useRef } from "react";
import { 
    ChatBubbleLeftRightIcon, 
    PaperAirplaneIcon, 
    XMarkIcon,
    EllipsisVerticalIcon,
    UserIcon,
    ExclamationTriangleIcon,
    Cog6ToothIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";
import { 
    HeartIcon, 
    FaceSmileIcon,
    HandThumbUpIcon
} from "@heroicons/react/24/solid";
import AvatarBadge from "./AvatarBadge";

const MessageTypes = {
    TEXT: 'text',
    SYSTEM: 'system',
    PRIVATE: 'private',
    REACTION: 'reaction'
};

const MessageBubble = ({ message, isOwn, isTeacher, onReact, onReply }) => {
    const [showReactions, setShowReactions] = useState(false);
    const [reactions, setReactions] = useState(message.reactions || {});

    // Update reactions when message changes
    useEffect(() => {
        const newReactions = message.reactions || {};
        setReactions(newReactions);
    }, [message.reactions, message.id]);

    const handleReaction = (emoji) => {
        if (onReact) {
            onReact(message.id, emoji);
        }
        setShowReactions(false);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('ar-SA', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getMessageStyle = () => {
        if (message.type === MessageTypes.SYSTEM) {
            return "bg-blue-50 text-blue-800 text-center text-sm py-2 px-4 rounded-lg mx-4 my-2";
        }
        if (message.type === MessageTypes.PRIVATE) {
            return "bg-purple-50 text-purple-800 text-center text-sm py-2 px-4 rounded-lg mx-4 my-2";
        }
        if (isOwn) {
            return "bg-[#0e7490] text-white mr-8 rounded-r-2xl rounded-tl-2xl rounded-bl-sm";
        }
        return "bg-gray-100 text-gray-900 ml-8 rounded-l-2xl rounded-tr-2xl rounded-br-sm";
    };

    const getReactionCount = (emoji) => {
        return reactions[emoji] || 0;
    };

    if (message.type === MessageTypes.SYSTEM || message.type === MessageTypes.PRIVATE) {
        return (
            <div className={getMessageStyle()} dir="rtl">
                <span className="text-center block">{message.text}</span>
                <div className="text-xs opacity-75 mt-1 text-center">
                    {formatTime(message.timestamp)}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isOwn ? 'justify-start' : 'justify-end'} mb-3 px-2 sm:px-4`} dir="rtl">
            <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
                {!isOwn && (
                    <div className="flex items-center gap-2 mb-1" dir="rtl">
                        <div className="w-6 h-6 rounded-full bg-[#0e7490] text-white flex items-center justify-center text-xs font-bold">
                            {(message.senderName || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-600 font-medium text-right">
                            {message.senderName}
                        </span>
                    </div>
                )}
                
                <div className={`relative group ${isOwn ? 'order-1' : 'order-2'}`}>
                    <div 
                        className={`px-4 py-2 ${getMessageStyle()}`}
                        onDoubleClick={() => handleReaction('👍')}
                        dir="rtl"
                    >
                        <p className="text-sm whitespace-pre-wrap break-words text-right" dir="rtl">
                            {String(message.text || '').trim()}
                        </p>
                        <div className="text-xs opacity-75 mt-1 text-right">
                            {formatTime(message.timestamp)}
                        </div>
                    </div>

                    {/* Reactions */}
                    {Object.keys(reactions).length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                            {Object.entries(reactions).map(([emoji, count]) => (
                                count > 0 && (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className="flex items-center gap-1 bg-white border rounded-full px-2 py-1 text-xs hover:bg-gray-50 transition-colors"
                                        title={`${emoji} (${count})`}
                                    >
                                        <span>{emoji}</span>
                                        <span>{count}</span>
                                    </button>
                                )
                            ))}
                        </div>
                    )}

                    {/* Reaction buttons on hover */}
                    <div className="absolute -top-8 left-0 bg-white border rounded-lg shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="flex gap-1">
                            {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    className="hover:bg-gray-100 rounded p-1 text-sm transition-colors"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LiveChat = ({ 
    isOpen, 
    onClose, 
    messages = [], 
    onSendMessage, 
    onReactToMessage,
    currentUser,
    participants = {}
}) => {
    const [newMessage, setNewMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [isOpen, isMinimized]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !onSendMessage) return;

        const message = {
            id: Date.now() + Math.random(),
            text: newMessage.trim(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatarUrl,
            timestamp: Date.now(),
            type: MessageTypes.TEXT,
            reactions: {}
        };


        onSendMessage(message);
        setNewMessage("");
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const handleReaction = (messageId, emoji) => {
        if (onReactToMessage) {
            onReactToMessage(messageId, emoji);
        }
    };

    const sendQuickReaction = (emoji) => {
        const reactionMessage = {
            id: Date.now() + Math.random(),
            text: emoji,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatarUrl,
            timestamp: Date.now(),
            type: MessageTypes.REACTION,
            reactions: {}
        };
        if (onSendMessage) {
            onSendMessage(reactionMessage);
        }
    };

    const participantCount = Object.keys(participants).length;

    if (!isOpen) return null;

    return (
        <div className={`fixed top-0 bg-white shadow-2xl border-l border-gray-200 z-50 transition-all duration-300 flex flex-col ${
            isMinimized ? 'w-12 right-0 h-12' : 'w-80 sm:w-96 lg:w-[400px] right-0 sm:right-4 h-screen'
        }`} style={{
            maxWidth: isMinimized ? '48px' : 'min(400px, calc(100vw - 1rem))',
            width: isMinimized ? '48px' : 'min(320px, calc(100vw - 1rem))',
            height: isMinimized ? '48px' : '100vh'
        }} dir="rtl">
            {/* Header */}
            <div className="bg-[#0e7490] text-white p-3 flex items-center justify-between">
                {!isMinimized && (
                    <>
                        <div className="flex items-center gap-2" dir="rtl">
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            <span className="font-medium text-right">المحادثة المباشرة</span>
                            <span className="text-xs bg-white/20 rounded-full px-2 py-1">
                                {participantCount}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-1 hover:bg-white/20 rounded"
                                title="تصغير المحادثة"
                            >
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-white/20 rounded"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}
                {isMinimized && (
                    <button
                        onClick={() => setIsMinimized(false)}
                        className="p-1 hover:bg-white/20 rounded"
                    >
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 overflow-x-hidden min-h-0">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>لا توجد رسائل بعد</p>
                                    <p className="text-sm">ابدأ المحادثة!</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-2">
                                {messages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        isOwn={message.senderId === currentUser.id}
                                        isTeacher={message.senderId === 'teacher' || message.isTeacher}
                                        onReact={handleReaction}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Quick Reactions */}
                    <div className="p-2 bg-white border-t border-gray-200 flex-shrink-0">
                        <div className="flex gap-1 mb-2 overflow-x-auto">
                            {['👍', '❤️', '😂', '😮', '👏'].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => sendQuickReaction(emoji)}
                                    className="p-1 sm:p-2 hover:bg-gray-100 rounded-full text-sm sm:text-lg flex-shrink-0"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-2 sm:p-3 bg-white border-t border-gray-200 flex-shrink-0">
                        <form onSubmit={handleSendMessage} className="flex gap-1 sm:gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="اكتب رسالة..."
                                className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0e7490] focus:border-transparent text-sm min-w-0 text-right"
                                dir="rtl"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="bg-[#0e7490] text-white p-2 rounded-full hover:bg-[#0c5a6b] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </>
            )}

        </div>
    );
};

export default LiveChat;
