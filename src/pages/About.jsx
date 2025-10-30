import React from "react";
import { Heart, Target, Lightbulb, Users2 } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "Kết nối",
      description: "Xóa bỏ khoảng cách, tạo không gian để mọi người gặp gỡ và chia sẻ",
      color: "bg-[#C7F0DB]"
    },
    {
      icon: Users2,
      title: "Cộng đồng",
      description: "Xây dựng cộng đồng nơi mọi người có thể tự do thể hiện và được lắng nghe",
      color: "bg-[#FFD4E5]"
    },
    {
      icon: Lightbulb,
      title: "Sáng tạo",
      description: "Khuyến khích sự sáng tạo và thể hiện bản thân qua âm nhạc",
      color: "bg-[#C7E0F0]"
    },
    {
      icon: Target,
      title: "Chân thực",
      description: "Trải nghiệm âm nhạc thật, trong không gian thật, với cảm xúc thật",
      color: "bg-[#E0D4F7]"
    }
  ];

  const team = [
    { name: "Harmony", role: "Founder & Visionary", avatar: "H", color: "from-[#6A7BFF] to-[#8B93FF]" },
    { name: "Tuấn", role: "Tech Lead", avatar: "T", color: "from-[#8B93FF] to-[#A8AFFF]" },
    { name: "Vũ", role: "Music Director", avatar: "V", color: "from-[#C7E0F0] to-[#E0D4F7]" },
    { name: "Linh", role: "Community Manager", avatar: "L", color: "from-[#FFD4E5] to-[#E0D4F7]" },
    { name: "Long", role: "Creative Designer", avatar: "L", color: "from-[#C7F0DB] to-[#C7E0F0]" },
    { name: "Minh", role: "Event Coordinator", avatar: "M", color: "from-[#E0D4F7] to-[#FFD4E5]" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-64 h-64 bg-[#FFD4E5] rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#C7F0DB] rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-white/40 soft-shadow mb-8">
              <Heart className="w-4 h-4 text-[#6A7BFF]" />
              <span className="text-sm font-medium text-gray-700">We Love You</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-gray-800 mb-6"
          >
            Chúng tôi tin âm nhạc không chỉ để nghe,
            <br />
            <span className="bg-gradient-to-r from-[#6A7BFF] to-[#8B93FF] bg-clip-text text-transparent">
              mà để sống cùng
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
          >
            Music Space ra đời từ khát vọng của những sinh viên FPT, 
            mong muốn tạo nên một nơi mà mọi người có thể cùng ca hát và chia sẻ. 
            Nơi âm nhạc không còn là thứ xa xỉ, mà là một phần thiết yếu của cuộc sống.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="elegant-card p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              Câu chuyện của chúng tôi
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
              <p>
                Trong những năm đại học tại FPT, chúng tôi nhận ra rằng dù công nghệ phát triển, 
                con người ngày càng mất kết nối với nhau. Mọi người lướt điện thoại, đeo tai nghe, 
                nhưng hiếm khi thực sự chia sẻ âm nhạc cùng nhau.
              </p>
              <p>
                Music Space được sinh ra từ ý tưởng đơn giản: tạo một không gian nơi mọi người có thể 
                gặp gỡ, cùng nhau thưởng thức âm nhạc, và từ đó tìm lại sự kết nối trong tâm hồn.
              </p>
              <p>
                Với sự hỗ trợ của Đại học FPT, chúng tôi không chỉ xây dựng một quán café, 
                mà là một hệ sinh thái hoàn chỉnh - kết hợp công nghệ âm thanh tiên tiến, 
                workshop sáng tạo, và các sự kiện cộng đồng ý nghĩa.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="elegant-card p-10"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#E0D4F7] flex items-center justify-center mb-6 soft-shadow">
                <Target className="w-7 h-7 text-[#6A7BFF]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Vision</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Trở thành hệ sinh thái âm nhạc toàn diện tại Việt Nam, 
                nơi công nghệ và cảm xúc kết hợp để tạo nên những trải nghiệm độc đáo.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="elegant-card p-10"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#C7F0DB] flex items-center justify-center mb-6 soft-shadow">
                <Lightbulb className="w-7 h-7 text-[#6A7BFF]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Mission</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Kết nối con người qua âm nhạc, công nghệ và không gian thật. 
                Tạo ra một cộng đồng nơi mọi người có thể tự do thể hiện, chia sẻ và lắng nghe.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Giá trị cốt lõi
            </h2>
            <p className="text-gray-600 text-lg">
              Những nguyên tắc dẫn dắt hành trình của chúng tôi
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="elegant-card p-8 text-center"
              >
                <div className={`w-16 h-16 rounded-2xl ${value.color} flex items-center justify-center mx-auto mb-4 soft-shadow`}>
                  <value.icon className="w-8 h-8 text-[#6A7BFF]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Những con người phía sau
            </h2>
            <p className="text-gray-600 text-lg">
              Đội ngũ đam mê, sáng tạo và luôn hướng tới mục tiêu chung
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="elegant-card p-8 text-center group"
              >
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${member.color} flex items-center justify-center mx-auto mb-6 soft-shadow group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-3xl font-bold text-white">{member.avatar}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}