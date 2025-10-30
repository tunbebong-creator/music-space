import React, { useState } from 'react';
import { X, Mail, Lock, Sparkles, User } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/oauth';

export default function ModernAuthModal({ isOpen, onClose, onSuccess }) {
  console.log('ModernAuthModal render - isOpen:', isOpen);
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google OAuth - mock for now
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // Simulate Google OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock user data
      const userData = {
        id: 'google-' + Date.now(),
        email: 'user@gmail.com',
        full_name: 'Google User',
        provider: 'google',
        avatar_url: 'https://via.placeholder.com/150/4285F4/FFFFFF?text=G',
        role: 'user'
      };
      
      const token = 'google-token-' + Date.now();
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      onSuccess(userData);
      onClose();
    } catch (error) {
      console.error('Google login error:', error);
      setError('Không thể đăng nhập Google');
    } finally {
      setLoading(false);
    }
  };

  // Facebook login - mock for now (sẽ thay bằng thật sau)
  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // Simulate Facebook OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock user data (sẽ thay bằng data thật từ Facebook)
      const userData = {
        id: 'facebook-' + Date.now(),
        email: 'user@facebook.com',
        full_name: 'Facebook User',
        provider: 'facebook',
        avatar_url: 'https://via.placeholder.com/150/1877F2/FFFFFF?text=F',
        role: 'user'
      };
      
      const token = 'facebook-token-' + Date.now();
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      onSuccess(userData);
      onClose();
    } catch (error) {
      console.error('Facebook login error:', error);
      setError('Không thể đăng nhập Facebook');
    } finally {
      setLoading(false);
    }
  };

  // Handle role-specific login for testing
  const handleRoleLogin = async (roleType) => {
    try {
      setLoading(true);
      setError('');

      // Simulate login delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const roleData = {
        admin: {
          id: 'admin-' + Date.now(),
          email: 'admin@musicspace.edu.vn',
          full_name: 'Admin User',
          provider: 'test',
          avatar_url: 'https://via.placeholder.com/150/8B5CF6/FFFFFF?text=A',
          role: 'admin'
        },
        'space-owner': {
          id: 'space-owner-' + Date.now(),
          email: 'spaceowner@gmail.com',
          full_name: 'Space Owner',
          provider: 'test',
          avatar_url: 'https://via.placeholder.com/150/10B981/FFFFFF?text=S',
          role: 'user',
          space_owner_verified: true
        },
        artist: {
          id: 'artist-' + Date.now(),
          email: 'artist@gmail.com',
          full_name: 'Artist User',
          provider: 'test',
          avatar_url: 'https://via.placeholder.com/150/EC4899/FFFFFF?text=🎵',
          role: 'user',
          artist_verified: true
        },
        user: {
          id: 'user-' + Date.now(),
          email: 'user@gmail.com',
          full_name: 'Regular User',
          provider: 'test',
          avatar_url: 'https://via.placeholder.com/150/4285F4/FFFFFF?text=U',
          role: 'user'
        }
      };

      const userData = roleData[roleType];
      const token = 'test-token-' + Date.now();
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      onSuccess(userData);
      onClose();
    } catch (error) {
      console.error('Role login error:', error);
      setError('Không thể đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? API_ENDPOINTS.LOGIN : API_ENDPOINTS.REGISTER;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    console.log('ModernAuthModal - Not rendering because isOpen is false');
    return null;
  }
  
  console.log('ModernAuthModal - Rendering modal');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-br from-blue-400 via-purple-500 to-purple-700 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold mb-1">Chào mừng đến với Music Space</h2>
              <p className="text-white/90 text-sm">Music Space</p>
            </div>
            
            <p className="text-white/90 text-sm text-center">
              Đăng nhập để khám phá thế giới âm nhạc và không gian sáng tạo
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isLogin 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLogin 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Đăng ký
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập họ và tên"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới thiệu về bản thân (tùy chọn)
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Chia sẻ về bản thân..."
                    rows={3}
                  />
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
              </button>
            </form>

            {/* Social Login Divider */}
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Hoặc tiếp tục với</span>
                </div>
              </div>
              


              {/* Social Login Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleLogin}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>

                <button
                  onClick={handleFacebookLogin}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center text-sm text-gray-500 pb-2">
              Miễn phí mãi mãi • Không cần thẻ tín dụng
            </div>
          </div>
        </div>
      </div>
      
  );
}
