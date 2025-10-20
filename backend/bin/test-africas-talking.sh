#!/bin/bash

# Africa's Talking Sandbox Testing Script
# This script helps you test your KudiPay USSD integration

set -e

echo "🚀 KudiPay - Africa's Talking Sandbox Testing Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Step 1: Check if backend is running
echo "Step 1: Checking backend status..."
if curl -s http://localhost:3000/api/ussd/test-menu > /dev/null 2>&1; then
    print_success "Backend is running on port 3000"
else
    print_error "Backend is not running!"
    print_info "Start it with: npm start"
    exit 1
fi
echo ""

# Step 2: Check environment variables
echo "Step 2: Checking environment configuration..."
if [ -f .env ]; then
    print_success ".env file found"
    
    # Check for required variables
    if grep -q "AFRICAS_TALKING_API_KEY" .env && ! grep -q "AFRICAS_TALKING_API_KEY=your_africas_talking_api_key" .env; then
        print_success "Africa's Talking API Key is configured"
    else
        print_warning "Africa's Talking API Key needs to be updated in .env"
    fi
    
    if grep -q "AFRICAS_TALKING_USERNAME=sandbox" .env; then
        print_success "Username set to 'sandbox'"
    else
        print_warning "AFRICAS_TALKING_USERNAME should be 'sandbox' for testing"
    fi
else
    print_error ".env file not found!"
    exit 1
fi
echo ""

# Step 3: Test database connection
echo "Step 3: Checking database connection..."
DB_USER=$(grep DB_USER .env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f2)
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)

if psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Database connection failed!"
    print_info "Check your database credentials in .env"
fi
echo ""

# Step 4: Test USSD endpoint
echo "Step 4: Testing USSD endpoints..."
TEST_RESPONSE=$(curl -s http://localhost:3000/api/ussd/test-menu)

if echo "$TEST_RESPONSE" | grep -q "success"; then
    print_success "Test menu endpoint working"
    if echo "$TEST_RESPONSE" | grep -q "CON Welcome to KudiPay"; then
        print_success "Menu format is correct"
    fi
else
    print_error "Test menu endpoint failed"
fi
echo ""

# Step 5: Simulate USSD callback
echo "Step 5: Simulating USSD callback request..."
CALLBACK_RESPONSE=$(curl -s -X POST http://localhost:3000/api/ussd/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "sessionId=TEST_$(date +%s)" \
  -d "serviceCode=*384*73588#" \
  -d "phoneNumber=+2348054969639" \
  -d "text=")

if echo "$CALLBACK_RESPONSE" | grep -q "CON Welcome to KudiPay"; then
    print_success "USSD callback working correctly"
    echo ""
    print_info "Response preview:"
    echo "---"
    echo "$CALLBACK_RESPONSE" | head -5
    echo "---"
else
    print_error "USSD callback test failed"
    print_info "Response: $CALLBACK_RESPONSE"
fi
echo ""

# Step 6: Check for ngrok
echo "Step 6: Checking for ngrok (for public access)..."
if command -v ngrok &> /dev/null; then
    print_success "ngrok is installed"
    
    # Check if ngrok is running
    if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)
        if [ -n "$NGROK_URL" ]; then
            print_success "ngrok tunnel is active"
            print_info "Public URL: $NGROK_URL"
            print_info "Callback URL for AT: $NGROK_URL/api/ussd/callback"
            echo ""
            
            # Test via ngrok
            echo "Step 7: Testing via ngrok..."
            NGROK_TEST=$(curl -s "$NGROK_URL/api/ussd/test-menu")
            if echo "$NGROK_TEST" | grep -q "success"; then
                print_success "Backend accessible via ngrok"
            else
                print_error "Cannot access backend via ngrok"
            fi
        else
            print_warning "ngrok is running but no tunnel found"
            print_info "Start ngrok with: ngrok http 3000"
        fi
    else
        print_warning "ngrok is not running"
        print_info "Start ngrok with: ngrok http 3000"
    fi
else
    print_warning "ngrok is not installed"
    print_info "Install with: snap install ngrok"
    print_info "Or download from: https://ngrok.com/download"
fi
echo ""

# Step 7: Show next steps
echo "=================================================="
echo "📋 Summary & Next Steps"
echo "=================================================="
echo ""

if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)
    if [ -n "$NGROK_URL" ]; then
        echo "✅ Your backend is publicly accessible!"
        echo ""
        echo "🔗 Configure Africa's Talking:"
        echo "   1. Go to: https://account.africastalking.com/apps/sandbox/ussd/channels"
        echo "   2. Set callback URL to:"
        echo "      ${GREEN}$NGROK_URL/api/ussd/callback${NC}"
        echo ""
        echo "📱 Test with Simulator:"
        echo "   1. Go to: https://developers.africastalking.com/simulator"
        echo "   2. Select USSD tab"
        echo "   3. Enter your callback URL"
        echo "   4. Click 'Dial' to test"
        echo ""
        echo "🧪 Manual Test Command:"
        echo "   curl -X POST $NGROK_URL/api/ussd/callback \\"
        echo "     -H 'Content-Type: application/x-www-form-urlencoded' \\"
        echo "     -d 'sessionId=test' \\"
        echo "     -d 'serviceCode=*384*73588#' \\"
        echo "     -d 'phoneNumber=+2348054969639' \\"
        echo "     -d 'text='"
        echo ""
    fi
else
    echo "⚠️  Setup ngrok for public access:"
    echo "   1. Install: snap install ngrok"
    echo "   2. Start: ngrok http 3000"
    echo "   3. Run this script again"
    echo ""
fi

echo "📊 Monitor logs:"
echo "   tail -f logs/combined.log"
echo ""

echo "🔍 Check ngrok requests:"
echo "   http://localhost:4040"
echo ""

echo "📚 Full guide:"
echo "   See AFRICAS_TALKING_SANDBOX_GUIDE.md"
echo ""

print_success "Testing script complete!"
