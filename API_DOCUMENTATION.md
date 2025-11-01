# MusicSpace API Documentation

## Tổng quan
API này cung cấp đầy đủ các chức năng CRUD (Create, Read, Update, Delete) cho Events và Spaces, cùng với chức năng upload ảnh.

## Base URL
```
http://localhost:3001/api
```

## Authentication
Hầu hết các endpoints yêu cầu authentication token trong header:
```
Authorization: Bearer <your-jwt-token>
```

## 📍 SPACES API

### 1. Lấy danh sách spaces (có phân trang và filter)
```http
GET /spaces
```

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số items per page (default: 10)
- `search` (optional): Tìm kiếm theo tên, mô tả, địa chỉ
- `status` (optional): Lọc theo trạng thái (pending, approved, rejected)
- `city` (optional): Lọc theo thành phố
- `min_price` (optional): Giá tối thiểu
- `max_price` (optional): Giá tối đa

**Response:**
```json
{
  "spaces": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

### 2. Lấy thông tin chi tiết space
```http
GET /spaces/:id
```

### 3. Tạo space mới (có upload ảnh)
```http
POST /spaces
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form Data:**
- `name`: Tên space
- `description`: Mô tả
- `address`: Địa chỉ
- `city`: Thành phố
- `capacity`: Sức chứa
- `price_per_hour`: Giá/giờ
- `amenities`: Tiện ích (comma-separated)
- `images`: Files ảnh (multiple)

### 4. Cập nhật space
```http
PUT /spaces/:id
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

### 5. Xóa space
```http
DELETE /spaces/:id
Authorization: Bearer <token>
```

### 6. Duyệt/từ chối space (Admin only)
```http
PUT /spaces/:id/status
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "status": "approved" // hoặc "rejected"
}
```

### 7. Lấy spaces theo owner
```http
GET /spaces/owner/:owner_id
```

## 🎉 EVENTS API

### 1. Lấy danh sách events (có phân trang và filter)
```http
GET /events
```

**Query Parameters:**
- `page`, `limit`: Phân trang
- `search`: Tìm kiếm theo title, description
- `status`: Lọc theo trạng thái
- `space_id`: Lọc theo space

### 2. Lấy thông tin chi tiết event
```http
GET /events/:id
```

### 3. Tạo event mới (có upload ảnh)
```http
POST /events
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form Data:**
- `title`: Tiêu đề event
- `description`: Mô tả
- `event_date`: Ngày diễn ra (ISO string)
- `duration_hours`: Thời lượng (giờ)
- `max_participants`: Số người tham gia tối đa
- `price`: Giá vé
- `space_id`: ID của space
- `status`: Trạng thái (optional)
- `images`: Files ảnh (multiple)

### 4. Cập nhật event
```http
PUT /events/:id
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

### 5. Xóa event
```http
DELETE /events/:id
Authorization: Bearer <token>
```

### 6. Duyệt/từ chối event (Admin only)
```http
PUT /events/:id/status
Authorization: Bearer <admin-token>
```

## 📸 IMAGE UPLOAD

### Cấu hình
- **Giới hạn file size**: 5MB per file
- **Số lượng file tối đa**: 10 files
- **Định dạng cho phép**: Chỉ file ảnh (image/*)
- **Thư mục lưu trữ**: `/uploads`

### URL ảnh
Sau khi upload, ảnh sẽ có URL:
```
http://localhost:3001/uploads/filename.jpg
```

## 🔐 AUTHENTICATION

### Đăng ký
```http
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "bio": "Musician"
}
```

### Đăng nhập
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Lấy thông tin user
```http
GET /auth/me
Authorization: Bearer <token>
```

## 📊 ADMIN API

### Thống kê tổng quan
```http
GET /admin/stats
Authorization: Bearer <admin-token>
```

### Quản lý users
```http
GET /admin/users
PUT /admin/users/:id/role
DELETE /admin/users/:id
```

### Quản lý spaces
```http
GET /admin/spaces
```

### Quản lý bookings
```http
GET /admin/bookings
PUT /admin/bookings/:id/status
```

## 🚀 Sử dụng với Frontend

### 1. Upload ảnh với FormData
```javascript
const formData = new FormData();
formData.append('name', 'My Space');
formData.append('description', 'Beautiful space');
formData.append('images', fileInput.files[0]);
formData.append('images', fileInput.files[1]);

fetch('/api/spaces', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 2. Lấy danh sách với filter
```javascript
const params = new URLSearchParams({
  search: 'music',
  status: 'approved',
  city: 'Hanoi',
  page: 1,
  limit: 10
});

fetch(`/api/spaces?${params}`)
  .then(res => res.json())
  .then(data => {
    console.log(data.spaces);
    console.log(data.pagination);
  });
```

### 3. Xử lý lỗi upload
```javascript
try {
  const response = await fetch('/api/spaces', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const result = await response.json();
  console.log('Space created:', result);
} catch (error) {
  console.error('Upload error:', error.message);
}
```

## 📝 Ghi chú

1. **File Upload**: Sử dụng `multipart/form-data` cho các endpoint có upload ảnh
2. **Authentication**: Hầu hết các thao tác tạo/sửa/xóa cần token
3. **Permissions**: Chỉ owner mới có thể sửa/xóa space/event của mình
4. **Admin**: Chỉ admin mới có thể duyệt/từ chối spaces và events
5. **Pagination**: Tất cả danh sách đều có phân trang
6. **Filtering**: Hỗ trợ tìm kiếm và lọc theo nhiều tiêu chí

## 🔧 Database Schema

### Spaces Table
- `id`, `name`, `description`, `address`, `city`
- `capacity`, `price_per_hour`, `amenities` (array)
- `images` (array), `owner_id`, `status`, `verified`
- `created_at`, `updated_at`

### Events Table  
- `id`, `title`, `description`, `event_date`
- `duration_hours`, `max_participants`, `price`
- `space_id`, `organizer_id`, `status`, `images` (array)
- `created_at`, `updated_at`

### Users Table
- `id`, `email`, `password`, `full_name`, `bio`
- `avatar_url`, `role`, `created_at`, `updated_at`


















