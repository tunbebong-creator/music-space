# Music Space Backend

Backend API cho ứng dụng Music Space với Neon Database.

## Setup

### 1. Cài đặt dependencies
```bash
cd server
npm install
```

### 2. Cấu hình Environment
Tạo file `.env` trong thư mục `server/`:
```env
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-jwt-secret-key
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database
```bash
npm run db:setup
```

### 4. Chạy server
```bash
npm run dev
```

## API Endpoints

### Admin Routes (Cần authentication + admin role)

#### Events Management
- `GET /api/admin/events` - Lấy danh sách events
- `POST /api/admin/events` - Tạo event mới
- `PUT /api/admin/events/:id` - Cập nhật event
- `DELETE /api/admin/events/:id` - Xóa event

#### Spaces Management  
- `GET /api/admin/spaces` - Lấy danh sách spaces
- `POST /api/admin/spaces` - Tạo space mới
- `PUT /api/admin/spaces/:id` - Cập nhật space
- `DELETE /api/admin/spaces/:id` - Xóa space

## Database Schema

### Tables
- `users` - Thông tin người dùng
- `spaces` - Không gian âm nhạc
- `events` - Sự kiện âm nhạc
- `bookings` - Đặt chỗ
- `contact_messages` - Tin nhắn liên hệ
- `newsletter_subscriptions` - Đăng ký newsletter

## Authentication

Tất cả admin routes cần:
1. JWT token trong header: `Authorization: Bearer <token>`
2. User có `role = 'admin'`




















