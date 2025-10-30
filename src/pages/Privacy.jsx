import React from "react";
import { motion } from "framer-motion";
import { Lock, Shield, Eye, Database, UserCheck, Mail } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Shield className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-handwriting text-gray-800 mb-4">
            Chính sách bảo mật
          </h1>
          <p className="text-gray-600">Cam kết bảo vệ thông tin cá nhân của bạn</p>
          <p className="text-sm text-gray-500 mt-2">Cập nhật: 25/12/2024</p>
        </motion.div>

        {/* Quick Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {[
            { icon: Lock, title: "Mã hóa", text: "Dữ liệu được mã hóa SSL" },
            { icon: Eye, title: "Minh bạch", text: "Rõ ràng về cách dùng data" },
            { icon: UserCheck, title: "Quyền kiểm soát", text: "Bạn quyết định data của bạn" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
              <item.icon className="w-10 h-10 mx-auto mb-3 text-purple-600" />
              <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.text}</p>
            </div>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200"
        >
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-purple-600" />
              1. Thông tin chúng tôi thu thập
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              1.1. Thông tin bạn cung cấp:
            </h3>
            <ul className="text-gray-600 leading-relaxed space-y-2 mb-6">
              <li>• <strong>Tài khoản:</strong> Họ tên, email, số điện thoại (tùy chọn)</li>
              <li>• <strong>Profile:</strong> Ảnh đại diện, bio, sở thích âm nhạc</li>
              <li>• <strong>Booking:</strong> Thông tin đặt chỗ, ghi chú cho space owner</li>
              <li>• <strong>Nội dung:</strong> Reviews, comments, mood journal</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              1.2. Thông tin tự động:
            </h3>
            <ul className="text-gray-600 leading-relaxed space-y-2 mb-6">
              <li>• Device type, browser, IP address</li>
              <li>• Cookies và tracking technologies</li>
              <li>• Lịch sử hoạt động trên nền tảng (trang xem, thời gian lưu trú)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-12 flex items-center gap-3">
              <Eye className="w-6 h-6 text-purple-600" />
              2. Cách chúng tôi sử dụng thông tin
            </h2>
            <ul className="text-gray-600 leading-relaxed space-y-3 mb-6">
              <li><strong>2.1. Cung cấp dịch vụ:</strong> Xử lý booking, hiển thị nội dung cá nhân hóa, hỗ trợ khách hàng</li>
              <li><strong>2.2. Cải thiện trải nghiệm:</strong> Phân tích hành vi để tối ưu UX, đề xuất không gian/sự kiện phù hợp</li>
              <li><strong>2.3. Giao tiếp:</strong> Email xác nhận booking, newsletter (nếu bạn đăng ký), thông báo quan trọng</li>
              <li><strong>2.4. Nghiên cứu:</strong> Phân tích aggregated data cho nghiên cứu khoa học về âm nhạc và sức khỏe (không định danh cá nhân)</li>
              <li><strong>2.5. Bảo mật:</strong> Phát hiện và ngăn chặn gian lận, spam, vi phạm điều khoản</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-12">
              3. Chia sẻ thông tin
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Chúng tôi <strong className="text-red-600">KHÔNG BÁN</strong> thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ trong các trường hợp:
            </p>
            <ul className="text-gray-600 leading-relaxed space-y-3 mb-6">
              <li><strong>3.1. Space Owners:</strong> Khi bạn đặt chỗ, thông tin (tên, SĐT, email) sẽ được gửi cho chủ không gian để xác nhận</li>
              <li><strong>3.2. Đối tác dịch vụ:</strong> Email service (để gửi email), analytics tools (Google Analytics), hosting provider</li>
              <li><strong>3.3. Yêu cầu pháp lý:</strong> Khi có lệnh từ cơ quan có thẩm quyền</li>
              <li><strong>3.4. Bảo vệ quyền lợi:</strong> Khi cần thiết để bảo vệ an toàn, quyền và tài sản của Music Space và người dùng</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-12">
              4. Bảo mật thông tin
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Chúng tôi áp dụng các biện pháp bảo mật:
            </p>
            <ul className="text-gray-600 leading-relaxed space-y-2 mb-6">
              <li>• <strong>SSL Encryption:</strong> Mã hóa dữ liệu truyền tải</li>
              <li>• <strong>Secure Authentication:</strong> OAuth 2.0 với JWT tokens</li>
              <li>• <strong>Database Security:</strong> Firewall, regular backups, access control</li>
              <li>• <strong>Regular Audits:</strong> Kiểm tra bảo mật định kỳ</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-6">
              <strong>Lưu ý:</strong> Không có hệ thống nào 100% an toàn. Chúng tôi cam kết nỗ lực tối đa nhưng không thể đảm bảo tuyệt đối.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-12">
              5. Quyền của bạn
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Theo Luật Bảo vệ dữ liệu cá nhân Việt Nam, bạn có quyền:
            </p>
            <ul className="text-gray-600 leading-relaxed space-y-2 mb-6">
              <li>• <strong>Truy cập:</strong> Yêu cầu xem dữ liệu chúng tôi có về bạn</li>
              <li>• <strong>Chỉnh sửa:</strong> Cập nhật, sửa thông tin không chính xác</li>
              <li>• <strong>Xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu</li>
              <li>• <strong>Phản đối:</strong> Từ chối việc xử lý dữ liệu cho mục đích marketing</li>
              <li>• <strong>Data Portability:</strong> Yêu cầu tải dữ liệu của bạn dưới dạng file</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-6">
              Để thực hiện quyền của bạn, email: <a href="mailto:privacy@musicspace.edu.vn" className="text-purple-600 hover:underline">privacy@musicspace.edu.vn</a>
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-12">
              6. Cookies
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Chúng tôi sử dụng cookies để:
            </p>
            <ul className="text-gray-600 leading-relaxed space-y-2 mb-6">
              <li>• <strong>Essential cookies:</strong> Đăng nhập, giỏ hàng (không thể tắt)</li>
              <li>• <strong>Analytics cookies:</strong> Hiểu cách người dùng sử dụng site</li>
              <li>• <strong>Marketing cookies:</strong> Hiển thị quảng cáo phù hợp (nếu có)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-6">
              Bạn có thể quản lý cookies trong cài đặt trình duyệt. Tắt cookies có thể ảnh hưởng trải nghiệm.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-12">
              7. Người dùng dưới 16 tuổi
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Music Space không cố ý thu thập thông tin từ trẻ em dưới 16 tuổi. Nếu bạn là phụ huynh và phát hiện con mình đã cung cấp thông tin, vui lòng liên hệ để chúng tôi xóa.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-12">
              8. Thay đổi chính sách
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Chúng tôi có thể cập nhật chính sách này. Thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo trên site. Ngày "Cập nhật" ở đầu trang sẽ thay đổi.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-12">
              9. Thông tin liên hệ
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nếu có thắc mắc về Chính sách bảo mật:
            </p>
            <ul className="text-gray-600 leading-relaxed space-y-2 mb-6">
              <li>• <strong>Email:</strong> privacy@musicspace.edu.vn</li>
              <li>• <strong>Hotline:</strong> 0862 899 982</li>
              <li>• <strong>Địa chỉ:</strong> Đại học FPT Hà Nội, Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội</li>
            </ul>

            {/* Trust Box */}
            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 text-lg">Cam kết của chúng tôi</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Music Space được vận hành bởi Đại học FPT - tổ chức giáo dục uy tín. 
                    Chúng tôi cam kết bảo vệ quyền riêng tư của bạn và tuân thủ nghiêm ngặt 
                    Luật Bảo vệ dữ liệu cá nhân Việt Nam. Sự tin tưởng của bạn là ưu tiên hàng đầu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col md:flex-row gap-4 justify-center items-center"
        >
          <a
            href="/Terms"
            className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Xem Điều khoản sử dụng
          </a>
          <a
            href="/Contact"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg transition-all"
          >
            Liên hệ về quyền riêng tư
          </a>
        </motion.div>
      </div>
    </div>
  );
}