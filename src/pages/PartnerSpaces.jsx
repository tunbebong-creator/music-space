import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL, getUploadUrl } from '@/config/api.js';

export default function PartnerSpaces() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Refresh user data from server to ensure role is up-to-date
        const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
        if (token) {
          try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              const serverUser = await response.json();
              console.log('✅ User data refreshed from server:', serverUser);
              setUser(serverUser);
              localStorage.setItem('user_data', JSON.stringify(serverUser));
            }
          } catch (error) {
            console.error('❌ Failed to refresh user data:', error);
          }
        }
      }
    };
    
    loadUser();
  }, []);

  // Fetch spaces
  const { data: spaces = [], isLoading, error: spacesError } = useQuery({
    queryKey: ['partner-spaces', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      if (!token) {
        console.error('❌ No authentication token found');
        throw new Error('No authentication token');
      }
      
      console.log('🔍 Fetching spaces with token:', token.substring(0, 20) + '...');
      console.log('🔍 User:', user);
      
      const response = await fetch(`${API_BASE_URL}/admin/spaces`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch spaces:', response.status, errorText);
        throw new Error(`Failed to fetch spaces: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Spaces fetched:', data);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user && !!localStorage.getItem('auth_token'),
    retry: false,
  });

  // Filter user's own spaces (already filtered by backend, but keep for safety)
  const mySpaces = spaces.filter(space => !user || space.owner_id === user.id || space.owner_id === String(user.id));
  
  // Debug logging
  React.useEffect(() => {
    if (spacesError) {
      console.error('❌ Spaces query error:', spacesError);
    }
    if (spaces.length > 0) {
      console.log('✅ Spaces loaded:', spaces.length);
    }
  }, [spaces, spacesError]);

  // Apply filters
  const filteredSpaces = mySpaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         space.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || space.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Đã duyệt</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Chờ duyệt</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Từ chối</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Không xác định</span>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang tải...</h2>
        </div>
      </div>
    );
  }
  
  if (user.role !== 'partner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600 mb-6">
            Bạn cần có quyền "partner" để truy cập trang này.
            <br />
            Role hiện tại của bạn: <strong>{user.role || 'chưa xác định'}</strong>
            <br />
            Vui lòng liên hệ admin để được cấp quyền partner.
          </p>
          {spacesError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Lỗi API:</strong> {spacesError.message}
              </p>
            </div>
          )}
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
                onClick={() => navigate('/PartnerDashboard')}
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Không gian của tôi</h1>
            </div>
            
            <button
              onClick={() => navigate('/AddSpace')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm không gian mới
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm không gian..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="approved">Đã duyệt</option>
                <option value="pending">Chờ duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{mySpaces.length}</p>
                <p className="text-gray-600 text-sm">Tổng không gian</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{mySpaces.filter(s => s.status === 'approved').length}</p>
                <p className="text-gray-600 text-sm">Đã duyệt</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{mySpaces.filter(s => s.status === 'pending').length}</p>
                <p className="text-gray-600 text-sm">Chờ duyệt</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{mySpaces.filter(s => s.status === 'rejected').length}</p>
                <p className="text-gray-600 text-sm">Từ chối</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spaces List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Danh sách không gian</h2>
            <p className="text-gray-600 text-sm mt-1">{filteredSpaces.length} không gian</p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          ) : filteredSpaces.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Chưa có không gian nào</h3>
              <p className="text-gray-600 mb-4">Hãy tạo không gian đầu tiên của bạn</p>
              <button
                onClick={() => navigate('/AddSpace')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thêm không gian mới
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSpaces.map((space) => (
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{space.name}</h3>
                        <p className="text-gray-600 text-sm">{space.address}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="w-4 h-4" />
                            <span>{space.capacity} người</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <DollarSign className="w-4 h-4" />
                            <span>{space.price_per_hour?.toLocaleString('vi-VN')} VND/giờ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(space.status)}
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/space/${space.id}`)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/EditSpace/${space.id}`)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}







