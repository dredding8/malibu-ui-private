#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * 
 * Automated bundle analysis for the collection management system.
 * Analyzes webpack bundles, tracks size changes, validates tree shaking,
 * and generates comprehensive reports for optimization tracking.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 * @wave Wave 4 - Validation & Testing
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // Bundle size thresholds (in bytes)
  thresholds: {
    totalBundleSize: 2 * 1024 * 1024, // 2MB
    initialChunkSize: 500 * 1024, // 500KB
    maxChunkSize: 1024 * 1024, // 1MB
    cssSize: 200 * 1024, // 200KB
    vendorSize: 1.5 * 1024 * 1024, // 1.5MB
  },
  
  // Paths
  buildDir: path.resolve(__dirname, '..', 'build'),
  outputDir: path.resolve(__dirname, '..', 'test-results', 'bundle-analysis'),
  packageJsonPath: path.resolve(__dirname, '..', 'package.json'),
  
  // Analysis options
  options: {
    generateDetailedReport: true,
    trackTreeShaking: true,
    compareWithPrevious: true,
    checkDuplicates: true,
    analyzeCodeSplitting: true,
    validateLazyLoading: true
  }
};

// =============================================================================
// Utility Functions
// =============================================================================

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function createOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

function getPackageInfo() {
  const packageJson = JSON.parse(fs.readFileSync(CONFIG.packageJsonPath, 'utf8'));
  return {
    name: packageJson.name,
    version: packageJson.version,
    dependencies: Object.keys(packageJson.dependencies || {}),
    devDependencies: Object.keys(packageJson.devDependencies || {})
  };
}

function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD').toString().trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const isDirty = execSync('git status --porcelain').toString().trim() !== '';
    
    return { commit, branch, isDirty };
  } catch (error) {
    return { commit: 'unknown', branch: 'unknown', isDirty: false };
  }
}

// =============================================================================
// Bundle Analysis Functions
// =============================================================================

function analyzeBuildFiles() {
  if (!fs.existsSync(CONFIG.buildDir)) {
    throw new Error(`Build directory not found: ${CONFIG.buildDir}`);
  }

  const staticDir = path.join(CONFIG.buildDir, 'static');
  const analysis = {
    total: 0,
    js: { files: [], total: 0 },
    css: { files: [], total: 0 },
    media: { files: [], total: 0 },
    other: { files: [], total: 0 }
  };

  function analyzeDirectory(dir, category = 'other') {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Determine category based on directory name
        const dirCategory = file === 'js' ? 'js' : file === 'css' ? 'css' : file === 'media' ? 'media' : category;
        analyzeDirectory(filePath, dirCategory);
      } else if (stat.isFile()) {
        const fileInfo = {
          name: file,
          path: filePath.replace(CONFIG.buildDir, ''),
          size: stat.size,
          gzipped: getGzippedSize(filePath)
        };
        
        analysis[category].files.push(fileInfo);
        analysis[category].total += stat.size;
        analysis.total += stat.size;
      }
    }
  }

  // Analyze static files
  analyzeDirectory(staticDir);
  
  // Analyze root files (index.html, etc.)
  const rootFiles = fs.readdirSync(CONFIG.buildDir);
  for (const file of rootFiles) {
    const filePath = path.join(CONFIG.buildDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && !file.startsWith('.')) {
      const fileInfo = {
        name: file,
        path: `/${file}`,
        size: stat.size,
        gzipped: getGzippedSize(filePath)
      };
      
      analysis.other.files.push(fileInfo);
      analysis.other.total += stat.size;
      analysis.total += stat.size;
    }
  }

  return analysis;
}

function getGzippedSize(filePath) {
  try {
    const result = execSync(`gzip -c "${filePath}" | wc -c`).toString().trim();
    return parseInt(result, 10);
  } catch (error) {
    return 0;
  }
}

function analyzeJavaScriptBundles(jsFiles) {
  const bundles = {
    main: null,
    vendor: [],
    chunks: [],
    runtime: null
  };

  for (const file of jsFiles) {
    const filename = file.name;
    
    if (filename.includes('main.') && filename.endsWith('.js')) {
      bundles.main = file;
    } else if (filename.includes('vendor') || filename.includes('node_modules')) {
      bundles.vendor.push(file);
    } else if (filename.includes('runtime')) {
      bundles.runtime = file;
    } else if (filename.includes('chunk') || /\d+\.[a-f0-9]+\.chunk\.js/.test(filename)) {
      bundles.chunks.push(file);
    }
  }

  return bundles;
}

