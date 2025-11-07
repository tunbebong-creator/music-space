# Vấn đề ảnh trên Render và Giải pháp

## Vấn đề

Render có **ephemeral filesystem** - nghĩa là mỗi lần deploy lại, tất cả files trong `/uploads` sẽ bị mất. Đây là lý do tại sao ảnh không hiển thị sau khi deploy.

## Giải pháp

### Giải pháp 1: Sử dụng Cloudinary (Khuyến nghị) ✅

Code đã có sẵn hỗ trợ Cloudinary trong `server/routes/upload.js` và `server/services/cloudinary.js`.

**Bước 1: Lấy API Secret từ Cloudinary Dashboard**
1. Đăng nhập vào https://cloudinary.com/console
2. Vào **Settings** → **Security**
3. Click **"View API Keys"** để xem API Secret
4. Copy API Secret (bạn đã có cloud_name và api_key rồi)

**Bước 2: Thêm vào Render Environment Variables**
1. Vào Render Dashboard → Chọn service backend (`music-space-api`)
2. Vào tab **Environment**
3. Thêm 3 biến môi trường:
   - Key: `CLOUDINARY_CLOUD_NAME` → Value: `dz9wlgu7e`
   - Key: `CLOUDINARY_API_KEY` → Value: `664422284934169`
   - Key: `CLOUDINARY_API_SECRET` → Value: `[API_SECRET của bạn]` (lấy từ bước 1)

**Bước 3: Deploy lại**
- Render sẽ tự động deploy lại khi bạn save environment variables
- Hoặc click **Manual Deploy** → **Deploy latest commit**

**Sau khi deploy:**
- Tất cả ảnh upload mới sẽ được lưu lên Cloudinary
- Ảnh sẽ không bị mất khi deploy lại
- URL ảnh sẽ là: `https://res.cloudinary.com/dz9wlgu7e/image/upload/...`

### Giải pháp 2: Sử dụng Render Disk (Persistent Storage)

1. Vào Render Dashboard
2. Thêm Disk cho service backend
3. Mount disk vào `/uploads`
4. Ảnh sẽ được lưu trên disk và không bị mất khi deploy

### Giải pháp 3: Lưu ảnh vào Database (Base64)

Không khuyến nghị vì sẽ làm database lớn và chậm.

## Cách chạy SQL để tạo bảng page_views

Chạy file `server/create-page-views-table.sql` trong database để tạo bảng tracking lượt truy cập.

