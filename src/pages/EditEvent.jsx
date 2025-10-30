import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Upload, 
  X, 
  MapPin, 
  Users, 
  DollarSign, 
  Phone, 
  Mail, 
  User,
  Globe,
  Settings,
  Camera,
  Calendar,
  Clock,
  Ticket
} from "lucide-react";

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = React.useState(false);
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [coverImage, setCoverImage] = React.useState(null);
  const [eventImages, setEventImages] = React.useState([]);
  const [drinkItems, setDrinkItems] = React.useState([]);
  const [endTime, setEndTime] = React.useState('');

  const buildImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://localhost:3001/uploads')) return url;
    if (url.startsWith('/uploads/')) return `http://localhost:3001${url}`;
    return `http://localhost:3001/uploads/events/${url}`;
  };
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    date: '',
    time: '',
    category: 'workshop',
    capacity: '',
    price: '',
    location: '',
    address: '',
    city: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    google_maps_url: '',
    space_id: '',
    drink_option: 'none',
    drink_price: ''
  });


  // Load event data
  React.useEffect(() => {
    const loadEventData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No admin token found. Please login as admin.');
        }

        const response = await fetch(`http://localhost:3001/api/events/${id}`);

        if (response.ok) {
          const event = await response.json();
          const eventDateIso = (event.event_date || event.date || '').toString();
          const derivedDate = eventDateIso ? eventDateIso.split('T')[0] : '';
          setFormData({
            title: event.title || '',
            description: event.description || '',
            date: derivedDate,
            time: event.time || event.start_time || '',
            category: event.category || 'workshop',
            capacity: event.max_participants || event.capacity || '',
            price: parseFloat(event.price || 0) || '',
            location: event.location || '',
            address: event.address || '',
            city: event.city || '',
            contact_name: event.contact_name || '',
            contact_email: event.contact_email || '',
            contact_phone: event.contact_phone || '',
            google_maps_url: event.google_maps_url || '',
            space_id: event.space_id || '',
            drink_option: event.drink_option || 'none',
            drink_price: event.drink_price || ''
          });
          setEndTime(event.end_time || '');
          if (Array.isArray(event.drink_items)) {
            setDrinkItems(event.drink_items);
          } else if (event.drink_items && typeof event.drink_items === 'string') {
            try {
              const parsed = JSON.parse(event.drink_items);
              if (Array.isArray(parsed)) setDrinkItems(parsed);
            } catch (_) {}
          }
          
          if (event.cover_image) setCoverImage(event.cover_image);
          if (Array.isArray(event.gallery_images)) setEventImages(event.gallery_images);
        } else {
          throw new Error('Failed to load event data');
        }
      } catch (error) {
        console.error('Error loading event:', error);
        alert('Không thể tải dữ liệu event: ' + error.message);
        navigate('/Admin');
      }
    };

    if (id) {
      loadEventData();
    }
  }, [id, navigate]);

  // Upload image function
  const uploadImage = async (file, type = 'events') => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  // Handle event image upload
  const handleEventImageUpload = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setUploadingImages(true);
      const uploadPromises = Array.from(files).map(file => uploadImage(file, 'events'));
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(url => url !== null);
      if (validUrls.length > 0) {
        setEventImages(prev => [...prev, ...validUrls]);
      }
      setUploadingImages(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Drink menu helpers
  const addDrinkItem = () => {
    setDrinkItems(prev => [...prev, { name: '', price: '' }]);
  };
  const updateDrinkItem = (index, key, value) => {
    setDrinkItems(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };
  const removeDrinkItem = (index) => {
    setDrinkItems(prev => prev.filter((_, i) => i !== index));
  };
  const applyDrinkPreset = (preset) => {
    if (preset === 'basic_coffee') {
      setDrinkItems([
        { name: 'Cà phê đen', price: '30000' },
        { name: 'Cà phê sữa', price: '35000' }
      ]);
    } else if (preset === 'basic_tea') {
      setDrinkItems([
        { name: 'Trà chanh', price: '25000' },
        { name: 'Trà đào', price: '35000' }
      ]);
    } else if (preset === 'soft_drink') {
      setDrinkItems([
        { name: 'Coca', price: '20000' },
        { name: 'Sprite', price: '20000' },
        { name: 'Nước suối', price: '10000' }
      ]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizeTime = (t) => {
        if (!t) return '';
        const parts = String(t).split(':');
        if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
        return t;
      };

      const startTimeNormalized = normalizeTime(formData.time);
      const endTimeNormalized = normalizeTime(endTime);
      const eventDateIso = formData.date ? `${formData.date}T${startTimeNormalized}` : '';

      const ensureAdminToken = async (forceRefresh = false) => {
        let token = localStorage.getItem('adminToken');
        if (!token || forceRefresh) {
          try {
            const tRes = await fetch('http://localhost:3001/api/generate-admin-token', { method: 'POST' });
            if (tRes.ok) {
              const tData = await tRes.json();
              token = tData.token;
              localStorage.setItem('adminToken', token);
              localStorage.setItem('user_data', JSON.stringify(tData.user || { role: 'admin' }));
            }
          } catch (_) {}
        }
        return token;
      };

      // Derive tags from drink option to persist drink status even if backend lacks columns
      const derivedTags = [];
      if (formData.drink_option === 'free') derivedTags.push('Đồ uống miễn phí');
      if (formData.drink_option === 'paid') derivedTags.push('Đồ uống có phí');

      const eventData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        price: parseFloat(formData.price) || 0,
        space_id: formData.space_id ? parseInt(formData.space_id) : null,
        cover_image: coverImage || null,
        gallery_images: eventImages,
        organizer_id: 1, // Default to admin for now
        event_date: eventDateIso,
        start_time: startTimeNormalized || null,
        end_time: endTimeNormalized || null,
        max_participants: parseInt(formData.capacity),
        duration_hours: 2, // Default duration
        drink_price: parseFloat(formData.drink_price) || 0,
        drink_items: drinkItems,
        tags: derivedTags
      };

      let token = await ensureAdminToken();
      
      console.log('🔍 Debug - Token:', token);
      console.log('🔍 Debug - Event data:', eventData);
      
      const submit = async (jwt) => fetch(`http://localhost:3001/api/admin/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(eventData)
      });
      let response = await submit(token);
      
      console.log('🔍 Debug - Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          token = await ensureAdminToken(true);
          response = await submit(token);
          if (response.ok) {
            const result = await response.json();
            console.log('🔍 Debug - Success response:', result);
            alert('Event đã được cập nhật thành công!');
            navigate('/Admin');
            return;
          }
        }
        const errorText = await response.text();
        console.log('🔍 Debug - Error response:', errorText);
        throw new Error(`Failed to update event: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🔍 Debug - Success response:', result);
      alert('Event đã được cập nhật thành công!');
      navigate('/Admin');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Có lỗi xảy ra khi cập nhật event: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white shadow-lg py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/Admin')}
              className="flex items-center text-white hover:text-blue-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Quay lại Admin
            </button>
            <h1 className="text-2xl font-bold">Chỉnh sửa Event</h1>
            <div></div> {/* Placeholder for alignment */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <Calendar className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Thông tin cơ bản</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Event *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên sự kiện"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại Event *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="workshop">Workshop</option>
                  <option value="acoustic">Acoustic</option>
                  <option value="talk">Talkshow</option>
                  <option value="performance">Biểu diễn</option>
                  <option value="concert">Concert</option>
                  <option value="jam">Jam Session</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mô tả chi tiết về sự kiện, nội dung, diễn giả..."
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Thời gian & Ngày</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày tổ chức *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ bắt đầu *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giờ kết thúc
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Pricing */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <DollarSign className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Sức chứa & Giá vé</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sức chứa *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Số người tối đa"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá vé (VNĐ)
                </label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0 = Miễn phí"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <MapPin className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Địa điểm</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên địa điểm
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tên địa điểm tổ chức"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thành phố *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập thành phố"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ chi tiết *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ chi tiết"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu đồ uống
                </label>
                <select
                  name="drink_option"
                  value={formData.drink_option}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">Không có đồ uống</option>
                  <option value="free">Đồ uống miễn phí</option>
                  <option value="paid">Đồ uống có phí</option>
                </select>
              </div>
              
              {formData.drink_option === 'paid' && (
                <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá đồ uống mặc định (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="drink_price"
                    value={formData.drink_price}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ví dụ 20000"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => applyDrinkPreset('basic_coffee')} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Preset: Cafe cơ bản</button>
                    <button type="button" onClick={() => applyDrinkPreset('basic_tea')} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Preset: Trà cơ bản</button>
                    <button type="button" onClick={() => applyDrinkPreset('soft_drink')} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Preset: Soft drink</button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">Danh sách đồ uống</label>
                      <button type="button" onClick={addDrinkItem} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Thêm món</button>
                    </div>
                    {drinkItems.length === 0 && (
                      <p className="text-sm text-gray-500">Chưa có món nào. Thêm món hoặc chọn Preset.</p>
                    )}
                    {drinkItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateDrinkItem(index, 'name', e.target.value)}
                          placeholder="Tên đồ uống"
                          className="md:col-span-4 px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateDrinkItem(index, 'price', e.target.value)}
                          placeholder="Giá (VNĐ)"
                          className="md:col-span-1 px-4 py-2 border rounded-lg"
                        />
                        <button type="button" onClick={() => removeDrinkItem(index)} className="md:col-span-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Xóa</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Google Maps
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    name="google_maps_url"
                    value={formData.google_maps_url}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <Phone className="w-6 h-6 text-orange-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Thông tin liên hệ</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên người liên hệ *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tên người liên hệ"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email liên hệ *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email liên hệ"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Số điện thoại liên hệ"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <Camera className="w-6 h-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Hình ảnh sự kiện</h2>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh bìa (Cover Image) *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {coverImage ? (
                  <div className="relative inline-block">
                    <img
                      src={buildImageUrl(coverImage)}
                      alt="Cover"
                      className="w-64 h-40 object-cover rounded-lg shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage(null)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label htmlFor="cover-image" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-700">Chọn ảnh bìa</span>
                  <p className="text-sm text-gray-500 mt-2">Ảnh đại diện cho sự kiện</p>
                </label>
                  </>
                )}
                <input
                  type="file"
                  id="cover-image"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setUploadingImages(true);
                      const url = await uploadImage(file, 'events');
                      if (url) {
                        setCoverImage(url);
                      }
                      setUploadingImages(false);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thư viện ảnh (Gallery Images)
              </label>
            
            {eventImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {eventImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={buildImageUrl(image)} 
                      alt={`Event ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setEventImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label htmlFor="event-images" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-700">Tải lên thư viện ảnh</span>
                  <p className="text-sm text-gray-500 mt-2">Kéo thả hoặc click để chọn nhiều ảnh</p>
                </label>
                <input
                  type="file"
                  id="event-images"
                  accept="image/*"
                  multiple
                  onChange={handleEventImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {uploadingImages && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-blue-700">Đang upload ảnh...</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/Admin')}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
