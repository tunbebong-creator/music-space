

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { customAPI as base44 } from "@/api/customClient";
import { FileText, Heart, User, Menu, X, Phone, Mail, Facebook, MapPin, Calendar, Sparkles, LogIn, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import ModernAuthModal from "@/components/ModernAuthModal";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isSubscribed, setIsSubscribed] = React.useState(null); // NEW: moved to top level
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [consultDropdownOpen, setConsultDropdownOpen] = React.useState(false);
  const { scrollYProgress } = useScroll();

  // Parallax cloud movements
  const cloudY1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const cloudY2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const cloudY3 = useTransform(scrollYProgress, [0, 1], [0, 250]);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        // Check localStorage first
        const userData = localStorage.getItem('user_data');
        if (userData) {
          setUser(JSON.parse(userData));
          return;
        }
        
        // Fallback to API call - with error handling
        try {
          const currentUser = await base44.auth.me();
          setUser(currentUser);
        } catch (apiError) {
          console.warn('API call failed in Layout:', apiError);
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, [location.pathname]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (consultDropdownOpen && !event.target.closest('.relative')) {
        setConsultDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [consultDropdownOpen]);

  // NEW: Auto scroll to top on route change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // NEW: Check subscription status when user changes
  React.useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !user.email) {
        setIsSubscribed(null);
        return;
      }
      
      try {
        if (base44 && base44.entities && base44.entities.Newsletter && base44.entities.Newsletter.find) {
          const response = await base44.entities.Newsletter.find();
          if (Array.isArray(response)) {
            const existingSubscription = response.find(sub => sub.email === user.email);
            setIsSubscribed(!!existingSubscription);
          } else {
            setIsSubscribed(false);
          }
        } else {
          setIsSubscribed(false);
        }
      } catch (error) {
        console.warn("Skip newsletter subscription check:", error?.message || error);
        setIsSubscribed(false);
      }
    };
    
    checkSubscription();
  }, [user]);

  // Google Analytics
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !window.gtag) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-XXXXXXXXXX');
      `;
      document.head.appendChild(script2);
      window.gtag = function() { window.dataLayer.push(arguments); };
    }

    if (window.gtag) {
      window.gtag('config', 'G-XXXXXXXXXX', {
        page_path: location.pathname,
      });
    }
  }, [location.pathname]);

  const navItems = [
    { name: "Cộng đồng", path: createPageUrl("We"), icon: FileText },
    { name: "Sự kiện", path: createPageUrl("Love"), icon: Heart },
    { name: "Hành trình", path: createPageUrl("You"), icon: User }
  ];

  const userName = user ? user.full_name?.split(' ')[0] || user.email.split('@')[0] : "You";
  
  // Debug: Log user state
  React.useEffect(() => {
    console.log('User state:', user);
  }, [user]);

  // Listen for localStorage changes (when user logs in from another tab)
  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user_data') {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue));
        } else {
          setUser(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getContactEmail = () => {
    if (location.pathname === createPageUrl("Love")) return "space@musicspace.edu.vn";
    if (location.pathname === createPageUrl("You")) return "help@musicspace.edu.vn";
    return "media@musicspace.edu.vn";
  };

  const handleSubscribe = async () => {
    if (!user) return;
    
    try {
      await base44.entities.Newsletter.create({ 
        email: user.email, 
        name: user.full_name || user.email.split('@')[0]
      });
      setIsSubscribed(true); // Always set to true on success
    } catch (error) {
      if (error.message && error.message.includes('duplicate')) {
        setIsSubscribed(true); // If duplicate, it means they are subscribed
      } else {
        console.error('Newsletter subscription error:', error);
        alert('Có lỗi xảy ra khi đăng ký, vui lòng thử lại.');
        setIsSubscribed(false); // Indicate failure if not a duplicate
      }
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setAuthModalOpen(false);
    // Redirect to user's page after successful login
    window.location.href = createPageUrl("You");
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#B8D8F0] via-[#E3F2FD] to-white relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;600;700&family=Great+Vibes&family=Playfair+Display:wght@400;500;600;700&display=swap');
        
        :root {
          --sky-deep: #4A90E2;
          --sky-mid: #7BB3E8;
          --sky-light: #B8D8F0;
          --ocean-deep: #0D47A1;
          --ocean-mid: #1E88E5;
          --ocean-light: #42A5F5;
          --cloud-white: #FFFFFF;
          --cloud-soft: #F0F4F8;
        }
        
        * {
          font-family: 'Noto Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .font-handwriting {
          font-family: 'Great Vibes', cursive;
        }
        
        .font-serif {
          font-family: 'Playfair Display', serif;
        }
        
        .sky-gradient {
          background: linear-gradient(180deg, var(--sky-deep) 0%, var(--sky-mid) 50%, var(--sky-light) 100%);
        }
        
        .ocean-gradient {
          background: linear-gradient(135deg, var(--ocean-deep) 0%, var(--ocean-mid) 50%, var(--ocean-light) 100%);
        }
        
        .btn-sky {
          background: linear-gradient(135deg, var(--sky-deep) 0%, var(--sky-mid) 100%);
          color: white;
          padding: 12px 32px;
          border-radius: 50px;
          font-weight: 500;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        
        .btn-sky:hover {
          box-shadow: 0 8px 20px rgba(74, 144, 226, 0.3);
          transform: translateY(-2px);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .floating {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* Floating Clouds Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Cloud 1 */}
        <motion.div
          animate={{ x: [-200, typeof window !== 'undefined' ? window.innerWidth + 200 : 2000] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ y: cloudY1 }}
          className="absolute top-[10%] -left-32"
        >
          <div className="w-64 h-16 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent blur-2xl"></div>
        </motion.div>

        {/* Cloud 2 */}
        <motion.div
          animate={{ x: [-300, typeof window !== 'undefined' ? window.innerWidth + 300 : 2200] }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear", delay: 10 }}
          style={{ y: cloudY2 }}
          className="absolute top-[30%] -left-48"
        >
          <div className="w-96 h-20 rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent blur-3xl"></div>
        </motion.div>

        {/* Cloud 3 */}
        <motion.div
          animate={{ x: [-150, typeof window !== 'undefined' ? window.innerWidth + 150 : 1800] }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear", delay: 20 }}
          style={{ y: cloudY3 }}
          className="absolute top-[60%] -left-24"
        >
          <div className="w-72 h-14 rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent blur-2xl"></div>
        </motion.div>

        {/* Ambient light particles */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-[20%] left-[20%] w-40 h-40 rounded-full bg-[#7BB3E8]/20 blur-3xl floating"></div>
          <div className="absolute top-[50%] right-[15%] w-48 h-48 rounded-full bg-[#4A90E2]/15 blur-3xl floating" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-[70%] left-[40%] w-36 h-36 rounded-full bg-[#B8D8F0]/25 blur-3xl floating" style={{animationDelay: '4s'}}></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#B8D8F0]/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e846d5964cad3c69447640/8d0e4fd45_Thietkechuacoten-2.png"
                alt="Music Space"
                className="h-16 w-auto" />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-lg font-medium transition-colors ${
                    location.pathname === item.path ? 'text-[#4A90E2]' : 'text-gray-700 hover:text-[#4A90E2]'
                  }`}>
                  {item.name}
                </Link>
              ))}

              {!user && (
                <>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-[#4A90E2] to-[#7BB3E8] text-white text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Đăng nhập
                  </button>
                  
                  
                  <div className="relative">
                    <button
                      onClick={() => setConsultDropdownOpen(!consultDropdownOpen)}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm">
                      Tư vấn Đăng ký
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${consultDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {consultDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Tư Vấn Đăng Ký
                        </div>
                        <div className="border-t border-gray-50 my-2"></div>
                        <Link
                          to={createPageUrl("Contact")}
                          onClick={() => setConsultDropdownOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-medium">
                          🏢 Đăng ký làm chủ Space
                        </Link>
                        <div className="border-t border-gray-50"></div>
                        <Link
                          to={createPageUrl("Contact")}
                          onClick={() => setConsultDropdownOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-800 hover:bg-pink-50 hover:text-pink-700 transition-all duration-200 font-medium">
                          🎵 Đăng ký làm Artist
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}

              {user?.role === 'admin' && (
                <>
                  <Link
                    to={createPageUrl("Admin")}
                    className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition-colors">
                    Admin
                  </Link>
                  <Link
                    to={createPageUrl("NewsletterManagement")}
                    className="px-4 py-2 rounded-full bg-[#B8D8F0] text-[#0D47A1] text-sm font-medium hover:bg-[#7BB3E8] hover:text-white transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Newsletter
                  </Link>
                </>
              )}

              {user?.space_owner_verified && (
                <Link
                  to={createPageUrl("SpaceDashboard")}
                  className="px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-sm font-medium hover:bg-teal-200 transition-colors">
                  Dashboard
                </Link>
              )}

              {(user?.role === 'artist' || user?.artist_verified) && (
                <Link
                  to={createPageUrl("ArtistDashboard")}
                  className="px-4 py-2 rounded-full bg-pink-100 text-pink-700 text-sm font-medium hover:bg-pink-200 transition-colors">
                  🎵 Artist Dashboard
                </Link>
              )}

              {/* Show user info and logout when logged in */}
              {user && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Xin chào, {user.full_name || user.email}</span>
                    <button
                      onClick={() => {
                        base44.auth.logout();
                        setUser(null);
                        window.location.href = '/';
                      }}
                      className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors">
                      Đăng xuất
                    </button>
                  </div>
                  
                  {/* Tư vấn đăng ký thêm role cho user đã đăng nhập */}
                  <div className="relative">
                    <button
                      onClick={() => setConsultDropdownOpen(!consultDropdownOpen)}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm">
                      Tư vấn Đăng ký
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${consultDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {consultDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Tư Vấn Đăng Ký
                        </div>
                        <div className="border-t border-gray-50 my-2"></div>
                        <Link
                          to={createPageUrl("Contact")}
                          onClick={() => setConsultDropdownOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-medium">
                          🏢 Đăng ký làm chủ Space
                        </Link>
                        <div className="border-t border-gray-50"></div>
                        <Link
                          to={createPageUrl("Contact")}
                          onClick={() => setConsultDropdownOpen(false)}
                          className="block px-4 py-3 text-sm text-gray-800 hover:bg-pink-50 hover:text-pink-700 transition-all duration-200 font-medium">
                          🎵 Đăng ký làm Artist
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#B8D8F0]/30 bg-white/95 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 text-lg font-medium ${
                    location.pathname === item.path ? 'text-[#4A90E2]' : 'text-gray-700'
                  }`}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="pt-24 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {/* Newsletter Signup - SMART VERSION */}
          {(!user || (user && isSubscribed === false)) && (
            <div className="mb-12 pb-12 border-b border-gray-200">
              <div className="max-w-xl mx-auto text-center">
                {!user ? (
                  <>
                    <div className="text-3xl mb-3">📬</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      Đăng ký nhận tin mới
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Nhận thông tin sự kiện và nội dung độc quyền
                    </p>
                    
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const email = e.target.email.value;
                        const name = e.target.name.value;
                        
                        try {
                          await base44.entities.Newsletter.create({ email, name });
                          alert('✅ Đăng ký thành công!');
                          e.target.reset();
                        } catch (error) {
                          if (error.message && error.message.includes('duplicate')) {
                            alert('Bạn đã đăng ký rồi! 🎉');
                          } else {
                            console.error('Newsletter signup error:', error);
                            alert('Có lỗi xảy ra, vui lòng thử lại.');
                          }
                        }
                      }}
                      className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
                    >
                      <input
                        type="text"
                        name="name"
                        placeholder="Tên"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4A90E2] bg-white text-sm transition-colors"
                      />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="Email"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4A90E2] bg-white text-sm transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4A90E2] to-[#7BB3E8] text-white font-medium hover:shadow-lg transition-all text-sm whitespace-nowrap"
                      >
                        Đăng ký
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="text-3xl mb-3">✨</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      Nhận tin mới từ Music Space
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      1-click để đăng ký với {user.email}
                    </p>
                    
                    <button
                      onClick={handleSubscribe}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4A90E2] to-[#7BB3E8] text-white font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Đăng ký ngay
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="sm:col-span-2 md:col-span-2">
              <Link to={createPageUrl("Home")} className="inline-block mb-4">
                <h3 className="text-3xl font-handwriting text-[#4A90E2]">
                  Music Space
                </h3>
              </Link>
              <p className="text-gray-600 text-sm mb-4 max-w-md leading-relaxed">
                Vietnam's Healing Music Map 
              </p>
              
              <a
                href="https://www.facebook.com/profile.php?id=61576657110630"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#4A90E2] transition-colors">
                <Facebook className="w-5 h-5" />
                <span>Theo dõi chúng tôi</span>
              </a>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">Khám phá</h4>
              <div className="space-y-2">
                <Link to={createPageUrl("We")} className="block text-sm text-gray-600 hover:text-[#4A90E2] transition-colors">
                  We - Câu chuyện
                </Link>
                <Link to={createPageUrl("Love")} className="block text-sm text-gray-600 hover:text-[#4A90E2] transition-colors">
                  Love - Không gian & Sự kiện
                </Link>
                <Link to={createPageUrl("You")} className="block text-sm text-gray-600 hover:text-[#4A90E2] transition-colors">
                  You - Hành trình
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">Liên hệ</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <a href="tel:0862899982" className="block hover:text-[#4A90E2] transition-colors">
                  0862 899 982<br/>Nguyễn Văn Thành
                </a>
                <a href={`mailto:${getContactEmail()}`} className="text-[#4A90E2] block hover:text-[#7BB3E8] transition-colors">
                  {getContactEmail()}
                </a>
                <p className="text-sm leading-relaxed">
                  Đại học FPT Hà Nội<br/>Khu Công nghệ cao Hòa Lạc
                </p>
              </div>
            </div>
          </div>

          {/* Partners */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <p className="text-sm text-gray-500 mb-4">Đơn vị đồng hành</p>
            <div className="flex items-center gap-6 flex-wrap">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e846d5964cad3c69447640/ef655f4fe_image.png"
                alt="FPT University"
                className="h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" 
              />
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e846d5964cad3c69447640/c4e7070a1_image.png"
                alt="VNNIC" 
                className="h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" 
              />
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e846d5964cad3c69447640/162895e2c_image.png"
                alt="WHO" 
                className="h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" 
              />
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e846d5964cad3c69447640/2c5016a63_image.png"
                alt="PA Vietnam" 
                className="h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" 
              />
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e846d5964cad3c69447640/6b011d422_image.png"
                alt="Base44" 
                className="h-8 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity" 
              />
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2025 Music Space. Dự án của Đại học FPT, được VNNIC hỗ trợ.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-[#4A90E2] transition-colors">Điều khoản</a>
              <span>•</span>
              <a href="#" className="hover:text-[#4A90E2] transition-colors">Chính sách</a>
              <span>•</span>
              <a href="#" className="hover:text-[#4A90E2] transition-colors">Liên hệ</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <ModernAuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onSuccess={handleAuthSuccess} 
      />
    </div>
  );
}

