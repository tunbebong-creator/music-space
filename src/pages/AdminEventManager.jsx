import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign,
  Image as ImageIcon,
  Tag,
  FileText,
  Save,
  X,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Link,
  Star,
  Music,
  Mic,
  Volume2,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Camera,
  Lightbulb,
  Shield,
  Heart,
  Share2,
  Download,
  Send,
  Copy,
  ExternalLink,
  Map,
  Navigation,
  Globe,
  Phone,
  Mail,
  User,
  Building,
  Home,
  Zap,
  Target,
  Award,
  BookOpen,
  MessageSquare,
  Hash,
  AtSign,
  Facebook,
  Instagram,
  Youtube,
  Twitter
} from "lucide-react";

export default function AdminEventManager() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeStep, setActiveStep] = React.useState(1);
  const [eventData, setEventData] = React.useState({
    // Basic Info
    title: '',
    description: '',
    category: 'workshop',
    tags: [],
    
    // Date & Time
    event_date: '',
    start_time: '',
    end_time: '',
    duration_hours: 2,
    
    // Location
    space_id: '',
    venue_name: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    
    // Capacity & Pricing
    max_participants: 50,
    min_participants: 5,
    price: 0,
    currency: 'VND',
    drink_option: 'none',
    drink_price: 0,
    
    // Media
    cover_image: '',
    gallery_images: [],
    video_url: '',
    audio_preview: '',
    
    // Event Details
    event_type: 'public',
    age_restriction: 'all',
    language: 'vi',
    difficulty_level: 'beginner',
    
    // Equipment & Amenities
    equipment_provided: [],
    equipment_needed: [],
    amenities: [],
    
    // Organizer Info
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    organizer_bio: '',
    
    // Additional Info
    requirements: '',
    what_to_bring: '',
    cancellation_policy: '',
    refund_policy: '',
    
    // Social & Marketing
    facebook_event: '',
    instagram_post: '',
    hashtags: [],
    
    // Status
    status: 'draft',
    featured: false,
    promoted: false
  });

  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [showMapPicker, setShowMapPicker] = React.useState(false);
  const [mapCenter, setMapCenter] = React.useState([21.0285, 105.8542]); // Hanoi default
  const [selectedLocation, setSelectedLocation] = React.useState(null);
  const queryClient = useQueryClient();

  // Load user data
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = localStorage.getItem('user_data');
        const token = localStorage.getItem('auth_token');
        
        if (userData && token) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } else {
          const testUser = {
            id: 1,
            email: 'admin@musicspace.edu.vn',
            full_name: 'Admin User',
            role: 'admin'
          };
          setUser(testUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // API functions
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`http://localhost:3001${url}`, {
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

  // Fetch spaces for dropdown
  const { data: spacesData } = useQuery({
    queryKey: ['admin-spaces'],
    queryFn: () => fetchWithAuth('/api/admin/spaces'),
    enabled: !!user && user.role === 'admin',
  });

  const steps = [
    { id: 1, title: 'Thông tin cơ bản', icon: FileText },
    { id: 2, title: 'Thời gian & Địa điểm', icon: Calendar },
    { id: 3, title: 'Giá vé & Sức chứa', icon: DollarSign },
    { id: 4, title: 'Hình ảnh & Media', icon: ImageIcon },
    { id: 5, title: 'Chi tiết sự kiện', icon: Tag },
    { id: 6, title: 'Thông tin tổ chức', icon: Users },
    { id: 7, title: 'Xem lại & Xuất bản', icon: CheckCircle }
  ];

  const categories = [
    { value: 'workshop', label: 'Workshop', icon: '🎓' },
    { value: 'concert', label: 'Concert', icon: '🎵' },
    { value: 'acoustic', label: 'Acoustic', icon: '🎸' },
    { value: 'jazz', label: 'Jazz', icon: '🎷' },
    { value: 'classical', label: 'Classical', icon: '🎼' },
    { value: 'electronic', label: 'Electronic', icon: '🎛️' },
    { value: 'folk', label: 'Folk', icon: '🪕' },
    { value: 'rock', label: 'Rock', icon: '🎸' },
    { value: 'pop', label: 'Pop', icon: '🎤' },
    { value: 'hiphop', label: 'Hip Hop', icon: '🎧' },
    { value: 'talk', label: 'Talkshow', icon: '🎙️' },
    { value: 'networking', label: 'Networking', icon: '🤝' }
  ];

  const eventTypes = [
    { value: 'public', label: 'Công khai', description: 'Ai cũng có thể tham gia' },
    { value: 'private', label: 'Riêng tư', description: 'Chỉ người được mời' },
    { value: 'invite_only', label: 'Chỉ mời', description: 'Cần được mời trước' },
    { value: 'members_only', label: 'Thành viên', description: 'Chỉ thành viên' }
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'Người mới bắt đầu', color: 'green' },
    { value: 'intermediate', label: 'Trung bình', color: 'yellow' },
    { value: 'advanced', label: 'Nâng cao', color: 'red' },
    { value: 'expert', label: 'Chuyên gia', color: 'purple' }
  ];

  const equipmentOptions = [
    { value: 'microphone', label: 'Microphone', icon: Mic },
    { value: 'speakers', label: 'Loa', icon: Volume2 },
    { value: 'recording_equipment', label: 'Thiết bị thu âm', icon: Music },
    { value: 'instruments', label: 'Nhạc cụ', icon: Music },
    { value: 'lighting', label: 'Ánh sáng', icon: Lightbulb },
    { value: 'camera', label: 'Camera', icon: Camera },
    { value: 'wifi', label: 'WiFi', icon: Wifi },
    { value: 'parking', label: 'Bãi đỗ xe', icon: Car },
    { value: 'food_drinks', label: 'Đồ ăn & nước uống', icon: Coffee },
    { value: 'security', label: 'Bảo vệ', icon: Shield }
  ];

  const handleInputChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    handleInputChange(field, array);
  };

  // Image upload functions
  const handleImageUpload = async (file, type = 'cover') => {
    setUploadingImages(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'events'); // Sửa type thành 'events' để lưu vào thư mục events
      
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Upload result:', result);
      
      if (type === 'cover') {
        handleInputChange('cover_image', result.url);
      } else if (type === 'gallery') {
        const currentGallery = eventData.gallery_images || [];
        handleInputChange('gallery_images', [...currentGallery, result.url]);
      }
      
      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Lỗi upload ảnh: ' + error.message);
      return null;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleMultipleImageUpload = async (files) => {
    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(file => handleImageUpload(file, 'gallery'));
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(url => url !== null);
      
      if (validUrls.length > 0) {
        const currentGallery = eventData.gallery_images || [];
        handleInputChange('gallery_images', [...currentGallery, ...validUrls]);
      }
    } catch (error) {
      console.error('Multiple upload error:', error);
      alert('Lỗi upload nhiều ảnh');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index, type = 'gallery') => {
    if (type === 'cover') {
      handleInputChange('cover_image', '');
    } else if (type === 'gallery') {
      const currentGallery = eventData.gallery_images || [];
      const newGallery = currentGallery.filter((_, i) => i !== index);
      handleInputChange('gallery_images', newGallery);
    }
  };

  // Map picker functions
  const handleMapClick = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    handleInputChange('latitude', lat);
    handleInputChange('longitude', lng);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          handleMapClick(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Không thể lấy vị trí hiện tại');
        }
      );
    } else {
      alert('Trình duyệt không hỗ trợ định vị');
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!eventData.title.trim()) newErrors.title = 'Tên sự kiện là bắt buộc';
        if (!eventData.description.trim()) newErrors.description = 'Mô tả là bắt buộc';
        if (eventData.description.length < 50) newErrors.description = 'Mô tả phải có ít nhất 50 ký tự';
        break;
      case 2:
        if (!eventData.event_date) newErrors.event_date = 'Ngày tổ chức là bắt buộc';
        if (!eventData.start_time) newErrors.start_time = 'Giờ bắt đầu là bắt buộc';
        if (!eventData.end_time) newErrors.end_time = 'Giờ kết thúc là bắt buộc';
        break;
      case 3:
        if (eventData.max_participants < 1) newErrors.max_participants = 'Số người tham gia tối đa phải lớn hơn 0';
        if (eventData.price < 0) newErrors.price = 'Giá vé không được âm';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setIsSubmitting(true);
    try {
      await fetchWithAuth('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
      
      alert('Sự kiện đã được tạo thành công!');
      // Reset form or redirect
      setEventData({
        title: '',
        description: '',
        category: 'workshop',
        tags: [],
        event_date: '',
        start_time: '',
        end_time: '',
        duration_hours: 2,
        space_id: '',
        venue_name: '',
        address: '',
        city: '',
        latitude: '',
        longitude: '',
        max_participants: 50,
        min_participants: 5,
        price: 0,
        currency: 'VND',
        drink_option: 'none',
        drink_price: 0,
        cover_image: '',
        gallery_images: [],
        video_url: '',
        audio_preview: '',
        event_type: 'public',
        age_restriction: 'all',
        language: 'vi',
        difficulty_level: 'beginner',
        equipment_provided: [],
        equipment_needed: [],
        amenities: [],
        organizer_name: '',
        organizer_email: '',
        organizer_phone: '',
        organizer_bio: '',
        organizer_website: '',
        requirements: '',
        what_to_bring: '',
        cancellation_policy: '',
        refund_policy: '',
        facebook_event: '',
        instagram_post: '',
        hashtags: [],
        status: 'draft',
        featured: false,
        promoted: false
      });
      setActiveStep(1);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Có lỗi xảy ra khi tạo sự kiện');
    } finally {
      setIsSubmitting(false);
    }
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Truy cập bị từ chối</h1>
          <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold">Event Manager</h1>
              <p className="text-blue-100 mt-1">Tạo sự kiện chi tiết và chuyên nghiệp</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                const isCompleted = activeStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                      isActive ? 'bg-blue-100 text-blue-700' :
                      isCompleted ? 'bg-green-100 text-green-700' :
                      'text-gray-500'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-blue-600 text-white' :
                        isCompleted ? 'bg-green-600 text-white' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className="font-medium hidden sm:block">{step.title}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          {/* Step 1: Basic Info */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thông tin cơ bản</h2>
                <p className="text-gray-600">Nhập thông tin cơ bản về sự kiện của bạn</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên sự kiện *
                  </label>
                  <input
                    type="text"
                    value={eventData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ví dụ: Workshop Guitar Acoustic cho người mới bắt đầu"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả chi tiết *
                  </label>
                  <textarea
                    value={eventData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mô tả chi tiết về sự kiện, nội dung, lợi ích khi tham gia..."
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                    <p className="text-gray-500 text-sm ml-auto">{eventData.description.length}/500</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thể loại
                  </label>
                  <select
                    value={eventData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (cách nhau bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={eventData.tags.join(', ')}
                    onChange={(e) => handleArrayChange('tags', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="guitar, acoustic, workshop, beginner"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Date & Location */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thời gian & Địa điểm</h2>
                <p className="text-gray-600">Thiết lập thời gian và địa điểm tổ chức sự kiện</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày tổ chức *
                  </label>
                  <input
                    type="date"
                    value={eventData.event_date}
                    onChange={(e) => handleInputChange('event_date', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.event_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.event_date && <p className="text-red-500 text-sm mt-1">{errors.event_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thời lượng (giờ)
                  </label>
                  <input
                    type="number"
                    value={eventData.duration_hours}
                    onChange={(e) => handleInputChange('duration_hours', parseInt(e.target.value))}
                    min="1"
                    max="24"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ bắt đầu *
                  </label>
                  <input
                    type="time"
                    value={eventData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.start_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ kết thúc *
                  </label>
                  <input
                    type="time"
                    value={eventData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.end_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn không gian
                  </label>
                  <select
                    value={eventData.space_id}
                    onChange={(e) => handleInputChange('space_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn không gian...</option>
                    {Array.isArray(spacesData) && spacesData.map(space => (
                      <option key={space.id} value={space.id}>
                        {space.name} - {space.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên địa điểm
                  </label>
                  <input
                    type="text"
                    value={eventData.venue_name}
                    onChange={(e) => handleInputChange('venue_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tên địa điểm tổ chức"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={eventData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Địa chỉ chi tiết"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thành phố
                  </label>
                  <input
                    type="text"
                    value={eventData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vị trí trên bản đồ
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={eventData.latitude}
                        onChange={(e) => handleInputChange('latitude', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="21.0285"
                      />
                      <input
                        type="number"
                        step="any"
                        value={eventData.longitude}
                        onChange={(e) => handleInputChange('longitude', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="105.8542"
                      />
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Vị trí hiện tại
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Map className="w-4 h-4" />
                        Chọn trên bản đồ
                      </button>
                    </div>
                    
                    {selectedLocation && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Đã chọn vị trí: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing & Capacity */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Giá vé & Sức chứa</h2>
                <p className="text-gray-600">Thiết lập giá vé và số lượng người tham gia</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số người tham gia tối đa *
                  </label>
                  <input
                    type="number"
                    value={eventData.max_participants}
                    onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value))}
                    min="1"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.max_participants ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.max_participants && <p className="text-red-500 text-sm mt-1">{errors.max_participants}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số người tham gia tối thiểu
                  </label>
                  <input
                    type="number"
                    value={eventData.min_participants}
                    onChange={(e) => handleInputChange('min_participants', parseInt(e.target.value))}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá vé (VND) *
                  </label>
                  <input
                    type="number"
                    value={eventData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                    min="0"
                    step="1000"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại tiền tệ
                  </label>
                  <select
                    value={eventData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="VND">VND (Việt Nam Đồng)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn đồ uống
                  </label>
                  <select
                    value={eventData.drink_option || 'none'}
                    onChange={(e) => handleInputChange('drink_option', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">Không bao gồm đồ uống</option>
                    <option value="coffee">Coffee (miễn phí)</option>
                    <option value="coffee_paid">Coffee (có phí)</option>
                    <option value="tea">Trà (miễn phí)</option>
                    <option value="water">Nước lọc (miễn phí)</option>
                    <option value="soft_drink">Nước ngọt (có phí)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá đồ uống (VND)
                  </label>
                  <input
                    type="number"
                    value={eventData.drink_price || 0}
                    onChange={(e) => handleInputChange('drink_price', parseFloat(e.target.value))}
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    disabled={!eventData.drink_option || eventData.drink_option === 'none' || eventData.drink_option === 'coffee' || eventData.drink_option === 'tea' || eventData.drink_option === 'water'}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {eventData.drink_option === 'coffee' || eventData.drink_option === 'tea' || eventData.drink_option === 'water' ? 'Miễn phí' : 'Nhập giá nếu có phí'}
                  </p>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt giá vé</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Giá vé cơ bản</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {eventData.price.toLocaleString()} {eventData.currency}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Đồ uống</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {eventData.drink_option === 'none' ? 'Không có' : 
                       eventData.drink_option === 'coffee' ? 'Coffee (miễn phí)' :
                       eventData.drink_option === 'tea' ? 'Trà (miễn phí)' :
                       eventData.drink_option === 'water' ? 'Nước lọc (miễn phí)' :
                       eventData.drink_option === 'coffee_paid' ? `Coffee (+${eventData.drink_price?.toLocaleString() || 0} VND)` :
                       eventData.drink_option === 'soft_drink' ? `Nước ngọt (+${eventData.drink_price?.toLocaleString() || 0} VND)` : 'Không có'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Sức chứa</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {eventData.max_participants} người
                    </p>
                  </div>
                </div>
                
                {eventData.drink_option && eventData.drink_option !== 'none' && eventData.drink_price > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Tổng giá vé</p>
                      <p className="text-3xl font-bold text-green-600">
                        {(eventData.price + (eventData.drink_price || 0)).toLocaleString()} {eventData.currency}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Images & Media */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Hình ảnh & Media</h2>
                <p className="text-gray-600">Upload ảnh bìa, gallery và media cho sự kiện</p>
              </div>

              {/* Cover Image */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Ảnh bìa sự kiện</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {eventData.cover_image ? (
                    <div className="relative">
                      <img 
                        src={eventData.cover_image.startsWith('http') ? eventData.cover_image : `http://localhost:3001${eventData.cover_image}`} 
                        alt="Cover" 
                        className="max-h-64 mx-auto rounded-lg shadow-lg"
                        onError={(e) => {
                          console.error('Image load error:', eventData.cover_image);
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        onClick={() => removeImage(0, 'cover')}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Upload ảnh bìa cho sự kiện</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            console.log('Uploading cover image:', file.name);
                            const url = await handleImageUpload(file, 'cover');
                            if (url) {
                              console.log('Cover image uploaded successfully:', url);
                            }
                          }
                        }}
                        className="hidden"
                        id="cover-upload"
                      />
                      <label
                        htmlFor="cover-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Chọn ảnh bìa
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Thư viện ảnh</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {eventData.gallery_images?.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image.startsWith('http') ? image : `http://localhost:3001${image}`} 
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          console.error('Gallery image load error:', image);
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        onClick={() => removeImage(index, 'gallery')}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add more images button */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-blue-400 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (files.length > 0) {
                            console.log('Uploading gallery images:', files.length, 'files');
                            await handleMultipleImageUpload(files);
                          }
                        }}
                        className="hidden"
                        id="gallery-upload"
                      />
                      <label
                        htmlFor="gallery-upload"
                        className="text-sm text-gray-600 cursor-pointer hover:text-blue-600"
                      >
                        Thêm ảnh
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video & Audio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL (YouTube, Vimeo)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={eventData.video_url}
                      onChange={(e) => handleInputChange('video_url', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <button
                      type="button"
                      className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Youtube className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio Preview URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={eventData.audio_preview}
                      onChange={(e) => handleInputChange('audio_preview', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://soundcloud.com/..."
                    />
                    <button
                      type="button"
                      className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      <Music className="w-4 h-4" />
                    </button>
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
          )}

          {/* Step 5: Event Details */}
          {activeStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Chi tiết sự kiện</h2>
                <p className="text-gray-600">Thiết lập các thông tin chi tiết về sự kiện</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại sự kiện
                  </label>
                  <select
                    value={eventData.event_type}
                    onChange={(e) => handleInputChange('event_type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới hạn tuổi
                  </label>
                  <select
                    value={eventData.age_restriction}
                    onChange={(e) => handleInputChange('age_restriction', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Mọi lứa tuổi</option>
                    <option value="18+">18+</option>
                    <option value="21+">21+</option>
                    <option value="16+">16+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngôn ngữ
                  </label>
                  <select
                    value={eventData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                    <option value="both">Cả hai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức độ khó
                  </label>
                  <select
                    value={eventData.difficulty_level}
                    onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {difficultyLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Equipment & Amenities */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Thiết bị & Tiện nghi</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Thiết bị được cung cấp
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {equipmentOptions.map(equipment => {
                        const Icon = equipment.icon;
                        const isSelected = eventData.equipment_provided?.includes(equipment.value);
                        return (
                          <label key={equipment.value} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const current = eventData.equipment_provided || [];
                                if (e.target.checked) {
                                  handleInputChange('equipment_provided', [...current, equipment.value]);
                                } else {
                                  handleInputChange('equipment_provided', current.filter(item => item !== equipment.value));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">{equipment.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Thiết bị cần mang theo
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {equipmentOptions.map(equipment => {
                        const Icon = equipment.icon;
                        const isSelected = eventData.equipment_needed?.includes(equipment.value);
                        return (
                          <label key={equipment.value} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const current = eventData.equipment_needed || [];
                                if (e.target.checked) {
                                  handleInputChange('equipment_needed', [...current, equipment.value]);
                                } else {
                                  handleInputChange('equipment_needed', current.filter(item => item !== equipment.value));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">{equipment.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yêu cầu tham gia
                  </label>
                  <textarea
                    value={eventData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: Cần có kinh nghiệm cơ bản về guitar, mang theo guitar riêng..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cần mang theo
                  </label>
                  <textarea
                    value={eventData.what_to_bring}
                    onChange={(e) => handleInputChange('what_to_bring', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: Guitar, notebook, bút, nước uống..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Organizer Info */}
          {activeStep === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thông tin tổ chức</h2>
                <p className="text-gray-600">Thông tin về người/đơn vị tổ chức sự kiện</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên người tổ chức *
                  </label>
                  <input
                    type="text"
                    value={eventData.organizer_name}
                    onChange={(e) => handleInputChange('organizer_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tên cá nhân hoặc tổ chức"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email liên hệ *
                  </label>
                  <input
                    type="email"
                    value={eventData.organizer_email}
                    onChange={(e) => handleInputChange('organizer_email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={eventData.organizer_phone}
                    onChange={(e) => handleInputChange('organizer_phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+84 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website/Social
                  </label>
                  <input
                    type="url"
                    value={eventData.organizer_website || ''}
                    onChange={(e) => handleInputChange('organizer_website', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://website.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới thiệu về người tổ chức
                </label>
                <textarea
                  value={eventData.organizer_bio}
                  onChange={(e) => handleInputChange('organizer_bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Giới thiệu về kinh nghiệm, chuyên môn, thành tích..."
                />
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Liên kết mạng xã hội</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <Facebook className="w-5 h-5 text-blue-600 mt-3" />
                    <input
                      type="url"
                      value={eventData.facebook_event || ''}
                      onChange={(e) => handleInputChange('facebook_event', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Facebook Event URL"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Instagram className="w-5 h-5 text-pink-600 mt-3" />
                    <input
                      type="url"
                      value={eventData.instagram_post || ''}
                      onChange={(e) => handleInputChange('instagram_post', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Instagram Post URL"
                    />
                  </div>
                </div>
              </div>

              {/* Policies */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Chính sách</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chính sách hủy
                    </label>
                    <textarea
                      value={eventData.cancellation_policy}
                      onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Quy định về việc hủy sự kiện..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chính sách hoàn tiền
                    </label>
                    <textarea
                      value={eventData.refund_policy}
                      onChange={(e) => handleInputChange('refund_policy', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Quy định về hoàn tiền..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Review & Publish */}
          {activeStep === 7 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Xem lại & Xuất bản</h2>
                <p className="text-gray-600">Kiểm tra thông tin và xuất bản sự kiện</p>
              </div>

              {/* Event Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt sự kiện</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tên sự kiện</p>
                    <p className="font-medium">{eventData.title || 'Chưa nhập'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Thể loại</p>
                    <p className="font-medium">{categories.find(c => c.value === eventData.category)?.label || 'Chưa chọn'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày tổ chức</p>
                    <p className="font-medium">{eventData.event_date || 'Chưa chọn'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Thời gian</p>
                    <p className="font-medium">{eventData.start_time} - {eventData.end_time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Địa điểm</p>
                    <p className="font-medium">{eventData.venue_name || eventData.address || 'Chưa nhập'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sức chứa</p>
                    <p className="font-medium">{eventData.max_participants} người</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Giá vé</p>
                    <p className="font-medium">
                      {eventData.price.toLocaleString()} {eventData.currency}
                      {eventData.drink_option && eventData.drink_option !== 'none' && eventData.drink_price > 0 && (
                        <span className="text-amber-600 ml-1">
                          (+{eventData.drink_price.toLocaleString()} đồ uống)
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Người tổ chức</p>
                    <p className="font-medium">{eventData.organizer_name || 'Chưa nhập'}</p>
                  </div>
                </div>
              </div>

              {/* Publishing Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Tùy chọn xuất bản</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={eventData.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-700">Sự kiện nổi bật (hiển thị ở đầu trang)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={eventData.promoted}
                      onChange={(e) => handleInputChange('promoted', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-700">Quảng cáo sự kiện (hiển thị ở vị trí đặc biệt)</span>
                  </label>
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái xuất bản
                </label>
                <select
                  value={eventData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Lưu nháp</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="published">Xuất bản ngay</option>
                </select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={activeStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <X className="w-4 h-4" />
              Quay lại
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handleInputChange('status', 'draft')}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Lưu nháp
              </button>
              
              {activeStep < steps.length ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tiếp theo
                  <Plus className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Tạo sự kiện
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Chọn vị trí trên bản đồ</h3>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="h-full p-4">
              <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">Map Picker</h4>
                  <p className="text-gray-500 mb-4">Tính năng chọn vị trí trên bản đồ sẽ được tích hợp với Google Maps API</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        // Mock location selection
                        const mockLat = 21.0285 + (Math.random() - 0.5) * 0.1;
                        const mockLng = 105.8542 + (Math.random() - 0.5) * 0.1;
                        handleMapClick(mockLat, mockLng);
                        setShowMapPicker(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Chọn vị trí mẫu
                    </button>
                    <button
                      onClick={() => setShowMapPicker(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 ml-2"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
