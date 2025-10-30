import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bell,
  Settings,
  LogOut,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Activity,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import ChatPanel from '@/components/ChatPanel';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Load user data
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch spaces
  const { data: spaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ['partner-spaces'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/spaces');
      if (!response.ok) throw new Error('Failed to fetch spaces');
      const data = await response.json();
      return data.spaces || [];
    }
  });

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['partner-events'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3001/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      return data.events || [];
    }
  });

  // Fetch notifications
  const { data: notificationsData = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      if (!token) return [];
      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch unread message count
  const { data: unreadCountData } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      if (!token) return { unread_count: 0 };
      const response = await fetch('http://localhost:3001/api/messages/unread-count', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return { unread_count: 0 };
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Filter user's own spaces and events
  const mySpaces = spaces.filter(space => space.owner_id === user?.id);
  const myEvents = events.filter(event => event.organizer_id === user?.id);

  // Stats
  const stats = {
    totalSpaces: mySpaces.length,
    totalEvents: myEvents.length,
    pendingSpaces: mySpaces.filter(s => s.status === 'pending').length,
    pendingEvents: myEvents.filter(e => e.status === 'pending').length,
    approvedSpaces: mySpaces.filter(s => s.status === 'approved').length,
    approvedEvents: myEvents.filter(e => e.status === 'approved').length,
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user_data');
    navigate('/You');
  };

  const markNotificationRead = async (id) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      queryClient.invalidateQueries(['notifications']);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (!user || user.role !== 'partner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600 mb-6">Chỉ có đối tác mới có thể truy cập trang này.</p>
          <button
            onClick={() => navigate('/You')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/You')}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard Đối tác</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Chat Button */}
              <button
                onClick={() => setShowChat(true)}
                className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors"
                title="Chat với Artists"
              >
                <MessageSquare className="w-6 h-6" />
                {unreadCountData?.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCountData.unread_count}
                  </span>
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {notificationsData.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notificationsData.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800">Thông báo</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificationsData.length === 0 ? (
                        <div className="p-4 text-gray-500 text-center">Không có thông báo</div>
                      ) : (
                        notificationsData.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => markNotificationRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.read ? 'bg-gray-300' : 'bg-blue-500'
                              }`} />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800 text-sm">{notification.title}</h4>
                                <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
                                <p className="text-gray-400 text-xs mt-1">
                                  {new Date(notification.created_at).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Chào mừng, {user.full_name || user.email}!</h2>
          <p className="text-blue-100">Quản lý không gian và sự kiện của bạn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalSpaces}</p>
                <p className="text-gray-600 text-sm">Tổng không gian</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalEvents}</p>
                <p className="text-gray-600 text-sm">Tổng sự kiện</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.pendingSpaces + stats.pendingEvents}</p>
                <p className="text-gray-600 text-sm">Chờ duyệt</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.approvedSpaces + stats.approvedEvents}</p>
                <p className="text-gray-600 text-sm">Đã duyệt</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quản lý không gian</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/AddSpace')}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Thêm không gian mới
              </button>
              <button
                onClick={() => navigate('/PartnerSpaces')}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Eye className="w-5 h-5" />
                Xem không gian của tôi
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quản lý sự kiện</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/AddEvent')}
                className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Thêm sự kiện mới
              </button>
              <button
                onClick={() => navigate('/PartnerEvents')}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Eye className="w-5 h-5" />
                Xem sự kiện của tôi
              </button>
            </div>
          </motion.div>
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Spaces */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Không gian gần đây</h3>
              <span className="text-sm text-gray-500">{mySpaces.length} mục</span>
            </div>
            <div className="space-y-3">
              {mySpaces.slice(0, 3).map((space) => (
                <div key={space.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{space.name}</h4>
                    <p className="text-sm text-gray-600">{space.address}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    space.status === 'approved' ? 'bg-green-100 text-green-700' :
                    space.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {space.status === 'approved' ? 'Đã duyệt' :
                     space.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                  </div>
                </div>
              ))}
              {mySpaces.length === 0 && (
                <p className="text-gray-500 text-center py-4">Chưa có không gian nào</p>
              )}
            </div>
          </motion.div>

          {/* Recent Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Sự kiện gần đây</h3>
              <span className="text-sm text-gray-500">{myEvents.length} mục</span>
            </div>
            <div className="space-y-3">
              {myEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{event.title}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(event.event_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    event.status === 'approved' ? 'bg-green-100 text-green-700' :
                    event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {event.status === 'approved' ? 'Đã duyệt' :
                     event.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                  </div>
                </div>
              ))}
              {myEvents.length === 0 && (
                <p className="text-gray-500 text-center py-4">Chưa có sự kiện nào</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && user && (
        <ChatPanel user={user} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
}
