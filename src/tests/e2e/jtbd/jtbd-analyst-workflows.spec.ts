import { test, expect } from '@playwright/test';
import { JTBDIntegrationFixture } from './fixtures/jtbd-integration.fixture';

// Real-world analyst workflow scenarios
// These tests simulate actual user journeys and validate complete JTBD integration
test.describe('JTBD Analyst Workflows - Real User Scenarios', () => {
  let fixture: JTBDIntegrationFixture;

  test.beforeEach(async ({ page, context }) => {
    fixture = new JTBDIntegrationFixture(page, context);
    await fixture.setup();
  });

  test.afterEach(async () => {
    await fixture.cleanup();
  });

  // Scenario 1: Morning Routine - Daily Collection Planning Review
  test('Analyst morning routine: Review overnight changes and validate collection plans', async ({ page }) => {
    await test.step('Start of shift: Load opportunities dashboard', async () => {
      await page.goto('/opportunities');
      await expect(page.locator('[data-testid="opportunities-table"]')).toBeVisible();
      
      // Check system health indicators
      await expect(page.locator('[data-testid="system-health-indicator"]')).toBeVisible();
      
      // Verify overnight data sync completed
      const lastSyncTime = await page.locator('[data-testid="last-sync-time"]').textContent();
      console.log('Last data sync:', lastSyncTime);
    });

    await test.step('Identify overnight changes requiring attention', async () => {
      // Look for opportunities that changed overnight
      const changedOpportunities = page.locator('[data-testid="changed-overnight"]');
      const changeCount = await changedOpportunities.count();
      
      if (changeCount > 0) {
        console.log(`Found ${changeCount} opportunities changed overnight`);
        
        // Click on first changed opportunity
        await changedOpportunities.first().click();
        await expect(page.locator('[data-testid="change-details-panel"]')).toBeVisible();
        
        // Review change details
        const changeType = await page.locator('[data-testid="change-type"]').textContent();
        const changeReason = await page.locator('[data-testid="change-reason"]').textContent();
        
        console.log(`Change type: ${changeType}, Reason: ${changeReason}`);
      }
    });

    await test.step('JTBD #1: Validate critical opportunities first', async () => {
      // Filter to critical opportunities
      await page.click('[data-testid="filter-critical"]');
      await expect(page.locator('[data-testid="critical-opportunities-view"]')).toBeVisible();
      
      const criticalCount = await page.locator('[data-testid="critical-opportunity-row"]').count();
      
      for (let i = 0; i < Math.min(criticalCount, 3); i++) {
        await page.click(`[data-testid="critical-opportunity-row"]:nth-child(${i + 1}) [data-testid="validate-button"]`);
        await expect(page.locator('[data-testid="validation-panel"]')).toBeVisible();
        
        const validationResult = await page.locator('[data-testid="validation-status"]').textContent();
        
        if (validationResult?.includes('Failed')) {
          // Document validation failure
          await page.click('[data-testid="document-validation-issue"]');
          await page.fill('[data-testid="issue-notes"]', 'Morning review - validation failed, requires investigation');
          await page.click('[data-testid="save-issue-notes"]');
        }
        
        await page.click('[data-testid="close-validation-panel"]');
      }
    });

    await test.step('JTBD #3: Check for data integrity issues from overnight processing', async () => {
      // Navigate to data integrity dashboard
      await page.click('[data-testid="data-integrity-tab"]');
      await expect(page.locator('[data-testid="data-integrity-dashboard"]')).toBeVisible();
      
      const integrityIssues = await page.locator('[data-testid="integrity-issue-item"]').count();
      
      if (integrityIssues > 0) {
        console.log(`Found ${integrityIssues} data integrity issues`);
        
        // Address high-priority issues first
        const highPriorityIssues = page.locator('[data-testid="integrity-issue-item"][data-priority="high"]');
        const highPriorityCount = await highPriorityIssues.count();
        
        for (let i = 0; i < highPriorityCount; i++) {
          await highPriorityIssues.nth(i).click();
          await expect(page.locator('[data-testid="issue-resolution-panel"]')).toBeVisible();
          
          // Try automatic resolution first
          const hasAutoResolve = await page.locator('[data-testid="auto-resolve-button"]').isVisible();
          if (hasAutoResolve) {
            await page.click('[data-testid="auto-resolve-button"]');
            await expect(page.locator('[data-testid="auto-resolve-success"]')).toBeVisible();
          } else {
            // Manual resolution required
            await page.click('[data-testid="escalate-issue"]');
            await page.fill('[data-testid="escalation-notes"]', 'Morning review - requires manual intervention');
            await page.click('[data-testid="submit-escalation"]');
          }
          
          await page.click('[data-testid="close-resolution-panel"]');
        }
      }
    });

    await test.step('JTBD #4: Review overnight performance metrics', async () => {
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="overnight-performance-summary"]')).toBeVisible();
      
      const performanceSummary = {
        collectionSuccess: await page.locator('[data-testid="collection-success-rate"]').textContent(),
        systemUptime: await page.locator('[data-testid="system-uptime"]').textContent(),
        dataFreshness: await page.locator('[data-testid="data-freshness-score"]').textContent()
      };
      
      console.log('Overnight performance:', performanceSummary);
      
      // Check if any performance alerts require attention
      const performanceAlerts = await page.locator('[data-testid="performance-alert"]').count();
      if (performanceAlerts > 0) {
        await page.click('[data-testid="performance-alert"]:first-child');
        await expect(page.locator('[data-testid="alert-details-panel"]')).toBeVisible();
        
        // Acknowledge alert
        await page.click('[data-testid="acknowledge-alert"]');
        await page.fill('[data-testid="alert-response"]', 'Morning review - investigating performance degradation');
        await page.click('[data-testid="submit-alert-response"]');
      }
    });

    await test.step('Morning routine summary and handoff preparation', async () => {
      // Generate morning summary report
      await page.click('[data-testid="generate-morning-summary"]');
      await expect(page.locator('[data-testid="morning-summary-report"]')).toBeVisible();
      
      const summaryData = {
        opportunitiesReviewed: await page.locator('[data-testid="opportunities-reviewed-count"]').textContent(),
        issuesIdentified: await page.locator('[data-testid="issues-identified-count"]').textContent(),
        actionsRequired: await page.locator('[data-testid="actions-required-count"]').textContent()
      };
      
      console.log('Morning routine completed:', summaryData);
      
      // Save summary for shift handoff
      await page.click('[data-testid="save-shift-summary"]');
      await expect(page.locator('[data-testid="summary-saved-confirmation"]')).toBeVisible();
    });
  });

  // Scenario 2: Urgent Override - Mission Critical Collection
  test('Urgent mission critical override: High-priority target requires immediate collection', async ({ page }) => {
    const missionId = `URGENT-${Date.now()}`;
    
    await test.step('Receive urgent collection request', async () => {
      await page.goto('/opportunities');
      
      // Simulate receiving urgent request (in real system, this might come via external alert)
      await page.evaluate((mission) => {
        window.dispatchEvent(new CustomEvent('urgent-collection-request', {
          detail: {
            missionId: mission,
            priority: 'critical',
            timeWindow: '6 hours',
            justification: 'High-value target identified - immediate collection required'
          }
        }));
      }, missionId);
      
      // Verify urgent request notification appears
      await expect(page.locator('[data-testid="urgent-request-notification"]')).toBeVisible();
      await page.click('[data-testid="urgent-request-notification"]');
    });

    await test.step('JTBD #1: Rapidly identify suitable collection opportunities', async () => {
      // Use smart view for urgent requests
      await page.click('[data-testid="smart-view-urgent"]');
      await expect(page.locator('[data-testid="urgent-opportunities-view"]')).toBeVisible();
      
      // Filter by geographic region if provided
      await page.click('[data-testid="filter-by-region"]');
      await page.selectOption('[data-testid="region-selector"]', 'TARGET_REGION');
      
      // Look for opportunities within time window
      const suitableOpportunities = page.locator('[data-testid="suitable-opportunity"]');
      const suitableCount = await suitableOpportunities.count();
      
      expect(suitableCount).toBeGreaterThan(0);
      console.log(`Found ${suitableCount} suitable opportunities for urgent collection`);
      
      // Select best opportunity (first in list, pre-sorted by suitability)
      await suitableOpportunities.first().click();
    });

    await test.step('JTBD #1: Quick validation of selected opportunity', async () => {
      await page.click('[data-testid="quick-validate"]');
      await expect(page.locator('[data-testid="quick-validation-results"]')).toBeVisible();
      
      const validationStatus = await page.locator('[data-testid="quick-validation-status"]').textContent();
      
      if (validationStatus?.includes('Warning') || validationStatus?.includes('Failed')) {
        // Note: For urgent missions, we may need to proceed despite warnings
        console.log('Validation warnings exist but proceeding due to mission criticality');
      }
    });

    await test.step('JTBD #2: Apply urgent mission override', async () => {
      await page.click('[data-testid="urgent-override-button"]');
      await expect(page.locator('[data-testid="urgent-override-modal"]')).toBeVisible();
      
      // Fill urgent override form
      await page.fill('[data-testid="mission-id"]', missionId);
      await page.selectOption('[data-testid="override-priority"]', 'critical');
      await page.selectOption('[data-testid="override-type"]', 'mission-critical');
      await page.fill('[data-testid="override-justification"]', 
        'URGENT: High-value target identified. Immediate collection required for mission success. Override standard allocation due to time-critical nature.');
      
      // Request expedited approval
      await page.check('[data-testid="request-expedited-approval"]');
      
      await page.click('[data-testid="submit-urgent-override"]');
      await expect(page.locator('[data-testid="urgent-override-submitted"]')).toBeVisible();
    });

    await test.step('JTBD #2: Expedited approval workflow', async () => {
      // In real system, this would involve manager approval
      // For test, simulate manager receiving and approving request
      
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('expedited-approval-received', {
          detail: {
            approved: true,
            approver: 'Mission Manager',
            timestamp: Date.now(),
            notes: 'Approved for mission critical collection - high priority target'
          }
        }));
      });
      
      await expect(page.locator('[data-testid="expedited-approval-notification"]')).toBeVisible();
      await page.click('[data-testid="expedited-approval-notification"]');
      
      // Verify override is now active
      await expect(page.locator('[data-testid="urgent-override-active"]')).toBeVisible();
      
      const overrideStatus = await page.locator('[data-testid="override-status"]').textContent();
      expect(overrideStatus).toContain('APPROVED');
    });

    await test.step('Verify urgent collection is prioritized in system', async () => {
      // Check that opportunity is now marked as urgent
      await expect(page.locator('[data-testid="urgent-collection-indicator"]')).toBeVisible();
      
      // Verify it appears at top of priority queue
      await page.click('[data-testid="view-collection-queue"]');
      
      const queuePosition = await page.locator('[data-testid="queue-position"]').textContent();
      expect(Number(queuePosition)).toBe(1);
      
      // Verify collection parameters are updated
      const collectionPriority = await page.locator('[data-testid="collection-priority"]').textContent();
      expect(collectionPriority).toContain('CRITICAL');
    });

    await test.step('JTBD #4: Monitor urgent collection progress', async () => {
      await page.click('[data-testid="monitor-urgent-collection"]');
      await expect(page.locator('[data-testid="urgent-collection-monitor"]')).toBeVisible();
      
      // Check real-time status
      const collectionStatus = await page.locator('[data-testid="real-time-status"]').textContent();
      console.log('Urgent collection status:', collectionStatus);
      
      // Verify monitoring alerts are configured
      await expect(page.locator('[data-testid="urgent-monitoring-alerts"]')).toBeVisible();
      
      // Set up notifications for completion
      await page.check('[data-testid="notify-on-completion"]');
      await page.check('[data-testid="notify-on-issues"]');
      await page.click('[data-testid="save-monitoring-preferences"]');
    });
  });

  // Scenario 3: End of Shift - Handoff and Documentation
  test('End of shift workflow: Document issues, prepare handoff, and update system status', async ({ page }) => {
    await test.step('Review shift activities and outstanding issues', async () => {
      await page.goto('/opportunities');
      
      // View shift summary
      await page.click('[data-testid="shift-summary-button"]');
      await expect(page.locator('[data-testid="shift-summary-panel"]')).toBeVisible();
      
      const shiftMetrics = {
        opportunitiesProcessed: await page.locator('[data-testid="opportunities-processed"]').textContent(),
        overridesApplied: await page.locator('[data-testid="overrides-applied"]').textContent(),
        issuesResolved: await page.locator('[data-testid="issues-resolved"]').textContent(),
        issuesPending: await page.locator('[data-testid="issues-pending"]').textContent()
      };
      
      console.log('Shift metrics:', shiftMetrics);
    });

    await test.step('JTBD #5: Bulk update outstanding items before handoff', async () => {
      // Select all pending review items
      await page.click('[data-testid="filter-pending-review"]');
      await page.click('[data-testid="bulk-select-all-filtered"]');
      
      const selectedCount = await page.locator('[data-testid="bulk-selected-count"]').textContent();
      console.log(`Selected ${selectedCount} items for bulk update`);
      
      // Add handoff notes to selected items
      await page.click('[data-testid="bulk-actions-dropdown"]');
      await page.click('[data-testid="bulk-add-handoff-notes"]');
      
      await page.fill('[data-testid="bulk-handoff-notes"]', 
        'End of shift handoff - items reviewed but require next shift attention. No immediate action needed.');
      
      await page.click('[data-testid="apply-bulk-handoff-notes"]');
      await expect(page.locator('[data-testid="bulk-handoff-notes-applied"]')).toBeVisible();
    });

    await test.step('Document significant issues and resolutions', async () => {
      await page.click('[data-testid="shift-documentation-tab"]');
      await expect(page.locator('[data-testid="shift-documentation-form"]')).toBeVisible();
      
      // Document major issues encountered
      await page.fill('[data-testid="major-issues-encountered"]', 
        'Data integrity issue with satellite TLE data resolved via fallback systems. ' +
        'One urgent override processed for mission-critical target. ' +
        'Performance slightly degraded in morning but recovered by noon.'
      );
      
      // Document resolutions applied
      await page.fill('[data-testid="resolutions-applied"]',
        'TLE data issue: Applied fallback TLE source, escalated to data team for investigation. ' +
        'Urgent override: Applied with manager approval, monitoring for successful collection. ' +
        'Performance issue: System self-recovered, no action required.'
      );
      
      // Note items for next shift
      await page.fill('[data-testid="next-shift-items"]',
        '3 opportunities pending final validation - low priority. ' +
        'Monitor urgent collection scheduled for 0300Z. ' +
        'Follow up on TLE data investigation with data team.'
      );
      
      await page.click('[data-testid="save-shift-documentation"]');
      await expect(page.locator('[data-testid="documentation-saved"]')).toBeVisible();
    });

    await test.step('JTBD #4: Generate comprehensive shift report', async () => {
      await page.click('[data-testid="generate-shift-report"]');
      await expect(page.locator('[data-testid="shift-report-generator"]')).toBeVisible();
      
      // Configure report parameters
      await page.selectOption('[data-testid="report-detail-level"]', 'comprehensive');
      await page.check('[data-testid="include-performance-metrics"]');
      await page.check('[data-testid="include-override-details"]');
      await page.check('[data-testid="include-data-quality-summary"]');
      
      await page.click('[data-testid="generate-report-button"]');
      
      // Wait for report generation
      await expect(page.locator('[data-testid="report-generation-complete"]')).toBeVisible({ timeout: 30000 });
      
      // Verify report contains key sections
      await expect(page.locator('[data-testid="report-executive-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-detailed-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-issues-resolutions"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-handoff-items"]')).toBeVisible();
      
      // Download report for records
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="download-shift-report"]')
      ]);
      
      expect(download.suggestedFilename()).toContain('shift-report');
    });

    await test.step('Prepare system for next shift', async () => {
      // Clear personal filters and views
      await page.click('[data-testid="reset-personal-filters"]');
      await expect(page.locator('[data-testid="filters-reset-confirmation"]')).toBeVisible();
      
      // Set system to default state for next analyst
      await page.click('[data-testid="set-default-view"]');
      await page.selectOption('[data-testid="default-view-selector"]', 'standard-monitoring');
      
      // Verify critical alerts are visible for next shift
      const criticalAlerts = await page.locator('[data-testid="critical-alert"]').count();
      if (criticalAlerts > 0) {
        console.log(`${criticalAlerts} critical alerts remain for next shift attention`);
      }
      
      // Lock completed items to prevent accidental modification
      await page.click('[data-testid="lock-completed-items"]');
      await expect(page.locator('[data-testid="completed-items-locked"]')).toBeVisible();
      
      console.log('System prepared for next shift handoff');
    });

    await test.step('Final shift validation and sign-off', async () => {
      // Review handoff checklist
      await page.click('[data-testid="handoff-checklist"]');
      await expect(page.locator('[data-testid="handoff-checklist-modal"]')).toBeVisible();
      
      // Verify all checklist items
      const checklistItems = [
        'outstanding-issues-documented',
        'urgent-items-flagged',
        'system-status-updated',
        'performance-verified',
        'handoff-notes-complete'
      ];
      
      for (const item of checklistItems) {
        await page.check(`[data-testid="checklist-${item}"]`);
      }
      
      // Digital sign-off
      await page.fill('[data-testid="shift-signoff-analyst"]', 'Test Analyst');
      await page.fill('[data-testid="shift-signoff-time"]', new Date().toISOString());
      await page.click('[data-testid="complete-shift-handoff"]');
      
      await expect(page.locator('[data-testid="shift-handoff-complete"]')).toBeVisible();
      
      console.log('Shift handoff completed successfully');
    });
  });

  // Scenario 4: Data Quality Investigation
  test('Data quality investigation: Identify, analyze, and resolve systematic data issues', async ({ page }) => {
    await test.step('JTBD #3: Detect systematic data quality issues', async () => {
      await page.goto('/opportunities');
      
      // Navigate to data quality dashboard
      await page.click('[data-testid="data-quality-dashboard"]');
      await expect(page.locator('[data-testid="data-quality-overview"]')).toBeVisible();
      
      // Look for patterns in data issues
      const qualityMetrics = {
        overallScore: await page.locator('[data-testid="overall-data-quality-score"]').textContent(),
        tleIssues: await page.locator('[data-testid="tle-data-issues-count"]').textContent(),
        orbitIssues: await page.locator('[data-testid="orbit-prediction-issues-count"]').textContent(),
        sensorIssues: await page.locator('[data-testid="sensor-data-issues-count"]').textContent()
      };
      
      console.log('Data quality metrics:', qualityMetrics);
      
      // Identify the most significant issue type
      const issueTypes = [
        { type: 'tle', count: Number(qualityMetrics.tleIssues) },
        { type: 'orbit', count: Number(qualityMetrics.orbitIssues) },
        { type: 'sensor', count: Number(qualityMetrics.sensorIssues) }
      ];
      
      const highestIssueType = issueTypes.sort((a, b) => b.count - a.count)[0];
      console.log(`Investigating ${highestIssueType.type} issues (${highestIssueType.count} occurrences)`);
    });

    await test.step('Deep dive analysis of data quality patterns', async () => {
      // Drill down into specific issue type
      await page.click(`[data-testid="investigate-${highestIssueType.type}-issues"]`);
      await expect(page.locator('[data-testid="issue-analysis-panel"]')).toBeVisible();
      
      // Analyze temporal patterns
      await page.click('[data-testid="temporal-analysis-tab"]');
      await expect(page.locator('[data-testid="temporal-pattern-chart"]')).toBeVisible();
      
      const temporalPattern = await page.locator('[data-testid="pattern-summary"]').textContent();
      console.log('Temporal pattern detected:', temporalPattern);
      
      // Analyze geographic patterns
      await page.click('[data-testid="geographic-analysis-tab"]');
      await expect(page.locator('[data-testid="geographic-pattern-map"]')).toBeVisible();
      
      const geographicPattern = await page.locator('[data-testid="geographic-summary"]').textContent();
      console.log('Geographic pattern detected:', geographicPattern);
      
      // Analyze system patterns
      await page.click('[data-testid="system-analysis-tab"]');
      const affectedSystems = await page.locator('[data-testid="affected-system-item"]').allTextContents();
      console.log('Affected systems:', affectedSystems);
    });

    await test.step('JTBD #3: Implement systematic resolution strategy', async () => {
      // Based on analysis, choose resolution strategy
      await page.click('[data-testid="resolution-strategy-tab"]');
      await expect(page.locator('[data-testid="resolution-options"]')).toBeVisible();
      
      // For TLE issues, try data source failover
      if (highestIssueType.type === 'tle') {
        await page.click('[data-testid="implement-tle-failover"]');
        await page.selectOption('[data-testid="backup-tle-source"]', 'celestrak-backup');
        await page.click('[data-testid="apply-tle-failover"]');
        
        await expect(page.locator('[data-testid="tle-failover-initiated"]')).toBeVisible();
      }
      
      // For orbit issues, trigger recalculation
      if (highestIssueType.type === 'orbit') {
        await page.click('[data-testid="trigger-orbit-recalculation"]');
        await page.check('[data-testid="use-enhanced-propagator"]');
        await page.click('[data-testid="start-recalculation"]');
        
        await expect(page.locator('[data-testid="orbit-recalculation-started"]')).toBeVisible();
      }
      
      // Monitor resolution progress
      await page.click('[data-testid="monitor-resolution-progress"]');
      await expect(page.locator('[data-testid="resolution-progress-panel"]')).toBeVisible();
    });

    await test.step('JTBD #1: Validate resolution effectiveness', async () => {
      // Wait for resolution to take effect
      await page.waitForTimeout(5000);
      
      // Re-run validation on affected opportunities
      await page.click('[data-testid="revalidate-affected-opportunities"]');
      await expect(page.locator('[data-testid="revalidation-progress"]')).toBeVisible();
      
      await expect(page.locator('[data-testid="revalidation-complete"]')).toBeVisible({ timeout: 30000 });
      
      // Check improvement in data quality scores
      const improvedMetrics = {
        newOverallScore: await page.locator('[data-testid="updated-data-quality-score"]').textContent(),
        issuesResolved: await page.locator('[data-testid="issues-resolved-count"]').textContent(),
        issuesRemaining: await page.locator('[data-testid="issues-remaining-count"]').textContent()
      };
      
      console.log('Resolution results:', improvedMetrics);
      
      // Verify improvement
      const originalScore = Number(qualityMetrics.overallScore?.replace('%', ''));
      const newScore = Number(improvedMetrics.newOverallScore?.replace('%', ''));
      
      expect(newScore).toBeGreaterThan(originalScore);
      console.log(`Data quality improved from ${originalScore}% to ${newScore}%`);
    });

    await test.step('Document investigation and establish monitoring', async () => {
      // Create investigation report
      await page.click('[data-testid="create-investigation-report"]');
      await expect(page.locator('[data-testid="investigation-report-form"]')).toBeVisible();
      
      await page.fill('[data-testid="issue-description"]', 
        `Systematic ${highestIssueType.type} data quality issues affecting ${highestIssueType.count} opportunities`);
      
      await page.fill('[data-testid="root-cause-analysis"]',
        'Analysis revealed pattern in data source reliability. Implemented failover strategy and enhanced monitoring.');
      
      await page.fill('[data-testid="resolution-summary"]',
        'Applied systematic resolution strategy. Data quality improved significantly. Monitoring established for early detection.');
      
      await page.fill('[data-testid="preventive-measures"]',
        'Enhanced monitoring thresholds established. Automatic failover configured. Daily quality reports scheduled.');
      
      await page.click('[data-testid="save-investigation-report"]');
      await expect(page.locator('[data-testid="investigation-report-saved"]')).toBeVisible();
      
      // Set up enhanced monitoring
      await page.click('[data-testid="setup-enhanced-monitoring"]');
      await page.check('[data-testid="enable-proactive-alerts"]');
      await page.fill('[data-testid="alert-threshold"]', '85'); // Alert if quality drops below 85%
      await page.check('[data-testid="daily-quality-reports"]');
      
      await page.click('[data-testid="save-monitoring-config"]');
      await expect(page.locator('[data-testid="enhanced-monitoring-active"]')).toBeVisible();
      
      console.log('Investigation documented and enhanced monitoring established');
    });
  });

  // Scenario 5: Multi-analyst Coordination
  test('Multi-analyst coordination: Collaborative decision making on complex collection scenario', async ({ page, context }) => {
    await test.step('Scenario setup: Complex multi-target collection scenario', async () => {
      await page.goto('/opportunities');
      
      // Simulate complex scenario with multiple high-priority targets
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('complex-scenario-initiated', {
          detail: {
            scenarioId: 'MULTI-TARGET-001',
            targets: [
              { id: 'TARGET-A', priority: 'critical', region: 'REGION-1', constraints: 'narrow-window' },
              { id: 'TARGET-B', priority: 'high', region: 'REGION-2', constraints: 'weather-dependent' },
              { id: 'TARGET-C', priority: 'medium', region: 'REGION-1', constraints: 'sensor-specific' }
            ],
            resourceConflicts: true,
            timeConstraints: 'overlapping-windows'
          }
        }));
      });
      
      await expect(page.locator('[data-testid="complex-scenario-alert"]')).toBeVisible();
      await page.click('[data-testid="complex-scenario-alert"]');
    });

    await test.step('JTBD #1: Collaborative validation of collection options', async () => {
      // Open collaboration workspace
      await page.click('[data-testid="open-collaboration-workspace"]');
      await expect(page.locator('[data-testid="collaboration-workspace"]')).toBeVisible();
      
      // Simulate multiple analysts joining (in real system, this would be via WebSocket)
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('analyst-joined', {
          detail: { analystId: 'analyst-2', name: 'Senior Analyst B', role: 'validation-specialist' }
        }));
        window.dispatchEvent(new CustomEvent('analyst-joined', {
          detail: { analystId: 'analyst-3', name: 'Analyst C', role: 'regional-expert' }
        }));
      });
      
      await expect(page.locator('[data-testid="collaboration-participants"]')).toContainText('3 analysts online');
      
      // Each analyst validates different aspects
      await page.click('[data-testid="assign-validation-tasks"]');
      
      // Primary analyst focuses on TARGET-A (critical)
      await page.click('[data-testid="validate-target-a"]');
      await expect(page.locator('[data-testid="target-a-validation-panel"]')).toBeVisible();
      
      const targetAValidation = await page.locator('[data-testid="target-a-validation-status"]').textContent();
      console.log('Target A validation:', targetAValidation);
      
      // Add validation notes for collaboration
      await page.fill('[data-testid="validation-notes"]', 
        'Critical target validation complete. Window is narrow but achievable with current satellite position.');
      await page.click('[data-testid="share-validation-notes"]');
    });

    await test.step('JTBD #2: Collaborative override decisions with resource conflicts', async () => {
      // Resource conflict detected
      await expect(page.locator('[data-testid="resource-conflict-alert"]')).toBeVisible();
      await page.click('[data-testid="resource-conflict-alert"]');
      
      await expect(page.locator('[data-testid="conflict-resolution-panel"]')).toBeVisible();
      
      // View conflict details
      const conflictDetails = await page.locator('[data-testid="conflict-description"]').textContent();
      console.log('Resource conflict:', conflictDetails);
      
      // Start collaborative decision process
      await page.click('[data-testid="initiate-collaborative-decision"]');
      
      // Primary analyst proposes resolution
      await page.fill('[data-testid="resolution-proposal"]',
        'Propose prioritizing TARGET-A (critical) and delaying TARGET-B by 2 hours. ' +
        'TARGET-C can use alternate sensor with minimal impact.');
      
      await page.click('[data-testid="submit-proposal"]');
      await expect(page.locator('[data-testid="proposal-submitted"]')).toBeVisible();
      
      // Simulate other analysts responding
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('collaboration-response', {
          detail: {
            analystId: 'analyst-2',
            response: 'agree',
            notes: 'Concur with TARGET-A priority. Weather window for TARGET-B actually improves in 2 hours.'
          }
        }));
        window.dispatchEvent(new CustomEvent('collaboration-response', {
          detail: {
            analystId: 'analyst-3',
            response: 'suggest-modification',
            notes: 'Agree with approach but recommend using backup sensor for TARGET-C to maintain quality.'
          }
        }));
      });
      
      await expect(page.locator('[data-testid="collaboration-responses"]')).toBeVisible();
      
      // Incorporate feedback and finalize decision
      await page.click('[data-testid="incorporate-feedback"]');
      await page.fill('[data-testid="final-resolution"]',
        'Final decision: Prioritize TARGET-A immediately. Delay TARGET-B by 2 hours for better weather. ' +
        'Use backup sensor for TARGET-C as recommended by regional expert.');
      
      await page.click('[data-testid="finalize-collaborative-decision"]');
      await expect(page.locator('[data-testid="collaborative-decision-finalized"]')).toBeVisible();
    });

    await test.step('JTBD #2: Apply coordinated overrides', async () => {
      // Apply overrides based on collaborative decision
      await page.click('[data-testid="apply-coordinated-overrides"]');
      
      // Override for TARGET-A (immediate priority)
      await page.click('[data-testid="override-target-a"]');
      await page.fill('[data-testid="override-reason"]', 
        'Collaborative decision - critical target prioritized over conflicting resources');
      await page.selectOption('[data-testid="override-priority"]', 'critical');
      await page.fill('[data-testid="collaboration-reference"]', 'Multi-analyst decision MULTI-TARGET-001');
      await page.click('[data-testid="apply-override"]');
      
      // Override for TARGET-B (delayed)
      await page.click('[data-testid="override-target-b"]');
      await page.fill('[data-testid="override-reason"]', 
        'Collaborative decision - delayed by 2 hours for improved weather conditions');
      await page.fill('[data-testid="delay-duration"]', '120'); // minutes
      await page.click('[data-testid="apply-delay-override"]');
      
      // Override for TARGET-C (sensor change)
      await page.click('[data-testid="override-target-c"]');
      await page.selectOption('[data-testid="alternate-sensor"]', 'backup-sensor-02');
      await page.fill('[data-testid="override-reason"]', 
        'Collaborative decision - alternate sensor per regional expert recommendation');
      await page.click('[data-testid="apply-sensor-override"]');
      
      await expect(page.locator('[data-testid="all-overrides-applied"]')).toBeVisible();
    });

    await test.step('JTBD #4: Monitor coordinated collection execution', async () => {
      // Set up coordinated monitoring
      await page.click('[data-testid="setup-coordinated-monitoring"]');
      await expect(page.locator('[data-testid="coordinated-monitoring-dashboard"]')).toBeVisible();
      
      // Verify all targets are tracked
      const monitoredTargets = await page.locator('[data-testid="monitored-target"]').count();
      expect(monitoredTargets).toBe(3);
      
      // Check collection timeline
      await expect(page.locator('[data-testid="collection-timeline"]')).toBeVisible();
      
      // Verify coordination indicators
      await expect(page.locator('[data-testid="coordination-status"]')).toContainText('Active');
      
      // Set up alerts for all analysts
      await page.click('[data-testid="setup-team-alerts"]');
      await page.check('[data-testid="notify-all-analysts"]');
      await page.check('[data-testid="alert-on-conflicts"]');
      await page.check('[data-testid="alert-on-completion"]');
      await page.click('[data-testid="save-team-alert-config"]');
      
      console.log('Coordinated monitoring established for all targets');
    });

    await test.step('Document collaborative decision and outcomes', async () => {
      // Generate collaborative decision report
      await page.click('[data-testid="generate-collaboration-report"]');
      await expect(page.locator('[data-testid="collaboration-report-form"]')).toBeVisible();
      
      // Report includes all analysts' contributions
      const participantSummary = await page.locator('[data-testid="participant-summary"]').textContent();
      expect(participantSummary).toContain('3 analysts');
      
      // Decision rationale
      await page.fill('[data-testid="decision-rationale"]',
        'Multi-analyst collaboration resolved complex resource conflict scenario. ' +
        'Critical target prioritized, weather window optimization achieved, ' +
        'regional expertise incorporated for sensor selection.');
      
      // Lessons learned
      await page.fill('[data-testid="lessons-learned"]',
        'Collaborative decision-making process effective for complex scenarios. ' +
        'Regional expert input valuable for sensor optimization. ' +
        'Weather consideration significantly improved TARGET-B collection probability.');
      
      await page.click('[data-testid="save-collaboration-report"]');
      await expect(page.locator('[data-testid="collaboration-report-saved"]')).toBeVisible();
      
      // Share report with all participants
      await page.click('[data-testid="share-with-team"]');
      await expect(page.locator('[data-testid="report-shared-confirmation"]')).toBeVisible();
      
      console.log('Collaborative decision documented and shared with team');
    });
  });
});

