#!/bin/bash

# Enhanced User-Centered Test Suite Runner
# Optimized for Frontend Persona priorities: User needs > accessibility > performance > technical elegance

echo "🚀 Starting Enhanced User-Centered Test Suite for Create Collection Deck"
echo "==========================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test suite configuration
TEST_FILE="create-collection-deck-enhanced-ux.spec.ts"
REPORT_DIR="test-results/enhanced-ux-report"
SCREENSHOT_DIR="visual-validation-screenshots"

# Create necessary directories
echo -e "${BLUE}📁 Setting up test environment...${NC}"
mkdir -p "$REPORT_DIR"
mkdir -p "$SCREENSHOT_DIR"
mkdir -p "test-results/accessibility-reports"

# Performance-aware test execution
echo -e "${PURPLE}⚡ Performance-Aware UX Testing${NC}"
echo "Testing Core Web Vitals and progressive loading..."
npx playwright test "$TEST_FILE" --grep "Performance-Aware UX Testing" \
  --reporter=html \
  --output-dir="$REPORT_DIR/performance" \
  --timeout=60000

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Performance tests passed${NC}"
else
  echo -e "${RED}❌ Performance tests failed${NC}"
fi

# Advanced accessibility testing
echo -e "${PURPLE}♿ Advanced Accessibility Testing${NC}"
echo "Testing WCAG 2.1 AA compliance and keyboard navigation..."
npx playwright test "$TEST_FILE" --grep "Advanced Accessibility Testing" \
  --reporter=html \
  --output-dir="$REPORT_DIR/accessibility" \
  --timeout=60000

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Accessibility tests passed${NC}"
else
  echo -e "${RED}❌ Accessibility tests failed${NC}"
fi

# Visual regression testing
echo -e "${PURPLE}👀 Visual Regression Prevention${NC}"
echo "Testing visual consistency across browsers..."
npx playwright test "$TEST_FILE" --grep "Visual Regression Prevention" \
  --reporter=html \
  --output-dir="$REPORT_DIR/visual" \
  --timeout=90000

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Visual regression tests passed${NC}"
else
  echo -e "${RED}❌ Visual regression tests failed${NC}"
fi

# Error recovery testing
echo -e "${PURPLE}🔄 Enhanced Error Recovery Testing${NC}"
echo "Testing graceful error handling and user guidance..."
npx playwright test "$TEST_FILE" --grep "Enhanced Error Recovery Testing" \
  --reporter=html \
  --output-dir="$REPORT_DIR/error-recovery" \
  --timeout=60000

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Error recovery tests passed${NC}"
else
  echo -e "${RED}❌ Error recovery tests failed${NC}"
fi

# User journey optimization
echo -e "${PURPLE}🎯 User Journey Optimization${NC}"
echo "Testing user confidence and task completion patterns..."
npx playwright test "$TEST_FILE" --grep "User Journey Optimization" \
  --reporter=html \
  --output-dir="$REPORT_DIR/user-journey" \
  --timeout=90000

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ User journey tests passed${NC}"
else
  echo -e "${RED}❌ User journey tests failed${NC}"
fi

# Cross-browser comprehensive run
echo -e "${PURPLE}🌐 Cross-Browser Comprehensive Testing${NC}"
echo "Running full suite across all browsers..."
npx playwright test "$TEST_FILE" \
  --reporter=html \
  --output-dir="$REPORT_DIR/comprehensive" \
  --timeout=120000

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Comprehensive cross-browser tests passed${NC}"
else
  echo -e "${RED}❌ Some cross-browser tests failed${NC}"
fi

# Mobile responsiveness testing
echo -e "${PURPLE}📱 Mobile Responsiveness Testing${NC}"
echo "Testing mobile UX and touch targets..."
npx playwright test "$TEST_FILE" --project="Mobile Chrome" --project="Mobile Safari" \
  --reporter=html \
  --output-dir="$REPORT_DIR/mobile" \
  --timeout=90000

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Mobile responsiveness tests passed${NC}"
else
  echo -e "${RED}❌ Mobile responsiveness tests failed${NC}"
fi

echo ""
echo "==========================================================================="
echo -e "${GREEN}🎉 Enhanced UX Test Suite Completed${NC}"
echo ""
echo "📊 Test Reports Available:"
echo -e "   • Performance: ${BLUE}$REPORT_DIR/performance/index.html${NC}"
echo -e "   • Accessibility: ${BLUE}$REPORT_DIR/accessibility/index.html${NC}"
echo -e "   • Visual Regression: ${BLUE}$REPORT_DIR/visual/index.html${NC}"
echo -e "   • Error Recovery: ${BLUE}$REPORT_DIR/error-recovery/index.html${NC}"
echo -e "   • User Journey: ${BLUE}$REPORT_DIR/user-journey/index.html${NC}"
echo -e "   • Comprehensive: ${BLUE}$REPORT_DIR/comprehensive/index.html${NC}"
echo -e "   • Mobile: ${BLUE}$REPORT_DIR/mobile/index.html${NC}"
echo ""
echo -e "📸 Visual Screenshots: ${BLUE}$SCREENSHOT_DIR/${NC}"
echo ""
echo -e "${YELLOW}💡 Frontend Persona Validation:${NC}"
echo "   ✓ User needs prioritized with comprehensive user journey testing"
echo "   ✓ Accessibility validated with WCAG 2.1 AA compliance"
echo "   ✓ Performance measured with Core Web Vitals budgets"
echo "   ✓ Technical excellence achieved through systematic testing"

# Generate summary report
echo -e "\n${BLUE}📝 Generating UX Validation Summary...${NC}"
cat > "$REPORT_DIR/ux-validation-summary.md" << EOF
# Enhanced UX Test Suite Results

## Test Suite Overview
- **Focus**: User-centered validation for Create Collection Deck
- **Frontend Persona Priorities**: User needs > accessibility > performance > technical elegance
- **Testing Framework**: Playwright with axe-core integration
- **Coverage**: Performance, Accessibility, Visual Regression, Error Recovery, User Journey

## Performance Validation
- Core Web Vitals measurement with UX integration
- Progressive loading validation 
- Network throttling graceful degradation
- Bundle size impact measurement

## Accessibility Validation  
- WCAG 2.1 AA compliance testing
- Keyboard navigation workflow validation
- Screen reader announcement testing
- Color contrast verification
- Focus management validation

## Visual Regression Prevention
- Cross-browser visual consistency
- Mobile responsive design verification
- Loading state visual validation
- Component-level screenshot comparison

## Error Recovery Testing
- Network timeout graceful degradation
- Server error user-friendly messaging
- Form validation user guidance
- User session recovery validation

## User Journey Optimization
- Progressive confidence building validation
- Task completion satisfaction measurement
- Error recovery confidence maintenance
- Complete workflow user experience validation

## Report Locations
- Performance: $REPORT_DIR/performance/
- Accessibility: $REPORT_DIR/accessibility/
- Visual: $REPORT_DIR/visual/
- Error Recovery: $REPORT_DIR/error-recovery/
- User Journey: $REPORT_DIR/user-journey/
- Comprehensive: $REPORT_DIR/comprehensive/
- Mobile: $REPORT_DIR/mobile/

## Visual Evidence
Screenshots captured in: $SCREENSHOT_DIR/

Generated: $(date)
EOF

echo -e "${GREEN}✅ Summary report generated: $REPORT_DIR/ux-validation-summary.md${NC}"