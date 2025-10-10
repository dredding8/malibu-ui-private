import { Page } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface VisualValidationOptions {
  threshold?: number;
  maxDiffPixels?: number;
  ignoreAreas?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  waitForAnimations?: boolean;
  fullPage?: boolean;
  maskDynamicContent?: boolean;
}

export interface VisualValidationResult {
  passed: boolean;
  diffPercentage: number;
  diffPixels: number;
  baselineExists: boolean;
  diffImagePath?: string;
  message: string;
}

export class VisualValidator {
  private baselinePath: string;
  private actualPath: string;
  private diffPath: string;
  private options: Required<VisualValidationOptions>;
  
  constructor(
    testName: string,
    outputDir: string = 'test-results/jtbd-artifacts/visual',
    options: VisualValidationOptions = {}
  ) {
    this.baselinePath = path.join(outputDir, 'baseline', `${testName}.png`);
    this.actualPath = path.join(outputDir, 'actual', `${testName}.png`);
    this.diffPath = path.join(outputDir, 'diff', `${testName}-diff.png`);
    
    this.options = {
      threshold: options.threshold || 0.1,
      maxDiffPixels: options.maxDiffPixels || 100,
      ignoreAreas: options.ignoreAreas || [],
      waitForAnimations: options.waitForAnimations ?? true,
      fullPage: options.fullPage ?? true,
      maskDynamicContent: options.maskDynamicContent ?? true,
    };
  }
  
