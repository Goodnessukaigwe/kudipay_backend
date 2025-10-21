#!/bin/bash

# KudiPay - Africa's Talking Sandbox Setup Script
# This script helps configure your backend for AT deployment

echo "========================================="
echo "  KudiPay - Africa's Talking Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Please create .env manually.${NC}"
        exit 1
    fi
fi

echo ""
echo "📝 Please provide the following information:"
echo ""

# Get Africa's Talking credentials
read -p "Enter your Africa's Talking API Key (or press Enter to skip): " AT_API_KEY
read -p "Enter your USSD Code (e.g., *384*1234#): " AT_USSD_CODE
read -p "Enter your callback URL (ngrok or production): " CALLBACK_URL

# Database configuration
echo ""
echo "💾 Database Configuration:"
read -p "Database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Database name (default: kudipay): " DB_NAME
DB_NAME=${DB_NAME:-kudipay}

read -p "Database user: " DB_USER
read -sp "Database password: " DB_PASSWORD
echo ""

# Generate phone salt if not exists
PHONE_SALT=$(openssl rand -hex 32 2>/dev/null || echo "kudipay-salt-$(date +%s)")

# Update .env file
echo ""
echo "📝 Updating .env file..."

# Backup existing .env
cp .env .env.backup

# Write configurations
cat > .env << EOF
# Node Environment
NODE_ENV=development
PORT=3000

# Africa's Talking Configuration
AT_USERNAME=sandbox
AT_API_KEY=${AT_API_KEY}
AT_USSD_CODE=${AT_USSD_CODE}
CALLBACK_URL=${CALLBACK_URL}

# Database Configuration
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Security
PHONE_SALT=${PHONE_SALT}
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "jwt-secret-$(date +%s)")
PIN_SALT_ROUNDS=10

# Logging
LOG_LEVEL=info

# Feature Flags
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_EMAIL_NOTIFICATIONS=false
EOF

echo -e "${GREEN}✅ .env file updated${NC}"

# Check if node_modules exists
echo ""
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Check database connection
echo ""
echo "🔍 Testing database connection..."
PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
    
    # Ask to run migrations
    echo ""
    read -p "Do you want to run database migrations? (y/n): " RUN_MIGRATIONS
    
    if [ "$RUN_MIGRATIONS" = "y" ] || [ "$RUN_MIGRATIONS" = "Y" ]; then
        echo "Running migrations..."
        
        # Run schema
        PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f schema.sql
        
        # Run migrations
        if [ -d "migrations" ]; then
            for migration in migrations/*.sql; do
                echo "Running $migration..."
                PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "$migration"
            done
        fi
        
        echo -e "${GREEN}✅ Migrations completed${NC}"
    fi
else
    echo -e "${RED}❌ Database connection failed. Please check your credentials.${NC}"
    echo "   Try connecting manually:"
    echo "   psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}"
fi

# Test phone normalization
echo ""
echo "🧪 Testing phone normalization..."
node scripts/test_phone_normalization.js > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Phone normalization tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Phone normalization tests had issues. Run: node scripts/test_phone_normalization.js${NC}"
fi

echo ""
echo "========================================="
echo "  Setup Complete! 🎉"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start your backend:"
echo "   ${GREEN}npm start${NC}"
echo ""
echo "2. In another terminal, start ngrok (if using):"
echo "   ${GREEN}ngrok http 3000${NC}"
echo ""
echo "3. Update Africa's Talking callback URL with your ngrok URL:"
echo "   ${CALLBACK_URL}/api/ussd/callback"
echo ""
echo "4. Test your deployment:"
echo "   curl ${CALLBACK_URL}/api/ussd/test-menu"
echo ""
echo "5. Dial your USSD code on a phone:"
echo "   ${GREEN}${AT_USSD_CODE}${NC}"
echo ""
echo "📚 Full documentation: docs/AFRICAS_TALKING_DEPLOYMENT.md"
echo ""
echo "⚠️  Remember: This is sandbox mode. For production, you'll need:"
echo "   - Production AT account"
echo "   - SSL certificate"
echo "   - Production database"
echo "   - Security hardening"
echo ""
echo "Good luck! 🚀"
echo ""
