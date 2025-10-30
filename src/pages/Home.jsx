
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, CheckCircle, Sparkles, Music, Heart, Users, Star, Play, Headphones, Mic, Calendar, MapPin, Award, Globe } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const [user, setUser] = React.useState(null);
  const navigate = useNavigate();

  // Parallax effects
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const aboutY = useTransform(scrollYProgress, [0.1, 0.4], [50, -50]);
  const featuresY = useTransform(scrollYProgress, [0.6, 0.9], [50, -50]);
  const finalCtaY = useTransform(scrollYProgress, [0.8, 1], [30, 0]);

  // Load user from localStorage
  React.useEffect(() => {
    const userData = localStorage.getItem('user_data');
    const token = localStorage.getItem('auth_token');
    
    if (userData && token) {
      try {
        const user = JSON.parse(userData);
        setUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const handleNavigate = (path) => {
    const safePath = path || '/'; 
    navigate(safePath);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section - Modern Design */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
        {/* Soft Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50/80 to-indigo-50/60"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating Music Notes */}
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[10%] text-sky-400/30">
            <Music className="w-16 h-16" />
          </motion.div>

          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, -3, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[60%] right-[15%] text-blue-400/25">
            <Headphones className="w-12 h-12" />
          </motion.div>

          <motion.div
            animate={{ 
              y: [0, -25, 0],
              rotate: [0, 8, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[40%] left-[80%] text-indigo-400/20">
            <Mic className="w-20 h-20" />
          </motion.div>

          {/* Ambient particles */}
          <div className="absolute inset-0">
            <div className="absolute top-[30%] left-[20%] w-32 h-32 rounded-full bg-sky-400/15 blur-3xl animate-pulse"></div>
            <div className="absolute top-[70%] right-[25%] w-40 h-40 rounded-full bg-blue-400/15 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-[50%] left-[60%] w-24 h-24 rounded-full bg-indigo-400/15 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
        </div>
        
        <motion.div
          className="max-w-6xl mx-auto text-center relative z-10"
          style={{ y: heroY }}>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-sky-200/50 mb-6">
                <Sparkles className="w-5 h-5 text-sky-500" />
                <span className="text-gray-700 font-medium">Nền tảng âm nhạc chữa lành</span>
              </div>
            </motion.div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-gray-800 mb-8 leading-tight">
              <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
              Music Space
              </span>
            </h1>

            {user ? (
              <>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-2xl md:text-3xl text-gray-700 mb-6 font-light leading-relaxed max-w-4xl mx-auto">
                  Chào mừng trở lại, <span className="font-semibold text-sky-600">{user.full_name || user.email.split('@')[0]}</span>!
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-lg md:text-xl text-gray-600 mb-12 font-light leading-relaxed max-w-2xl mx-auto">
                  Tiếp tục hành trình âm nhạc chữa lành của bạn
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                onClick={() => handleNavigate(createPageUrl("You"))}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold hover:shadow-2xl transition-all text-base md:text-lg shadow-xl w-full sm:w-auto flex items-center gap-2"
              >
                    <Play className="w-5 h-5" />
                    Hành trình của bạn
              </motion.button>
              <motion.button
                onClick={() => handleNavigate(createPageUrl("We"))}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-white/80 text-gray-700 font-semibold hover:bg-sky-50 transition-all text-base md:text-lg border border-sky-200/50 w-full sm:w-auto backdrop-blur-md flex items-center gap-2"
              >
                    <Users className="w-5 h-5" />
                Khám phá cộng đồng
              </motion.button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-2xl md:text-4xl text-gray-700 mb-6 font-light leading-relaxed max-w-4xl mx-auto">
                  Nơi <span className="font-semibold text-sky-600">âm nhạc</span> gặp gỡ <span className="font-semibold text-blue-600">tâm hồn</span>
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-lg md:text-xl text-gray-600 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
                  Khám phá thế giới âm nhạc chữa lành, kết nối với cộng đồng và tạo ra hành trình âm nhạc cá nhân của riêng bạn
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.button
                    onClick={() => handleNavigate(createPageUrl("We"))}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold hover:shadow-2xl transition-all text-base md:text-lg shadow-xl w-full sm:w-auto flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Bắt đầu hành trình
                  </motion.button>
              <motion.button
                onClick={() => handleNavigate(createPageUrl("Love"))}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-white/80 text-gray-700 font-semibold hover:bg-sky-50 transition-all text-base md:text-lg border border-sky-200/50 w-full sm:w-auto backdrop-blur-md flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Đặt vé sự kiện
              </motion.button>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section - Modern Cards */}
      <motion.section
        className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-b from-sky-50/30 to-white"
        style={{ y: aboutY }}>

        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16 md:mb-24">

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 font-medium mb-6 border border-sky-200/50">
              <Star className="w-5 h-5 text-sky-600" />
              <span>Khám phá trải nghiệm</span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Hệ sinh thái âm nhạc
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ba trải nghiệm độc đáo kết hợp để tạo nên hành trình âm nhạc hoàn chỉnh
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* We - Stories */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            viewport={{ once: true }}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
              
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">We - Cộng đồng</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Chia sẻ câu chuyện, cảm nhận và kết nối với những người cùng đam mê âm nhạc
                </p>
                
                <div className="flex items-center justify-between">
                <motion.button
                  onClick={() => handleNavigate(createPageUrl("We"))}
                  whileHover={{ x: 5 }}
                    className="inline-flex items-center gap-2 text-sky-600 font-semibold group-hover:text-sky-700 transition-colors"
                >
                    Khám phá cộng đồng
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                  
                  <div className="text-2xl">🎵</div>
                </div>
              </div>
            </motion.div>

            {/* Love - Booking & Events - SPECIAL DESIGN */}
              <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-emerald-200 hover:border-emerald-300">
              
              {/* Special booking badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                HOT 🔥
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Love - Đặt vé & Sự kiện</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Đang mở bán vé</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed mb-6 font-medium">
                  🎵 Đặt vé cho các không gian âm nhạc đặc biệt<br/>
                  🎤 Workshop và sự kiện độc đáo<br/>
                  🎧 Trải nghiệm âm nhạc chữa lành
                </p>
                
                <div className="bg-white/80 rounded-2xl p-4 mb-6 border border-emerald-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Sự kiện sắp tới:</span>
                    <span className="font-bold text-emerald-600">15+ sự kiện</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Giá vé từ:</span>
                    <span className="font-bold text-green-600">Miễn phí - 200k</span>
                  </div>
                </div>
                
                <motion.button
                  onClick={() => handleNavigate(createPageUrl("Love"))}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Đặt vé ngay - Xem sự kiện
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
            </div>
          </motion.div>

            {/* You - Journey */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
              className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100">
              
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Music className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">You - Hành trình</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Tạo hành trình âm nhạc cá nhân với AI recommendation và theo dõi tiến độ
                </p>
                
                <div className="flex items-center justify-between">
                <motion.button
                    onClick={() => handleNavigate(createPageUrl("You"))}
                  whileHover={{ x: 5 }}
                    className="inline-flex items-center gap-2 text-sky-600 font-semibold group-hover:text-sky-700 transition-colors"
                >
                    Bắt đầu hành trình
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                  
                  <div className="text-2xl">🎧</div>
                </div>
              </div>
            </motion.div>
            </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800"
        style={{ y: featuresY }}>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16">

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-sky-200 to-blue-200 bg-clip-text text-transparent">
                Cộng đồng đang phát triển
              </span>
            </h2>
            <p className="text-lg md:text-xl text-sky-100 max-w-3xl mx-auto leading-relaxed">
              Hàng nghìn người đã tham gia hành trình âm nhạc chữa lành cùng chúng tôi
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-sky-200/30 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold text-sky-700 mb-2">50+</div>
              <div className="text-sky-600 font-medium">Không gian âm nhạc</div>
              <div className="text-sky-500 text-sm mt-2">Trên khắp Việt Nam</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-sky-200/30 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold text-blue-700 mb-2">500+</div>
              <div className="text-blue-600 font-medium">Thành viên</div>
              <div className="text-blue-500 text-sm mt-2">Nghệ sĩ & Người yêu nhạc</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-sky-200/30 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold text-indigo-700 mb-2">100+</div>
              <div className="text-indigo-600 font-medium">Sự kiện</div>
              <div className="text-indigo-500 text-sm mt-2">Có thể đặt vé</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-sky-200/30 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="text-4xl md:text-5xl font-bold text-purple-700 mb-2">1000+</div>
              <div className="text-purple-600 font-medium">Bài viết</div>
              <div className="text-purple-500 text-sm mt-2">Câu chuyện & Cảm nhận</div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Final CTA Section */}
      <motion.section
        className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-br from-sky-50 via-white to-blue-50"
        style={{ y: finalCtaY }}>

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 font-medium mb-6 border border-sky-200/50">
              <Globe className="w-5 h-5 text-sky-600" />
              <span>Tham gia cộng đồng</span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Bắt đầu hành trình
              </span>
            </h2>
            
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Khám phá thế giới âm nhạc chữa lành, kết nối với cộng đồng và tạo ra hành trình âm nhạc cá nhân của riêng bạn
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
              onClick={() => handleNavigate(createPageUrl("We"))}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold hover:shadow-2xl transition-all text-base md:text-lg shadow-xl w-full sm:w-auto flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Khám phá cộng đồng
              </motion.button>
              
              <motion.button
                onClick={() => handleNavigate(createPageUrl("You"))}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="px-8 md:px-10 py-4 md:py-5 rounded-full bg-white text-sky-600 font-semibold hover:bg-sky-50 transition-all text-base md:text-lg border-2 border-sky-300 w-full sm:w-auto flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Bắt đầu hành trình
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-12 flex items-center justify-center gap-8 text-sm text-sky-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-500" />
                <span>Miễn phí tham gia</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-500" />
                <span>Không cần đăng ký</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-500" />
                <span>Trải nghiệm ngay</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
