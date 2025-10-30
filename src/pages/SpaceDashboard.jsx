
import React from "react";
import { customAPI } from "@/api/customClient";
import { Core } from "@/api/integrations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Calendar, Users, Plus, Edit2, Trash2, Upload, Save, X, Eye, CheckCircle, Clock, XCircle as XIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function SpaceDashboard() {
  const [user, setUser] = React.useState(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingSpace, setEditingSpace] = React.useState(null);
  const [imageUploading, setImageUploading] = React.useState(false);
  const [spaceForm, setSpaceForm] = React.useState({
    name: "",
    description: "",
    address: "",
    city: "Hà Nội",
    latitude: null,
    longitude: null,
    phone: "",
    capacity: 20,
    images: [],
    amenities: [],
    space_type: "cafe",
    price_range: "medium"
  });

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await customAPI.auth.me();
        if (!currentUser.space_owner_verified) {
          window.location.href = "/";
        }
        setUser(currentUser);
        setSpaceForm(prev => ({ ...prev, owner_name: currentUser.full_name || currentUser.email }));
      } catch (error) {
        window.location.href = "/";
      }
    };
    loadUser();
  }, []);

  const { data: mySpaces } = useQuery({
    queryKey: ['my-spaces', user?.email],
    queryFn: () => customAPI.entities.Space.find({ created_by: user.email }),
    initialData: [],
    enabled: !!user,
  });

  const { data: spaceBookings } = useQuery({
    queryKey: ['space-bookings'],
    queryFn: () => customAPI.entities.Booking.find(),
    initialData: [],
  });

  const createSpaceMutation = useMutation({
    mutationFn: (data) => customAPI.entities.Space.create({ ...data, owner_name: user.full_name || user.email }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-spaces']);
      setShowCreateModal(false);
      setSpaceForm({ name: "", description: "", address: "", city: "Hà Nội", latitude: null, longitude: null, phone: "", capacity: 20, images: [], amenities: [], space_type: "cafe", price_range: "medium" });
    },
  });

  const updateSpaceMutation = useMutation({
    mutationFn: ({ id, data }) => customAPI.entities.Space.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-spaces']);
      setEditingSpace(null);
      setShowCreateModal(false);
    },
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: (id) => customAPI.entities.Space.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['my-spaces']),
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageUploading(true);
      try {
        const { file_url } = await Core.UploadFile({ file });
        setSpaceForm(prev => ({ ...prev, images: [...prev.images, file_url] }));
      } finally {
        setImageUploading(false);
      }
    }
  };

  const geocodeAddress = async (address, city) => {
    try {
      const query = `${address}, ${city}, Vietnam`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      if (data && data[0]) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalForm = { ...spaceForm };
    if (!spaceForm.latitude || !spaceForm.longitude) {
      const coords = await geocodeAddress(spaceForm.address, spaceForm.city);
      if (coords) {
        finalForm = { ...finalForm, ...coords };
      }
    }

    if (editingSpace) {
      updateSpaceMutation.mutate({ id: editingSpace.id, data: finalForm });
    } else {
      createSpaceMutation.mutate(finalForm);
    }
  };

  const handleEdit = (space) => {
    window.location.href = `/EditSpace/${space.id}`;
  };

  const removeImage = (index) => {
    setSpaceForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (amenity) => {
    setSpaceForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (!user) return null;

  const allAmenities = ["WiFi", "Âm thanh chuyên nghiệp", "Đồ uống miễn phí", "Parking", "Điều hòa", "Máy chiếu"];

  return (
    <div className="min-h-screen py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🏠 Space Dashboard</h1>
            <p className="text-gray-600">Quản lý không gian của bạn - Full Control</p>
          </div>
          <button
            onClick={() => window.location.href = '/AddSpace'}
            className="px-6 py-3 rounded-full bg-teal-600 text-white font-medium hover:bg-teal-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Thêm không gian
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6">
            <MapPin className="w-8 h-8 text-teal-600 mb-3" />
            <div className="text-3xl font-bold text-gray-800 mb-1">{mySpaces.length}</div>
            <p className="text-gray-600">Không gian</p>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <Calendar className="w-8 h-8 text-teal-600 mb-3" />
            <div className="text-3xl font-bold text-gray-800 mb-1">{spaceBookings.length}</div>
            <p className="text-gray-600">Đặt chỗ</p>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <CheckCircle className="w-8 h-8 text-teal-600 mb-3" />
            <div className="text-3xl font-bold text-gray-800 mb-1">
              {mySpaces.filter(s => s.approved).length}
            </div>
            <p className="text-gray-600">Đã duyệt</p>
          </div>
        </div>

        {/* My Spaces */}
        <div className="bg-white rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Không gian của tôi</h2>
          {mySpaces.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có không gian nào</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {mySpaces.map((space) => (
                <div key={space.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  {space.images && space.images[0] && (
                    <div className="h-48">
                      <img src={space.images[0]} alt={space.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-800">{space.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                        space.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {space.approved ? (
                          <><CheckCircle className="w-3 h-3" /> Đã duyệt</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Chờ duyệt</>
                        )}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{space.address}</p>
                    <p className="text-xs text-gray-500 mb-3">👥 {space.capacity} chỗ</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(space)}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2 text-sm font-medium">
                        <Edit2 className="w-4 h-4" />
                        Sửa
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Xóa không gian này?')) {
                            deleteSpaceMutation.mutate(space.id);
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookings */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Đặt chỗ gần đây</h2>
          {spaceBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có đặt chỗ nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {spaceBookings.slice(0, 10).map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{booking.name}</h3>
                      <p className="text-sm text-gray-600">{booking.email}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                        <span>📅 {format(new Date(booking.date), "dd/MM/yyyy", { locale: vi })}</span>
                        <span>⏰ {booking.time}</span>
                        <span>👥 {booking.guests} người</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                      booking.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {booking.status === "confirmed" ? "Đã xác nhận" :
                       booking.status === "pending" ? "Chờ xác nhận" :
                       "Đã hủy"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateModal(false)}>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">
                    {editingSpace ? 'Chỉnh sửa không gian' : 'Thêm không gian mới'}
                  </h2>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên không gian *</label>
                    <input
                      type="text"
                      value={spaceForm.name}
                      onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500"
                      placeholder="VD: Music Space Hòa Lạc"
                      required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={spaceForm.description}
                      onChange={(e) => setSpaceForm({ ...spaceForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500"
                      placeholder="Giới thiệu về không gian của bạn..." />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ *</label>
                    <input
                      type="text"
                      value={spaceForm.address}
                      onChange={(e) => setSpaceForm({ ...spaceForm, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500"
                      placeholder="VD: Khu Công nghệ cao Hòa Lạc"
                      required />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố *</label>
                      <select
                        value={spaceForm.city}
                        onChange={(e) => setSpaceForm({ ...spaceForm, city: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500"
                      >
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Huế">Huế</option>
                        <option value="Nha Trang">Nha Trang</option>
                        <option value="Đà Lạt">Đà Lạt</option>
                        <option value="Vũng Tàu">Vũng Tàu</option>
                        <option value="Quy Nhơn">Quy Nhơn</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loại không gian</label>
                      <select
                        value={spaceForm.space_type}
                        onChange={(e) => setSpaceForm({ ...spaceForm, space_type: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500"
                      >
                        <option value="cafe">Café</option>
                        <option value="studio">Studio</option>
                        <option value="event_hall">Hội trường</option>
                        <option value="outdoor">Ngoài trời</option>
                        <option value="gallery">Gallery</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vĩ độ (tùy chọn)</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={spaceForm.latitude || ""}
                        onChange={(e) => setSpaceForm({ ...spaceForm, latitude: parseFloat(e.target.value) || null })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500"
                        placeholder="VD: 21.0285" />
                      <p className="text-xs text-gray-500 mt-1">Để trống, hệ thống tự động xác định</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kinh độ (tùy chọn)</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={spaceForm.longitude || ""}
                        onChange={(e) => setSpaceForm({ ...spaceForm, longitude: parseFloat(e.target.value) || null })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500"
                        placeholder="VD: 105.8542" />
                      <p className="text-xs text-gray-500 mt-1">Để trống, hệ thống tự động xác định</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        value={spaceForm.phone}
                        onChange={(e) => setSpaceForm({ ...spaceForm, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500"
                        placeholder="0862 899 982" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sức chứa</label>
                      <input
                        type="number"
                        value={spaceForm.capacity}
                        onChange={(e) => setSpaceForm({ ...spaceForm, capacity: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500"
                        min="1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mức giá</label>
                      <select
                        value={spaceForm.price_range}
                        onChange={(e) => setSpaceForm({ ...spaceForm, price_range: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-500">
                        <option value="low">$</option>
                        <option value="medium">$$</option>
                        <option value="high">$$$</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tiện ích</label>
                    <div className="flex flex-wrap gap-2">
                      {allAmenities.map((amenity) => (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            spaceForm.amenities.includes(amenity)
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}>
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                    <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                      <Upload className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">
                        {imageUploading ? "Đang tải..." : "Tải ảnh lên"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                        className="hidden" />
                    </label>
                    {spaceForm.images.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {spaceForm.images.map((img, i) => (
                          <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden group">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <XIcon className="w-6 h-6 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={createSpaceMutation.isPending || updateSpaceMutation.isPending || imageUploading}
                      className="flex-1 px-6 py-3 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {(createSpaceMutation.isPending || updateSpaceMutation.isPending) ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          {editingSpace ? 'Cập nhật' : 'Tạo mới'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
