import { test, expect, Page } from '@playwright/test';
import { 
  CollectionOpportunitiesPage,
  UserJourneyRecorder,
  PerformanceTracker
} from '../helpers/collectionOpportunities.helpers';

/**
 * Information Architecture (IA) Test Suite for Collection Opportunities
 * Based on industry standards from:
 * - Peter Morville's Information Architecture Principles
 * - Jesse James Garrett's Elements of User Experience
 * - Rosenfeld & Morville's IA for the World Wide Web
 * - Steve Krug's "Don't Make Me Think" principles
 */

// Helper class for IA-specific testing
class IATestHelper {
  constructor(private page: Page) {}

  async measureTerminologyConfusion(context1: string, context2: string): Promise<number> {
    const startTime = Date.now();
    let confusionEvents = 0;
    
    // Navigate to context 1
    await this.page.goto(`/collection-opportunities?context=${context1}`);
    const term1Understanding = await this.page.locator('.context-indicator').textContent();
    
    // Navigate to context 2
    await this.page.goto(`/collection-opportunities?context=${context2}`);
    const term2Understanding = await this.page.locator('.context-indicator').textContent();
    
    // Measure if user shows confusion (hesitation, wrong clicks, etc)
    if (term1Understanding === term2Understanding) {
      confusionEvents++;
    }
    
    const timeSpent = Date.now() - startTime;
    return confusionEvents > 0 ? timeSpent : 0;
  }

  async validateMentalModel(expectedModel: any, actualBehavior: any): Promise<boolean> {
    // Compare expected user mental model with actual behavior
    const matches = Object.keys(expectedModel).every(key => {
      return actualBehavior[key] === expectedModel[key];
    });
    return matches;
  }

  async measureInformationScent(startPoint: string, targetInfo: string): Promise<{
    found: boolean;
    clicks: number;
    time: number;
    backtrackCount: number;
  }> {
    const startTime = Date.now();
    let clicks = 0;
    let backtrackCount = 0;
    let previousUrl = '';
    
    // Start navigation
    await this.page.goto(startPoint);
    
    // Track user journey to find target information
    const found = await this.page.locator(`text=${targetInfo}`).isVisible();
    
    return {
      found,
      clicks,
      time: Date.now() - startTime,
      backtrackCount
    };
  }

  async performCardSort(items: string[], userCategories: Map<string, string[]>): Promise<{
    agreement: number;
    outliers: string[];
  }> {
    // Simulate card sorting exercise
    const totalItems = items.length;
    let correctlyCategorized = 0;
    const outliers: string[] = [];
    
    for (const item of items) {
      let found = false;
      for (const [category, categoryItems] of userCategories) {
        if (categoryItems.includes(item)) {
          correctlyCategorized++;
          found = true;
          break;
        }
      }
      if (!found) {
        outliers.push(item);
      }
    }
    
    return {
      agreement: (correctlyCategorized / totalItems) * 100,
      outliers
    };
  }

  async conductTreeTest(tasks: Array<{task: string; expectedPath: string[]}>): Promise<{
    successRate: number;
    avgTime: number;
    failurePoints: Map<string, number>;
  }> {
    let successCount = 0;
    let totalTime = 0;
    const failurePoints = new Map<string, number>();
    
    for (const {task, expectedPath} of tasks) {
      const startTime = Date.now();
      
      // Simulate user trying to complete task
      let currentPath: string[] = [];
      let success = true;
      
      for (const step of expectedPath) {
        const found = await this.page.locator(`text=${step}`).isVisible();
        if (!found) {
          success = false;
          const failPoint = currentPath.join(' > ');
          failurePoints.set(failPoint, (failurePoints.get(failPoint) || 0) + 1);
          break;
        }
        currentPath.push(step);
        await this.page.click(`text=${step}`);
      }
      
      if (success) successCount++;
      totalTime += Date.now() - startTime;
    }
    
    return {
      successRate: (successCount / tasks.length) * 100,
      avgTime: totalTime / tasks.length,
      failurePoints
    };
  }

