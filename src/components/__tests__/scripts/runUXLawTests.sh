#!/bin/bash

# Run UX Laws Compliance Tests for Collection Opportunities
# This script executes Playwright tests to validate compliance with fundamental UX principles

echo "🎯 Starting UX Laws Compliance Testing..."
echo "======================================"

# Set test environment
export TEST_ENV="ux-compliance"
export PWDEBUG=0  # Set to 1 for debugging

# Create results directory
mkdir -p test-results/ux-compliance

# Run individual law tests with performance metrics
echo "📏 Testing Fitts's Law (Target Sizes)..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Fitts's Law" --reporter=json > test-results/ux-compliance/fitts-law.json

echo "🤔 Testing Hick's Law (Decision Complexity)..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Hick's Law" --reporter=json > test-results/ux-compliance/hicks-law.json

echo "🏠 Testing Jakob's Law (Familiar Patterns)..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Jakob's Law" --reporter=json > test-results/ux-compliance/jakobs-law.json

echo "🧠 Testing Miller's Law (Cognitive Load)..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Miller's Law" --reporter=json > test-results/ux-compliance/millers-law.json

echo "⚡ Testing Doherty Threshold (Response Times)..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Doherty Threshold" --reporter=json > test-results/ux-compliance/doherty-threshold.json

echo "🎨 Testing Von Restorff Effect (Visual Hierarchy)..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Von Restorff Effect" --reporter=json > test-results/ux-compliance/von-restorff.json

echo "✨ Testing Aesthetic-Usability Effect..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Aesthetic-Usability" --reporter=json > test-results/ux-compliance/aesthetic-usability.json

echo "🎉 Testing Peak-End Rule (Task Completion)..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Peak-End Rule" --reporter=json > test-results/ux-compliance/peak-end.json

echo "📊 Testing Zeigarnik Effect (Progress Indicators)..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Zeigarnik Effect" --reporter=json > test-results/ux-compliance/zeigarnik.json

echo "🔧 Testing Postel's Law (Robustness)..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx -g "Postel's Law" --reporter=json > test-results/ux-compliance/postels-law.json

# Run full test suite with HTML report
echo ""
echo "🏃 Running complete UX compliance test suite..."
npx playwright test CollectionOpportunitiesUXLaws.test.tsx --reporter=html --reporter=list

# Generate compliance report
echo ""
echo "📋 Generating UX Compliance Report..."
node scripts/generateUXComplianceReport.js

echo ""
echo "✅ UX Laws Compliance Testing Complete!"
echo "View the report at: test-results/ux-compliance/report.html"