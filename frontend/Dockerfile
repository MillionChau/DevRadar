# ==========================================
# Giai đoạn 1: Build ứng dụng React với Node.js
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Tận dụng cache Docker layer cho dependencies
COPY package.json package-lock.json* ./

RUN npm ci || npm install

# Sao chép toàn bộ mã nguồn frontend
COPY . .

# Biến môi trường lúc build:
# Để VITE_API_BASE_URL rỗng ("") để frontend gọi relative URL cùng origin thông qua Nginx reverse proxy
ENV VITE_API_BASE_URL=""

# Biên dịch ứng dụng React Vite sang static bundle
RUN npm run build

# ==========================================
# Giai đoạn 2: Serve với Nginx siêu nhẹ
# ==========================================
FROM nginx:alpine

# Xóa cấu hình mặc định của Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Sao chép cấu hình Nginx tùy chỉnh (SPA fallback, WebSocket, Gateway proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép static bundle từ giai đoạn build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
