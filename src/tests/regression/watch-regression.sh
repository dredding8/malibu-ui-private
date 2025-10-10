#!/bin/bash

###############################################################################
# Continuous Regression Testing Watch Script
#
# Purpose: Monitor code changes and automatically run regression tests
# Usage:
#   ./watch-regression.sh              # Watch all files
#   ./watch-regression.sh --quick      # Run quick regression suite only
#   ./watch-regression.sh --visual     # Include visual regression
#   ./watch-regression.sh --perf       # Include performance regression
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
QUICK_MODE=false
VISUAL_TESTS=true
PERF_TESTS=true
WATCH_DIRS="src/components/Collection src/components/CollectionOpportunities"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      QUICK_MODE=true
      shift
      ;;
    --no-visual)
      VISUAL_TESTS=false
      shift
      ;;
    --no-perf)
      PERF_TESTS=false
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --quick      Run quick regression tests only"
      echo "  --no-visual  Skip visual regression tests"
      echo "  --no-perf    Skip performance regression tests"
      echo "  --help       Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Header
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      Continuous Regression Testing - Watch Mode       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Quick Mode: ${QUICK_MODE}"
echo -e "  Visual Tests: ${VISUAL_TESTS}"
echo -e "  Performance Tests: ${PERF_TESTS}"
echo -e "  Watching: ${WATCH_DIRS}"
echo ""

# Build test command
TEST_CMD="playwright test --config=playwright.regression.config.ts"

if [ "$QUICK_MODE" = true ]; then
  TEST_CMD="$TEST_CMD --grep 'Functional Regression'"
else
  if [ "$VISUAL_TESTS" = false ]; then
    TEST_CMD="$TEST_CMD --grep-invert 'Visual Regression'"
  fi
  if [ "$PERF_TESTS" = false ]; then
    TEST_CMD="$TEST_CMD --grep-invert 'Performance Regression'"
  fi
fi

# Initial test run
echo -e "${GREEN}🚀 Running initial regression tests...${NC}"
eval $TEST_CMD || true

# Watch for changes
echo ""
echo -e "${BLUE}👁️  Watching for changes in: ${WATCH_DIRS}${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Use fswatch if available, otherwise fall back to Playwright watch mode
if command -v fswatch &> /dev/null; then
  fswatch -o $WATCH_DIRS | while read num; do
    echo ""
    echo -e "${GREEN}🔄 Change detected - Running regression tests...${NC}"
    echo -e "${YELLOW}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    eval $TEST_CMD || true
    echo ""
    echo -e "${BLUE}👁️  Watching for more changes...${NC}"
  done
else
  # Fallback to Playwright UI mode for interactive watch
  echo -e "${YELLOW}Note: fswatch not found. Using Playwright UI mode instead.${NC}"
  echo -e "${YELLOW}Install fswatch for automatic re-runs: brew install fswatch${NC}"
  echo ""
  playwright test --config=playwright.regression.config.ts --ui
fi
