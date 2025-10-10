/**
 * Migration Orchestrator
 * 
 * Orchestrates the progressive replacement of legacy CollectionOpportunities
 * components with new compound components using feature flags and A/B testing.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useFeatureFlag } from '../../../hooks/useFeatureFlags';
import { trackMigrationMetrics, trackInteractionMetrics } from '../../../utils/collection-migration/migrationMetrics';
import { LegacyCollectionAdapter } from '../adapters/LegacyCollectionAdapter';
import { CollectionStandardMigrated, MigrationWrapper } from '../variants/CollectionStandardMigrated';
import { Collection } from '../index';

// =============================================================================
// Type Definitions
// =============================================================================

export interface MigrationConfig {
  variant: string;
  rolloutPercentage: number;
  enableABTesting: boolean;
  enableMetrics: boolean;
  enableFallback: boolean;
  performanceThresholds: {
    maxRenderTime: number;
    maxMemoryUsage: number;
    maxErrorRate: number;
  };
  rollbackTriggers: {
    errorRate: number;
    performanceDegradation: number;
    userComplaintThreshold: number;
  };
}

export interface ABTestingConfig {
  testId: string;
  controlGroup: number; // Percentage for legacy
  treatmentGroup: number; // Percentage for new system
  metrics: string[];
  duration: number; // Days
  successCriteria: {
    performanceImprovement: number;
    errorReduction: number;
    userSatisfaction: number;
  };
}

export interface MigrationState {
  isActive: boolean;
  currentVariant: string | null;
  rolloutPercentage: number;
  abTestGroup: 'control' | 'treatment' | null;
  metricsEnabled: boolean;
  lastRollback: number | null;
  migrationStartTime: number;
}

// =============================================================================
// Migration Orchestrator Hook
// =============================================================================

/**
 * Hook for managing migration state and decisions
 */
