#!/bin/bash

# Health Check Script for CMV Backend
# Usage: ./health-check.sh

echo "🏥 CMV Backend Health Check"
echo "=========================="

# Check if PM2 processes are running
echo "📊 PM2 Process Status:"
pm2 status

echo ""
echo "🔗 API Health Check:"

# Check health endpoint
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health 2>/dev/null)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health endpoint: OK (HTTP $HEALTH_RESPONSE)"
    
    # Get detailed health info
    HEALTH_DATA=$(curl -s http://localhost:5001/health 2>/dev/null)
    echo "📋 Response: $HEALTH_DATA"
else
    echo "❌ Health endpoint: FAILED (HTTP $HEALTH_RESPONSE)"
fi

echo ""
echo "💾 System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"

echo ""
echo "📁 Log Files:"
echo "Error logs: $(wc -l < logs/err.log 2>/dev/null || echo '0') lines"
echo "Output logs: $(wc -l < logs/out.log 2>/dev/null || echo '0') lines"

echo ""
echo "🕐 Last 5 log entries:"
pm2 logs --lines 5 --nostream
