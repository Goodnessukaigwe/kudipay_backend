#!/bin/bash

# Manual USSD Testing Script
# This script lets you manually test USSD flows

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default values
BASE_URL="http://localhost:3000"
SESSION_ID="TEST_$(date +%s)"
SERVICE_CODE="*384*73588#"
PHONE_NUMBER="+2348054969639"

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   KudiPay USSD Manual Testing Tool${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# Check if ngrok URL should be used
if [ -n "$1" ]; then
    BASE_URL="$1"
    echo -e "${GREEN}Using custom URL: $BASE_URL${NC}"
fi

echo -e "${CYAN}Session ID: $SESSION_ID${NC}"
echo -e "${CYAN}Phone: $PHONE_NUMBER${NC}"
echo ""

# Function to send USSD request
send_ussd() {
    local text="$1"
    local description="$2"
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$description${NC}"
    echo -e "${YELLOW}Input: '$text'${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    response=$(curl -s -X POST "$BASE_URL/api/ussd/callback" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "sessionId=$SESSION_ID" \
        -d "serviceCode=$SERVICE_CODE" \
        -d "phoneNumber=$PHONE_NUMBER" \
        -d "text=$text")
    
    echo ""
    echo -e "${GREEN}Response:${NC}"
    echo "─────────────────────────────────────────────────"
    echo "$response"
    echo "─────────────────────────────────────────────────"
    echo ""
    
    sleep 1
}

# Function to run interactive mode
interactive_mode() {
    echo -e "${BLUE}═══ Interactive Mode ═══${NC}"
    echo "Enter USSD input (or 'quit' to exit)"
    echo ""
    
    # Start with initial request
    send_ussd "" "INITIAL REQUEST (Dial)"
    
    while true; do
        echo -e "${CYAN}Enter your choice (or 'quit'):${NC} "
        read -r user_input
        
        if [ "$user_input" = "quit" ] || [ "$user_input" = "exit" ]; then
            echo -e "${GREEN}Exiting...${NC}"
            break
        fi
        
        send_ussd "$user_input" "USER INPUT"
    done
}

# Function to run automated test scenarios
automated_tests() {
    echo -e "${BLUE}═══ Automated Test Scenarios ═══${NC}"
    echo ""
    
    # Test 1: Main Menu
    echo -e "${CYAN}Test 1: Display Main Menu${NC}"
    send_ussd "" "Dial USSD Code"
    
    # Test 2: Registration Flow
    echo -e "${CYAN}Test 2: Registration Flow${NC}"
    SESSION_ID="TEST_REG_$(date +%s)"
    send_ussd "" "Start Registration"
    send_ussd "1" "Select 'Register Phone Number'"
    send_ussd "1234" "Enter PIN"
    send_ussd "1234" "Confirm PIN"
    
    # Test 3: Check Balance
    echo -e "${CYAN}Test 3: Check Balance${NC}"
    SESSION_ID="TEST_BAL_$(date +%s)"
    send_ussd "" "Start"
    send_ussd "2" "Select 'Check Balance'"
    send_ussd "1234" "Enter PIN"
    
    # Test 4: Transaction History
    echo -e "${CYAN}Test 4: Transaction History${NC}"
    SESSION_ID="TEST_HIST_$(date +%s)"
    send_ussd "" "Start"
    send_ussd "4" "Select 'Transaction History'"
    send_ussd "1234" "Enter PIN"
    
    # Test 5: Invalid Option
    echo -e "${CYAN}Test 5: Invalid Input${NC}"
    SESSION_ID="TEST_INV_$(date +%s)"
    send_ussd "" "Start"
    send_ussd "9" "Enter Invalid Option"
    
    # Test 6: Help
    echo -e "${CYAN}Test 6: Help Menu${NC}"
    SESSION_ID="TEST_HELP_$(date +%s)"
    send_ussd "" "Start"
    send_ussd "5" "Select 'Help & Support'"
    
    # Test 7: Exit
    echo -e "${CYAN}Test 7: Exit${NC}"
    SESSION_ID="TEST_EXIT_$(date +%s)"
    send_ussd "" "Start"
    send_ussd "0" "Select 'Exit'"
    
    echo ""
    echo -e "${GREEN}✓ All automated tests completed!${NC}"
}

# Main menu
echo "Select testing mode:"
echo "1. Interactive Mode (manual testing)"
echo "2. Automated Tests (run all scenarios)"
echo "3. Quick Test (just main menu)"
echo ""
read -p "Enter choice (1-3): " mode

case $mode in
    1)
        interactive_mode
        ;;
    2)
        automated_tests
        ;;
    3)
        send_ussd "" "Quick Test - Main Menu"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Testing Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo "📊 Check logs: tail -f logs/combined.log"
echo "🔍 Check database: psql -U postgres -d kudipay"
echo ""
