# ======================================
# STAGE 1: Build Next.js Frontend
# ======================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY frontend/ ./

# Set environment variables for build
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# ======================================
# STAGE 2: Build Backend TypeScript
# ======================================
FROM node:22-alpine AS backend-builder

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install all dependencies (including dev for TypeScript)
RUN npm install

# Copy source files
COPY backend/ ./

# Build TypeScript
RUN npm run build

# ======================================
# STAGE 3: Production
# ======================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install PM2 for process management
RUN npm install -g pm2

# ===== BACKEND =====
WORKDIR /app/backend

# Copy package files and install production only
COPY backend/package*.json ./
RUN npm install --production

# Install sharp with correct musl binaries for Alpine Linux
RUN npm install @img/sharp-linuxmusl-x64 @img/sharp-libvips-linuxmusl-x64 --save-optional && \
  npm rebuild sharp

# Copy compiled TypeScript output
COPY --from=backend-builder /app/backend/dist ./dist

# Copy non-compiled files needed at runtime
COPY backend/public ./public
# REMOVED: COPY backend/.env.example ./.env (Secrets must be provided via docker-compose or env vars)

# ===== FRONTEND (Next.js Standalone) =====
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Create necessary directories
RUN mkdir -p /app/backend/uploads /app/backend/logs

# Expose ports
# Frontend: 3000, Backend: 3001
EXPOSE 3000 3001

WORKDIR /app

# PM2 ecosystem file for running both services
COPY <<EOF /app/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: '/app/backend',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      }
    },
    {
      name: 'frontend',
      cwd: '/app/frontend',
      script: 'server.js',
      env: {
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

CMD ["pm2-runtime", "ecosystem.config.js"]
