#!/bin/bash

# JTBD Test Execution Script
# Run comprehensive JTBD validation tests with Playwright

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PARALLEL=true
BROWSERS="desktop-chrome"
HEADED=false
DEBUG=false
UPDATE_BASELINE=false
REPORT_ONLY=false
SPECIFIC_TEST=""

# Function to display usage
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -a, --all-browsers      Run tests on all browsers"
    echo "  -b, --browser <name>    Run tests on specific browser (default: desktop-chrome)"
    echo "  -d, --debug             Run tests in debug mode"
    echo "  -H, --headed            Run tests in headed mode (visible browser)"
    echo "  -s, --sequential        Run tests sequentially instead of parallel"
    echo "  -t, --test <name>       Run specific test by name"
    echo "  -u, --update-baseline   Update visual regression baselines"
    echo "  -r, --report            Generate report from existing results"
    echo "  -c, --clean             Clean previous test results"
    echo ""
    echo "Examples:"
    echo "  $0                      # Run all tests on Chrome"
    echo "  $0 -a                   # Run all tests on all browsers"
    echo "  $0 -d -H                # Debug mode with visible browser"
    echo "  $0 -t \"verify collection plans\"  # Run specific test"
    echo ""
}

# Function to check dependencies
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    # Check if playwright is installed
    if ! npm list @playwright/test &> /dev/null; then
        echo -e "${YELLOW}⚠️  Playwright not found. Installing dependencies...${NC}"
        npm install
    fi
    
    # Install missing dependencies for visual validation
    if ! npm list pixelmatch &> /dev/null; then
        echo -e "${YELLOW}⚠️  Installing visual validation dependencies...${NC}"
        npm install pixelmatch pngjs @types/pixelmatch @types/pngjs --save-dev
    fi
    
    # Install Playwright browsers if needed
    if [ ! -d "node_modules/@playwright/test/.local-browsers" ]; then
        echo -e "${YELLOW}⚠️  Installing Playwright browsers...${NC}"
        npx playwright install
    fi
    
    echo -e "${GREEN}✅ Dependencies verified${NC}"
}

# Function to clean previous results
clean_results() {
    echo -e "${BLUE}🧹 Cleaning previous test results...${NC}"
    rm -rf test-results/jtbd-*
    rm -rf playwright-report
    echo -e "${GREEN}✅ Cleaned${NC}"
}

# Function to ensure test data exists
prepare_test_environment() {
    echo -e "${BLUE}🔧 Preparing test environment...${NC}"
    
    # Create necessary directories
    mkdir -p test-results/jtbd-artifacts
    mkdir -p src/tests/e2e/jtbd/.auth
    
    # Check if app is running
    if ! curl -s http://localhost:3000 > /dev/null; then
        echo -e "${YELLOW}⚠️  Application not running. Starting...${NC}"
        npm start &
        APP_PID=$!
        echo -e "${BLUE}⏳ Waiting for application to start...${NC}"
        
        # Wait for app to be ready
        for i in {1..30}; do
            if curl -s http://localhost:3000 > /dev/null; then
                echo -e "${GREEN}✅ Application started${NC}"
                break
            fi
            sleep 2
        done
        
        if ! curl -s http://localhost:3000 > /dev/null; then
            echo -e "${RED}❌ Failed to start application${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Application already running${NC}"
    fi
}

# Function to run tests
run_tests() {
    echo -e "${BLUE}🚀 Running JTBD validation tests...${NC}"
    echo -e "${BLUE}📊 Configuration:${NC}"
    echo "  - Browsers: $BROWSERS"
    echo "  - Parallel: $PARALLEL"
    echo "  - Headed: $HEADED"
    echo "  - Debug: $DEBUG"
    echo ""
    
    # Build playwright command
    CMD="npx playwright test --config=playwright.jtbd.config.ts"
    
    # Add browser selection
    if [ "$BROWSERS" != "all" ]; then
        CMD="$CMD --project=$BROWSERS"
    fi
    
    # Add parallel/sequential flag
    if [ "$PARALLEL" = false ]; then
        CMD="$CMD --workers=1"
    fi
    
    # Add headed flag
    if [ "$HEADED" = true ]; then
        CMD="$CMD --headed"
    fi
    
    # Add debug flag
    if [ "$DEBUG" = true ]; then
        CMD="$CMD --debug"
    fi
    
    # Add specific test filter
    if [ -n "$SPECIFIC_TEST" ]; then
        CMD="$CMD --grep \"$SPECIFIC_TEST\""
    fi
    
    # Add environment variables
    export JTBD_PARALLEL=$PARALLEL
    export JTBD_SCREENSHOTS=true
    export JTBD_A11Y=true
    
    # Run tests
    echo -e "${BLUE}🏃 Executing: $CMD${NC}"
    if $CMD; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        return 1
    fi
}

