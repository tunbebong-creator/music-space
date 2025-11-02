import React, { useState, useEffect } from "react";
import { customAPI } from "@/api/customClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Music, FileText, Calendar, Heart, Sparkles, Lock, LogOut, Edit2, Save, X, Upload, TrendingUp, Award, Crown, Settings, ArrowRight, CheckCircle, BookOpen, Circle, Search } from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ModernAuthModal from "../components/ModernAuthModal";

export default function You() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showModernAuthModal, setShowModernAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = localStorage.getItem('user_data');
        const token = localStorage.getItem('auth_token');
        
        if (userData && token) {
          const user = JSON.parse(userData);
          setUser(user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

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

            {/* Login Card */}
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

              {/* Login Button - Only show if not logged in */}
              {!user && (
                <div>
                  <button
                    onClick={() => setShowModernAuthModal(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <User className="w-6 h-6" />
                      Đăng nhập để bắt đầu
                    </div>
                  </button>
                </div>
              )}

              {/* User Info - Show if logged in */}
              {user && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl font-bold">
                      {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Chào mừng, {user?.full_name || user?.email}!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Bạn đã sẵn sàng khám phá thế giới âm nhạc
                  </p>
                  <button
                    onClick={() => {
                      localStorage.removeItem('auth_token');
                      localStorage.removeItem('user_data');
                      setUser(null);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}

              <p className="text-center text-sm text-gray-500 mt-4">
                Miễn phí • An toàn • 500+ thành viên
              </p>
            </motion.div>
          </div>
        </div>
      </div>

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








































