import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { customAPI } from "@/api/customClient";
import { Core } from "@/api/integrations";
import { API_BASE_URL, getUploadUrl } from "@/config/api.js";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = React.useState(false);
  const [isBooking, setIsBooking] = React.useState(false);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [bookingData, setBookingData] = React.useState({
    name: '',
    email: '',
    phone: '',
    quantity: 1,
    notes: ''
  });

  const buildImageUrl = (url) => {
    if (!url) return null;
    return getUploadUrl(url);
  };

  // Fetch event details
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      console.log('🔍 Fetching event:', id);
      const apiBase = API_BASE_URL.replace('/api', '');
      console.log('🔍 API Base URL:', apiBase);
      const fullUrl = `${apiBase}/api/events/${id}`;
      console.log('🔍 Full URL:', fullUrl);
      const response = await fetch(fullUrl);
      console.log('🔍 Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Event fetch error:', errorText);
        throw new Error('Failed to fetch event');
      }
      const data = await response.json();
      console.log('✅ Event fetched:', data);
      return data;
    }
  });

  // Normalize drink data from various possible shapes
  const drinkItems = React.useMemo(() => {
    if (!event) return [];
    const raw = event.drink_items ?? event.drinks ?? event.drinkMenu ?? null;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [event]);

  const drinkPrice = React.useMemo(() => {
    if (!event) return null;
    const price = event.drink_price ?? event.drinks_price ?? event.average_drink_price ?? null;
    if (price == null) return null;
    const num = typeof price === 'string' ? parseFloat(price) : Number(price);
    return Number.isFinite(num) ? num : null;
  }, [event]);

  const drinkStatus = React.useMemo(() => {
    if (!event) return null;
    const opt = (event.drink_option || event.drinkStatus || '').toString().toLowerCase();
    if (opt.includes('free') || opt.includes('miễn')) return 'Miễn phí';
    if (opt.includes('paid') || opt.includes('mất') || opt.includes('thu phí') || opt.includes('có phí') || opt.includes('co phi')) return 'Mất phí';
    // Try read from tags
    let tags = event.tags;
    if (typeof tags === 'string') {
      try { const parsed = JSON.parse(tags); if (Array.isArray(parsed)) tags = parsed; } catch {}
    }
    if (Array.isArray(tags)) {
      const lower = tags.map(t => String(t).toLowerCase());
      if (lower.some(t => t.includes('miễn phí') || t.includes('free'))) return 'Miễn phí';
      if (lower.some(t => t.includes('có phí') || t.includes('thu phí') || t.includes('paid'))) return 'Mất phí';
    }
    if (drinkPrice === 0) return 'Miễn phí';
    if (typeof drinkPrice === 'number' && drinkPrice > 0) return 'Mất phí';
    if (Array.isArray(drinkItems) && drinkItems.some(d => Number(d.price) > 0)) return 'Mất phí';
    if (Array.isArray(drinkItems) && drinkItems.length > 0) return 'Có đồ uống';
    return null;
  }, [event, drinkPrice, drinkItems]);

  // Keyboard navigation for gallery lightbox
  React.useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => {
        const total = (event?.gallery_images || []).length;
        return total ? (prev + 1) % total : 0;
      });
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => {
        const total = (event?.gallery_images || []).length;
        return total ? (prev - 1 + total) % total : 0;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, event]);

  // Handle booking
  const handleBooking = async () => {
    if (isBooking) return; // Prevent double submission
    
    try {
      if (!event) {
        alert('Không tìm thấy thông tin sự kiện. Vui lòng thử lại!');
        return;
      }

      // Validate form data
      if (!bookingData.name || !bookingData.email || !bookingData.phone) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
      }

      setIsBooking(true);

      // Check if user is logged in (optional for booking)
      const token = localStorage.getItem('auth_token');
      const me = token ? await customAPI.auth.me().catch(() => null) : null;
      console.log('🔍 User info:', me);
      
      const payload = {
        event_id: event.id,
        user_id: me?.id || null,
        quantity: bookingData.quantity,
        total_price: String(Number(event.price || 0) * Number(bookingData.quantity || 1)),
        customer_email: bookingData.email,
        customer_name: bookingData.name,
        customer_phone: bookingData.phone,
        payment_method: 'Thanh toán tại sự kiện',
        status: 'pending',
        booking_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time
      };

      console.log('🔍 Booking payload:', payload);

      // Make booking request with AbortController for proper timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        const apiBase = API_BASE_URL.replace('/api', '');
        const response = await fetch(`${apiBase}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || `HTTP error! status: ${response.status}` };
          }
          throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
        }

        const created = await response.json();
        console.log('✅ Booking created:', created);

        // Close modal immediately after successful booking
        setBookingData({ name: '', email: '', phone: '', quantity: 1, notes: '' });
        setShowBookingModal(false);
        setIsBooking(false);

        // Show success message
        alert(`Đặt vé thành công!\n\nSự kiện: ${event.title}\nSố lượng: ${bookingData.quantity} vé\nTổng tiền: ${(parseFloat(event.price || 0) * bookingData.quantity).toLocaleString('vi-VN')} ${event.currency || 'VND'}\n\nEmail xác nhận sẽ được gửi tới: ${bookingData.email}`);

        // Try to send email separately (non-blocking)
        try {
          await Core.SendEmail({
            from_name: 'Music Space',
            to: bookingData.email,
            subject: `✅ Xác nhận đặt vé: ${event.title}`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 16px;">
                <h2 style="color:#1E88E5; margin:0 0 12px;">Cảm ơn bạn đã đặt vé!</h2>
                <p>Xin chào <strong>${bookingData.name}</strong>,</p>
                <p>Bạn đã đặt <strong>${bookingData.quantity}</strong> vé cho sự kiện <strong>${event.title}</strong>.</p>
                <div style="background:#f7f7f7; padding:12px 16px; border-radius:8px; margin:16px 0;">
                  <p><strong>Mã đặt vé:</strong> #${created.id}</p>
                  <p><strong>Thời gian:</strong> ${new Date(event.event_date).toLocaleString('vi-VN')}</p>
                  <p><strong>Tổng tiền:</strong> ${(Number(event.price || 0) * Number(bookingData.quantity || 1)).toLocaleString('vi-VN')} VND</p>
                  <p><strong>Thanh toán:</strong> Thanh toán tại sự kiện</p>
                </div>
                <p>Vui lòng đến sớm 15 phút để làm thủ tục.</p>
                <p style="color:#666;">Trân trọng,<br/>Music Space</p>
              </div>
            `
          });
          console.log('✅ Confirmation email sent');
        } catch (emailError) {
          console.warn('⚠️ Email sending failed (non-critical):', emailError);
          // Email failure doesn't affect booking success
        }

      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout. Vui lòng thử lại.');
        }
        throw fetchError;
      }

    } catch (error) {
      console.error('❌ Booking error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        status: error.status,
        data: error.data
      });
      
      setIsBooking(false);
      
      // Show user-friendly error message
      const errorMessage = error.status === 400 
        ? 'Thông tin đặt vé không hợp lệ. Vui lòng kiểm tra lại.'
        : error.status === 401 || error.status === 403
        ? 'Vui lòng đăng nhập để đặt vé.'
        : error.message?.includes('timeout')
        ? 'Request timeout. Vui lòng thử lại.'
        : `Có lỗi xảy ra khi đặt vé: ${error.message || 'Vui lòng thử lại sau!'}`;
      
      alert(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin sự kiện...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy sự kiện</h2>
          <p className="text-gray-600 mb-6">Sự kiện này có thể đã bị xóa hoặc không tồn tại.</p>
          <button
            onClick={() => navigate('/Love')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/Love')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <div className="flex items-center gap-3"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Info */}
          <div className="lg:col-span-2">
            {/* Cover Image with overlay */}
            <div className="h-[28rem] relative overflow-hidden rounded-2xl mb-8">
              {(event.image_url || event.cover_image) ? (
                <img 
                  src={buildImageUrl(event.image_url || event.cover_image)} 
                  alt={event.title}
                  className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.nextSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${(event.image_url || event.cover_image) ? 'hidden' : 'flex'} bg-gradient-to-br from-blue-400 to-purple-500`}>
                <div className="text-8xl text-white opacity-80">🎵</div>
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/90 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                    <span>{new Date(event.event_date).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span>{event.start_time || '--:--'}</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-md">{event.title}</h1>
                </div>
                <div></div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">{event.title}</h1>
              <p className="text-xl text-gray-600 mb-8">{event.description}</p>

              {/* Event Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-800">Ngày</p>
                      <p className="text-gray-600">{new Date(event.event_date).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-800">Thời gian</p>
                      <p className="text-gray-600">
                        {event.start_time || '--:--'}
                        {` - `}
                        {event.end_time || (() => {
                          if (!event.start_time) return '--:--';
                          const parts = String(event.start_time).split(':');
                          const h = parseInt(parts[0] || '0', 10);
                          const m = parts[1] || '00';
                          const hh = (h + (event.duration_hours || 2)) % 24;
                          return `${String(hh).padStart(2,'0')}:${m}`;
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M8 21h8m-6-4h4M7 10l1-6h8l1 6" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-800">Đồ uống</p>
                      <p className="text-gray-600">{drinkStatus || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-800">Địa điểm</p>
                      <p className="text-gray-600">{event.venue_name}</p>
                      {event.venue_address && (
                        <p className="text-sm text-gray-500">{event.venue_address}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-800">Số lượng</p>
                      <p className="text-gray-600">Tối đa {event.max_participants} người</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-800">Tổ chức bởi</p>
                      <p className="text-gray-600">{event.organizer_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Drinks Menu */}
              {(drinkItems.length > 0) || (drinkPrice != null) || !!drinkStatus ? (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Menu đồ uống</h3>
                    {drinkStatus && (
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${drinkStatus === 'Miễn phí' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{drinkStatus}</span>
                    )}
                  </div>
                  {drinkPrice != null && (
                    <div className="mb-3 inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-2 rounded-lg text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v7a3 3 0 106 0v-7c0-1.657-1.343-3-3-3z"/></svg>
                      <span>Giá trung bình: <strong>{drinkPrice.toLocaleString('vi-VN')} {event.currency || 'VND'}</strong></span>
                    </div>
                  )}
                  {drinkItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {drinkItems.map((d, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                          <span className="text-gray-800 font-medium">{d.name || d.title || `Đồ uống ${i+1}`}</span>
                          {d.price != null && (
                            <span className="text-blue-600 font-semibold">{parseFloat(d.price).toLocaleString('vi-VN')} {event.currency || 'VND'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Gallery Images */}
              {event.gallery_images && event.gallery_images.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Hình ảnh</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.gallery_images.map((image, index) => (
                      <button
                        key={index}
                        type="button"
                        className="group relative block focus:outline-none"
                        onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                      >
                        <img 
                          src={buildImageUrl(image)} 
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg shadow-sm group-hover:shadow-lg transition"
                          onError={(e) => {
                            console.log('❌ Gallery image load error:', image);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/10 transition"></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Maps */}
              {event.google_maps_url && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Vị trí</h3>
                  <a 
                    href={event.google_maps_url}
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
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {parseFloat(event.price).toLocaleString('vi-VN')} {event.currency || 'VND'}
                </div>
                {event.early_bird_price && parseFloat(event.early_bird_price) < parseFloat(event.price) && (
                  <div className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full inline-block">
                    Early bird: {parseFloat(event.early_bird_price).toLocaleString('vi-VN')} {event.currency || 'VND'}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors mb-4"
              >
                Đặt vé ngay
              </button>

              <div className="text-sm text-gray-500 text-center">
                <p>• Vé không hoàn lại</p>
                <p>• Có thể đổi tên người tham gia</p>
                <p>• Hỗ trợ 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Đặt vé sự kiện</h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Event Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">{event.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{new Date(event.event_date).toLocaleDateString('vi-VN')} - {event.start_time}</span>
                  <span className="font-semibold text-green-600">
                    {parseFloat(event.price).toLocaleString('vi-VN')} {event.currency || 'VND'}
                  </span>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                handleBooking();
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      value={bookingData.name}
                      onChange={(e) => setBookingData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={bookingData.email}
                      onChange={(e) => setBookingData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      value={bookingData.phone}
                      onChange={(e) => setBookingData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng vé *</label>
                    <select
                      value={bookingData.quantity}
                      onChange={(e) => setBookingData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: Math.min(10, event.max_participants || 10) }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} vé</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                  <textarea
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ghi chú thêm (tùy chọn)"
                  />
                </div>

                {/* Total Price */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {(parseFloat(event.price) * bookingData.quantity).toLocaleString('vi-VN')} {event.currency || 'VND'}
                    </span>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isBooking}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                      isBooking 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isBooking ? 'Đang xử lý...' : 'Xác nhận đặt vé'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    disabled={isBooking}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && Array.isArray(event.gallery_images) && event.gallery_images.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center select-none">
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>

          <button
            className="absolute left-4 md:left-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            onClick={() => setLightboxIndex((prev) => (prev - 1 + event.gallery_images.length) % event.gallery_images.length)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button
            className="absolute right-4 md:right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            onClick={() => setLightboxIndex((prev) => (prev + 1) % event.gallery_images.length)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>

          <div className="max-w-[90vw] max-h-[85vh] p-4">
            <img
              src={buildImageUrl(event.gallery_images[lightboxIndex])}
              alt={`Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center text-white/80 text-sm">{lightboxIndex + 1} / {event.gallery_images.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}





