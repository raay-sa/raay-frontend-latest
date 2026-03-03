import React, { useState } from "react";
import {
    Cog6ToothIcon,
    XMarkIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    ClockIcon,
    TrashIcon
} from "@heroicons/react/24/outline";

const ChatSettings = ({ 
    isOpen, 
    onClose, 
    settings, 
    onUpdateSettings, 
    onClearChat,
    participants = {},
    onMuteUser,
    onUnmuteUser,
    mutedUsers = new Set()
}) => {
    const [localSettings, setLocalSettings] = useState(settings);

    const handleSave = () => {
        onUpdateSettings(localSettings);
        onClose();
    };

    const handleSettingChange = (key, value) => {
        setLocalSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-[#0e7490] text-white p-4 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Cog6ToothIcon className="w-5 h-5" />
                        <span className="font-medium">إعدادات المحادثة</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* General Settings */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            الإعدادات العامة
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">السماح للطلاب بالكتابة</span>
                                <input
                                    type="checkbox"
                                    checked={localSettings.allowStudentChat}
                                    onChange={(e) => handleSettingChange('allowStudentChat', e.target.checked)}
                                    className="w-4 h-4 text-[#0e7490] bg-gray-100 border-gray-300 rounded focus:ring-[#0e7490] focus:ring-2"
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">السماح بالرسائل الخاصة</span>
                                <input
                                    type="checkbox"
                                    checked={localSettings.allowPrivateMessages}
                                    onChange={(e) => handleSettingChange('allowPrivateMessages', e.target.checked)}
                                    className="w-4 h-4 text-[#0e7490] bg-gray-100 border-gray-300 rounded focus:ring-[#0e7490] focus:ring-2"
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">السماح بالتفاعلات</span>
                                <input
                                    type="checkbox"
                                    checked={localSettings.allowReactions}
                                    onChange={(e) => handleSettingChange('allowReactions', e.target.checked)}
                                    className="w-4 h-4 text-[#0e7490] bg-gray-100 border-gray-300 rounded focus:ring-[#0e7490] focus:ring-2"
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">مراجعة الرسائل قبل النشر</span>
                                <input
                                    type="checkbox"
                                    checked={localSettings.moderateMessages}
                                    onChange={(e) => handleSettingChange('moderateMessages', e.target.checked)}
                                    className="w-4 h-4 text-[#0e7490] bg-gray-100 border-gray-300 rounded focus:ring-[#0e7490] focus:ring-2"
                                />
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">حفظ تاريخ المحادثة</span>
                                <input
                                    type="checkbox"
                                    checked={localSettings.saveHistory}
                                    onChange={(e) => handleSettingChange('saveHistory', e.target.checked)}
                                    className="w-4 h-4 text-[#0e7490] bg-gray-100 border-gray-300 rounded focus:ring-[#0e7490] focus:ring-2"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Participants Management */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <UserGroupIcon className="w-5 h-5" />
                            إدارة المشاركين
                        </h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {Object.entries(participants).map(([id, profile]) => {
                                const isMuted = mutedUsers.has(id);
                                return (
                                    <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-[#0e7490] rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                {profile.name?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm text-gray-700">{profile.name || 'مشترك'}</span>
                                            {isMuted && (
                                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                                    مكتوم
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {isMuted ? (
                                                <button
                                                    onClick={() => onUnmuteUser(id)}
                                                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                                >
                                                    إلغاء كتم
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onMuteUser(id)}
                                                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                                >
                                                    كتم
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Moderation Actions */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5" />
                            إجراءات الإشراف
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    if (window.confirm('هل أنت متأكد من مسح جميع الرسائل؟')) {
                                        onClearChat();
                                    }
                                }}
                                className="w-full flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <TrashIcon className="w-5 h-5" />
                                مسح جميع الرسائل
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-[#0e7490] text-white rounded-lg hover:bg-[#0c5a6b] transition-colors"
                    >
                        حفظ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatSettings;
