#!/bin/bash

# Visual Baseline Management Script
# Manage visual regression baselines for Playwright tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directories
BASELINE_DIR="test-results/visual-baselines"
SCREENSHOT_DIR="test-results/visual-screenshots"
DIFF_DIR="test-results/visual-diffs"
REPORT_DIR="test-results/visual-report"

# Default values
ACTION=""
BROWSER="chromium"
UPDATE_ALL=false
SHOW_REPORT=false

# Function to display usage
usage() {
    echo -e "${CYAN}Visual Baseline Management Tool${NC}"
    echo ""
    echo "Usage: $0 [action] [options]"
    echo ""
    echo "Actions:"
    echo "  capture     Capture new screenshots"
    echo "  compare     Compare screenshots with baselines"
    echo "  update      Update baselines with current screenshots"
    echo "  report      Generate visual test report"
    echo "  clean       Clean all visual test artifacts"
    echo "  list        List all baselines"
    echo ""
    echo "Options:"
    echo "  -b, --browser <name>    Browser to use (default: chromium)"
    echo "  -a, --all               Run on all browsers"
    echo "  -r, --report            Show report after action"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 capture              # Capture screenshots on Chrome"
    echo "  $0 compare -a           # Compare on all browsers"
    echo "  $0 update --all         # Update all baselines"
    echo "  $0 report               # Generate comparison report"
    echo ""
}

# Function to capture screenshots
capture_screenshots() {
    echo -e "${BLUE}📸 Capturing visual screenshots...${NC}"
    
    if [ "$UPDATE_ALL" = true ]; then
        npx playwright test visual-baseline.spec.ts --config=playwright.visual.config.ts
    else
        npx playwright test visual-baseline.spec.ts --config=playwright.visual.config.ts --project="$BROWSER"
    fi
    
    echo -e "${GREEN}✅ Screenshots captured${NC}"
}

# Function to compare with baselines
compare_screenshots() {
    echo -e "${BLUE}🔍 Comparing screenshots with baselines...${NC}"
    
    if [ "$UPDATE_ALL" = true ]; then
        npx playwright test visual-baseline.spec.ts --config=playwright.visual.config.ts --grep "Full Page|Main View"
    else
        npx playwright test visual-baseline.spec.ts --config=playwright.visual.config.ts --project="$BROWSER" --grep "Full Page|Main View"
    fi
    
    # Check for differences
    if [ -d "$DIFF_DIR" ] && [ "$(ls -A $DIFF_DIR 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠️  Visual differences detected${NC}"
        echo -e "View diffs in: $DIFF_DIR"
    else
        echo -e "${GREEN}✅ No visual regressions detected${NC}"
    fi
}

# Function to update baselines
update_baselines() {
    echo -e "${BLUE}🔄 Updating visual baselines...${NC}"
    
    # Create baseline directory if it doesn't exist
    mkdir -p "$BASELINE_DIR"
    
    if [ "$UPDATE_ALL" = true ]; then
        # Update all baselines
        echo "Updating all baselines..."
        UPDATE_BASELINES=true npx playwright test visual-baseline.spec.ts --config=playwright.visual.config.ts --grep "Update All Baselines"
        
        # Also copy from screenshots directory
        if [ -d "$SCREENSHOT_DIR" ]; then
            cp -r "$SCREENSHOT_DIR"/*.png "$BASELINE_DIR/" 2>/dev/null || true
            echo -e "${GREEN}✅ All baselines updated${NC}"
        fi
    else
        # Update specific browser baselines
        if [ -d "$SCREENSHOT_DIR" ]; then
            cp "$SCREENSHOT_DIR"/*-"$BROWSER".png "$BASELINE_DIR/" 2>/dev/null || true
            echo -e "${GREEN}✅ Updated baselines for $BROWSER${NC}"
        else
            echo -e "${RED}❌ No screenshots found to update${NC}"
        fi
    fi
}

# Function to generate report
generate_report() {
    echo -e "${BLUE}📊 Generating visual test report...${NC}"
    
    # Run report generation test
    npx playwright test visual-baseline.spec.ts --config=playwright.visual.config.ts --grep "Generate Baseline Report" --project=chromium
    
    # Generate HTML report
    if [ -f "test-results/visual-results.json" ]; then
        echo -e "${CYAN}Visual Test Summary:${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Count files
        if [ -d "$BASELINE_DIR" ]; then
            baseline_count=$(ls -1 "$BASELINE_DIR"/*.png 2>/dev/null | wc -l)
        else
            baseline_count=0
        fi
        
        if [ -d "$SCREENSHOT_DIR" ]; then
            screenshot_count=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l)
        else
            screenshot_count=0
        fi
        
        echo "Baselines: $baseline_count"
        echo "Screenshots: $screenshot_count"
        echo ""
        
        # Show categorized counts
        echo -e "${CYAN}Coverage by Area:${NC}"
        echo "• Dashboard: $(ls -1 "$BASELINE_DIR"/*dashboard* 2>/dev/null | wc -l)"
        echo "• Opportunities: $(ls -1 "$BASELINE_DIR"/*opportunities* 2>/dev/null | wc -l)"
        echo "• Components: $(ls -1 "$BASELINE_DIR"/*component* 2>/dev/null | wc -l)"
        echo "• Responsive: $(ls -1 "$BASELINE_DIR"/*mobile* "$BASELINE_DIR"/*tablet* 2>/dev/null | wc -l)"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
    
    # Open HTML report if requested
    if [ "$SHOW_REPORT" = true ]; then
        npx playwright show-report "$REPORT_DIR"
    else
        echo -e "${BLUE}View detailed report: npx playwright show-report $REPORT_DIR${NC}"
    fi
}

# Function to clean artifacts
clean_artifacts() {
    echo -e "${BLUE}🧹 Cleaning visual test artifacts...${NC}"
    
    read -p "This will remove all screenshots and diffs. Keep baselines? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Keep baselines, clean others
        rm -rf "$SCREENSHOT_DIR" "$DIFF_DIR" "$REPORT_DIR"
        echo -e "${GREEN}✅ Cleaned artifacts (baselines preserved)${NC}"
    else
        # Clean everything
        rm -rf "$BASELINE_DIR" "$SCREENSHOT_DIR" "$DIFF_DIR" "$REPORT_DIR"
        echo -e "${GREEN}✅ Cleaned all visual test artifacts${NC}"
    fi
}

# Function to list baselines
list_baselines() {
    echo -e "${CYAN}📋 Visual Baselines:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -d "$BASELINE_DIR" ] && [ "$(ls -A $BASELINE_DIR 2>/dev/null)" ]; then
        ls -la "$BASELINE_DIR"/*.png | awk '{print $9, "(" $5 " bytes)"}' | column -t
    else
        echo "No baselines found"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Show summary
    if [ -d "$BASELINE_DIR" ]; then
        total_size=$(du -sh "$BASELINE_DIR" 2>/dev/null | cut -f1)
        total_files=$(ls -1 "$BASELINE_DIR"/*.png 2>/dev/null | wc -l)
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
        -r|--report)
            SHOW_REPORT=true
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
        capture_screenshots
        update_baselines
        generate_report
        ;;
    report)
        generate_report
        SHOW_REPORT=true
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

echo -e "${GREEN}✨ Done!${NC}"