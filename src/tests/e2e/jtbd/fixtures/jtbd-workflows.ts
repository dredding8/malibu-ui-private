import { JTBDWorkflow } from './jtbd-test.fixture';

// JTBD #1: Verify and Validate Collection Plans
export const VERIFY_VALIDATE_WORKFLOW: JTBDWorkflow = {
  id: 'jtbd-1-verify-validate',
  name: 'Verify and Validate Collection Plans',
  steps: [
    {
      action: 'navigate',
      element: '/opportunities',
      validation: '[data-testid="opportunities-table"]',
      timing: 1000,
    },
    {
      action: 'click',
      element: '[data-testid="view-selector"]',
      validation: '[data-testid="view-options"]',
    },
    {
      action: 'click',
      element: '[data-testid="validation-view"]',
      validation: '[data-testid="validation-panel"]',
    },
    {
      action: 'click',
      element: '[data-testid="opportunity-row"]:first-child',
      validation: '[data-testid="opportunity-details"]',
    },
    {
      action: 'click',
      element: '[data-testid="verify-passes-button"]',
      validation: '[data-testid="pass-validation-results"]',
    },
    {
      action: 'click',
      element: '[data-testid="validate-capacity-button"]',
      validation: '[data-testid="capacity-validation-status"]',
    },
    {
      action: 'click',
      element: '[data-testid="approve-plan-button"]',
      validation: '[data-testid="plan-approved-confirmation"]',
      timing: 2000,
    },
  ],
  expectedOutcome: 'Collection plan verified and approved',
  metrics: {
    maxDuration: 120000, // 2 minutes
    maxClicks: 10,
    errorTolerance: 0,
    performanceTarget: {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      ttfb: 600,
    },
  },
};

// JTBD #2: Override and Customize Allocations
export const OVERRIDE_CUSTOMIZE_WORKFLOW: JTBDWorkflow = {
  id: 'jtbd-2-override-customize',
  name: 'Override and Customize Allocations',
  steps: [
    {
      action: 'navigate',
      element: '/opportunities',
      validation: '[data-testid="opportunities-table"]',
      timing: 1000,
    },
    {
      action: 'click',
      element: '[data-testid="filter-suboptimal"]',
      validation: '[data-testid="filtered-results"]',
    },
    {
      action: 'click',
      element: '[data-testid="opportunity-row"][data-match-status="suboptimal"]:first-child',
      validation: '[data-testid="opportunity-details"]',
    },
    {
      action: 'click',
      element: '[data-testid="override-allocation-button"]',
      validation: '[data-testid="override-panel"]',
    },
    {
      action: 'click',
      element: '[data-testid="alternative-site-option"]:first-child',
      validation: '[data-testid="site-selected"]',
    },
    {
      action: 'fill',
      element: '[data-testid="override-justification"]',
      validation: 'Critical mission requirement - priority override needed',
    },
    {
      action: 'click',
      element: '[data-testid="calculate-impact-button"]',
      validation: '[data-testid="impact-analysis-results"]',
      timing: 1500,
    },
    {
      action: 'click',
      element: '[data-testid="confirm-override-button"]',
      validation: '[data-testid="override-success-message"]',
      timing: 2000,
    },
  ],
  expectedOutcome: 'Allocation successfully overridden with justification',
  metrics: {
    maxDuration: 180000, // 3 minutes
    maxClicks: 12,
    errorTolerance: 1,
    performanceTarget: {
      lcp: 3000,
      fid: 150,
      cls: 0.15,
      ttfb: 800,
    },
  },
};

// JTBD #3: Fix Data Integrity Issues
export const FIX_DATA_INTEGRITY_WORKFLOW: JTBDWorkflow = {
  id: 'jtbd-3-fix-data-integrity',
  name: 'Fix Data Integrity Issues',
  steps: [
    {
      action: 'navigate',
      element: '/opportunities',
      validation: '[data-testid="opportunities-table"]',
      timing: 1000,
    },
    {
      action: 'click',
      element: '[data-testid="data-integrity-indicator"]',
      validation: '[data-testid="integrity-issues-panel"]',
    },
    {
      action: 'click',
      element: '[data-testid="critical-issues-tab"]',
      validation: '[data-testid="critical-issues-list"]',
    },
    {
      action: 'click',
      element: '[data-testid="issue-item"][data-issue-type="NO_TLE"]:first-child',
      validation: '[data-testid="issue-details"]',
    },
    {
      action: 'click',
      element: '[data-testid="resolve-issue-button"]',
      validation: '[data-testid="resolution-options"]',
    },
    {
      action: 'click',
      element: '[data-testid="fetch-latest-tle-button"]',
      validation: '[data-testid="tle-fetch-progress"]',
      timing: 3000,
    },
    {
      action: 'click',
      element: '[data-testid="validate-fix-button"]',
      validation: '[data-testid="issue-resolved-confirmation"]',
    },
    {
      action: 'click',
      element: '[data-testid="apply-fix-button"]',
      validation: '[data-testid="fix-applied-success"]',
      timing: 2000,
    },
  ],
  expectedOutcome: 'Data integrity issue resolved and validated',
  metrics: {
    maxDuration: 300000, // 5 minutes
    maxClicks: 15,
    errorTolerance: 2,
    performanceTarget: {
      lcp: 3500,
      fid: 200,
      cls: 0.2,
      ttfb: 1000,
    },
  },
};

