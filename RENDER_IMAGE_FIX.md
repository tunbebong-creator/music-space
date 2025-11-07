# Vấn đề ảnh trên Render và Giải pháp

## Vấn đề

Render có **ephemeral filesystem** - nghĩa là mỗi lần deploy lại, tất cả files trong `/uploads` sẽ bị mất. Đây là lý do tại sao ảnh không hiển thị sau khi deploy.

## Giải pháp

### Giải pháp 1: Sử dụng Cloudinary (Khuyến nghị)

1. Đăng ký tài khoản Cloudinary miễn phí tại https://cloudinary.com
2. Lấy API keys từ dashboard
3. Thêm vào Render Environment Variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

Code đã có sẵn hỗ trợ Cloudinary trong `server/routes/upload.js`. Chỉ cần thêm env vars là xong.

### Giải pháp 2: Sử dụng Render Disk (Persistent Storage)

1. Vào Render Dashboard
2. Thêm Disk cho service backend
3. Mount disk vào `/uploads`
4. Ảnh sẽ được lưu trên disk và không bị mất khi deploy

### Giải pháp 3: Lưu ảnh vào Database (Base64)

Không khuyến nghị vì sẽ làm database lớn và chậm.

## Cách chạy SQL để tạo bảng page_views

Chạy file `server/create-page-views-table.sql` trong database để tạo bảng tracking lượt truy cập.

