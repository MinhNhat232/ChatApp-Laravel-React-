FROM php:8.2-cli

# Cài system deps + Node + SQLite dev
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libsqlite3-dev sqlite3 npm \
    && docker-php-ext-configure pdo_sqlite --with-pdo-sqlite=/usr \
    && docker-php-ext-install pdo_sqlite zip

WORKDIR /app

# Copy code vào container
COPY . .

# XÓA .env local để Laravel đọc env từ Render
RUN rm -f .env

# Cài composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install --optimize-autoloader

RUN php artisan storage:link

# Build frontend (Vite + React)
RUN npm ci && npm run build

# SQLite file cho DB
RUN mkdir -p database && touch database/database.sqlite

# Migrate rồi serve
CMD php artisan migrate --force --seed && php artisan serve --host 0.0.0.0 --port $PORT