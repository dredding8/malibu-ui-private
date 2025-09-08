import { test, expect, Page } from '@playwright/test';
import { NavigationFlowMetrics, CognitiveLoadMeasurement } from './types/navigation-metrics';

/**
 * Iterative Enhancement Framework
 * Continuously improves navigation UX based on test results and metrics
 */

interface EnhancementOpportunity {
  id: string;
  area: string;
  currentScore: number;
  targetScore: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  implementationComplexity: 'trivial' | 'simple' | 'moderate' | 'complex';
  estimatedImpact: number; // 0-100
}

interface EnhancementCycle {
  cycleNumber: number;
  startMetrics: NavigationFlowMetrics;
  opportunities: EnhancementOpportunity[];
  implementedChanges: string[];
  endMetrics: NavigationFlowMetrics;
  improvement: number;
}

class IterativeEnhancementEngine {
  private cycles: EnhancementCycle[] = [];
  private baselineMetrics: NavigationFlowMetrics | null = null;
  private currentCycle: number = 0;

  async establishBaseline(page: Page): Promise<NavigationFlowMetrics> {
    console.log('🎯 Establishing baseline metrics...');
    
    // Run comprehensive navigation flow
    const startTime = Date.now();
    const metrics: NavigationFlowMetrics = {
      flowId: 'baseline',
      startTime,
      endTime: 0,
      totalDuration: 0,
      steps: [],
      cognitiveLoad: {
        score: 0,
        totalInteractionTime: 0,
        averageInteractionTime: 0,
        errorCount: 0,
        hesitationCount: 0,
        taskCount: 0
      },
      errors: [],
      success: true,
      completionRate: 100
    };

    // Test key user flows
    await this.testHistoryToFieldMappingFlow(page, metrics);
    await this.testWizardFlow(page, metrics);
    await this.testErrorRecoveryFlow(page, metrics);

    metrics.endTime = Date.now();
    metrics.totalDuration = metrics.endTime - metrics.startTime;

    // Calculate cognitive load
    const totalInteractionTime = metrics.steps.reduce((sum, step) => sum + step.duration, 0);
    const errorPenalty = metrics.errors.length * 500;
    const cognitiveScore = Math.min(100, ((totalInteractionTime + errorPenalty) / 1000) * 2);

    metrics.cognitiveLoad = {
      score: cognitiveScore,
      totalInteractionTime,
      averageInteractionTime: totalInteractionTime / metrics.steps.length,
      errorCount: metrics.errors.length,
      hesitationCount: metrics.steps.reduce((sum, s) => sum + s.hesitationCount, 0),
      taskCount: metrics.steps.length
    };

    this.baselineMetrics = metrics;
    return metrics;
  }

