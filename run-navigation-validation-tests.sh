#!/bin/bash

# Navigation Flow Validation Test Runner
# Executes all validation tests with comprehensive reporting

set -e

echo "🚀 Starting Navigation Flow Validation Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js and npm first.${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules/@playwright/test" ]; then
    echo -e "${YELLOW}📦 Installing Playwright...${NC}"
    npm install -D @playwright/test
    npx playwright install
fi

# Create results directory
RESULTS_DIR="navigation-validation-results"
mkdir -p $RESULTS_DIR

# Function to run a test and capture results
run_test() {
    local test_name=$1
    local test_file=$2
    local report_name=$3
    
    echo -e "\n${YELLOW}Running: $test_name${NC}"
    echo "----------------------------------------"
    
    if npx playwright test "$test_file" --reporter=html --reporter=json > "$RESULTS_DIR/$report_name.log" 2>&1; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
        
        # Extract key metrics from the log
        if grep -q "Cognitive Load" "$RESULTS_DIR/$report_name.log"; then
            echo -e "   Cognitive Load Metrics:"
            grep "Cognitive Load" "$RESULTS_DIR/$report_name.log" | tail -1
        fi
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        echo "   See $RESULTS_DIR/$report_name.log for details"
    fi
}

# Start the application (if not already running)
echo -e "${YELLOW}🌐 Checking application status...${NC}"
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Starting the application..."
    npm start &
    APP_PID=$!
    
    # Wait for the app to be ready
    echo "Waiting for application to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            echo -e "${GREEN}✅ Application is ready${NC}"
            break
        fi
        sleep 1
    done
else
    echo -e "${GREEN}✅ Application is already running${NC}"
fi

# Run all validation tests
echo -e "\n${YELLOW}🧪 Running Validation Tests${NC}"
echo "============================"

# 1. Navigation Flow Validation
run_test "Navigation Flow Validation" \
    "navigation-flow-validation.spec.ts" \
    "navigation-flow"

# 2. Blueprint Compliance Verification  
run_test "Blueprint Compliance Verification" \
    "blueprint-compliance-verification.spec.ts" \
    "blueprint-compliance"

# 3. Iterative Enhancement Framework
run_test "Iterative Enhancement Framework" \
    "iterative-enhancement-framework.spec.ts" \
    "iterative-enhancement"

# Generate combined report
echo -e "\n${YELLOW}📊 Generating Combined Report${NC}"
echo "============================="

cat > "$RESULTS_DIR/validation-summary.md" << EOF
# Navigation Validation Summary Report
Generated on: $(date)

## Test Results Overview

| Test Suite | Status | Key Metrics |
|------------|--------|-------------|
EOF

# Parse results and add to summary
for log_file in "$RESULTS_DIR"/*.log; do
    if [ -f "$log_file" ]; then
        test_name=$(basename "$log_file" .log)
        if grep -q "passed" "$log_file"; then
            status="✅ Passed"
        else
            status="❌ Failed"
        fi
        
        # Extract metrics
        metrics=""
        if grep -q "Cognitive Load" "$log_file"; then
            metrics=$(grep "Cognitive Load" "$log_file" | tail -1 | sed 's/.*: //')
        elif grep -q "Overall Compliance" "$log_file"; then
            metrics=$(grep "Overall Compliance" "$log_file" | tail -1 | sed 's/.*: //')
        elif grep -q "Total Improvement" "$log_file"; then
            metrics=$(grep "Total Improvement" "$log_file" | tail -1 | sed 's/.*: //')
        fi
        
        echo "| $test_name | $status | $metrics |" >> "$RESULTS_DIR/validation-summary.md"
    fi
done

cat >> "$RESULTS_DIR/validation-summary.md" << EOF

## Key Findings

### Navigation Flow
- Cognitive load measurements across all major user flows
- State preservation and deep linking functionality verified
- Progressive disclosure patterns tested

### Blueprint Compliance
- Component usage validated against Blueprint v6 standards
- Accessibility compliance checked
- Enterprise patterns verified

### Enhancement Opportunities
- Identified areas for continuous improvement
- Prioritized recommendations based on impact
- Iterative enhancement cycles demonstrated

## Next Steps
1. Review detailed logs in \`$RESULTS_DIR/\`
2. Implement high-priority enhancements
3. Re-run validation suite after changes
4. Monitor cognitive load trends over time

EOF

echo -e "${GREEN}✅ Validation summary created at: $RESULTS_DIR/validation-summary.md${NC}"

# Open HTML report if available
if [ -f "playwright-report/index.html" ]; then
    echo -e "\n${YELLOW}📈 Opening detailed HTML report...${NC}"
    if command -v open &> /dev/null; then
        open "playwright-report/index.html"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "playwright-report/index.html"
    else
        echo "HTML report available at: playwright-report/index.html"
    fi
fi

# Cleanup
if [ ! -z "$APP_PID" ]; then
    echo -e "\n${YELLOW}🛑 Stopping test application...${NC}"
    kill $APP_PID 2>/dev/null || true
fi

echo -e "\n${GREEN}✅ Navigation Validation Complete!${NC}"
echo "Results saved in: $RESULTS_DIR/"
echo ""

# Display summary
echo "Summary:"
echo "--------"
passed_count=$(grep -c "passed" "$RESULTS_DIR"/*.log 2>/dev/null || echo "0")
failed_count=$(grep -c "failed" "$RESULTS_DIR"/*.log 2>/dev/null || echo "0")
echo -e "Passed: ${GREEN}$passed_count${NC}"
echo -e "Failed: ${RED}$failed_count${NC}"

# Exit with appropriate code
if [ "$failed_count" -gt 0 ]; then
    exit 1
fi

exit 0