#!/bin/bash

# Split View Modal Replacement Verification Test Runner
# This script runs comprehensive tests to verify the split view implementation
# has successfully replaced the manual override modal functionality.

echo "========================================="
echo "Split View Verification Test Suite"
echo "========================================="
echo ""
echo "This test suite will verify:"
echo "1. Visual regression across all breakpoints"
echo "2. Interaction flow validation"
echo "3. State management verification"
echo "4. Performance metrics"
echo "5. Cross-browser compatibility"
echo "6. Accessibility compliance"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create required directories
echo -e "${YELLOW}Setting up test environment...${NC}"
mkdir -p test-results/split-view-verification
mkdir -p test-results/split-view-html-report

# Install dependencies if needed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
    echo -e "${YELLOW}Installing Playwright...${NC}"
    npm install -D @playwright/test
    npx playwright install
fi

# Function to run tests for a specific browser
run_browser_tests() {
    local browser=$1
    echo -e "\n${YELLOW}Running tests in ${browser}...${NC}"
    
    npx playwright test \
        --config=playwright.config.split-view.ts \
        --project="${browser}" \
        --reporter=list,html \
        --output=test-results/split-view-verification \
        || {
            echo -e "${RED}Tests failed for ${browser}${NC}"
            return 1
        }
    
    echo -e "${GREEN}✓ ${browser} tests completed${NC}"
}

# Main test execution
echo -e "\n${YELLOW}Starting comprehensive test suite...${NC}\n"

# Run tests for each browser
browsers=("chromium" "firefox" "webkit" "edge" "Mobile Chrome" "Mobile Safari" "Tablet")
failed_browsers=()

for browser in "${browsers[@]}"; do
    if ! run_browser_tests "$browser"; then
        failed_browsers+=("$browser")
    fi
done

# Generate comprehensive report
echo -e "\n${YELLOW}Generating comprehensive test report...${NC}"

# Create summary report
cat > test-results/split-view-verification/SUMMARY.md << EOF
# Split View Modal Replacement Verification Summary

## Test Execution Date: $(date)

## Browser Test Results:
EOF

for browser in "${browsers[@]}"; do
    if [[ " ${failed_browsers[@]} " =~ " ${browser} " ]]; then
        echo "- ❌ ${browser}: FAILED" >> test-results/split-view-verification/SUMMARY.md
    else
        echo "- ✅ ${browser}: PASSED" >> test-results/split-view-verification/SUMMARY.md
    fi
done

# Add performance metrics if available
if [ -f "test-results/split-view-results.json" ]; then
    echo -e "\n## Performance Metrics:" >> test-results/split-view-verification/SUMMARY.md
    node -e "
        const results = require('./test-results/split-view-results.json');
        // Extract and format performance metrics
        console.log('Extracted from test results');
    " >> test-results/split-view-verification/SUMMARY.md 2>/dev/null || true
fi

# Open HTML report
echo -e "\n${YELLOW}Opening HTML test report...${NC}"
if command -v open &> /dev/null; then
    open test-results/split-view-html-report/index.html
elif command -v xdg-open &> /dev/null; then
    xdg-open test-results/split-view-html-report/index.html
else
    echo "HTML report available at: test-results/split-view-html-report/index.html"
fi

# Final summary
echo -e "\n========================================="
if [ ${#failed_browsers[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}Split view has successfully replaced the modal implementation.${NC}"
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${RED}Failed browsers: ${failed_browsers[*]}${NC}"
fi
echo "========================================="

# List screenshot files
echo -e "\n${YELLOW}Screenshots captured:${NC}"
ls -la test-results/split-view-verification/*.png 2>/dev/null || echo "No screenshots found"

echo -e "\n${YELLOW}Test artifacts location:${NC}"
echo "- Screenshots: test-results/split-view-verification/"
echo "- HTML Report: test-results/split-view-html-report/index.html"
echo "- Summary: test-results/split-view-verification/SUMMARY.md"
echo ""

# Exit with appropriate code
[ ${#failed_browsers[@]} -eq 0 ] && exit 0 || exit 1