import React, { useState } from "react";
import LiveChat from "./LiveChat";
import ChatSettings from "./ChatSettings";

// Demo component to showcase the live chat functionality
const ChatDemo = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "مرحباً! بدأ البث المباشر",
            type: "system",
            timestamp: Date.now() - 300000,
            senderId: "system",
            senderName: "النظام",
            senderAvatar: ""
        },
        {
            id: 2,
            text: "أهلاً وسهلاً بكم في الدرس اليوم",
            timestamp: Date.now() - 250000,
            senderId: "teacher",
            senderName: "المعلّم أحمد",
            senderAvatar: "",
            isTeacher: true,
            reactions: { "👍": 3, "❤️": 1 }
        },
        {
            id: 3,
            text: "شكراً أستاذ، الدرس ممتاز",
            timestamp: Date.now() - 200000,
            senderId: "student1",
            senderName: "سارة محمد",
            senderAvatar: "",
            reactions: { "👏": 2 }
        },
        {
            id: 4,
            text: "هل يمكنك توضيح النقطة الأخيرة؟",
            timestamp: Date.now() - 150000,
            senderId: "student2",
            senderName: "علي حسن",
            senderAvatar: ""
        }
    ]);

    const [chatSettings, setChatSettings] = useState({
        allowStudentChat: true,
        allowPrivateMessages: true,
        allowReactions: true,
        moderateMessages: false,
        saveHistory: true
    });

    const [mutedUsers, setMutedUsers] = useState(new Set());

    const currentUser = {
        id: "teacher",
        name: "المعلّم أحمد",
        avatarUrl: ""
    };

    const participants = {
        teacher: { name: "المعلّم أحمد", avatarUrl: "" },
        student1: { name: "سارة محمد", avatarUrl: "" },
        student2: { name: "علي حسن", avatarUrl: "" },
        student3: { name: "فاطمة علي", avatarUrl: "" }
    };

    const handleSendMessage = (message) => {
        setMessages(prev => [...prev, message]);
    };

    const handleReactToMessage = (messageId, emoji) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const reactions = { ...msg.reactions };
                reactions[emoji] = (reactions[emoji] || 0) + 1;
                return { ...msg, reactions };
            }
            return msg;
        }));
    };

    const handleUpdateSettings = (newSettings) => {
        setChatSettings(prev => ({ ...prev, ...newSettings }));
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    const handleMuteUser = (userId) => {
        setMutedUsers(prev => new Set([...prev, userId]));
    };

    const handleUnmuteUser = (userId) => {
        setMutedUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        عرض توضيحي للمحادثة المباشرة
                    </h1>
                    <p className="text-gray-600 mb-4">
                        هذا عرض توضيحي لنظام المحادثة المباشرة المدمج مع Ant Media Server.
                        انقر على زر المحادثة لفتح النافذة.
                    </p>
                    
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => setIsChatOpen(!isChatOpen)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                isChatOpen 
                                    ? 'bg-[#0e7490] text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {isChatOpen ? 'إغلاق المحادثة' : 'فتح المحادثة'}
                        </button>
                        
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {Object.keys(participants).length} مشارك
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">الميزات المتاحة:</h3>
                            <ul className="space-y-1 text-gray-600">
                                <li>✅ رسائل فورية عبر WebRTC</li>
                                <li>✅ تفاعلات مع الرسائل</li>
                                <li>✅ رسائل النظام</li>
                                <li>✅ إعدادات المعلّم</li>
                                <li>✅ كتم/إلغاء كتم المستخدمين</li>
                                <li>✅ رسائل خاصة</li>
                                <li>✅ حفظ تاريخ المحادثة</li>
                            </ul>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-900 mb-2">الإعدادات الحالية:</h3>
                            <ul className="space-y-1 text-gray-600">
                                <li>💬 محادثة الطلاب: {chatSettings.allowStudentChat ? 'مفعلة' : 'معطلة'}</li>
                                <li>🔒 الرسائل الخاصة: {chatSettings.allowPrivateMessages ? 'مفعلة' : 'معطلة'}</li>
                                <li>😊 التفاعلات: {chatSettings.allowReactions ? 'مفعلة' : 'معطلة'}</li>
                                <li>🛡️ مراجعة الرسائل: {chatSettings.moderateMessages ? 'مفعلة' : 'معطلة'}</li>
                                <li>💾 حفظ التاريخ: {chatSettings.saveHistory ? 'مفعل' : 'معطل'}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Live Chat Component */}
                <LiveChat
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onReactToMessage={handleReactToMessage}
                    currentUser={currentUser}
                    participants={participants}
                    isTeacher={true}
                    streamId="demo-stream"
                    chatSettings={chatSettings}
                    onUpdateChatSettings={handleUpdateSettings}
                    onClearChat={handleClearChat}
                    onMuteUser={handleMuteUser}
                    onUnmuteUser={handleUnmuteUser}
                    mutedUsers={mutedUsers}
                />
            </div>
        </div>
    );
};

export default ChatDemo;
