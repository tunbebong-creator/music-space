import React from "react";
import { Bell, X, Check, Calendar, MapPin, Users, Heart, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function NotificationCenter({ 
  isOpen, 
  onClose, 
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  user
}) {
  const [filter, setFilter] = React.useState("all"); // "all", "unread", "read"

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "unread") return !notification.read;
    if (filter === "read") return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    const icons = {
      space_approved: <CheckCircle className="w-5 h-5 text-green-600" />,
      space_rejected: <X className="w-5 h-5 text-red-600" />,
      event_created: <Calendar className="w-5 h-5 text-blue-600" />,
      event_reminder: <Calendar className="w-5 h-5 text-orange-600" />,
      booking_request: <Users className="w-5 h-5 text-purple-600" />,
      booking_confirmed: <CheckCircle className="w-5 h-5 text-green-600" />,
      booking_cancelled: <X className="w-5 h-5 text-red-600" />,
      new_follower: <Heart className="w-5 h-5 text-pink-600" />,
      artist_request: <Users className="w-5 h-5 text-indigo-600" />,
      system_alert: <AlertCircle className="w-5 h-5 text-yellow-600" />
    };
    return icons[type] || <Bell className="w-5 h-5 text-gray-600" />;
  };

  const getNotificationTitle = (type) => {
    const titles = {
      space_approved: "Không gian đã được duyệt",
      space_rejected: "Không gian bị từ chối",
      event_created: "Sự kiện mới",
      event_reminder: "Nhắc nhở sự kiện",
      booking_request: "Yêu cầu đặt chỗ mới",
      booking_confirmed: "Đặt chỗ đã được xác nhận",
      booking_cancelled: "Đặt chỗ bị hủy",
      new_follower: "Người theo dõi mới",
      artist_request: "Yêu cầu biểu diễn",
      system_alert: "Thông báo hệ thống"
    };
    return titles[type] || "Thông báo";
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Thông báo</h2>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600">{unreadCount} chưa đọc</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mt-4">
              {[
                { value: "all", label: "Tất cả" },
                { value: "unread", label: "Chưa đọc" },
                { value: "read", label: "Đã đọc" }
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filter === tab.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="mt-3 w-full px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {filter === "all" ? "Chưa có thông báo nào" : 
                   filter === "unread" ? "Không có thông báo chưa đọc" : 
                   "Không có thông báo đã đọc"}
                </h3>
                <p className="text-gray-600">
                  {filter === "all" ? "Chúng tôi sẽ thông báo khi có hoạt động mới" : 
                   "Tất cả thông báo đã được đọc"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-semibold ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {getNotificationTitle(notification.type)}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </span>
                          {notification.action_url && (
                            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                              Xem chi tiết
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}































