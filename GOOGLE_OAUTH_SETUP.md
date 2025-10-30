# Google OAuth Setup

## Bước 1: Tạo Google OAuth App

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Thêm **Authorized redirect URIs**:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)

## Bước 2: Cấu hình Environment

Tạo file `.env` trong root project:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

## Bước 3: Test

1. Chạy `npm run dev`
2. Click "Đăng nhập" > "Google"
3. Chọn tài khoản Google thật
4. Thông tin user sẽ được lưu vào localStorage

## Lưu ý

- Cần Google Client ID thật để hoạt động
- User sẽ sử dụng tài khoản Google thật của họ
- Thông tin: email, tên, avatar từ Google