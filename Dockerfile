# Yahoo Mail MCP Server Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src/ ./src/

# Build the project
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create directory for token storage
RUN mkdir -p /app/.yahoo-mail-mcp && \
    chmod 700 /app/.yahoo-mail-mcp

# Set environment variable for token storage location
ENV YAHOO_TOKEN_DIR=/app/.yahoo-mail-mcp
ENV NODE_ENV=production

# Run as non-root user
RUN addgroup -g 1000 nodeuser && \
    adduser -D -u 1000 -G nodeuser nodeuser && \
    chown -R nodeuser:nodeuser /app

USER nodeuser

# Expose port (if needed for health checks or OAuth callback server)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "console.log('health check')" || exit 1

# Start the MCP server
CMD ["node", "dist/server.js"]

