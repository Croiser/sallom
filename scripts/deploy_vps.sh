#!/bin/bash

# Deployment Script for Salão Pro Manager (VPS)
# IP: 187.77.45.37

VPS_IP="187.77.45.37"
VPS_USER="root"
PROJECT_DIR="/root/salaopromanager"
ARCHIVE_NAME="project_deploy.tar.gz"

echo "🚀 Starting Deployment to $VPS_IP..."

# 1. Archive local project (excluding node_modules and other junk)
echo "📦 Archiving project..."
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='dist-server' \
    -czf $ARCHIVE_NAME .

# 2. Transfer archive to VPS
echo "📤 Transferring archive to VPS..."
scp -o StrictHostKeyChecking=no -o BatchMode=yes $ARCHIVE_NAME $VPS_USER@$VPS_IP:$PROJECT_DIR/

# 3. Remote execution
echo "🎬 Executing remote commands..."
ssh -o StrictHostKeyChecking=no -o BatchMode=yes $VPS_USER@$VPS_IP << EOF
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    tar -xzf $ARCHIVE_NAME
    rm $ARCHIVE_NAME
    
    # Build and restart containers
    echo "🏗️ Building and restarting containers..."
    docker-compose down
    docker-compose up -d --build
    
    # Prisma Migrations
    echo "🗄️ Running Prisma migrations..."
    docker-compose exec -T app npx prisma migrate deploy
    
    echo "✅ Remote processing complete!"
EOF

# 4. Cleanup local archive
rm $ARCHIVE_NAME

echo "✨ Deployment Finished!"
echo "📍 Remember to verify the Proxy Host in Nginx Proxy Manager (Port 81):"
echo "   sallon.dodlie.com.br -> http://$VPS_IP:3005"
