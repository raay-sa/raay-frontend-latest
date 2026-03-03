import React, { useState, useEffect } from "react";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

const ChatNotification = ({ 
    message, 
    isVisible, 
    onClose, 
    onClick,
    duration = 5000 
}) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setTimeout(onClose, 300); // Wait for animation to complete
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div 
            className={`fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm z-50 cursor-pointer transform transition-all duration-300 ${
                isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
            onClick={onClick}
            dir="rtl"
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#0e7490] rounded-full flex items-center justify-center">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                            {message.senderName}
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {message.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        رسالة جديدة في المحادثة
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatNotification;
