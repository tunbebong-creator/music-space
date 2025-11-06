import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL, getUploadUrl } from "@/config/api.js";

// Component để hiển thị ảnh với retry logic khi lỗi
function SpaceImage({ src, alt, className, onLoad, onError }) {
  const [imageError, setImageError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const MAX_RETRIES = 1; // Chỉ retry 1 lần với cùng URL (để xử lý lỗi tạm thời)
  
  const handleImageError = (e) => {
    // Nếu chưa retry và có thể retry, thử lại với cùng URL (có thể là lỗi tạm thời)
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      // Force reload bằng cách thay đổi src tạm thời
      e.target.src = '';
      setTimeout(() => {
        e.target.src = src;
      }, 500);
    } else {
      // Đã hết retry, hiển thị placeholder
      setImageError(true);
      if (onError) onError(e);
      // Ngăn infinite loop và ẩn ảnh lỗi
      e.target.onerror = null;
      e.target.style.display = 'none';
    }
  };
  
  const handleImageLoad = (e) => {
    setImageError(false);
    e.target.style.display = '';
    if (onLoad) onLoad(e);
  };
  
  // Reset when src prop changes
  React.useEffect(() => {
    setImageError(false);
    setRetryCount(0);
  }, [src]);
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
}

export default function SpaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = React.useState(false);
  const [bookingData, setBookingData] = React.useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  const { data: space, isLoading, error } = useQuery({
    queryKey: ['space', id],
    queryFn: async () => {
      const apiBase = API_BASE_URL.replace('/api', '');
      const response = await fetch(`${apiBase}/api/spaces/${id}`);
      if (!response.ok) throw new Error('Failed to fetch space details');
      return response.json();
    }
  });

  const handleBooking = async () => {
    try {
      const totalHours = parseInt(bookingData.endTime.split(':')[0]) - parseInt(bookingData.startTime.split(':')[0]);
      const totalPrice = totalHours * parseFloat(space.price_per_hour);
      
      alert(`Đặt chỗ thành công!\n\nKhông gian: ${space.name}\nNgày: ${bookingData.date}\nThời gian: ${bookingData.startTime} - ${bookingData.endTime}\nTổng tiền: ${totalPrice.toLocaleString('vi-VN')} ${space.currency || 'VND'}\n\nChúng tôi sẽ liên hệ với bạn qua email: ${bookingData.email}`);
      setBookingData({ name: '', email: '', phone: '', date: '', startTime: '', endTime: '', notes: '' });
      setShowBookingModal(false);
    } catch (error) {
      console.error('❌ Booking error:', error);
      alert('Có lỗi xảy ra khi đặt chỗ. Vui lòng thử lại!');
    }
  };

  if (isLoading) return <div className="text-center py-10">Đang tải...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Lỗi: {error.message}</div>;
  if (!space) return <div className="text-center py-10">Không tìm thấy không gian.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white shadow-lg py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center text-white hover:text-blue-100 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Quay lại
          </button>
          <h1 className="text-2xl font-bold">{space.name}</h1>
          <div></div> {/* Placeholder for alignment */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Cover Image */}
            <div className="h-96 relative overflow-hidden rounded-2xl shadow-lg mb-8">
              {space.images && space.images.length > 0 ? (
                <>
                  <SpaceImage 
                    src={getUploadUrl(space.images[0])} 
                    alt={space.name}
                    className="w-full h-full object-cover"
                    onLoad={() => {
                    }}
                    onError={(e) => {
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
                    <div className="text-8xl text-white opacity-80">🏢</div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <div className="text-8xl text-white opacity-80">🏢</div>
                </div>
              )}
              <div className="absolute top-6 left-6 bg-blue-500 text-white px-4 py-2 rounded-full text-lg font-semibold">
                {space.city}
              </div>
            </div>

            {/* Space Description */}
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Mô tả không gian</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-8">{space.description}</p>

            {/* Gallery Images */}
            {space.images && space.images.length > 1 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Hình ảnh</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {space.images.slice(1).map((image, index) => (
                    <SpaceImage 
                      key={index}
                      src={getUploadUrl(image)} 
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-sm"
                      onLoad={() => {
                      }}
                      onError={(e) => {
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {space.amenities && space.amenities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Tiện ích</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {space.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center bg-blue-50 rounded-lg p-3">
                      <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {space.equipment && space.equipment.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Thiết bị</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {space.equipment.map((equipment, index) => (
                    <div key={index} className="flex items-center bg-purple-50 rounded-lg p-3">
                      <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      <span className="text-gray-700">{equipment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google Maps */}
            {space.google_maps_url && (
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Vị trí</h3>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  {/* Extract location name from URL or use address */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-lg font-semibold text-gray-800">
                        {(() => {
                          // Extract location from Google Maps URL
                          if (space.address) {
                            return space.address;
                          }
                          // Try to extract from URL
                          try {
                            const url = new URL(space.google_maps_url);
                            // For /place/ URLs
                            if (url.pathname.includes('/place/')) {
                              const placePart = url.pathname.split('/place/')[1];
                              if (placePart) {
                                const locationName = decodeURIComponent(placePart.split('/')[0].replace(/\+/g, ' '));
                                return locationName || 'Vị trí trên bản đồ';
                              }
                            }
                          } catch (e) {
                            // If URL parsing fails, try simple string extraction
                            const placeMatch = space.google_maps_url.match(/\/place\/([^/?]+)/);
                            if (placeMatch) {
                              return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
                            }
                          }
                          return 'Vị trí trên bản đồ';
                        })()}
                      </p>
                    </div>
                    {(space.address || space.city) && (
                      <p className="text-gray-600 ml-7">
                        {space.address && `${space.address}`}
                        {space.address && space.city && ', '}
                        {space.city}
                      </p>
                    )}
                  </div>
                  
                  {/* Google Maps Embed */}
                  {(() => {
                    // Convert Google Maps URL to embed format
                    let embedUrl = space.google_maps_url;
                    const isShortUrl = embedUrl.includes('goo.gl') || embedUrl.includes('maps.app.goo.gl');
                    
                    if (isShortUrl) {
                      // Short URLs cannot be embedded, show link only
                      return null;
                    }
                    
                    if (embedUrl.includes('/place/')) {
                      // Convert to embed format
                      embedUrl = embedUrl.replace(/\/maps\/place\//, '/maps/embed/place/');
                    } else if (embedUrl.includes('/@')) {
                      // For coordinates format: /@lat,lng,zoom
                      embedUrl = embedUrl.replace(/\/maps\//, '/maps/embed/');
                    } else if (!embedUrl.includes('/embed/')) {
                      // Try to convert general maps URLs
                      embedUrl = embedUrl.replace(/\/maps\//, '/maps/embed/');
                    }
                    
                    return (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <iframe
                          src={embedUrl}
                          width="100%"
                          height="450"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="rounded-lg"
                        />
                      </div>
                    );
                  })()}
                  
                  <a 
                    href={space.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Xem trên Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Thông tin không gian</h3>
              <div className="space-y-5 mb-8">
                <div className="flex items-center text-gray-700">
                  <svg className="w-6 h-6 mr-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <div>
                    <p className="font-semibold">Địa chỉ</p>
                    <p>{space.address}</p>
                    <p className="text-sm text-gray-500">{space.city}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-6 h-6 mr-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <div>
                    <p className="font-semibold">Sức chứa</p>
                    <p>Tối đa {space.capacity} người</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-6 h-6 mr-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <div>
                    <p className="font-semibold">Chủ sở hữu</p>
                    <p>{space.owner_name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Giá thuê:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {parseFloat(space.price_per_hour).toLocaleString('vi-VN')} {space.currency || 'VND'}/giờ
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Đặt chỗ ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && space && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Đặt chỗ không gian</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Space Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">{space.name}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{space.address}, {space.city}</span>
                  <span className="font-semibold text-green-600">
                    {parseFloat(space.price_per_hour).toLocaleString('vi-VN')} {space.currency || 'VND'}/giờ
                  </span>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={(e) => { e.preventDefault(); handleBooking(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                    <input type="text" required value={bookingData.name} onChange={(e) => setBookingData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập họ và tên" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input type="email" required value={bookingData.email} onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập email" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                    <input type="tel" required value={bookingData.phone} onChange={(e) => setBookingData(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Nhập số điện thoại" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sử dụng *</label>
                    <input type="date" required value={bookingData.date} onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giờ bắt đầu *</label>
                    <input type="time" required value={bookingData.startTime} onChange={(e) => setBookingData(prev => ({ ...prev, startTime: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giờ kết thúc *</label>
                    <input type="time" required value={bookingData.endTime} onChange={(e) => setBookingData(prev => ({ ...prev, endTime: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                  <textarea value={bookingData.notes} onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ghi chú thêm (tùy chọn)" />
                </div>

                {/* Total Price */}
                {bookingData.startTime && bookingData.endTime && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {(parseInt(bookingData.endTime.split(':')[0]) - parseInt(bookingData.startTime.split(':')[0])) * parseFloat(space.price_per_hour)} {space.currency || 'VND'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                    Xác nhận đặt chỗ
                  </button>
                  <button type="button" onClick={() => setShowBookingModal(false)} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}













