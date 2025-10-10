import { Page } from '@playwright/test';

/**
 * Advanced IA Testing Utilities
 * Based on industry standards and research methodologies
 */

// Cognitive Load Measurement System
export class CognitiveLoadAnalyzer {
  private eventLog: Array<{
    timestamp: number;
    eventType: string;
    details: any;
  }> = [];

  constructor(private page: Page) {
    this.setupEventTracking();
  }

  private setupEventTracking() {
    // Track mouse movements for hesitation detection
    this.page.on('mousemove', async (event: any) => {
      this.eventLog.push({
        timestamp: Date.now(),
        eventType: 'mousemove',
        details: { x: event.clientX, y: event.clientY }
      });
    });

    // Track clicks for error detection
    this.page.on('click', async (element) => {
      const selector = await element.evaluate(el => {
        return el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className}` : '');
      });
      
      this.eventLog.push({
        timestamp: Date.now(),
        eventType: 'click',
        details: { selector }
      });
    });
  }

  analyzeTaskExecution(startTime: number, endTime: number): {
    cognitiveLoadScore: number;
    indicators: {
      hesitations: number;
      backtracking: number;
      errorClicks: number;
      pauseDuration: number;
      mouseDistance: number;
    };
    confidence: number;
  } {
    const relevantEvents = this.eventLog.filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime
    );

    // Analyze hesitations (mouse hovering without clicking)
    let hesitations = 0;
    let lastMoveTime = startTime;
    let totalPauseDuration = 0;

    for (const event of relevantEvents) {
      if (event.eventType === 'mousemove') {
        const timeSinceLastMove = event.timestamp - lastMoveTime;
        if (timeSinceLastMove > 2000) { // 2 second pause
          hesitations++;
          totalPauseDuration += timeSinceLastMove;
        }
        lastMoveTime = event.timestamp;
      }
    }

    // Analyze backtracking (going back to previous elements)
    const clickSequence = relevantEvents
      .filter(e => e.eventType === 'click')
      .map(e => e.details.selector);
    
    let backtracking = 0;
    for (let i = 2; i < clickSequence.length; i++) {
      if (clickSequence[i] === clickSequence[i - 2]) {
        backtracking++;
      }
    }

    // Analyze error clicks (clicks followed immediately by different clicks)
    let errorClicks = 0;
    for (let i = 1; i < relevantEvents.length; i++) {
      if (relevantEvents[i].eventType === 'click' && 
          relevantEvents[i - 1].eventType === 'click') {
        const timeBetween = relevantEvents[i].timestamp - relevantEvents[i - 1].timestamp;
        if (timeBetween < 500) { // Quick correction
          errorClicks++;
        }
      }
    }

    // Calculate mouse travel distance
    let mouseDistance = 0;
    let lastX = 0, lastY = 0;
    for (const event of relevantEvents) {
      if (event.eventType === 'mousemove') {
        if (lastX && lastY) {
          const dx = event.details.x - lastX;
          const dy = event.details.y - lastY;
          mouseDistance += Math.sqrt(dx * dx + dy * dy);
        }
        lastX = event.details.x;
        lastY = event.details.y;
      }
    }

    // Calculate cognitive load score (0-100, lower is better)
    const cognitiveLoadScore = Math.min(100,
      (hesitations * 10) +
      (backtracking * 15) +
      (errorClicks * 20) +
      (totalPauseDuration / 1000) +
      (mouseDistance / 10000)
    );

    // Calculate confidence (inverse of cognitive load)
    const confidence = Math.max(0, 100 - cognitiveLoadScore);

    return {
      cognitiveLoadScore,
      indicators: {
        hesitations,
        backtracking,
        errorClicks,
        pauseDuration: totalPauseDuration,
        mouseDistance: Math.round(mouseDistance)
      },
      confidence
    };
  }

  reset() {
    this.eventLog = [];
  }
}

// Mental Model Validation Framework
export class MentalModelValidator {
  private userPredictions = new Map<string, string>();
  private actualBehaviors = new Map<string, string>();

  async captureUserPrediction(
    page: Page,
    concept: string,
    scenario: string
  ): Promise<void> {
    // Simulate asking user what they expect
    const prediction = await page.evaluate((c, s) => {
      // In real testing, this would be a user survey
      return prompt(`In the context of ${s}, what do you expect ${c} to mean?`);
    }, concept, scenario);
    
    if (prediction) {
      this.userPredictions.set(`${concept}:${scenario}`, prediction);
    }
  }

  async observeActualBehavior(
    page: Page,
    concept: string,
    scenario: string
  ): Promise<void> {
    // Observe how user actually interacts with the concept
    const behavior = await page.locator(`[data-concept="${concept}"]`)
      .getAttribute('data-user-behavior');
    
    if (behavior) {
      this.actualBehaviors.set(`${concept}:${scenario}`, behavior);
    }
  }

  validateAlignment(): {
    overallAlignment: number;
    mismatches: Array<{
      concept: string;
      expected: string;
      actual: string;
    }>;
  } {
    const mismatches: Array<{
      concept: string;
      expected: string;
      actual: string;
    }> = [];

    let matches = 0;
    let total = 0;

    for (const [key, expected] of this.userPredictions) {
      const actual = this.actualBehaviors.get(key);
      total++;
      
      if (actual === expected) {
        matches++;
      } else {
        mismatches.push({
          concept: key.split(':')[0],
          expected,
          actual: actual || 'not observed'
        });
      }
    }

    return {
      overallAlignment: total > 0 ? (matches / total) * 100 : 0,
      mismatches
    };
  }
}

// Information Scent Analyzer
export class InformationScentAnalyzer {
  private navigationPath: string[] = [];
  private backtrackCount = 0;
  private timeSpent = 0;
  private startTime = 0;

  startTracking() {
    this.startTime = Date.now();
    this.navigationPath = [];
    this.backtrackCount = 0;
  }

  recordNavigation(location: string) {
    // Check for backtracking
    if (this.navigationPath.length > 1 && 
        this.navigationPath[this.navigationPath.length - 2] === location) {
      this.backtrackCount++;
    }
    this.navigationPath.push(location);
  }

  stopTracking(): {
    scentStrength: number;
    efficiency: number;
    path: string[];
    metrics: {
      steps: number;
      backtracking: number;
      timeSpent: number;
      directness: number;
    };
  } {
    this.timeSpent = Date.now() - this.startTime;
    
    // Calculate optimal path length (assumed to be 3 for most tasks)
    const optimalPathLength = 3;
    const actualPathLength = this.navigationPath.length;
    
    // Calculate directness (0-1, higher is better)
    const directness = Math.min(1, optimalPathLength / actualPathLength);
    
    // Calculate efficiency (0-100, higher is better)
    const efficiency = Math.max(0,
      100 - (this.backtrackCount * 20) - ((actualPathLength - optimalPathLength) * 10)
    );
    
    // Calculate scent strength (0-100, higher is better)
    const scentStrength = Math.max(0,
      100 - (this.backtrackCount * 30) - (this.timeSpent / 1000)
    );

    return {
      scentStrength,
      efficiency,
      path: this.navigationPath,
      metrics: {
        steps: actualPathLength,
        backtracking: this.backtrackCount,
        timeSpent: this.timeSpent,
        directness
      }
    };
  }
}

// Tree Testing Framework
export interface TreeTestTask {
  id: string;
  description: string;
  targetLocation: string[];
  acceptableAlternatives?: string[][];
}

export class TreeTestRunner {
  private results: Map<string, {
    success: boolean;
    path: string[];
    time: number;
    directSuccess: boolean;
  }> = new Map();

  async runTask(
    page: Page,
    task: TreeTestTask
  ): Promise<void> {
    const startTime = Date.now();
    const actualPath: string[] = [];
    let success = false;
    let directSuccess = false;

    // Present task to user
    await page.evaluate((desc) => {
      alert(`Task: ${desc}`);
    }, task.description);

    // Track navigation
    for (let i = 0; i < task.targetLocation.length; i++) {
      const expectedStep = task.targetLocation[i];
      
      // Wait for user to make a choice
      const clicked = await page.waitForSelector('[data-tree-node]', { 
        state: 'attached',
        timeout: 30000 
      });
      
      const nodeName = await clicked.getAttribute('data-tree-node');
      actualPath.push(nodeName || 'unknown');
      
      if (nodeName === expectedStep) {
        if (i === task.targetLocation.length - 1) {
          success = true;
          directSuccess = actualPath.length === task.targetLocation.length;
        }
      } else {
        // Check alternatives
        if (task.acceptableAlternatives?.[i]?.includes(nodeName || '')) {
          continue;
        } else {
          break; // Wrong path
        }
      }
    }

    this.results.set(task.id, {
      success,
      path: actualPath,
      time: Date.now() - startTime,
      directSuccess
    });
  }

  getResults(): {
    overallSuccessRate: number;
    directSuccessRate: number;
    averageTime: number;
    taskResults: Map<string, any>;
  } {
    let successCount = 0;
    let directSuccessCount = 0;
    let totalTime = 0;

    for (const result of this.results.values()) {
      if (result.success) successCount++;
      if (result.directSuccess) directSuccessCount++;
      totalTime += result.time;
    }

    const taskCount = this.results.size;

    return {
      overallSuccessRate: taskCount > 0 ? (successCount / taskCount) * 100 : 0,
      directSuccessRate: taskCount > 0 ? (directSuccessCount / taskCount) * 100 : 0,
      averageTime: taskCount > 0 ? totalTime / taskCount : 0,
      taskResults: this.results
    };
  }
}

// Card Sorting Analyzer
export interface CardItem {
  id: string;
  label: string;
  description?: string;
}

export interface CardCategory {
  id: string;
  name: string;
  items: string[]; // item IDs
}

export class CardSortAnalyzer {
  analyzeAgreement(
    userSorts: CardCategory[][],
    expectedCategories: CardCategory[]
  ): {
    overallAgreement: number;
    categoryAgreement: Map<string, number>;
    itemAgreement: Map<string, number>;
    dendrogramData: any;
  } {
    const categoryAgreement = new Map<string, number>();
    const itemAgreement = new Map<string, number>();
    
    // Calculate how often items are grouped together
    const coOccurrenceMatrix = new Map<string, Map<string, number>>();
    
    for (const userSort of userSorts) {
      for (const category of userSort) {
        const items = category.items;
        
        // Track co-occurrence
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const key1 = items[i];
            const key2 = items[j];
            
            if (!coOccurrenceMatrix.has(key1)) {
              coOccurrenceMatrix.set(key1, new Map());
            }
            
            const count = coOccurrenceMatrix.get(key1)!.get(key2) || 0;
            coOccurrenceMatrix.get(key1)!.set(key2, count + 1);
          }
        }
      }
    }
    
    // Compare with expected categories
    let totalAgreement = 0;
    let totalComparisons = 0;
    
    for (const expectedCategory of expectedCategories) {
      let categoryMatches = 0;
      
      for (const userSort of userSorts) {
        const matchingCategory = userSort.find(cat => {
          // Check if at least 60% of items match
          const intersection = cat.items.filter(item => 
            expectedCategory.items.includes(item)
          );
          return intersection.length / expectedCategory.items.length >= 0.6;
        });
        
        if (matchingCategory) {
          categoryMatches++;
        }
      }
      
      const agreement = (categoryMatches / userSorts.length) * 100;
      categoryAgreement.set(expectedCategory.name, agreement);
      totalAgreement += agreement;
      totalComparisons++;
    }
    
    // Calculate item-level agreement
    for (const [item, coOccurrences] of coOccurrenceMatrix) {
      let maxAgreement = 0;
      
      for (const [otherItem, count] of coOccurrences) {
        const agreement = (count / userSorts.length) * 100;
        maxAgreement = Math.max(maxAgreement, agreement);
      }
      
      itemAgreement.set(item, maxAgreement);
    }
    
    return {
      overallAgreement: totalComparisons > 0 ? totalAgreement / totalComparisons : 0,
      categoryAgreement,
      itemAgreement,
      dendrogramData: this.generateDendrogram(coOccurrenceMatrix)
    };
  }

  private generateDendrogram(coOccurrenceMatrix: Map<string, Map<string, number>>): any {
    // Simplified dendrogram data for hierarchical clustering visualization
    // In a real implementation, this would use a clustering algorithm
    return {
      name: 'root',
      children: Array.from(coOccurrenceMatrix.keys()).map(item => ({
        name: item,
        value: coOccurrenceMatrix.get(item)!.size
      }))
    };
  }
}

// First Click Testing
export class FirstClickTester {
  private clickData: Array<{
    task: string;
    expectedTarget: string;
    actualTarget: string;
    time: number;
    success: boolean;
  }> = [];

  async testFirstClick(
    page: Page,
    task: string,
    expectedTarget: string
  ): Promise<void> {
    // Present task
    await page.evaluate((t) => {
      console.log(`Task: ${t}`);
    }, task);

    const startTime = Date.now();

    // Capture first click
    const firstClick = await page.waitForEvent('click', { timeout: 30000 });
    const clickedElement = await firstClick.element();
    
    const actualTarget = await clickedElement.evaluate(el => {
      return el.getAttribute('data-testid') || 
             el.className || 
             el.tagName.toLowerCase();
    });

    const time = Date.now() - startTime;
    const success = actualTarget.includes(expectedTarget) || 
                   expectedTarget.includes(actualTarget);

    this.clickData.push({
      task,
      expectedTarget,
      actualTarget,
      time,
      success
    });
  }

  getResults(): {
    overallSuccess: number;
    averageTime: number;
    taskBreakdown: typeof this.clickData;
  } {
    const successCount = this.clickData.filter(d => d.success).length;
    const totalTime = this.clickData.reduce((sum, d) => sum + d.time, 0);

    return {
      overallSuccess: this.clickData.length > 0 
        ? (successCount / this.clickData.length) * 100 
        : 0,
      averageTime: this.clickData.length > 0 
        ? totalTime / this.clickData.length 
        : 0,
      taskBreakdown: this.clickData
    };
  }
}

// Terminology Consistency Checker
export class TerminologyConsistencyChecker {
  private termUsage = new Map<string, Map<string, string>>(); // term -> context -> meaning

  recordTermUsage(term: string, context: string, meaning: string) {
    if (!this.termUsage.has(term)) {
      this.termUsage.set(term, new Map());
    }
    this.termUsage.get(term)!.set(context, meaning);
  }

  analyzeConsistency(): {
    consistencyScore: number;
    inconsistencies: Array<{
      term: string;
      contexts: Array<{ context: string; meaning: string }>;
    }>;
    recommendations: string[];
  } {
    const inconsistencies: Array<{
      term: string;
      contexts: Array<{ context: string; meaning: string }>;
    }> = [];
    
    let consistentTerms = 0;
    let totalTerms = 0;

    for (const [term, contexts] of this.termUsage) {
      totalTerms++;
      const meanings = new Set(contexts.values());
      
      if (meanings.size === 1) {
        consistentTerms++;
      } else {
        inconsistencies.push({
          term,
          contexts: Array.from(contexts.entries()).map(([context, meaning]) => ({
            context,
            meaning
          }))
        });
      }
    }

    const consistencyScore = totalTerms > 0 
      ? (consistentTerms / totalTerms) * 100 
      : 100;

    const recommendations = this.generateRecommendations(inconsistencies);

    return {
      consistencyScore,
      inconsistencies,
      recommendations
    };
  }

  private generateRecommendations(
    inconsistencies: Array<{ term: string; contexts: any[] }>
  ): string[] {
    const recommendations: string[] = [];

    for (const inconsistency of inconsistencies) {
      if (inconsistency.term.toLowerCase().includes('match')) {
        recommendations.push(
          `Disambiguate "${inconsistency.term}" by using context-specific terms: ` +
          `"Field Match" for data mapping, "Satellite Match" for opportunities`
        );
      } else {
        recommendations.push(
          `Standardize "${inconsistency.term}" across all contexts or use distinct terms`
        );
      }
    }

    return recommendations;
  }
}