import React from "react";
import { X, Calendar, Clock, Users, MapPin, Phone, Mail, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";

export default function BookingModal({ 
  space, 
  isOpen, 
  onClose, 
  user,
  onBookingSuccess 
}) {
  const [formData, setFormData] = React.useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "19:00",
    guests: 2,
    duration: 2,
    specialRequests: "",
    spaceId: space?.id
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bookingSuccess, setBookingSuccess] = React.useState(false);

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", 
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
  ];

  const durationOptions = [
    { value: 1, label: "1 giờ" },
    { value: 2, label: "2 giờ" },
    { value: 3, label: "3 giờ" },
    { value: 4, label: "4 giờ" },
    { value: 6, label: "6 giờ" },
    { value: 8, label: "8 giờ" }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const start = formData.time + ':00';
      const endHour = Number(formData.time.split(':')[0]) + Number(formData.duration);
      const end = `${String(endHour).padStart(2,'0')}:${formData.time.split(':')[1]}:00`;
      const total = Number(space?.price_per_hour || 0) * Number(formData.duration || 1);

      const payload = {
        space_id: space?.id,
        user_id: user?.id || null,
        booking_date: formData.date,
        start_time: start,
        end_time: end,
        total_price: String(total),
        status: 'pending',
        customer_email: formData.email,
        customer_name: formData.name,
        customer_phone: formData.phone,
        payment_method: 'Thanh toán tại sự kiện'
      };

      const created = await (await import("@/api/customClient")).customAPI.entities.Booking.create(payload);
      setBookingSuccess(true);
      onBookingSuccess && onBookingSuccess({ ...formData, id: created.id });
    } catch (error) {
      console.error("Booking error:", error);
      alert("Có lỗi xảy ra khi đặt chỗ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    return format(new Date(), "yyyy-MM-dd");
  };

  const getMaxDate = () => {
    return format(addDays(new Date(), 30), "yyyy-MM-dd");
  };

  const calculatePrice = () => {
    if (!space?.price_per_hour) return 0;
    return space.price_per_hour * formData.duration * formData.guests;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Đặt chỗ không gian</h2>
                <p className="text-gray-600 mt-1">{space?.name}</p>
            </div>
            <button
              onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
            </div>
          </div>

          {bookingSuccess ? (
            /* Success State */
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Đặt chỗ thành công! 🎉
              </h3>
              
              <p className="text-gray-600 mb-6">
                Chúng tôi đã gửi email xác nhận đến <strong>{formData.email}</strong>. 
                Chủ không gian sẽ liên hệ với bạn trong vòng 24h.
              </p>

              <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left">
                <h4 className="font-semibold text-gray-800 mb-4">Chi tiết đặt chỗ:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Không gian:</span>
                    <span className="font-medium">{space?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ngày:</span>
                    <span className="font-medium">{format(new Date(formData.date), "dd/MM/yyyy", { locale: vi })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian:</span>
                    <span className="font-medium">{formData.time} - {formData.duration} giờ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số khách:</span>
                    <span className="font-medium">{formData.guests} người</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Thông tin liên hệ
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
              </label>
              <input
                type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Chi tiết đặt chỗ
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày *
                </label>
                <input
                  type="date"
                      value={formData.date}
                      min={getMinDate()}
                      max={getMaxDate()}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian *
                </label>
                    <select
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                  required
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
              </div>
            </div>

                <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số khách *
              </label>
              <input
                type="number"
                min="1"
                      max={space?.capacity || 50}
                      value={formData.guests}
                      onChange={(e) => handleInputChange("guests", parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối đa {space?.capacity || 50} người
                    </p>
            </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời lượng *
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                      required
                    >
                      {durationOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yêu cầu đặc biệt
              </label>
              <textarea
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                    placeholder="Ví dụ: Cần setup âm thanh, bàn ghế đặc biệt..."
              />
            </div>
              </div>

              {/* Price Summary */}
              {space?.price_per_hour && (
                <div className="bg-blue-50 rounded-2xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Tổng chi phí dự kiến:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Giá/giờ/người:</span>
                      <span>{space.price_per_hour.toLocaleString()} VNĐ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời lượng:</span>
                      <span>{formData.duration} giờ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số khách:</span>
                      <span>{formData.guests} người</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600">{calculatePrice().toLocaleString()} VNĐ</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    * Giá có thể thay đổi tùy theo yêu cầu cụ thể
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang xử lý...
                    </>
                  ) : (
                    'Đặt chỗ ngay'
                  )}
              </button>
            </div>
          </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}