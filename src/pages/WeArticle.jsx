import React, { useMemo, useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { customAPI } from "@/api/customClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, User, ArrowLeft, Clock, Tag, Share2, Heart, ChevronRight, 
  LogOut, MessageCircle, Edit, Trash2, Send, Smile, ThumbsUp, Heart as HeartIcon,
  Laugh, Meh, ThumbsDown, X, Image as ImageIcon, Loader2, ZoomIn
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { API_BASE_URL, getUploadUrl } from "@/config/api.js";

// Reactions component
const ReactionsPanel = ({ postId, userReaction, onReactionChange }) => {
  const [showPanel, setShowPanel] = useState(false);
  const reactions = [
    { type: 'like', icon: '👍', label: 'Thích', color: 'bg-blue-500' },
    { type: 'love', icon: '❤️', label: 'Yêu thích', color: 'bg-red-500' },
    { type: 'haha', icon: '😂', label: 'Haha', color: 'bg-yellow-500' },
    { type: 'wow', icon: '😮', label: 'Wow', color: 'bg-purple-500' },
    { type: 'sad', icon: '😢', label: 'Buồn', color: 'bg-blue-400' },
    { type: 'angry', icon: '😡', label: 'Giận', color: 'bg-red-600' }
  ];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onMouseEnter={() => setShowPanel(true)}
        onMouseLeave={() => setTimeout(() => setShowPanel(false), 300)}
        className={`p-2 rounded-full transition-colors ${
          userReaction ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {userReaction ? (
          <span className="text-xl">{reactions.find(r => r.type === userReaction)?.icon || '👍'}</span>
        ) : (
          <ThumbsUp className="w-5 h-5" />
        )}
      </motion.button>
      
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onMouseEnter={() => setShowPanel(true)}
            onMouseLeave={() => setShowPanel(false)}
            className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-2xl border border-gray-200 p-2 flex items-center gap-1 z-50"
          >
            {reactions.map((reaction) => (
              <motion.button
                key={reaction.type}
                whileHover={{ scale: 1.3, y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onReactionChange(reaction.type);
                  setShowPanel(false);
                }}
                className="text-2xl hover:scale-125 transition-transform"
                title={reaction.label}
              >
                {reaction.icon}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Comments component
const CommentsSection = ({ postId, comments, onAddComment, user }) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleReply = (commentId, replyContent) => {
    if (replyContent.trim()) {
      onAddComment(replyContent, commentId);
      setReplyingTo(null);
      setReplyText('');
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Bình luận ({comments?.length || 0})
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-3 border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                {user.full_name?.[0] || user.email?.[0] || 'U'}
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            Vui lòng <a href="/Login" className="text-blue-600 hover:underline">đăng nhập</a> để bình luận
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {(comments || []).map((comment) => (
          <div key={comment.id} className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {comment.user_name?.[0] || comment.user_email?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {comment.user_name || comment.user_email || 'Người dùng'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-gray-800 mb-2">{comment.content}</p>
                {user && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {replyingTo === comment.id ? 'Hủy' : 'Trả lời'}
                  </button>
                )}
                
                {/* Reply Form */}
                {replyingTo === comment.id && user && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Viết phản hồi..."
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleReply(comment.id, replyText)}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      Gửi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {(!comments || comments.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </div>
        )}
      </div>
    </div>
  );
};

export default function WeArticle() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const postId = urlParams.get('id');
  const queryClient = useQueryClient();
  
  const [user, setUser] = useState(null);
  const [userReaction, setUserReaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
        const currentUser = await customAPI.auth.me();
        setUser(currentUser);
        }
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', postId],
    queryFn: async () => {
      console.log('🔍 WeArticle - Fetching post with ID:', postId);
      const posts = await customAPI.entities.BlogPost.find();
      console.log('📋 WeArticle - All posts:', posts);
      const found = posts.find(p => p.id === postId || String(p.id) === String(postId));
      console.log('✅ WeArticle - Found post:', found);
      if (!found) throw new Error("Không tìm thấy bài viết");
      
      // Log post media info
      console.log('📸 WeArticle - Post media info:', {
        id: found.id,
        title: found.title,
        image_url: found.image_url,
        media_urls: found.media_urls,
        media_urls_type: typeof found.media_urls
      });
      
      return found;
    },
    enabled: !!postId,
    onError: (error) => {
      console.error('❌ WeArticle - Error fetching post:', error);
    }
  });

  // Fetch reactions
  const { data: reactionsData } = useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: async () => {
      try {
        const apiBase = API_BASE_URL.replace('/api', '');
        const response = await fetch(`${apiBase}/api/blog-posts/${postId}/reactions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          return await response.json();
        }
        return { reactions: [], userReaction: null };
      } catch {
        return { reactions: [], userReaction: null };
      }
    },
    enabled: !!postId,
    onSuccess: (data) => {
      setUserReaction(data.userReaction);
    }
  });

  // Fetch comments
  const { data: commentsData } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      try {
        const apiBase = API_BASE_URL.replace('/api', '');
        const response = await fetch(`${apiBase}/api/blog-posts/${postId}/comments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          return await response.json();
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: !!postId
  });

  // Reaction mutation
  const reactionMutation = useMutation({
    mutationFn: async (reactionType) => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Vui lòng đăng nhập');
      }
      
      const apiBase = API_BASE_URL.replace('/api', '');
      console.log('🔍 Adding reaction:', { postId, reactionType, apiBase });
      
      const response = await fetch(`${apiBase}/api/blog-posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reaction_type: reactionType })
      });
      
      console.log('🔍 Reaction response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Reaction error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to add reaction' };
        }
        throw new Error(errorData.error || errorData.details || 'Failed to add reaction');
      }
      
      const result = await response.json();
      console.log('✅ Reaction added successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['post-reactions', postId]);
      queryClient.invalidateQueries(['blog-posts']);
    },
    onError: (error) => {
      console.error('❌ Error adding reaction:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ content, parentId }) => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Vui lòng đăng nhập');
      }
      
      if (!content || !content.trim()) {
        throw new Error('Vui lòng nhập nội dung bình luận');
      }
      
      const apiBase = API_BASE_URL.replace('/api', '');
      console.log('🔍 Adding comment:', { postId, content, parentId, apiBase });
      
      const response = await fetch(`${apiBase}/api/blog-posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, parent_id: parentId })
      });
      
      console.log('🔍 Comment response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Comment error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to add comment' };
        }
        throw new Error(errorData.error || errorData.details || 'Failed to add comment');
      }
      
      const result = await response.json();
      console.log('✅ Comment added successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['post-comments', postId]);
      queryClient.invalidateQueries(['blog-posts']);
    },
    onError: (error) => {
      console.error('❌ Error adding comment:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async (data) => {
      await customAPI.entities.BlogPost.update(postId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['blog-post', postId]);
      queryClient.invalidateQueries(['blog-posts']);
      setShowEditModal(false);
    }
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ['related-posts', post?.category],
    queryFn: async () => {
      if (!post) return [];
      const allPosts = await customAPI.entities.BlogPost.find({ 
        category: post.category, 
        published: true 
      }, "-created_date");
      return allPosts.filter(p => p.id !== post.id).slice(0, 3);
    },
    enabled: !!post,
    initialData: [],
  });

  // Check ownership - MUST be before early returns (Rules of Hooks)
  const isOwner = useMemo(() => {
    if (!user || !post) return false;
    
    try {
      // Check by user_id
      if (post.user_id && user.id && String(post.user_id) === String(user.id)) {
        return true;
      }
      
      // Check by created_by (name match)
      if (post.created_by && user.full_name) {
        const postAuthor = String(post.created_by).toLowerCase().trim();
        const userName = String(user.full_name).toLowerCase().trim();
        if (postAuthor === userName) {
          return true;
        }
      }
      
      // Check by email
      if (post.user_email && user.email) {
        const postEmail = String(post.user_email).toLowerCase().trim();
        const userEmail = String(user.email).toLowerCase().trim();
        if (postEmail === userEmail) {
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error checking ownership:', err);
      return false;
    }
  }, [user, post]);

  const handleReactionChange = (reactionType) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thả cảm xúc');
      return;
    }
    
    if (userReaction === reactionType) {
      // Remove reaction
      reactionMutation.mutate(null);
      setUserReaction(null);
    } else {
      // Add/change reaction
      reactionMutation.mutate(reactionType);
      setUserReaction(reactionType);
    }
  };

  const handleAddComment = (content, parentId = null) => {
    if (!user) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }
    
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bình luận');
      return;
    }
    
    commentMutation.mutate({ content, parentId }, {
      onError: (error) => {
        console.error('Error adding comment:', error);
        alert('Có lỗi xảy ra khi thêm bình luận: ' + error.message);
      }
    });
  };

  const handleEdit = () => {
    if (!post) return;
    // Parse media_urls if it's a string
    let mediaUrls = [];
    if (post.media_urls) {
      if (typeof post.media_urls === 'string') {
        try {
          mediaUrls = JSON.parse(post.media_urls);
        } catch {
          mediaUrls = [];
        }
      } else if (Array.isArray(post.media_urls)) {
        mediaUrls = post.media_urls;
      }
    }
    
    // Add image_url to mediaUrls if exists
    if (post.image_url && !mediaUrls.includes(post.image_url)) {
      mediaUrls = [post.image_url, ...mediaUrls];
    }
    
    setEditData({
      title: post.title,
      content: post.content,
      category: post.category,
      image_url: post.image_url,
      media_urls: mediaUrls
    });
    setShowEditModal(true);
  };

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'general');
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Vui lòng đăng nhập để upload ảnh');
        setUploadingImage(false);
        return;
      }
      
      const uploadBaseUrl = API_BASE_URL.replace('/api', '');
      console.log('🔍 Uploading image in edit modal:', { fileName: file.name, fileSize: file.size, uploadBaseUrl });
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        const response = await fetch(`${uploadBaseUrl}/api/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('🔍 Upload response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔍 Upload error response:', errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || 'Upload failed' };
          }
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        const fullUrl = getUploadUrl(result.url);
        
        const currentMediaUrls = editData.media_urls || [];
        setEditData({
          ...editData,
          media_urls: [...currentMediaUrls, fullUrl],
          image_url: editData.image_url || fullUrl
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Upload timeout. Vui lòng thử lại với file nhỏ hơn.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Lỗi upload: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    const newMediaUrls = [...editData.media_urls];
    newMediaUrls.splice(index, 1);
    setEditData({
      ...editData,
      media_urls: newMediaUrls,
      image_url: newMediaUrls[0] || ''
    });
  };

  const handleDelete = async () => {
    if (!post) return;
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      try {
        await customAPI.entities.BlogPost.delete(postId);
        navigate('/We');
      } catch (error) {
        alert('Lỗi khi xóa bài viết');
      }
    }
  };

  // Early return checks - MUST be after all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bài viết</h2>
          <p className="text-gray-600 mb-6">Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
          <Link to={createPageUrl("We")}>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
              ← Quay về trang We
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Safe to use post now - all hooks are above
  const categoryColors = {
    "nhân văn": "bg-blue-500 text-white",
    "sự kiện": "bg-orange-500 text-white",
    "câu chuyện": "bg-purple-500 text-white",
    "cảm nhận": "bg-green-500 text-white"
  };

  const readingTime = Math.ceil((post.content?.length || 0) / 1000) || 5;
  const contentParagraphs = post.content?.split('\n').filter(p => p.trim()) || [];
  
  const reactions = reactionsData?.reactions || [];
  const totalReactions = reactions.reduce((sum, r) => sum + (r.count || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-24 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl("We")}>
            <motion.button
              whileHover={{ x: -4 }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Quay lại</span>
            </motion.button>
          </Link>

          <div className="flex items-center gap-3">
            {isOwner && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEdit}
                  className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit className="w-5 h-5" />
                </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-5 h-5" />
            </motion.button>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: post.title,
                    text: post.excerpt,
                    url: window.location.href
                  });
                }
              }}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Category Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${categoryColors[post.category] || 'bg-gray-500 text-white'}`}>
            {post.category}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight"
        >
          {post.title}
        </motion.h1>

        {/* Meta Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8 pb-8 border-b border-gray-200"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{post.created_by || post.user_email || 'Music Space'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(post.created_at || post.created_date), "dd MMMM, yyyy", { locale: vi })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{readingTime} phút đọc</span>
          </div>
        </motion.div>

        {/* Media Gallery */}
        {(post.image_url || post.media_urls?.length > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-12 rounded-2xl overflow-hidden shadow-xl"
          >
            {(() => {
              console.log('📸 WeArticle - Post data:', {
                id: post.id,
                title: post.title,
                image_url: post.image_url,
                media_urls: post.media_urls,
                media_urls_type: typeof post.media_urls
              });
              
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
              
              console.log('📸 WeArticle - Parsed mediaUrls:', mediaUrls);
              
              // Ensure URLs are full URLs using getUploadUrl
              mediaUrls = mediaUrls.map(url => {
                if (!url || !url.trim()) return null;
                const fullUrl = getUploadUrl(url.trim());
                console.log(`🖼️ WeArticle - Processing URL: ${url} -> ${fullUrl}`);
                return fullUrl;
              }).filter(Boolean);
              
              console.log('📸 WeArticle - Final mediaUrls:', mediaUrls);
              
              if (mediaUrls.length === 0) {
                console.warn(`⚠️ WeArticle - No media found for post ${post.id}`);
                return null;
              }
              
              return (
                <div className="space-y-2">
                  {mediaUrls.map((mediaUrl, idx) => {
                    const isVideo = mediaUrl?.includes('/videos/') || mediaUrl?.match(/\.(mp4|webm|ogg)$/i);
                    return (
                      <div key={idx} className="w-full">
                        {isVideo ? (
                          <video
                            src={mediaUrl}
                            controls
                            className="w-full h-auto max-h-[600px] object-contain bg-black rounded-lg"
                            onError={(e) => {
                              console.error('Video load error:', mediaUrl);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="relative group cursor-pointer" onClick={() => {
                            setSelectedImage(mediaUrl);
                            setShowImageModal(true);
                          }}>
                            <img
                              src={mediaUrl}
                              alt={`${post.title} - ${idx + 1}`}
                              className="w-full h-auto object-cover rounded-lg transition-transform group-hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                console.error('❌ WeArticle - Image load error:', mediaUrl);
                                // Don't hide on error, show placeholder instead
                                e.target.style.opacity = '0.5';
                                e.target.onerror = null; // Prevent infinite loop
                              }}
                              onLoad={() => {
                                console.log(`✅ WeArticle - Image loaded successfully: ${mediaUrl}`);
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-700 font-serif leading-relaxed mb-12 p-6 bg-blue-50 rounded-2xl border-l-4 border-blue-500"
          >
            {post.excerpt}
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="prose prose-lg max-w-none mb-12"
        >
          {contentParagraphs.map((paragraph, index) => {
            if (paragraph.startsWith('# ')) {
              return (
                <h2 key={index} className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 mb-6 pb-3 border-b-2 border-blue-500">
                  {paragraph.replace('# ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('## ')) {
              return (
                <h3 key={index} className="text-xl md:text-2xl font-bold text-gray-900 mt-10 mb-4">
                  {paragraph.replace('## ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h4 key={index} className="text-lg md:text-xl font-bold text-gray-800 mt-8 mb-3">
                  {paragraph.replace('### ', '')}
                </h4>
              );
            }
            if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
              return (
                <li key={index} className="text-lg text-gray-800 leading-relaxed mb-3 ml-6">
                  {paragraph.replace(/^[-*] /, '')}
                </li>
              );
            }
            return (
              <p key={index} className="text-lg text-gray-800 leading-relaxed mb-6">
                {paragraph}
              </p>
            );
          })}
        </motion.div>

        {/* Reactions & Comments Actions */}
        <div className="border-t border-gray-200 pt-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            {user && (
              <ReactionsPanel
                postId={postId}
                userReaction={userReaction}
                onReactionChange={handleReactionChange}
              />
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">{commentsData?.length || 0}</span>
            </div>
            {totalReactions > 0 && (
              <div className="flex items-center gap-1 text-gray-600">
                <span className="text-sm">{totalReactions}</span>
                <span className="text-sm">cảm xúc</span>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <CommentsSection
            postId={postId}
            comments={commentsData || []}
            onAddComment={handleAddComment}
            user={user}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-3 mt-12 pt-8 border-t border-gray-200">
          <Tag className="w-5 h-5 text-gray-400" />
          <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
            #{post.category}
          </span>
          <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
            #MusicSpace
          </span>
          <span className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
            #ÂmNhạc
          </span>
        </div>

        {/* Author Info */}
        <div className="mt-12 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {(post.created_by || post.user_email || 'M')[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{post.created_by || post.user_email || 'Music Space'}</h3>
              <p className="text-gray-600">Tác giả</p>
            </div>
          </div>
        </div>
      </article>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editData && (
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
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa bài viết</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                editMutation.mutate(editData);
              }} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                  <textarea
                    value={editData.content}
                    onChange={(e) => setEditData({...editData, content: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                    rows={8}
                    required
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh</label>
                  
                  {/* Display existing images */}
                  {editData.media_urls && editData.media_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {editData.media_urls.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Upload ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer"
                            onClick={() => {
                              setSelectedImage(url);
                              setShowImageModal(true);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(e.target.files[0]);
                          // Reset input after handling
                          e.target.value = '';
                        }
                      }}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-gray-700">Đang upload...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">Thêm ảnh/video</span>
                      </>
                    )}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                  <select
                    value={editData.category}
                    onChange={(e) => setEditData({...editData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="cảm nhận">Cảm nhận</option>
                    <option value="câu chuyện">Câu chuyện</option>
                    <option value="nhân văn">Nhân văn</option>
                    <option value="sự kiện">Sự kiện</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg disabled:opacity-50"
                  >
                    {editMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-16 mt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Bài viết liên quan
              </h2>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} to={createPageUrl(`WeArticle?id=${relatedPost.id}`)}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100"
                  >
                    {relatedPost.image_url && (
                      <img
                        src={relatedPost.image_url}
                        alt={relatedPost.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${categoryColors[relatedPost.category] || 'bg-gray-500 text-white'}`}>
                        {relatedPost.category}
                      </span>
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {relatedPost.title}
                      </h3>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {showImageModal && selectedImage && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
            onClick={() => {
              setShowImageModal(false);
              setSelectedImage(null);
            }}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-6 h-6" />
              </button>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}