export function useMigrationOrchestrator(
  variant: string,
  config: Partial<MigrationConfig> = {}
): {
  shouldUseLegacy: boolean;
  migrationState: MigrationState;
  trackInteraction: (type: string, data?: any) => void;
  triggerRollback: (reason: string) => void;
  abTestGroup: 'control' | 'treatment' | null;
} {
  const defaultConfig: MigrationConfig = {
    variant,
    rolloutPercentage: 10, // Start with 10%
    enableABTesting: true,
    enableMetrics: true,
    enableFallback: true,
    performanceThresholds: {
      maxRenderTime: 100,
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxErrorRate: 0.05 // 5%
    },
    rollbackTriggers: {
      errorRate: 0.1, // 10%
      performanceDegradation: 2.0, // 2x slower
      userComplaintThreshold: 5
    }
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // Feature flags
  const globalMigrationEnabled = useFeatureFlag('ENABLE_NEW_COLLECTION_SYSTEM');
  const variantMigrationEnabled = useFeatureFlag(`MIGRATE_${variant.toUpperCase()}_VARIANT`);
  const abTestingEnabled = useFeatureFlag('ENABLE_COLLECTION_AB_TESTING');

  // Migration state
  const [migrationState, setMigrationState] = useState<MigrationState>(() => ({
    isActive: false,
    currentVariant: null,
    rolloutPercentage: mergedConfig.rolloutPercentage,
    abTestGroup: null,
    metricsEnabled: mergedConfig.enableMetrics,
    lastRollback: null,
    migrationStartTime: Date.now()
  }));

  // Determine A/B test group
  const abTestGroup = useMemo(() => {
    if (!abTestingEnabled || !mergedConfig.enableABTesting) return null;
    
    // Use consistent hashing based on user session
    const sessionHash = getSessionHash();
    const bucket = sessionHash % 100;
    
    if (bucket < mergedConfig.rolloutPercentage) {
      return 'treatment';
    } else if (bucket < mergedConfig.rolloutPercentage * 2) {
      return 'control';
    }
    
    return null; // Not in test
  }, [abTestingEnabled, mergedConfig.enableABTesting, mergedConfig.rolloutPercentage]);

  // Determine if should use legacy
  const shouldUseLegacy = useMemo(() => {
    // Global feature flags
    if (!globalMigrationEnabled) return true;
    if (!variantMigrationEnabled) return true;
    
    // A/B testing
    if (abTestGroup === 'control') return true;
    if (abTestGroup === 'treatment') return false;
    
    // Rollout percentage
    const userHash = getUserHash();
    const bucket = userHash % 100;
    return bucket >= mergedConfig.rolloutPercentage;
  }, [
    globalMigrationEnabled,
    variantMigrationEnabled,
    abTestGroup,
    mergedConfig.rolloutPercentage
  ]);

  // Update migration state
  useEffect(() => {
    setMigrationState(prev => ({
      ...prev,
      isActive: !shouldUseLegacy,
      currentVariant: shouldUseLegacy ? null : variant,
      abTestGroup
    }));
  }, [shouldUseLegacy, variant, abTestGroup]);

  // Track interaction function
  const trackInteraction = useCallback((type: string, data?: any) => {
    if (mergedConfig.enableMetrics) {
      trackInteractionMetrics(
        `${variant}-${Date.now()}`,
        variant,
        {
          type,
          target: shouldUseLegacy ? 'legacy' : 'compound',
          success: true,
          data: {
            ...data,
            abTestGroup,
            migrationState
          }
        }
      );
    }
  }, [variant, shouldUseLegacy, abTestGroup, migrationState, mergedConfig.enableMetrics]);

  // Rollback function
  const triggerRollback = useCallback((reason: string) => {
    console.warn(`Migration rollback triggered for ${variant}: ${reason}`);
    
    setMigrationState(prev => ({
      ...prev,
      isActive: false,
      lastRollback: Date.now()
    }));

    if (mergedConfig.enableMetrics) {
      trackMigrationMetrics(`${variant}-rollback-${Date.now()}`, {
        variant,
        useNewSystem: false,
        opportunitiesCount: 0,
        selectedCount: 0,
        features: {},
        rollbackReason: reason,
        rollbackTime: Date.now()
      });
    }
  }, [variant, mergedConfig.enableMetrics]);

  return {
    shouldUseLegacy,
    migrationState,
    trackInteraction,
    triggerRollback,
    abTestGroup
  };
}

// =============================================================================
// Universal Migration Component
// =============================================================================

export interface UniversalMigrationProps {
  variant: string;
  legacyComponent: React.ComponentType<any>;
  compoundComponent?: React.ComponentType<any>;
  migrationConfig?: Partial<MigrationConfig>;
  abTestConfig?: Partial<ABTestingConfig>;
  
  // Component props
  [key: string]: any;
}

/**
 * Universal migration component that can wrap any legacy component
 * and progressively migrate it to compound components.
 */
export const UniversalMigration: React.FC<UniversalMigrationProps> = ({
  variant,
  legacyComponent: LegacyComponent,
  compoundComponent: CompoundComponent,
  migrationConfig,
  abTestConfig,
  ...componentProps
}) => {
  const {
    shouldUseLegacy,
    migrationState,
    trackInteraction,
    triggerRollback,
    abTestGroup
  } = useMigrationOrchestrator(variant, migrationConfig);

  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // Handle component errors
  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    setHasError(true);
    setErrorCount(prev => prev + 1);
    
    console.error(`Migration error in ${variant}:`, error, errorInfo);
    
    // Trigger rollback if too many errors
    if (errorCount >= 3) {
      triggerRollback(`Too many errors (${errorCount + 1})`);
    }

    trackInteraction('error', {
      error: error.message,
      errorInfo,
      errorCount: errorCount + 1
    });
  }, [variant, errorCount, triggerRollback, trackInteraction]);

  // Reset error state when switching systems
  useEffect(() => {
    setHasError(false);
    setErrorCount(0);
  }, [shouldUseLegacy]);

  // Track render
  useEffect(() => {
    trackInteraction('render', {
      system: shouldUseLegacy ? 'legacy' : 'compound',
      abTestGroup,
      migrationState
    });
  }, [shouldUseLegacy, abTestGroup, migrationState, trackInteraction]);

  // Error boundary wrapper
  if (hasError && !shouldUseLegacy) {
    // Fall back to legacy on error
    return (
      <ErrorFallback 
        variant={variant}
        onRetry={() => setHasError(false)}
        onForceLegacy={() => triggerRollback('User requested fallback')}
      >
        <LegacyComponent {...componentProps} />
      </ErrorFallback>
    );
  }

  // Render legacy component
  if (shouldUseLegacy) {
    return (
      <div className={`migration-wrapper legacy-system variant-${variant}`}>
        <LegacyComponent {...componentProps} />
        {process.env.NODE_ENV === 'development' && (
          <MigrationDebugInfo
            variant={variant}
            system="legacy"
            abTestGroup={abTestGroup}
            migrationState={migrationState}
          />
        )}
      </div>
    );
  }

  // Render compound component
  const CompoundToRender = CompoundComponent || CollectionStandardMigrated;
  
  return (
    <React.Suspense fallback={<MigrationLoadingState variant={variant} />}>
      <ErrorBoundary onError={handleError}>
        <div className={`migration-wrapper compound-system variant-${variant}`}>
          <CompoundToRender {...componentProps} />
          {process.env.NODE_ENV === 'development' && (
            <MigrationDebugInfo
              variant={variant}
              system="compound"
              abTestGroup={abTestGroup}
              migrationState={migrationState}
            />
          )}
        </div>
      </ErrorBoundary>
    </React.Suspense>
  );
};

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Error boundary for migration components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error, errorInfo: React.ErrorInfo) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with the migrated component.</div>;
    }

    return this.props.children;
  }
}

