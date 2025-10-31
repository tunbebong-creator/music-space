import React from "react";
import { X, Star, Heart, Smile, Frown, Meh, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FeedbackModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  type = "space", // "space" or "event"
  targetName = "",
  user
}) {
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [emotion, setEmotion] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const emotions = [
    { value: "chill", label: "Chill", icon: "😌", color: "bg-blue-100 text-blue-700" },
    { value: "warm", label: "Warm", icon: "🔥", color: "bg-red-100 text-red-700" },
    { value: "healing", label: "Healing", icon: "🌿", color: "bg-green-100 text-green-700" },
    { value: "energetic", label: "Energetic", icon: "⚡", color: "bg-yellow-100 text-yellow-700" },
    { value: "romantic", label: "Romantic", icon: "💕", color: "bg-pink-100 text-pink-700" },
    { value: "nostalgic", label: "Nostalgic", icon: "🌙", color: "bg-purple-100 text-purple-700" },
    { value: "inspiring", label: "Inspiring", icon: "✨", color: "bg-indigo-100 text-indigo-700" },
    { value: "peaceful", label: "Peaceful", icon: "🕊️", color: "bg-cyan-100 text-cyan-700" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Vui lòng chọn đánh giá từ 1-5 sao");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        type,
        rating,
        emotion,
        comment,
        user_id: user?.id,
        target_name: targetName,
        created_at: new Date().toISOString()
      };

      if (onSubmit) {
        await onSubmit(feedbackData);
      }

      // Reset form
      setRating(0);
      setEmotion("");
      setComment("");
      onClose();
    } catch (error) {
      console.error("Feedback submission error:", error);
      alert("Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleStarHover = (value) => {
    setHoverRating(value);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {type === "space" ? "Đánh giá không gian" : "Đánh giá sự kiện"}
                </h2>
                <p className="text-gray-600 mt-1">{targetName}</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Rating Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Đánh giá tổng thể
              </h3>
              
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleStarClick(value)}
                    onMouseEnter={() => handleStarHover(value)}
                    onMouseLeave={handleStarLeave}
                    className="transition-colors"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        value <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {rating > 0 && (
                    <span className="font-medium">
                      {rating === 1 && "Rất tệ"}
                      {rating === 2 && "Tệ"}
                      {rating === 3 && "Bình thường"}
                      {rating === 4 && "Tốt"}
                      {rating === 5 && "Tuyệt vời"}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Emotion Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Cảm xúc của bạn
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {emotions.map((emotionOption) => (
                  <button
                    key={emotionOption.value}
                    type="button"
                    onClick={() => setEmotion(emotionOption.value)}
                    className={`p-4 rounded-2xl border-2 transition-all text-center ${
                      emotion === emotionOption.value
                        ? `${emotionOption.color} border-current`
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-2xl mb-2">{emotionOption.icon}</div>
                    <div className="text-sm font-medium">{emotionOption.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Chia sẻ trải nghiệm của bạn
              </h3>
              
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                placeholder={`Hãy chia sẻ trải nghiệm của bạn về ${type === "space" ? "không gian" : "sự kiện"} này...`}
              />
              
              <p className="text-xs text-gray-500">
                Phản hồi của bạn sẽ giúp cải thiện trải nghiệm cho mọi người
              </p>
            </div>

            {/* Preview */}
            {rating > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Xem trước đánh giá:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Đánh giá:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`w-4 h-4 ${
                            value <= rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {emotion && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Cảm xúc:</span>
                      <span className="flex items-center gap-1">
                        {emotions.find(e => e.value === emotion)?.icon}
                        <span>{emotions.find(e => e.value === emotion)?.label}</span>
                      </span>
                    </div>
                  )}
                  {comment && (
                    <div>
                      <span className="font-medium">Bình luận:</span>
                      <p className="text-gray-600 mt-1">{comment}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang gửi...
                  </>
                ) : (
                  'Gửi đánh giá'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



























