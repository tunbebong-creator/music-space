import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Users, 
  FileText, 
  MapPin, 
  Calendar, 
  BarChart3, 
  Settings, 
  Shield, 
  Mail,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  UserPlus,
  Plus,
  TrendingUp,
  Activity,
  LogOut,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Clock,
  DollarSign,
  MessageSquare
} from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import { format } from "date-fns";
import { API_BASE_URL, getUploadUrl } from '@/config/api.js';

const API_BASE = API_BASE_URL.replace('/api', '');

export default function Admin() {
  const [user, setUser] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterRole, setFilterRole] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [showAddSpaceModal, setShowAddSpaceModal] = React.useState(false);
  const [showAddEventModal, setShowAddEventModal] = React.useState(false);
  const [editingSpace, setEditingSpace] = React.useState(null);
  const [editingEvent, setEditingEvent] = React.useState(null);
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [eventImages, setEventImages] = React.useState({
    cover: null,
    gallery: []
  });
  const [spaceImages, setSpaceImages] = React.useState([]);
  const [replyingToMessage, setReplyingToMessage] = React.useState(null);
  const [replyModalOpen, setReplyModalOpen] = React.useState(false);
  const [replyContent, setReplyContent] = React.useState('');
  const [showChat, setShowChat] = React.useState(false);
  const queryClient = useQueryClient();

  // Load user data
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if user is admin or partner first
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (!['admin', 'partner'].includes(parsedUser.role)) {
            console.log('❌ Access denied: User is not admin or partner, role:', parsedUser.role);
            setUser(null);
            setLoading(false);
            return;
          }
          setUser(parsedUser);
          setLoading(false);
          return;
        }
        
        // Always generate fresh admin token to avoid cache issues
        console.log('🔍 Debug - Generating fresh admin token...');
        
        const testUser = {
          id: 1,
          email: 'admin@musicspace.edu.vn',
          full_name: 'Admin User',
          role: 'admin'
        };
        console.log('🔍 Debug - Using test admin user:', testUser);
        setUser(testUser);
        
        // Generate a proper admin JWT token from server
        try {
          const response = await fetch(`${API_BASE}/api/generate-admin-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await response.json();
          console.log('🔍 Debug - Generated fresh admin token from server:', data);
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user_data', JSON.stringify(data.user));
        } catch (error) {
          console.error('❌ Error generating admin token:', error);
          // Fallback to manual token
          const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBtdXNpY3NwYWNlLmVkdS52biIsInJvbGUiOiJhZG1pbiIsImZ1bGxfbmFtZSI6IkFkbWluIFVzZXIiLCJpYXQiOjE3NjEyNDMyNjQsImV4cCI6MTc2MTMyOTY2NH0.8K9vQ2x3Yxa9vlrphPjhpOzxjypjfFiAuOJ7khMQ';
          localStorage.setItem('auth_token', adminToken);
        }
      } catch (error) {
        console.error('Admin - Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Refetch data when component becomes visible (user navigates back)
  // React.useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (!document.hidden && user && user.role === 'admin') {
  //       console.log('🔄 Admin page visible, refetching data...');
  //       try {
  //         if (activeTab === 'spaces' && refetchSpaces) {
  //           refetchSpaces();
  //         } else if (activeTab === 'events' && refetchEvents) {
  //           refetchEvents();
  //         } else if (activeTab === 'users' && refetchUsers) {
  //           refetchUsers();
  //         }
  //       } catch (error) {
  //         console.error('❌ Error refetching data:', error);
  //       }
  //     }
  //   };

  //   document.addEventListener('visibilitychange', handleVisibilityChange);
    
  //   // Also refetch when window gains focus
  //   window.addEventListener('focus', handleVisibilityChange);
    
  //   return () => {
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //     window.removeEventListener('focus', handleVisibilityChange);
  //   };
  // }, [activeTab, user]);

import { API_BASE_URL, getUploadUrl } from '@/config/api.js';

// ... existing code ...

  // API functions
  const fetchWithAuth = async (url, options = {}) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      console.log('🔍 Debug - Fetching URL:', url);
      console.log('🔍 Debug - Token:', token);
      
      const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });
      
      console.log('🔍 Debug - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Debug - Response error:', errorText);
        
        // Don't throw error for 404 or empty responses, return empty data instead
        if (response.status === 404) {
          return null;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('🔍 Debug - Fetch error:', error);
      // Return null or empty object instead of throwing to prevent white screen
      return null;
    }
  };

  // Upload image function
  const uploadImage = async (file, type = 'events') => {
    setUploadingImages(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Lỗi upload ảnh: ' + error.message);
      return null;
    } finally {
      setUploadingImages(false);
    }
  };

  // Handle space image upload
  const handleSpaceImageUpload = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const uploadPromises = Array.from(files).map(file => uploadImage(file, 'spaces'));
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(url => url !== null);
      if (validUrls.length > 0) {
        setSpaceImages(prev => [...prev, ...validUrls]);
      }
    }
  };

  // Queries
  const { data: dashboardData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetchWithAuth('/api/admin/stats'),
    enabled: !!user && user.role === 'admin',
    onSuccess: (data) => {
      console.log('✅ Admin stats fetched:', data);
      console.log('📊 Recent bookings:', data?.recentActivity?.bookings);
      if (data?.recentActivity?.bookings) {
        data.recentActivity.bookings.forEach((b, i) => {
          console.log(`📊 Booking ${i + 1}:`, {
            id: b.id,
            user_name: b.user_name,
            customer_name: b.customer_name,
            space_name: b.space_name,
            event_title: b.event_title
          });
        });
      }
    },
    onError: (error) => {
      console.error('❌ Error fetching admin stats:', error);
    },
  });

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', searchTerm, filterRole],
    queryFn: () => fetchWithAuth(`/api/admin/users?search=${searchTerm}&role=${filterRole}`),
    enabled: !!user && user.role === 'admin' && activeTab === 'users',
  });

  const { data: spacesData, isLoading: spacesLoading, refetch: refetchSpaces, error: spacesError } = useQuery({
    queryKey: ['admin-spaces', searchTerm, filterStatus],
    queryFn: () => {
      console.log('🔍 Debug - Fetching admin spaces...');
      return fetchWithAuth(`/api/admin/spaces?search=${searchTerm}&status=${filterStatus}`);
    },
    enabled: !!user && user.role === 'admin' && activeTab === 'spaces',
    retry: 1,
    onSuccess: (data) => {
      console.log('✅ Debug - Spaces fetched successfully:', data);
      console.log('🔍 Debug - Spaces array:', data?.spaces);
      console.log('🔍 Debug - Spaces count:', data?.spaces?.length);
    },
    onError: (error) => {
      console.error('❌ Spaces query error:', error);
    }
  });

  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['admin-events', searchTerm, filterStatus],
    queryFn: () => {
      let url = `/api/admin/events?search=${searchTerm}`;
      if (filterStatus && filterStatus !== "") {
        url += `&status=${filterStatus}`;
      }
      return fetchWithAuth(url);
    },
    enabled: !!user && ['admin', 'partner'].includes(user.role) && activeTab === 'events',
  });

  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['admin-bookings', filterStatus],
    queryFn: () => fetchWithAuth(`/api/admin/bookings?status=${filterStatus}`),
    enabled: !!user && user.role === 'admin' && activeTab === 'bookings',
  });

  const { data: contactData, isLoading: contactLoading, refetch: refetchContact } = useQuery({
    queryKey: ['admin-contact'],
    queryFn: () => {
      console.log('🔍 Fetching contact messages...');
      return fetchWithAuth('/api/admin/contact-messages');
    },
    enabled: !!user && user.role === 'admin' && activeTab === 'contact',
    onSuccess: (data) => {
      console.log('✅ Contact messages fetched:', data);
      console.log('📧 Messages count:', data?.messages?.length);
      console.log('📧 Full response:', JSON.stringify(data, null, 2));
      if (data?.messages && data.messages.length > 0) {
        console.log('📧 First message:', data.messages[0]);
      }
    },
    onError: (error) => {
      console.error('❌ Error fetching contact messages:', error);
    }
  });

  // Fetch unread message count
  const { data: unreadCountData } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: () => fetchWithAuth('/api/messages/unread-count'),
    enabled: !!user && ['admin', 'partner'].includes(user.role),
    refetchInterval: 5000, // Poll every 5 seconds
    retry: 1,
    onError: (error) => {
      console.error('Error fetching unread count:', error);
    },
  });

  // Fetch event registrations (artists đăng ký event)
  const { data: registrationsData, isLoading: registrationsLoading, refetch: refetchRegistrations } = useQuery({
    queryKey: ['admin-event-registrations', user?.id],
    queryFn: () => {
      console.log('🔍 Fetching event registrations...');
      return fetchWithAuth('/api/admin/event-registrations');
    },
    enabled: !!user && ['admin', 'partner'].includes(user.role) && activeTab === 'registrations',
    retry: 1,
    onSuccess: (data) => {
      console.log('✅ Event registrations fetched:', data);
      console.log('📋 Registrations count:', data?.registrations?.length);
    },
    onError: (error) => {
      console.error('❌ Error fetching event registrations:', error);
    },
  });

  const { data: newsletterData, isLoading: newsletterLoading, refetch: refetchNewsletter } = useQuery({
    queryKey: ['admin-newsletters'],
    queryFn: () => fetchWithAuth('/api/admin/newsletters'),
    enabled: !!user && user.role === 'admin' && activeTab === 'newsletters',
  });

  // Mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => fetchWithAuth(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-stats']);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => fetchWithAuth(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-stats']);
    },
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }) => fetchWithAuth(`/api/admin/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-bookings']);
      queryClient.invalidateQueries(['admin-stats']);
    },
  });

  // Approve registration mutation
  const approveRegistrationMutation = useMutation({
    mutationFn: ({ registrationId }) => fetchWithAuth(`/api/admin/event-registrations/${registrationId}/approve`, {
      method: 'PUT',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-event-registrations']);
      alert('Đã duyệt đăng ký thành công!');
    },
    onError: (error) => {
      alert('Lỗi duyệt đăng ký: ' + error.message);
    },
  });

  // Reject registration mutation
  const rejectRegistrationMutation = useMutation({
    mutationFn: ({ registrationId }) => fetchWithAuth(`/api/admin/event-registrations/${registrationId}/reject`, {
      method: 'PUT',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-event-registrations']);
      alert('Đã từ chối đăng ký!');
    },
    onError: (error) => {
      alert('Lỗi từ chối đăng ký: ' + error.message);
    },
  });

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin or partner
  if (!user || !['admin', 'partner'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Truy cập bị từ chối</h1>
          <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
          <p className="text-sm text-gray-500 mt-2">User: {user ? user.email : 'No user'}</p>
          <p className="text-sm text-gray-500">Role: {user?.role || 'No role'}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Quản lý Users", icon: Users },
    { id: "spaces", label: "Quản lý Spaces", icon: MapPin },
    { id: "events", label: "Quản lý Events", icon: Calendar },
    { id: "bookings", label: "Quản lý Bookings", icon: Calendar },
    { id: "registrations", label: "Đăng ký của Artists", icon: UserPlus },
    { id: "contact", label: "Tin nhắn liên hệ", icon: Mail },
    { id: "newsletters", label: "Newsletter", icon: FileText },
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/';
  };

  // Space handlers
  const handleEditSpace = (space) => {
    window.location.href = `/EditSpace/${space.id}`;
  };

  const handleDeleteSpace = async (spaceId) => {
    if (window.confirm('Bạn có chắc muốn xóa space này?')) {
      try {
        await fetchWithAuth(`/api/admin/spaces/${spaceId}`, {
          method: 'DELETE',
        });
        refetchSpaces();
      } catch (error) {
        console.error('Error deleting space:', error);
      }
    }
  };

  // Event handlers
  const handleEditEvent = (event) => {
    window.location.href = `/EditEvent/${event.id}`;
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Bạn có chắc muốn xóa event này?')) {
      try {
        await fetchWithAuth(`/api/admin/events/${eventId}`, {
          method: 'DELETE',
        });
        refetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleApproveEvent = async (eventId) => {
    if (window.confirm('Bạn có chắc chắn muốn duyệt sự kiện này?')) {
      try {
        await fetchWithAuth(`/api/admin/events/${eventId}/approve`, {
          method: 'PUT'
        });
        refetchEvents();
        alert('Sự kiện đã được duyệt thành công!');
      } catch (error) {
        console.error('Error approving event:', error);
        alert('Có lỗi xảy ra khi duyệt sự kiện');
      }
    }
  };

  const handleRejectEvent = async (eventId) => {
    if (window.confirm('Bạn có chắc chắn muốn từ chối sự kiện này?')) {
      try {
        await fetchWithAuth(`/api/admin/events/${eventId}/reject`, {
          method: 'PUT'
        });
        refetchEvents();
        alert('Sự kiện đã bị từ chối!');
      } catch (error) {
        console.error('Error rejecting event:', error);
        alert('Có lỗi xảy ra khi từ chối sự kiện');
      }
    }
  };

  const handleReplyMessage = (message) => {
    setReplyingToMessage(message);
    setReplyContent('');
    setReplyModalOpen(true);
  };

  const sendReply = async () => {
    if (!replyContent.trim()) {
      alert('Vui lòng nhập nội dung trả lời');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/integrations/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          to: replyingToMessage.email,
          subject: `Re: ${replyingToMessage.subject || 'Tin nhắn liên hệ'}`,
          from_name: 'Music Space Admin',
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1E88E5;">Phản hồi từ Music Space</h2>
              <p>Xin chào <strong>${replyingToMessage.name}</strong>,</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tin nhắn gốc của bạn:</strong></p>
                <p>${replyingToMessage.message}</p>
              </div>
              <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1E88E5;">
                <p><strong>Phản hồi của chúng tôi:</strong></p>
                <p>${replyContent.replace(/\n/g, '<br>')}</p>
              </div>
              <p style="color: #666;">Trân trọng,<br>Đội ngũ Music Space</p>
            </div>
          `
        })
      });

      if (!response.ok) throw new Error('Failed to send email');
      
      alert('Đã gửi phản hồi thành công!');
      setReplyModalOpen(false);
      setReplyingToMessage(null);
      setReplyContent('');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Có lỗi xảy ra khi gửi phản hồi: ' + error.message);
    }
  };

  const getContactTypeLabel = (type) => {
    const typeMap = {
      'general': 'Câu hỏi chung',
      'space_owner': 'Đăng ký Space Owner',
      'artist': 'Đăng ký Artist',
      'partnership': 'Hợp tác',
      'press': 'Báo chí'
    };
    return typeMap[type] || type || 'Không xác định';
  };

  const handleApproveRegistration = (registrationId, artistId) => {
    if (window.confirm('Bạn có chắc chắn muốn duyệt đăng ký này?')) {
      approveRegistrationMutation.mutate({ registrationId });
    }
  };

  const handleRejectRegistration = (registrationId, artistId) => {
    if (window.confirm('Bạn có chắc chắn muốn từ chối đăng ký này?')) {
      rejectRegistrationMutation.mutate({ registrationId });
    }
  };

  const handleChatWithArtist = (artistId) => {
    setShowChat(true);
    // TODO: Auto-select conversation with this artist
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">Quản lý hệ thống Music Space</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Chat Button */}
              <button
                onClick={() => setShowChat(true)}
                className="relative p-2 text-white/90 hover:text-white transition-colors"
                title="Chat với Artists"
              >
                <MessageSquare className="w-6 h-6" />
                {unreadCountData?.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCountData.unread_count}
                  </span>
                )}
              </button>

              {/* Pending events counter */}
              {eventsData && Array.isArray(eventsData) && (
                <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{eventsData.filter(e => e.status === 'pending').length} sự kiện chờ duyệt</span>
                </div>
              )}
              <div className="text-right">
                <p className="font-medium">{user?.full_name || 'Admin'}</p>
                <p className="text-sm text-blue-100">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <nav className="flex space-x-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tổng Users</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats?.totalUsers || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tổng Spaces</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats?.totalSpaces || 0}</p>
                    </div>
                    <MapPin className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tổng Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats?.totalBookings || 0}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tin nhắn liên hệ</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData?.stats?.totalContactMessages || 0}</p>
                    </div>
                    <Mail className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Users */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Users mới nhất</h3>
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {dashboardData?.recentActivity?.users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'partner' ? 'bg-green-100 text-green-800' :
                        user.role === 'artist' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  )) || <p className="text-gray-500">Không có dữ liệu</p>}
                </div>
              </div>

              {/* Recent Spaces */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Spaces mới nhất</h3>
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {dashboardData?.recentActivity?.spaces?.map((space) => (
                    <div key={space.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{space.name}</p>
                        <p className="text-sm text-gray-500">{space.location}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(space.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  )) || <p className="text-gray-500">Không có dữ liệu</p>}
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Bookings mới nhất</h3>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {dashboardData?.recentActivity?.bookings && dashboardData.recentActivity.bookings.length > 0 ? (
                    dashboardData.recentActivity.bookings.map((booking) => {
                      console.log('📋 Rendering booking:', booking);
                      const userName = booking.user_name || booking.customer_name || booking.user_email || booking.customer_email || 'N/A';
                      const bookingName = booking.space_name || booking.event_title || booking.booking_name || 'N/A';
                      return (
                        <div key={booking.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{bookingName}</p>
                            <p className="text-sm text-gray-500">{userName}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status || 'pending'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500">Không có dữ liệu</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Management Tab */}
        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả roles</option>
                  <option value="customer">Customer</option>
                  <option value="partner">Partner</option>
                  <option value="artist">Artist</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => refetchUsers()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {usersLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Đang tải...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersData?.users?.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                  {user.full_name?.charAt(0) || user.email.charAt(0)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRoleMutation.mutate({ userId: user.id, role: e.target.value })}
                              className={`px-2 py-1 text-xs rounded-full border-0 ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'partner' ? 'bg-green-100 text-green-800' :
                                user.role === 'artist' ? 'bg-pink-100 text-pink-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <option value="customer">Customer</option>
                              <option value="partner">Partner</option>
                              <option value="artist">Artist</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                            Không có dữ liệu
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Spaces Management Tab */}
        {activeTab === "spaces" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header with Add Button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Quản lý Spaces</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => refetchSpaces()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => window.location.href = '/AddSpace'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Thêm Space
                  </button>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Tìm kiếm spaces..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() => refetchSpaces()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Spaces Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {spacesLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Đang tải...</p>
                </div>
              ) : spacesError ? (
                <div className="p-8 text-center">
                  <div className="text-red-500 mb-2">❌ Lỗi tải dữ liệu</div>
                  <p className="text-gray-600 mb-4">{spacesError.message}</p>
                  <button
                    onClick={() => refetchSpaces()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sức chứa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá/giờ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chủ sở hữu</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(spacesData?.spaces) ? spacesData.spaces.map((space) => (
                        <tr key={space.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{space.name}</div>
                              <div className="text-sm text-gray-500">{space.description?.substring(0, 50)}...</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.address}, {space.city}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.capacity} người
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.price_per_hour ? `$${space.price_per_hour}` : 'Miễn phí'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.owner_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              space.status === 'approved' ? 'bg-green-100 text-green-800' :
                              space.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {space.status === 'approved' ? 'Đã duyệt' :
                               space.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditSpace(space)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSpace(space.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            {spacesLoading ? 'Đang tải...' : 'Không có spaces nào'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Events Management Tab */}
        {activeTab === "events" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header with Add Button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Quản lý Events</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.href = '/AdminEventManager'}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Event Manager
                  </button>
                  <button
                    onClick={() => window.location.href = '/AddEvent'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Thêm Event
                  </button>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Tìm kiếm events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() => refetchEvents()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Events Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {eventsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Đang tải...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người tổ chức</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(eventsData) ? eventsData.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{event.title}</div>
                              <div className="text-sm text-gray-500">{event.description?.substring(0, 50)}...</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(event.event_date).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event.duration_hours}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event.space_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event.organizer_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              event.status === 'approved' ? 'bg-green-100 text-green-800' :
                              event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {event.status === 'approved' ? 'Đã duyệt' :
                               event.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {/* Approval buttons - only show for pending events */}
                              {event.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveEvent(event.id)}
                                    className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded"
                                    title="Duyệt sự kiện"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectEvent(event.id)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                                    title="Từ chối sự kiện"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              
                              {/* Edit and Delete buttons */}
                              <button
                                onClick={() => handleEditEvent(event)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Chỉnh sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Không có events nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Bookings Management Tab */}
        {activeTab === "bookings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => refetchBookings()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {bookingsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Đang tải...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookingsData?.bookings?.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{booking.booking_name || booking.space_name || booking.event_title || 'N/A'}</div>
                              <div className="text-sm text-gray-500">ID: {booking.id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{booking.customer_name || booking.user_name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{booking.customer_email || booking.user_email || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.booking_date ? (
                              <div>
                                <div>{format(new Date(booking.booking_date), 'dd/MM/yyyy')}</div>
                                <div className="text-xs text-gray-400">{booking.start_time} - {booking.end_time}</div>
                              </div>
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={booking.status}
                              onChange={(e) => updateBookingStatusMutation.mutate({ bookingId: booking.id, status: e.target.value })}
                              className={`px-2 py-1 text-xs rounded-full border-0 ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            Không có dữ liệu
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Contact Messages Tab */}
        {activeTab === "contact" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {contactLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Đang tải...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người gửi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chủ đề</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tin nhắn</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày gửi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contactData?.messages && contactData.messages.length > 0 ? (
                        contactData.messages.map((message) => (
                          <tr key={message.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{message.name}</div>
                                <div className="text-sm text-gray-500">{message.email}</div>
                                {message.phone && (
                                  <div className="text-xs text-gray-400">{message.phone}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                message.type === 'space_owner' ? 'bg-green-100 text-green-800' :
                                message.type === 'artist' ? 'bg-purple-100 text-purple-800' :
                                message.type === 'partnership' ? 'bg-blue-100 text-blue-800' :
                                message.type === 'press' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {getContactTypeLabel(message.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {message.subject || 'Không có chủ đề'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {message.message}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleReplyMessage(message)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-900"
                              >
                                <Mail className="w-4 h-4" />
                                Trả lời
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                            {contactData ? 'Không có tin nhắn nào' : 'Đang tải dữ liệu...'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Event Registrations Tab */}
        {activeTab === "registrations" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {registrationsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Đang tải...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Năng khiếu</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đăng ký</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registrationsLoading ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                              Đang tải...
                            </div>
                          </td>
                        </tr>
                      ) : registrationsData?.registrations && registrationsData.registrations.length > 0 ? (
                        registrationsData.registrations.map((reg) => (
                          <tr key={reg.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{reg.event_title || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{reg.event_date ? new Date(reg.event_date).toLocaleDateString('vi-VN') : 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{reg.artist_name || reg.full_name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{reg.artist_email || reg.email || 'N/A'}</div>
                              {reg.phone && <div className="text-xs text-gray-500">📞 {reg.phone}</div>}
                            </td>
                            <td className="px-6 py-4">
                              {reg.bio && (
                                <p className="text-sm text-gray-600 max-w-xs truncate" title={reg.bio}>{reg.bio}</p>
                              )}
                              {reg.experience_years && (
                                <p className="text-xs text-gray-500">Kinh nghiệm: {reg.experience_years} năm</p>
                              )}
                              {reg.portfolio_url && (
                                <a href={reg.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                  Portfolio →
                                </a>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {reg.instruments && Array.isArray(reg.instruments) && reg.instruments.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {reg.instruments.map((inst, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                      {inst}
                                    </span>
                                  ))}
                                </div>
                              ) : reg.instruments && typeof reg.instruments === 'string' ? (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                  {reg.instruments}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">Chưa cập nhật</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reg.created_at ? format(new Date(reg.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                                reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {reg.status === 'approved' ? 'Đã duyệt' :
                                 reg.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                {reg.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveRegistration(reg.id, reg.artist_user_id || reg.artist_id)}
                                      className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded"
                                      title="Duyệt đăng ký"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectRegistration(reg.id, reg.artist_user_id || reg.artist_id)}
                                      className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded"
                                      title="Từ chối đăng ký"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleChatWithArtist(reg.artist_user_id || reg.artist_id)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
                                  title="Chat với Artist"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            {registrationsData === null ? 'Đang tải dữ liệu...' : 'Chưa có đăng ký nào'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Newsletter Tab */}
        {activeTab === "newsletters" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {newsletterLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Đang tải...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đăng ký</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {newsletterData?.subscribers?.map((subscriber) => (
                        <tr key={subscriber.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {subscriber.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subscriber.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(subscriber.created_at), 'dd/MM/yyyy HH:mm')}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                            Không có dữ liệu
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Add/Edit Space Modal - Simple Test */}
        {showAddSpaceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {editingSpace ? 'Chỉnh sửa Space' : 'Thêm Space mới'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddSpaceModal(false);
                    setEditingSpace(null);
                    setSpaceImages([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const spaceData = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  address: formData.get('address'),
                  city: formData.get('city'),
                  capacity: parseInt(formData.get('capacity')),
                  price_per_hour: parseFloat(formData.get('price_per_hour')) || 0,
                  amenities: formData.get('amenities').split(',').map(s => s.trim()).filter(s => s),
                  images: spaceImages,
                  owner_id: 1
                };

                try {
                  if (editingSpace) {
                    await fetchWithAuth(`/api/admin/spaces/${editingSpace.id}`, {
                      method: 'PUT',
                      body: JSON.stringify(spaceData)
                    });
                  } else {
                    await fetchWithAuth('/api/admin/spaces', {
                      method: 'POST',
                      body: JSON.stringify(spaceData)
                    });
                  }
                  refetchSpaces();
                  setShowAddSpaceModal(false);
                  setEditingSpace(null);
                  setSpaceImages([]);
                  alert('Space đã được lưu thành công!');
                } catch (error) {
                  console.error('Error saving space:', error);
                  alert('Có lỗi xảy ra khi lưu space: ' + error.message);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên Space</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingSpace?.name || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={editingSpace?.city || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                      name="description"
                      defaultValue={editingSpace?.description || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input
                      type="text"
                      name="address"
                      defaultValue={editingSpace?.address || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa</label>
                    <input
                      type="number"
                      name="capacity"
                      defaultValue={editingSpace?.capacity || ''}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá/giờ ($)</label>
                    <input
                      type="number"
                      name="price_per_hour"
                      defaultValue={editingSpace?.price_per_hour || ''}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiện nghi (cách nhau bằng dấu phẩy)</label>
                    <input
                      type="text"
                      name="amenities"
                      defaultValue={editingSpace?.amenities?.join(', ') || ''}
                      placeholder="microphone, speakers, recording equipment"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSpaceModal(false);
                      setEditingSpace(null);
                      setSpaceImages([]);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingSpace ? 'Cập nhật' : 'Thêm Space'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Event Modal - Enhanced */}
        {showAddEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold">
                  {editingEvent ? 'Chỉnh sửa Event' : 'Thêm Event mới'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddEventModal(false);
                    setEditingEvent(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const eventData = {
                  title: formData.get('title'),
                  description: formData.get('description'),
                  category: formData.get('category'),
                  tags: formData.get('tags').split(',').map(s => s.trim()).filter(s => s),
                  event_date: formData.get('event_date'),
                  start_time: formData.get('start_time'),
                  end_time: formData.get('end_time'),
                  duration_hours: parseInt(formData.get('duration_hours')),
                  max_participants: parseInt(formData.get('max_participants')),
                  min_participants: parseInt(formData.get('min_participants')) || 1,
                  price: parseFloat(formData.get('price')) || 0,
                  currency: formData.get('currency'),
                  early_bird_price: parseFloat(formData.get('early_bird_price')) || 0,
                  early_bird_until: formData.get('early_bird_until'),
                  venue_name: formData.get('venue_name'),
                  venue_address: formData.get('venue_address'),
                  venue_city: formData.get('venue_city'),
                  google_maps_url: formData.get('google_maps_url'),
                  event_type: formData.get('event_type'),
                  age_restriction: formData.get('age_restriction'),
                  language: formData.get('language'),
                  difficulty_level: formData.get('difficulty_level'),
                  organizer_name: formData.get('organizer_name'),
                  organizer_email: formData.get('organizer_email'),
                  organizer_phone: formData.get('organizer_phone'),
                  organizer_bio: formData.get('organizer_bio'),
                  requirements: formData.get('requirements'),
                  what_to_bring: formData.get('what_to_bring'),
                  video_url: formData.get('video_url'),
                  audio_preview: formData.get('audio_preview'),
                  cover_image: eventImages.cover,
                  gallery_images: eventImages.gallery,
                  space_id: parseInt(formData.get('space_id')) || null,
                  organizer_id: 1 // Default to admin for now
                };

                try {
                  console.log('🔍 Debug - Event data to save:', eventData);
                  
                  if (editingEvent) {
                    console.log('🔍 Debug - Updating event:', editingEvent.id);
                    const result = await fetchWithAuth(`/api/admin/events/${editingEvent.id}`, {
                      method: 'PUT',
                      body: JSON.stringify(eventData)
                    });
                    console.log('🔍 Debug - Update result:', result);
                  } else {
                    console.log('🔍 Debug - Creating new event');
                    const result = await fetchWithAuth('/api/admin/events', {
                      method: 'POST',
                      body: JSON.stringify(eventData)
                    });
                    console.log('🔍 Debug - Create result:', result);
                  }
                  
                  refetchEvents();
                  setShowAddEventModal(false);
                  setEditingEvent(null);
                  setEventImages({ cover: null, gallery: [] });
                  alert('Sự kiện đã được lưu thành công!');
                } catch (error) {
                  console.error('❌ Error saving event:', error);
                  console.error('❌ Error details:', error.message);
                  alert(`Có lỗi xảy ra khi lưu sự kiện: ${error.message}`);
                }
              }}>
                {/* Basic Info */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên Event *</label>
                      <input
                        type="text"
                        name="title"
                        defaultValue={editingEvent?.title || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ví dụ: Workshop Guitar Acoustic"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
                      <select
                        name="category"
                        defaultValue={editingEvent?.category || 'workshop'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="workshop">🎓 Workshop</option>
                        <option value="concert">🎵 Concert</option>
                        <option value="acoustic">🎸 Acoustic</option>
                        <option value="jazz">🎷 Jazz</option>
                        <option value="classical">🎼 Classical</option>
                        <option value="electronic">🎛️ Electronic</option>
                        <option value="folk">🪕 Folk</option>
                        <option value="rock">🎸 Rock</option>
                        <option value="pop">🎤 Pop</option>
                        <option value="talk">🎙️ Talkshow</option>
                        <option value="networking">🤝 Networking</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                      <textarea
                        name="description"
                        defaultValue={editingEvent?.description || ''}
                        rows={4}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Mô tả chi tiết về sự kiện..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags (cách nhau bằng dấu phẩy)</label>
                      <input
                        type="text"
                        name="tags"
                        defaultValue={editingEvent?.tags?.join(', ') || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="guitar, acoustic, workshop, beginner"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Thời gian & Địa điểm</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tổ chức *</label>
                      <input
                        type="date"
                        name="event_date"
                        defaultValue={editingEvent?.event_date ? new Date(editingEvent.event_date).toISOString().slice(0, 10) : ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (giờ)</label>
                      <input
                        type="number"
                        name="duration_hours"
                        defaultValue={editingEvent?.duration_hours || 2}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                      <input
                        type="time"
                        name="start_time"
                        defaultValue={editingEvent?.start_time || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                      <input
                        type="time"
                        name="end_time"
                        defaultValue={editingEvent?.end_time || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên địa điểm</label>
                      <input
                        type="text"
                        name="venue_name"
                        defaultValue={editingEvent?.venue_name || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tên địa điểm tổ chức"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                      <input
                        type="text"
                        name="venue_city"
                        defaultValue={editingEvent?.venue_city || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        name="venue_address"
                        defaultValue={editingEvent?.venue_address || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Địa chỉ chi tiết"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link Google Maps</label>
                      <input
                        type="url"
                        name="google_maps_url"
                        defaultValue={editingEvent?.google_maps_url || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://maps.google.com/..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Tip: Mở Google Maps → Tìm địa điểm → Chia sẻ → Sao chép liên kết
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pricing & Capacity */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Giá vé & Sức chứa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số người tham gia tối đa *</label>
                      <input
                        type="number"
                        name="max_participants"
                        defaultValue={editingEvent?.max_participants || 50}
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số người tham gia tối thiểu</label>
                      <input
                        type="number"
                        name="min_participants"
                        defaultValue={editingEvent?.min_participants || 1}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá vé (VND)</label>
                      <input
                        type="number"
                        name="price"
                        defaultValue={editingEvent?.price || 0}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại tiền tệ</label>
                      <select
                        name="currency"
                        defaultValue={editingEvent?.currency || 'VND'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="VND">VND (Việt Nam Đồng)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá ưu đãi sớm</label>
                      <input
                        type="number"
                        name="early_bird_price"
                        defaultValue={editingEvent?.early_bird_price || 0}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ưu đãi sớm đến ngày</label>
                      <input
                        type="date"
                        name="early_bird_until"
                        defaultValue={editingEvent?.early_bird_until || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết sự kiện</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại sự kiện</label>
                      <select
                        name="event_type"
                        defaultValue={editingEvent?.event_type || 'public'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="public">Công khai</option>
                        <option value="private">Riêng tư</option>
                        <option value="invite_only">Chỉ mời</option>
                        <option value="members_only">Thành viên</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn tuổi</label>
                      <select
                        name="age_restriction"
                        defaultValue={editingEvent?.age_restriction || 'all'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Mọi lứa tuổi</option>
                        <option value="18+">18+</option>
                        <option value="21+">21+</option>
                        <option value="16+">16+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                      <select
                        name="language"
                        defaultValue={editingEvent?.language || 'vi'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                        <option value="both">Cả hai</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ khó</label>
                      <select
                        name="difficulty_level"
                        defaultValue={editingEvent?.difficulty_level || 'beginner'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="beginner">Người mới bắt đầu</option>
                        <option value="intermediate">Trung bình</option>
                        <option value="advanced">Nâng cao</option>
                        <option value="expert">Chuyên gia</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Images & Media */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh & Media</h4>
                  <div className="space-y-4">
                    {/* Cover Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh bìa sự kiện</label>
                      {eventImages.cover ? (
                        <div className="relative">
                          <img 
                            src={eventImages.cover} 
                            alt="Cover" 
                            className="w-full h-48 object-cover rounded-lg shadow-sm"
                          />
                          <button
                            onClick={() => setEventImages(prev => ({ ...prev, cover: null }))}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <div className="space-y-3">
                            <div className="flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Upload ảnh bìa cho sự kiện</p>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="cover-upload"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const url = await uploadImage(file, 'events');
                                    if (url) {
                                      setEventImages(prev => ({ ...prev, cover: url }));
                                    }
                                  }
                                }}
                              />
                              <label
                                htmlFor="cover-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Chọn ảnh bìa
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gallery Images */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thư viện ảnh</label>
                      
                      {/* Display uploaded gallery images */}
                      {eventImages.gallery.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {eventImages.gallery.map((image, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={image} 
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-sm"
                              />
                              <button
                                onClick={() => setEventImages(prev => ({ 
                                  ...prev, 
                                  gallery: prev.gallery.filter((_, i) => i !== index) 
                                }))}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Upload nhiều ảnh cho gallery</p>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              id="gallery-upload"
                              onChange={async (e) => {
                                const files = e.target.files;
                                if (files.length > 0) {
                                  const uploadPromises = Array.from(files).map(file => uploadImage(file, 'events'));
                                  const urls = await Promise.all(uploadPromises);
                                  const validUrls = urls.filter(url => url !== null);
                                  if (validUrls.length > 0) {
                                    setEventImages(prev => ({ 
                                      ...prev, 
                                      gallery: [...prev.gallery, ...validUrls] 
                                    }));
                                  }
                                }
                              }}
                            />
                            <label
                              htmlFor="gallery-upload"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              Chọn nhiều ảnh
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Video & Audio URLs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (YouTube, Vimeo)</label>
                        <input
                          type="url"
                          name="video_url"
                          defaultValue={editingEvent?.video_url || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Audio Preview URL</label>
                        <input
                          type="url"
                          name="audio_preview"
                          defaultValue={editingEvent?.audio_preview || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://soundcloud.com/..."
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Upload Progress */}
                  {uploadingImages && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <p className="text-blue-700">Đang upload ảnh...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organizer Info */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin tổ chức</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên người tổ chức</label>
                      <input
                        type="text"
                        name="organizer_name"
                        defaultValue={editingEvent?.organizer_name || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tên cá nhân hoặc tổ chức"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email liên hệ</label>
                      <input
                        type="email"
                        name="organizer_email"
                        defaultValue={editingEvent?.organizer_email || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        name="organizer_phone"
                        defaultValue={editingEvent?.organizer_phone || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+84 123 456 789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Space ID</label>
                      <input
                        type="number"
                        name="space_id"
                        defaultValue={editingEvent?.space_id || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu về người tổ chức</label>
                      <textarea
                        name="organizer_bio"
                        defaultValue={editingEvent?.organizer_bio || ''}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Giới thiệu về kinh nghiệm, chuyên môn..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu tham gia</label>
                      <textarea
                        name="requirements"
                        defaultValue={editingEvent?.requirements || ''}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ví dụ: Cần có kinh nghiệm cơ bản về guitar..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cần mang theo</label>
                      <textarea
                        name="what_to_bring"
                        defaultValue={editingEvent?.what_to_bring || ''}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ví dụ: Guitar, notebook, bút, nước uống..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEventModal(false);
                      setEditingEvent(null);
                    }}
                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingEvent ? 'Cập nhật Event' : 'Thêm Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reply Modal */}
        {replyModalOpen && replyingToMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Trả lời tin nhắn</h3>
                <button
                  onClick={() => {
                    setReplyModalOpen(false);
                    setReplyingToMessage(null);
                    setReplyContent('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Từ:</span>
                  <span className="ml-2 text-sm text-gray-900">{replyingToMessage.name} ({replyingToMessage.email})</span>
                </div>
                {replyingToMessage.phone && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">SĐT:</span>
                    <span className="ml-2 text-sm text-gray-900">{replyingToMessage.phone}</span>
                  </div>
                )}
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Chủ đề:</span>
                  <span className="ml-2 text-sm text-gray-900">{replyingToMessage.subject || 'Không có chủ đề'}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Tin nhắn:</span>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{replyingToMessage.message}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung trả lời *
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập nội dung trả lời..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setReplyModalOpen(false);
                    setReplyingToMessage(null);
                    setReplyContent('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={sendReply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Gửi trả lời
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      {showChat && user && (
        <ChatPanel user={user} onClose={() => setShowChat(false)} />
      )}
    </div>
  );
}