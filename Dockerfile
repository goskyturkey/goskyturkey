# ======================================
# STAGE 1: Build Next.js Frontend
# ======================================
FROM node:24-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY frontend/ ./

# Set environment variables for build
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# ======================================
# STAGE 2: Production
# ======================================
FROM node:24-alpine AS runner

WORKDIR /app

# Install PM2 for process management
RUN npm install -g pm2

# ===== BACKEND =====
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# ===== FRONTEND (Next.js Standalone) =====
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Create necessary directories
RUN mkdir -p /app/backend/uploads

# Expose ports
# Backend: 3000, Frontend: 3001
EXPOSE 3000 3001

WORKDIR /app

# PM2 ecosystem file for running both services
COPY <<EOF /app/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/app/backend',
      script: 'server.js',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'frontend',
      cwd: '/app/frontend',
      script: 'server.js',
      env: {
        PORT: 3001,
        HOSTNAME: '0.0.0.0',
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

CMD ["pm2-runtime", "ecosystem.config.js"]