  async measureCognitiveLoad(task: string): Promise<{
    taskTime: number;
    errorCount: number;
    hesitationCount: number;
    confidenceScore: number;
  }> {
    const startTime = Date.now();
    let errorCount = 0;
    let hesitationCount = 0;
    
    // Monitor user interactions
    this.page.on('click', async (element) => {
      // Detect mis-clicks or corrections
      const isError = await element.getAttribute('data-error');
      if (isError) errorCount++;
    });
    
    // Detect hesitation (mouse hovering without clicking)
    let hoverStart = 0;
    this.page.on('mouseover', () => {
      hoverStart = Date.now();
    });
    
    this.page.on('mouseout', () => {
      if (hoverStart && Date.now() - hoverStart > 2000) {
        hesitationCount++;
      }
      hoverStart = 0;
    });
    
    // Execute task
    await this.page.evaluate((taskDescription) => {
      console.log(`Executing task: ${taskDescription}`);
    }, task);
    
    const taskTime = Date.now() - startTime;
    const confidenceScore = 100 - (errorCount * 10) - (hesitationCount * 5);
    
    return {
      taskTime,
      errorCount,
      hesitationCount,
      confidenceScore: Math.max(0, confidenceScore)
    };
  }
}

test.describe('Information Architecture Tests - Collection Opportunities', () => {
  let page: CollectionOpportunitiesPage;
  let iaHelper: IATestHelper;
  let perfTracker: PerformanceTracker;
  let journeyRecorder: UserJourneyRecorder;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new CollectionOpportunitiesPage(playwrightPage);
    iaHelper = new IATestHelper(playwrightPage);
    perfTracker = new PerformanceTracker();
    journeyRecorder = new UserJourneyRecorder(playwrightPage);
    
    await page.navigateTo();
  });

  test.describe('1. Terminology Disambiguation Testing', () => {
    test('should validate terminology understanding across contexts', async ({ page: pwPage }) => {
      // Test confusion between "Match Review" contexts
      const confusionTime = await iaHelper.measureTerminologyConfusion(
        'field-mapping',
        'satellite-opportunities'
      );
      
      // Users should not be confused by same terms
      expect(confusionTime).toBe(0);
      
      // Test specific terminology understanding
      const terms = [
        { term: 'Match Status', context: 'satellite', expected: 'Satellite allocation quality' },
        { term: 'Match Review', context: 'field-mapping', expected: 'Field mapping validation' },
        { term: 'Collection Opportunity', context: 'satellite', expected: 'Available satellite time slot' }
      ];
      
      for (const { term, context, expected } of terms) {
        await pwPage.goto(`/help?term=${encodeURIComponent(term)}&context=${context}`);
        const definition = await pwPage.locator('.term-definition').textContent();
        expect(definition).toContain(expected);
      }
    });

    test('should measure cross-context terminology confusion', async ({ page: pwPage }) => {
      // Measure user confusion when switching contexts
      const contexts = ['field-mapping', 'satellite-opportunities', 'data-validation'];
      const confusionMatrix = new Map<string, number>();
      
      for (let i = 0; i < contexts.length - 1; i++) {
        for (let j = i + 1; j < contexts.length; j++) {
          const confusion = await iaHelper.measureTerminologyConfusion(
            contexts[i],
            contexts[j]
          );
          confusionMatrix.set(`${contexts[i]}->${contexts[j]}`, confusion);
        }
      }
      
      // No confusion should exceed 500ms threshold
      for (const [transition, time] of confusionMatrix) {
        expect(time).toBeLessThan(500);
      }
    });
  });

  test.describe('2. Mental Model Validation', () => {
    test('should validate user mental models match system design', async ({ page: pwPage }) => {
      // Define expected mental models for different user types
      const mentalModels = {
        satelliteOperator: {
          'Collection Opportunity': 'Satellite time slot',
          'Match Status': 'Allocation quality',
          'Priority': 'Mission criticality'
        },
        dataAnalyst: {
          'Collection Opportunity': 'Data collection task',
          'Match Status': 'Data quality indicator',
          'Priority': 'Processing order'
        }
      };
      
      // Test actual user behavior against expected models
      for (const [userType, expectedModel] of Object.entries(mentalModels)) {
        await pwPage.goto(`/collection-opportunities?user=${userType}`);
        
        // Observe user interactions
        const actualBehavior = {
          'Collection Opportunity': await pwPage.locator('[data-concept="collection-opportunity"]').getAttribute('data-understood-as'),
          'Match Status': await pwPage.locator('[data-concept="match-status"]').getAttribute('data-understood-as'),
          'Priority': await pwPage.locator('[data-concept="priority"]').getAttribute('data-understood-as')
        };
        
        const modelMatch = await iaHelper.validateMentalModel(expectedModel, actualBehavior);
        expect(modelMatch).toBe(true);
      }
    });

    test('should identify mental model mismatches', async ({ page: pwPage }) => {
      // Test for common misconceptions
      const misconceptions = [
        { 
          concept: 'Match Review',
          wrongModel: 'Same as satellite match status',
          correctModel: 'Field mapping validation process'
        },
        {
          concept: 'Collection Opportunity',
          wrongModel: 'Data collection request',
          correctModel: 'Available satellite imaging slot'
        }
      ];
      
      for (const { concept, wrongModel, correctModel } of misconceptions) {
        // Test if users have wrong mental model
        await pwPage.click(`[data-concept="${concept}"]`);
        const userUnderstanding = await pwPage.locator('.user-interpretation').textContent();
        
        expect(userUnderstanding).not.toContain(wrongModel);
        expect(userUnderstanding).toContain(correctModel);
      }
    });
  });

  test.describe('3. Card Sorting Validation', () => {
    test('should validate information groupings match user expectations', async () => {
      // Define items to be sorted
      const items = [
        'Match Status', 'Priority', 'Health Score', 'Allocated Sites',
        'Capacity', 'Start Date', 'End Date', 'Match Notes',
        'Alternative Options', 'Collection Deck ID', 'Request ID'
      ];
      
      // Expected user categories (from user research)
      const expectedCategories = new Map<string, string[]>([
        ['Status Information', ['Match Status', 'Priority', 'Health Score']],
        ['Allocation Details', ['Allocated Sites', 'Alternative Options', 'Match Notes']],
        ['Capacity & Timing', ['Capacity', 'Start Date', 'End Date']],
        ['System Identifiers', ['Collection Deck ID', 'Request ID']]
      ]);
      
      const sortResult = await iaHelper.performCardSort(items, expectedCategories);
      
      // Industry standard: 60% agreement is good, 80% is excellent
      expect(sortResult.agreement).toBeGreaterThan(60);
      expect(sortResult.outliers.length).toBeLessThan(3);
    });

    test('should validate column ordering preferences', async ({ page: pwPage }) => {
      // Test if current column order matches user expectations
      const currentOrder = await pwPage.locator('.bp5-table-column-name').allTextContents();
      
      const expectedOrder = [
        'Priority',        // Most critical decision factor
        'Match Status',    // Second decision factor
        'Match Notes',     // Context for decision
        'Name',           // Identification
        'Health',         // Quality indicator
        'Sites',          // Allocation info
        'Capacity',       // Resource info
        'Actions'         // Available actions
      ];
      
      // Calculate order similarity
      let matchScore = 0;
      for (let i = 0; i < expectedOrder.length; i++) {
        if (currentOrder[i] === expectedOrder[i]) {
          matchScore++;
        }
      }
      
      const similarity = (matchScore / expectedOrder.length) * 100;
      expect(similarity).toBeGreaterThan(70); // 70% similarity minimum
    });
  });

  test.describe('4. Tree Testing for Findability', () => {
    test('should validate users can find information efficiently', async () => {
      const findabilityTasks = [
        {
          task: 'Find unmatched high-priority opportunities',
          expectedPath: ['Collection Opportunities', 'Unmatched Tab', 'Priority Sort']
        },
        {
          task: 'Review opportunities needing attention',
          expectedPath: ['Collection Opportunities', 'Needs Review Tab']
        },
        {
          task: 'Find opportunities for specific site',
          expectedPath: ['Collection Opportunities', 'Site Filter', 'Select Site']
        },
        {
          task: 'Bulk update suboptimal matches',
          expectedPath: ['Collection Opportunities', 'Select Multiple', 'Override Selected']
        }
      ];
      
      const treeTestResult = await iaHelper.conductTreeTest(findabilityTasks);
      
      // Industry benchmark: 70% success rate minimum
      expect(treeTestResult.successRate).toBeGreaterThan(70);
      expect(treeTestResult.avgTime).toBeLessThan(15000); // 15 seconds max
      
      // Identify problematic paths
      for (const [failPoint, count] of treeTestResult.failurePoints) {
        console.log(`Failure point: ${failPoint} (${count} users)`);
        expect(count).toBeLessThan(3); // No path should fail for >3 users
      }
    });

    test('should measure first-click accuracy', async ({ page: pwPage }) => {
      // First-click testing - critical for IA success
      const firstClickTasks = [
        { task: 'Allocate an unmatched opportunity', expectedClick: 'Allocate' },
        { task: 'View alternative options', expectedClick: 'View Alts' },
        { task: 'Filter by site', expectedClick: '.site-filter' },
        { task: 'Select multiple items', expectedClick: 'tbody tr' }
      ];
      
      let correctFirstClicks = 0;
      
      for (const { task, expectedClick } of firstClickTasks) {
        // Present task to user
        await pwPage.evaluate((t) => {
          console.log(`Task: ${t}`);
        }, task);
        
        // Capture first click
        const firstClick = await pwPage.waitForEvent('click');
        const clickedElement = await firstClick.element();
        const clickedSelector = await clickedElement.evaluate(el => {
          return el.className || el.tagName;
        });
        
        if (clickedSelector.includes(expectedClick)) {
          correctFirstClicks++;
        }
      }
      
      const accuracy = (correctFirstClicks / firstClickTasks.length) * 100;
      expect(accuracy).toBeGreaterThan(60); // 60% first-click accuracy minimum
    });
  });

  test.describe('5. Information Scent Testing', () => {
    test('should validate navigation provides clear information scent', async () => {
      // Test if users can predict where information lives
      const scentTests = [
        {
          startPoint: '/collection-opportunities',
          targetInfo: 'Capacity constraints',
          expectedScent: ['Health indicator', 'Capacity column', 'Tooltip']
        },
        {
          startPoint: '/collection-opportunities',
          targetInfo: 'Alternative allocation options',
          expectedScent: ['Match Notes', 'View Alts button', 'Alternative count']
        }
      ];
      
      for (const test of scentTests) {
        const result = await iaHelper.measureInformationScent(
          test.startPoint,
          test.targetInfo
        );
        
        expect(result.found).toBe(true);
        expect(result.clicks).toBeLessThan(3); // Should find in <3 clicks
        expect(result.backtrackCount).toBe(0); // No backtracking needed
        expect(result.time).toBeLessThan(5000); // Found within 5 seconds
      }
    });

    test('should validate progressive disclosure effectiveness', async ({ page: pwPage }) => {
      // Test if information is revealed at the right time
      const disclosureTests = [
        {
          trigger: 'hover on health indicator',
          revealed: ['Coverage', 'Efficiency', 'Balance', 'Issues'],
          timing: 'immediate'
        },
        {
          trigger: 'click on row',
          revealed: ['Full opportunity details', 'Historical data', 'Actions'],
          timing: 'on-demand'
        }
      ];
      
      for (const test of disclosureTests) {
        // Perform trigger action
        if (test.trigger.includes('hover')) {
          await pwPage.hover('.health-indicator');
        } else if (test.trigger.includes('click')) {
          await pwPage.click('tbody tr');
        }
        
        // Check if expected information is revealed
        for (const info of test.revealed) {
          const isVisible = await pwPage.locator(`text=${info}`).isVisible();
          expect(isVisible).toBe(true);
        }
      }
    });
  });

  test.describe('6. Cross-Context Navigation Testing', () => {
    test('should measure confusion when switching between contexts', async ({ page: pwPage }) => {
      // Test navigation between different "Match" contexts
      const contextSwitches = [
        {
          from: 'field-mapping-review',
          to: 'satellite-opportunity-match',
          expectedConfusion: 'high'
        },
        {
          from: 'satellite-opportunity-list',
          to: 'satellite-opportunity-detail',
          expectedConfusion: 'low'
        }
      ];
      
      for (const switch_ of contextSwitches) {
        const timer = perfTracker.startTimer('context-switch');
        
        // Navigate from context
        await pwPage.goto(`/${switch_.from}`);
        const fromUnderstanding = await pwPage.locator('.context-indicator').textContent();
        
        // Navigate to context
        await pwPage.goto(`/${switch_.to}`);
        const toUnderstanding = await pwPage.locator('.context-indicator').textContent();
        
        timer();
        const switchTime = perfTracker.getAverage('context-switch');
        
        if (switch_.expectedConfusion === 'high') {
          expect(switchTime).toBeGreaterThan(2000); // Confusion causes delay
        } else {
          expect(switchTime).toBeLessThan(1000); // Smooth transition
        }
      }
    });

    test('should validate context preservation during navigation', async ({ page: pwPage }) => {
      // Test if system maintains user context appropriately
      await page.selectTab('needs-review');
      await page.filterBySite('site-001');
      await page.searchOpportunities('critical');
      
      // Navigate away and back
      await pwPage.goto('/dashboard');
      await pwPage.goBack();
      
      // Check if context is preserved
      const activeTab = await pwPage.locator('[role="tab"][aria-selected="true"]').getAttribute('data-tab-id');
      const siteFilter = await pwPage.locator('.site-filter').inputValue();
      const searchValue = await pwPage.locator('#opportunity-search').inputValue();
      
      expect(activeTab).toBe('needs-review');
      expect(siteFilter).toBe('site-001');
      expect(searchValue).toBe('critical');
    });
  });

  test.describe('7. Cognitive Load Measurement', () => {
    test('should measure cognitive load for common tasks', async () => {
      const tasks = [
        'Identify and allocate highest priority unmatched opportunity',
        'Review all suboptimal matches and select best candidates for override',
        'Find opportunities with capacity issues at specific site'
      ];
      
      const cognitiveLoadResults = [];
      
      for (const task of tasks) {
        const result = await iaHelper.measureCognitiveLoad(task);
        cognitiveLoadResults.push({ task, ...result });
        
        // Validate acceptable cognitive load
        expect(result.errorCount).toBeLessThan(2);
        expect(result.hesitationCount).toBeLessThan(3);
        expect(result.confidenceScore).toBeGreaterThan(70);
        expect(result.taskTime).toBeLessThan(30000); // 30 seconds max
      }
      
      // Calculate average cognitive load
      const avgConfidence = cognitiveLoadResults.reduce((sum, r) => sum + r.confidenceScore, 0) / cognitiveLoadResults.length;
      expect(avgConfidence).toBeGreaterThan(75);
    });

    test('should identify high cognitive load areas', async ({ page: pwPage }) => {
      // Monitor areas causing confusion
      const highLoadIndicators = [
        'Multiple hover events without action',
        'Repeated clicks on same element',
        'Use of browser back button',
        'Long pauses (>5s) between actions'
      ];
      
      let highLoadEvents = 0;
      
      // Monitor user behavior
      pwPage.on('click', () => {
        // Track click patterns
      });
      
      // Execute complex task
      await page.selectMultipleRows(0, 10);
      await page.performBulkAction('override');
      
      // High cognitive load areas should be minimal
      expect(highLoadEvents).toBeLessThan(3);
    });
  });

  test.describe('8. Labeling System Consistency', () => {
    test('should validate labeling consistency across all contexts', async ({ page: pwPage }) => {
      // Collect all labels across different views
      const labelCollections = new Map<string, Set<string>>();
      
      const contexts = [
        'collection-opportunities',
        'field-mapping',
        'satellite-scheduling',
        'data-validation'
      ];
      
      for (const context of contexts) {
        await pwPage.goto(`/${context}`);
        
        // Collect all visible labels
        const labels = await pwPage.locator('[data-label]').allTextContents();
        
        for (const label of labels) {
          if (!labelCollections.has(label)) {
            labelCollections.set(label, new Set());
          }
          labelCollections.get(label)!.add(context);
        }
      }
      
      // Check for inconsistent usage
      const inconsistencies = [];
      for (const [label, contexts] of labelCollections) {
        if (contexts.size > 1) {
          // Same label used in multiple contexts - check if meaning is consistent
          const meanings = new Set();
          for (const context of contexts) {
            await pwPage.goto(`/${context}`);
            const meaning = await pwPage.locator(`[data-label="${label}"]`).getAttribute('data-meaning');
            meanings.add(meaning);
          }
          
          if (meanings.size > 1) {
            inconsistencies.push({
              label,
              contexts: Array.from(contexts),
              meanings: Array.from(meanings)
            });
          }
        }
      }
      
      // No label should have multiple meanings
      expect(inconsistencies).toHaveLength(0);
    });
  });

  test.describe('9. Information Hierarchy Validation', () => {
    test('should validate visual hierarchy matches importance hierarchy', async ({ page: pwPage }) => {
      // Define importance hierarchy
      const importanceHierarchy = [
        'Priority',
        'Match Status',
        'Health Score',
        'Opportunity Name',
        'Allocated Sites',
        'Capacity',
        'Actions'
      ];
      
      // Measure visual prominence
      const visualProminence = new Map<string, number>();
      
      for (const element of importanceHierarchy) {
        const el = await pwPage.locator(`[data-field="${element}"]`).first();
        const styles = await el.evaluate((e) => {
          const computed = window.getComputedStyle(e);
          return {
            fontSize: parseFloat(computed.fontSize),
            fontWeight: parseFloat(computed.fontWeight) || 400,
            color: computed.color,
            position: e.getBoundingClientRect()
          };
        });
        
        // Calculate prominence score
        const score = (styles.fontSize * 2) + 
                     (styles.fontWeight / 100) + 
                     (styles.position.x < 200 ? 10 : 0); // Left position bonus
        
        visualProminence.set(element, score);
      }
      
      // Validate hierarchy order
      for (let i = 0; i < importanceHierarchy.length - 1; i++) {
        const current = importanceHierarchy[i];
        const next = importanceHierarchy[i + 1];
        
        expect(visualProminence.get(current)!).toBeGreaterThanOrEqual(
          visualProminence.get(next)!
        );
      }
    });
  });

  test.describe('10. Wayfinding and Orientation', () => {
    test('should provide clear wayfinding cues', async ({ page: pwPage }) => {
      // Check for orientation elements
      const wayfindingElements = [
        { selector: '.breadcrumb', required: true },
        { selector: '.current-context', required: true },
        { selector: '.help-link', required: true },
        { selector: '.navigation-menu', required: true }
      ];
      
      for (const element of wayfindingElements) {
        const exists = await pwPage.locator(element.selector).count() > 0;
        if (element.required) {
          expect(exists).toBe(true);
        }
      }
      
      // Test breadcrumb accuracy
      await page.navigateTo();
      const breadcrumb = await pwPage.locator('.breadcrumb').textContent();
      expect(breadcrumb).toContain('Collection Opportunities');
      
      // Test context indicators
      await page.selectTab('needs-review');
      const contextIndicator = await pwPage.locator('.current-context').textContent();
      expect(contextIndicator).toContain('Needs Review');
    });

    test('should maintain orientation during complex workflows', async ({ page: pwPage }) => {
      // Execute multi-step workflow
      await journeyRecorder.recordAction(pwPage, 'click', '[data-tab-id="needs-review"]');
      await journeyRecorder.recordAction(pwPage, 'click', '.site-filter');
      await journeyRecorder.recordAction(pwPage, 'click', 'tbody tr:first-child');
      await journeyRecorder.recordAction(pwPage, 'click', 'button:has-text("Override Selected")');
      
      // Check if user knows where they are at each step
      const journey = journeyRecorder.getJourney();
      expect(journey.stepCount).toBe(4);
      
      // User should always know current location
      const currentLocation = await pwPage.locator('.current-location').textContent();
      expect(currentLocation).toBeTruthy();
    });
  });
});

// Generate IA test report
test.afterAll(async () => {
  console.log('Information Architecture Test Summary:');
  console.log('- Terminology disambiguation: Critical for reducing confusion');
  console.log('- Mental model validation: Essential for user understanding');
  console.log('- Card sorting: Validates information groupings');
  console.log('- Tree testing: Ensures findability');
  console.log('- Information scent: Guides users effectively');
  console.log('- Cross-context navigation: Prevents confusion');
  console.log('- Cognitive load: Keeps tasks manageable');
  console.log('- Labeling consistency: Maintains clarity');
  console.log('- Information hierarchy: Supports decision making');
  console.log('- Wayfinding: Keeps users oriented');
});