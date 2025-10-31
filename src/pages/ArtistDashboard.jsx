import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Music, 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Star,
  Heart,
  Upload,
  Mic,
  Headphones,
  MessageSquare,
  Send,
  User,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { API_BASE_URL, getUploadUrl } from '@/config/api.js';

const API_BASE = API_BASE_URL;

export default function ArtistDashboard() {
  const [user, setUser] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("events"); // events, registrations, chat
  const [selectedConversation, setSelectedConversation] = React.useState(null);
  const [messageText, setMessageText] = React.useState("");
  const [registrationMessage, setRegistrationMessage] = React.useState("");
  const [registeringEventId, setRegisteringEventId] = React.useState(null);
  
  // Registration modal state
  const [showRegistrationModal, setShowRegistrationModal] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [registrationForm, setRegistrationForm] = React.useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    instruments: [],
    experience_years: '',
    portfolio_url: '',
    message: ''
  });
  const [chatMessages, setChatMessages] = React.useState([]);
  const [chatMessageText, setChatMessageText] = React.useState("");
  
  const queryClient = useQueryClient();
  const messagesEndRef = React.useRef(null);
  const chatEndRef = React.useRef(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          window.location.href = "/";
          return;
        }
        
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          window.location.href = "/";
          return;
        }
        
        const currentUser = await response.json();
        if (currentUser.role !== 'artist') {
          window.location.href = "/";
          return;
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        window.location.href = "/";
      }
    };
    loadUser();
  }, []);

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  // Fetch upcoming events
  const { data: eventsData, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['artist-events', user?.id],
    queryFn: async () => {
      console.log('🔍 Fetching artist events...');
      const data = await fetchWithAuth('/artist/events');
      console.log('✅ Artist events response:', data);
      return data;
    },
    enabled: !!user && activeTab === 'events',
    retry: 2,
    onError: (error) => {
      console.error('❌ Error fetching artist events:', error);
    },
  });

  // Fetch registrations
  const { data: registrationsData, isLoading: registrationsLoading, refetch: refetchRegistrations } = useQuery({
    queryKey: ['artist-registrations', user?.id],
    queryFn: () => fetchWithAuth('/artist/registrations'),
    enabled: !!user && activeTab === 'registrations',
    retry: 2,
  });

  // Fetch unread message count
  const { data: unreadCountData } = useQuery({
    queryKey: ['artist-unread-messages', user?.id],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return { unread_count: 0 };
        const response = await fetch(`${API_BASE}/messages/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return { unread_count: 0 };
        return response.json();
      } catch {
        return { unread_count: 0 };
      }
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Fetch conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['artist-conversations', user?.id],
    queryFn: () => fetchWithAuth('/artist/conversations'),
    enabled: !!user && activeTab === 'chat',
  });

  // Fetch messages for selected conversation
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['artist-messages', user?.id, selectedConversation?.id],
    queryFn: () => fetchWithAuth(`/artist/messages?conversation_with=${selectedConversation?.id}`),
    enabled: !!user && !!selectedConversation,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: ({ eventId, registrationData }) => fetchWithAuth(`/artist/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(registrationData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['artist-events']);
      queryClient.invalidateQueries(['artist-registrations']);
      setRegisteringEventId(null);
      setRegistrationMessage("");
      alert('Đăng ký thành công! Chờ partner/admin xác nhận.');
    },
    onError: (error) => {
      alert('Lỗi đăng ký: ' + error.message);
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ receiverId, content }) => fetchWithAuth('/artist/messages', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, content }),
    }),
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
      queryClient.invalidateQueries(['artist-conversations']);
    },
    onError: (error) => {
      alert('Lỗi gửi tin nhắn: ' + error.message);
    }
  });

  // Mark messages as read
  React.useEffect(() => {
    if (selectedConversation && messagesData?.messages) {
      fetchWithAuth('/artist/messages/read', {
        method: 'PUT',
        body: JSON.stringify({ conversation_with: selectedConversation.id }),
      }).catch(console.error);
    }
  }, [selectedConversation, messagesData]);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // Auto-refresh chat messages in registration modal
  React.useEffect(() => {
    if (showRegistrationModal && selectedEvent?.organizer_id) {
      const interval = setInterval(async () => {
        try {
          const data = await fetchWithAuth(`/artist/messages?conversation_with=${selectedEvent.organizer_id}`);
          setChatMessages(data.messages || []);
          setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } catch (error) {
          console.error('Error refreshing messages:', error);
        }
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(interval);
    }
  }, [showRegistrationModal, selectedEvent?.organizer_id]);

  // Scroll chat to bottom when messages change
  React.useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatMessages]);

  const handleRegister = async (event) => {
    setSelectedEvent(event);
    setRegistrationForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      bio: user.bio || '',
      instruments: [],
      experience_years: '',
      portfolio_url: '',
      message: ''
    });
    setShowRegistrationModal(true);
    
    // Fetch messages with organizer
    if (event.organizer_id) {
      try {
        const data = await fetchWithAuth(`/artist/messages?conversation_with=${event.organizer_id}`);
        setChatMessages(data.messages || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setChatMessages([]);
      }
    }
  };

  const handleRegistrationSubmit = async () => {
    if (!selectedEvent) return;
    
    if (!registrationForm.full_name || !registrationForm.email || !registrationForm.phone) {
      alert('Vui lòng điền đầy đủ thông tin cá nhân');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        eventId: selectedEvent.id,
        registrationData: {
          full_name: registrationForm.full_name,
          email: registrationForm.email,
          phone: registrationForm.phone,
          bio: registrationForm.bio,
          instruments: registrationForm.instruments,
          experience_years: registrationForm.experience_years,
          portfolio_url: registrationForm.portfolio_url,
          message: registrationForm.message
        }
      });
      
      setShowRegistrationModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatMessageText.trim() || !selectedEvent?.organizer_id) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        receiverId: selectedEvent.organizer_id,
        content: chatMessageText.trim()
      });
      
      setChatMessageText("");
      
      // Refresh messages immediately
      const data = await fetchWithAuth(`/artist/messages?conversation_with=${selectedEvent.organizer_id}`);
      setChatMessages(data.messages || []);
      
      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Chat error:', error);
      alert('Lỗi gửi tin nhắn: ' + error.message);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      receiverId: selectedConversation.id,
      content: messageText.trim()
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved": return "Đã chấp nhận";
      case "rejected": return "Bị từ chối";
      case "pending": return "Chờ duyệt";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎵 Artist Dashboard</h1>
          <p className="text-gray-600">Chào mừng, {user.full_name || user.email}!</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("events")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "events"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Calendar className="w-5 h-5 inline mr-2" />
            Events sắp tới
          </button>
          <button
            onClick={() => setActiveTab("registrations")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "registrations"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            Đăng ký của tôi
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`relative px-6 py-3 font-medium transition-colors ${
              activeTab === "chat"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <MessageSquare className="w-5 h-5 inline mr-2" />
            Chat
            {unreadCountData?.unread_count > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCountData.unread_count}
              </span>
            )}
          </button>
        </div>

        {/* Events Tab */}
        {activeTab === "events" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Events sắp tới</h2>
            {eventsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Đang tải events...</p>
              </div>
            ) : eventsError ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                <p className="text-red-600 mb-2">Lỗi tải events</p>
                <button
                  onClick={() => refetchEvents()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Thử lại
                </button>
              </div>
            ) : !eventsData?.events || eventsData.events.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có event nào sắp tới</p>
                <p className="text-sm text-gray-400 mt-2">Các events sẽ hiển thị ở đây khi được approved</p>
                {eventsError && (
                  <p className="text-xs text-red-400 mt-2">Lỗi: {eventsError.message}</p>
                )}
                <button
                  onClick={() => refetchEvents()}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Tải lại
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsData.events.map((event) => {
                  // Parse cover_image from JSON or string
                  let coverImage = null;
                  if (event.cover_image) {
                    if (typeof event.cover_image === 'string') {
                      try {
                        const parsed = JSON.parse(event.cover_image);
                        coverImage = Array.isArray(parsed) ? parsed[0] : parsed;
                      } catch {
                        coverImage = event.cover_image;
                      }
                    } else {
                      coverImage = event.cover_image;
                    }
                  } else if (event.images) {
                    try {
                      const parsed = typeof event.images === 'string' ? JSON.parse(event.images) : event.images;
                      coverImage = Array.isArray(parsed) ? parsed[0] : parsed;
                    } catch {
                      coverImage = event.images;
                    }
                  }
                  
                  const imageUrl = coverImage 
                    ? (coverImage.startsWith('http') ? coverImage : getUploadUrl(coverImage))
                    : null;
                  
                  return (
                    <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      {imageUrl && (
                        <div className="h-48">
                          <img 
                            src={imageUrl} 
                            alt={event.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="font-bold text-xl text-gray-800 mb-2">{event.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                        
                        <div className="space-y-2 mb-4 text-sm text-gray-600">
                          {event.event_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(event.event_date), "dd/MM/yyyy", { locale: vi })}</span>
                            </div>
                          )}
                          {event.start_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{event.start_time}</span>
                            </div>
                          )}
                          {event.space_name && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{event.space_name}</span>
                            </div>
                          )}
                          {event.organizer_name && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{event.organizer_name}</span>
                            </div>
                          )}
                        </div>

                        {event.registration_status ? (
                          <div className={`px-4 py-2 rounded-lg text-center font-medium ${getStatusColor(event.registration_status)}`}>
                            {getStatusLabel(event.registration_status)}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRegister(event)}
                            disabled={registerMutation.isPending}
                            className="w-full px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Mic className="w-5 h-5" />
                            {registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký biểu diễn'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === "registrations" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Đăng ký của tôi</h2>
            {registrationsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : registrationsData?.registrations?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có đăng ký nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {registrationsData?.registrations?.map((reg) => (
                  <div key={reg.id} className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-800 mb-2">{reg.event_title}</h3>
                        <p className="text-gray-600 mb-3">{reg.event_description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>📅 {format(new Date(reg.event_date), "dd/MM/yyyy", { locale: vi })}</span>
                          {reg.start_time && <span>⏰ {reg.start_time}</span>}
                          {reg.space_name && <span>📍 {reg.space_name}</span>}
                          {reg.organizer_name && <span>👤 {reg.organizer_name}</span>}
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-lg font-medium ${getStatusColor(reg.status)}`}>
                        {getStatusLabel(reg.status)}
                      </span>
                    </div>
                    {reg.message && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700"><strong>Tin nhắn của bạn:</strong> {reg.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ height: '600px' }}>
            <div className="flex h-full">
              {/* Conversation List */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800">Conversations</h3>
                </div>
                {conversationsData?.conversations?.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Chưa có cuộc trò chuyện nào</p>
                  </div>
                ) : (
                  <div>
                    {conversationsData?.conversations?.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                          selectedConversation?.id === conv.id ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                            {conv.full_name?.charAt(0) || conv.email.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-800 truncate">
                                {conv.full_name || conv.email}
                              </p>
                              {conv.unread_count > 0 && (
                                <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {conv.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {conv.role === 'admin' ? '👑 Admin' : '🤝 Partner'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                          {selectedConversation.full_name?.charAt(0) || selectedConversation.email.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {selectedConversation.full_name || selectedConversation.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedConversation.role === 'admin' ? '👑 Admin' : '🤝 Partner'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messagesData?.messages?.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isMe
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-purple-100' : 'text-gray-500'}`}>
                                {format(new Date(msg.created_at), "HH:mm", { locale: vi })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Nhập tin nhắn..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sendMessageMutation.isPending}
                          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Gửi
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Đăng ký biểu diễn</h2>
                <p className="text-gray-600 mt-1">{selectedEvent.title}</p>
              </div>
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setSelectedEvent(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Registration Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Thông tin cá nhân
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                        <input
                          type="text"
                          value={registrationForm.full_name}
                          onChange={(e) => setRegistrationForm({...registrationForm, full_name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={registrationForm.email}
                          onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                        <input
                          type="tel"
                          value={registrationForm.phone}
                          onChange={(e) => setRegistrationForm({...registrationForm, phone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Giới thiệu bản thân</label>
                        <textarea
                          value={registrationForm.bio}
                          onChange={(e) => setRegistrationForm({...registrationForm, bio: e.target.value})}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Giới thiệu về bản thân, kinh nghiệm biểu diễn..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Musical Instruments */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Năng khiếu nhạc cụ
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nhạc cụ bạn chơi được</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {['Guitar', 'Piano', 'Violin', 'Drums', 'Bass', 'Saxophone', 'Flute', 'Trumpet', 'Vocals', 'Other'].map((instrument) => (
                            <label key={instrument} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={registrationForm.instruments.includes(instrument)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRegistrationForm({
                                      ...registrationForm,
                                      instruments: [...registrationForm.instruments, instrument]
                                    });
                                  } else {
                                    setRegistrationForm({
                                      ...registrationForm,
                                      instruments: registrationForm.instruments.filter(i => i !== instrument)
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700">{instrument}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số năm kinh nghiệm</label>
                        <input
                          type="number"
                          value={registrationForm.experience_years}
                          onChange={(e) => setRegistrationForm({...registrationForm, experience_years: e.target.value})}
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Ví dụ: 5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio/Website (nếu có)</label>
                        <input
                          type="url"
                          value={registrationForm.portfolio_url}
                          onChange={(e) => setRegistrationForm({...registrationForm, portfolio_url: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Tin nhắn cho người tổ chức
                    </h3>
                    <textarea
                      value={registrationForm.message}
                      onChange={(e) => setRegistrationForm({...registrationForm, message: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nhập tin nhắn bạn muốn gửi cho người tổ chức sự kiện..."
                    />
                  </div>
                </div>

                {/* Right Column - Chat with Organizer */}
                <div className="lg:col-span-1 bg-gray-50 rounded-xl p-4 flex flex-col" style={{ height: '600px' }}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Chat với người tổ chức</h3>
                    <p className="text-sm text-gray-600">{selectedEvent.organizer_name || 'Organizer'}</p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {chatMessages.map((msg) => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                              isMe
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-800 border border-gray-200'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMe ? 'text-purple-100' : 'text-gray-500'}`}>
                              {format(new Date(msg.created_at), "HH:mm", { locale: vi })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessageText}
                      onChange={(e) => setChatMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={!chatMessageText.trim() || sendMessageMutation.isPending}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setSelectedEvent(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleRegistrationSubmit}
                disabled={registerMutation.isPending || !registrationForm.full_name || !registrationForm.email || !registrationForm.phone}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {registerMutation.isPending ? 'Đang gửi...' : 'Gửi đăng ký'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
