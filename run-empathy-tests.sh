#!/bin/bash

# Script to run empathy-driven user journey tests
# Ensures the application is running and executes comprehensive test suite

set -e

echo "🎯 Starting Empathy-Driven User Journey Tests"
echo "============================================"

# Check if the application is running
check_app_running() {
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        echo "✅ Application is running at http://localhost:3000"
        return 0
    else
        echo "❌ Application is not running at http://localhost:3000"
        return 1
    fi
}

# Start the application if not running
start_app() {
    echo "📦 Starting the application..."
    npm start &
    APP_PID=$!
    echo "⏳ Waiting for application to start (PID: $APP_PID)..."
    
    # Wait up to 60 seconds for the app to start
    for i in {1..60}; do
        if check_app_running; then
            echo "✅ Application started successfully"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ Failed to start application"
    return 1
}

# Main execution
main() {
    # Check if app is already running
    if ! check_app_running; then
        start_app
        STARTED_APP=true
    else
        STARTED_APP=false
    fi
    
    echo ""
    echo "🧪 Running Empathy Test Suite"
    echo "----------------------------"
    
    # Install Playwright browsers if needed
    echo "📥 Ensuring Playwright browsers are installed..."
    npx playwright install
    
    # Run different test suites
    echo ""
    echo "1️⃣ Running existing user journey tests..."
    npx playwright test src/tests/e2e/collection-management-user-journeys.spec.ts \
        --config=playwright.empathy.config.ts \
        --reporter=list \
        || true
    
    echo ""
    echo "2️⃣ Running additional empathy scenarios..."
    npx playwright test src/tests/e2e/collection-management-empathy-scenarios.spec.ts \
        --config=playwright.empathy.config.ts \
        --reporter=list \
        || true
    
    echo ""
    echo "3️⃣ Running full empathy test suite..."
    npx playwright test \
        --config=playwright.empathy.config.ts \
        --reporter=html \
        || true
    
    echo ""
    echo "📊 Test Results"
    echo "--------------"
    echo "📄 HTML Report: test-results/empathy-tests/empathy-test-report.html"
    echo "📁 Screenshots: test-results/empathy-tests/screenshots/"
    echo "🎥 Videos: test-results/empathy-tests/videos/"
    echo "♿ Accessibility Report: test-results/empathy-tests/accessibility-report.html"
    
    # Open the HTML report
    if command -v open &> /dev/null; then
        echo ""
        echo "📖 Opening test report..."
        open test-results/empathy-tests/index.html || true
    fi
    
    # Clean up if we started the app
    if [ "$STARTED_APP" = true ] && [ -n "$APP_PID" ]; then
        echo ""
        echo "🧹 Cleaning up..."
        kill $APP_PID 2>/dev/null || true
    fi
    
    echo ""
    echo "✅ Empathy test run complete!"
}

# Run with specific test pattern
run_specific() {
    local pattern=$1
    echo "🎯 Running tests matching: $pattern"
    
    npx playwright test "$pattern" \
        --config=playwright.empathy.config.ts \
        --reporter=list,html
}

# Show help
show_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -p, --pattern  Run tests matching a specific pattern"
    echo "  -d, --debug    Run tests in debug mode"
    echo "  -u, --ui       Run tests in UI mode"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all empathy tests"
    echo "  $0 -p \"Critical\"      # Run tests with 'Critical' in the name"
    echo "  $0 -d                 # Run tests in debug mode"
    echo "  $0 -u                 # Run tests in UI mode"
}

# Parse command line arguments
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    -p|--pattern)
        if [ -z "$2" ]; then
            echo "Error: Pattern required"
            exit 1
        fi
        run_specific "$2"
        exit 0
        ;;
    -d|--debug)
        echo "🐛 Running in debug mode..."
        PWDEBUG=1 npx playwright test --config=playwright.empathy.config.ts
        exit 0
        ;;
    -u|--ui)
        echo "🖥️ Running in UI mode..."
        npx playwright test --ui --config=playwright.empathy.config.ts
        exit 0
        ;;
    *)
        main
        ;;
esac