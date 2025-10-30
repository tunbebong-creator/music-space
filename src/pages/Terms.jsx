import React from "react";
import { motion } from "framer-motion";
import { Shield, FileText, AlertCircle } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-100 flex items-center justify-center">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-handwriting text-gray-800 mb-4">
            Điều khoản sử dụng
          </h1>
          <p className="text-gray-600">Cập nhật lần cuối: 25/12/2024</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200"
        >
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              1. Chấp nhận điều khoản
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Khi truy cập và sử dụng Music Space (musicspace.edu.vn), bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định dưới đây. Nếu không đồng ý, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              2. Về Music Space
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Music Space là nền tảng phi lợi nhuận do Đại học FPT vận hành, nhằm:
            </p>
            <ul className="text-gray-600 leading-relaxed mb-6 space-y-2">
              <li>• Kết nối cộng đồng yêu âm nhạc với các không gian âm nhạc chất lượng</li>
              <li>• Cung cấp thông tin, sự kiện và nội dung về âm nhạc trị liệu</li>
              <li>• Hỗ trợ nghệ sĩ và chủ không gian phát triển</li>
              <li>• Ứng dụng nghiên cứu khoa học về âm nhạc và sức khỏe từ WHO</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              3. Tài khoản người dùng
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>3.1. Đăng ký:</strong> Bạn cần cung cấp thông tin chính xác, đầy đủ khi đăng ký tài khoản.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>3.2. Bảo mật:</strong> Bạn chịu trách nhiệm bảo mật thông tin đăng nhập. Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              <strong>3.3. Hành vi cấm:</strong> Không được sử dụng tài khoản để spam, lừa đảo, quấy rối người khác, hoặc vi phạm pháp luật.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              4. Đặt chỗ và giao dịch
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>4.1. Cam kết:</strong> Khi đặt chỗ, bạn cam kết sẽ tham gia hoặc thông báo hủy trước 24 giờ.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>4.2. Thanh toán:</strong> Music Space KHÔNG xử lý thanh toán. Mọi giao dịch tài chính diễn ra trực tiếp giữa bạn và chủ không gian.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              <strong>4.3. Tranh chấp:</strong> Chúng tôi hỗ trợ hòa giải nhưng không chịu trách nhiệm về tranh chấp giữa người dùng và space owner.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              5. Nội dung người dùng
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>5.1. Quyền sở hữu:</strong> Bạn giữ quyền sở hữu nội dung bạn đăng (review, comment, v.v).
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>5.2. Cấp phép:</strong> Bằng việc đăng nội dung, bạn cấp cho Music Space quyền sử dụng, hiển thị nội dung đó trên nền tảng.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              <strong>5.3. Kiểm duyệt:</strong> Chúng tôi có quyền gỡ nội dung vi phạm chính sách mà không cần thông báo trước.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              6. Space Owner và Artist
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>6.1. Xác thực:</strong> Chúng tôi có quyền xác thực danh tính và không gian trước khi duyệt.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>6.2. Chất lượng:</strong> Space owner cam kết duy trì chất lượng dịch vụ như mô tả.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              <strong>6.3. Miễn phí:</strong> Music Space KHÔNG thu phí từ space owner hay artist. Đây là dự án phi lợi nhuận.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              7. Giới hạn trách nhiệm
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Music Space là nền tảng kết nối, KHÔNG phải nhà cung cấp dịch vụ. Chúng tôi không chịu trách nhiệm về:
            </p>
            <ul className="text-gray-600 leading-relaxed mb-6 space-y-2">
              <li>• Chất lượng dịch vụ tại các không gian</li>
              <li>• Tranh chấp giữa người dùng và space owner</li>
              <li>• Thiệt hại phát sinh từ việc sử dụng thông tin trên nền tảng</li>
              <li>• Gián đoạn dịch vụ do lỗi kỹ thuật hoặc bảo trì</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              8. Sở hữu trí tuệ
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Tất cả nội dung, logo, thiết kế của Music Space thuộc quyền sở hữu của Đại học FPT. Không được sao chép, sử dụng thương mại mà không có sự cho phép.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              9. Thay đổi điều khoản
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Chúng tôi có quyền thay đổi điều khoản này bất kỳ lúc nào. Thay đổi có hiệu lực ngay khi đăng tải. Việc bạn tiếp tục sử dụng sau khi thay đổi có nghĩa bạn chấp nhận điều khoản mới.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
              10. Luật áp dụng
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Điều khoản này tuân thủ pháp luật Việt Nam. Mọi tranh chấp sẽ được giải quyết tại Tòa án có thẩm quyền tại Hà Nội.
            </p>

            {/* Contact Box */}
            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Có thắc mắc?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Nếu bạn có bất kỳ câu hỏi nào về Điều khoản sử dụng, vui lòng liên hệ:
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">📧 <strong>Email:</strong> space@musicspace.edu.vn</p>
                    <p className="text-gray-700">📞 <strong>Hotline:</strong> 0862 899 982</p>
                    <p className="text-gray-700">🏢 <strong>Địa chỉ:</strong> Đại học FPT, Khu Công nghệ cao Hòa Lạc</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          <p>Bằng việc sử dụng Music Space, bạn đồng ý với Điều khoản này và{" "}
            <a href="/Privacy" className="text-blue-600 hover:underline">
              Chính sách bảo mật
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}