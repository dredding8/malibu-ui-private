#!/bin/bash

# UX Flow Cohesion & Behavioral Validation Test Runner
# This script runs comprehensive UX testing for navigation flows and behavioral validation

echo "🧪 UX Flow Cohesion & Behavioral Validation Test Suite"
echo "======================================================"
echo ""

# Set test environment variables
export PLAYWRIGHT_SLOW_MO=100  # Slow down for visual debugging if needed
export PLAYWRIGHT_HEADLESS=false  # Run in headed mode for development
export FORCE_COLOR=true

# Function to run tests with proper formatting
run_test() {
    local test_file=$1
    local test_name=$2
    
    echo "🔄 Running: $test_name"
    echo "----------------------------------------"
    
    npx playwright test "$test_file" \
        --reporter=list \
        --workers=1 \
        --timeout=30000 \
        --retries=0
    
    if [ $? -eq 0 ]; then
        echo "✅ $test_name completed successfully"
    else
        echo "❌ $test_name failed"
    fi
    echo ""
}

# Function to run specific test suites
run_suite() {
    local suite=$1
    
    case $suite in
        "flow")
            echo "📊 Running Flow Discovery & Mapping Tests"
            npx playwright test ux-flow-cohesion-test.spec.ts \
                --grep "Wave 1: Flow Discovery & Mapping" \
                --reporter=list
            ;;
        "interactive")
            echo "🎯 Running Interactive Flow Tests"
            npx playwright test ux-flow-cohesion-test.spec.ts \
                --grep "Wave 2: Interactive Flow Testing" \
                --reporter=list
            ;;
        "cognitive")
            echo "🧠 Running Cognitive Usability Tests"
            npx playwright test ux-flow-cohesion-test.spec.ts \
                --grep "Wave 3: Cognitive Usability Assessment" \
                --reporter=list
            ;;
        "blueprint")
            echo "📘 Running Blueprint.js Research Tests"
            run_test "blueprint-navigation-research.spec.ts" "Blueprint.js Navigation Research"
            ;;
        "all")
            echo "🚀 Running All UX Tests"
            run_test "ux-flow-cohesion-test.spec.ts" "UX Flow Cohesion Tests"
            run_test "blueprint-navigation-research.spec.ts" "Blueprint.js Navigation Research"
            ;;
        *)
            echo "Unknown suite: $suite"
            echo "Available suites: flow, interactive, cognitive, blueprint, all"
            exit 1
            ;;
    esac
}

# Check if specific suite is requested
if [ "$1" ]; then
    run_suite "$1"
else
    # Interactive menu
    echo "Select test suite to run:"
    echo "1) Flow Discovery & Mapping (Wave 1)"
    echo "2) Interactive Flow Testing (Wave 2)"
    echo "3) Cognitive Usability Assessment (Wave 3)"
    echo "4) Blueprint.js Navigation Research"
    echo "5) All Tests"
    echo "6) Run in CI Mode (headless)"
    echo ""
    read -p "Enter your choice (1-6): " choice

    case $choice in
        1) run_suite "flow" ;;
        2) run_suite "interactive" ;;
        3) run_suite "cognitive" ;;
        4) run_suite "blueprint" ;;
        5) run_suite "all" ;;
        6)
            echo "🤖 Running in CI Mode (headless)"
            export PLAYWRIGHT_HEADLESS=true
            export PLAYWRIGHT_SLOW_MO=0
            
            npx playwright test \
                ux-flow-cohesion-test.spec.ts \
                blueprint-navigation-research.spec.ts \
                --reporter=html \
                --workers=4
            
            echo ""
            echo "📊 HTML report generated at: playwright-report/index.html"
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
fi

# Generate summary report
echo ""
echo "📋 Test Summary"
echo "==============="
echo "Test reports are available in:"
echo "- Console output above"
echo "- playwright-report/index.html (if using HTML reporter)"
echo "- UX_FLOW_ANALYSIS_REPORT.md for detailed findings"
echo ""
echo "To view the HTML report:"
echo "  npx playwright show-report"
echo ""
echo "To run specific tests:"
echo "  ./run-ux-flow-tests.sh [flow|interactive|cognitive|blueprint|all]"
echo ""