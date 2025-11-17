# Quick Start: Deploy to Railway in 5 minutes

## 1️⃣ Chuẩn bị code
```bash
git add .
git commit -m "Add production Dockerfile and deployment guide"
git push origin main
```

## 2️⃣ Tạo tài khoản + project Railway
1. Vào https://railway.app
2. Sign up với GitHub account
3. Click "New Project" → "Deploy from GitHub repo"
4. Chọn repo `laravel-react-messenger` → Auto-detect sẽ tìm `Dockerfile.prod`

## 3️⃣ Add MySQL Database
1. Trong project → Click "Add" (+) → Search "MySQL" → "Provision"
2. Railway sẽ tạo DB và inject environment variables (`MYSQL_HOST`, `MYSQL_PASSWORD`, etc.)

## 4️⃣ Set Environment Variables
Trong Project Settings → "Variables", thêm:
```
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_URL=https://my-app-production.railway.app
DB_CONNECTION=mysql
DB_HOST=${{mysql.MYSQL_HOST}}
DB_PORT=3306
DB_DATABASE=${{mysql.MYSQL_DATABASE}}
DB_USERNAME=${{mysql.MYSQL_USER}}
DB_PASSWORD=${{mysql.MYSQL_PASSWORD}}
```

**Lấy `APP_KEY`:**
- Chạy local: `php artisan key:generate`
- Copy giá trị `APP_KEY` từ `.env` (format: `base64:xxx`)

## 5️⃣ Deploy & Post-deploy Setup
1. Railway sẽ auto-deploy (chờ vài phút)
2. Build xong, bạn sẽ có domain Railway (ví dụ: `my-app-production.railway.app`)
3. Chạy post-deploy commands (dùng Railway CLI hoặc SSH):
```bash
railway run php artisan migrate --force
railway run php artisan storage:link --force
railway run php artisan config:cache
```

## ✅ Done!
- App chạy tại: `https://my-app-production.railway.app`
- Ai truy cập link = dùng được app

---

## Thêm custom domain (tuỳ chọn)
1. Project Settings → "Domains"
2. Add domain → nhập `mychat.com`
3. Cấu hình DNS tại nhà cung cấp domain (trỏ CNAME/A record)
4. Railway tự cấp SSL (Let's Encrypt)

---

## Troubleshooting
- **502 Bad Gateway**: check logs (`Railway UI → Logs` tab hoặc `railway logs app`)
- **Migration error**: `railway run php artisan migrate --step` hoặc reset DB
- **File upload không lưu**: Railway containers là ephemeral; cần S3 hoặc object storage (tuỳ chọn)

---

📖 Xem chi tiết tại: `DEPLOYMENT_GUIDE.md`
