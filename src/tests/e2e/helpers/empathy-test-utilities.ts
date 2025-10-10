import { Page, expect, Locator, BrowserContext } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

/**
 * Enhanced utilities for empathy-driven testing
 * Focused on real operator experiences and challenging conditions
 */

export interface UserPersona {
  name: string;
  role: string;
  challenges: string[];
  preferences: {
    fontSize?: number;
    contrastMode?: 'normal' | 'high' | 'inverted';
    inputSpeed?: 'slow' | 'normal' | 'fast';
    networkQuality?: 'offline' | '2g' | '3g' | '4g' | 'wifi';
  };
}

export interface TaskMetrics {
  startTime: number;
  endTime?: number;
  clicks: number;
  keystrokes: number;
  errors: number;
  hesitations: number; // Pauses > 3 seconds
  backtracking: number; // Going back to previous steps
}

export class EmpathyTestUtilities {
  private page: Page;
  private context: BrowserContext;
  private currentPersona?: UserPersona;
  private taskMetrics?: TaskMetrics;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  /**
   * Set up testing environment for a specific user persona
   */
  async setupPersona(persona: UserPersona): Promise<void> {
    this.currentPersona = persona;

    // Apply visual preferences
    if (persona.preferences.fontSize) {
      await this.page.addStyleTag({
        content: `
          html { font-size: ${persona.preferences.fontSize}% !important; }
          body * { font-size: inherit !important; }
        `
      });
    }

    if (persona.preferences.contrastMode === 'high') {
      await this.page.emulateMedia({ forcedColors: 'active' });
    }

    // Apply network conditions
    if (persona.preferences.networkQuality && persona.preferences.networkQuality !== 'wifi') {
      await this.applyNetworkConditions(persona.preferences.networkQuality);
    }

    // Apply input speed
    if (persona.preferences.inputSpeed === 'slow') {
      await this.page.setDefaultTimeout(60000); // Longer timeouts for slower users
    }
  }

  /**
   * Apply realistic network conditions
   */
  private async applyNetworkConditions(quality: string): Promise<void> {
    const conditions = {
      'offline': { offline: true },
      '2g': {
        downloadThroughput: 50 * 1024 / 8, // 50 kbps
        uploadThroughput: 20 * 1024 / 8,   // 20 kbps
        latency: 500,
      },
      '3g': {
        downloadThroughput: 750 * 1024 / 8,  // 750 kbps
        uploadThroughput: 250 * 1024 / 8,   // 250 kbps
        latency: 100,
      },
      '4g': {
        downloadThroughput: 4 * 1024 * 1024 / 8,  // 4 Mbps
        uploadThroughput: 3 * 1024 * 1024 / 8,   // 3 Mbps
        latency: 20,
      },
    };

    const condition = conditions[quality as keyof typeof conditions];
    if (condition) {
      // Create a CDP session to control network conditions
      const client = await this.context.newCDPSession(this.page);
      await client.send('Network.enable');
      
      if ('offline' in condition) {
        await client.send('Network.emulateNetworkConditions', {
          offline: true,
          downloadThroughput: 0,
          uploadThroughput: 0,
          latency: 0,
        });
      } else {
        await client.send('Network.emulateNetworkConditions', {
          offline: false,
          ...condition,
        });
      }
    }
  }

  /**
   * Start tracking task metrics
   */
  startTaskTracking(): void {
    this.taskMetrics = {
      startTime: Date.now(),
      clicks: 0,
      keystrokes: 0,
      errors: 0,
      hesitations: 0,
      backtracking: 0,
    };

    // Track user interactions
    this.page.on('click', () => {
      if (this.taskMetrics) this.taskMetrics.clicks++;
    });

    this.page.on('keydown', () => {
      if (this.taskMetrics) this.taskMetrics.keystrokes++;
    });
  }

  /**
   * Stop tracking and return task metrics
   */
  stopTaskTracking(): TaskMetrics | undefined {
    if (this.taskMetrics) {
      this.taskMetrics.endTime = Date.now();
    }
    return this.taskMetrics;
  }

  /**
   * Simulate stressed user behavior
   */
  async simulateStressedUser(): Promise<void> {
    // Rapid mouse movements
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * 1000;
      const y = Math.random() * 800;
      await this.page.mouse.move(x, y, { steps: 2 });
      await this.page.waitForTimeout(100);
    }

