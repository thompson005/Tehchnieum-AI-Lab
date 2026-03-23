# syntax=docker/dockerfile:1
# Stage 1: Build the React app
FROM node:18-alpine AS builder
WORKDIR /app

ENV CI=false
ENV BROWSER=none
ENV NODE_OPTIONS=--openssl-legacy-provider

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html

# Allow API calls to backend via nginx proxy
RUN echo 'server { \
  listen 3000; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
