# Deployment Guide: Railway.app

Railway.app là platform hosting cho containerized apps với UI đơn giản. Hướng dẫn dưới đây giúp bạn deploy Laravel React Messenger lên Railway.

## Bước 1: Chuẩn bị (trước khi triển khai)

### 1.1 Cài đặt Railway CLI (tuỳ chọn, nhưng khuyến nghị)
```bash
npm install -g @railway/cli
# hoặc: brew install railwayapp/railway/railway (macOS)
```

### 1.2 Tạo tài khoản Railway
- Truy cập https://railway.app
- Đăng ký bằng GitHub account (khuyến nghị để auto-deploy)
- Xác thực tài khoản

### 1.3 Đẩy mã lên GitHub (bắt buộc nếu chưa)
```bash
git add .
git commit -m "Add Dockerfile.prod and docker-compose.prod.yml for Railway deployment"
git push origin main
```

---

## Bước 2: Deploy lên Railway qua Web UI (Dễ nhất)

### 2.1 Khởi tạo project Railway
1. Vào https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Chọn repo `laravel-react-messenger`
4. Railway sẽ detect `Dockerfile` hoặc `Dockerfile.prod`
   - Nếu Railway không detect, bạn cần config thủ công:
     - Settings → Build → Dockerfile Path: `Dockerfile.prod`

### 2.2 Add MySQL Database plugin
1. Trong Project → Click "Add" (+) → "Add from Marketplace"
2. Tìm "MySQL" → Click "Provision"
3. Railway sẽ cung cấp:
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
4. Ghi nhớ các giá trị này (hoặc Railway tự inject vào environment)

### 2.3 Set Environment Variables
Trong Project Settings → Variables, thêm:
```
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_APP_KEY_HERE  (copy từ local .env)
APP_URL=https://your-railway-domain.railway.app
DB_CONNECTION=mysql
DB_HOST=${{mysql.MYSQL_HOST}}
DB_PORT=3306
DB_DATABASE=${{mysql.MYSQL_DATABASE}}
DB_USERNAME=${{mysql.MYSQL_USER}}
DB_PASSWORD=${{mysql.MYSQL_PASSWORD}}
```

Lưu ý:
- `APP_KEY`: generate locally bằng `php artisan key:generate` (copy base64 key từ `.env`)
- `${{mysql.MYSQL_HOST}}` là reference tới MySQL service; Railway tự inject
- Các biến khác (cache, queue, etc.) bạn có thể thêm sau

### 2.4 Deploy
1. Railway sẽ auto-deploy khi bạn push code (hoặc trigger manual trong UI)
2. Chờ build hoàn tất (xem logs trong "Logs" tab)
3. Khi build xong, Railway cấp cho bạn một domain tạm (ví dụ: `my-app-production.railway.app`)

---

## Bước 3: Chạy Post-Deploy Commands

Sau khi app deploy thành công, bạn cần run migration và setup. Railway cung cấp "SSH Console" hoặc "Railway CLI" để chạy lệnh.

### 3.1 Dùng Railway CLI (nhanh)
```bash
railway login
railway link  # link CLI tới project bạn vừa tạo
railway run php artisan migrate --force
railway run php artisan storage:link --force
railway run php artisan config:cache
railway run php artisan route:cache
```

### 3.2 Dùng Web UI (SSH Console)
1. Trong Project → Services → App → Click "SSH"
2. Sẽ mở terminal SSH tới container
3. Chạy:
```bash
cd /var/www/html
php artisan migrate --force
php artisan storage:link --force
php artisan config:cache
php artisan route:cache
```

---

## Bước 4: Kiểm tra App

1. Vào https://your-railway-domain.railway.app (Railway cung cấp link)
2. Bạn sẽ thấy trang login của Laravel
3. Nếu gặp lỗi 500, check logs:
   - Trong Project UI → Services → App → "Logs" tab
   - Hoặc từ CLI: `railway logs app`

---

## Bước 5: Custom Domain (tuỳ chọn)

Nếu bạn có domain riêng (ví dụ: `mychat.com`):

### 5.1 Add Custom Domain
1. Project Settings → Domains
2. Click "Add Domain"
3. Nhập domain của bạn (ví dụ: `mychat.com`)
4. Railway cung cấp nameserver hoặc CNAME record

### 5.2 Cấu hình DNS
- Đăng nhập vào nhà cung cấp domain của bạn
- Trỏ A record (hoặc CNAME) tới IP/domain Railway cung cấp
- Chờ DNS propagate (5-30 phút)

### 5.3 SSL Certificate
- Railway tự cấp Let's Encrypt certificate cho custom domain
- Không cần cấu hình thêm

---

## Bước 6: Cấu hình CI/CD (tuỳ chọn)

Railway hỗ trợ auto-deploy từ GitHub:
- Mỗi lần bạn push vào `main` (hoặc branch được cấu hình), Railway tự rebuild và deploy
- Kiểm tra Settings → Deployments để tắt/bật auto-deploy

Để trigger manual deploy:
- UI: Project → "Deploy" button
- CLI: `railway deploy`

---

## Lưu ý quan trọng

1. **Free Plan Limitations:**
   - Railway có free tier với giới hạn (ví dụ: $5/tháng credit miễn phí, sau đó tính theo dùng)
   - MySQL add-on tính tiền (nhưng $7/tháng hoặc có credit miễn phí ban đầu)
   - Kiểm tra Billing để tránh charge quá dự kiến

2. **Storage:**
   - Railway không hỗ trợ persistent volumes như Docker Volume
   - File upload sẽ mất khi container restart
   - Giải pháp: upload lên S3/Cloudinary hoặc setup object storage

3. **Queue Workers:**
   - Nếu bạn dùng queue (bgsync messages), cần config worker service riêng
   - Hoặc dùng Railway services + create thêm một service chạy `php artisan queue:work`

4. **Environment Secrets:**
   - KHÔNG commit `.env` production vào Git
   - Dùng Railway Variables UI để set secrets

5. **Backups:**
   - MySQL backups: Railway có backup tự động (kiểm tra MySQL settings)
   - Manual backup: dùng `railway run mysqldump ...`

---

## Troubleshooting

### App bị 502 Bad Gateway
- Check nếu PHP container bị crash
- Xem logs: `railway logs app`
- Kiểm tra DB connection string có đúng không

### Migration lỗi "table already exists"
- Nếu chạy `migrate` lần 2+, dùng `migrate --step` hoặc check DB schema

### File upload không lưu được
- Railway containers là ephemeral (tạm thời)
- Giải pháp: setup S3 hoặc object storage; hoặc dùng Railway Volumes (nếu hỗ trợ)

### Slow deployment
- Railway build image từ Dockerfile.prod (compile PHP extensions)
- Nếu quá chậm, bạn có thể pre-build image và push lên Docker Hub, sau đó Railway pull (nâng cao)

---

## Liên kết hữu ích

- Railway Docs: https://docs.railway.app
- Railway CLI: https://docs.railway.app/reference/cli-api
- Laravel on Railway: https://github.com/railwayapp/templates (nếu có)

---

## Chế độ xem nhanh: một dòng cho mỗi bước

```bash
# Local: build test
docker build -f Dockerfile.prod -t myapp:test .
docker compose -f docker-compose.prod.yml up -d

# Railway: deploy via UI hoặc CLI
railway login
railway link
railway deploy

# Post-deploy
railway run php artisan migrate --force
railway run php artisan storage:link --force
railway run php artisan config:cache
```

Chúc bạn deploy thành công! 🚀
