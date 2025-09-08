#!/bin/bash

# Comprehensive Navigation Validation Test Runner
# Runs all navigation validation tests in sequence with proper reporting

echo "🎬 Starting Comprehensive Navigation Validation Tests"
echo "===================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test files in order of execution
TESTS=(
    "comprehensive-navigation-validation.spec.ts"
    "spa-context-validation.spec.ts"
    "success-metrics-validation.spec.ts"
    "match-access-validation.spec.ts"
)

# Results tracking
TOTAL_TESTS=${#TESTS[@]}
PASSED_TESTS=0
FAILED_TESTS=0
RESULTS_DIR="test-results/comprehensive-validation-$(date +%Y%m%d-%H%M%S)"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}📋 Test Execution Plan:${NC}"
for i in "${!TESTS[@]}"; do
    echo -e "  $((i+1)). ${TESTS[$i]}"
done
echo ""

# Function to run individual test
run_test() {
    local test_file="$1"
    local test_number="$2"
    
    echo -e "${YELLOW}🧪 Running Test $test_number/$TOTAL_TESTS: $test_file${NC}"
    echo "----------------------------------------"
    
    # Run the test with detailed output
    if npx playwright test "$test_file" \
        --reporter=line,html,json \
        --output-dir="$RESULTS_DIR/$test_file-results" \
        --project=chromium \
        --workers=1; then
        
        echo -e "${GREEN}✅ Test $test_number PASSED: $test_file${NC}"
        ((PASSED_TESTS++))
        return 0
    else
        echo -e "${RED}❌ Test $test_number FAILED: $test_file${NC}"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Execute all tests
START_TIME=$(date +%s)

for i in "${!TESTS[@]}"; do
    test_number=$((i+1))
    run_test "${TESTS[$i]}" "$test_number"
    echo ""
    
    # Brief pause between tests
    sleep 2
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Generate summary report
echo "🎯 COMPREHENSIVE VALIDATION SUMMARY"
echo "=================================="
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Duration: ${BLUE}${DURATION}s${NC}"
echo -e "Success Rate: ${BLUE}$((PASSED_TESTS * 100 / TOTAL_TESTS))%${NC}"

# Generate detailed HTML report
echo ""
echo "📊 Generating Comprehensive Report..."
npx playwright show-report "$RESULTS_DIR" > /dev/null 2>&1 &

# Save summary to file
{
    echo "Comprehensive Navigation Validation Test Results"
    echo "==============================================="
    echo "Date: $(date)"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Duration: ${DURATION}s"
    echo "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"
    echo ""
    echo "Test Files Executed:"
    for test in "${TESTS[@]}"; do
        echo "  - $test"
    done
} > "$RESULTS_DIR/summary.txt"

echo -e "${BLUE}📄 Results saved to: $RESULTS_DIR${NC}"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Check results for details.${NC}"
    exit 1
fi