import React, { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

const StudentActionDropdown = ({ student, onActionSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate dropdown position
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  const handleButtonClick = () => {
    updatePosition();
    setIsOpen(!isOpen);
  };

  const handleActionClick = (actionType) => {
    setIsOpen(false);
    onActionSelect(actionType, student);
  };

  const actions = [
    { type: 'warning', label: 'تحذير', icon: '⚠️' },
    { type: 'alert', label: 'تنبيه', icon: '🔔' },
    { type: 'ban', label: 'استبعاد', icon: '🚫' }
  ];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="الإجراءات"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          <div className="py-1">
            {actions.map((action) => {
              const isDisabled = action.type === 'ban' && !student.has_warning_before;
              
              return (
                <button
                  key={action.type}
                  onClick={() => !isDisabled && handleActionClick(action.type)}
                  disabled={isDisabled}
                  className={`w-full text-right px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    isDisabled 
                      ? 'text-gray-400 cursor-not-allowed opacity-50' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default StudentActionDropdown;