// Helper function to simulate realistic data
async function setupRealisticTestData(page: any): Promise<void> {
  await page.evaluate(() => {
    // Inject realistic test data
    window.testData = {
      opportunities: [
        {
          id: 'opp-001',
          name: 'ISS Observation Pass',
          satellite: 'WORLDVIEW-3',
          region: 'CONUS',
          priority: 'high',
          validationStatus: 'warning',
          dataQuality: 92,
          conflicts: ['resource-overlap']
        },
        {
          id: 'opp-002', 
          name: 'Arctic Weather Monitoring',
          satellite: 'NOAA-20',
          region: 'ARCTIC',
          priority: 'critical',
          validationStatus: 'failed',
          dataQuality: 78,
          conflicts: ['weather-dependent']
        },
        {
          id: 'opp-003',
          name: 'Forest Fire Assessment',
          satellite: 'LANDSAT-8',
          region: 'WEST-COAST',
          priority: 'urgent',
          validationStatus: 'passed',
          dataQuality: 95,
          conflicts: []
        }
      ],
      dataIntegrityIssues: [
        {
          type: 'stale_tle_data',
          severity: 'high',
          affectedCount: 12,
          lastUpdated: '3 hours ago'
        },
        {
          type: 'satellite_maintenance',
          severity: 'critical',
          affectedCount: 3,
          scheduledEnd: '6 hours'
        }
      ]
    };
  });
}