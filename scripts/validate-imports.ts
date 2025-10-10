#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as ts from 'typescript';

interface ImportRisk {
  file: string;
  import: string;
  risk: 'high' | 'medium' | 'low';
  reason: string;
  suggestion: string;
}

const HIGH_RISK_PATTERNS = [
  /VirtualizedOpportunitiesTable/,
  /CollectionOpportunities(Enhanced|Refactored)?Bento/,
  /AllocationContext/
];

const DYNAMIC_IMPORT_PATTERN = /import\s*\(/;
const MISSING_ERROR_BOUNDARY = /import.*(?!ErrorBoundary)/;

export function analyzeImportRisks(rootDir: string): ImportRisk[] {
  const risks: ImportRisk[] = [];
  const files = glob.sync(`${rootDir}/**/*.{ts,tsx}`, {
    ignore: ['**/node_modules/**', '**/build/**', '**/*.test.*']
  });

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    ts.forEachChild(sourceFile, node => {
      if (ts.isImportDeclaration(node)) {
        const importPath = node.moduleSpecifier.getText().slice(1, -1);
        
        // Check for high-risk imports
        HIGH_RISK_PATTERNS.forEach(pattern => {
          if (pattern.test(importPath) || pattern.test(content)) {
            risks.push({
              file: path.relative(rootDir, file),
              import: importPath,
              risk: 'high',
              reason: 'Critical component with known import issues',
              suggestion: 'Wrap with SafeComponentLoader or error boundary'
            });
          }
        });

        // Check for dynamic imports without error handling
        if (DYNAMIC_IMPORT_PATTERN.test(content)) {
          const lineNum = sourceFile.getLineAndCharacterOfPosition(node.pos).line;
          const surroundingCode = content.split('\n').slice(lineNum - 2, lineNum + 3).join('\n');
          
          if (!surroundingCode.includes('catch') && !surroundingCode.includes('ErrorBoundary')) {
            risks.push({
              file: path.relative(rootDir, file),
              import: 'dynamic import',
              risk: 'medium',
              reason: 'Dynamic import without error handling',
              suggestion: 'Add .catch() block or wrap in try-catch'
            });
          }
        }
      }
    });
  });

  return risks;
}

// CI/CD Integration
export function generateCIReport(risks: ImportRisk[]): void {
  const highRisks = risks.filter(r => r.risk === 'high');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: risks.length,
      high: highRisks.length,
      medium: risks.filter(r => r.risk === 'medium').length,
      low: risks.filter(r => r.risk === 'low').length
    },
    criticalIssues: highRisks,
    passed: highRisks.length === 0
  };

  fs.writeFileSync('import-validation-report.json', JSON.stringify(report, null, 2));
  
  if (!report.passed) {
    console.error(`❌ Found ${highRisks.length} high-risk imports!`);
    process.exit(1);
  }
  
  console.log('✅ Import validation passed');
}

// Run if called directly
if (require.main === module) {
  const risks = analyzeImportRisks('./src');
  generateCIReport(risks);
}