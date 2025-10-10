#!/bin/bash

# Route Validation Test Runner
# This script runs the comprehensive Playwright tests for route consolidation validation

echo "🎭 Starting Route Validation Tests..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create results directory
mkdir -p test-results
mkdir -p test-results/screenshots
mkdir -p test-results/videos
mkdir -p test-results/traces

# Function to run tests
run_tests() {
    local browser=$1
    echo -e "\n${BLUE}Running tests in ${browser}...${NC}"
    
    # Run Playwright tests for specific browser
    npx playwright test \
        --config=playwright.route-validation.config.ts \
        --project="${browser}" \
        --reporter=list,json,html
    
    return $?
}

# Function to run performance tests
run_performance_tests() {
    echo -e "\n${YELLOW}Running Performance Validation Tests...${NC}"
    
    # Run performance-specific tests
    npx playwright test \
        --config=playwright.route-validation.config.ts \
        --grep="Performance" \
        --reporter=list,json
    
    return $?
}

# Main test execution
echo -e "\n${GREEN}Step 1: Checking Prerequisites${NC}"
# Check if dev server is running
curl -s http://localhost:3000 > /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Dev server not running. Starting it...${NC}"
    npm run dev &
    DEV_PID=$!
    sleep 10  # Wait for server to start
fi

echo -e "\n${GREEN}Step 2: Running Cross-Browser Tests${NC}"
# Run tests in all browsers
BROWSERS=("chromium" "firefox" "webkit")
FAILED_BROWSERS=()

for browser in "${BROWSERS[@]}"; do
    run_tests "$browser"
    if [ $? -ne 0 ]; then
        FAILED_BROWSERS+=("$browser")
    fi
done

echo -e "\n${GREEN}Step 3: Running Mobile Browser Tests${NC}"
run_tests "Mobile Chrome"
run_tests "Mobile Safari"

echo -e "\n${GREEN}Step 4: Running Performance Tests${NC}"
run_performance_tests

echo -e "\n${GREEN}Step 5: Generating Test Report${NC}"
# Generate consolidated report
npx playwright show-report test-results/html-report

# Summary
echo -e "\n=================================="
echo -e "${GREEN}Test Execution Complete!${NC}"
echo -e "=================================="

if [ ${#FAILED_BROWSERS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed successfully!${NC}"
else
    echo -e "${RED}❌ Tests failed in: ${FAILED_BROWSERS[*]}${NC}"
fi

echo -e "\n${BLUE}Test Artifacts:${NC}"
echo "  📸 Screenshots: test-results/screenshots/"
echo "  🎥 Videos: test-results/videos/"
echo "  📊 HTML Report: test-results/html-report/index.html"
echo "  📄 Summary: test-results/route-validation-summary.md"

# Cleanup
if [ ! -z "$DEV_PID" ]; then
    echo -e "\n${YELLOW}Stopping dev server...${NC}"
    kill $DEV_PID 2>/dev/null
fi

# Exit with appropriate code
if [ ${#FAILED_BROWSERS[@]} -eq 0 ]; then
    exit 0
else
    exit 1
fi