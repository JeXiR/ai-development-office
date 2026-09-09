FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-scripts --no-progress

FROM php:8.3-fpm-alpine AS runtime
WORKDIR /var/www/html

RUN addgroup -g 10001 app && adduser -D -u 10001 -G app app     && docker-php-ext-install pdo pdo_mysql

COPY --from=vendor /app/vendor ./vendor
COPY . .

RUN chown -R app:app /var/www/html     && chmod -R u+rwX storage bootstrap/cache

USER app

CMD ["php-fpm"]
