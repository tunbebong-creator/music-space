import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, ChevronDown, Mail, Phone, MessageCircle } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = React.useState(null);

  const faqs = [
    {
      category: "Chung",
      questions: [
        {
          q: "Music Space là gì?",
          a: "Music Space là nền tảng kết nối cộng đồng yêu âm nhạc với các không gian âm nhạc chất lượng tại Việt Nam. Chúng tôi cung cấp thông tin, đánh giá và hệ thống đặt chỗ cho các cafe acoustic, studio, event hall và không gian âm nhạc khác."
        },
        {
          q: "Music Space có miễn phí không?",
          a: "Hoàn toàn MIỄN PHÍ cho người dùng! Bạn có thể tìm kiếm, đọc review, đặt chỗ mà không mất phí. Chúng tôi là dự án phi lợi nhuận của Đại học FPT."
        },
        {
          q: "Tôi cần tài khoản để sử dụng không?",
          a: "Bạn có thể xem thông tin không gian không cần tài khoản. Tuy nhiên, để đặt chỗ, viết review, tham gia sự kiện, bạn cần đăng ký tài khoản (miễn phí)."
        },
        {
          q: "Music Space hoạt động ở đâu?",
          a: "Hiện tại chúng tôi tập trung tại Hà Nội, đặc biệt là khu vực Hòa Lạc gần ĐH FPT. Chúng tôi đang mở rộng sang TP.HCM và các thành phố lớn khác."
        }
      ]
    },
    {
      category: "Đặt chỗ",
      questions: [
        {
          q: "Làm thế nào để đặt chỗ?",
          a: "1) Đăng nhập tài khoản\n2) Tìm không gian yêu thích\n3) Nhấn 'Đặt chỗ'\n4) Điền thông tin và xác nhận\n5) Bạn sẽ nhận email xác nhận"
        },
        {
          q: "Đặt chỗ có mất phí không?",
          a: "Music Space KHÔNG thu phí đặt chỗ. Bạn chỉ thanh toán trực tiếp cho chủ không gian theo giá menu/dịch vụ của họ."
        },
        {
          q: "Tôi có thể hủy booking không?",
          a: "Có, bạn nên hủy trước 24 giờ để chủ không gian có thể sắp xếp lại. Hủy quá muộn có thể ảnh hưởng đến uy tín tài khoản."
        },
        {
          q: "Tôi quên mang CMND, có được vào không?",
          a: "Tùy từng không gian. Một số nơi yêu cầu CMND để check-in. Liên hệ trực tiếp không gian để hỏi."
        }
      ]
    },
    {
      category: "Không gian",
      questions: [
        {
          q: "Làm thế nào để thêm không gian của tôi?",
          a: "Nếu bạn là chủ không gian, đăng nhập và vào mục 'Yêu cầu quyền Space Owner'. Điền thông tin và chờ admin duyệt (thường 1-2 ngày)."
        },
        {
          q: "Tiêu chí duyệt không gian là gì?",
          a: "Không gian cần: 1) Có giấy phép kinh doanh hợp lệ, 2) Chất lượng âm thanh tốt, 3) Không gian sạch sẽ, an toàn, 4) Có live music hoặc liên quan âm nhạc rõ ràng."
        },
        {
          q: "Music Space có thu phí từ chủ không gian không?",
          a: "KHÔNG! Chúng tôi hoàn toàn miễn phí cho cả user và space owner. Đây là dự án phi lợi nhuận phục vụ cộng đồng."
        }
      ]
    },
    {
      category: "Sự kiện",
      questions: [
        {
          q: "Làm thế nào để đăng ký sự kiện?",
          a: "Vào mục 'Events', chọn sự kiện bạn quan tâm, nhấn 'Đăng ký tham gia'. Bạn sẽ nhận email xác nhận và nhắc nhở 1 ngày trước sự kiện."
        },
        {
          q: "Sự kiện có miễn phí không?",
          a: "Nhiều sự kiện miễn phí, một số có thu phí tùy thuộc artist và không gian. Thông tin chi tiết trong mô tả sự kiện."
        },
        {
          q: "Tôi có thể tổ chức sự kiện trên Music Space?",
          a: "Có! Nếu bạn là chủ không gian hoặc artist, liên hệ space@musicspace.edu.vn để được hỗ trợ đăng sự kiện."
        }
      ]
    },
    {
      category: "Nghệ sĩ",
      questions: [
        {
          q: "Làm thế nào để trở thành nghệ sĩ verified?",
          a: "Đăng nhập và vào 'Yêu cầu quyền Artist'. Cung cấp portfolio (Spotify/YouTube/SoundCloud link) và lý do. Admin sẽ xét duyệt."
        },
        {
          q: "Nghệ sĩ verified có lợi ích gì?",
          a: "- Profile được highlight\n- Ưu tiên tham gia sự kiện\n- Liên hệ trực tiếp từ space owner\n- Được giới thiệu trên blog"
        },
        {
          q: "Tôi có thể tìm gigs qua Music Space?",
          a: "Có! Chủ không gian thường xuyên tìm artist. Với profile verified, bạn dễ được liên hệ hơn."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-100 flex items-center justify-center">
            <HelpCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-handwriting text-gray-800 mb-4">
            Câu hỏi thường gặp
          </h1>
          <p className="text-xl text-gray-600">
            Tất cả những gì bạn cần biết về Music Space
          </p>
        </motion.div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqs.map((section, sectionIdx) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIdx * 0.1 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {section.category}
              </h2>
              <div className="space-y-4">
                {section.questions.map((item, idx) => {
                  const uniqueIdx = `${sectionIdx}-${idx}`;
                  const isOpen = openIndex === uniqueIdx;
                  
                  return (
                    <div
                      key={uniqueIdx}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-300 transition-colors"
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : uniqueIdx)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-800 pr-4">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-5"
                        >
                          <p className="text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-4">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 text-center border border-blue-100"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Vẫn còn thắc mắc?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn! Liên hệ qua các kênh dưới đây:
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="mailto:space@musicspace.edu.vn"
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl hover:shadow-lg transition-all border border-gray-200"
            >
              <Mail className="w-10 h-10 text-blue-600" />
              <span className="font-medium text-gray-800">Email</span>
              <span className="text-sm text-gray-600">space@musicspace.edu.vn</span>
            </a>
            
            <a
              href="tel:0862899982"
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl hover:shadow-lg transition-all border border-gray-200"
            >
              <Phone className="w-10 h-10 text-green-600" />
              <span className="font-medium text-gray-800">Hotline</span>
              <span className="text-sm text-gray-600">0862 899 982</span>
            </a>
            
            <a
              href="https://www.facebook.com/profile.php?id=61576657110630"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl hover:shadow-lg transition-all border border-gray-200"
            >
              <MessageCircle className="w-10 h-10 text-purple-600" />
              <span className="font-medium text-gray-800">Facebook</span>
              <span className="text-sm text-gray-600">Messenger Chat</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}