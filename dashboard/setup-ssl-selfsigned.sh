#!/bin/bash

echo "Setting up self-signed SSL certificate for IP access..."

IP=$(curl -s -4 ifconfig.me)
echo "Using IP: $IP"

# Create self-signed certificate
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/dashboard.key \
    -out /etc/nginx/ssl/dashboard.crt \
    -subj "/C=US/ST=State/L=City/O=Dashboard/CN=$IP"

# Create nginx configuration with SSL
cat > /etc/nginx/sites-available/dashboard-ssl << EOF
server {
    listen 80;
    server_name $IP;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name $IP;

    ssl_certificate /etc/nginx/ssl/dashboard.crt;
    ssl_certificate_key /etc/nginx/ssl/dashboard.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

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
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/dashboard-ssl /etc/nginx/sites-enabled/dashboard
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx

if [ $? -eq 0 ]; then
    echo "✓ Self-signed SSL certificate installed successfully!"
    echo ""
    echo "Your dashboard is now available at:"
    echo "https://$IP"
    echo ""
    echo "Note: Browsers will show a security warning because this is a self-signed certificate."
    echo "This is normal and you can proceed by accepting the certificate."
else
    echo "✗ Failed to set up SSL"
fi