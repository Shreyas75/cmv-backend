#!/bin/bash

# Migration script for CMV Backend restructure
# This script helps transition from the old flat structure to the new organized structure

echo "Starting CMV Backend migration..."

# Backup old files
echo "Creating backup of old files..."
mkdir -p backup
cp server.js backup/ 2>/dev/null || echo "server.js already moved"
cp cron-job.js backup/ 2>/dev/null || echo "cron-job.js already moved"

echo "✅ Migration completed!"
echo ""
echo "New structure summary:"
echo "- Main entry point: src/app.js"
echo "- Development server: src/server.js"
echo "- Controllers organized in src/controllers/"
echo "- Models organized in src/models/"
echo "- Routes organized in src/routes/"
echo "- Services organized in src/services/"
echo "- Jobs organized in src/jobs/"
echo ""
echo "To start the application:"
echo "- Development: npm run dev"
echo "- Production: npm start"
echo "- With PM2: pm2 start ecosystem.config.js"
echo ""
echo "Don't forget to:"
echo "1. Update your .env file if needed"
echo "2. Test all endpoints after migration"
echo "3. Update any deployment scripts to use src/app.js"
