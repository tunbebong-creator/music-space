# QUICK DEPLOY FRONTEND - Làm theo các bước sau:

## Cách 1: Vercel (Khuyến nghị - Dễ nhất)

1. **Vào:** https://vercel.com
2. **Đăng nhập** bằng GitHub (nếu chưa có tài khoản thì đăng ký)
3. **Click "Add New" → "Project"**
4. **Import GitHub repo:** Chọn `tunbebong-creator/music-space`
5. **Cấu hình:**
   - Framework Preset: **Vite** (hoặc để Vercel tự detect)
   - Root Directory: để trống (hoặc `/`)
   - Build Command: `npm run build` (hoặc để trống)
   - Output Directory: `dist` (hoặc để trống)
   - Install Command: `npm install --legacy-peer-deps`

6. **Thêm Environment Variable:**
   - Name: `VITE_API_URL`
   - Value: `https://usic-space-server.onrender.com/api`

7. **Click "Deploy"**

Sau khi deploy xong, Vercel sẽ cho bạn URL: `https://your-project.vercel.app`

---

## Cách 2: Render Static Site

1. **Vào:** https://dashboard.render.com
2. **Click "New" → "Static Site"**
3. **Connect GitHub:** Chọn repo `tunbebong-creator/music-space`
4. **Cấu hình:**
   - Name: `music-space-frontend` (hoặc tên bạn muốn)
   - Branch: `main`
   - Build Command: `npm install --legacy-peer-deps && npm run build`
   - Publish Directory: `dist`

5. **Thêm Environment Variable:**
   - Key: `VITE_API_URL`
   - Value: `https://usic-space-server.onrender.com/api`

6. **Click "Create Static Site"**

---

## Lưu ý quan trọng:

- ✅ File `vercel.json` đã được tạo và push lên GitHub
- ✅ Code đã được cập nhật để dùng Render backend URL
- ✅ Build đã test thành công local
- ⚠️ Nhớ thêm Environment Variable `VITE_API_URL` khi deploy!

Sau khi deploy xong, bạn sẽ có URL cho frontend và có thể truy cập web app!
