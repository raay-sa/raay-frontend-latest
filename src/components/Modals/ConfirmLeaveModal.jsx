import React from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ConfirmLeaveModal({ open, onClose, onConfirm, title, message, confirmText = "نعم، مغادرة", cancelText = "إلغاء", isWarning = true }) {
    if (!open) return null;
    
    return (
        <Modal>
            <div className="text-center">
                {/* Icon */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                
                {/* Title */}
                <h3 className="text-base lg:text-lg font-bold mb-3 text-gray-900">
                    {title}
                </h3>
                
                {/* Message */}
                {message && (
                    <p className="text-xs lg:text-sm text-gray-600 mb-6">
                        {message}
                    </p>
                )}
                
                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 lg:gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 lg:px-8 py-2 border border-gray-300 rounded-lg text-sm lg:text-base hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-6 lg:px-8 py-2 ${isWarning ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'} text-white rounded-lg text-sm lg:text-base transition-colors`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

