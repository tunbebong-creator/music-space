# Deploy Frontend to Vercel

## Quick Deploy Steps:

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository: `tunbebong-creator/music-space`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `/` (leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --legacy-peer-deps`
   
5. Add Environment Variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://usic-space-server.onrender.com/api`

6. Click "Deploy"

## Alternative: Deploy to Render Static Site

1. Go to Render Dashboard
2. Click "New" → "Static Site"
3. Connect GitHub repo: `tunbebong-creator/music-space`
4. Configure:
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variable**: `VITE_API_URL=https://usic-space-server.onrender.com/api`

Frontend sẽ tự động build và deploy. Sau khi deploy xong, bạn sẽ có URL cho frontend!

