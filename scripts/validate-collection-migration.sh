#!/bin/bash

# Collection Migration Validation Script
# 
# Comprehensive validation script for Wave 4 testing.
# Runs all test suites, generates reports, and validates
# migration readiness with performance and bundle analysis.
# 
# @version 2.0.0
# @date 2025-09-30
# @wave Wave 4 - Validation & Testing

set -e  # Exit on any error

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VALIDATION_REPORT="$RESULTS_DIR/validation-report-$TIMESTAMP.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
RUN_MIGRATION_TESTS=true
RUN_INTEGRATION_TESTS=true
RUN_PERFORMANCE_TESTS=true
RUN_VISUAL_TESTS=true
RUN_E2E_TESTS=true
RUN_BUNDLE_ANALYSIS=true
GENERATE_COVERAGE_REPORT=true

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo
    echo "═══════════════════════════════════════════════════════════════"
    echo "  $1"
    echo "═══════════════════════════════════════════════════════════════"
    echo
}

print_separator() {
    echo
    echo "---------------------------------------------------------------"
    echo
}

create_results_dir() {
    if [ ! -d "$RESULTS_DIR" ]; then
        mkdir -p "$RESULTS_DIR"
        log_info "Created results directory: $RESULTS_DIR"
    fi
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        log_warning "node_modules not found, running npm install..."
        cd "$PROJECT_ROOT"
        npm install
    fi
    
    log_success "Dependencies check passed"
}

check_build() {
    log_info "Checking build artifacts..."
    
    if [ ! -d "$PROJECT_ROOT/build" ]; then
        log_warning "Build directory not found, running build..."
        cd "$PROJECT_ROOT"
        npm run build
    fi
    
    log_success "Build artifacts verified"
}

# =============================================================================
# Test Execution Functions
# =============================================================================

run_migration_tests() {
    if [ "$RUN_MIGRATION_TESTS" = true ]; then
        print_header "Running Migration Tests"
        
        cd "$PROJECT_ROOT"
        
        log_info "Executing migration test suite..."
        if npm run test:migration > "$RESULTS_DIR/migration-tests.log" 2>&1; then
            log_success "Migration tests passed"
            MIGRATION_TESTS_PASSED=true
        else
            log_error "Migration tests failed"
            cat "$RESULTS_DIR/migration-tests.log"
            MIGRATION_TESTS_PASSED=false
        fi
        
        print_separator
    fi
}

run_integration_tests() {
    if [ "$RUN_INTEGRATION_TESTS" = true ]; then
        print_header "Running Integration Tests"
        
        cd "$PROJECT_ROOT"
        
        log_info "Executing integration test suite..."
        if npm run test:integration > "$RESULTS_DIR/integration-tests.log" 2>&1; then
            log_success "Integration tests passed"
            INTEGRATION_TESTS_PASSED=true
        else
            log_error "Integration tests failed"
            cat "$RESULTS_DIR/integration-tests.log"
            INTEGRATION_TESTS_PASSED=false
        fi
        
        print_separator
    fi
}

run_performance_tests() {
    if [ "$RUN_PERFORMANCE_TESTS" = true ]; then
        print_header "Running Performance Tests"
        
        cd "$PROJECT_ROOT"
        
        log_info "Executing performance test suite..."
        if npm run test:performance > "$RESULTS_DIR/performance-tests.log" 2>&1; then
            log_success "Performance tests passed"
            PERFORMANCE_TESTS_PASSED=true
        else
            log_error "Performance tests failed"
            cat "$RESULTS_DIR/performance-tests.log"
            PERFORMANCE_TESTS_PASSED=false
        fi
        
        print_separator
    fi
}

