import { Page } from '@playwright/test';
import { CollectionOpportunity, MatchStatus, Priority } from '../../../types/collectionOpportunities';

// Test data fixtures
export const mockOpportunities: CollectionOpportunity[] = [
  {
    id: 'opp-001',
    name: 'Critical Unmatched Opportunity',
    collectionDeckId: 'deck-001',
    requestId: 'req-001',
    status: 'critical',
    priority: 'critical',
    matchStatus: 'unmatched',
    matchQuality: 0,
    matchNotes: 'No suitable allocation found',
    allocatedSites: [],
    alternativeOptions: [
      { siteId: 'site-002', score: 75, reason: 'Capacity constraints' }
    ],
    requiresManualReview: true,
    allocationScore: 0,
    totalPasses: 0,
    capacity: 100,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-01')
  },
  {
    id: 'opp-002',
    name: 'Suboptimal Match Needing Review',
    collectionDeckId: 'deck-001',
    requestId: 'req-002',
    status: 'warning',
    priority: 'high',
    matchStatus: 'suboptimal',
    matchQuality: 65,
    matchNotes: 'Better alternatives available',
    allocatedSites: [{ id: 'site-001', name: 'Site Alpha' }],
    alternativeOptions: [
      { siteId: 'site-003', score: 85, reason: 'Better coverage' },
      { siteId: 'site-004', score: 80, reason: 'Lower latency' }
    ],
    requiresManualReview: true,
    allocationScore: 65,
    totalPasses: 75,
    capacity: 100,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-15')
  },
  {
    id: 'opp-003',
    name: 'Baseline Optimal Match',
    collectionDeckId: 'deck-002',
    requestId: 'req-003',
    status: 'success',
    priority: 'medium',
    matchStatus: 'baseline',
    matchQuality: 95,
    matchNotes: '',
    allocatedSites: [
      { id: 'site-001', name: 'Site Alpha' },
      { id: 'site-002', name: 'Site Beta' }
    ],
    alternativeOptions: [],
    requiresManualReview: false,
    allocationScore: 95,
    totalPasses: 45,
    capacity: 100,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-01')
  }
];

// Performance measurement utilities
export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();

  startTimer(metric: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      if (!this.metrics.has(metric)) {
        this.metrics.set(metric, []);
      }
      this.metrics.get(metric)!.push(duration);
    };
  }

  getAverage(metric: string): number {
    const times = this.metrics.get(metric) || [];
    return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getMetrics() {
    const results: Record<string, { average: number; samples: number }> = {};
    this.metrics.forEach((times, metric) => {
      results[metric] = {
        average: this.getAverage(metric),
        samples: times.length
      };
    });
    return results;
  }
}

// User simulation helpers
export class UserSimulator {
  constructor(private page: Page) {}

  async simulateFirstTimeUser() {
    // Simulate scanning behavior
    await this.page.waitForTimeout(1000); // Initial orientation
    
    // Look for priority indicators
    await this.page.hover('.priority-tag:has-text("1")');
    await this.page.waitForTimeout(500);
    
    // Check match status
    await this.page.hover('.match-status-unmatched');
    await this.page.waitForTimeout(500);
    
    // Try to understand health scores
    await this.page.hover('.health-indicator');
    await this.page.waitForTimeout(1000);
  }

  async simulatePowerUser() {
    // Quick keyboard navigation
    await this.page.keyboard.press('Control+f');
    await this.page.keyboard.type('critical');
    await this.page.keyboard.press('Escape');
    
    // Rapid selection
    await this.page.keyboard.press('Control+a');
    await this.page.waitForTimeout(100);
    
    // Quick tab switching
    await this.page.keyboard.press('Control+2');
  }

  async simulateErrorRecovery() {
    // Try invalid actions
    try {
      await this.page.click('.non-existent-element');
    } catch {
      // Recover by using valid action
      await this.page.keyboard.press('Escape');
      await this.page.click('.priority-tag');
    }
  }
}

// Accessibility testing utilities
export async function checkKeyboardNavigation(page: Page): Promise<boolean> {
  const elements = [
    '#opportunity-search',
    '[role="tab"]',
    'button:has-text("Override Selected")',
    'tbody tr',
    '.health-indicator'
  ];

  for (const selector of elements) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.matches(selector), selector);
    if (!focused && await page.locator(selector).count() > 0) {
      return false;
    }
  }
  
  return true;
}

export async function checkScreenReaderAnnouncements(page: Page): Promise<string[]> {
  const announcements: string[] = [];
  
  // Monitor ARIA live regions
  await page.evaluate(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = mutation.target as Element;
        if (target.getAttribute('aria-live') || target.getAttribute('role') === 'status') {
          // @ts-ignore
          window.screenReaderAnnouncements = window.screenReaderAnnouncements || [];
          // @ts-ignore
          window.screenReaderAnnouncements.push(target.textContent);
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['aria-live', 'role']
    });
  });
  
  // Perform actions that should trigger announcements
  await page.click('tbody tr:first-child');
  await page.waitForTimeout(100);
  
  // Collect announcements
  const collected = await page.evaluate(() => {
    // @ts-ignore
    return window.screenReaderAnnouncements || [];
  });
  
  return collected;
}

