# Setup Resend Email trên Render

## Bước 1: Đã có Resend API Key ✅
API Key của bạn: `re_98NBAvj4_6cJBLBq4K1u1Rn3QeiwNbXu9`

## Bước 2: Thêm vào Render Dashboard

1. Vào Render Dashboard: https://dashboard.render.com
2. Chọn service: **music-space-server**
3. Vào **Environment** tab
4. Click **Edit** button
5. Thêm 2 biến mới:

```
KEY: RESEND_API_KEY
VALUE: re_98NBAvj4_6cJBLBq4K1u1Rn3QeiwNbXu9
```

```
KEY: RESEND_FROM
VALUE: onboarding@resend.dev
```

6. Click **Save Changes**
7. Render sẽ tự động redeploy backend

## Bước 3: Sửa VITE_API_URL (Frontend)

1. Vào **music-space-frontend** service trên Render
2. Vào **Environment** tab
3. Tìm `VITE_API_URL`
4. Sửa từ:
   ```
   https://usic-space-server.onrender.com/api
   ```
   thành:
   ```
   https://music-space-server.onrender.com/api
   ```
   (thêm chữ 'm' vào 'music')

5. Click **Save Changes**
6. Frontend sẽ tự động rebuild

## Bước 4: Test Email

Sau khi deploy xong, test bằng cách:

### Cách 1: Qua Browser
Mở: `https://music-space-server.onrender.com/api/debug-email`
(Chỉ hiển thị logs, không gửi email thật)

### Cách 2: Qua curl/Postman
```bash
curl -X POST https://music-space-server.onrender.com/api/debug-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@gmail.com"}'
```

### Cách 3: Đặt vé trên website
Sau khi đặt vé thành công, email sẽ tự động được gửi qua Resend!

## Lưu ý

- Resend miễn phí: 100 emails/ngày
- Để dùng domain riêng: Setup domain trong Resend Dashboard
- Email sẽ được gửi từ `onboarding@resend.dev` (nếu chưa setup domain)

## Kiểm tra Logs

Nếu vẫn không nhận được email:
1. Vào Render Dashboard → Backend → Logs
2. Tìm dòng có `📧` hoặc `✅ Email sent successfully via Resend`
3. Nếu có lỗi, sẽ thấy `❌` hoặc `⚠️`