run_visual_tests() {
    if [ "$RUN_VISUAL_TESTS" = true ]; then
        print_header "Running Visual Tests"
        
        cd "$PROJECT_ROOT"
        
        log_info "Executing visual test suite..."
        if npm run test:visual > "$RESULTS_DIR/visual-tests.log" 2>&1; then
            log_success "Visual tests passed"
            VISUAL_TESTS_PASSED=true
        else
            log_error "Visual tests failed"
            cat "$RESULTS_DIR/visual-tests.log"
            VISUAL_TESTS_PASSED=false
        fi
        
        print_separator
    fi
}

run_e2e_tests() {
    if [ "$RUN_E2E_TESTS" = true ]; then
        print_header "Running E2E Tests"
        
        cd "$PROJECT_ROOT"
        
        log_info "Starting development server for E2E tests..."
        npm start > "$RESULTS_DIR/dev-server.log" 2>&1 &
        DEV_SERVER_PID=$!
        
        # Wait for server to start
        log_info "Waiting for development server to start..."
        sleep 10
        
        # Check if server is running
        if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
            log_error "Development server failed to start"
            kill $DEV_SERVER_PID 2>/dev/null || true
            E2E_TESTS_PASSED=false
            return
        fi
        
        log_info "Executing E2E test suite..."
        if npm run test:e2e:collection > "$RESULTS_DIR/e2e-tests.log" 2>&1; then
            log_success "E2E tests passed"
            E2E_TESTS_PASSED=true
        else
            log_error "E2E tests failed"
            cat "$RESULTS_DIR/e2e-tests.log"
            E2E_TESTS_PASSED=false
        fi
        
        # Stop development server
        log_info "Stopping development server..."
        kill $DEV_SERVER_PID 2>/dev/null || true
        
        print_separator
    fi
}

run_bundle_analysis() {
    if [ "$RUN_BUNDLE_ANALYSIS" = true ]; then
        print_header "Running Bundle Analysis"
        
        cd "$PROJECT_ROOT"
        
        log_info "Analyzing bundle size and optimizations..."
        if npm run analyze:bundle > "$RESULTS_DIR/bundle-analysis.log" 2>&1; then
            log_success "Bundle analysis completed"
            BUNDLE_ANALYSIS_PASSED=true
        else
            log_error "Bundle analysis failed"
            cat "$RESULTS_DIR/bundle-analysis.log"
            BUNDLE_ANALYSIS_PASSED=false
        fi
        
        print_separator
    fi
}

generate_coverage_report() {
    if [ "$GENERATE_COVERAGE_REPORT" = true ]; then
        print_header "Generating Coverage Report"
        
        cd "$PROJECT_ROOT"
        
        log_info "Generating comprehensive coverage report..."
        if npm run test:coverage:collection > "$RESULTS_DIR/coverage-generation.log" 2>&1; then
            log_success "Coverage report generated"
            COVERAGE_REPORT_GENERATED=true
        else
            log_error "Coverage report generation failed"
            cat "$RESULTS_DIR/coverage-generation.log"
            COVERAGE_REPORT_GENERATED=false
        fi
        
        print_separator
    fi
}

# =============================================================================
# Report Generation
# =============================================================================

