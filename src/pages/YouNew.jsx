import React, { useState, useEffect } from "react";
import { customAPI } from "@/api/customClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Music, FileText, Calendar, Heart, Sparkles, Lock, LogOut, Edit2, Save, X, Upload, TrendingUp, Award, Crown, Settings, ArrowRight, CheckCircle, BookOpen, Circle, Search } from "lucide-react";
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
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleRequestForm, setRoleRequestForm] = useState({
    role_type: "space_owner",
    reason: "",
    portfolio_url: ""
  });
  const queryClient = useQueryClient();

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = localStorage.getItem('user_data');
        const token = localStorage.getItem('auth_token');
        
        if (userData && token) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setBio(parsedUser?.bio || "");
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Queries
  const { data: activities = [] } = useQuery({
    queryKey: ['user-activities', user?.id],
    queryFn: () => customAPI.entities.UserActivity.find({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: () => customAPI.entities.Booking.find({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: artistBookings = [] } = useQuery({
    queryKey: ['artist-bookings', user?.id],
    queryFn: () => customAPI.entities.ArtistBooking.find({ booker_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: roleRequests = [] } = useQuery({
    queryKey: ['my-role-requests', user?.id],
    queryFn: () => customAPI.entities.RoleRequest.find({ user_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: moodJournals = [] } = useQuery({
    queryKey: ['mood-journals', user?.id],
    queryFn: () => customAPI.entities.MoodJournal.find({ user_id: user?.id }),
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

  const handleMoodSubmit = () => {
    createMoodJournalMutation.mutate({
      mood_level: mood,
      note: moodNote,
      date: new Date().toISOString()
    });
  };

  const handleBioSave = () => {
    updateBioMutation.mutate(bio);
  };

  const handleRoleRequest = () => {
    createRoleRequestMutation.mutate(roleRequestForm);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                Hành trình âm nhạc của bạn
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Ghi lại tâm trạng, nhận gợi ý AI và kết nối với cộng đồng yêu âm nhạc
              </p>
            </motion.div>

            {/* Login Card - Only show if not logged in */}
            {!user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-auto"
              >
                {/* Icon */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Bắt đầu hành trình</h2>
                  <p className="text-gray-600">Ghi lại tâm trạng, nhận gợi ý AI và kết nối với cộng đồng yêu âm nhạc</p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-pink-600">📝</span>
                    </div>
                    <span className="text-gray-700">Nhật ký tâm trạng cá nhân</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600">✨</span>
                    </div>
                    <span className="text-gray-700">Gợi ý thông minh từ AI</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600">🎯</span>
                    </div>
                    <span className="text-gray-700">Theo dõi hoạt động & cộng đồng</span>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  onClick={() => setShowModernAuthModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center gap-3">
                    <User className="w-6 h-6" />
                    Đăng nhập để bắt đầu
                  </div>
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Miễn phí • An toàn • 500+ thành viên
                </p>
              </motion.div>
            )}

            {/* User Dashboard - Show if logged in */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto"
              >
                {/* User Profile Card */}
                <div className="bg-white rounded-2xl p-8 shadow-2xl mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{user?.full_name || "Người dùng"}</h2>
                        <p className="text-gray-600">{user?.email}</p>
                        {user?.bio && <p className="text-sm text-gray-600 mt-2">{user?.bio}</p>}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setShowMoodModal(true)}
                      className="p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5" />
                        <span className="font-semibold">Ghi tâm trạng</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setShowRoleModal(true)}
                      className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Crown className="w-5 h-5" />
                        <span className="font-semibold">Xin quyền</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setEditingBio(true)}
                      className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Edit2 className="w-5 h-5" />
                        <span className="font-semibold">Chỉnh sửa</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{moodJournals.length}</p>
                        <p className="text-sm text-gray-600">Nhật ký tâm trạng</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
                        <p className="text-sm text-gray-600">Lịch đặt</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{activities.length}</p>
                        <p className="text-sm text-gray-600">Hoạt động</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Award className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">{roleRequests.length}</p>
                        <p className="text-sm text-gray-600">Yêu cầu quyền</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mood Modal */}
      <AnimatePresence>
        {showMoodModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Ghi lại tâm trạng hôm nay</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tâm trạng của bạn: {mood}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>😢</span>
                  <span>😊</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="Hôm nay bạn cảm thấy thế nào?"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMoodModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleMoodSubmit}
                  disabled={createMoodJournalMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createMoodJournalMutation.isPending ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bio Edit Modal */}
      <AnimatePresence>
        {editingBio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Chỉnh sửa tiểu sử</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiểu sử
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Giới thiệu về bản thân..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingBio(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBioSave}
                  disabled={updateBioMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updateBioMutation.isPending ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Request Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Xin quyền đặc biệt</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại quyền
                  </label>
                  <select
                    value={roleRequestForm.role_type}
                    onChange={(e) => setRoleRequestForm({...roleRequestForm, role_type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="space_owner">Chủ không gian</option>
                    <option value="partner">Đối tác</option>
                    <option value="artist">Nghệ sĩ</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do xin quyền
                  </label>
                  <textarea
                    value={roleRequestForm.reason}
                    onChange={(e) => setRoleRequestForm({...roleRequestForm, reason: e.target.value})}
                    placeholder="Tại sao bạn muốn có quyền này?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio/Website (tùy chọn)
                  </label>
                  <input
                    type="url"
                    value={roleRequestForm.portfolio_url}
                    onChange={(e) => setRoleRequestForm({...roleRequestForm, portfolio_url: e.target.value})}
                    placeholder="https://..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRoleRequest}
                  disabled={createRoleRequestMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
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
    </div>
  );
}



























