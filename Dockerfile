# ============================================
# Portal RH EnterSys - Multi-stage build
# Stage 1: Build React SPA
# Stage 2: Serve with nginx
# ============================================

# --- Build stage ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

ARG VITE_FRAPPE_URL
ENV VITE_FRAPPE_URL=${VITE_FRAPPE_URL}

RUN npm run build

# --- Production stage ---
FROM nginx:stable-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built SPA
COPY --from=build /app/dist /usr/share/nginx/html

# nginx runs on port 80 by default
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD wget -qO- http://localhost/ || exit 1
