# Этап 1: Сборка (Builder)
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы манифестов для установки зависимостей
COPY package*.json ./

# Устанавливаем все зависимости (включая devDependencies для сборки)
RUN npm ci --legacy-peer-deps

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Этап 2: Запуск (Runner)
FROM node:20-alpine AS runner

WORKDIR /app

# Устанавливаем переменную окружения
ENV NODE_ENV=production

# Копируем только файлы для продакшн-зависимостей
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Копируем собранный код из этапа сборки
COPY --from=builder /app/dist ./dist

# Открываем порт
EXPOSE 3000

# Запуск приложения
CMD ["node", "dist/main"]
