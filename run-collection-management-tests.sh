#!/bin/bash

# Collection Management Page Testing Script
# Run comprehensive tests after fixing the VirtualizedOpportunitiesTable import issue

echo "🧪 Collection Management Page Test Suite"
echo "========================================"

# Check if app is running
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ App is not running on localhost:3000"
    echo "Please start the app with: npm start"
    exit 1
fi

echo "✅ App is running on localhost:3000"
echo ""

# Run comprehensive tests
echo "🎭 Running Playwright tests..."
npx playwright test src/tests/e2e/collection-management-comprehensive.spec.ts \
    --project=chromium \
    --reporter=html,line

# Run just the debug test first to verify the page works
echo ""
echo "🔍 Running debug test to verify page functionality..."
npx playwright test src/tests/e2e/collection-management-debug.spec.ts \
    --project=chromium \
    --reporter=line

echo ""
echo "📊 Test Results:"
echo "- HTML Report: test-results/index.html"
echo "- Screenshots: test-results/"
echo "- Detailed Report: collection-management-test-report.md"

echo ""
echo "🚀 To view the HTML report:"
echo "npx playwright show-report"