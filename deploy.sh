#!/bin/bash

# CMV Backend Deployment Script
# Usage: ./deploy.sh [development|production]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Starting CMV Backend deployment..."
echo "📝 Environment: $ENVIRONMENT"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Pull latest changes (if git repo)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin master
fi

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 delete all 2>/dev/null || true

# Start application based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🚀 Starting in production mode..."
    pm2 start ecosystem.config.js --env production
else
    echo "🔧 Starting in development mode..."
    pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save

# Show status
echo "📊 Application status:"
pm2 status

echo "✅ Deployment completed successfully!"
echo "🔗 Health check: curl http://localhost:5001/health"

# Show logs
echo "📋 Recent logs:"
pm2 logs --lines 10
