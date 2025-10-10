import React from 'react';

export interface FeatureFlags {
  // Bento variant flags
  USE_ENHANCED_BENTO: boolean;
  USE_REFACTORED_BENTO: boolean;
  USE_SPLIT_VIEW: boolean;
  USE_LEGACY_TABLE: boolean;
  
  // Performance flags
  ENABLE_VIRTUALIZED_TABLE: boolean;
  ENABLE_PERFORMANCE_MONITORING: boolean;
  ENABLE_MEMOIZATION: boolean;
  
  // Safety flags
  ENABLE_ERROR_BOUNDARIES: boolean;
  ENABLE_FALLBACK_UI: boolean;
  STRICT_TYPE_CHECKING: boolean;
  
  // Collection migration flags
  ENABLE_NEW_COLLECTION_SYSTEM: boolean;
  MIGRATE_COLLECTION_HUB: boolean;
  MIGRATE_COLLECTION_VIEW: boolean;
  MIGRATE_COLLECTION_COMPONENTS: boolean;
  ENABLE_COLLECTION_AB_TESTING: boolean;
  ENABLE_MIGRATION_DASHBOARD: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  // Gradual rollout strategy
  USE_ENHANCED_BENTO: false,
  USE_REFACTORED_BENTO: false,
  USE_SPLIT_VIEW: false,
  USE_LEGACY_TABLE: true, // Safe default
  
  // Performance features
  ENABLE_VIRTUALIZED_TABLE: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_MEMOIZATION: true,
  
  // Safety features (always on)
  ENABLE_ERROR_BOUNDARIES: true,
  ENABLE_FALLBACK_UI: true,
  STRICT_TYPE_CHECKING: false, // Gradual adoption
  
  // Collection migration flags (gradual rollout)
  ENABLE_NEW_COLLECTION_SYSTEM: false,
  MIGRATE_COLLECTION_HUB: false,
  MIGRATE_COLLECTION_VIEW: false,
  MIGRATE_COLLECTION_COMPONENTS: false,
  ENABLE_COLLECTION_AB_TESTING: false,
  ENABLE_MIGRATION_DASHBOARD: false,
};

class FeatureFlagService {
  private flags: FeatureFlags;
  private overrides: Partial<FeatureFlags> = {};

  constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.loadFromEnvironment();
    this.loadFromLocalStorage();
  }

  private loadFromEnvironment(): void {
    // Server-side flags from environment
    Object.keys(DEFAULT_FLAGS).forEach(key => {
      const envValue = process.env[`REACT_APP_FF_${key}`];
      if (envValue !== undefined) {
        (this.flags as any)[key] = envValue === 'true';
      }
    });
  }

  private loadFromLocalStorage(): void {
    // Client-side overrides for testing
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        try {
          this.overrides = JSON.parse(stored);
          this.flags = { ...this.flags, ...this.overrides };
        } catch (e) {
          console.error('Failed to parse feature flags:', e);
        }
      }
    }
  }

  public isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag] ?? DEFAULT_FLAGS[flag];
  }

  public override(flag: keyof FeatureFlags, value: boolean): void {
    this.overrides[flag] = value;
    this.flags[flag] = value;
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('featureFlags', JSON.stringify(this.overrides));
    }
  }

  public getVariant(): 'legacy' | 'enhanced' | 'refactored' | 'split' {
    if (this.flags.USE_REFACTORED_BENTO) return 'refactored';
    if (this.flags.USE_ENHANCED_BENTO) return 'enhanced';
    if (this.flags.USE_SPLIT_VIEW) return 'split';
    return 'legacy';
  }

  public getRolloutPercentage(flag: keyof FeatureFlags): number {
    // Could integrate with A/B testing service
    const rolloutMap: Partial<Record<keyof FeatureFlags, number>> = {
      USE_ENHANCED_BENTO: 10,
      USE_REFACTORED_BENTO: 5,
      USE_SPLIT_VIEW: 15,
      STRICT_TYPE_CHECKING: 25,
    };
    
    return rolloutMap[flag] ?? 0;
  }
}

export const featureFlags = new FeatureFlagService();

// React hook for feature flags
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return featureFlags.isEnabled(flag);
}

// HOC for feature-flagged components
export function withFeatureFlag<P extends object>(
  flag: keyof FeatureFlags,
  Component: React.ComponentType<P>,
  Fallback?: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P): React.ReactElement | null => {
    if (featureFlags.isEnabled(flag)) {
      return React.createElement(Component, props);
    }
    return Fallback ? React.createElement(Fallback, props) : null;
  };
}