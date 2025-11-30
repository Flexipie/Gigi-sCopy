# Stage 1: Build stage
FROM --platform=linux/amd64 node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies (better-sqlite3 will compile for Debian/glibc)
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Production stage
FROM --platform=linux/amd64 node:20-slim

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

# Copy dependencies from builder (includes compiled native modules)
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs . .

# Create logs and data directories
RUN mkdir -p logs data && \
    chown -R nodejs:nodejs logs data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/server.js"]
