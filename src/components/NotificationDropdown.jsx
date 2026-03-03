import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import NotificationsService from '../services/student/notificationsService';
import toast from 'react-hot-toast';

const NotificationDropdown = ({ isStudent = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

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

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, append = false) => {
    if (!isStudent) return;
    
    setLoading(true);
    try {
      // Use student API for both student and trainee users
      const response = await NotificationsService.getNotifications();
      const data = response.data?.data || [];
      
      // Show only first 5 notifications initially
      const initialData = data.slice(0, 5);
      const hasMoreData = data.length > 5;
      
      if (append) {
        setNotifications(prev => [...prev, ...data.slice(5)]);
      } else {
        setNotifications(initialData);
      }
      
      setHasMore(hasMoreData);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('تعذر تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  // Load more notifications
  const loadMore = () => {
    fetchNotifications(page + 1, true);
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds) => {
    try {
      await NotificationsService.markAsRead(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, is_read: 1 }
            : notif
        )
      );
      
      toast.success('تم تمييز الإشعارات كمقروءة');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('تعذر تمييز الإشعارات كمقروءة');
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(notif => !notif.is_read)
      .map(notif => notif.id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  // Handle dropdown toggle
  const handleToggle = () => {
    if (!isOpen && notifications.length === 0) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  // Get notification type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'alert':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'offer':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  // Get notification type label
  const getTypeLabel = (type) => {
    switch (type) {
      case 'alert':
        return 'تنبيه';
      case 'warning':
        return 'تحذير';
      case 'offer':
        return 'عرض';
      default:
        return 'إشعار';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'الآن';
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `منذ ${diffInDays} يوم`;
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  if (!isStudent) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="الإشعارات"
      >
        <BellIcon className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="fixed top-16 left-4 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">الإشعارات</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  تمييز الكل كمقروء
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                لا توجد إشعارات
              </div>
            ) : (
              <>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                      !notif.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notif.notification.type)}`}>
                        {getTypeLabel(notif.notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {notif.notification.title}
                        </h4>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {notif.notification.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notif.notification.created_at)}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => markAsRead([notif.id])}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          تمييز كمقروء
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="p-4 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationDropdown;
