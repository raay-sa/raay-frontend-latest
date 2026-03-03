import React from 'react';
import Modal from '../../../components/Modals/Modal';

export default function OrderCompleteModal({ onStartLearning }) {
    return (
        <Modal>
            <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 flex items-center justify-center">
                    <img src="/images/success.png" alt="" />
                </div>
                <h2 className="text-2xl font-semibold">تم اكتمال الطلب بنجاح</h2>
                <button
                    onClick={onStartLearning}
                    className="px-6 py-2 bg-primary text-white rounded-lg"
                >
                    ابدأ رحلتك التعليمية الآن
                </button>
            </div>
        </Modal>
    );
}
