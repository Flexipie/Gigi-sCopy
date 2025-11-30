# Stage 1: Build stage
FROM --platform=linux/amd64 node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies and force rebuild of native modules for Alpine/musl
RUN npm ci --ignore-scripts && \
    npm rebuild better-sqlite3 && \
    npm cache clean --force

# Stage 2: Production stage
FROM --platform=linux/amd64 node:20-alpine

# Set working directory
WORKDIR /app

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache libstdc++

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

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
