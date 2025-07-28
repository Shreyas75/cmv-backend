# 🚀 Production Deployment Guide - CMV Backend on EC2

## 📋 **Prerequisites**

### AWS EC2 Instance Setup
- ✅ Ubuntu 20.04+ or Amazon Linux 2
- ✅ Security Group: Port 80, 443, 22 open
- ✅ Key pair for SSH access
- ✅ Elastic IP (recommended for static IP)

## 🔧 **Step 1: Server Setup**

### Connect to your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 18+ (using NodeSource):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PM2 globally:
```bash
sudo npm install -g pm2
```

### Install Nginx (for reverse proxy):
```bash
sudo apt install nginx -y
```

### Install Git:
```bash
sudo apt install git -y
```

## 📁 **Step 2: Deploy Your Application**

### Clone your repository:
```bash
cd /home/ubuntu
git clone https://github.com/Shreyas75/cmv-backend.git
cd cmv-backend
```

### Install dependencies:
```bash
npm install --production
```

### Create production .env file:
```bash
sudo nano .env
```

**Production .env content:**
```bash
# Database
MONGODB_URI=mongodb+srv://arjunnair101105:arjunnn10@cluster0.sjcyi.mongodb.net/CMV

# Email Configuration
EMAIL_USER="arjunchessid@gmail.com"
EMAIL_PASS="vqad sngp kyak fyci"
ADMIN_EMAIL="arjunchessid@gmail.com"

# Cloudinary
CLOUDINARY_CLOUD_NAME=dnqi49qyr

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=HariOm

# Production Settings
NODE_ENV=production
PORT=5001

# Frontend URLs (update with your actual domains)
FRONTEND_URL="https://your-frontend-domain.com"
ADMIN_URL="https://your-admin-domain.com"

# Debug flags (keep false in production)
DEBUG_CORS=false
DEBUG=false
```

## 🚀 **Step 3: Start with PM2**

### Start the application:
```bash
pm2 start ecosystem.config.js
```

### Save PM2 configuration:
```bash
pm2 save
```

### Setup PM2 to start on system reboot:
```bash
pm2 startup
# Follow the instructions provided by the command
```

### Check status:
```bash
pm2 status
pm2 logs
```

## 🌐 **Step 4: Nginx Reverse Proxy Setup**

### Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/cmv-backend
```

**Nginx configuration content:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5001/health;
        access_log off;
    }
}
```

### Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cmv-backend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## 🔒 **Step 5: SSL Certificate (Let's Encrypt)**

### Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Auto-renewal setup:
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔥 **Step 6: Firewall Setup**

### Configure UFW firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 📊 **Step 7: Monitoring & Logs**

### PM2 Monitoring:
```bash
# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart application
pm2 restart all

# Stop application
pm2 stop all
```

### System logs:
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /home/ubuntu/cmv-backend/logs/combined.log
```

## 🔄 **Step 8: Deployment Script**

Create a deployment script for easy updates:

```bash
nano deploy.sh
```

**deploy.sh content:**
```bash
#!/bin/bash

echo "🚀 Deploying CMV Backend..."

# Pull latest changes
git pull origin master

# Install dependencies
npm install --production

# Restart PM2
pm2 restart all

# Check status
pm2 status

echo "✅ Deployment completed!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## ⚡ **Quick Start Commands**

### Start production server:
```bash
cd /home/ubuntu/cmv-backend
pm2 start ecosystem.config.js
```

### Check status:
```bash
pm2 status
curl http://localhost/health
```

### Deploy updates:
```bash
./deploy.sh
```

## 🛡️ **Security Best Practices**

### 1. Environment Variables Security:
```bash
# Secure .env file
sudo chmod 600 .env
sudo chown ubuntu:ubuntu .env
```

### 2. Regular Updates:
```bash
# Weekly security updates
sudo apt update && sudo apt upgrade -y
```

### 3. Database Security:
- ✅ Use MongoDB Atlas with IP whitelisting
- ✅ Use strong database passwords
- ✅ Enable database authentication

### 4. Application Security:
- ✅ Keep Node.js updated
- ✅ Use HTTPS only in production
- ✅ Implement rate limiting (consider adding express-rate-limit)

## 🔍 **Troubleshooting**

### Common Issues:

**Port 5001 in use:**
```bash
sudo lsof -i :5001
pm2 kill
pm2 start ecosystem.config.js
```

**Nginx configuration errors:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

**MongoDB connection issues:**
```bash
pm2 logs cmv-server
# Check MongoDB Atlas network access
```

**SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## 📈 **Performance Optimization**

### 1. PM2 Cluster Mode:
Update `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'cmv-server',
    script: 'src/server.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
}
```

### 2. Nginx Caching:
Add to Nginx config:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## ✅ **Final Checklist**

- [ ] EC2 instance configured with security groups
- [ ] Node.js 18+ installed
- [ ] PM2 installed and configured
- [ ] Nginx reverse proxy setup
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Environment variables set
- [ ] Application started with PM2
- [ ] Health check endpoint accessible
- [ ] Logs monitoring setup
- [ ] Deployment script created

## 🎯 **Your Production URLs**

After setup, your API will be available at:
- **HTTP**: `http://your-domain.com/health`
- **HTTPS**: `https://your-domain.com/health`
- **API Endpoints**: `https://your-domain.com/api/*`

**Ready for production! 🚀**
