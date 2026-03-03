import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const StudentActionModal = ({ isOpen, onClose, onConfirm, actionType, student }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const actionLabels = {
    warning: 'تحذير',
    alert: 'تنبيه',
    ban: 'استبعاد'
  };

  const actionColors = {
    warning: 'text-yellow-600',
    alert: 'text-blue-600',
    ban: 'text-red-600'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      await onConfirm(actionType, message.trim(), student);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error submitting action:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {actionLabels[actionType]} - {student?.name}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رسالة {actionLabels[actionType]}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`أدخل رسالة ${actionLabels[actionType]}...`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className={`px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                actionColors[actionType]
              }`}
            >
              {loading ? 'جاري الإرسال...' : `إرسال ${actionLabels[actionType]}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentActionModal;