generate_validation_report() {
    print_header "Generating Validation Report"
    
    cat > "$VALIDATION_REPORT" << EOF
# Collection Migration Validation Report

**Generated:** $(date)  
**Validation ID:** $TIMESTAMP  
**Project:** Collection Management System  
**Wave:** Wave 4 - Validation & Testing

## Executive Summary

This report summarizes the comprehensive validation of the collection management migration from legacy components to the new compound component architecture.

## Test Suite Results

### Migration Tests
- **Status:** $([ "$MIGRATION_TESTS_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Purpose:** Validate feature flag system, data compatibility, and error handling
- **Log:** \`test-results/migration-tests.log\`

### Integration Tests
- **Status:** $([ "$INTEGRATION_TESTS_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Purpose:** Test complete user workflows and component integration
- **Log:** \`test-results/integration-tests.log\`

### Performance Tests
- **Status:** $([ "$PERFORMANCE_TESTS_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Purpose:** Validate performance improvements and prevent regression
- **Log:** \`test-results/performance-tests.log\`

### Visual Tests
- **Status:** $([ "$VISUAL_TESTS_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Purpose:** Ensure UI consistency across themes and viewports
- **Log:** \`test-results/visual-tests.log\`

### E2E Tests
- **Status:** $([ "$E2E_TESTS_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Purpose:** Test complete user journeys in realistic environments
- **Log:** \`test-results/e2e-tests.log\`

### Bundle Analysis
- **Status:** $([ "$BUNDLE_ANALYSIS_PASSED" = true ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Purpose:** Validate bundle optimization and size constraints
- **Log:** \`test-results/bundle-analysis.log\`
- **Report:** \`test-results/bundle-analysis/bundle-analysis.html\`

### Coverage Report
- **Status:** $([ "$COVERAGE_REPORT_GENERATED" = true ] && echo "✅ GENERATED" || echo "❌ FAILED")
- **Purpose:** Comprehensive test coverage analysis
- **Report:** \`test-results/coverage/collection/index.html\`

## Overall Validation Status

EOF

    # Calculate overall status
    TOTAL_TESTS=0
    PASSED_TESTS=0
    
    if [ "$RUN_MIGRATION_TESTS" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        [ "$MIGRATION_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    if [ "$RUN_INTEGRATION_TESTS" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        [ "$INTEGRATION_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    if [ "$RUN_PERFORMANCE_TESTS" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        [ "$PERFORMANCE_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    if [ "$RUN_VISUAL_TESTS" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        [ "$VISUAL_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    if [ "$RUN_E2E_TESTS" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        [ "$E2E_TESTS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    if [ "$RUN_BUNDLE_ANALYSIS" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        [ "$BUNDLE_ANALYSIS_PASSED" = true ] && PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    
    cat >> "$VALIDATION_REPORT" << EOF
**Test Suites Passed:** $PASSED_TESTS / $TOTAL_TESTS  
**Pass Rate:** $PASS_RATE%  
**Overall Status:** $([ $PASS_RATE -eq 100 ] && echo "✅ VALIDATION SUCCESSFUL" || echo "❌ VALIDATION FAILED")

## Migration Readiness Assessment

EOF

    if [ $PASS_RATE -eq 100 ]; then
        cat >> "$VALIDATION_REPORT" << EOF
### ✅ READY FOR MIGRATION

All validation tests have passed successfully. The migration to compound components can proceed with confidence.

**Recommendations:**
- Deploy using feature flag gradual rollout (start with 10%)
- Monitor performance metrics during rollout
- Keep rollback capability ready for first 48 hours
- Track user feedback and error rates

EOF
    else
        cat >> "$VALIDATION_REPORT" << EOF
### ❌ NOT READY FOR MIGRATION

Some validation tests have failed. Review and fix issues before proceeding with migration.

**Action Required:**
- Review failed test logs
- Fix identified issues
- Re-run validation
- Ensure 100% pass rate before migration

EOF
    fi
    
    cat >> "$VALIDATION_REPORT" << EOF
## Additional Resources

- **Full Test Coverage Report:** \`test-results/coverage/collection/index.html\`
- **Bundle Analysis Report:** \`test-results/bundle-analysis/bundle-analysis.html\`
- **Test Logs Directory:** \`test-results/\`
- **Visual Test Screenshots:** \`test-results/visual-screenshots/\`

## Next Steps

1. Review all test results and reports
2. Address any failing tests or performance issues
3. Update documentation with validation results
4. Plan migration rollout strategy
5. Set up production monitoring and alerting

---

*This report was generated automatically by the Collection Migration Validation Script.*
EOF

    log_success "Validation report generated: $VALIDATION_REPORT"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    print_header "Collection Migration Validation"
    
    log_info "Starting comprehensive validation for Wave 4 testing..."
    log_info "Timestamp: $TIMESTAMP"
    
    # Initialize result variables
    MIGRATION_TESTS_PASSED=false
    INTEGRATION_TESTS_PASSED=false
    PERFORMANCE_TESTS_PASSED=false
    VISUAL_TESTS_PASSED=false
    E2E_TESTS_PASSED=false
    BUNDLE_ANALYSIS_PASSED=false
    COVERAGE_REPORT_GENERATED=false
    
    # Setup
    create_results_dir
    check_dependencies
    check_build
    
    # Run test suites
    run_migration_tests
    run_integration_tests
    run_performance_tests
    run_visual_tests
    run_e2e_tests
    run_bundle_analysis
    generate_coverage_report
    
    # Generate final report
    generate_validation_report
    
    print_header "Validation Complete"
    
    # Summary
    echo "Results Summary:"
    [ "$MIGRATION_TESTS_PASSED" = true ] && echo "  ✅ Migration Tests" || echo "  ❌ Migration Tests"
    [ "$INTEGRATION_TESTS_PASSED" = true ] && echo "  ✅ Integration Tests" || echo "  ❌ Integration Tests"
    [ "$PERFORMANCE_TESTS_PASSED" = true ] && echo "  ✅ Performance Tests" || echo "  ❌ Performance Tests"
    [ "$VISUAL_TESTS_PASSED" = true ] && echo "  ✅ Visual Tests" || echo "  ❌ Visual Tests"
    [ "$E2E_TESTS_PASSED" = true ] && echo "  ✅ E2E Tests" || echo "  ❌ E2E Tests"
    [ "$BUNDLE_ANALYSIS_PASSED" = true ] && echo "  ✅ Bundle Analysis" || echo "  ❌ Bundle Analysis"
    [ "$COVERAGE_REPORT_GENERATED" = true ] && echo "  ✅ Coverage Report" || echo "  ❌ Coverage Report"
    
    echo
    log_info "Full validation report: $VALIDATION_REPORT"
    
    # Exit with appropriate code
    if [ "$MIGRATION_TESTS_PASSED" = true ] && 
       [ "$INTEGRATION_TESTS_PASSED" = true ] && 
       [ "$PERFORMANCE_TESTS_PASSED" = true ] && 
       [ "$VISUAL_TESTS_PASSED" = true ] && 
       [ "$E2E_TESTS_PASSED" = true ] && 
       [ "$BUNDLE_ANALYSIS_PASSED" = true ]; then
        log_success "All validations passed! Migration is ready."
        exit 0
    else
        log_error "Some validations failed. Review results before proceeding."
        exit 1
    fi
}

# =============================================================================
# CLI Interface
# =============================================================================

show_help() {
    cat << EOF
Collection Migration Validation Script

Usage: $0 [OPTIONS]

OPTIONS:
    --no-migration          Skip migration tests
    --no-integration        Skip integration tests
    --no-performance        Skip performance tests
    --no-visual             Skip visual tests
    --no-e2e                Skip E2E tests
    --no-bundle             Skip bundle analysis
    --no-coverage           Skip coverage report generation
    --help, -h              Show this help message

EXAMPLES:
    $0                                  # Run all validations
    $0 --no-e2e                        # Skip E2E tests
    $0 --no-visual --no-e2e            # Skip visual and E2E tests

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-migration)
            RUN_MIGRATION_TESTS=false
            shift
            ;;
        --no-integration)
            RUN_INTEGRATION_TESTS=false
            shift
            ;;
        --no-performance)
            RUN_PERFORMANCE_TESTS=false
            shift
            ;;
        --no-visual)
            RUN_VISUAL_TESTS=false
            shift
            ;;
        --no-e2e)
            RUN_E2E_TESTS=false
            shift
            ;;
        --no-bundle)
            RUN_BUNDLE_ANALYSIS=false
            shift
            ;;
        --no-coverage)
            GENERATE_COVERAGE_REPORT=false
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main