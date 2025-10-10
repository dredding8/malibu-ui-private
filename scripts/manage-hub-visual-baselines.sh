#!/bin/bash

# CollectionOpportunitiesHub Visual Baseline Management Script
# Specialized tool for managing visual tests for the Hub component

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Directories
BASELINE_DIR="test-results/visual-baselines/collection-hub"
SCREENSHOT_DIR="test-results/visual-screenshots/collection-hub"
DIFF_DIR="test-results/visual-diffs/collection-hub"
REPORT_DIR="test-results/visual-report"

# Test file
HUB_TEST_FILE="src/tests/e2e/visual-collection-opportunities-hub.spec.ts"

# Default values
ACTION=""
BROWSER="chromium"
UPDATE_ALL=false
SHOW_REPORT=false
VERBOSE=false
FILTER=""

# Function to display usage
usage() {
    echo -e "${CYAN}CollectionOpportunitiesHub Visual Testing Tool${NC}"
    echo ""
    echo "Usage: $0 [action] [options]"
    echo ""
    echo "Actions:"
    echo "  capture     Capture new screenshots of the Hub"
    echo "  compare     Compare Hub screenshots with baselines"
    echo "  update      Update Hub baselines with current screenshots"
    echo "  report      Generate Hub visual test report"
    echo "  clean       Clean all Hub visual test artifacts"
    echo "  list        List all Hub baselines"
    echo "  status      Show Hub visual test status"
    echo ""
    echo "Options:"
    echo "  -b, --browser <name>    Browser to use (default: chromium)"
    echo "  -a, --all               Run on all browsers"
    echo "  -f, --filter <pattern>  Filter tests by pattern"
    echo "  -r, --report            Show report after action"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 capture              # Capture Hub screenshots on Chrome"
    echo "  $0 compare -a           # Compare on all browsers"
    echo "  $0 update --all         # Update all Hub baselines"
    echo "  $0 status               # Check current status"
    echo ""
}

# Function to print header
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  CollectionOpportunitiesHub Visual Testing${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    if [ ! -f "$HUB_TEST_FILE" ]; then
        echo -e "${RED}❌ Hub test file not found: $HUB_TEST_FILE${NC}"
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npx command not found. Please install Node.js${NC}"
        exit 1
    fi
}

# Function to capture screenshots
capture_screenshots() {
    print_header
    echo -e "${BLUE}📸 Capturing Hub visual screenshots...${NC}"
    echo ""
    
    # Create directories if they don't exist
    mkdir -p "$BASELINE_DIR"
    mkdir -p "$SCREENSHOT_DIR"
    mkdir -p "$DIFF_DIR"
    
    local test_filter=""
    if [ -n "$FILTER" ]; then
        test_filter="--grep \"$FILTER\""
    fi
    
    if [ "$UPDATE_ALL" = true ]; then
        echo "Running visual tests on all browsers..."
        npx playwright test "$HUB_TEST_FILE" --config=playwright.visual.config.ts $test_filter
    else
        echo "Running visual tests on $BROWSER..."
        npx playwright test "$HUB_TEST_FILE" --config=playwright.visual.config.ts --project="$BROWSER" $test_filter
    fi
    
    # Count captured screenshots
    if [ -d "$SCREENSHOT_DIR" ]; then
        local count=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l)
        echo ""
        echo -e "${GREEN}✅ Captured $count Hub screenshots${NC}"
    fi
}

