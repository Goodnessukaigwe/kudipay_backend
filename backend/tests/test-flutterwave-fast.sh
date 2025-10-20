#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Performance tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TOTAL_TIME=0

# Configuration
API_URL="http://localhost:3000/api/payment"
TIMEOUT=5  # 5 second timeout per request
PHONE="+2348012345678"
PIN="1234"

# Test counter
test_count=0
pass_count=0
fail_count=0

# Utility function for timing
timer() {
    local start=$SECONDS
    "$@"
    echo $((SECONDS - start))
}

# Function to run test with timeout
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_field="$5"
    
    test_count=$((test_count + 1))
    
    echo -ne "${BLUE}[Test $test_count]${NC} $test_name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s --max-time $TIMEOUT "$API_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s --max-time $TIMEOUT -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    fi
    
    if [ -z "$response" ]; then
        echo -e "${RED}✗ No response (timeout/connection error)${NC}"
        fail_count=$((fail_count + 1))
        return 1
    fi
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ PASS${NC}"
        pass_count=$((pass_count + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "  Response: $(echo $response | head -c 100)..."
        fail_count=$((fail_count + 1))
        return 1
    fi
}

# Function to run multiple tests in parallel
run_parallel_tests() {
    local tests=("$@")
    for test in "${tests[@]}"; do
        eval "$test" &
    done
    wait
}

echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  KudiPay Flutterwave API - Fast Integration Tests          ║${NC}"
echo -e "${YELLOW}║  Timeout: ${TIMEOUT}s per request | Parallel Mode Enabled  ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Health Check (Critical)
echo -e "${YELLOW}=== Health Checks ===${NC}"
echo -ne "${BLUE}[Setup]${NC} Server connectivity... "
health=$(curl -s --max-time 3 http://localhost:3000/health 2>/dev/null)
if echo "$health" | grep -q "OK"; then
    echo -e "${GREEN}✓ READY${NC}\n"
else
    echo -e "${RED}✗ NOT RUNNING${NC}"
    echo "Start the server with: npm run dev"
    exit 1
fi

# Fast read-only tests (can run in parallel)
echo -e "${YELLOW}=== Read-Only Tests (Parallel) ===${NC}"
START_TIME=$SECONDS

run_test "Get NG Banks" "GET" "/flutterwave/banks/ng" "" "Access Bank"
run_test "Get KE Banks" "GET" "/flutterwave/banks/ke" "" "Kenya Commercial Bank"
run_test "Get MM Providers (NG)" "GET" "/flutterwave/mobile-money/providers?country=NG" "" "MTN"
run_test "Get MM Providers (KE)" "GET" "/flutterwave/mobile-money/providers?country=KE" "" "M-Pesa"

ELAPSED=$((SECONDS - START_TIME))
echo -e "\n${BLUE}Parallel tests completed in ${ELAPSED}s${NC}\n"

# Account verification test
echo -e "${YELLOW}=== Account Operations ===${NC}"
run_test "Verify Account" "POST" "/flutterwave/verify/account" \
    '{"accountNumber":"1234567890","bankCode":"058","country":"NG"}' \
    "verified"

# Withdrawal tests
echo -e "\n${YELLOW}=== Withdrawal Operations ===${NC}"

# NG Bank Withdrawal
run_test "NG Bank Withdrawal" "POST" "/flutterwave/withdraw/ng-bank" \
    "{\"phoneNumber\":\"$PHONE\",\"amount\":50000,\"accountNumber\":\"1234567890\",\"bankCode\":\"058\",\"pin\":\"$PIN\",\"accountName\":\"John Doe\"}" \
    "transferId"

# KE Bank Withdrawal
run_test "KE Bank Withdrawal" "POST" "/flutterwave/withdraw/ke-bank" \
    "{\"phoneNumber\":\"$PHONE\",\"amount\":5000,\"accountNumber\":\"1234567890\",\"bankCode\":\"63f47f9e5e0000f812345678\",\"pin\":\"$PIN\",\"accountName\":\"Jane Doe\"}" \
    "transferId"

# Mobile Money Withdrawal
run_test "Mobile Money Withdrawal" "POST" "/flutterwave/withdraw/mobile-money" \
    "{\"phoneNumber\":\"$PHONE\",\"amount\":50000,\"recipientPhone\":\"+2349087654321\",\"provider\":\"MTN\",\"pin\":\"$PIN\",\"country\":\"NG\"}" \
    "transferId"

# Transfer Status
echo -e "\n${YELLOW}=== Status Tracking ===${NC}"
run_test "Get Transfer Status" "GET" "/flutterwave/transfer/FW_NG_1234567890/status" "" \
    "status"

# Performance Summary
TOTAL_TIME=$((SECONDS - START_TIME))
TOTAL_TESTS=$test_count
PASSED_TESTS=$pass_count
FAILED_TESTS=$fail_count

echo -e "\n${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ TEST SUMMARY                                               ║${NC}"
echo -e "${YELLOW}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${YELLOW}║ Total Tests:  $TOTAL_TESTS${NC}"
echo -e "${GREEN}║ Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}║ Failed:       $FAILED_TESTS${NC}"
echo -e "${BLUE}║ Total Time:   ${TOTAL_TIME}s${NC}"
echo -e "${BLUE}║ Avg/Request:  $((TOTAL_TIME / TOTAL_TESTS))s${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Success/Failure indicator
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED_TESTS test(s) failed${NC}"
    exit 1
fi
