# =============================================================================
# Multi-stage Dockerfile for DemoApp (Node.js)
# Optimized for production with security best practices
# =============================================================================

# Build Arguments
ARG NODE_VERSION=18-alpine
ARG APP_VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:${NODE_VERSION} AS dependencies

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# =============================================================================
# Stage 2: Build (if needed for TypeScript/build step)
# =============================================================================
FROM node:${NODE_VERSION} AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Run build commands if needed (e.g., TypeScript compilation)
# RUN npm run build

# =============================================================================
# Stage 3: Production Runtime
# =============================================================================
FROM node:${NODE_VERSION} AS runtime

# Add metadata labels following OCI standards
LABEL org.opencontainers.image.title="DemoApp" \
      org.opencontainers.image.description="Demo Application with Swagger for Test Case Generation" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="EY VIBE Testing Platform" \
      org.opencontainers.image.authors="EY VIBE Testing Platform" \
      org.opencontainers.image.url="https://github.com/your-org/a2a" \
      org.opencontainers.image.source="https://github.com/your-org/a2a" \
      org.opencontainers.image.licenses="MIT"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs server.js ./
COPY --chown=nodejs:nodejs server-db.js ./
COPY --chown=nodejs:nodejs db.js ./
COPY --chown=nodejs:nodejs models ./models
COPY --chown=nodejs:nodejs README.md ./

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NPM_CONFIG_LOGLEVEL=warn

# Expose application port
EXPOSE 3000

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with MongoDB
CMD ["node", "server-db.js"]

# =============================================================================
# Build Instructions:
# =============================================================================
# Build image:
#   docker build -t demoapp:latest \
#     --build-arg APP_VERSION=1.0.0 \
#     --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
#     --build-arg VCS_REF=$(git rev-parse --short HEAD) \
#     -f Dockerfile .
#
# Run container:
#   docker run -d -p 3000:3000 --name demoapp demoapp:latest
#
# Test health:
#   curl http://localhost:3000/health
# =============================================================================