    // Quick scrolling
    await this.page.evaluate(() => {
      window.scrollBy(0, 300);
      setTimeout(() => window.scrollBy(0, -150), 100);
    });
  }

  /**
   * Simulate user with tremor or motor impairment
   */
  async simulateTremorClick(element: Locator): Promise<void> {
    const box = await element.boundingBox();
    if (!box) throw new Error('Element not visible');

    // Click with slight offset to simulate tremor
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;

    await this.page.mouse.click(
      box.x + box.width / 2 + offsetX,
      box.y + box.height / 2 + offsetY
    );
  }

  /**
   * Check if critical information is above the fold
   */
  async checkCriticalInfoVisibility(): Promise<boolean> {
    const viewport = this.page.viewportSize();
    if (!viewport) return false;

    const criticalElements = await this.page.locator('[data-priority="critical"], .critical, .urgent').all();
    
    for (const element of criticalElements) {
      const box = await element.boundingBox();
      if (box && box.y > viewport.height) {
        return false; // Critical info below fold
      }
    }
    
    return true;
  }

  /**
   * Measure cognitive load based on UI complexity
   */
  async measureCognitiveLoad(): Promise<{
    score: number;
    factors: string[];
  }> {
    let score = 0;
    const factors: string[] = [];

    // Count interactive elements
    const buttons = await this.page.locator('button:visible').count();
    const links = await this.page.locator('a:visible').count();
    const inputs = await this.page.locator('input:visible, select:visible, textarea:visible').count();

    const totalInteractive = buttons + links + inputs;
    if (totalInteractive > 15) {
      score += 3;
      factors.push(`High number of interactive elements: ${totalInteractive}`);
    } else if (totalInteractive > 9) {
      score += 2;
      factors.push(`Moderate number of interactive elements: ${totalInteractive}`);
    } else {
      score += 1;
    }

    // Check information density
    const textContent = await this.page.textContent('body');
    const wordCount = textContent?.split(/\s+/).length || 0;
    const screenArea = (this.page.viewportSize()?.width || 1920) * (this.page.viewportSize()?.height || 1080);
    const density = wordCount / (screenArea / 10000);

    if (density > 50) {
      score += 3;
      factors.push('High information density');
    } else if (density > 25) {
      score += 2;
      factors.push('Moderate information density');
    } else {
      score += 1;
    }

    // Check for competing visual elements
    const animations = await this.page.locator('[class*="animate"], [class*="transition"]').count();
    if (animations > 5) {
      score += 2;
      factors.push(`Multiple animations: ${animations}`);
    }

    return {
      score: Math.min(score, 10), // Cap at 10
      factors,
    };
  }

  /**
   * Test error recovery capabilities
   */
  async testErrorRecovery(triggerError: () => Promise<void>): Promise<{
    recoverable: boolean;
    recoveryMethods: string[];
  }> {
    await triggerError();

    const recoveryMethods: string[] = [];
    let recoverable = false;

    // Check for undo button
    if (await this.page.locator('button:has-text("Undo"), [aria-label*="Undo"]').isVisible()) {
      recoveryMethods.push('Undo button available');
      recoverable = true;
    }

    // Check for confirmation dialogs
    if (await this.page.locator('[role="dialog"]:has-text("Confirm")').isVisible()) {
      recoveryMethods.push('Confirmation dialog prevents accidental actions');
      recoverable = true;
    }

    // Check for error messages with guidance
    const errorMessage = await this.page.locator('[role="alert"], .error-message, .bp5-toast-message').first();
    if (await errorMessage.isVisible()) {
      const text = await errorMessage.textContent();
      if (text && text.length > 20) {
        recoveryMethods.push('Helpful error message provided');
        recoverable = true;
      }
    }

    return { recoverable, recoveryMethods };
  }

  /**
   * Run comprehensive accessibility scan
   */
  async runAccessibilityCheck(options?: {
    includedImpacts?: string[];
    excludeRules?: string[];
  }): Promise<any> {
    const results = await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Filter results based on options
    let violations = results.violations;
    
    if (options?.includedImpacts) {
      violations = violations.filter(v => 
        options.includedImpacts!.includes(v.impact!)
      );
    }

    if (options?.excludeRules) {
      violations = violations.filter(v => 
        !options.excludeRules!.includes(v.id)
      );
    }

    // Attach violations to test results
    if (violations.length > 0) {
      await this.page.evaluate(() => {
        console.error('[ACCESSIBILITY VIOLATIONS FOUND]');
      });
    }

    return {
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
    };
  }

  /**
   * Simulate realistic typing with variable speed and corrections
   */
  async typeRealistically(locator: Locator, text: string, options?: {
    speed?: 'slow' | 'normal' | 'fast';
    errorRate?: number; // 0-1, probability of typo
  }): Promise<void> {
    const speeds = {
      slow: { min: 100, max: 300 },
      normal: { min: 50, max: 150 },
      fast: { min: 20, max: 80 },
    };

    const speed = speeds[options?.speed || 'normal'];
    const errorRate = options?.errorRate || 0.05;

    await locator.click();
    
    for (let i = 0; i < text.length; i++) {
      // Occasionally make a typo
      if (Math.random() < errorRate && i > 0 && i < text.length - 1) {
        // Type wrong character
        const wrongChar = String.fromCharCode(text.charCodeAt(i) + 1);
        await locator.type(wrongChar, { delay: speed.min });
        await this.page.waitForTimeout(300); // Pause to "notice" error
        await locator.press('Backspace');
        await this.page.waitForTimeout(100);
      }

      // Type correct character with variable delay
      const delay = Math.random() * (speed.max - speed.min) + speed.min;
      await locator.type(text[i], { delay });
    }
  }

  /**
   * Test keyboard navigation efficiency
   */
  async testKeyboardNavigation(targetElement: Locator): Promise<{
    tabStops: number;
    timeToReach: number;
    accessible: boolean;
  }> {
    // Start from top of page
    await this.page.keyboard.press('Control+Home');
    
    const startTime = Date.now();
    let tabStops = 0;
    let reached = false;

    // Tab through page until we reach target or give up after 50 tabs
    for (let i = 0; i < 50; i++) {
      await this.page.keyboard.press('Tab');
      tabStops++;

      // Check if focused element matches target
      const focused = await this.page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          text: el?.textContent?.substring(0, 50),
          id: el?.id,
          className: el?.className,
        };
      });

      // Check if we've reached the target
      const targetBox = await targetElement.boundingBox();
      const focusedBox = await this.page.locator(':focus').boundingBox();

      if (targetBox && focusedBox &&
          Math.abs(targetBox.x - focusedBox.x) < 5 &&
          Math.abs(targetBox.y - focusedBox.y) < 5) {
        reached = true;
        break;
      }
    }

    const timeToReach = Date.now() - startTime;

    return {
      tabStops,
      timeToReach,
      accessible: reached,
    };
  }

  /**
   * Check if UI provides adequate feedback
   */
  async checkFeedbackMechanisms(): Promise<{
    hasLoadingIndicators: boolean;
    hasProgressFeedback: boolean;
    hasSuccessConfirmation: boolean;
    hasErrorGuidance: boolean;
  }> {
    return {
      hasLoadingIndicators: await this.page.locator('.loading, .spinner, [aria-busy="true"]').count() > 0,
      hasProgressFeedback: await this.page.locator('progress, [role="progressbar"], .progress').count() > 0,
      hasSuccessConfirmation: await this.page.locator('.success, [role="status"], .bp5-toast-container').count() > 0,
      hasErrorGuidance: await this.page.locator('[role="alert"], .error:has(button), .error:has(a)').count() > 0,
    };
  }

  /**
   * Test multi-step workflow with checkpoints
   */
  async testWorkflowWithCheckpoints(steps: Array<{
    name: string;
    action: () => Promise<void>;
    validation: () => Promise<boolean>;
  }>): Promise<{
    completed: boolean;
    stepsCompleted: number;
    failures: string[];
    totalTime: number;
  }> {
    const startTime = Date.now();
    const failures: string[] = [];
    let stepsCompleted = 0;

    for (const step of steps) {
      try {
        await step.action();
        const isValid = await step.validation();
        
        if (isValid) {
          stepsCompleted++;
        } else {
          failures.push(`Validation failed for step: ${step.name}`);
          break;
        }
      } catch (error) {
        failures.push(`Error in step ${step.name}: ${error}`);
        break;
      }
    }

    return {
      completed: stepsCompleted === steps.length,
      stepsCompleted,
      failures,
      totalTime: Date.now() - startTime,
    };
  }
}