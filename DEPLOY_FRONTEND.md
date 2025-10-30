# DEPLOY FRONTEND LÊN RENDER - Hướng dẫn chi tiết

## ✅ Backend đã chạy: `https://usic-space-server.onrender.com`

## Bước deploy Frontend trên Render:

### Cách 1: Deploy qua Render Dashboard (Khuyến nghị)

1. **Vào:** https://dashboard.render.com
2. **Click "New" → "Static Site"**
3. **Connect GitHub:**
   - Chọn repo: `tunbebong-creator/music-space`
   - Branch: `main`
4. **Cấu hình:**
   - **Name:** `music-space-frontend` (hoặc tên bạn muốn)
   - **Build Command:** `npm ci --legacy-peer-deps && npm run build`
   - **Publish Directory:** `dist`
5. **Thêm Environment Variable:**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://usic-space-server.onrender.com/api`
6. **Click "Create Static Site"**

Render sẽ tự động:
- Pull code từ GitHub
- Chạy build command
- Deploy static files từ folder `dist`
- Cho bạn URL frontend

---

### Cách 2: Dùng Blueprint từ render.yaml

File `render.yaml` đã được cập nhật nhưng Render có thể không support static site trong render.yaml.

**Tốt nhất là dùng Cách 1** (tạo Static Site thủ công trong Dashboard).

---

## Sau khi deploy xong:

- ✅ Backend API: `https://usic-space-server.onrender.com`
- ✅ Frontend Web: `https://music-space-frontend.onrender.com` (hoặc URL Render cung cấp)

Frontend sẽ tự động gọi API từ Render backend!

**Lưu ý:** Nhớ thêm Environment Variable `VITE_API_URL` trong Render Dashboard!