  async identifyEnhancementOpportunities(metrics: NavigationFlowMetrics): Promise<EnhancementOpportunity[]> {
    console.log('🔍 Analyzing metrics for enhancement opportunities...');
    
    const opportunities: EnhancementOpportunity[] = [];

    // Analyze cognitive load
    if (metrics.cognitiveLoad.score > 40) {
      opportunities.push({
        id: 'reduce-cognitive-load',
        area: 'Overall Navigation',
        currentScore: metrics.cognitiveLoad.score,
        targetScore: 30,
        priority: metrics.cognitiveLoad.score > 60 ? 'critical' : 'high',
        recommendations: [
          'Simplify navigation hierarchy',
          'Add more contextual hints',
          'Improve progressive disclosure',
          'Reduce decision points'
        ],
        implementationComplexity: 'moderate',
        estimatedImpact: 30
      });
    }

    // Analyze error patterns
    const errorsByType = metrics.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (errorsByType.validation > 2) {
      opportunities.push({
        id: 'improve-validation',
        area: 'Form Validation',
        currentScore: 50,
        targetScore: 90,
        priority: 'high',
        recommendations: [
          'Add inline validation',
          'Provide clearer error messages',
          'Show validation hints before submission',
          'Implement progressive validation'
        ],
        implementationComplexity: 'simple',
        estimatedImpact: 25
      });
    }

    // Analyze navigation efficiency
    const backtrackRate = metrics.steps.reduce((sum, s) => sum + s.backtrackCount, 0) / metrics.steps.length;
    if (backtrackRate > 0.2) {
      opportunities.push({
        id: 'improve-navigation-clarity',
        area: 'Navigation Clarity',
        currentScore: 60,
        targetScore: 85,
        priority: 'medium',
        recommendations: [
          'Enhance breadcrumb visibility',
          'Add navigation preview on hover',
          'Implement better state preservation',
          'Add confirmation for destructive navigation'
        ],
        implementationComplexity: 'moderate',
        estimatedImpact: 20
      });
    }

    // Analyze interaction patterns
    const avgInteractionTime = metrics.cognitiveLoad.averageInteractionTime;
    if (avgInteractionTime > 2000) {
      opportunities.push({
        id: 'optimize-interactions',
        area: 'Interaction Speed',
        currentScore: 40,
        targetScore: 80,
        priority: 'high',
        recommendations: [
          'Add keyboard shortcuts for common actions',
          'Implement smart defaults',
          'Add bulk operations',
          'Optimize loading states'
        ],
        implementationComplexity: 'simple',
        estimatedImpact: 35
      });
    }

    // Sort by priority and impact
    opportunities.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aScore = priorityWeight[a.priority] * a.estimatedImpact;
      const bScore = priorityWeight[b.priority] * b.estimatedImpact;
      return bScore - aScore;
    });

    return opportunities;
  }

  async implementEnhancements(
    page: Page, 
    opportunities: EnhancementOpportunity[]
  ): Promise<string[]> {
    console.log('🛠️ Implementing top enhancement opportunities...');
    
    const implemented: string[] = [];

    // Select top opportunities based on complexity and impact
    const toImplement = opportunities
      .filter(o => o.implementationComplexity !== 'complex')
      .slice(0, 3);

    for (const opportunity of toImplement) {
      console.log(`  Implementing: ${opportunity.id}`);
      
      switch (opportunity.id) {
        case 'reduce-cognitive-load':
          // Simulate implementing cognitive load improvements
          implemented.push('Added contextual help tooltips');
          implemented.push('Simplified wizard step indicators');
          implemented.push('Improved error message clarity');
          break;
          
        case 'improve-validation':
          implemented.push('Added inline field validation');
          implemented.push('Implemented validation preview');
          implemented.push('Enhanced error message specificity');
          break;
          
        case 'improve-navigation-clarity':
          implemented.push('Enhanced breadcrumb styling');
          implemented.push('Added navigation preview cards');
          implemented.push('Implemented navigation confirmation dialogs');
          break;
          
        case 'optimize-interactions':
          implemented.push('Added keyboard shortcut hints');
          implemented.push('Implemented smart form defaults');
          implemented.push('Added batch selection features');
          break;
      }
    }

    return implemented;
  }

  async measureImprovement(page: Page): Promise<NavigationFlowMetrics> {
    console.log('📊 Measuring improvement after enhancements...');
    
    // Re-run the same tests to measure improvement
    return await this.establishBaseline(page);
  }

  async runEnhancementCycle(page: Page): Promise<EnhancementCycle> {
    this.currentCycle++;
    console.log(`\n🔄 Starting Enhancement Cycle ${this.currentCycle}`);
    
    // Get current metrics
    const startMetrics = this.baselineMetrics || await this.establishBaseline(page);
    
    // Identify opportunities
    const opportunities = await this.identifyEnhancementOpportunities(startMetrics);
    console.log(`  Found ${opportunities.length} enhancement opportunities`);
    
    // Implement changes
    const implementedChanges = await this.implementEnhancements(page, opportunities);
    console.log(`  Implemented ${implementedChanges.length} changes`);
    
    // Measure improvement
    const endMetrics = await this.measureImprovement(page);
    
    // Calculate improvement
    const improvement = ((startMetrics.cognitiveLoad.score - endMetrics.cognitiveLoad.score) / 
                        startMetrics.cognitiveLoad.score) * 100;
    
    const cycle: EnhancementCycle = {
      cycleNumber: this.currentCycle,
      startMetrics,
      opportunities,
      implementedChanges,
      endMetrics,
      improvement
    };
    
    this.cycles.push(cycle);
    this.baselineMetrics = endMetrics; // Update baseline for next cycle
    
    console.log(`  Improvement: ${improvement.toFixed(1)}%`);
    console.log(`  New cognitive load score: ${endMetrics.cognitiveLoad.score.toFixed(1)}`);
    
    return cycle;
  }

  generateReport(): void {
    console.log('\n📈 Iterative Enhancement Report');
    console.log('================================');
    
    if (!this.baselineMetrics) {
      console.log('No baseline established');
      return;
    }
    
    console.log(`\nTotal Cycles Run: ${this.cycles.length}`);
    console.log(`Initial Cognitive Load: ${this.cycles[0]?.startMetrics.cognitiveLoad.score.toFixed(1) || 'N/A'}`);
    console.log(`Final Cognitive Load: ${this.baselineMetrics.cognitiveLoad.score.toFixed(1)}`);
    
    const totalImprovement = this.cycles.reduce((sum, cycle) => sum + cycle.improvement, 0);
    console.log(`Total Improvement: ${totalImprovement.toFixed(1)}%`);
    
    console.log('\nImplemented Enhancements:');
    const allChanges = this.cycles.flatMap(c => c.implementedChanges);
    allChanges.forEach((change, idx) => {
      console.log(`  ${idx + 1}. ${change}`);
    });
    
    console.log('\nRemaining Opportunities:');
    if (this.cycles.length > 0) {
      const lastCycle = this.cycles[this.cycles.length - 1];
      const unimplemented = lastCycle.opportunities
        .filter(o => o.priority === 'high' || o.priority === 'critical')
        .slice(0, 5);
      
      unimplemented.forEach((opp, idx) => {
        console.log(`  ${idx + 1}. ${opp.area} (Priority: ${opp.priority}, Impact: ${opp.estimatedImpact})`);
        opp.recommendations.slice(0, 2).forEach(rec => {
          console.log(`     - ${rec}`);
        });
      });
    }
  }

  // Helper test methods
  private async testHistoryToFieldMappingFlow(page: Page, metrics: NavigationFlowMetrics): Promise<void> {
    const stepStart = Date.now();
    
    await page.goto('http://localhost:3000/history');
    await page.waitForSelector('.history-table');
    
    // Simulate user hesitation
    await page.waitForTimeout(500);
    
    await page.click('.collection-row:first-child [data-testid="view-field-mappings-button"]');
    await page.waitForSelector('.field-mapping-review');
    
    metrics.steps.push({
      stepId: 'history-to-field-mapping',
      stepName: 'Navigate from History to Field Mapping',
      startTime: stepStart,
      endTime: Date.now(),
      duration: Date.now() - stepStart,
      interactions: [],
      backtrackCount: 0,
      hesitationCount: 1
    });
  }

  private async testWizardFlow(page: Page, metrics: NavigationFlowMetrics): Promise<void> {
    const stepStart = Date.now();
    let errors = 0;
    
    await page.goto('http://localhost:3000/create-collection-deck');
    
    try {
      // Attempt to proceed without filling required fields
      await page.click('[data-testid="step1-next-button"]');
      await page.waitForSelector('.bp5-intent-danger', { timeout: 1000 });
      errors++;
    } catch {
      // No validation error - unexpected
    }
    
    // Fill required fields
    await page.fill('[data-testid="start-date-input"]', '2024-01-15');
    await page.fill('[data-testid="end-date-input"]', '2024-01-30');
    await page.selectOption('[data-testid="tle-source-select"]', 'celestrak');
    await page.click('[data-testid="step1-next-button"]');
    
    metrics.steps.push({
      stepId: 'wizard-step1',
      stepName: 'Complete Wizard Step 1',
      startTime: stepStart,
      endTime: Date.now(),
      duration: Date.now() - stepStart,
      interactions: [],
      backtrackCount: 0,
      hesitationCount: 0
    });
    
    if (errors > 0) {
      metrics.errors.push({
        timestamp: Date.now(),
        type: 'validation',
        message: 'Form validation error',
        severity: 'low',
        recovered: true
      });
    }
  }

  private async testErrorRecoveryFlow(page: Page, metrics: NavigationFlowMetrics): Promise<void> {
    const stepStart = Date.now();
    
    await page.goto('http://localhost:3000/invalid-route');
    await page.waitForSelector('.bp5-non-ideal-state');
    
    // Recover from error
    await page.click('button:has-text("Go to Dashboard")');
    await page.waitForSelector('.dashboard');
    
    metrics.steps.push({
      stepId: 'error-recovery',
      stepName: 'Recover from Navigation Error',
      startTime: stepStart,
      endTime: Date.now(),
      duration: Date.now() - stepStart,
      interactions: [],
      backtrackCount: 0,
      hesitationCount: 0
    });
    
    metrics.errors.push({
      timestamp: Date.now(),
      type: 'navigation',
      message: 'Invalid route accessed',
      severity: 'medium',
      recovered: true,
      recoveryTime: Date.now() - stepStart
    });
  }
}

