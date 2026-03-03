// src/components/BackButton.jsx
import React from 'react';

export default function BackButton({ to }) {
    const commonClass =
        "inline-flex items-center bg-primary rounded-lg py-2 px-4 text-white hover:transform hover:scale-105 transition duration-300 ease-in-out";

    const handleClick = (e) => {
        if (!to) {
            e.preventDefault();

            try { window.history.back(); } catch { }
            return;
        }
    };

    return to ? (
        <a href={to} onClick={handleClick} className={commonClass}>
            <span className="ms-2">العودة إلى البرنامج</span>
        </a>
    ) : (
        <a href="#" onClick={handleClick} className={commonClass}>
            <span className="ms-2">العودة</span>test categorytest category
        </a>
    );
}

