#!/bin/bash

set -e

echo "🚀 Secure Dashboard Web Deployment Script"
echo "========================================="

# Function to print colored output
print_success() { echo -e "\033[0;32m✓ $1\033[0m"; }
print_error() { echo -e "\033[0;31m✗ $1\033[0m"; }
print_info() { echo -e "\033[0;34mℹ $1\033[0m"; }

# Check if running as root (recommended for production)
if [ "$EUID" -ne 0 ]; then 
   print_error "Please run as root (use sudo)"
   exit 1
fi

# Check for required commands
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_info "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        systemctl enable docker
        systemctl start docker
        print_success "Docker installed"
    else
        print_success "Docker is installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_info "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        print_success "Docker Compose installed"
    else
        print_success "Docker Compose is installed"
    fi
}

# Setup environment
setup_environment() {
    print_info "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_info "Creating .env file..."
        
        # Generate secure session secret
        SESSION_SECRET=$(openssl rand -hex 32)
        
        cat > .env << EOF
# Generated on $(date)
NODE_ENV=production
PORT=3000
SESSION_SECRET=$SESSION_SECRET
EOF
        print_success ".env file created with secure session secret"
    else
        print_success ".env file already exists"
    fi
    
    # Create necessary directories
    mkdir -p uploads data logs ssl certbot/www certbot/conf
    chmod 755 uploads data logs
    print_success "Directories created"
}

# Deploy with Docker Compose
deploy_application() {
    print_info "Deploying application with Docker Compose..."
    
    # Stop existing containers if any
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Build and start containers
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for services to be ready
    print_info "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_success "Application deployed successfully!"
    else
        print_error "Deployment failed. Check logs with: docker-compose -f docker-compose.prod.yml logs"
        exit 1
    fi
}

# Setup SSL with Let's Encrypt (optional)
setup_ssl() {
    echo ""
    read -p "Do you want to set up SSL with Let's Encrypt? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your domain name (e.g., dashboard.example.com): " DOMAIN
        read -p "Enter your email for Let's Encrypt notifications: " EMAIL
        
        print_info "Setting up SSL for $DOMAIN..."
        
        # Get SSL certificate using certbot
        docker run --rm \
            -v "$(pwd)/certbot/www:/var/www/certbot" \
            -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
            certbot/certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN
        
        if [ $? -eq 0 ]; then
            # Update nginx configuration for SSL
            sed -i "s/your-domain.com/$DOMAIN/g" nginx-prod.conf
            sed -i "s/# return 301/return 301/g" nginx-prod.conf
            sed -i "s/# server {/server {/g" nginx-prod.conf
            sed -i "s/# }/}/g" nginx-prod.conf
            
            # Restart nginx to apply SSL
            docker-compose -f docker-compose.prod.yml restart nginx
            
            print_success "SSL certificate obtained and configured!"
            print_info "Your dashboard is now available at: https://$DOMAIN"
        else
            print_error "Failed to obtain SSL certificate"
            print_info "Make sure your domain points to this server's IP address"
        fi
    else
        print_info "Skipping SSL setup"
    fi
}

# Configure firewall
setup_firewall() {
    print_info "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp   # SSH
        ufw allow 80/tcp   # HTTP
        ufw allow 443/tcp  # HTTPS
        ufw --force enable
        print_success "Firewall configured (ports 22, 80, 443 open)"
    elif command -v firewall-cmd &> /dev/null; then
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        print_success "Firewall configured (SSH, HTTP, HTTPS allowed)"
    else
        print_info "No supported firewall found, skipping firewall configuration"
    fi
}

# Main deployment flow
main() {
    check_requirements
    setup_environment
    deploy_application
    setup_firewall
    setup_ssl
    
    echo ""
    echo "========================================="
    print_success "Deployment completed successfully!"
    echo ""
    echo "📌 Important Information:"
    echo "  - Application URL: http://$(curl -s ifconfig.me):80"
    echo "  - Initial setup: http://$(curl -s ifconfig.me)/setup.html"
    echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  - Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  - Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo ""
    echo "⚠️  Security Notes:"
    echo "  1. Change the default admin password immediately after setup"
    echo "  2. Configure SSL for production use"
    echo "  3. Regularly backup your data directory"
    echo "  4. Monitor logs for suspicious activity"
    echo ""
}

# Run main function
main