# Function to update baselines
update_baselines() {
    echo -e "${BLUE}📸 Updating visual regression baselines...${NC}"
    
    # Run tests to capture new screenshots
    JTBD_UPDATE_BASELINE=true npx playwright test --config=playwright.jtbd.config.ts --project=desktop-chrome
    
    # Copy actual screenshots to baseline
    if [ -d "test-results/jtbd-artifacts/visual/actual" ]; then
        cp -r test-results/jtbd-artifacts/visual/actual/* test-results/jtbd-artifacts/visual/baseline/
        echo -e "${GREEN}✅ Baselines updated${NC}"
    else
        echo -e "${RED}❌ No actual screenshots found${NC}"
    fi
}

# Function to generate report
generate_report() {
    echo -e "${BLUE}📊 Generating test report...${NC}"
    
    # Generate Playwright HTML report
    npx playwright show-report test-results/jtbd-report
    
    # Check if metrics file exists
    if [ -f "test-results/jtbd-artifacts/jtbd-metrics.json" ]; then
        echo -e "${GREEN}✅ Metrics report available at: test-results/jtbd-artifacts/jtbd-summary.html${NC}"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -a|--all-browsers)
            BROWSERS="all"
            shift
            ;;
        -b|--browser)
            BROWSERS="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -H|--headed)
            HEADED=true
            shift
            ;;
        -s|--sequential)
            PARALLEL=false
            shift
            ;;
        -t|--test)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        -u|--update-baseline)
            UPDATE_BASELINE=true
            shift
            ;;
        -r|--report)
            REPORT_ONLY=true
            shift
            ;;
        -c|--clean)
            clean_results
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo -e "${BLUE}🎯 JTBD Test Runner${NC}"
    echo "================================"
    
    # Report only mode
    if [ "$REPORT_ONLY" = true ]; then
        generate_report
        exit 0
    fi
    
    # Update baseline mode
    if [ "$UPDATE_BASELINE" = true ]; then
        check_dependencies
        prepare_test_environment
        update_baselines
        exit 0
    fi
    
    # Normal test run
    check_dependencies
    prepare_test_environment
    
    # Run tests
    if run_tests; then
        echo ""
        echo -e "${GREEN}🎉 JTBD validation completed successfully!${NC}"
        
        # Show summary
        if [ -f "test-results/jtbd-artifacts/jtbd-metrics.json" ]; then
            echo ""
            echo -e "${BLUE}📊 Test Summary:${NC}"
            node -e "
                const metrics = require('./test-results/jtbd-artifacts/jtbd-metrics.json');
                if (metrics.summary) {
                    console.log('  - Pass Rate:', metrics.summary.passed + '/' + metrics.summary.totalWorkflows);
                    console.log('  - Performance Score:', metrics.summary.performanceScore + '/100');
                    console.log('  - Average Duration:', (metrics.summary.averageDuration / 1000).toFixed(2) + 's');
                    console.log('  - Total Errors:', metrics.summary.totalErrors);
                }
            " 2>/dev/null || true
        fi
        
        echo ""
        echo -e "${BLUE}📄 View detailed report:${NC}"
        echo "  npx playwright show-report test-results/jtbd-report"
        
    else
        echo ""
        echo -e "${RED}⚠️  JTBD validation failed${NC}"
        echo -e "${BLUE}📄 View detailed report for failures:${NC}"
        echo "  npx playwright show-report test-results/jtbd-report"
        exit 1
    fi
    
    # Cleanup if we started the app
    if [ -n "$APP_PID" ]; then
        echo -e "${BLUE}🛑 Stopping application...${NC}"
        kill $APP_PID 2>/dev/null || true
    fi
}

# Run main function
main