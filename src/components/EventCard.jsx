import React from "react";
import { Calendar, Clock, Users, MapPin, Heart, Star, Ticket, Flag } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function EventCard({ 
  event, 
  onRegister, 
  onViewDetails, 
  onFollow,
  onReport,
  user, 
  isRegistered = false,
  isFollowing = false,
  distance = null,
  showSpaceInfo = true
}) {
  const handleRegister = (e) => {
    e.stopPropagation();
    if (onRegister) onRegister(event);
  };

  const handleFollow = (e) => {
    e.stopPropagation();
    if (onFollow) onFollow(event);
  };

  const handleViewDetails = () => {
    if (onViewDetails) onViewDetails(event);
  };

  const handleReport = (e) => {
    e.stopPropagation();
    if (onReport) onReport(event, "event");
  };

  const getEventCategoryLabel = (category) => {
    const categories = {
      workshop: "Workshop",
      acoustic: "Acoustic",
      talk: "Talkshow", 
      performance: "Biểu diễn",
      concert: "Concert",
      jam: "Jam Session"
    };
    return categories[category] || category;
  };

  const getEventStatus = () => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const timeDiff = eventDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) return { status: 'past', label: 'Đã kết thúc', color: 'gray' };
    if (daysDiff === 0) return { status: 'today', label: 'Hôm nay', color: 'red' };
    if (daysDiff === 1) return { status: 'tomorrow', label: 'Ngày mai', color: 'orange' };
    if (daysDiff <= 7) return { status: 'thisWeek', label: 'Tuần này', color: 'blue' };
    return { status: 'upcoming', label: 'Sắp tới', color: 'green' };
  };

  const eventStatus = getEventStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleViewDetails}
      className="bg-white rounded-3xl overflow-hidden cursor-pointer touch-manipulation shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
    >
      {/* Image Section */}
      <div className="relative h-40 md:h-48 overflow-hidden bg-gray-50">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <Calendar className="w-12 h-12 md:w-16 md:h-16 text-blue-400" />
          </div>
        )}
        
        {/* Distance Badge */}
        {distance && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-xs font-medium text-gray-800 shadow-sm">
            📍 {distance.toFixed(1)} km
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 left-3 flex gap-2">
          {user && (
            <button
              onClick={handleFollow}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                isFollowing 
                  ? 'bg-red-500 text-white shadow-lg' 
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
            </button>
          )}
          
          <button
            onClick={handleReport}
            className="w-10 h-10 rounded-full backdrop-blur-md bg-white/80 text-gray-600 hover:bg-white flex items-center justify-center transition-all"
            title="Báo cáo"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>

        {/* Event Status Badge */}
        <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full backdrop-blur-md text-xs font-medium ${
          eventStatus.color === 'red' ? 'bg-red-500 text-white' :
          eventStatus.color === 'orange' ? 'bg-orange-500 text-white' :
          eventStatus.color === 'blue' ? 'bg-blue-500 text-white' :
          eventStatus.color === 'green' ? 'bg-green-500 text-white' :
          'bg-gray-500 text-white'
        }`}>
          {eventStatus.label}
        </div>

        {/* Category Badge */}
        {event.category && (
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-medium text-gray-700">
            {getEventCategoryLabel(event.category)}
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="p-4 md:p-6 flex flex-col flex-grow">
        {/* Date & Time */}
        <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500 mb-3">
          <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
          <span className="truncate">{format(new Date(event.date), "dd/MM/yyyy", { locale: vi })}</span>
          {event.time && (
            <>
              <span>•</span>
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
              <span className="truncate">{event.time}</span>
            </>
          )}
        </div>
        
        {/* Title */}
        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 md:mb-3 line-clamp-2 leading-snug min-h-[2.5rem] md:min-h-[3rem]">
          {event.title}
        </h3>
        
        {/* Description */}
        <p className="text-xs md:text-sm text-gray-600 line-clamp-3 mb-4 md:mb-5 leading-relaxed flex-grow">
          {event.description}
        </p>

        {/* Space Info */}
        {showSpaceInfo && event.space && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Tại {event.space.name}</span>
            </div>
            <div className="text-xs text-gray-500 line-clamp-1">
              {event.space.address}
            </div>
          </div>
        )}

        {/* Event Details */}
        <div className="space-y-2 text-xs text-gray-500 mb-4">
          {event.capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
              <span>Sức chứa: {event.capacity} người</span>
            </div>
          )}
          {event.price && (
            <div className="flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
              <span>Giá: {event.price === 0 ? 'Miễn phí' : `${event.price.toLocaleString()} VNĐ`}</span>
            </div>
          )}
          {event.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-500 fill-current" />
              <span>Đánh giá: {event.rating}/5</span>
            </div>
          )}
        </div>

        {/* Registration Status */}
        {isRegistered && (
          <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Đã đăng ký tham gia</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleRegister}
          disabled={isRegistered || eventStatus.status === 'past'}
          className={`w-full px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all touch-manipulation ${
            isRegistered 
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : eventStatus.status === 'past'
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-200'
          }`}
        >
          {isRegistered 
            ? 'Đã đăng ký ✓' 
            : eventStatus.status === 'past'
            ? 'Đã kết thúc'
            : 'Đặt vé ngay'
          }
        </button>
      </div>
    </motion.div>
  );
}
