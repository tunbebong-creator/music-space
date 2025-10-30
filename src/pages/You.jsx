import React, { useState, useEffect } from "react";
import { customAPI } from "@/api/customClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Music, FileText, Calendar, Heart, Sparkles, Lock, LogOut, Edit2, Save, X, Upload, TrendingUp, Award, Crown, Settings, ArrowRight, CheckCircle, BookOpen, Circle, Search, Play, Pause, Volume2, Headphones, Mic, Guitar, Piano, Drum, Users } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { format } from "date-fns";
import ModernAuthModal from "../components/ModernAuthModal";

export default function You() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showModernAuthModal, setShowModernAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState(5);
  const [moodNote, setMoodNote] = useState("");
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodAnalysis, setMoodAnalysis] = useState(null);
  const [recommendedGenres, setRecommendedGenres] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [aiMusicSuggestion, setAiMusicSuggestion] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleRequestForm, setRoleRequestForm] = useState({
    role_type: "space_owner",
    reason: "",
    portfolio_url: ""
  });
  const queryClient = useQueryClient();

  // Load user data from database via token
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Try API first
        try {
          const res = await fetch('http://localhost:3001/api/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const u = await res.json();
            setUser(u);
            setBio(u?.bio || "");
            setFullName(u?.full_name || "");
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('API call failed, trying localStorage fallback:', apiError);
        }
        
        // Fallback to localStorage
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setBio(parsedUser?.bio || "");
          setFullName(parsedUser?.full_name || "");
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Queries - with error handling
  const { data: activities = [] } = useQuery({
    queryKey: ['user-activities', user?.id],
    queryFn: async () => {
      try {
        return await customAPI.entities.UserActivity.find({ user_id: user?.id });
      } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async () => {
      try {
        return await customAPI.entities.Booking.find({ user_id: user?.id });
      } catch (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  const { data: artistBookings = [] } = useQuery({
    queryKey: ['artist-bookings', user?.id],
    queryFn: async () => {
      try {
        return await customAPI.entities.ArtistBooking.find({ booker_id: user?.id });
      } catch (error) {
        console.error('Error fetching artist bookings:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  const { data: roleRequests = [] } = useQuery({
    queryKey: ['my-role-requests', user?.id],
    queryFn: async () => {
      try {
        return await customAPI.entities.RoleRequest.find({ user_id: user?.id });
      } catch (error) {
        console.error('Error fetching role requests:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  const { data: moodJournals = [] } = useQuery({
    queryKey: ['mood-journals', user?.id],
    queryFn: async () => {
      try {
        return await customAPI.entities.MoodJournal.find({ user_id: user?.id });
      } catch (error) {
        console.error('Error fetching mood journals:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });

  // Mutations
  const updateBioMutation = useMutation({
    mutationFn: async (newBio) => {
      const prefs = await customAPI.entities.UserPreferences.find({ user_id: user?.id });
      if (prefs.length > 0) {
        return customAPI.entities.UserPreferences.update(prefs[0].id, { bio: newBio });
      } else {
        return customAPI.entities.UserPreferences.create({ user_id: user?.id, bio: newBio });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-preferences', user?.id]);
      setEditingBio(false);
    }
  });

  const createMoodJournalMutation = useMutation({
    mutationFn: async (moodData) => {
      const prefs = await customAPI.entities.UserPreferences.find({ user_id: user?.id });
      if (prefs.length > 0) {
        return customAPI.entities.UserPreferences.update(prefs[0].id, { mood_level: mood });
      } else {
        return customAPI.entities.UserPreferences.create({ user_id: user?.id, mood_level: mood });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mood-journals', user?.id]);
      setShowMoodModal(false);
      setMoodNote("");
    }
  });

  const createRoleRequestMutation = useMutation({
    mutationFn: (data) => customAPI.entities.RoleRequest.create({
      ...data,
      user_id: user?.id,
      user_email: user?.email,
      user_name: user?.full_name || user?.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-role-requests']);
      setShowRoleModal(false);
      setRoleRequestForm({ role_type: "space_owner", reason: "", portfolio_url: "" });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    navigate('/');
  };

  // AI Mood Analysis and Recommendations
  const analyzeMoodAndGenerateRecommendations = (moodLevel, note) => {
    // AI Mood Analysis
    let moodType = "neutral";
    let moodColor = "blue";
    let moodEmoji = "😐";
    
    if (moodLevel <= 3) {
      moodType = "sad";
      moodColor = "blue";
      moodEmoji = "😢";
    } else if (moodLevel <= 6) {
      moodType = "neutral";
      moodColor = "purple";
      moodEmoji = "😐";
    } else {
      moodType = "happy";
      moodColor = "pink";
      moodEmoji = "😊";
    }

    // AI Genre Recommendations based on mood
    const genreRecommendations = {
      sad: ["Blues", "Soul", "Indie", "Folk", "Acoustic"],
      neutral: ["Pop", "Jazz", "Electronic", "Ambient", "Chill"],
      happy: ["Pop", "Dance", "Funk", "Reggae", "Rock"]
    };

    // AI Event Recommendations
    const eventRecommendations = {
      sad: [
        { name: "Acoustic Night", type: "Intimate", date: "2024-01-15" },
        { name: "Blues Workshop", type: "Workshop", date: "2024-01-20" }
      ],
      neutral: [
        { name: "Jazz Lounge", type: "Live Music", date: "2024-01-18" },
        { name: "Electronic Music Night", type: "DJ Set", date: "2024-01-22" }
      ],
      happy: [
        { name: "Dance Party", type: "Party", date: "2024-01-16" },
        { name: "Funk Festival", type: "Festival", date: "2024-01-25" }
      ]
    };

    // AI Music Suggestion
    const musicSuggestions = {
      sad: "Hãy thử nghe những bản nhạc acoustic nhẹ nhàng hoặc blues để cảm thấy được thấu hiểu...",
      neutral: "Khám phá jazz hoặc electronic ambient để tìm cảm hứng mới...",
      happy: "Những bản nhạc pop sôi động hoặc funk sẽ giúp bạn duy trì năng lượng tích cực!"
    };

    setMoodAnalysis({
      type: moodType,
      color: moodColor,
      emoji: moodEmoji,
      level: moodLevel,
      description: note
    });

    setRecommendedGenres(genreRecommendations[moodType]);
    setRecommendedEvents(eventRecommendations[moodType]);
    setAiMusicSuggestion(musicSuggestions[moodType]);
  };

  const handleMoodSubmit = () => {
    // Analyze mood and generate AI recommendations
    analyzeMoodAndGenerateRecommendations(mood, moodNote);
    
    createMoodJournalMutation.mutate({
      mood_level: mood,
      note: moodNote,
      date: new Date().toISOString()
    });
  };

  const handleBioSave = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('http://localhost:3001/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName, bio })
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setUser(updated);
      setEditingBio(false);
    } catch (e) {
      console.error('Save profile error:', e);
      alert('Cập nhật hồ sơ thất bại');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('http://localhost:3001/api/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert('Đổi mật khẩu thành công');
    } catch (e) {
      console.error('Change password error:', e);
      alert('Đổi mật khẩu thất bại');
    }
  };

  const handleRoleRequest = () => {
    createRoleRequestMutation.mutate(roleRequestForm);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-sky-300/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-blue-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center mr-4">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-1">
                  You
                </h1>
                <p className="text-lg text-sky-600 font-medium">Hành trình âm nhạc của bạn</p>
              </div>
            </div>
            
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Khám phá, sáng tạo và kết nối trong thế giới âm nhạc đầy màu sắc
            </p>
          </motion.div>

          {/* Login Card */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl max-w-md mx-auto border border-gray-200"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Bắt đầu hành trình</h3>
                <p className="text-gray-600">Tham gia cộng đồng âm nhạc lớn nhất Việt Nam</p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-gray-800 font-semibold text-sm">Nhật ký tâm trạng</h4>
                    <p className="text-gray-600 text-xs">Ghi lại cảm xúc qua âm nhạc</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-gray-800 font-semibold text-sm">AI gợi ý thông minh</h4>
                    <p className="text-gray-600 text-xs">Khám phá âm nhạc phù hợp</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-gray-800 font-semibold text-sm">Cộng đồng sôi động</h4>
                    <p className="text-gray-600 text-xs">Kết nối với nghệ sĩ và fan</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowModernAuthModal(true)}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-6 rounded-2xl font-semibold hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="w-5 h-5" />
                  Đăng nhập để bắt đầu
                </div>
              </button>
              
              <p className="text-center text-gray-600 text-sm mt-4">
                Miễn phí • An toàn • 10,000+ thành viên
              </p>
            </motion.div>
          )}

          {/* User Dashboard */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-5xl mx-auto"
            >
              {/* User Profile Card */}
              <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl mb-8 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {user?.full_name ? user.full_name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : "M")}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{user?.full_name || user?.email || "Music Lover"}</h2>
                      <p className="text-gray-600">{user?.email || "Chưa có email"}</p>
                      {user?.bio && <p className="text-gray-500 text-sm mt-1">{user?.bio}</p>}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all border border-gray-200"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <button
                    onClick={() => setShowMoodModal(true)}
                    className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold">Ghi tâm trạng</h3>
                        <p className="text-emerald-100 text-sm">Chia sẻ cảm xúc qua âm nhạc</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowRoleModal(true)}
                    className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold">Xin quyền nghệ sĩ</h3>
                        <p className="text-purple-100 text-sm">Trở thành nghệ sĩ chính thức</p>
                      </div>
                    </div>
                  </button>

                  {user?.role === 'partner' && (
                    <button
                      onClick={() => navigate('/PartnerDashboard')}
                      className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold">Dashboard Đối tác</h3>
                          <p className="text-orange-100 text-sm">Quản lý không gian và sự kiện</p>
                        </div>
                      </div>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setEditingBio(true)}
                    className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Edit2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold">Chỉnh sửa profile</h3>
                        <p className="text-blue-100 text-sm">Cập nhật thông tin cá nhân</p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="p-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold">Đổi mật khẩu</h3>
                        <p className="text-rose-100 text-sm">Bảo vệ tài khoản</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{moodJournals.length}</p>
                      <p className="text-gray-600 text-sm">Nhật ký tâm trạng</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
                      <p className="text-gray-600 text-sm">Lịch đặt studio</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{activities.length}</p>
                      <p className="text-gray-600 text-sm">Hoạt động</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{roleRequests.length}</p>
                      <p className="text-gray-600 text-sm">Yêu cầu quyền</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations Section */}
              {moodAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* AI Music Analysis */}
                  <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">AI Phân tích tâm trạng</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">{moodAnalysis.emoji}</span>
                          <div>
                            <h4 className="text-lg font-bold text-gray-800">
                              {moodAnalysis.type === 'sad' ? 'Tâm trạng buồn' : 
                               moodAnalysis.type === 'neutral' ? 'Tâm trạng bình thường' : 'Tâm trạng vui'}
                            </h4>
                            <p className="text-gray-600 text-sm">Mức độ: {moodAnalysis.level}/10</p>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{aiMusicSuggestion}</p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <h4 className="text-lg font-bold text-gray-800 mb-3">Thể loại nhạc phù hợp</h4>
                        <div className="flex flex-wrap gap-2">
                          {recommendedGenres.map((genre, index) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 rounded-full text-sm border border-blue-300"
                            >
                              {genre}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommended Events */}
                  <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Sự kiện phù hợp với tâm trạng</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendedEvents.map((event, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-gray-800 font-semibold">{event.name}</h4>
                            <span className="px-2 py-1 bg-green-500/20 text-green-700 rounded-full text-xs">
                              {event.type}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">Ngày: {event.date}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Music Genres Section */}
              <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Sở thích âm nhạc của bạn</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Pop', 'Rock', 'Jazz', 'Classical', 'Hip-Hop', 'Electronic', 'Folk', 'R&B'].map((genre, index) => (
                    <motion.div
                      key={genre}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition-all cursor-pointer hover:scale-105 border border-gray-200"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Music className="w-3 h-3 text-white" />
                      </div>
                      <p className="text-gray-700 text-sm font-medium">{genre}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mood Modal - Enhanced with AI */}
      <AnimatePresence>
        {showMoodModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-2xl w-full border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Ghi lại tâm trạng hôm nay</h3>
                <button
                  onClick={() => setShowMoodModal(false)}
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* Mood Slider with Enhanced Effects */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-blue-200 mb-4">
                  Tâm trạng của bạn: <span className="text-2xl font-bold text-white">{mood}/10</span>
                </label>
                
                {/* Mood Visualizer */}
                <div className="relative mb-4">
                  <div className="flex justify-between text-sm text-blue-300 mb-2">
                    <span className="flex items-center gap-1">
                      <span className="text-lg">😢</span> Buồn
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-lg">😐</span> Bình thường
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-lg">😊</span> Vui
                    </span>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={mood}
                      onChange={(e) => setMood(parseInt(e.target.value))}
                      className="w-full h-4 bg-white/20 rounded-lg appearance-none cursor-pointer slider-enhanced"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)`
                      }}
                    />
                    
                    {/* Mood Indicator */}
                    <motion.div
                      className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                      style={{
                        left: `calc(${(mood - 1) / 9 * 100}% - 12px)`
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(59, 130, 246, 0.7)",
                          "0 0 0 10px rgba(59, 130, 246, 0)",
                          "0 0 0 0 rgba(59, 130, 246, 0)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-xs">
                        {mood <= 3 ? "😢" : mood <= 6 ? "😐" : "😊"}
                      </span>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Note Section */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-blue-200 mb-3">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="Hôm nay bạn cảm thấy thế nào? Có bài hát nào đặc biệt không?"
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* AI Analysis Preview */}
              {moodAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-white font-semibold">AI Phân tích tâm trạng</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{moodAnalysis.emoji}</span>
                      <span className="text-blue-200">
                        Tâm trạng: {moodAnalysis.type === 'sad' ? 'Buồn' : moodAnalysis.type === 'neutral' ? 'Bình thường' : 'Vui'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-blue-200">
                      <strong>Gợi ý âm nhạc:</strong> {aiMusicSuggestion}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-blue-200">Thể loại phù hợp:</span>
                      {recommendedGenres.map((genre, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMoodModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  Hủy
                </button>
                <button
                  onClick={handleMoodSubmit}
                  disabled={createMoodJournalMutation.isPending}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                >
                  {createMoodJournalMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang phân tích...
                    </div>
                  ) : (
                    "Lưu & Phân tích AI"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Đổi mật khẩu</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Nhập lại mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  Hủy
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bio Edit Modal - Music Space Style */}
        <AnimatePresence>
        {editingBio && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            >
              <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Chỉnh sửa hồ sơ</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tên của bạn"
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Tiểu sử
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Giới thiệu về bản thân, sở thích âm nhạc..."
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingBio(false)}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBioSave}
                  disabled={updateBioMutation.isPending}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
                >
                  {updateBioMutation.isPending ? "Đang lưu..." : "Lưu"}
                </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Role Request Modal - Music Space Style */}
        <AnimatePresence>
          {showRoleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            >
              <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Xin quyền nghệ sĩ</h3>
              
              <div className="space-y-4 mb-6">
                  <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Loại quyền
                    </label>
                    <select
                      value={roleRequestForm.role_type}
                    onChange={(e) => setRoleRequestForm({...roleRequestForm, role_type: e.target.value})}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                    <option value="space_owner" className="bg-gray-800">Chủ không gian</option>
                    <option value="partner" className="bg-gray-800">Đối tác</option>
                    <option value="artist" className="bg-gray-800">Nghệ sĩ</option>
                    <option value="admin" className="bg-gray-800">Quản trị viên</option>
                    </select>
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Lý do xin quyền
                    </label>
                    <textarea
                      value={roleRequestForm.reason}
                    onChange={(e) => setRoleRequestForm({...roleRequestForm, reason: e.target.value})}
                    placeholder="Tại sao bạn muốn có quyền này? Kinh nghiệm âm nhạc của bạn?"
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Portfolio/Website (tùy chọn)
                    </label>
                    <input
                      type="url"
                      value={roleRequestForm.portfolio_url}
                    onChange={(e) => setRoleRequestForm({...roleRequestForm, portfolio_url: e.target.value})}
                    placeholder="https://..."
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                  </div>

              <div className="flex gap-3">
                    <button
                      onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/20"
                    >
                      Hủy
                    </button>
                    <button
                  onClick={handleRoleRequest}
                      disabled={createRoleRequestMutation.isPending}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all disabled:opacity-50"
                    >
                      {createRoleRequestMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
                    </button>
                  </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      
      {/* Modern Auth Modal */}
      {showModernAuthModal && (
        <ModernAuthModal
          isOpen={true}
          onClose={() => setShowModernAuthModal(false)}
          onSuccess={(user) => {
            setUser(user);
            setShowModernAuthModal(false);
          }}
        />
      )}

      {/* Custom Styles */}
      <style jsx="true">{`
        .slider-enhanced::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          border: 2px solid white;
          transition: all 0.3s ease;
        }
        
        .slider-enhanced::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
        }
        
        .slider-enhanced::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          transition: all 0.3s ease;
        }
        
        .slider-enhanced::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
        }
        
        .slider-enhanced::-webkit-slider-track {
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.2);
        }
        
        .slider-enhanced::-moz-range-track {
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
        }
      `}</style>
    </div>
  );
}