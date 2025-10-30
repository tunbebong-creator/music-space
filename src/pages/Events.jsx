
import React from "react";
import { customAPI } from "@/api/customClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, Users, Clock, Filter, Navigation, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ModernAuthModal from "../components/ModernAuthModal";
import Pagination from "../components/Pagination";

export default function Events() {
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [showModernAuthModal, setShowModernAuthModal] = React.useState(false);
  const [showDetailModal, setShowDetailModal] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [userLocation, setUserLocation] = React.useState(null);
  const [searchingLocation, setSearchingLocation] = React.useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        // First check localStorage for user data
        const userData = localStorage.getItem('user_data');
        const token = localStorage.getItem('auth_token');
        
        if (userData && token) {
          const user = JSON.parse(userData);
          setUser(user);
          return;
        }
        
        // Fallback to API call
        const currentUser = await customAPI.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => customAPI.entities.Event.find(),
    initialData: [],
  });

  const registerEventMutation = useMutation({
    mutationFn: (eventId) => customAPI.entities.EventRegistration.create({
      user_id: user.id,
      event_id: eventId,
      status: "registered"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      setShowDetailModal(false);
      alert("Đăng ký thành công!");
    },
  });

  const handleRegister = (event) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    registerEventMutation.mutate(event.id);
  };

  const getUserLocation = () => {
    setSearchingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setSearchingLocation(false);
        },
        (error) => {
          console.error("Location error:", error);
          setSearchingLocation(false);
          alert("Không thể lấy vị trí. Vui lòng bật GPS và cho phép truy cập vị trí.");
        }
      );
    } else {
      setSearchingLocation(false);
      alert("Trình duyệt không hỗ trợ định vị.");
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const categories = [
    { value: "all", label: "Tất cả" },
    { value: "workshop", label: "Workshop" },
    { value: "acoustic", label: "Acoustic" },
    { value: "talk", label: "Talkshow" },
    { value: "performance", label: "Biểu diễn" }
  ];

  let filteredEvents = filterCategory === "all" 
    ? events 
    : events.filter(event => event.category === filterCategory);

  if (userLocation) {
    filteredEvents = [...filteredEvents].sort((a, b) => {
      // Try different possible field names for coordinates
      const latA = a.latitude || a.space_latitude || 21.0135;
      const lngA = a.longitude || a.space_longitude || 105.5275;
      const latB = b.latitude || b.space_latitude || 21.0135;
      const lngB = b.longitude || b.space_longitude || 105.5275;
      
      const distA = calculateDistance(userLocation.lat, userLocation.lng, latA, lngA);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, latB, lngB);
      return distA - distB;
    });
  }

  const getItemsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 4;
      return 6;
    }
    return 6;
  };

  const [itemsPerPage, setItemsPerPage] = React.useState(getItemsPerPage());

  React.useEffect(() => {
    const handleResize = () => setItemsPerPage(getItemsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEvents = filteredEvents.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen py-20 px-4">
      {/* Hero */}
      <section className="max-w-4xl mx-auto mb-16 md:mb-24 text-center py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-handwriting text-gray-800 mb-6 md:mb-8">
            Events
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 leading-relaxed font-light px-4">
            Tham gia những sự kiện âm nhạc độc đáo
            <br className="hidden md:block" />
            và kết nối với cộng đồng
          </p>
        </motion.div>
      </section>

      {/* Location Button */}
      <section className="max-w-4xl mx-auto mb-12 md:mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <button
            onClick={getUserLocation}
            disabled={searchingLocation}
            className="btn-primary flex items-center gap-2 mx-auto text-sm md:text-base px-6 md:px-8 py-3 md:py-4"
          >
            <Navigation className={`w-4 h-4 md:w-5 md:h-5 ${searchingLocation ? 'animate-spin' : ''}`} />
            {searchingLocation ? 'Đang tìm vị trí...' : userLocation ? 'Đã bật định vị ✓' : 'Tìm sự kiện gần tôi'}
          </button>
        </motion.div>
      </section>

      {/* Filter */}
      <section className="max-w-6xl mx-auto mb-10 md:mb-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 md:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 flex-shrink-0">
              <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              <span className="font-medium text-sm md:text-base">Loại:</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:flex-wrap scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {categories.map((cat) => (
                <motion.button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  className={`px-5 md:px-6 py-2.5 md:py-3 rounded-full font-medium transition-all flex-shrink-0 text-sm md:text-base touch-manipulation ${
                    filterCategory === cat.value
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}>
                  {cat.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 md:p-6 shadow-sm">
                <div className="h-40 md:h-56 bg-gray-100 rounded-2xl mb-3 md:mb-4 animate-pulse"></div>
                <div className="h-5 md:h-7 bg-gray-100 rounded-xl mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-100 rounded-xl w-2/3 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 md:p-16 text-center shadow-sm">
            <Calendar className="w-14 h-14 md:w-20 md:h-20 text-gray-300 mx-auto mb-5" />
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3">
              Chưa có sự kiện nào
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Chúng tôi sẽ cập nhật sự kiện mới sớm
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {currentEvents.map((event, index) => {
                const distance = userLocation ? calculateDistance(
                  userLocation.lat, userLocation.lng, 
                  event.latitude || event.space_latitude || 21.0135, 
                  event.longitude || event.space_longitude || 105.5275
                ) : null;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDetailModal(true);
                    }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                  >
                    {(event.cover_image || event.image_url) && (
                      <div className="relative h-40 md:h-56 overflow-hidden bg-gray-50">
                        <img
                          src={event.cover_image || event.image_url}
                          alt={event.title}
                          loading="lazy"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                        {distance && (
                          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-medium text-gray-800 shadow-sm">
                            📍 {distance.toFixed(1)} km
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4 md:p-7">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#1E88E5]" />
                        <span className="truncate">{format(new Date(event.date), "dd/MM/yyyy", { locale: vi })}</span>
                      </div>
                      <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 md:mb-3 line-clamp-2 leading-snug">
                        {event.title}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-4 md:mb-5 hidden md:block leading-relaxed">
                        {event.description}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegister(event);
                        }}
                        className="w-full px-4 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs md:text-sm font-medium hover:shadow-lg transition-all touch-manipulation"
                      >
                        Đăng ký ngay
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      {/* Elegant Login CTA */}
      {!user && (
        <section className="max-w-4xl mx-auto mt-16 mb-12 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm"
          >
            <div className="text-center max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-slate-100 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-700" />
              </div>

              <h3 className="text-2xl font-serif font-semibold text-slate-800 mb-3">
                Đăng ký sự kiện nhanh chóng
              </h3>
              
              <p className="text-slate-600 mb-8 leading-relaxed">
                Đăng nhập để đăng ký 1-click và không bỏ lỡ sự kiện yêu thích
              </p>

              {!user ? (
                <button
                  onClick={() => setShowModernAuthModal(true)}
                  className="px-8 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-all shadow-md hover:shadow-lg"
                >
                  Đăng nhập
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-green-600 font-medium mb-2">✅ Đã đăng nhập</p>
                  <p className="text-sm text-gray-600">Bạn có thể đăng ký sự kiện</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-600">
                <span>✓ Đăng ký 1-click</span>
                <span>✓ Nhắc nhở tự động</span>
                <span>✓ Lịch cá nhân</span>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Event Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
            >
              {(selectedEvent.cover_image || selectedEvent.image_url) && (
                <div className="relative h-64 md:h-96 overflow-hidden">
                  <img
                    src={selectedEvent.cover_image || selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xl flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              )}

              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                  <Calendar className="w-5 h-5 text-[#1E88E5]" />
                  <span>{format(new Date(selectedEvent.date), "dd MMMM, yyyy", { locale: vi })}</span>
                  <span>•</span>
                  <Clock className="w-5 h-5 text-[#1E88E5]" />
                  <span>{selectedEvent.time}</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                  {selectedEvent.title}
                </h2>

                <p className="text-gray-700 leading-relaxed mb-6">
                  {selectedEvent.description}
                </p>

                {selectedEvent.capacity && (
                  <div className="flex items-center gap-2 text-gray-600 mb-6">
                    <Users className="w-5 h-5 text-[#1E88E5]" />
                    <span>Sức chứa: {selectedEvent.capacity} người</span>
                  </div>
                )}

                <button
                  onClick={() => handleRegister(selectedEvent)}
                  disabled={registerEventMutation.isPending}
                  className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {registerEventMutation.isPending ? "Đang đăng ký..." : "Đăng ký tham gia"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        context="event_register"
      />

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        context="event_register"
      />

      {/* Modern Auth Modal */}
      <ModernAuthModal
        isOpen={showModernAuthModal}
        onClose={() => setShowModernAuthModal(false)}
        onSuccess={(user) => {
          setUser(user);
          setShowModernAuthModal(false);
        }}
      />
    </div>
  );
}
