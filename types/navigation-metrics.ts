/**
 * Navigation Flow Metrics Types
 * Used for measuring and analyzing user navigation patterns and cognitive load
 */

export interface NavigationFlowMetrics {
  flowId: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  steps: NavigationStep[];
  cognitiveLoad: CognitiveLoadMeasurement;
  errors: NavigationError[];
  success: boolean;
  completionRate: number;
}

export interface NavigationStep {
  stepId: string;
  stepName: string;
  startTime: number;
  endTime: number;
  duration: number;
  interactions: UserInteraction[];
  backtrackCount: number;
  hesitationCount: number;
}

export interface UserInteraction {
  type: 'click' | 'input' | 'scroll' | 'hover' | 'keyboard';
  target: string;
  timestamp: number;
  duration: number;
  successful: boolean;
  retryCount?: number;
}

export interface CognitiveLoadMeasurement {
  score: number; // 0-100, where lower is better
  totalInteractionTime: number;
  averageInteractionTime: number;
  errorCount: number;
  hesitationCount: number;
  taskCount: number;
  factors?: {
    timePerTask?: number;
    errorRate?: number;
    hesitationRate?: number;
    navigationEfficiency?: number;
  };
}

export interface NavigationError {
  timestamp: number;
  type: 'validation' | 'navigation' | 'interaction' | 'system';
  message: string;
  severity: 'low' | 'medium' | 'high';
  recovered: boolean;
  recoveryTime?: number;
}

export interface BlueprintComplianceMetrics {
  componentUsage: ComponentUsageReport[];
  patternCompliance: PatternComplianceReport[];
  accessibilityScore: number;
  performanceScore: number;
  overallCompliance: number;
}

export interface ComponentUsageReport {
  componentName: string;
  usageCount: number;
  correctUsage: boolean;
  violations: string[];
  recommendations: string[];
}

export interface PatternComplianceReport {
  pattern: string;
  implemented: boolean;
  score: number;
  issues: string[];
  blueprintReference: string;
}