// JTBD #4: Analyze Performance Trends
export const ANALYZE_PERFORMANCE_WORKFLOW: JTBDWorkflow = {
  id: 'jtbd-4-analyze-performance',
  name: 'Analyze Performance Trends',
  steps: [
    {
      action: 'navigate',
      element: '/opportunities',
      validation: '[data-testid="opportunities-table"]',
      timing: 1000,
    },
    {
      action: 'click',
      element: '[data-testid="analytics-button"]',
      validation: '[data-testid="analytics-dashboard"]',
    },
    {
      action: 'click',
      element: '[data-testid="time-range-selector"]',
      validation: '[data-testid="time-range-options"]',
    },
    {
      action: 'click',
      element: '[data-testid="last-30-days"]',
      validation: '[data-testid="chart-updated"]',
      timing: 2000,
    },
    {
      action: 'click',
      element: '[data-testid="metrics-selector"]',
      validation: '[data-testid="metrics-dropdown"]',
    },
    {
      action: 'click',
      element: '[data-testid="capacity-utilization-metric"]',
      validation: '[data-testid="capacity-chart"]',
      timing: 1500,
    },
    {
      action: 'hover',
      element: '[data-testid="trend-line"]',
      validation: '[data-testid="trend-tooltip"]',
    },
    {
      action: 'click',
      element: '[data-testid="export-report-button"]',
      validation: '[data-testid="export-options"]',
    },
    {
      action: 'click',
      element: '[data-testid="export-pdf"]',
      validation: '[data-testid="export-success"]',
      timing: 3000,
    },
  ],
  expectedOutcome: 'Performance trends analyzed and report exported',
  metrics: {
    maxDuration: 240000, // 4 minutes
    maxClicks: 10,
    errorTolerance: 1,
    performanceTarget: {
      lcp: 4000,
      fid: 250,
      cls: 0.25,
      ttfb: 1200,
    },
  },
};

// JTBD #5: Bulk Operations Management
export const BULK_OPERATIONS_WORKFLOW: JTBDWorkflow = {
  id: 'jtbd-5-bulk-operations',
  name: 'Bulk Operations Management',
  steps: [
    {
      action: 'navigate',
      element: '/opportunities',
      validation: '[data-testid="opportunities-table"]',
      timing: 1000,
    },
    {
      action: 'click',
      element: '[data-testid="bulk-select-checkbox"]',
      validation: '[data-testid="bulk-actions-toolbar"]',
    },
    {
      action: 'click',
      element: '[data-testid="select-all-filtered"]',
      validation: '[data-testid="items-selected-count"]',
    },
    {
      action: 'click',
      element: '[data-testid="bulk-actions-dropdown"]',
      validation: '[data-testid="bulk-action-options"]',
    },
    {
      action: 'click',
      element: '[data-testid="bulk-update-priority"]',
      validation: '[data-testid="bulk-update-dialog"]',
    },
    {
      action: 'select',
      element: '[data-testid="new-priority-select"]',
      validation: 'critical',
    },
    {
      action: 'fill',
      element: '[data-testid="bulk-update-justification"]',
      validation: 'Emergency requirement - all collections elevated to critical',
    },
    {
      action: 'click',
      element: '[data-testid="preview-changes-button"]',
      validation: '[data-testid="changes-preview-table"]',
      timing: 1500,
    },
    {
      action: 'click',
      element: '[data-testid="apply-bulk-changes-button"]',
      validation: '[data-testid="bulk-update-progress"]',
      timing: 5000,
    },
    {
      action: 'click',
      element: '[data-testid="view-update-summary"]',
      validation: '[data-testid="bulk-update-summary"]',
    },
  ],
  expectedOutcome: 'Bulk update completed successfully with audit trail',
  metrics: {
    maxDuration: 300000, // 5 minutes
    maxClicks: 12,
    errorTolerance: 1,
    performanceTarget: {
      lcp: 3000,
      fid: 200,
      cls: 0.15,
      ttfb: 1000,
    },
  },
};

// All JTBD workflows collection
export const JTBD_WORKFLOWS = {
  VERIFY_VALIDATE: VERIFY_VALIDATE_WORKFLOW,
  OVERRIDE_CUSTOMIZE: OVERRIDE_CUSTOMIZE_WORKFLOW,
  FIX_DATA_INTEGRITY: FIX_DATA_INTEGRITY_WORKFLOW,
  ANALYZE_PERFORMANCE: ANALYZE_PERFORMANCE_WORKFLOW,
  BULK_OPERATIONS: BULK_OPERATIONS_WORKFLOW,
};

// Workflow categories for organized testing
export const WORKFLOW_CATEGORIES = {
  CRITICAL: ['jtbd-1-verify-validate', 'jtbd-3-fix-data-integrity'],
  OPERATIONAL: ['jtbd-2-override-customize', 'jtbd-5-bulk-operations'],
  ANALYTICAL: ['jtbd-4-analyze-performance'],
};