
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Users } from "lucide-react";

export default function SpaceDetailModal({ space, isOpen, onClose, onBook, user }) {
  if (!isOpen || !space) return null;

  // Safe access to space properties
  const spaceName = space.name || 'Không gian';
  const spaceDescription = space.description || '';
  const spaceAddress = space.address || '';
  const spaceCity = space.city || '';
  const spaceImages = space.images || [];
  const spaceAmenities = space.amenities || [];
  const spaceCapacity = space.capacity;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-4xl w-full my-8 overflow-hidden shadow-2xl"
        >
          {/* Image Gallery */}
          {spaceImages.length > 0 && (
            <div className="relative h-64 md:h-96 overflow-hidden">
              <img
                src={spaceImages[0]}
                alt={spaceName}
                className="w-full h-full object-cover"
              />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-xl flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}

          <div className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              {spaceName}
            </h2>
            
            {spaceDescription && (
              <p className="text-gray-700 leading-relaxed mb-6">
                {spaceDescription}
              </p>
            )}

            <div className="space-y-3 mb-6">
              {spaceAddress && (
                <div className="flex items-start gap-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-[#1E88E5] flex-shrink-0 mt-0.5" />
                  <span>{spaceAddress}{spaceCity ? `, ${spaceCity}` : ''}</span>
                </div>
              )}
              
              {spaceCapacity && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Users className="w-5 h-5 text-[#1E88E5]" />
                  <span>Sức chứa: {spaceCapacity} người</span>
                </div>
              )}
            </div>

            {spaceAmenities.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Tiện ích:</h3>
                <div className="flex flex-wrap gap-2">
                  {spaceAmenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => onBook(space)}
              className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-[#4A90E2] to-[#7BB3E8] text-white font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all"
            >
              Đặt chỗ ngay
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
