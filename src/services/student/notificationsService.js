import http from "../http";

const NotificationsService = {
  // Get student notifications
  getNotifications: () => http.get("/student/notifications"),
  
  // Mark notifications as read
  markAsRead: (notificationIds) => http.post("/student/notifications/mark_read", {
    notifications_id: notificationIds
  }),
};

export default NotificationsService;
