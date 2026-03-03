import React from 'react';
import Modal from './Modal';

export default function DeleteProgramModal({ open, onClose, onConfirm }) {
    if (!open) return null;
    return (
        <Modal>
            <h3 className="text-base lg:text-lg font-bold mb-3 text-center">
                هل أنت متأكد من حذف هذا البرنامج بشكل دائم؟
            </h3>
            <p className="text-xs lg:text-sm text-gray-600 text-center mb-6">
                سيتم إزالة البرنامج نهائيًا ولن تتمكن من استعادته لاحقًا.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 lg:gap-4">
                <button
                    onClick={onClose}
                    className="px-6 lg:px-8 py-2 border border-gray-300 rounded-lg text-sm lg:text-base"
                >
                    إلغاء
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className="px-6 lg:px-8 py-2 bg-red-600 text-white rounded-lg text-sm lg:text-base"
                >
                    نعم، حذف نهائي
                </button>
            </div>
        </Modal>
    );
}
