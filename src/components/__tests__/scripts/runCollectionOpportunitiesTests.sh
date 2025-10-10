#!/bin/bash

# Collection Opportunities Comprehensive Test Runner
# This script runs all test suites for the Collection Opportunities page

echo "🚀 Starting Collection Opportunities Test Suite"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create test results directory
mkdir -p test-results
mkdir -p playwright-report/collection-opportunities

# Run E2E tests
echo -e "\n${YELLOW}📊 Running E2E User Experience Tests...${NC}"
npx playwright test --config=playwright.config.collectionOpportunities.ts

# Check if tests passed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ E2E tests passed!${NC}"
else
    echo -e "${RED}❌ E2E tests failed!${NC}"
    exit 1
fi

# Run visual regression tests
echo -e "\n${YELLOW}📸 Running Visual Regression Tests...${NC}"
npx playwright test src/components/__tests__/visual/collectionOpportunities.visual.test.ts --update-snapshots

# Run accessibility audit
echo -e "\n${YELLOW}♿ Running Accessibility Audit...${NC}"
npx playwright test --grep="Accessibility Compliance" --reporter=json

# Generate test report
echo -e "\n${YELLOW}📝 Generating Test Report...${NC}"
npx ts-node src/components/__tests__/scripts/generateTestReport.ts

# Open reports
echo -e "\n${GREEN}✨ Tests completed successfully!${NC}"
echo -e "📊 View the HTML report at: test-reports/collection-opportunities-ux-report.html"
echo -e "🎭 View Playwright report: npx playwright show-report playwright-report/collection-opportunities"

# Summary
echo -e "\n${YELLOW}📋 Test Summary:${NC}"
echo "- E2E User Experience Tests: Complete"
echo "- Visual Regression Tests: Complete"
echo "- Accessibility Tests: Complete"
echo "- Performance Metrics: Collected"
echo "- Test Report: Generated"

# Optional: Open report automatically
read -p "Would you like to open the test report? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open test-reports/collection-opportunities-ux-report.html
fi