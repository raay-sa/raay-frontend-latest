import React from 'react';
import Modal from '../../../../components/Modals/Modal';
import { Link } from 'react-router-dom';

export default function AssignmentFinishModal({ score, onClose, onReview }) {
    return (
        <Modal>
            <div className="text-center space-y-4">
                <img src="/images/success.png" className="w-1/2 mx-auto" alt="success" />
                <h2 className="text-xl font-semibold">أحسنت! لقد اجتزت الاختبار بنسبة {score}%</h2>

                <div className="flex justify-center gap-4">
                    <Link to="/student/courses" className="px-4 py-2 bg-primary text-white rounded-lg">
                        العودة إلى البرنامج
                    </Link>z

                    <button
                        type="button"
                        className="px-4 py-2 bg-secondary text-white rounded-lg"
                        onClick={onReview ?? onClose}
                    >
                        عرض الإجابات
                    </button>
                </div>
            </div>
        </Modal>
    );
}
