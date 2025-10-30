import React, { useState } from "react";
import { customAPI } from "@/api/customClient";
import { Core } from "@/api/integrations";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageCircle, Building2, Mic2, Handshake, Newspaper, CheckCircle, Loader2 } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    type: "general"
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      await customAPI.entities.ContactMessage.create(data);
      
      // Send confirmation email
      await Core.SendEmail({
        from_name: "Music Space",
        to: data.email,
        subject: "✅ Đã nhận được tin nhắn của bạn",
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1E88E5;">Cảm ơn bạn đã liên hệ!</h2>
            <p>Xin chào <strong>${data.name}</strong>,</p>
            <p>Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong vòng 24 giờ.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nội dung tin nhắn:</strong></p>
              <p>${data.message}</p>
            </div>
            <p style="color: #666;">Trân trọng,<br>Đội ngũ Music Space</p>
          </div>
        `
      });

      // Notify admin
      await Core.SendEmail({
        from_name: "Music Space Contact Form",
        to: "space@musicspace.edu.vn",
        subject: `📩 Tin nhắn mới: ${data.subject}`,
        body: `
          <h3>Tin nhắn liên hệ mới từ ${data.name}</h3>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>SĐT:</strong> ${data.phone}</p>
          <p><strong>Loại:</strong> ${data.type}</p>
          <p><strong>Tiêu đề:</strong> ${data.subject}</p>
          <p><strong>Nội dung:</strong></p>
          <p>${data.message}</p>
        `
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        type: "general"
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const contactTypes = [
    { id: "general", label: "Câu hỏi chung", icon: MessageCircle },
    { id: "space_owner", label: "Đăng ký Space Owner", icon: Building2 },
    { id: "artist", label: "Đăng ký Artist", icon: Mic2 },
    { id: "partnership", label: "Hợp tác", icon: Handshake },
    { id: "press", label: "Báo chí", icon: Newspaper }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-handwriting text-gray-800 mb-6">
            Liên hệ
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-2 space-y-6"
          >
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Thông tin liên hệ</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                    <a href="mailto:space@musicspace.edu.vn" className="text-blue-600 hover:underline">
                      space@musicspace.edu.vn
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Điện thoại</h3>
                    <a href="tel:0862899982" className="text-green-600 hover:underline">
                      0862 899 982
                    </a>
                    <p className="text-sm text-gray-600 mt-1">Nguyễn Văn Thành</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Địa chỉ</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Đại học FPT Hà Nội<br />
                      Khu Công nghệ cao Hòa Lạc
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Liên kết nhanh</h3>
                <div className="space-y-2">
                  <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    📱 Facebook
                  </a>
                  <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    📸 Instagram
                  </a>
                  <a href="#" className="block text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    🎵 TikTok
                  </a>
                </div>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-100">
              <h3 className="font-bold text-gray-800 mb-4">⏰ Giờ làm việc</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Thứ 2 - Thứ 6:</strong> 9:00 - 18:00</p>
                <p><strong>Thứ 7:</strong> 9:00 - 17:00</p>
                <p><strong>Chủ nhật:</strong> Nghỉ</p>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-3"
          >
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              {submitted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Đã gửi thành công!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong vòng 24 giờ.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Gửi tin nhắn khác
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Gửi tin nhắn</h2>
                    <p className="text-gray-600">Chúng tôi sẽ phản hồi sớm nhất có thể</p>
                  </div>

                  {/* Contact Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Bạn muốn liên hệ về vấn đề gì?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {contactTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: type.id })}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            formData.type === type.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <type.icon className={`w-5 h-5 mb-2 ${
                            formData.type === type.id ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="text-xs font-medium text-gray-800">
                            {type.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ tên *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                        placeholder="0123456789"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                      placeholder="Muốn hợp tác về..."
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nội dung *
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Chia sẻ chi tiết về yêu cầu của bạn..."
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Gửi tin nhắn
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Bằng cách gửi form này, bạn đồng ý với{" "}
                    <a href="/Terms" className="text-blue-600 hover:underline">
                      Điều khoản
                    </a>{" "}
                    và{" "}
                    <a href="/Privacy" className="text-blue-600 hover:underline">
                      Chính sách bảo mật
                    </a>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}