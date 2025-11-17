# 🚀 Deploy Guide: Bước tiếp theo sau khi clone repo này

## Tình huống
Bạn vừa mở repo `laravel-react-messenger` ở máy khác (hoặc server) và muốn chạy ứng dụng để người khác dùng được bằng link.

## ✅ Giải pháp: Deploy lên Railway.app (miễn phí, dễ dùng)

### Bước 1: Chuẩn bị (trên máy local của bạn)
```bash
# Chắc chắn code đã push GitHub
git status  # phải clean
git log --oneline | head -3  # xem commit gần nhất
```

### Bước 2: Tạo tài khoản + Project Railway
1. Vào https://railway.app
2. "Sign up with GitHub" (dùng GitHub account của bạn)
3. Xác thực email
4. Dashboard → "New Project" → "Deploy from GitHub repo"
5. Chọn repo `laravel-react-messenger`

### Bước 3: Railway sẽ detect Dockerfile.prod tự động
- Nếu có chọn `Dockerfile.prod` trong build settings, không cần cấu hình gì thêm
- Nếu Railway không detect, vào Settings → Build → Dockerfile Path: `Dockerfile.prod`

### Bước 4: Add MySQL Database
1. Trong Project → Click "Add" (+) → Search "MySQL"
2. Click "Provision" → Railway sẽ tạo managed MySQL cho bạn
3. Ghi nhớ các giá trị mà Railway cung cấp (hoặc Railway tự inject vào environment)

### Bước 5: Set Environment Variables
Trong Project Settings → "Variables", add những biến này:
```
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_URL=https://YOUR_RAILWAY_DOMAIN.railway.app
DB_CONNECTION=mysql
DB_HOST=${{mysql.MYSQL_HOST}}
DB_PORT=3306
DB_DATABASE=${{mysql.MYSQL_DATABASE}}
DB_USERNAME=${{mysql.MYSQL_USER}}
DB_PASSWORD=${{mysql.MYSQL_PASSWORD}}
```

**Cách lấy `APP_KEY`:**
- Nếu chưa có local: chạy `php artisan key:generate` (tạo key mới)
- Copy giá trị `APP_KEY` từ `.env` (format: `base64:xxxxxxxx...`)

### Bước 6: Deploy
- Railway sẽ tự build & deploy khi bạn save variables
- Hoặc manual: vào Deployments → Click "Deploy" button
- Chờ khoảng 5-10 phút (railway build Dockerfile.prod + start containers)

### Bước 7: Chạy Post-Deploy Commands
Khi app chạy xong, bạn cần run database migrations:
- Cách 1 (Easy): SSH vào container từ Railway UI
  - Project → Services → App → "SSH" tab
  - Chạy:
    ```bash
    cd /var/www/html
    php artisan migrate --force
    php artisan storage:link --force
    php artisan config:cache
    ```

- Cách 2 (CLI): Dùng Railway CLI
  ```bash
  railway login
  railway link  # chọn project bạn vừa tạo
  railway run php artisan migrate --force
  railway run php artisan storage:link --force
  railway run php artisan config:cache
  ```

### ✅ Xong! App của bạn đang live
- Vào https://YOUR_RAILWAY_DOMAIN.railway.app
- Bạn sẽ thấy trang login
- Chia link này cho ai thích dùng, họ vào là dùng được

---

## 📍 Có vấn đề?

### Lỗi "502 Bad Gateway"
- Check logs: Project → Services → App → "Logs" tab
- Hoặc: `railway logs app` (nếu dùng CLI)
- Nguyên nhân thường: DB chưa connect, migration chưa chạy, env biến thiếu

### Build thất bại
- Check build logs: Deployments → xem log chi tiết
- Kiểm tra Dockerfile.prod có hợp lệ không
- Nếu lỗi build, liên hệ để tôi debug

### Database connection error
- Verify `DB_HOST=${{mysql.MYSQL_HOST}}` có syntax đúng không
- Check MySQL service đã provision chưa (Railway → Services → MySQL should exist)

---

## 🎯 Chi tiết thêm
- File hướng dẫn chi tiết: `DEPLOYMENT_GUIDE.md` (trong repo)
- Tóm tắt nhanh: `QUICK_START_RAILWAY.md`

---

## 🔗 Liên kết hữu ích
- Railway Docs: https://docs.railway.app
- Railway CLI: https://docs.railway.app/reference/cli-api

---

**Chúc bạn triển khai thành công! 🚀**

Nếu gặp lỗi, tôi sẵn sàng giúp debug. Cứ gửi:
- Logs output (từ Railway UI hoặc `railway logs`)
- Error message cụ thể