function validateTreeShaking() {
  const results = {
    isOptimized: true,
    issues: [],
    recommendations: []
  };

  try {
    // Check for common tree-shaking issues
    const mainJsPath = path.join(CONFIG.buildDir, 'static', 'js');
    if (fs.existsSync(mainJsPath)) {
      const jsFiles = fs.readdirSync(mainJsPath);
      
      for (const file of jsFiles) {
        if (file.includes('main.') && file.endsWith('.js')) {
          const content = fs.readFileSync(path.join(mainJsPath, file), 'utf8');
          
          // Check for unused imports (simplified check)
          if (content.includes('/* unused harmony export')) {
            results.issues.push(`Unused exports detected in ${file}`);
            results.isOptimized = false;
          }
          
          // Check for development code
          if (content.includes('process.env.NODE_ENV')) {
            results.issues.push(`Environment checks found in ${file} - may indicate incomplete optimization`);
          }
          
          // Check for large vendor libraries that should be chunked
          if (content.length > 1024 * 1024) { // 1MB
            results.recommendations.push(`${file} is large (${formatBytes(content.length)}) - consider code splitting`);
          }
        }
      }
    }
  } catch (error) {
    results.issues.push(`Tree shaking analysis failed: ${error.message}`);
    results.isOptimized = false;
  }

  return results;
}

function analyzeCodeSplitting(bundles) {
  const analysis = {
    hasCodeSplitting: bundles.chunks.length > 0,
    chunkCount: bundles.chunks.length,
    vendorSeparation: bundles.vendor.length > 0,
    asyncChunks: [],
    recommendations: []
  };

  // Analyze chunk sizes
  for (const chunk of bundles.chunks) {
    if (chunk.size > CONFIG.thresholds.maxChunkSize) {
      analysis.recommendations.push(
        `Chunk ${chunk.name} is large (${formatBytes(chunk.size)}) - consider further splitting`
      );
    }
  }

  // Check for async chunk patterns
  const chunkNames = bundles.chunks.map(c => c.name);
  const asyncPatterns = [
    /collection.*\.chunk\.js/,
    /opportunities.*\.chunk\.js/,
    /bento.*\.chunk\.js/,
    /\d+\.[a-f0-9]+\.chunk\.js/
  ];

  for (const pattern of asyncPatterns) {
    const matchingChunks = chunkNames.filter(name => pattern.test(name));
    if (matchingChunks.length > 0) {
      analysis.asyncChunks.push({
        pattern: pattern.source,
        chunks: matchingChunks
      });
    }
  }

  if (!analysis.hasCodeSplitting) {
    analysis.recommendations.push('No code splitting detected - consider implementing route-based or feature-based splitting');
  }

  if (!analysis.vendorSeparation) {
    analysis.recommendations.push('Vendor code not separated - consider splitting vendor libraries into separate chunks');
  }

  return analysis;
}

function checkDuplicatedDependencies() {
  const duplicates = {
    found: false,
    packages: [],
    recommendations: []
  };

  try {
    // This would typically use webpack-bundle-analyzer data
    // For now, we'll do a simplified check based on file patterns
    const jsDir = path.join(CONFIG.buildDir, 'static', 'js');
    if (fs.existsSync(jsDir)) {
      const files = fs.readdirSync(jsDir);
      const filePatterns = new Map();

      for (const file of files) {
        // Extract potential library patterns from filenames
        const matches = file.match(/([a-z-]+)(?:\.|_)/g);
        if (matches) {
          for (const match of matches) {
            const lib = match.replace(/[\.|_]/g, '');
            if (!filePatterns.has(lib)) {
              filePatterns.set(lib, []);
            }
            filePatterns.get(lib).push(file);
          }
        }
      }

      // Check for potential duplicates
      for (const [lib, files] of filePatterns.entries()) {
        if (files.length > 1 && lib.length > 3) {
          duplicates.found = true;
          duplicates.packages.push({
            library: lib,
            files: files,
            potentialDuplicate: true
          });
        }
      }
    }
  } catch (error) {
    duplicates.recommendations.push(`Duplicate analysis failed: ${error.message}`);
  }

  if (duplicates.found) {
    duplicates.recommendations.push('Potential duplicate dependencies detected - review webpack configuration');
  }

  return duplicates;
}

