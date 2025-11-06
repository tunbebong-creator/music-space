import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { RefreshCw, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { getUploadUrl, API_BASE_URL } from "@/config/api.js";

// Component để hiển thị ảnh với retry logic khi lỗi
function SpaceImageWithRetry({ src, alt, className, onLoad, onError }) {
  const [imageError, setImageError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const MAX_RETRIES = 1; // Chỉ retry 1 lần với cùng URL (để xử lý lỗi tạm thời)
  
  const handleImageError = (e) => {
    // Nếu chưa retry và có thể retry, thử lại với cùng URL (có thể là lỗi tạm thời)
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      // Force reload bằng cách thay đổi src tạm thời
      e.target.src = '';
      setTimeout(() => {
        e.target.src = src;
      }, 500);
    } else {
      // Đã hết retry, hiển thị placeholder
      setImageError(true);
      if (onError) onError(e);
      // Ngăn infinite loop và ẩn ảnh lỗi
      e.target.onerror = null;
      e.target.style.display = 'none';
    }
  };
  
  const handleImageLoad = (e) => {
    setImageError(false);
    e.target.style.display = '';
    if (onLoad) onLoad(e);
  };
  
  // Reset when src prop changes
  React.useEffect(() => {
    setImageError(false);
    setRetryCount(0);
  }, [src]);
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
}

export default function LoveReal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("events");
  const [eventTimeFilter, setEventTimeFilter] = React.useState("upcoming"); // "upcoming" or "past"
  const [searchQuery, setSearchQuery] = React.useState("");
  const [userLocation, setUserLocation] = React.useState(null);
  const [nearbyResults, setNearbyResults] = React.useState({ spaces: [], events: [] });
  const [isSearchingNearby, setIsSearchingNearby] = React.useState(false);

  const buildImageUrl = (url) => {
    if (!url) return null;
    return getUploadUrl(url);
  };

  // Function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Function to get user's current location using IP fallback
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      console.log('🔍 Requesting location permission...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ GPS Location obtained:', position.coords);
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            source: 'gps'
          };
          resolve(location);
        },
        async (error) => {
          console.error('❌ GPS Location error:', error);
          
          // Try IP-based geolocation as fallback
          console.log('🔄 Trying IP-based geolocation fallback...');
          try {
            const ipLocation = await getLocationByIP();
            console.log('✅ IP Location obtained:', ipLocation);
            resolve(ipLocation);
          } catch (ipError) {
            console.error('❌ IP Location also failed:', ipError);
            
            let errorMessage = 'Không thể lấy vị trí của bạn.';
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Bạn đã từ chối truy cập vị trí. Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Thông tin vị trí không khả dụng. Vui lòng kiểm tra kết nối mạng.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Hết thời gian chờ lấy vị trí. Vui lòng thử lại.';
                break;
              default:
                errorMessage = 'Lỗi không xác định khi lấy vị trí.';
                break;
            }
            
            reject(new Error(errorMessage));
          }
        },
        {
          enableHighAccuracy: false, // Giảm độ chính xác để tăng tốc độ
          timeout: 5000, // Giảm timeout xuống 5 giây để nhanh hơn
          maximumAge: 300000 // 5 minutes - sử dụng vị trí đã lưu nếu có
        }
      );
    });
  };

  // Fallback function to get location by IP
  const getLocationByIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'ip',
          city: data.city,
          country: data.country_name
        };
      } else {
        throw new Error('No location data from IP service');
      }
    } catch (error) {
      console.error('❌ IP geolocation failed:', error);
      throw new Error('Không thể lấy vị trí qua IP. Vui lòng cho phép truy cập GPS.');
    }
  };

  // Fast search using IP geolocation only
  const searchNearbyByIP = async () => {
    try {
      setIsSearchingNearby(true);
      console.log('🚀 Fast search using IP geolocation...');
      
      // Get location by IP directly
      const location = await getLocationByIP();
      setUserLocation(location);
      console.log('📍 IP Location obtained:', location);
      
      // Filter spaces and events by distance (within 50km)
      const maxDistance = 50; // 50 kilometers - tăng bán kính để tìm thấy nhiều kết quả hơn
      
      console.log('🔍 Filtering spaces...', spaces.length, 'total spaces');
      const nearbySpaces = spaces.filter(space => {
        if (!space.latitude || !space.longitude) {
          console.log('⚠️ Space missing coordinates:', space.name);
          return false;
        }
        const distance = calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(space.latitude), 
          parseFloat(space.longitude)
        );
        console.log(`📍 Space "${space.name}" distance: ${distance.toFixed(2)}km`);
        return distance <= maxDistance;
      }).map(space => ({
        ...space,
        distance: calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(space.latitude), 
          parseFloat(space.longitude)
        )
      })).sort((a, b) => a.distance - b.distance);

      console.log('🔍 Filtering events...', events.length, 'total events');
      const nearbyEvents = events.filter(event => {
        if (!event.venue_latitude || !event.venue_longitude) {
          console.log('⚠️ Event missing coordinates:', event.title);
          return false;
        }
        const distance = calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(event.venue_latitude), 
          parseFloat(event.venue_longitude)
        );
        console.log(`📍 Event "${event.title}" distance: ${distance.toFixed(2)}km`);
        return distance <= maxDistance;
      }).map(event => ({
        ...event,
        distance: calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(event.venue_latitude), 
          parseFloat(event.venue_longitude)
        )
      })).sort((a, b) => a.distance - b.distance);

      console.log('✅ Fast search results:', { spaces: nearbySpaces.length, events: nearbyEvents.length });
      setNearbyResults({ spaces: nearbySpaces, events: nearbyEvents });
      
      // Show results
      if (nearbySpaces.length > 0 || nearbyEvents.length > 0) {
        const locationInfo = location.city ? ` (${location.city}, ${location.country})` : '';
        alert(`🚀 Tìm thấy ${nearbySpaces.length} không gian và ${nearbyEvents.length} sự kiện gần bạn trong bán kính ${maxDistance}km!\n\nVị trí: IP${locationInfo}`);
      } else {
        alert('Không tìm thấy không gian hoặc sự kiện nào gần bạn trong bán kính 50km.');
      }
      
    } catch (error) {
      console.error('❌ Error in fast search:', error);
      alert('Lỗi tìm kiếm nhanh: ' + error.message);
    } finally {
      setIsSearchingNearby(false);
    }
  };

  // Function to search for nearby places
  const searchNearby = async () => {
    try {
      setIsSearchingNearby(true);
      console.log('🔍 Starting nearby search...');
      
      // Get user's location
      const location = await getCurrentLocation();
      setUserLocation(location);
      console.log('📍 User location:', location);
      
      // Filter spaces and events by distance (within 50km)
      const maxDistance = 50; // 50 kilometers - tăng bán kính để tìm thấy nhiều kết quả hơn
      
      console.log('🔍 Filtering spaces...', spaces.length, 'total spaces');
      const nearbySpaces = spaces.filter(space => {
        if (!space.latitude || !space.longitude) {
          console.log('⚠️ Space missing coordinates:', space.name);
          return false;
        }
        const distance = calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(space.latitude), 
          parseFloat(space.longitude)
        );
        console.log(`📍 Space "${space.name}" distance: ${distance.toFixed(2)}km`);
        return distance <= maxDistance;
      }).map(space => ({
        ...space,
        distance: calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(space.latitude), 
          parseFloat(space.longitude)
        )
      })).sort((a, b) => a.distance - b.distance);

      console.log('🔍 Filtering events...', events.length, 'total events');
      const nearbyEvents = events.filter(event => {
        if (!event.venue_latitude || !event.venue_longitude) {
          console.log('⚠️ Event missing coordinates:', event.title);
          return false;
        }
        const distance = calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(event.venue_latitude), 
          parseFloat(event.venue_longitude)
        );
        console.log(`📍 Event "${event.title}" distance: ${distance.toFixed(2)}km`);
        return distance <= maxDistance;
      }).map(event => ({
        ...event,
        distance: calculateDistance(
          location.latitude, 
          location.longitude, 
          parseFloat(event.venue_latitude), 
          parseFloat(event.venue_longitude)
        )
      })).sort((a, b) => a.distance - b.distance);

      console.log('✅ Nearby results:', { spaces: nearbySpaces.length, events: nearbyEvents.length });
      setNearbyResults({ spaces: nearbySpaces, events: nearbyEvents });
      
      // Show results
      if (nearbySpaces.length > 0 || nearbyEvents.length > 0) {
        const locationSource = location.source === 'gps' ? 'GPS' : 'IP';
        const locationInfo = location.city ? ` (${location.city}, ${location.country})` : '';
        alert(`Tìm thấy ${nearbySpaces.length} không gian và ${nearbyEvents.length} sự kiện gần bạn trong bán kính ${maxDistance}km!\n\nVị trí: ${locationSource}${locationInfo}`);
      } else {
        alert('Không tìm thấy không gian hoặc sự kiện nào gần bạn trong bán kính 50km. Có thể các địa điểm chưa có tọa độ GPS.');
      }
      
    } catch (error) {
      console.error('❌ Error in searchNearby:', error);
      
      // Show error with options
      const userChoice = confirm(
        `${error.message}\n\nBạn có muốn:\n- OK: Thử lại\n- Cancel: Sử dụng vị trí mặc định (Hà Nội)`
      );
      
      if (userChoice) {
        // Retry after a short delay
        setTimeout(() => {
          searchNearby();
        }, 1000);
      } else {
        // Use default location (Hanoi)
        console.log('🔄 Using default location (Hanoi)');
        const defaultLocation = {
          latitude: 21.0285,
          longitude: 105.8542,
          source: 'default',
          city: 'Hà Nội',
          country: 'Vietnam'
        };
        setUserLocation(defaultLocation);
        
        // Filter with default location
        const maxDistance = 10;
        const nearbySpaces = spaces.filter(space => {
          if (!space.latitude || !space.longitude) return false;
          const distance = calculateDistance(
            defaultLocation.latitude, 
            defaultLocation.longitude, 
            parseFloat(space.latitude), 
            parseFloat(space.longitude)
          );
          return distance <= maxDistance;
        }).map(space => ({
          ...space,
          distance: calculateDistance(
            defaultLocation.latitude, 
            defaultLocation.longitude, 
            parseFloat(space.latitude), 
            parseFloat(space.longitude)
          )
        })).sort((a, b) => a.distance - b.distance);

        const nearbyEvents = events.filter(event => {
          if (!event.venue_latitude || !event.venue_longitude) return false;
          const distance = calculateDistance(
            defaultLocation.latitude, 
            defaultLocation.longitude, 
            parseFloat(event.venue_latitude), 
            parseFloat(event.venue_longitude)
          );
          return distance <= maxDistance;
        }).map(event => ({
          ...event,
          distance: calculateDistance(
            defaultLocation.latitude, 
            defaultLocation.longitude, 
            parseFloat(event.venue_latitude), 
            parseFloat(event.venue_longitude)
          )
        })).sort((a, b) => a.distance - b.distance);

        setNearbyResults({ spaces: nearbySpaces, events: nearbyEvents });
        
        if (nearbySpaces.length > 0 || nearbyEvents.length > 0) {
          alert(`Tìm thấy ${nearbySpaces.length} không gian và ${nearbyEvents.length} sự kiện gần Hà Nội trong bán kính ${maxDistance}km!`);
        } else {
          alert('Không tìm thấy không gian hoặc sự kiện nào gần Hà Nội trong bán kính 50km.');
        }
      }
    } finally {
      setIsSearchingNearby(false);
    }
  };

  // Fetch real data from API
  const { data: spacesData, isLoading: spacesLoading, refetch: refetchSpaces } = useQuery({
    queryKey: ['spaces'],
    queryFn: async () => {
      console.log('🔍 Debug - Fetching spaces for Love page...');
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/spaces?status=approved`);
      if (!response.ok) throw new Error('Failed to fetch spaces');
      const data = await response.json();
      console.log('✅ Debug - Spaces fetched for Love page:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      console.log('🔍 LoveReal - API Response:', data);
      return data.events || []; // Extract events array from response
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });

  // Refetch data when component becomes visible
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Love page visible, refetching data...');
        refetchSpaces();
        refetchEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [refetchSpaces, refetchEvents]);

  // Filter approved events only
  const approvedEvents = React.useMemo(() => {
    if (!Array.isArray(eventsData)) return [];
    return eventsData.filter(event => event.status === 'approved');
  }, [eventsData]);

  // Filter spaces
  const spaces = Array.isArray(spacesData?.spaces) ? spacesData.spaces : [];
  const events = approvedEvents;
  
  // Debug logs
  console.log('🔍 Debug - Love page spaces count:', spaces.length);
  console.log('🔍 Debug - Love page spaces data:', spaces);


  // Filter data based on search query or nearby results
  const filteredSpaces = React.useMemo(() => {
    // If we have nearby results and no search query, show nearby results
    if (nearbyResults.spaces.length > 0 && !searchQuery) {
      return nearbyResults.spaces;
    }
    
    // Otherwise filter by search query
    return spaces.filter(space =>
      space.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [spaces, searchQuery, nearbyResults.spaces]);

  const filteredEvents = React.useMemo(() => {
    let result = events;
    
    // Filter by time (upcoming vs past)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (eventTimeFilter === "upcoming") {
      // Show upcoming events (event_date >= today) or events without date
      result = result.filter(event => {
        if (!event.event_date) return true; // Show events without date
        const eventDate = new Date(event.event_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });
    } else if (eventTimeFilter === "past") {
      // Show past events (event_date < today)
      result = result.filter(event => {
        if (!event.event_date) return false; // Hide events without date in past view
        const eventDate = new Date(event.event_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate < today;
      });
      
      // Sort past events by date (newest first)
      result = result.sort((a, b) => {
        const dateA = new Date(a.event_date);
        const dateB = new Date(b.event_date);
        return dateB - dateA; // Newest first
      });
    }
    
    // If we have nearby results and no search query, show nearby results
    if (nearbyResults.events.length > 0 && !searchQuery) {
      const nearbyFiltered = nearbyResults.events.filter(event => {
        if (eventTimeFilter === "upcoming") {
          if (!event.event_date) return true;
          const eventDate = new Date(event.event_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        } else {
          if (!event.event_date) return false;
          const eventDate = new Date(event.event_date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate < today;
        }
      });
      if (nearbyFiltered.length > 0) {
        return eventTimeFilter === "past" 
          ? nearbyFiltered.sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
          : nearbyFiltered;
      }
    }
    
    // Otherwise filter by search query
    return result.filter(event =>
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery, nearbyResults.events, eventTimeFilter]);

  if (spacesLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50/80 to-indigo-50/60 overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-sky-50/90 via-blue-50/90 to-indigo-50/90 backdrop-blur-md text-gray-800 border-b border-sky-200/50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[10%] text-sky-400/20">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
          </motion.div>
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, -3, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[60%] right-[15%] text-blue-400/15">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </motion.div>
          <div className="absolute top-[30%] left-[20%] w-32 h-32 rounded-full bg-sky-400/10 blur-3xl animate-pulse"></div>
          <div className="absolute top-[70%] right-[25%] w-40 h-40 rounded-full bg-blue-400/10 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-sky-200/50 mb-6">
                <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                <span className="text-gray-700 font-medium">Khám phá không gian âm nhạc</span>
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-4">
              <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Love
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 font-light">
              Khám phá không gian âm nhạc và sự kiện tuyệt vời
            </motion.p>
            
            {/* Search Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex justify-center gap-4 mb-6">
              <motion.button
                onClick={searchNearbyByIP}
                disabled={isSearchingNearby}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md text-sky-600 rounded-full border border-sky-200/50 hover:bg-white/90 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl ${isSearchingNearby ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSearchingNearby ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
                {isSearchingNearby ? 'Đang tìm kiếm...' : 'tìm kiếm gần tôi'}
              </motion.button>
              
              {(nearbyResults.spaces.length > 0 || nearbyResults.events.length > 0) && (
                <motion.button
                  onClick={() => {
                    setNearbyResults({ spaces: [], events: [] });
                    setSearchQuery('');
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md text-gray-600 rounded-full border border-gray-200/50 hover:bg-white/90 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className="w-5 h-5" />
                  Xem tất cả
                </motion.button>
              )}
            </motion.div>
            
            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sự kiện, không gian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-14 rounded-full bg-white/80 backdrop-blur-md border border-sky-200/50 focus:ring-2 focus:ring-sky-500/50 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 placeholder-gray-500"
                />
                <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-full p-2 shadow-lg border border-sky-200/50">
            <motion.button
              onClick={() => setActiveTab("events")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === "events"
                  ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg"
                  : "text-gray-600 hover:text-sky-500 hover:bg-sky-50/50"
              }`}
            >
              Sự Kiện ({filteredEvents.length})
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("spaces")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                activeTab === "spaces"
                  ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg"
                  : "text-gray-600 hover:text-sky-500 hover:bg-sky-50/50"
              }`}
            >
              Không Gian ({filteredSpaces.length})
            </motion.button>
          </div>
        </motion.div>

        {/* Content */}
        {activeTab === "events" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}>
            {/* Event Time Filter Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="flex justify-center mb-6">
              <div className="bg-white/80 backdrop-blur-md rounded-full p-2 shadow-lg border border-sky-200/50 inline-flex">
                <motion.button
                  onClick={() => setEventTimeFilter("upcoming")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                    eventTimeFilter === "upcoming"
                      ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg"
                      : "text-gray-600 hover:text-sky-500 hover:bg-sky-50/50"
                  }`}
                >
                  Sắp tới
                </motion.button>
                <motion.button
                  onClick={() => setEventTimeFilter("past")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                    eventTimeFilter === "past"
                      ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg"
                      : "text-gray-600 hover:text-sky-500 hover:bg-sky-50/50"
                  }`}
                >
                  Đã qua ({(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return events.filter(e => {
                      if (!e.event_date) return false;
                      const eventDate = new Date(e.event_date);
                      eventDate.setHours(0, 0, 0, 0);
                      return eventDate < today;
                    }).length;
                  })()})
                </motion.button>
              </div>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="text-3xl font-bold text-center mb-8 text-gray-800">
              {eventTimeFilter === "upcoming" ? "Sự Kiện Sắp Tới" : "Các Sự Kiện Đã Qua"}
            </motion.h2>
            
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchQuery ? 'Không tìm thấy sự kiện nào' : 'Chưa có sự kiện nào được duyệt'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Các sự kiện sẽ hiển thị sau khi được admin duyệt'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event, index) => (
                  <motion.div 
                    key={event.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-sky-200/50">
                    <div className="h-48 relative overflow-hidden">
                      {(event.image_url || event.cover_image) ? (
                        <img 
                          src={buildImageUrl(event.image_url || event.cover_image)} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${(event.image_url || event.cover_image) ? 'hidden' : 'flex'} bg-gradient-to-br from-blue-400 to-purple-500`}>
                        <div className="text-6xl text-white opacity-80">🎵</div>
                      </div>
                      <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-1 rounded-full">
                        <span className="text-sm font-semibold text-blue-600">
                          {new Date(event.event_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {event.category && (
                        <div className="absolute top-4 left-4 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          {event.category}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {event.description}
                      </p>
                      
                      {/* Event Details */}
                      <div className="space-y-2 mb-4">
                        {event.start_time && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {event.start_time} - {event.end_time || (() => {
                              const parts = String(event.start_time).split(':');
                              const h = parseInt(parts[0] || '0', 10);
                              const m = parts[1] || '00';
                              const hh = (h + (event.duration_hours || 2)) % 24;
                              return `${String(hh).padStart(2,'0')}:${m}`;
                            })()}
                          </div>
                        )}
                        
                        {event.venue_name && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.venue_name}
                          </div>
                        )}
                        
                        {event.venue_address && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="truncate">{event.venue_address}</span>
                            {event.distance && (
                              <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                                {event.distance.toFixed(1)}km
                              </span>
                            )}
                          </div>
                        )}
                        
                        {event.max_participants && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Tối đa {event.max_participants} người
                          </div>
                        )}
                        
                        {event.price && event.price > 0 && (
                          <div className="flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span className="font-semibold text-green-600">
                              {parseFloat(event.price).toLocaleString('vi-VN')} {event.currency || 'VND'}
                            </span>
                            {event.early_bird_price && parseFloat(event.early_bird_price) < parseFloat(event.price) && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Early bird: {parseFloat(event.early_bird_price).toLocaleString('vi-VN')} {event.currency || 'VND'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {event.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                              #{tag}
                            </span>
                          ))}
                          {event.tags.length > 3 && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              +{event.tags.length - 3} khác
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Organizer */}
                      {event.organizer_name && (
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Tổ chức bởi: {event.organizer_name}
                        </div>
                      )}
                      
                      <motion.button 
                        onClick={() => navigate(`/event/${event.id}`)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-sky-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Xem Chi Tiết
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "spaces" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="text-3xl font-bold text-center mb-8 text-gray-800">
              Không Gian Âm Nhạc
            </motion.h2>
            
            {filteredSpaces.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchQuery ? 'Không tìm thấy không gian nào' : 'Chưa có không gian nào'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Các không gian sẽ hiển thị khi có dữ liệu'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSpaces.map((space, index) => (
                  <motion.div 
                    key={space.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-sky-200/50">
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden">
                      {space.images && space.images.length > 0 ? (
                        <>
                          <SpaceImageWithRetry
                            src={getUploadUrl(space.images[0])} 
                            alt={space.name}
                            className="w-full h-full object-cover"
                            onLoad={() => {}}
                            onError={() => {}}
                          />
                          <div className="w-full h-full flex items-center justify-center absolute inset-0 pointer-events-none" style={{ zIndex: -1 }}>
                            <div className="text-6xl text-white opacity-80">🏢</div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-6xl text-white opacity-80">🏢</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {space.name}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {space.description}
                      </p>
                      
                      {space.address && (
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{space.address}</span>
                          {space.distance && (
                            <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                              {space.distance.toFixed(1)}km
                            </span>
                          )}
                        </div>
                      )}
                      
                      <motion.button 
                        onClick={() => navigate(`/space/${space.id}`)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-sky-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Xem Chi Tiết
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2 }}
        className="bg-white/80 backdrop-blur-md border-t border-sky-200/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-sky-50/80 backdrop-blur-md border border-sky-200/50 mb-6">
              <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              <span className="text-gray-700 font-medium">Nhận tin mới từ Love</span>
            </div>
            <p className="text-gray-600 font-light">
              © 2024 Love. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
