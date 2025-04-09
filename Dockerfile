# Stage 1: Build and install dependencies
FROM node:23-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Stage 2: Production image
FROM node:23-alpine

WORKDIR /app

# Create non-root user
RUN addgroup app && adduser -S -G app app

# Copy dependencies & code from builder
COPY --from=builder /app ./

# Set environment variables
ENV NODE_ENV=production

# Optional: install tini for graceful shutdowns
RUN apk add --no-cache tini

# Install pm2 globally
RUN npm install -g pm2

# Use non-root user
USER app

# Expose backend port
EXPOSE 5000

# Default command: use pm2 to run both scripts
CMD ["pm2-runtime", "ecosystem.config.js"]