/**
 * Error fallback component
 */
const ErrorFallback: React.FC<{
  variant: string;
  onRetry: () => void;
  onForceLegacy: () => void;
  children: React.ReactNode;
}> = ({ variant, onRetry, onForceLegacy, children }) => (
  <div className="migration-error-fallback">
    <div className="error-banner">
      <span>Migration error in {variant}. Using legacy version.</span>
      <button onClick={onRetry}>Retry</button>
      <button onClick={onForceLegacy}>Use Legacy</button>
    </div>
    {children}
  </div>
);

/**
 * Loading state for migration
 */
const MigrationLoadingState: React.FC<{ variant: string }> = ({ variant }) => (
  <div className="migration-loading">
    <div className="bp5-spinner bp5-small">
      <svg width="20" height="20" viewBox="0 0 100 100">
        <path
          className="bp5-spinner-track"
          d="M 50,50 m 0,-44.5 a 44.5,44.5 0 1 1 0,89 a 44.5,44.5 0 1 1 0,-89"
        />
        <path
          className="bp5-spinner-head"
          d="M 50,50 m 0,-44.5 a 44.5,44.5 0 1 1 0,89 a 44.5,44.5 0 1 1 0,-89"
          pathLength="280"
          strokeDasharray="210 70"
          strokeDashoffset="0"
        />
      </svg>
    </div>
    <span>Loading migrated {variant}...</span>
  </div>
);

/**
 * Debug info component (development only)
 */
const MigrationDebugInfo: React.FC<{
  variant: string;
  system: 'legacy' | 'compound';
  abTestGroup: 'control' | 'treatment' | null;
  migrationState: MigrationState;
}> = ({ variant, system, abTestGroup, migrationState }) => (
  <div className="migration-debug-info" style={{ 
    position: 'fixed', 
    bottom: 10, 
    right: 10, 
    background: 'rgba(0,0,0,0.8)', 
    color: 'white',
    padding: '5px 10px',
    fontSize: '12px',
    borderRadius: '3px',
    zIndex: 9999
  }}>
    <div>Variant: {variant}</div>
    <div>System: {system}</div>
    <div>A/B Group: {abTestGroup || 'none'}</div>
    <div>Rollout: {migrationState.rolloutPercentage}%</div>
  </div>
);

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Gets a consistent hash for the current session
 */
function getSessionHash(): number {
  const sessionId = sessionStorage.getItem('migration-session-id') || 
    Math.random().toString(36).substr(2, 9);
  
  if (!sessionStorage.getItem('migration-session-id')) {
    sessionStorage.setItem('migration-session-id', sessionId);
  }
  
  return hashString(sessionId);
}

/**
 * Gets a consistent hash for the current user
 */
function getUserHash(): number {
  const userId = localStorage.getItem('migration-user-id') || 
    Math.random().toString(36).substr(2, 9);
  
  if (!localStorage.getItem('migration-user-id')) {
    localStorage.setItem('migration-user-id', userId);
  }
  
  return hashString(userId);
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// =============================================================================
// Export All
// =============================================================================

export default UniversalMigration;