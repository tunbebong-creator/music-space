
import React from "react";
import { customAPI } from "@/api/customClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, Filter, Users, Navigation, Map as MapIcon, X, CheckCircle, Calendar, Clock, ArrowRight, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import SpaceDetailModal from "../components/SpaceDetailModal";
import BookingModal from "../components/BookingModal";
import ModernAuthModal from "../components/ModernAuthModal";
import Pagination from "../components/Pagination";
import SpaceCard from "../components/SpaceCard";
import EventCard from "../components/EventCard";
import FeedbackModal from "../components/FeedbackModal";
import NotificationCenter from "../components/NotificationCenter";
import ReportModal from "../components/ReportModal";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function Love() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("events");
  const [selectedSpace, setSelectedSpace] = React.useState(null);
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [showDetailModal, setShowDetailModal] = React.useState(false);
  const [showEventModal, setShowEventModal] = React.useState(false);
  const [showBookingModal, setShowBookingModal] = React.useState(false);
  const [showModernAuthModal, setShowModernAuthModal] = React.useState(false);
  const [showMapModal, setShowMapModal] = React.useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mapSearchQuery, setMapSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState("all");
  const [eventCategory, setEventCategory] = React.useState("all");
  const [mapCenter, setMapCenter] = React.useState([16.0544, 108.2022]);
  const [user, setUser] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [userLocation, setUserLocation] = React.useState(null);
  const [searchingLocation, setSearchingLocation] = React.useState(false);
  const [followedSpaces, setFollowedSpaces] = React.useState(new Set());
  const [registeredEvents, setRegisteredEvents] = React.useState(new Set());
  const [notifications, setNotifications] = React.useState([]);
  const [feedbackTarget, setFeedbackTarget] = React.useState(null);
  const [reportTarget, setReportTarget] = React.useState(null);
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

  const { data: spaces, isLoading: spacesLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => customAPI.entities.Space.find({ approved: true }),
    initialData: [],
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
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
      setShowEventModal(false);
      alert("✅ Đăng ký sự kiện thành công!");
    },
  });

  const getUserLocation = () => {
    setSearchingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setMapCenter([position.coords.latitude, position.coords.longitude]);
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

  // Filter Spaces
  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = ((space.name || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
      ((space.address || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
      ((space.city || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === "all" || space.space_type === filterType;
    return matchesSearch && matchesType;
  });

  // Filter Events
  const filteredEvents = events.filter(event => {
    const matchesSearch = ((event.title || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
      ((event.description || '').toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = eventCategory === "all" || event.category === eventCategory;
    return matchesSearch && matchesCategory;
  });

  const mapFilteredSpaces = spaces.filter(space => {
    const matchesMapSearch = mapSearchQuery === "" || 
      ((space.name || '').toLowerCase().includes(mapSearchQuery.toLowerCase())) ||
      ((space.address || '').toLowerCase().includes(mapSearchQuery.toLowerCase())) ||
      ((space.city || '').toLowerCase().includes(mapSearchQuery.toLowerCase()));
    return matchesMapSearch;
  });

  let sortedSpaces = [...filteredSpaces];
  let sortedEvents = [...filteredEvents];

  if (userLocation) {
    sortedSpaces = sortedSpaces.sort((a, b) => {
      const aLat = a.latitude || mapCenter[0];
      const aLng = a.longitude || mapCenter[1];
      const bLat = b.latitude || mapCenter[0];
      const bLng = b.longitude || mapCenter[1];
      const distA = calculateDistance(userLocation.lat, userLocation.lng, aLat, aLng);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, bLat, bLng);
      return distA - distB;
    });

    sortedEvents = sortedEvents.sort((a, b) => {
      const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude || 21.0135, a.longitude || 105.5275);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude || 21.0135, b.longitude || 105.5275);
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
  }, [searchQuery, filterType, eventCategory, userLocation, activeTab]);

  const currentItems = activeTab === "spaces" ? sortedSpaces : sortedEvents;
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayItems = currentItems.slice(startIndex, endIndex);

  const handleSpaceClick = (space) => {
    setSelectedSpace(space);
    setShowDetailModal(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleBook = (space) => {
    if (!user) {
      setShowDetailModal(false);
      setSelectedSpace(space);
      setShowModernAuthModal(true);
      return;
    }
    setShowDetailModal(false);
    setSelectedSpace(space);
    setShowBookingModal(true);
  };

  const handleRegisterEvent = (event) => {
    if (!user) {
      setShowModernAuthModal(true);
      return;
    }
    registerEventMutation.mutate(event.id);
  };

  const handleAuthSuccess = () => {
    setShowModernAuthModal(false);
    if (selectedSpace) {
      setShowBookingModal(true);
    }
  };

  // New handlers for LOVE module functionality
  const handleSpaceFollow = async (space) => {
    if (!user) {
      setShowModernAuthModal(true);
      return;
    }

    try {
      const isFollowing = followedSpaces.has(space.id);
      if (isFollowing) {
        // Unfollow
        setFollowedSpaces(prev => {
          const newSet = new Set(prev);
          newSet.delete(space.id);
          return newSet;
        });
        // API call to unfollow
        // await customAPI.entities.SpaceFollow.delete({ space_id: space.id, user_id: user.id });
      } else {
        // Follow
        setFollowedSpaces(prev => new Set([...prev, space.id]));
        // API call to follow
        // await customAPI.entities.SpaceFollow.create({ space_id: space.id, user_id: user.id });
      }
    } catch (error) {
      console.error("Follow/unfollow error:", error);
    }
  };

  const handleEventFollow = async (event) => {
    if (!user) {
      setShowModernAuthModal(true);
      return;
    }

    try {
      // Similar to space follow logic
      console.log("Event follow:", event);
    } catch (error) {
      console.error("Event follow error:", error);
    }
  };

  const handleFeedback = (target, type) => {
    if (!user) {
      setShowModernAuthModal(true);
      return;
    }

    setFeedbackTarget({ target, type });
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      // API call to submit feedback
      // await customAPI.entities.Review.create(feedbackData);
      alert("Cảm ơn bạn đã đánh giá! Phản hồi của bạn rất quan trọng với chúng tôi.");
    } catch (error) {
      console.error("Feedback submission error:", error);
      alert("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.");
    }
  };

  const handleNotificationMarkAsRead = async (notificationId) => {
    try {
      // await customAPI.entities.Notification.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Mark notification as read error:", error);
    }
  };

  const handleNotificationMarkAllAsRead = async () => {
    try {
      // await customAPI.entities.Notification.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
    }
  };

  const handleReport = (target, type) => {
    if (!user) {
      setShowModernAuthModal(true);
      return;
    }

    setReportTarget({ target, type });
    setShowReportModal(true);
  };

  const handleReportSubmit = async (reportData) => {
    try {
      // API call to submit report
      // await customAPI.entities.Report.create(reportData);
      alert("Cảm ơn bạn đã báo cáo! Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.");
    } catch (error) {
      console.error("Report submission error:", error);
      alert("Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.");
    }
  };

  const getSpaceCoordinates = (space, index) => {
    if (space.latitude && space.longitude) {
      return [space.latitude, space.longitude];
    }
    const vietnamCities = {
      "Hà Nội": [21.0285, 105.8542],
      "Hồ Chí Minh": [10.8231, 106.6297],
      "Đà Nẵng": [16.0544, 108.2022],
      "Hải Phòng": [20.8449, 106.6881],
      "Cần Thơ": [10.0452, 105.7469],
      "Huế": [16.4637, 107.5909],
      "Nha Trang": [12.2388, 109.1967],
      "Đà Lạt": [11.9404, 108.4583],
      "Vũng Tàu": [10.4113, 107.1369],
      "Quy Nhơn": [13.7830, 109.2196]
    };
    if (space.city) {
      const cityCoords = vietnamCities[space.city];
      if (cityCoords) {
        const offsetLat = (Math.random() - 0.5) * 0.018;
        const offsetLng = (Math.random() - 0.5) * 0.018;
        return [cityCoords[0] + offsetLat, cityCoords[1] + offsetLng];
      }
    }
    const baseLocations = Object.values(vietnamCities);
    const randomCity = baseLocations[index % baseLocations.length];
    const offsetLat = (Math.random() - 0.5) * 0.05;
    const offsetLng = (Math.random() - 0.5) * 0.05;
    return [randomCity[0] + offsetLat, randomCity[1] + offsetLng];
  };

  const createMarkerClusters = (spaces) => {
    const clusters = [];
    const processed = new Set();
    const CLUSTER_RADIUS_KM = 25;
    spaces.forEach((space, i) => {
      if (processed.has(space.id)) return;
      const [lat, lng] = getSpaceCoordinates(space, i);
      const nearbySpaces = [space];
      processed.add(space.id);
      spaces.forEach((otherSpace, j) => {
        if (processed.has(otherSpace.id) || i === j) return;
        const [otherLat, otherLng] = getSpaceCoordinates(otherSpace, j);
        const distance = calculateDistance(lat, lng, otherLat, otherLng);
        if (distance < CLUSTER_RADIUS_KM) {
          nearbySpaces.push(otherSpace);
          processed.add(otherSpace.id);
        }
      });
      clusters.push({
        position: [lat, lng],
        spaces: nearbySpaces,
        count: nearbySpaces.length
      });
    });
    return clusters;
  };

  return (
    <div className="min-h-screen">
      {/* Hero - Ultra Modern */}
      <section className="relative py-20 md:py-32 px-4 md:px-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              y: [0, -30, 0],
              rotate: [0, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[10%] text-sky-300/40">
            <Calendar className="w-24 h-24" />
          </motion.div>
          
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, -5, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[60%] right-[15%] text-blue-300/30">
            <MapPin className="w-32 h-32" />
          </motion.div>
          
          <motion.div
            animate={{ 
              y: [0, -25, 0],
              rotate: [0, 8, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute top-[40%] left-[80%] text-indigo-300/20">
            <Users className="w-28 h-28" />
          </motion.div>

          {/* Ambient particles */}
          <div className="absolute inset-0">
            <div className="absolute top-[30%] left-[20%] w-40 h-40 rounded-full bg-sky-300/20 blur-3xl animate-pulse"></div>
            <div className="absolute top-[70%] right-[25%] w-48 h-48 rounded-full bg-blue-300/20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-[50%] left-[60%] w-32 h-32 rounded-full bg-indigo-300/20 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-sky-200/50 mb-6">
                <Calendar className="w-5 h-5 text-sky-500" />
                <span className="text-gray-700 font-medium">Đặt vé & Đặt chỗ</span>
              </div>
            </motion.div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-gray-800 mb-8 leading-tight">
              <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Love
              </span>
            </h1>
            
            {user ? (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl md:text-4xl text-gray-700 mb-6 font-light leading-relaxed max-w-4xl mx-auto">
                Chào mừng <span className="font-semibold text-sky-600">{user.full_name || user.email.split('@')[0]}</span>! 
                <br />Đặt vé cho không gian âm nhạc & sự kiện đặc biệt
              </motion.p>
            ) : (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl md:text-4xl text-gray-700 mb-6 font-light leading-relaxed max-w-4xl mx-auto">
                Đặt vé cho không gian âm nhạc & sự kiện đặc biệt
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Search & Actions - Ultra Modern */}
        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-3 flex items-center gap-4 shadow-2xl border border-sky-200">
              <div className="pl-4">
                <Search className="w-6 h-6 text-sky-500" />
              </div>
            <input
              type="text"
                placeholder={activeTab === "spaces" ? "Tìm kiếm không gian để đặt chỗ..." : "Tìm kiếm sự kiện để đặt vé..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent py-4 outline-none text-gray-700 placeholder-gray-400 text-lg font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="w-10 h-10 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center transition-colors mr-2"
                >
                  <X className="w-5 h-5 text-sky-600" />
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <motion.button
              onClick={getUserLocation}
              disabled={searchingLocation}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 md:px-8 py-4 md:py-5 rounded-2xl font-semibold transition-all flex items-center gap-3 text-base md:text-lg touch-manipulation shadow-xl ${
                userLocation 
                  ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-white/80 text-gray-700 border border-sky-200 hover:bg-sky-50 hover:border-sky-300 backdrop-blur-md hover:shadow-lg'
              }`}
            >
              <Navigation className={`w-5 h-5 ${searchingLocation ? 'animate-spin' : ''}`} />
              {searchingLocation ? 'Đang tìm...' : userLocation ? 'Gần tôi ✓' : 'Tìm gần tôi'}
            </motion.button>

            {activeTab === "spaces" && (
              <motion.button
                onClick={() => setShowMapModal(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 md:px-8 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold transition-all flex items-center gap-3 text-base md:text-lg touch-manipulation shadow-xl hover:shadow-2xl"
              >
                <MapIcon className="w-5 h-5" />
                Space Map
              </motion.button>
            )}

            {user && (
              <motion.button
                onClick={() => setShowNotificationCenter(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative px-6 md:px-8 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold transition-all flex items-center gap-3 text-base md:text-lg touch-manipulation shadow-xl hover:shadow-2xl"
              >
                <Bell className="w-5 h-5" />
                Thông báo
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Tab Switcher - Ultra Modern Design */}
      <section className="px-4 md:px-6 py-12 -mt-8 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-4 shadow-2xl border border-white/20">
            {/* Animated Background Slider - Ultra Gradient */}
            <motion.div
              className="absolute top-4 bottom-4 rounded-[2rem] bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 shadow-2xl"
              initial={false}
              animate={{
                left: activeTab === "events" ? "1rem" : "50%",
                right: activeTab === "events" ? "50%" : "1rem",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            {/* Tabs */}
            <div className="relative z-10 grid grid-cols-2 gap-4">
              {/* Events Tab - First */}
              <motion.button
                onClick={() => setActiveTab("events")}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className={`px-8 md:px-10 py-6 md:py-8 rounded-[2rem] font-bold transition-all duration-300 ${
                  activeTab === "events"
                    ? 'text-white'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3 text-xl md:text-2xl">
                    <motion.span 
                      className={`text-3xl ${activeTab === "events" ? "animate-bounce" : ""}`}
                      animate={activeTab === "events" ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      🎫
                    </motion.span>
                    <span className="font-handwriting text-3xl md:text-4xl">Đặt vé</span>
                  </div>
                  <span className={`text-sm md:text-base font-semibold ${
                    activeTab === "events" ? "text-white/95" : "text-gray-500"
                  }`}>
                    {events.length} sự kiện
                  </span>
                </div>
              </motion.button>

              {/* Spaces Tab - Second */}
              <motion.button
                onClick={() => setActiveTab("spaces")}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className={`px-8 md:px-10 py-6 md:py-8 rounded-[2rem] font-bold transition-all duration-300 ${
                  activeTab === "spaces"
                    ? 'text-white'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3 text-xl md:text-2xl">
                    <motion.span 
                      className={`text-3xl ${activeTab === "spaces" ? "animate-bounce" : ""}`}
                      animate={activeTab === "spaces" ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      🏠
                    </motion.span>
                    <span className="font-handwriting text-3xl md:text-4xl">Spaces</span>
                  </div>
                  <span className={`text-sm md:text-base font-semibold ${
                    activeTab === "spaces" ? "text-white/95" : "text-gray-500"
                  }`}>
                    {spaces.length} không gian
                  </span>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter - Ultra Modern Glass Design */}
      <section className="px-4 md:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 md:p-10 shadow-2xl border border-white/30">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 flex-shrink-0">
                <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                <span className="font-medium text-sm md:text-base">
                  {activeTab === "spaces" ? "Loại:" : "Thể loại:"}
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:flex-wrap scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {activeTab === "spaces" ? (
                  ["all", "cafe", "studio", "event_hall", "outdoor", "gallery"].map((type) => (
                    <motion.button
                      key={type}
                      onClick={() => setFilterType(type)}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold transition-all flex-shrink-0 text-sm md:text-base touch-manipulation ${
                        filterType === type
                          ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-xl shadow-sky-200/50'
                          : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-200/50 backdrop-blur-sm'
                      }`}>
                      {type === "all" ? "Tất cả" : 
                       type === "cafe" ? "Café" :
                       type === "studio" ? "Studio" :
                       type === "event_hall" ? "Hội trường" :
                       type === "outdoor" ? "Ngoài trời" : "Gallery"}
                    </motion.button>
                  ))
                ) : (
                  ["all", "workshop", "acoustic", "talk", "performance"].map((cat) => (
                    <motion.button
                      key={cat}
                      onClick={() => setEventCategory(cat)}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl font-semibold transition-all flex-shrink-0 text-sm md:text-base touch-manipulation ${
                        eventCategory === cat
                          ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-xl shadow-sky-200/50'
                          : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-200/50 backdrop-blur-sm'
                      }`}>
                      {cat === "all" ? "Tất cả" :
                       cat === "workshop" ? "Workshop" :
                       cat === "acoustic" ? "Acoustic" :
                       cat === "talk" ? "Talkshow" : "Biểu diễn"}
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-handwriting text-gray-800">
              {activeTab === "events" 
                ? (userLocation ? 'Đặt vé gần bạn' : 'Đặt vé sự kiện') 
                : (userLocation ? 'Đặt chỗ gần bạn' : 'Đặt chỗ không gian')}
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              {currentItems.length} {activeTab === "events" ? "sự kiện" : "không gian"}
            </p>
          </div>

          {(spacesLoading || eventsLoading) ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-4 md:p-6 shadow-sm">
                  <div className="h-40 md:h-56 bg-gray-100 rounded-2xl mb-3 md:mb-4 animate-pulse"></div>
                  <div className="h-5 md:h-7 bg-gray-100 rounded-xl mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded-xl w-2/3 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 md:p-16 text-center shadow-sm">
              {activeTab === "spaces" ? (
                <>
                  <MapPin className="w-14 h-14 md:w-20 md:h-20 text-gray-300 mx-auto mb-5" />
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3">
                    Không tìm thấy không gian
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">Thử tìm kiếm với từ khóa khác</p>
                </>
              ) : (
                <>
                  <Calendar className="w-14 h-14 md:w-20 md:h-20 text-gray-300 mx-auto mb-5" />
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3">
                    Chưa có sự kiện nào
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">Chúng tôi sẽ cập nhật sự kiện mới sớm</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                {displayItems.map((item, index) => {
                  const distance = userLocation ? calculateDistance(
                    userLocation.lat, userLocation.lng,
                    item.latitude || (activeTab === "spaces" ? mapCenter[0] : 21.0135),
                    item.longitude || (activeTab === "spaces" ? mapCenter[1] : 105.5275)
                  ) : null;

                  return activeTab === "events" ? (
                    <EventCard
                      key={item.id}
                      event={item}
                      user={user}
                      distance={distance}
                      isRegistered={registeredEvents.has(item.id)}
                      isFollowing={false} // You can implement event following if needed
                      onRegister={handleRegisterEvent}
                      onViewDetails={handleEventClick}
                      onFollow={handleEventFollow}
                      onReport={handleReport}
                      showSpaceInfo={true}
                    />
                  ) : (
                    <SpaceCard
                      key={item.id}
                      space={item}
                      user={user}
                      distance={distance}
                      isFollowing={followedSpaces.has(item.id)}
                      onFollow={handleSpaceFollow}
                      onBook={handleBook}
                      onViewDetails={handleSpaceClick}
                      onReport={handleReport}
                      showUpcomingEvents={true}
                      upcomingEvents={[]} // You can fetch upcoming events for each space
                    />
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
        </div>
      </section>

      {/* Login CTA */}
      {!user && (
        <section className="px-4 md:px-6 py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-16 h-16 mb-6 rounded-xl bg-slate-100 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-slate-700" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-slate-800 mb-3">
                    {activeTab === "spaces" ? "Đặt chỗ dễ dàng hơn" : "Đặt vé sự kiện nhanh"}
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    {activeTab === "spaces" 
                      ? "Đăng nhập để đặt chỗ nhanh chóng với thông tin tự động điền"
                      : "Đăng nhập để đặt vé 1-click và không bỏ lỡ sự kiện yêu thích"}
                  </p>
                  {!user ? (
                    <button
                      onClick={() => setShowModernAuthModal(true)}
                      className="px-8 py-3 bg-[#4A90E2] text-white rounded-xl font-medium hover:bg-[#3A80D2] transition-all shadow-md hover:shadow-lg"
                    >
                      Đăng nhập
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-green-600 font-medium mb-2">✅ Đã đăng nhập</p>
                      <p className="text-sm text-gray-600">Bạn có thể đặt chỗ và đăng ký sự kiện</p>
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">
                        {activeTab === "spaces" ? "Thông tin tự động điền" : "Đặt vé 1-click"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">
                        {activeTab === "spaces" ? "Theo dõi lịch sử đặt chỗ" : "Nhắc nhở tự động"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">
                        {activeTab === "spaces" ? "Lưu không gian yêu thích" : "Lịch cá nhân"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-slate-700">Nhận thông báo sự kiện</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA to You */}
      <section className="px-4 md:px-6 py-16 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-purple-100"
          >
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-3xl md:text-4xl font-handwriting text-gray-800 mb-4">
              You - Hành trình cá nhân
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Đã khám phá không gian và sự kiện? Giờ là lúc tạo hành trình âm nhạc của riêng bạn với AI recommendations!
            </p>
            <button
              onClick={() => {
                navigate(createPageUrl("You"));
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
              }}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold text-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              Bắt đầu hành trình
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Space Map Modal */}
      <AnimatePresence>
        {showMapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMapModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-white to-blue-50 rounded-3xl max-w-6xl w-full overflow-hidden shadow-2xl border-2 border-blue-100"
            >
              <div className="p-4 md:p-6 border-b border-blue-100 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      <MapIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                        Space Map
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        {mapFilteredSpaces.length} không gian trên toàn quốc
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-white rounded-full p-2 flex items-center gap-3 shadow-sm border border-gray-200">
                  <Search className="w-5 h-5 text-gray-400 ml-2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, địa chỉ, thành phố..."
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent py-2 outline-none text-sm"
                  />
                  {mapSearchQuery && (
                    <button
                      onClick={() => setMapSearchQuery("")}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center mr-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="relative h-[65vh] md:h-[75vh]">
                <div className="absolute inset-0" style={{ 
                  filter: 'saturate(1.2) contrast(1.1)',
                  transform: 'perspective(1000px) rotateX(0deg)'
                }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={6}
                    style={{ height: "100%", width: "100%" }}
                    className="rounded-b-3xl"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    
                    {createMarkerClusters(mapFilteredSpaces).map((cluster, idx) => {
                      const isCluster = cluster.count > 1;
                      const [lat, lng] = cluster.position;
                      const clusterIcon = isCluster ? new L.DivIcon({
                        html: `
                          <div style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            font-size: 14px;
                            border: 3px solid white;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                          ">
                            ${cluster.count}
                          </div>
                        `,
                        className: 'custom-cluster-icon',
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                      }) : undefined;
                      return (
                        <Marker 
                          key={`cluster-${idx}`} 
                          position={[lat, lng]}
                          icon={clusterIcon}
                        >
                          <Popup maxWidth={300}>
                            <div className="p-3">
                              {isCluster ? (
                                <>
                                  <h3 className="font-bold text-gray-800 mb-3 text-base">
                                    {cluster.count} không gian tại đây
                                  </h3>
                                  <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hide">
                                    {cluster.spaces.map((space) => (
                                      <div 
                                        key={space.id}
                                        className="border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                                      >
                                        <div className="font-semibold text-gray-800 text-sm">
                                          {space.name}
                                        </div>
                                        <div className="text-xs text-gray-600 mb-1">
                                          {space.address}
                                        </div>
                                        <button
                                          onClick={() => {
                                            setShowMapModal(false);
                                            handleSpaceClick(space);
                                          }}
                                          className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                                        >
                                          Xem chi tiết
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <>
                                  {cluster.spaces[0].images && cluster.spaces[0].images[0] && (
                                    <img 
                                      src={cluster.spaces[0].images[0]} 
                                      alt={cluster.spaces[0].name}
                                      className="w-full h-32 object-cover rounded-xl mb-3"
                                    />
                                  )}
                                  <h3 className="font-bold text-gray-800 mb-2 text-base">
                                    {cluster.spaces[0].name}
                                  </h3>
                                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-blue-600" />
                                      <span className="line-clamp-2">{cluster.spaces[0].address}</span>
                                    </div>
                                    {cluster.spaces[0].city && (
                                      <div className="text-xs text-gray-500">
                                        📍 {cluster.spaces[0].city}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setShowMapModal(false);
                                      handleSpaceClick(cluster.spaces[0]);
                                    }}
                                    className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:shadow-lg transition-all">
                                    Xem chi tiết
                                  </button>
                                </>
                              )}
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-500/10 to-transparent"></div>
                </div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-blue-600">
                      {mapFilteredSpaces.length}
                    </div>
                    <div className="text-xs text-gray-600">
                      <div className="font-semibold">Không gian</div>
                      <div>trên bản đồ</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {showEventModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
            >
              {selectedEvent.image_url && (
                <div className="relative h-64 md:h-96 overflow-hidden">
                  <img
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setShowEventModal(false)}
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
                  onClick={() => handleRegisterEvent(selectedEvent)}
                  disabled={registerEventMutation.isPending}
                  className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-[#4A90E2] to-[#7BB3E8] text-white font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50"
                >
                  {registerEventMutation.isPending ? "Đang đặt vé..." : "Đặt vé ngay"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showDetailModal && (
        <SpaceDetailModal
          space={selectedSpace}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSpace(null);
          }}
          onBook={handleBook}
          user={user}
        />
      )}

      {showBookingModal && user && (
        <BookingModal
          space={selectedSpace}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSpace(null);
          }}
        />
      )}


      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          padding: 0;
        }
        
        .leaflet-popup-content {
          margin: 0;
        }

        .leaflet-popup-tip {
          display: none;
        }
      `}</style>
      

      {/* Modern Auth Modal */}
      <ModernAuthModal
        isOpen={showModernAuthModal}
        onClose={() => setShowModernAuthModal(false)}
        onSuccess={(user) => {
          setUser(user);
          handleAuthSuccess();
          // Redirect to homepage after login
          navigate('/');
        }}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setFeedbackTarget(null);
        }}
        onSubmit={handleFeedbackSubmit}
        type={feedbackTarget?.type}
        targetName={feedbackTarget?.target?.name || feedbackTarget?.target?.title}
        user={user}
      />

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        notifications={notifications}
        onMarkAsRead={handleNotificationMarkAsRead}
        onMarkAllAsRead={handleNotificationMarkAllAsRead}
        user={user}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportTarget(null);
        }}
        onSubmit={handleReportSubmit}
        targetType={reportTarget?.type}
        targetId={reportTarget?.target?.id}
        targetName={reportTarget?.target?.name || reportTarget?.target?.title}
        user={user}
      />
    </div>
  );
}