# Function to compare with baselines
compare_screenshots() {
    print_header
    echo -e "${BLUE}🔍 Comparing Hub screenshots with baselines...${NC}"
    echo ""
    
    if [ ! -d "$BASELINE_DIR" ] || [ -z "$(ls -A $BASELINE_DIR 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠️  No baselines found. Run 'update' first to create baselines.${NC}"
        return
    fi
    
    local test_filter=""
    if [ -n "$FILTER" ]; then
        test_filter="--grep \"$FILTER\""
    fi
    
    if [ "$UPDATE_ALL" = true ]; then
        npx playwright test "$HUB_TEST_FILE" --config=playwright.visual.config.ts --grep "Compare with Baselines" $test_filter
    else
        npx playwright test "$HUB_TEST_FILE" --config=playwright.visual.config.ts --project="$BROWSER" --grep "Compare with Baselines" $test_filter
    fi
    
    # Check for differences
    if [ -d "$DIFF_DIR" ] && [ "$(ls -A $DIFF_DIR 2>/dev/null)" ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Visual differences detected in Hub${NC}"
        echo -e "View diffs in: $DIFF_DIR"
        
        # List specific differences
        echo ""
        echo -e "${YELLOW}Changed screenshots:${NC}"
        ls -1 "$DIFF_DIR" | while read file; do
            echo "  • $file"
        done
    else
        echo ""
        echo -e "${GREEN}✅ No visual regressions detected in Hub${NC}"
    fi
}

# Function to update baselines
update_baselines() {
    print_header
    echo -e "${BLUE}🔄 Updating Hub visual baselines...${NC}"
    echo ""
    
    # First capture new screenshots
    capture_screenshots
    
    # Create baseline directory if it doesn't exist
    mkdir -p "$BASELINE_DIR"
    
    if [ "$UPDATE_ALL" = true ]; then
        # Update all baselines
        echo "Updating all Hub baselines..."
        if [ -d "$SCREENSHOT_DIR" ] && [ "$(ls -A $SCREENSHOT_DIR 2>/dev/null)" ]; then
            cp -r "$SCREENSHOT_DIR"/*.png "$BASELINE_DIR/" 2>/dev/null || true
            local count=$(ls -1 "$BASELINE_DIR"/*.png 2>/dev/null | wc -l)
            echo -e "${GREEN}✅ Updated $count Hub baselines${NC}"
        fi
    else
        # Update specific browser baselines
        if [ -d "$SCREENSHOT_DIR" ]; then
            local updated=0
            for file in "$SCREENSHOT_DIR"/*-"$BROWSER".png; do
                if [ -f "$file" ]; then
                    cp "$file" "$BASELINE_DIR/" 2>/dev/null || true
                    ((updated++))
                fi
            done
            echo -e "${GREEN}✅ Updated $updated Hub baselines for $BROWSER${NC}"
        else
            echo -e "${RED}❌ No screenshots found to update${NC}"
        fi
    fi
}

# Function to generate report
generate_report() {
    print_header
    echo -e "${BLUE}📊 Generating Hub visual test report...${NC}"
    echo ""
    
    # Run report generation test
    npx playwright test "$HUB_TEST_FILE" --config=playwright.visual.config.ts --grep "Generate Visual Report" --project=chromium
    
    echo -e "${CYAN}Visual Test Summary for CollectionOpportunitiesHub:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Count files
    local baseline_count=0
    local screenshot_count=0
    
    if [ -d "$BASELINE_DIR" ]; then
        baseline_count=$(ls -1 "$BASELINE_DIR"/*.png 2>/dev/null | wc -l)
    fi
    
    if [ -d "$SCREENSHOT_DIR" ]; then
        screenshot_count=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l)
    fi
    
    echo "Total Baselines: $baseline_count"
    echo "Total Screenshots: $screenshot_count"
    echo ""
    
    # Show categorized counts
    echo -e "${CYAN}Coverage by Category:${NC}"
    echo "• Initial States: $(ls -1 "$BASELINE_DIR"/*initial* 2>/dev/null | wc -l)"
    echo "• Components: $(ls -1 "$BASELINE_DIR"/*component* 2>/dev/null | wc -l)"
    echo "• Responsive: $(ls -1 "$BASELINE_DIR"/*mobile* "$BASELINE_DIR"/*tablet* 2>/dev/null | wc -l)"
    echo "• Interactive: $(ls -1 "$BASELINE_DIR"/*hover* "$BASELINE_DIR"/*focus* 2>/dev/null | wc -l)"
    echo "• Error States: $(ls -1 "$BASELINE_DIR"/*error* 2>/dev/null | wc -l)"
    echo "• Loading States: $(ls -1 "$BASELINE_DIR"/*loading* 2>/dev/null | wc -l)"
    echo ""
    
    echo -e "${CYAN}Coverage by Browser:${NC}"
    echo "• Chromium: $(ls -1 "$BASELINE_DIR"/*chromium* 2>/dev/null | wc -l)"
    echo "• Firefox: $(ls -1 "$BASELINE_DIR"/*firefox* 2>/dev/null | wc -l)"
    echo "• WebKit: $(ls -1 "$BASELINE_DIR"/*webkit* 2>/dev/null | wc -l)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Open HTML report if requested
    if [ "$SHOW_REPORT" = true ] && [ -d "$REPORT_DIR" ]; then
        npx playwright show-report "$REPORT_DIR"
    fi
}

# Function to show status
show_status() {
    print_header
    echo -e "${CYAN}📋 Hub Visual Test Status${NC}"
    echo ""
    
    # Check baselines
    if [ -d "$BASELINE_DIR" ] && [ "$(ls -A $BASELINE_DIR 2>/dev/null)" ]; then
        local baseline_count=$(ls -1 "$BASELINE_DIR"/*.png 2>/dev/null | wc -l)
        echo -e "${GREEN}✓ Baselines:${NC} $baseline_count files"
        
        # Show age of baselines
        local oldest=$(find "$BASELINE_DIR" -name "*.png" -type f -printf '%T+ %p\n' | sort | head -n 1 | cut -d' ' -f1)
        local newest=$(find "$BASELINE_DIR" -name "*.png" -type f -printf '%T+ %p\n' | sort | tail -n 1 | cut -d' ' -f1)
        echo "  Oldest: $oldest"
        echo "  Newest: $newest"
    else
        echo -e "${RED}✗ Baselines:${NC} Not found"
    fi
    
    echo ""
    
    # Check screenshots
    if [ -d "$SCREENSHOT_DIR" ] && [ "$(ls -A $SCREENSHOT_DIR 2>/dev/null)" ]; then
        local screenshot_count=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l)
        echo -e "${GREEN}✓ Screenshots:${NC} $screenshot_count files"
    else
        echo -e "${YELLOW}○ Screenshots:${NC} None captured"
    fi
    
    echo ""
    
    # Check for differences
    if [ -d "$DIFF_DIR" ] && [ "$(ls -A $DIFF_DIR 2>/dev/null)" ]; then
        local diff_count=$(ls -1 "$DIFF_DIR"/*.png 2>/dev/null | wc -l)
        echo -e "${YELLOW}⚠ Differences:${NC} $diff_count files"
    else
        echo -e "${GREEN}✓ Differences:${NC} None detected"
    fi
    
    echo ""
    
    # Test file status
    if [ -f "$HUB_TEST_FILE" ]; then
        echo -e "${GREEN}✓ Test File:${NC} $HUB_TEST_FILE"
        local test_count=$(grep -c "^test(" "$HUB_TEST_FILE" || echo "0")
        echo "  Tests: $test_count"
    else
        echo -e "${RED}✗ Test File:${NC} Not found"
    fi
}

# Function to clean artifacts
clean_artifacts() {
    print_header
    echo -e "${BLUE}🧹 Cleaning Hub visual test artifacts...${NC}"
    echo ""
    
    read -p "This will remove Hub screenshots and diffs. Keep baselines? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Keep baselines, clean others
        rm -rf "$SCREENSHOT_DIR" "$DIFF_DIR"
        echo -e "${GREEN}✅ Cleaned Hub artifacts (baselines preserved)${NC}"
    else
        # Clean everything
        read -p "Are you sure you want to delete ALL Hub visual test data? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$BASELINE_DIR" "$SCREENSHOT_DIR" "$DIFF_DIR"
            echo -e "${GREEN}✅ Cleaned all Hub visual test artifacts${NC}"
        else
            echo -e "${YELLOW}Cancelled${NC}"
        fi
    fi
}

# Function to list baselines
list_baselines() {
    print_header
    echo -e "${CYAN}📋 Hub Visual Baselines:${NC}"
    echo ""
    
    if [ -d "$BASELINE_DIR" ] && [ "$(ls -A $BASELINE_DIR 2>/dev/null)" ]; then
        # Group by category
        echo -e "${MAGENTA}Initial States:${NC}"
        ls -la "$BASELINE_DIR"/*initial* 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes)"}' || echo "  None"
        
        echo -e "\n${MAGENTA}Components:${NC}"
        ls -la "$BASELINE_DIR"/*component* 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes)"}' || echo "  None"
        
        echo -e "\n${MAGENTA}Responsive Views:${NC}"
        ls -la "$BASELINE_DIR"/*mobile* "$BASELINE_DIR"/*tablet* 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes)"}' || echo "  None"
        
        echo -e "\n${MAGENTA}Interactive States:${NC}"
        ls -la "$BASELINE_DIR"/*hover* "$BASELINE_DIR"/*focus* 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes)"}' || echo "  None"
        
        echo -e "\n${MAGENTA}Other States:${NC}"
        ls -la "$BASELINE_DIR"/*error* "$BASELINE_DIR"/*loading* "$BASELINE_DIR"/*empty* 2>/dev/null | awk '{print "  " $9 " (" $5 " bytes)"}' || echo "  None"
    else
        echo "No baselines found"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Show summary
    if [ -d "$BASELINE_DIR" ]; then
        local total_size=$(du -sh "$BASELINE_DIR" 2>/dev/null | cut -f1)
        local total_files=$(ls -1 "$BASELINE_DIR"/*.png 2>/dev/null | wc -l)
        echo "Total: $total_files files ($total_size)"
    fi
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    usage
    exit 0
fi

ACTION=$1
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -a|--all)
            UPDATE_ALL=true
            shift
            ;;
        -f|--filter)
            FILTER="$2"
            shift 2
            ;;
        -r|--report)
            SHOW_REPORT=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check prerequisites
check_prerequisites

# Execute action
case $ACTION in
    capture)
        capture_screenshots
        if [ "$SHOW_REPORT" = true ]; then
            generate_report
        fi
        ;;
    compare)
        compare_screenshots
        if [ "$SHOW_REPORT" = true ]; then
            generate_report
        fi
        ;;
    update)
        update_baselines
        generate_report
        ;;
    report)
        generate_report
        SHOW_REPORT=true
        ;;
    status)
        show_status
        ;;
    clean)
        clean_artifacts
        ;;
    list)
        list_baselines
        ;;
    *)
        echo -e "${RED}Unknown action: $ACTION${NC}"
        usage
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✨ Done!${NC}"