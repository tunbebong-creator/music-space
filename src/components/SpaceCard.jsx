import React from "react";
import { MapPin, Users, Heart, Star, Calendar, Clock, Flag, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function SpaceCard({ 
  space, 
  onFollow, 
  onBook, 
  onViewDetails, 
  onReport,
  user, 
  isFollowing = false,
  distance = null,
  showUpcomingEvents = true,
  upcomingEvents = []
}) {
  const handleFollow = (e) => {
    e.stopPropagation();
    if (onFollow) onFollow(space);
  };

  const handleBook = (e) => {
    e.stopPropagation();
    if (onBook) onBook(space);
  };

  const handleViewDetails = () => {
    if (onViewDetails) onViewDetails(space);
  };

  const handleReport = (e) => {
    e.stopPropagation();
    if (onReport) onReport(space, "space");
  };

  const getSpaceTypeLabel = (type) => {
    const types = {
      cafe: "Café",
      studio: "Studio", 
      event_hall: "Hội trường",
      outdoor: "Ngoài trời",
      gallery: "Gallery"
    };
    return types[type] || type;
  };

  const getPriceRangeLabel = (range) => {
    const ranges = {
      low: "$",
      medium: "$$", 
      high: "$$$"
    };
    return ranges[range] || range;
  };

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
      <div className="relative h-40 md:h-56 overflow-hidden bg-gray-50">
        {space.images && space.images[0] ? (
          <img
            src={space.images[0]}
            alt={space.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-10 h-10 md:w-20 md:h-20 text-gray-300" />
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

        {/* Space Type Badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-medium text-gray-700">
          {getSpaceTypeLabel(space.space_type)}
        </div>

        {/* Price Range Badge */}
        {space.price_range && (
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-medium text-gray-700">
            {getPriceRangeLabel(space.price_range)}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 md:p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <h3 className="text-sm md:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug flex-1">
            {space.name}
          </h3>
          {space.rating && (
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700">{space.rating}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-5 line-clamp-2 hidden md:block leading-relaxed">
          {space.description}
        </p>

        {/* Location & Capacity */}
        <div className="space-y-2 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
            <span className="line-clamp-1">{space.address}</span>
          </div>
          {space.capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
              <span>{space.capacity} chỗ</span>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        {showUpcomingEvents && upcomingEvents.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-blue-700 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Sự kiện sắp tới</span>
            </div>
            <div className="space-y-1">
              {upcomingEvents.slice(0, 2).map((event) => (
                <div key={event.id} className="text-xs text-blue-600">
                  <div className="font-medium line-clamp-1">{event.title}</div>
                  <div className="flex items-center gap-1 text-blue-500">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(event.date), "dd/MM", { locale: vi })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {space.amenities && space.amenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {space.amenities.slice(0, 3).map((amenity, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {amenity}
                </span>
              ))}
              {space.amenities.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{space.amenities.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleBook}
          className="w-full px-4 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs md:text-sm font-medium hover:shadow-lg hover:shadow-blue-200 transition-all touch-manipulation"
        >
          {user ? 'Đặt chỗ ngay' : 'Xem chi tiết'}
        </button>
      </div>
    </motion.div>
  );
}
