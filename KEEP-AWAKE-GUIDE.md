# Hướng dẫn giữ Render Services không bị Sleep

Render free tier sẽ tự động sleep sau **15 phút** không có traffic. Có 3 cách để giữ services không sleep:

## ✅ Cách 1: Dùng External Service (Khuyến nghị - Miễn phí)

### UptimeRobot (Miễn phí - Tốt nhất)
1. Đăng ký tại: https://uptimerobot.com/
2. Tạo Monitor mới:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://music-space-server.onrender.com/api/health`
   - **Interval**: 5 minutes
   - **Status**: Enable
3. Làm tương tự cho frontend:
   - **URL**: `https://music-space-frontend.onrender.com`
   - **Interval**: 5 minutes

### Cron-Job.org (Miễn phí)
1. Đăng ký tại: https://cron-job.org/
2. Tạo Cron Job:
   - **Title**: Keep Backend Awake
   - **URL**: `https://music-space-server.onrender.com/api/health`
   - **Schedule**: `*/5 * * * *` (mỗi 5 phút)
   - **Request Method**: GET
3. Làm tương tự cho frontend

### EasyCron (Miễn phí)
1. Đăng ký tại: https://www.easycron.com/
2. Tạo Cron Job tương tự như trên

## ✅ Cách 2: Self-Ping trong Server (Đã được thêm)

Server đã tự động ping chính nó mỗi 14 phút (trong production). Không cần làm gì thêm.

**Lưu ý**: Cách này có thể không hoạt động tốt vì server phải wake up trước khi tự ping được.

## ✅ Cách 3: Render Cron Job (Đã được thêm trong render.yaml)

Đã thêm cron job trong `render.yaml` để ping cả backend và frontend mỗi 5 phút.

**Lưu ý**: Render free tier có thể giới hạn số lượng cron jobs.

## 📊 Kiểm tra Services có đang hoạt động

### Backend Health Check
```bash
curl https://music-space-server.onrender.com/api/health
```

Kết quả mong đợi:
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "Connected",
  "time": "2025-10-30T17:36:43.810Z"
}
```

### Frontend Check
```bash
curl https://music-space-frontend.onrender.com
```

## 🔧 Troubleshooting

### Services vẫn bị sleep?
1. Kiểm tra logs trên Render Dashboard
2. Đảm bảo cron job đang chạy (nếu dùng cách 3)
3. Kiểm tra UptimeRobot/Cron-Job.org có đang ping không
4. Thử giảm interval xuống 3-4 phút

### Self-ping không hoạt động?
- Self-ping chỉ hoạt động khi server đã wake up
- Nên dùng external service (Cách 1) để wake up server khi nó sleep

## 💡 Khuyến nghị

**Tốt nhất**: Dùng **UptimeRobot** (Cách 1) vì:
- ✅ Miễn phí
- ✅ Hoạt động 24/7
- ✅ Wake up server ngay khi sleep
- ✅ Có dashboard để monitor
- ✅ Gửi cảnh báo nếu service down

---

**Chúc bạn thành công!** 🚀

