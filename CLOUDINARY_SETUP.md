# Cloudinary Setup Guide

## Vấn đề với Render.com

Render.com sử dụng **ephemeral filesystem** - nghĩa là files trong thư mục `uploads/` sẽ **bị mất** khi:
- Server restart
- Server redeploy
- Server scale down/up

Để giải quyết vấn đề này, chúng ta sử dụng **Cloudinary** để lưu trữ ảnh persistent.

## Bước 1: Tạo tài khoản Cloudinary (FREE)

1. Truy cập: https://cloudinary.com/users/register/free
2. Đăng ký tài khoản miễn phí (không cần credit card)
3. Plan FREE có:
   - **25GB storage**
   - **25GB bandwidth/tháng**
   - **25GB/monthly transformation credits**
   - Đủ cho hầu hết các dự án nhỏ/trung bình

## Bước 2: Lấy Credentials

Sau khi đăng ký, vào **Dashboard**:

1. Copy **Cloud Name** (ví dụ: `dxyz123abc`)
2. Copy **API Key** (ví dụ: `123456789012345`)
3. Copy **API Secret** (ví dụ: `abcdefghijklmnopqrstuvwxyz`)

## Bước 3: Cấu hình trên Render.com

1. Vào Render Dashboard → chọn service `music-space-api`
2. Vào **Environment** tab
3. Thêm 3 environment variables:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

4. Click **Save Changes**
5. Render sẽ tự động redeploy service

## Bước 4: Test

1. Upload một ảnh qua API
2. Kiểm tra response - sẽ có `storage: 'cloudinary'` và URL là Cloudinary URL
3. Ảnh sẽ **không bao giờ bị mất** ngay cả khi server restart

## Cách hoạt động

- **Nếu Cloudinary được config**: Upload lên Cloudinary → trả về Cloudinary URL
- **Nếu Cloudinary KHÔNG được config**: Fallback về local storage (cho development)

## Lợi ích của Cloudinary

✅ **Persistent storage** - Ảnh không bao giờ mất  
✅ **CDN tự động** - Ảnh load nhanh hơn  
✅ **Image optimization** - Tự động optimize kích thước  
✅ **Transformations** - Có thể resize, crop, filter ảnh  
✅ **Video support** - Hỗ trợ video  
✅ **FREE tier rộng rãi** - 25GB storage + bandwidth

## Troubleshooting

### Ảnh vẫn upload lên local?
- Kiểm tra env vars đã được set trên Render chưa
- Kiểm tra logs: `☁️ Uploading to Cloudinary...` hoặc `💾 Using local storage`

### Lỗi upload?
- Kiểm tra Cloudinary credentials đúng chưa
- Kiểm tra internet connection trên server
- Xem logs để biết lỗi cụ thể

### Muốn chuyển ảnh cũ sang Cloudinary?
- Upload lại ảnh qua API
- Hoặc dùng Cloudinary SDK để upload từ local

## Backup Plan

Nếu không muốn dùng Cloudinary, có thể:
1. **Render Disk** (persistent volume) - nhưng tốn tiền
2. **AWS S3** - cần setup phức tạp hơn
3. **Supabase Storage** - miễn phí nhưng cần setup thêm

Cloudinary là option **đơn giản nhất và tốt nhất** cho use case này.

