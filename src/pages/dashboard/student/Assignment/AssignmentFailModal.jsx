import React from 'react';
import Modal from '../../../../components/Modals/Modal';

export default function AssignmentFailModal({ score, onClose, onReview, onRetry }) {
    return (
        <Modal>
            <div className="text-center space-y-4">
                <img src="/images/fail.png" className="w-1/2 mx-auto" alt="fail" />
                <h2 className="text-xl font-semibold">
                    للأسف لم تحقق النسبة المطلوبة<br />لقد حصلت على نسبة {score}%
                </h2>

                <div className="flex justify-center gap-4">
                    <button
                        type="button"
                        onClick={onRetry ?? onClose}
                        className="px-4 py-2 bg-primary text-white rounded-lg"
                    >
                        إعادة المحاولة
                    </button>

                    <button
                        type="button"
                        onClick={onReview ?? onClose}
                        className="px-4 py-2 bg-secondary text-white rounded-lg"
                    >
                        عرض الإجابات
                    </button>
                </div>
            </div>
        </Modal>
    );
}
