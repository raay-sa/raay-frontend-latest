// components/Modal.jsx
import React from 'react';

export default function Modal({ children }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
                {children}
            </div>
        </div>
    );
}