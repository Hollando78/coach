#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: ./setup-ssl.sh <domain> <email>"
    echo "Example: ./setup-ssl.sh dashboard.example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo "Setting up SSL for domain: $DOMAIN"

# Update nginx configuration with the domain
cat > /etc/nginx/sites-available/dashboard << EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t
if [ $? -ne 0 ]; then
    echo "Nginx configuration error. Please check the configuration."
    exit 1
fi

# Reload nginx
systemctl reload nginx

echo "Obtaining SSL certificate from Let's Encrypt..."

# Get SSL certificate
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

if [ $? -eq 0 ]; then
    echo "✓ SSL certificate installed successfully!"
    echo ""
    echo "Your dashboard is now available at:"
    echo "https://$DOMAIN"
    echo ""
    echo "HTTP traffic will be automatically redirected to HTTPS."
else
    echo "✗ Failed to obtain SSL certificate."
    echo "Please ensure:"
    echo "1. The domain $DOMAIN points to this server's IP address"
    echo "2. Port 80 and 443 are open in your firewall"
    exit 1
fi