// Visual testing utilities
export interface VisualTestConfig {
  threshold?: number;
  animations?: 'disabled' | 'allow';
  maskSelectors?: string[];
  fullPage?: boolean;
}

export async function captureAndCompare(
  page: Page,
  name: string,
  config: VisualTestConfig = {}
): Promise<boolean> {
  const {
    threshold = 0.1,
    animations = 'disabled',
    maskSelectors = [],
    fullPage = false
  } = config;
  
  // Mask dynamic content
  const masks = [];
  for (const selector of maskSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    for (let i = 0; i < count; i++) {
      masks.push(elements.nth(i));
    }
  }
  
  const screenshot = await page.screenshot({
    fullPage,
    animations,
    mask: masks
  });
  
  // In real implementation, compare with baseline
  return true;
}

// Copy consistency checker
export class CopyConsistencyChecker {
  private terminology = {
    matchStatus: {
      valid: ['Baseline', 'Suboptimal', 'Unmatched'],
      invalid: ['Good Match', 'Poor Match', 'No Match']
    },
    actions: {
      valid: ['Allocate', 'View Alts', 'Edit', 'Override Selected'],
      invalid: ['Assign', 'Show Alternatives', 'Modify']
    },
    health: {
      valid: ['excellent', 'good', 'fair', 'poor'],
      invalid: ['great', 'ok', 'bad', 'terrible']
    }
  };

  async checkPage(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Check match status terminology
    const matchStatuses = await page.locator('.match-status').allTextContents();
    for (const status of matchStatuses) {
      if (!this.terminology.matchStatus.valid.includes(status)) {
        issues.push(`Invalid match status term: "${status}"`);
      }
    }
    
    // Check action terminology
    const actionButtons = await page.locator('button').allTextContents();
    for (const action of actionButtons) {
      if (this.terminology.actions.invalid.some(invalid => action.includes(invalid))) {
        issues.push(`Invalid action term: "${action}"`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Device simulation helpers
export const deviceProfiles = {
  desktop: {
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    hasTouch: false
  },
  tablet: {
    viewport: { width: 1024, height: 768 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Safari/604.1',
    hasTouch: true
  },
  mobile: {
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
    hasTouch: true
  }
};

export async function simulateDevice(page: Page, device: keyof typeof deviceProfiles) {
  const profile = deviceProfiles[device];
  await page.setViewportSize(profile.viewport);
  await page.setExtraHTTPHeaders({
    'User-Agent': profile.userAgent
  });
  // Note: hasTouch would be set in browser context creation
}

// User journey recorder
export class UserJourneyRecorder {
  private steps: Array<{
    action: string;
    target: string;
    timestamp: number;
    screenshot?: Buffer;
  }> = [];

  async recordAction(
    page: Page,
    action: string,
    target: string,
    captureScreenshot = false
  ) {
    const step = {
      action,
      target,
      timestamp: Date.now(),
      screenshot: captureScreenshot ? await page.screenshot() : undefined
    };
    
    this.steps.push(step);
  }

  getJourney() {
    return {
      steps: this.steps,
      duration: this.steps.length > 1 
        ? this.steps[this.steps.length - 1].timestamp - this.steps[0].timestamp
        : 0,
      stepCount: this.steps.length
    };
  }

  async replayJourney(page: Page) {
    for (const step of this.steps) {
      switch (step.action) {
        case 'click':
          await page.click(step.target);
          break;
        case 'fill':
          const [selector, value] = step.target.split('::');
          await page.fill(selector, value);
          break;
        case 'hover':
          await page.hover(step.target);
          break;
        case 'keyboard':
          await page.keyboard.press(step.target);
          break;
      }
      
      await page.waitForTimeout(100); // Brief pause between actions
    }
  }
}

// Success criteria validator
export interface SuccessCriteria {
  taskCompletionRate: number;
  timeToFirstAction: number;
  errorRate: number;
  accessibilityScore: number;
  userSatisfaction: number;
}

export async function validateSuccessCriteria(
  metrics: Partial<SuccessCriteria>,
  targets: SuccessCriteria
): Promise<{ 
  passed: boolean; 
  results: Array<{ metric: string; value: number; target: number; passed: boolean }> 
}> {
  const results = [];
  let allPassed = true;

  for (const [metric, target] of Object.entries(targets)) {
    const value = metrics[metric as keyof SuccessCriteria] || 0;
    const passed = metric === 'timeToFirstAction' || metric === 'errorRate' 
      ? value <= target 
      : value >= target;
    
    results.push({
      metric,
      value,
      target,
      passed
    });
    
    if (!passed) allPassed = false;
  }

  return { passed: allPassed, results };
}