import React from "react";
import { customAPI } from "@/api/customClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Plus, Heart, MessageCircle, ArrowRight, X, Search, Filter, Users, BookOpen, Sparkles, Star, PenTool, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Pagination from "../components/Pagination";
import ModernAuthModal from "../components/ModernAuthModal";
import { getUploadUrl } from "@/config/api.js";

// Component để hiển thị ảnh với placeholder khi lỗi
function PostMediaImage({ src, alt, isVideo, className }) {
  const [imageError, setImageError] = React.useState(false);
  
  if (imageError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-sky-100 to-blue-100 ${className}`}>
        <BookOpen className="w-16 h-16 text-sky-300 mb-3" />
        <p className="text-sky-500 text-sm font-medium text-center">Không thể tải hình ảnh</p>
      </div>
    );
  }
  
  if (isVideo) {
    return (
      <video
        src={src}
        className={className}
        muted
        playsInline
        onError={() => setImageError(true)}
      />
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        setImageError(true);
      }}
      onLoad={() => setImageError(false)}
    />
  );
}

export default function We() {
  const [user, setUser] = React.useState(null);
  const [showWriteModal, setShowWriteModal] = React.useState(false);
  const [showModernAuthModal, setShowModernAuthModal] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [category, setCategory] = React.useState("all");
  const queryClient = useQueryClient();
  const { scrollYProgress } = useScroll();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Parallax effects
  const cloudY1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const cloudY2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const waveY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  // Mobile optimization for blog post grid
  const getItemsPerPage = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 4; // Mobile: 2x2 grid
      return 6; // Desktop: 3x2 grid
    }
    return 6;
  }, []);

  const [itemsPerPage, setItemsPerPage] = React.useState(getItemsPerPage());

  React.useEffect(() => {
    const handleResize = () => setItemsPerPage(getItemsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getItemsPerPage]);

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

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts', category],
    queryFn: async () => {
      const result = await (category === "all" 
        ? customAPI.entities.BlogPost.find()
        : customAPI.entities.BlogPost.find({ category }));
      
      // Debug logging
      console.log('📸 Posts data:', result);
      result?.forEach((post, idx) => {
        if (post.image_url || post.media_urls) {
          console.log(`Post ${idx + 1}:`, {
            id: post.id,
            title: post.title,
            image_url: post.image_url,
            media_urls: post.media_urls,
            media_urls_type: typeof post.media_urls
          });
        }
      });
      
      return result;
    },
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (postData) => customAPI.entities.BlogPost.create(postData),
    onSuccess: () => {
      queryClient.invalidateQueries(['blog-posts']);
      setShowWriteModal(false);
    },
  });

  const likePostMutation = useMutation({
    mutationFn: (postId) => customAPI.entities.BlogPost.update(postId, { 
      likes: (posts?.find(p => p.id === postId)?.likes || 0) + 1 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['blog-posts']);
    },
  });

  const filteredPosts = posts?.filter(post => {
    const safeTitle = post.title || '';
    const safeExcerpt = post.excerpt || '';
    const safeContent = post.content || '';
    const matchesSearch = 
      safeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeExcerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeContent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === "all" || post.category === category;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + itemsPerPage);

  const categories = [
    { value: "all", label: "Tất cả", emoji: "✨" },
    { value: "nhân văn", label: "Nhân văn", emoji: "📖" },
    { value: "sự kiện", label: "Sự kiện", emoji: "🎉" },
    { value: "câu chuyện", label: "Câu chuyện", emoji: "💭" },
    { value: "cảm nhận", label: "Cảm nhận", emoji: "💙" }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ultra Modern Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50"></div>
        
        {/* Floating Elements */}
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[10%] text-sky-200/60">
          <BookOpen className="w-24 h-24" />
        </motion.div>

        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, -5, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[60%] right-[15%] text-blue-200/40">
          <PenTool className="w-32 h-32" />
        </motion.div>

      <motion.div 
            animate={{
            y: [0, -25, 0],
            rotate: [0, 8, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-[40%] left-[80%] text-indigo-200/30">
          <Users className="w-28 h-28" />
      </motion.div>

        {/* Ambient particles */}
        <div className="absolute inset-0">
          <div className="absolute top-[30%] left-[20%] w-40 h-40 rounded-full bg-sky-300/20 blur-3xl animate-pulse"></div>
          <div className="absolute top-[70%] right-[25%] w-48 h-48 rounded-full bg-blue-300/20 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-[50%] left-[60%] w-32 h-32 rounded-full bg-indigo-300/20 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
      </div>

      {/* Hero Section - Ultra Modern */}
      <section className="relative py-20 md:py-32 px-4 md:px-6 overflow-hidden">
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
                <Sparkles className="w-5 h-5 text-sky-500" />
                <span className="text-gray-700 font-medium">Cộng đồng chia sẻ</span>
              </div>
            </motion.div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-gray-800 mb-8 leading-tight">
              <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                We
              </span>
            </h1>
            
            {user ? (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl md:text-4xl text-gray-700 mb-6 font-light leading-relaxed max-w-4xl mx-auto">
                Chào mừng <span className="font-semibold text-sky-600">{user.full_name || user.email.split('@')[0]}</span>! 
                <br />Hãy chia sẻ câu chuyện âm nhạc của bạn
              </motion.p>
            ) : (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl md:text-4xl text-gray-700 mb-6 font-light leading-relaxed max-w-4xl mx-auto">
                Chia sẻ câu chuyện, cảm nhận và trải nghiệm về âm nhạc của chúng ta
              </motion.p>
            )}

            {/* Action Buttons - Ultra Modern */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {user ? (
            <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/ShareStory')}
                  className="px-8 md:px-10 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 text-lg"
            >
                  <PenTool className="w-6 h-6" />
              Chia sẻ câu chuyện của bạn
            </motion.button>
          ) : (
            <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModernAuthModal(true)}
                  className="px-8 md:px-10 py-4 md:py-5 rounded-2xl bg-white/80 text-gray-700 font-semibold hover:bg-sky-50 transition-all flex items-center gap-3 text-lg border border-sky-200/50 backdrop-blur-md"
            >
                  <Users className="w-6 h-6" />
              Đăng nhập để chia sẻ
            </motion.button>
          )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter & Search - Ultra Modern */}
      <section className="px-4 md:px-6 py-8 -mt-8 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/20">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết, câu chuyện, cảm nhận..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-12 py-4 text-lg border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-white/80 backdrop-blur-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => (
                <motion.button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
                  category === cat.value
                    ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-xl shadow-sky-200/50'
                    : 'bg-white/60 text-gray-700 hover:bg-sky-50 border border-gray-200/50 backdrop-blur-sm'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid - Ultra Modern */}
      <section className="px-4 md:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-sky-200 border-t-sky-500 rounded-full mx-auto mb-4"
              ></motion.div>
              <p className="text-gray-600 text-lg">Đang tải câu chuyện...</p>
            </div>
          ) : currentPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-sky-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Chưa có câu chuyện nào</h3>
              <p className="text-gray-600 mb-6">Hãy là người đầu tiên chia sẻ câu chuyện âm nhạc của bạn!</p>
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowWriteModal(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Viết câu chuyện đầu tiên
                </motion.button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group border border-white/20 cursor-pointer"
                  onClick={() => navigate(`/WeArticle?id=${post.id}`)}
                >
                  {/* Media Gallery - Hiển thị ảnh/video */}
                  {(() => {
                    // Parse media_urls if it's a string
                    let mediaUrls = [];
                    if (post.media_urls) {
                      if (typeof post.media_urls === 'string') {
                        try {
                          mediaUrls = JSON.parse(post.media_urls);
                        } catch {
                          // If parsing fails, try treating as single URL
                          if (post.media_urls.trim()) {
                            mediaUrls = [post.media_urls];
                          }
                        }
                      } else if (Array.isArray(post.media_urls)) {
                        mediaUrls = post.media_urls;
                      }
                    }
                    
                    // Add image_url to mediaUrls if exists and not already included
                    if (post.image_url && !mediaUrls.includes(post.image_url)) {
                      mediaUrls = [post.image_url, ...mediaUrls];
                    }
                    
                    // Ensure URLs are full URLs using getUploadUrl
                    mediaUrls = mediaUrls.map(url => {
                      if (!url || !url.trim()) return null;
                      const fullUrl = getUploadUrl(url.trim());
                      console.log(`🖼️ Processing image URL: ${url} -> ${fullUrl}`);
                      return fullUrl;
                    }).filter(Boolean);
                    
                    const firstMedia = mediaUrls[0];
                    
                    if (!firstMedia) {
                      console.warn(`⚠️ No media found for post ${post.id}:`, {
                        image_url: post.image_url,
                        media_urls: post.media_urls,
                        post_title: post.title
                      });
                      return null;
                    }
                    
                    console.log(`✅ Displaying image for post ${post.id}:`, firstMedia);
                    
                    const isVideo = firstMedia?.includes('/videos/') || firstMedia?.match(/\.(mp4|webm|ogg)$/i);
                    
                    return (
                      <div className="w-full overflow-hidden relative bg-gradient-to-br from-sky-100 to-blue-100 min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
                        <PostMediaImage
                          src={firstMedia}
                          alt={post.title}
                          isVideo={isVideo}
                          className="w-full h-full min-h-[200px] sm:min-h-[250px] md:min-h-[300px] object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 pointer-events-auto">
                          <span className="px-2 py-1 sm:px-3 sm:py-1 bg-white/90 backdrop-blur-sm text-sky-600 text-xs sm:text-sm font-semibold rounded-full">
                            {post.category}
                          </span>
                        </div>
                        {mediaUrls.length > 1 && (
                          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 pointer-events-auto">
                            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-black/50 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold rounded-full">
                              +{mediaUrls.length - 1}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  <div className="p-5">
                    {/* Meta info - compact */}
                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(post.created_at || post.created_date), 'dd/MM/yyyy', { locale: vi })}</span>
                      </div>
                      {post.created_by && (
                        <span className="text-gray-400">•</span>
                      )}
                      {post.created_by && (
                        <span className="font-medium text-gray-600">{post.created_by}</span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-sky-600 transition-colors">
                      {post.title}
                    </h3>
                    
                    {/* Excerpt - ngắn gọn như Facebook */}
                    {(post.excerpt || post.content) && (
                      <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed text-sm">
                        {post.excerpt || (post.content ? post.content.substring(0, 100) + '...' : '')}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            likePostMutation.mutate(post.id);
                          }}
                          className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-xl"
                        >
                          <Heart className="w-4 h-4" />
                          <span className="text-sm font-medium">{post.likes || 0}</span>
                        </motion.button>
                        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-2 rounded-xl">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">{post.comment_count || 0}</span>
                        </div>
                      </div>
                      
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-2 text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/WeArticle?id=${post.id}`);
                        }}
                      >
                        <span className="font-semibold">Đọc thêm</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
          
          {/* Pagination - Ultra Modern */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-16"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Write Modal - Ultra Modern */}
      <AnimatePresence>
      {showWriteModal && (
        <WriteModal
          isOpen={showWriteModal}
          onClose={() => setShowWriteModal(false)}
          onSubmit={(postData) => createPostMutation.mutate(postData)}
        />
      )}
      </AnimatePresence>

      {/* Modern Auth Modal */}
      <ModernAuthModal
        isOpen={showModernAuthModal}
        onClose={() => setShowModernAuthModal(false)}
        onSuccess={(user) => {
          setUser(user);
          setShowModernAuthModal(false);
          // Don't redirect - stay on current page
        }}
      />
    </div>
  );
}

// Write Modal Component
function WriteModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'cảm nhận',
    image_url: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'cảm nhận',
      image_url: ''
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Chia sẻ câu chuyện</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4A90E2]"
              placeholder="Nhập tiêu đề bài viết..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả ngắn</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4A90E2]"
              placeholder="Mô tả ngắn về bài viết..."
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4A90E2]"
              placeholder="Viết nội dung bài viết..."
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4A90E2]"
              >
                <option value="cảm nhận">Cảm nhận</option>
                <option value="câu chuyện">Câu chuyện</option>
                <option value="nhân văn">Nhân văn</option>
                <option value="sự kiện">Sự kiện</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh (URL)</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#4A90E2]"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4A90E2] to-[#7BB3E8] text-white font-medium hover:shadow-lg"
            >
              Chia sẻ
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}