  async captureScreenshot(page: Page): Promise<Buffer> {
    // Wait for animations to complete
    if (this.options.waitForAnimations) {
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          if ('getAnimations' in document) {
            const animations = document.getAnimations();
            Promise.all(animations.map(a => a.finished)).then(() => resolve());
          } else {
            resolve();
          }
        });
      });
    }
    
    // Mask dynamic content
    if (this.options.maskDynamicContent) {
      await this.maskDynamicElements(page);
    }
    
    // Capture screenshot
    const screenshot = await page.screenshot({
      fullPage: this.options.fullPage,
      animations: 'disabled',
    });
    
    return screenshot;
  }
  
  private async maskDynamicElements(page: Page) {
    await page.evaluate(() => {
      // Mask timestamps
      document.querySelectorAll('[data-testid*="timestamp"], .timestamp, time').forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
      
      // Mask dynamic IDs
      document.querySelectorAll('[data-testid*="id"], .dynamic-id').forEach(el => {
        el.textContent = 'MASKED_ID';
      });
      
      // Mask loading states
      document.querySelectorAll('.loading, .spinner, [data-loading="true"]').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      
      // Stabilize animations
      const style = document.createElement('style');
      style.textContent = `
        * {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
  }
  
  async validate(page: Page): Promise<VisualValidationResult> {
    // Ensure directories exist
    await fs.ensureDir(path.dirname(this.baselinePath));
    await fs.ensureDir(path.dirname(this.actualPath));
    await fs.ensureDir(path.dirname(this.diffPath));
    
    // Capture current screenshot
    const actualScreenshot = await this.captureScreenshot(page);
    await fs.writeFile(this.actualPath, actualScreenshot);
    
    // Check if baseline exists
    const baselineExists = await fs.pathExists(this.baselinePath);
    if (!baselineExists) {
      // Create baseline
      await fs.copy(this.actualPath, this.baselinePath);
      return {
        passed: true,
        diffPercentage: 0,
        diffPixels: 0,
        baselineExists: false,
        message: 'Baseline created',
      };
    }
    
    // Compare images
    const result = await this.compareImages();
    
    return result;
  }
  
  private async compareImages(): Promise<VisualValidationResult> {
    try {
      const baselineBuffer = await fs.readFile(this.baselinePath);
      const actualBuffer = await fs.readFile(this.actualPath);
      
      const baseline = PNG.sync.read(baselineBuffer);
      const actual = PNG.sync.read(actualBuffer);
      
      // Check dimensions
      if (baseline.width !== actual.width || baseline.height !== actual.height) {
        return {
          passed: false,
          diffPercentage: 100,
          diffPixels: baseline.width * baseline.height,
          baselineExists: true,
          message: `Dimension mismatch: baseline (${baseline.width}x${baseline.height}) vs actual (${actual.width}x${actual.height})`,
        };
      }
      
      // Create diff image
      const diff = new PNG({ width: baseline.width, height: baseline.height });
      
      // Apply ignore areas
      const ignoreMask = this.createIgnoreMask(baseline.width, baseline.height);
      
      // Run pixel comparison
      const diffPixels = pixelmatch(
        baseline.data,
        actual.data,
        diff.data,
        baseline.width,
        baseline.height,
        {
          threshold: this.options.threshold,
          includeAA: false,
          alpha: 0.1,
          aaColor: [255, 255, 0],
          diffColor: [255, 0, 0],
          diffColorAlt: [0, 255, 0],
          diffMask: ignoreMask,
        }
      );
      
      // Save diff image
      await fs.writeFile(this.diffPath, PNG.sync.write(diff));
      
      const totalPixels = baseline.width * baseline.height;
      const diffPercentage = (diffPixels / totalPixels) * 100;
      
      const passed = diffPixels <= this.options.maxDiffPixels;
      
      return {
        passed,
        diffPercentage,
        diffPixels,
        baselineExists: true,
        diffImagePath: this.diffPath,
        message: passed
          ? 'Visual validation passed'
          : `Visual differences detected: ${diffPixels} pixels (${diffPercentage.toFixed(2)}%)`,
      };
    } catch (error) {
      return {
        passed: false,
        diffPercentage: 100,
        diffPixels: 0,
        baselineExists: true,
        message: `Error comparing images: ${error.message}`,
      };
    }
  }
  
  private createIgnoreMask(width: number, height: number): Uint8Array | undefined {
    if (this.options.ignoreAreas.length === 0) return undefined;
    
    const mask = new Uint8Array(width * height);
    mask.fill(0); // 0 = compare, 255 = ignore
    
    for (const area of this.options.ignoreAreas) {
      for (let y = area.y; y < area.y + area.height && y < height; y++) {
        for (let x = area.x; x < area.x + area.width && x < width; x++) {
          mask[y * width + x] = 255;
        }
      }
    }
    
    return mask;
  }
  
  async updateBaseline(): Promise<void> {
    if (await fs.pathExists(this.actualPath)) {
      await fs.ensureDir(path.dirname(this.baselinePath));
      await fs.copy(this.actualPath, this.baselinePath, { overwrite: true });
    } else {
      throw new Error('No actual screenshot to promote to baseline');
    }
  }
  
  async cleanup(): Promise<void> {
    if (await fs.pathExists(this.actualPath)) {
      await fs.remove(this.actualPath);
    }
    if (await fs.pathExists(this.diffPath)) {
      await fs.remove(this.diffPath);
    }
  }
}

// Visual regression test helper
export class VisualRegressionTester {
  private validators: Map<string, VisualValidator> = new Map();
  private results: Map<string, VisualValidationResult> = new Map();
  
  constructor(private outputDir: string = 'test-results/jtbd-artifacts/visual') {}
  
  async validatePage(
    page: Page,
    testName: string,
    options?: VisualValidationOptions
  ): Promise<VisualValidationResult> {
    const validator = new VisualValidator(testName, this.outputDir, options);
    this.validators.set(testName, validator);
    
    const result = await validator.validate(page);
    this.results.set(testName, result);
    
    return result;
  }
  
  async validateElement(
    page: Page,
    selector: string,
    testName: string,
    options?: VisualValidationOptions
  ): Promise<VisualValidationResult> {
    const element = await page.locator(selector);
    const boundingBox = await element.boundingBox();
    
    if (!boundingBox) {
      return {
        passed: false,
        diffPercentage: 100,
        diffPixels: 0,
        baselineExists: false,
        message: `Element ${selector} not found`,
      };
    }
    
    const screenshotOptions = {
      clip: boundingBox,
    };
    
    const validator = new VisualValidator(testName, this.outputDir, {
      ...options,
      fullPage: false,
    });
    
    // Custom capture for element
    const screenshot = await element.screenshot();
    const actualPath = path.join(this.outputDir, 'actual', `${testName}.png`);
    await fs.ensureDir(path.dirname(actualPath));
    await fs.writeFile(actualPath, screenshot);
    
    const result = await validator.validate(page);
    this.validators.set(testName, validator);
    this.results.set(testName, result);
    
    return result;
  }
  
  async updateBaselines(testNames?: string[]): Promise<void> {
    const targets = testNames || Array.from(this.validators.keys());
    
    for (const testName of targets) {
      const validator = this.validators.get(testName);
      if (validator) {
        await validator.updateBaseline();
      }
    }
  }
  
  async generateReport(): Promise<string> {
    const reportPath = path.join(this.outputDir, 'visual-regression-report.html');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Visual Regression Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .test { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
    .passed { background-color: #e8f5e9; }
    .failed { background-color: #ffebee; }
    .images { display: flex; gap: 20px; margin-top: 10px; }
    .image-container { text-align: center; }
    img { max-width: 300px; border: 1px solid #ccc; }
    .diff-info { margin: 10px 0; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Visual Regression Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  ${Array.from(this.results.entries()).map(([testName, result]) => `
    <div class="test ${result.passed ? 'passed' : 'failed'}">
      <h2>${testName}</h2>
      <p>Status: ${result.passed ? '✅ Passed' : '❌ Failed'}</p>
      <div class="diff-info">
        ${result.message}
        ${!result.passed ? `<br>Diff: ${result.diffPixels} pixels (${result.diffPercentage.toFixed(2)}%)` : ''}
      </div>
      
      ${!result.passed && result.diffImagePath ? `
        <div class="images">
          <div class="image-container">
            <h3>Baseline</h3>
            <img src="../baseline/${testName}.png" alt="Baseline">
          </div>
          <div class="image-container">
            <h3>Actual</h3>
            <img src="../actual/${testName}.png" alt="Actual">
          </div>
          <div class="image-container">
            <h3>Diff</h3>
            <img src="../diff/${testName}-diff.png" alt="Diff">
          </div>
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>`;
    
    await fs.writeFile(reportPath, html);
    return reportPath;
  }
  
  getSummary(): any {
    const results = Array.from(this.results.values());
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    return {
      total: results.length,
      passed,
      failed,
      passRate: results.length > 0 ? (passed / results.length * 100).toFixed(2) + '%' : '0%',
      results: Object.fromEntries(this.results),
    };
  }
}