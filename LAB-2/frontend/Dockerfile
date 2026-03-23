# syntax=docker/dockerfile:1
# Stage 1: Build the React app
FROM node:18-alpine AS builder
WORKDIR /app

ENV CI=false
ENV BROWSER=none
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV SKIP_PREFLIGHT_CHECK=true
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV TSC_COMPILE_ON_ERROR=true

# API URL must be baked in at build time (React CRA inlines REACT_APP_* vars)
ARG REACT_APP_API_URL=http://localhost:8000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
# npm overrides in package.json pin:
#   - root ajv to ^8  (required by webpack5/schema-utils@4 for dist/compile/codegen)
#   - fork-ts-checker-webpack-plugin's ajv to ^6 (its bundled ajv-keywords@3 needs ajv@6)
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html

RUN echo 'server { \
  listen 3000; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
