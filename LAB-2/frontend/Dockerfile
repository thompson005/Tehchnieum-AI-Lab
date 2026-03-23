# syntax=docker/dockerfile:1
FROM node:18-alpine

WORKDIR /app

# Suppress browser-open and interactive prompts in Docker
ENV CI=false
ENV BROWSER=none
ENV HOST=0.0.0.0

# Copy package files
COPY package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
