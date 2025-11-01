# Hướng dẫn setup Google OAuth nhanh

## Bước 1: Tạo Google Cloud Project (2 phút)

1. Truy cập: https://console.cloud.google.com/
2. Click "Select a project" > "New Project"
3. Đặt tên: "Music Space App"
4. Click "Create"

## Bước 2: Tạo OAuth Credentials (1 phút)

1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Chọn "Web application"
4. Tên: "Music Space Web Client"
5. **Authorized JavaScript origins**: 
   - `http://localhost:5173`
   - `http://localhost:5174`
6. Click "Create"

## Bước 3: Copy Client ID

1. Copy Client ID (dạng: 123456789-abcdefg.apps.googleusercontent.com)
2. Tạo file `.env` trong thư mục gốc:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here
```

## Bước 4: Restart app

```bash
npm run dev:full
```

## Xong! 

Bây giờ bấm nút Google sẽ mở popup đăng nhập Google thật!






































