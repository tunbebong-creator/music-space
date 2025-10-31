import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Smile,
  MapPin,
  Users,
  XCircle,
  Upload,
  Loader2
} from "lucide-react";
import { customAPI } from "@/api/customClient";
import { API_BASE_URL, getUploadUrl } from "@/config/api.js";

export default function ShareStory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'cảm nhận',
    image_url: '',
    mediaFiles: [] // Array of uploaded files
  });

  React.useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if not authenticated
      navigate('/We');
    }
  }, [navigate]);

  // Compress image for mobile to reduce upload time
  const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
    return new Promise((resolve) => {
      // If not an image or already small, return as-is
      if (!file.type.startsWith('image/') || file.size < 500 * 1024) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                console.log(`📸 Compressed: ${(file.size / 1024).toFixed(0)}KB -> ${(blob.size / 1024).toFixed(0)}KB`);
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploadingMedia(true);
    const uploadedUrls = [];
    
    try {
      for (const file of Array.from(files)) {
        // Check file size (100MB limit for videos, 10MB for images)
        const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          alert(`File ${file.name} quá lớn (tối đa ${maxSize / 1024 / 1024}MB)`);
          continue;
        }

        // Compress images on mobile before upload
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
          console.log(`📸 Compressing image: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`);
          fileToUpload = await compressImage(file);
        }

        const formData = new FormData();
        formData.append('image', fileToUpload);
        formData.append('type', 'general');
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          alert('Vui lòng đăng nhập để upload ảnh');
          setUploadingMedia(false);
          return;
        }
        
        const uploadBaseUrl = API_BASE_URL.replace('/api', '');
        console.log('🔍 Uploading file:', { fileName: file.name, fileSize: file.size, uploadBaseUrl });
        
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
          
          // Store relative URL, not full URL - frontend will convert when displaying
          // This ensures URLs work across all devices
          const relativeUrl = result.url; // Should be like "/uploads/general/filename.jpg"
          console.log('📸 Storing URL:', relativeUrl);
          
          uploadedUrls.push({
            url: relativeUrl, // Store relative URL
            fullUrl: getUploadUrl(relativeUrl), // Full URL for preview
            type: file.type.startsWith('video/') ? 'video' : 'image',
            file: file
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Upload timeout. Vui lòng thử lại với file nhỏ hơn.');
          }
          throw fetchError;
        }
      }
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          mediaFiles: [...prev.mediaFiles, ...uploadedUrls]
        }));
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Lỗi upload: ' + error.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }

    setLoading(true);
    
    try {
      // Get first image URL if available (use relative URL for storage)
      const firstImage = formData.mediaFiles.find(m => m.type === 'image');
      const imageUrl = firstImage?.url || formData.image_url || '';
      
      // Store relative URLs in database (not full URLs) - frontend will convert when displaying
      const postData = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        image_url: imageUrl, // Relative URL like "/uploads/general/filename.jpg"
        media_urls: formData.mediaFiles.map(m => m.url), // Array of relative URLs
        user_id: user.id
      };
      
      console.log('📝 Creating post with data:', {
        ...postData,
        media_urls_count: postData.media_urls.length
      });

      await customAPI.entities.BlogPost.create(postData);
      
      alert('Đã chia sẻ câu chuyện thành công!');
      navigate('/We');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/We')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Chia sẻ câu chuyện</h1>
            <div className="w-10"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {/* User Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                {user.full_name?.charAt(0) || user.email.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{user.full_name || 'Người dùng'}</div>
                <div className="text-sm text-gray-500">Đang nghĩ gì?</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 text-xl font-semibold border-none outline-none focus:ring-0 placeholder-gray-400"
                placeholder="Tiêu đề bài viết..."
                required
              />
            </div>

            {/* Content */}
            <div>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full px-4 py-3 text-gray-700 border-none outline-none focus:ring-0 resize-none min-h-[200px] placeholder-gray-400"
                placeholder="Viết nội dung bài viết của bạn..."
                required
              />
            </div>

            {/* Media Preview */}
            {formData.mediaFiles.length > 0 && (
              <div className="space-y-4">
                {formData.mediaFiles.map((media, index) => {
                  // Use fullUrl for preview, url (relative) for saving
                  const previewUrl = media.fullUrl || getUploadUrl(media.url);
                  return (
                    <div key={index} className="relative group border border-gray-200 rounded-xl overflow-hidden">
                      {media.type === 'video' ? (
                        <div className="relative">
                          <video
                            src={previewUrl}
                            controls
                            className="w-full max-h-96 object-contain bg-black"
                          />
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={previewUrl}
                            alt={`Upload ${index + 1}`}
                            className="w-full max-h-96 object-contain bg-gray-50"
                            onError={(e) => {
                              console.error('Preview image error:', previewUrl);
                              e.target.style.opacity = '0.5';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Media Upload Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files);
                      // Reset input after handling
                      e.target.value = '';
                    }
                  }}
                  disabled={uploadingMedia}
                  className="hidden"
                />
                {uploadingMedia ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-gray-700">Đang upload...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Ảnh/Video</span>
                  </>
                )}
              </label>

              <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Gắn thẻ bạn bè</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <Smile className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-700">Cảm xúc</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <MapPin className="w-5 h-5 text-red-600" />
                <span className="text-gray-700">Địa điểm</span>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700">Danh mục:</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="cảm nhận">Cảm nhận</option>
                <option value="câu chuyện">Câu chuyện</option>
                <option value="nhân văn">Nhân văn</option>
                <option value="sự kiện">Sự kiện</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/We')}
                className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || uploadingMedia}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang đăng...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Chia sẻ
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