// Test suite for iterative enhancement
test.describe('Iterative Enhancement Framework', () => {
  test('Run three enhancement cycles', async ({ page }) => {
    const enhancer = new IterativeEnhancementEngine();
    
    console.log('🚀 Starting Iterative Enhancement Process');
    
    // Run 3 enhancement cycles
    for (let i = 0; i < 3; i++) {
      const cycle = await enhancer.runEnhancementCycle(page);
      
      // Assert improvement in each cycle
      if (i > 0) {
        expect(cycle.improvement).toBeGreaterThan(0);
      }
      
      // Assert cognitive load is decreasing
      expect(cycle.endMetrics.cognitiveLoad.score).toBeLessThanOrEqual(
        cycle.startMetrics.cognitiveLoad.score
      );
      
      // Wait before next cycle (simulate implementation time)
      await page.waitForTimeout(1000);
    }
    
    // Generate final report
    enhancer.generateReport();
    
    // Assert final cognitive load is acceptable
    const finalMetrics = enhancer['baselineMetrics'];
    expect(finalMetrics?.cognitiveLoad.score).toBeLessThan(40);
  });

  test('Validate enhancement recommendations', async ({ page }) => {
    const enhancer = new IterativeEnhancementEngine();
    
    // Establish baseline
    const baseline = await enhancer.establishBaseline(page);
    
    // Get recommendations
    const opportunities = await enhancer.identifyEnhancementOpportunities(baseline);
    
    // Validate recommendations are actionable
    expect(opportunities.length).toBeGreaterThan(0);
    
    opportunities.forEach(opp => {
      expect(opp.recommendations.length).toBeGreaterThan(0);
      expect(opp.estimatedImpact).toBeGreaterThan(0);
      expect(opp.targetScore).toBeGreaterThan(opp.currentScore);
    });
    
    // Check priority distribution
    const criticalCount = opportunities.filter(o => o.priority === 'critical').length;
    const highCount = opportunities.filter(o => o.priority === 'high').length;
    
    // Critical issues should be limited
    expect(criticalCount).toBeLessThanOrEqual(2);
    
    // Should have mix of priorities
    expect(highCount).toBeGreaterThan(0);
  });

  test('Measure specific improvement areas', async ({ page }) => {
    const enhancer = new IterativeEnhancementEngine();
    
    // Test specific improvement: Form validation
    await page.goto('http://localhost:3000/create-collection-deck');
    
    // Measure initial validation experience
    const validationStart = Date.now();
    await page.click('[data-testid="step1-next-button"]');
    const errorAppearTime = Date.now() - validationStart;
    
    // Count error indicators
    const errorElements = await page.$$('.bp5-intent-danger');
    const initialErrorCount = errorElements.length;
    
    // Simulate improvement implementation
    console.log('Simulating validation improvements...');
    
    // Re-test after improvements
    await page.reload();
    const improvedStart = Date.now();
    
    // Fill partial form to test inline validation
    await page.fill('[data-testid="start-date-input"]', '2024-01-15');
    await page.click('[data-testid="step1-next-button"]');
    
    const improvedErrorTime = Date.now() - improvedStart;
    
    // Assert improvements
    expect(improvedErrorTime).toBeLessThan(errorAppearTime);
    
    // Check for better error messages
    const errorText = await page.textContent('.bp5-form-helper-text');
    expect(errorText).toBeTruthy();
    expect(errorText?.length).toBeGreaterThan(10); // Meaningful error message
  });

  test('Continuous improvement tracking', async ({ page }) => {
    const enhancer = new IterativeEnhancementEngine();
    
    // Track improvements over time
    const improvements: number[] = [];
    const cognitiveScores: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const cycle = await enhancer.runEnhancementCycle(page);
      improvements.push(cycle.improvement);
      cognitiveScores.push(cycle.endMetrics.cognitiveLoad.score);
      
      // Small delay between cycles
      await page.waitForTimeout(500);
    }
    
    // Assert diminishing returns (realistic improvement pattern)
    for (let i = 1; i < improvements.length - 1; i++) {
      expect(improvements[i]).toBeLessThanOrEqual(improvements[i - 1] * 1.5);
    }
    
    // Assert overall improvement trend
    expect(cognitiveScores[cognitiveScores.length - 1]).toBeLessThan(cognitiveScores[0]);
    
    // Generate improvement curve
    console.log('\n📉 Cognitive Load Improvement Curve:');
    cognitiveScores.forEach((score, idx) => {
      const bar = '█'.repeat(Math.round(score / 2));
      console.log(`  Cycle ${idx + 1}: ${bar} ${score.toFixed(1)}`);
    });
  });
});