function validateLazyLoading() {
  const validation = {
    hasLazyLoading: false,
    lazyChunks: [],
    recommendations: []
  };

  try {
    // Check for dynamic import patterns in source
    const srcDir = path.resolve(__dirname, '..', 'src');
    const sourceFiles = findSourceFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for React.lazy usage
      if (content.includes('React.lazy') || content.includes('lazy(')) {
        validation.hasLazyLoading = true;
        validation.lazyChunks.push({
          file: file.replace(srcDir, ''),
          type: 'React.lazy'
        });
      }
      
      // Check for dynamic imports
      if (content.includes('import(')) {
        validation.hasLazyLoading = true;
        const matches = content.match(/import\(['"`]([^'"`]+)['"`]\)/g);
        if (matches) {
          for (const match of matches) {
            validation.lazyChunks.push({
              file: file.replace(srcDir, ''),
              type: 'dynamic import',
              target: match
            });
          }
        }
      }
    }

    if (!validation.hasLazyLoading) {
      validation.recommendations.push('No lazy loading detected - consider implementing for route components and heavy features');
    }

  } catch (error) {
    validation.recommendations.push(`Lazy loading analysis failed: ${error.message}`);
  }

  return validation;
}

function findSourceFiles(dir, extensions) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(entry);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

function compareWithPrevious(currentAnalysis) {
  const comparison = {
    hasPrevious: false,
    changes: {},
    recommendations: []
  };

  const previousReportPath = path.join(CONFIG.outputDir, 'previous-analysis.json');
  
  if (fs.existsSync(previousReportPath)) {
    try {
      const previousData = JSON.parse(fs.readFileSync(previousReportPath, 'utf8'));
      comparison.hasPrevious = true;
      
      // Compare total sizes
      const totalChange = currentAnalysis.bundleAnalysis.total - previousData.bundleAnalysis.total;
      const totalChangePercent = (totalChange / previousData.bundleAnalysis.total) * 100;
      
      comparison.changes.total = {
        previous: previousData.bundleAnalysis.total,
        current: currentAnalysis.bundleAnalysis.total,
        change: totalChange,
        changePercent: totalChangePercent
      };

      // Compare JS bundle sizes
      const jsChange = currentAnalysis.bundleAnalysis.js.total - previousData.bundleAnalysis.js.total;
      const jsChangePercent = (jsChange / previousData.bundleAnalysis.js.total) * 100;
      
      comparison.changes.javascript = {
        previous: previousData.bundleAnalysis.js.total,
        current: currentAnalysis.bundleAnalysis.js.total,
        change: jsChange,
        changePercent: jsChangePercent
      };

      // Compare CSS sizes
      const cssChange = currentAnalysis.bundleAnalysis.css.total - previousData.bundleAnalysis.css.total;
      const cssChangePercent = previousData.bundleAnalysis.css.total > 0 ? 
        (cssChange / previousData.bundleAnalysis.css.total) * 100 : 0;
      
      comparison.changes.css = {
        previous: previousData.bundleAnalysis.css.total,
        current: currentAnalysis.bundleAnalysis.css.total,
        change: cssChange,
        changePercent: cssChangePercent
      };

      // Generate recommendations based on changes
      if (Math.abs(totalChangePercent) > 10) {
        comparison.recommendations.push(
          `Bundle size changed significantly: ${totalChangePercent > 0 ? '+' : ''}${totalChangePercent.toFixed(2)}%`
        );
      }

      if (jsChangePercent > 20) {
        comparison.recommendations.push(
          `JavaScript bundle size increased significantly: +${jsChangePercent.toFixed(2)}%`
        );
      }

    } catch (error) {
      comparison.recommendations.push(`Failed to compare with previous analysis: ${error.message}`);
    }
  }

  return comparison;
}

function validateThresholds(bundleAnalysis) {
  const violations = [];
  const warnings = [];

  // Check total bundle size
  if (bundleAnalysis.total > CONFIG.thresholds.totalBundleSize) {
    violations.push({
      type: 'Total Bundle Size',
      current: bundleAnalysis.total,
      threshold: CONFIG.thresholds.totalBundleSize,
      severity: 'error'
    });
  }

  // Check main chunk size
  const mainChunk = bundleAnalysis.js.files.find(f => f.name.includes('main.'));
  if (mainChunk && mainChunk.size > CONFIG.thresholds.initialChunkSize) {
    violations.push({
      type: 'Main Chunk Size',
      current: mainChunk.size,
      threshold: CONFIG.thresholds.initialChunkSize,
      severity: 'warning'
    });
  }

  // Check CSS size
  if (bundleAnalysis.css.total > CONFIG.thresholds.cssSize) {
    warnings.push({
      type: 'CSS Bundle Size',
      current: bundleAnalysis.css.total,
      threshold: CONFIG.thresholds.cssSize,
      severity: 'warning'
    });
  }

  // Check individual chunk sizes
  for (const file of bundleAnalysis.js.files) {
    if (file.size > CONFIG.thresholds.maxChunkSize) {
      violations.push({
        type: 'Large Chunk',
        file: file.name,
        current: file.size,
        threshold: CONFIG.thresholds.maxChunkSize,
        severity: 'warning'
      });
    }
  }

  return { violations, warnings };
}

// =============================================================================
// Report Generation
// =============================================================================

function generateReport(analysis) {
  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: analysis.packageInfo.version,
      git: analysis.gitInfo,
      thresholds: CONFIG.thresholds
    },
    summary: {
      totalSize: analysis.bundleAnalysis.total,
      totalSizeFormatted: formatBytes(analysis.bundleAnalysis.total),
      jsSize: analysis.bundleAnalysis.js.total,
      jsSizeFormatted: formatBytes(analysis.bundleAnalysis.js.total),
      cssSize: analysis.bundleAnalysis.css.total,
      cssSizeFormatted: formatBytes(analysis.bundleAnalysis.css.total),
      fileCount: analysis.bundleAnalysis.js.files.length + analysis.bundleAnalysis.css.files.length,
      chunkCount: analysis.codeSplitting.chunkCount
    },
    analysis,
    recommendations: [
      ...analysis.treeShaking.recommendations,
      ...analysis.codeSplitting.recommendations,
      ...analysis.duplicates.recommendations,
      ...analysis.lazyLoading.recommendations,
      ...(analysis.comparison ? analysis.comparison.recommendations : [])
    ],
    thresholdValidation: analysis.thresholds
  };

  return report;
}

function generateHTMLReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis Report - ${report.metadata.version}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .summary-card { background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; }
        .summary-card h3 { margin: 0 0 5px 0; color: #374151; font-size: 14px; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .file-list { background: #f9fafb; border-radius: 6px; padding: 15px; }
        .file-item { display: flex; justify-content: between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .file-name { flex: 1; font-family: monospace; }
        .file-size { font-weight: bold; }
        .recommendation { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 10px; margin: 5px 0; }
        .error { background: #fee2e2; border-color: #ef4444; }
        .warning { background: #fef3c7; border-color: #f59e0b; }
        .success { background: #d1fae5; border-color: #10b981; }
        .comparison { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .comparison-item { background: #f8fafc; padding: 15px; border-radius: 6px; }
        .change-positive { color: #ef4444; }
        .change-negative { color: #10b981; }
        .change-neutral { color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bundle Analysis Report</h1>
            <p>Generated on ${new Date(report.metadata.timestamp).toLocaleString()}</p>
            <p>Version: ${report.metadata.version} | Branch: ${report.metadata.git.branch} | Commit: ${report.metadata.git.commit.substring(0, 8)}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Bundle Summary</h2>
                <div class="summary-grid">
                    <div class="summary-card">
                        <h3>Total Bundle Size</h3>
                        <div class="value">${report.summary.totalSizeFormatted}</div>
                    </div>
                    <div class="summary-card">
                        <h3>JavaScript</h3>
                        <div class="value">${report.summary.jsSizeFormatted}</div>
                    </div>
                    <div class="summary-card">
                        <h3>CSS</h3>
                        <div class="value">${report.summary.cssSizeFormatted}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Total Files</h3>
                        <div class="value">${report.summary.fileCount}</div>
                    </div>
                    <div class="summary-card">
                        <h3>JS Chunks</h3>
                        <div class="value">${report.summary.chunkCount}</div>
                    </div>
                </div>
            </div>

            ${report.analysis.comparison && report.analysis.comparison.hasPrevious ? `
            <div class="section">
                <h2>Size Comparison</h2>
                <div class="comparison">
                    <div class="comparison-item">
                        <h3>Total Bundle</h3>
                        <p>Previous: ${formatBytes(report.analysis.comparison.changes.total.previous)}</p>
                        <p>Current: ${formatBytes(report.analysis.comparison.changes.total.current)}</p>
                        <p class="${report.analysis.comparison.changes.total.changePercent > 0 ? 'change-positive' : report.analysis.comparison.changes.total.changePercent < 0 ? 'change-negative' : 'change-neutral'}">
                            Change: ${report.analysis.comparison.changes.total.changePercent > 0 ? '+' : ''}${report.analysis.comparison.changes.total.changePercent.toFixed(2)}%
                        </p>
                    </div>
                    <div class="comparison-item">
                        <h3>JavaScript</h3>
                        <p>Previous: ${formatBytes(report.analysis.comparison.changes.javascript.previous)}</p>
                        <p>Current: ${formatBytes(report.analysis.comparison.changes.javascript.current)}</p>
                        <p class="${report.analysis.comparison.changes.javascript.changePercent > 0 ? 'change-positive' : report.analysis.comparison.changes.javascript.changePercent < 0 ? 'change-negative' : 'change-neutral'}">
                            Change: ${report.analysis.comparison.changes.javascript.changePercent > 0 ? '+' : ''}${report.analysis.comparison.changes.javascript.changePercent.toFixed(2)}%
                        </p>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2>JavaScript Files</h2>
                <div class="file-list">
                    ${report.analysis.bundleAnalysis.js.files.map(file => `
                        <div class="file-item">
                            <span class="file-name">${file.name}</span>
                            <span class="file-size">${formatBytes(file.size)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2>Code Splitting Analysis</h2>
                <div class="${report.analysis.codeSplitting.hasCodeSplitting ? 'success' : 'warning'} recommendation">
                    <strong>Code Splitting:</strong> ${report.analysis.codeSplitting.hasCodeSplitting ? 'Enabled' : 'Not Detected'}
                </div>
                <div class="${report.analysis.codeSplitting.vendorSeparation ? 'success' : 'warning'} recommendation">
                    <strong>Vendor Separation:</strong> ${report.analysis.codeSplitting.vendorSeparation ? 'Enabled' : 'Not Detected'}
                </div>
                <p><strong>Chunk Count:</strong> ${report.analysis.codeSplitting.chunkCount}</p>
                ${report.analysis.codeSplitting.asyncChunks.length > 0 ? `
                    <h3>Async Chunks Detected:</h3>
                    <ul>
                        ${report.analysis.codeSplitting.asyncChunks.map(chunk => `
                            <li><strong>${chunk.pattern}:</strong> ${chunk.chunks.join(', ')}</li>
                        `).join('')}
                    </ul>
                ` : ''}
            </div>

            <div class="section">
                <h2>Tree Shaking Analysis</h2>
                <div class="${report.analysis.treeShaking.isOptimized ? 'success' : 'error'} recommendation">
                    <strong>Optimization Status:</strong> ${report.analysis.treeShaking.isOptimized ? 'Optimized' : 'Issues Detected'}
                </div>
                ${report.analysis.treeShaking.issues.length > 0 ? `
                    <h3>Issues:</h3>
                    <ul>
                        ${report.analysis.treeShaking.issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>

            <div class="section">
                <h2>Lazy Loading Analysis</h2>
                <div class="${report.analysis.lazyLoading.hasLazyLoading ? 'success' : 'warning'} recommendation">
                    <strong>Lazy Loading:</strong> ${report.analysis.lazyLoading.hasLazyLoading ? 'Implemented' : 'Not Detected'}
                </div>
                ${report.analysis.lazyLoading.lazyChunks.length > 0 ? `
                    <h3>Lazy Loaded Components:</h3>
                    <ul>
                        ${report.analysis.lazyLoading.lazyChunks.map(chunk => `
                            <li><strong>${chunk.file}:</strong> ${chunk.type}</li>
                        `).join('')}
                    </ul>
                ` : ''}
            </div>

            ${report.thresholdValidation.violations.length > 0 || report.thresholdValidation.warnings.length > 0 ? `
            <div class="section">
                <h2>Threshold Violations</h2>
                ${report.thresholdValidation.violations.map(violation => `
                    <div class="${violation.severity === 'error' ? 'error' : 'warning'} recommendation">
                        <strong>${violation.type}:</strong> ${formatBytes(violation.current)} exceeds threshold of ${formatBytes(violation.threshold)}
                        ${violation.file ? ` (${violation.file})` : ''}
                    </div>
                `).join('')}
                ${report.thresholdValidation.warnings.map(warning => `
                    <div class="warning recommendation">
                        <strong>${warning.type}:</strong> ${formatBytes(warning.current)} exceeds recommended threshold of ${formatBytes(warning.threshold)}
                        ${warning.file ? ` (${warning.file})` : ''}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            ${report.recommendations.length > 0 ? `
            <div class="section">
                <h2>Recommendations</h2>
                ${report.recommendations.map(rec => `
                    <div class="recommendation">${rec}</div>
                `).join('')}
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
  `;

  return html;
}

// =============================================================================
// Main Analysis Function
// =============================================================================

async function analyzeBundles() {
  console.log('🔍 Starting bundle analysis...');
  
  try {
    createOutputDir();
    
    const packageInfo = getPackageInfo();
    const gitInfo = getGitInfo();
    
    console.log('📦 Analyzing build files...');
    const bundleAnalysis = analyzeBuildFiles();
    
    console.log('🌊 Analyzing JavaScript bundles...');
    const jsBundles = analyzeJavaScriptBundles(bundleAnalysis.js.files);
    
    console.log('🌲 Validating tree shaking...');
    const treeShaking = validateTreeShaking();
    
    console.log('✂️ Analyzing code splitting...');
    const codeSplitting = analyzeCodeSplitting(jsBundles);
    
    console.log('🔍 Checking for duplicates...');
    const duplicates = checkDuplicatedDependencies();
    
    console.log('⚡ Validating lazy loading...');
    const lazyLoading = validateLazyLoading();
    
    console.log('📊 Validating thresholds...');
    const thresholds = validateThresholds(bundleAnalysis);
    
    const analysis = {
      packageInfo,
      gitInfo,
      bundleAnalysis,
      jsBundles,
      treeShaking,
      codeSplitting,
      duplicates,
      lazyLoading,
      thresholds
    };
    
    console.log('📈 Comparing with previous analysis...');
    const comparison = compareWithPrevious(analysis);
    analysis.comparison = comparison;
    
    console.log('📋 Generating report...');
    const report = generateReport(analysis);
    
    // Save JSON report
    const jsonReportPath = path.join(CONFIG.outputDir, 'bundle-analysis.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
    
    // Save HTML report
    const htmlReport = generateHTMLReport(report);
    const htmlReportPath = path.join(CONFIG.outputDir, 'bundle-analysis.html');
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Save as previous for next comparison
    const previousReportPath = path.join(CONFIG.outputDir, 'previous-analysis.json');
    fs.writeFileSync(previousReportPath, JSON.stringify(analysis, null, 2));
    
    console.log('✅ Bundle analysis complete!');
    console.log(`📊 Reports saved to: ${CONFIG.outputDir}`);
    console.log(`📈 Total bundle size: ${formatBytes(bundleAnalysis.total)}`);
    console.log(`🟢 JavaScript: ${formatBytes(bundleAnalysis.js.total)}`);
    console.log(`🎨 CSS: ${formatBytes(bundleAnalysis.css.total)}`);
    
    if (thresholds.violations.length > 0) {
      console.log('⚠️ Threshold violations detected:');
      thresholds.violations.forEach(violation => {
        console.log(`   - ${violation.type}: ${formatBytes(violation.current)} > ${formatBytes(violation.threshold)}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   - ${rec}`);
      });
      if (report.recommendations.length > 3) {
        console.log(`   ... and ${report.recommendations.length - 3} more (see full report)`);
      }
    }
    
    // Exit with error code if critical violations found
    const criticalViolations = thresholds.violations.filter(v => v.severity === 'error');
    if (criticalViolations.length > 0) {
      console.log('❌ Critical threshold violations detected!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

// =============================================================================
// CLI Interface
// =============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Bundle Analysis Tool

Usage: node analyze-bundle.js [options]

Options:
  --help, -h     Show this help message
  --json-only    Generate only JSON report
  --html-only    Generate only HTML report
  --no-compare   Skip comparison with previous analysis

Examples:
  node analyze-bundle.js
  node analyze-bundle.js --json-only
  npm run analyze:bundle
    `);
    process.exit(0);
  }
  
  // Update config based on CLI args
  if (args.includes('--no-compare')) {
    CONFIG.options.compareWithPrevious = false;
  }
  
  analyzeBundles();
}

module.exports = {
  analyzeBundles,
  CONFIG,
  formatBytes
};