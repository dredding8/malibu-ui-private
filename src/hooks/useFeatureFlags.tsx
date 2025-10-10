/**
 * Feature Flags Hook
 * Manages feature toggles for progressive rollout of new functionality
 */

import { useState, useEffect, useCallback } from 'react';

// Feature flag definitions
export interface FeatureFlags {
  progressiveComplexityUI: boolean;
  enableVirtualScrolling: boolean;
  enableWorkspaceMode: boolean;
  enableBatchOperations: boolean;
  enableHealthAnalysis: boolean;
  enableRealtimeCollaboration: boolean;
  enableAdvancedFilters: boolean;
  enableAutoOptimization: boolean;
  enableExportImport: boolean;
  enableDarkMode: boolean;
  useRefactoredComponents: boolean;
  enableSplitView: boolean;
  enableBentoLayout: boolean;
  enableEnhancedBento: boolean;
  bentoTransitionMode: 'instant' | 'animated' | 'progressive';
  // Collection management feature flags
  USE_ENHANCED_STATUS: boolean;
  USE_ENHANCED_BENTO: boolean;
  ENABLE_NEW_COLLECTION_SYSTEM: boolean;
  MIGRATE_COLLECTION_HUB: boolean;
  // UI Consolidation feature flags
  ENABLE_UNIFIED_EDITOR: boolean;
  UNIFIED_EDITOR_QUICK_MODE: boolean;
  UNIFIED_EDITOR_STANDARD_MODE: boolean;
  UNIFIED_EDITOR_OVERRIDE_MODE: boolean;
  // Legacy Mode feature flags (for migrating users)
  LEGACY_MODE: boolean;
  LEGACY_HIDE_ANALYTICS_TAB: boolean;
  LEGACY_HIDE_SETTINGS_TAB: boolean;
  LEGACY_HIDE_MORE_ACTIONS: boolean;
  LEGACY_HIDE_SEARCH: boolean;
  LEGACY_SIMPLE_TABLE_ACTIONS: boolean;
  LEGACY_SHOW_ALL_TOGGLE: boolean;
  LEGACY_HIDE_HEALTH_WIDGET: boolean;
}

// Default feature flag values
const defaultFlags: FeatureFlags = {
  progressiveComplexityUI: true,
  enableVirtualScrolling: true,
  enableWorkspaceMode: true,
  enableBatchOperations: true,
  enableHealthAnalysis: true,
  enableRealtimeCollaboration: false,
  enableAdvancedFilters: true,
  enableAutoOptimization: true,
  enableExportImport: false,
  enableDarkMode: true,
  useRefactoredComponents: false, // Disabled - using enhanced component
  enableSplitView: false, // Disabled in favor of Enhanced
  enableBentoLayout: false, // Disabled to use Enhanced component
  enableEnhancedBento: false, // Disabled to use Enhanced component
  bentoTransitionMode: 'animated' as const, // Smooth transition from modal to Bento
  // Collection management feature flags
  USE_ENHANCED_STATUS: true,
  USE_ENHANCED_BENTO: true,
  ENABLE_NEW_COLLECTION_SYSTEM: false, // Disabled due to infinite render loop
  MIGRATE_COLLECTION_HUB: false,
  // UI Consolidation feature flags
  ENABLE_UNIFIED_EDITOR: true, // ✅ ENABLED - Integration testing phase
  UNIFIED_EDITOR_QUICK_MODE: true, // Quick mode ready first
  UNIFIED_EDITOR_STANDARD_MODE: true, // Standard mode ready for testing
  UNIFIED_EDITOR_OVERRIDE_MODE: true, // Override mode ready for testing
  // Legacy Mode feature flags (for migrating users)
  LEGACY_MODE: true, // Set to true for legacy users migrating from old system
  LEGACY_HIDE_ANALYTICS_TAB: true, // Auto-enabled when LEGACY_MODE=true
  LEGACY_HIDE_SETTINGS_TAB: true, // Auto-enabled when LEGACY_MODE=true
  LEGACY_HIDE_MORE_ACTIONS: true, // Hide MORE menu, but keep critical actions
  LEGACY_HIDE_SEARCH: false, // Keep search - it's useful
  LEGACY_SIMPLE_TABLE_ACTIONS: false, // KEEP FALSE - override workflow has precedence
  LEGACY_SHOW_ALL_TOGGLE: false, // Redundant with tabs
  LEGACY_HIDE_HEALTH_WIDGET: true, // Auto-enabled when LEGACY_MODE=true - removes dashboard
};

// Feature flag sources
type FlagSource = 'local' | 'remote' | 'query' | 'env';

interface FlagConfig {
  source: FlagSource;
  value: boolean | string; // Support both boolean and string values
  override?: boolean;
}

// Hook for managing feature flags
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load flags from various sources
  useEffect(() => {
    const loadFlags = async () => {
      try {
        setLoading(true);
        
        // 1. Load from localStorage
        const localFlags = loadLocalFlags();
        
        // 2. Load from URL query parameters
        const queryFlags = loadQueryFlags();
        
        // 3. Load from environment variables
        const envFlags = loadEnvFlags();
        
        // 4. Load from remote configuration (simulate API call)
        const remoteFlags = await loadRemoteFlags();
        
        // Merge flags with priority: query > local > remote > env > default
        let mergedFlags = {
          ...defaultFlags,
          ...envFlags,
          ...remoteFlags,
          ...localFlags,
          ...queryFlags,
        };

        // LEGACY_MODE auto-enables related flags
        if (mergedFlags.LEGACY_MODE) {
          mergedFlags = {
            ...mergedFlags,
            LEGACY_HIDE_ANALYTICS_TAB: true,
            LEGACY_HIDE_SETTINGS_TAB: true,
            LEGACY_HIDE_MORE_ACTIONS: true,
            LEGACY_HIDE_SEARCH: true,
            LEGACY_SIMPLE_TABLE_ACTIONS: true,
            LEGACY_SHOW_ALL_TOGGLE: true,
            LEGACY_HIDE_HEALTH_WIDGET: true,
          };
        }

        setFlags(mergedFlags);
        setError(null);
      } catch (err) {
        console.error('Failed to load feature flags:', err);
        setError(err as Error);
        // Use defaults on error
        setFlags(defaultFlags);
      } finally {
        setLoading(false);
      }
    };

    loadFlags();
  }, []);

  // Load flags from localStorage
  const loadLocalFlags = (): Partial<FeatureFlags> => {
    try {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to load local flags:', err);
    }
    return {};
  };

  // Load flags from URL query parameters
  const loadQueryFlags = (): Partial<FeatureFlags> => {
    const params = new URLSearchParams(window.location.search);
    const queryFlags: Partial<FeatureFlags> = {};
    
    // Check for feature flag parameters
    // Convert entries to array to avoid downlevelIteration issue
    const entries = Array.from(params.entries());
    for (const [key, value] of entries) {
      if (key.startsWith('ff_')) {
        const flagName = key.substring(3) as keyof FeatureFlags;
        if (flagName in defaultFlags) {
          if (flagName === 'bentoTransitionMode') {
            // Special handling for non-boolean flag
            queryFlags[flagName] = value as 'instant' | 'animated' | 'progressive';
          } else {
            // Type assertion needed because TypeScript doesn't know which flags are boolean
            (queryFlags as any)[flagName] = value === 'true' || value === '1';
          }
        }
      }
    }
    
    return queryFlags;
  };

  // Load flags from environment variables
  const loadEnvFlags = (): Partial<FeatureFlags> => {
    const envFlags: Partial<FeatureFlags> = {};

    // Check for environment-based flags
    if (process.env.REACT_APP_FEATURE_PROGRESSIVE_UI) {
      envFlags.progressiveComplexityUI = process.env.REACT_APP_FEATURE_PROGRESSIVE_UI === 'true';
    }
    if (process.env.REACT_APP_FEATURE_VIRTUAL_SCROLLING) {
      envFlags.enableVirtualScrolling = process.env.REACT_APP_FEATURE_VIRTUAL_SCROLLING === 'true';
    }
    // LEGACY_MODE environment variable
    if (process.env.REACT_APP_LEGACY_MODE) {
      envFlags.LEGACY_MODE = process.env.REACT_APP_LEGACY_MODE === 'true';
    }

    return envFlags;
  };

  // Load flags from remote configuration (simulated)
  const loadRemoteFlags = async (): Promise<Partial<FeatureFlags>> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In production, this would be an actual API call
    // For now, return some simulated remote flags
    return {
      enableRealtimeCollaboration: false, // Disabled remotely
      enableExportImport: false, // Not ready yet
    };
  };

  // Toggle a specific flag
  const toggleFlag = useCallback((flagName: keyof FeatureFlags) => {
    setFlags(prev => {
      const updated = {
        ...prev,
        [flagName]: !prev[flagName],
      };
      
      // Save to localStorage
      try {
        localStorage.setItem('featureFlags', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save feature flags:', err);
      }
      
      return updated;
    });
  }, []);

  // Reset all flags to defaults
  const resetFlags = useCallback(() => {
    setFlags(defaultFlags);
    try {
      localStorage.removeItem('featureFlags');
    } catch (err) {
      console.error('Failed to clear feature flags:', err);
    }
  }, []);

  // Set a specific flag value
  const setFlag = useCallback((flagName: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => {
      const updated = {
        ...prev,
        [flagName]: value,
      };
      
      // Save to localStorage
      try {
        localStorage.setItem('featureFlags', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save feature flags:', err);
      }
      
      return updated;
    });
  }, []);

  // Check if a feature is enabled
  const isEnabled = useCallback((flagName: keyof FeatureFlags): boolean => {
    const value = flags[flagName] ?? defaultFlags[flagName];
    // Special handling for non-boolean flags
    if (flagName === 'bentoTransitionMode') {
      return true; // Always return true for non-boolean flags
    }
    return value as boolean;
  }, [flags]);

  // Get flag configuration for debugging
  const getFlagConfig = useCallback((): Record<keyof FeatureFlags, FlagConfig> => {
    const config: Record<string, FlagConfig> = {};
    
    for (const key in flags) {
      const flagName = key as keyof FeatureFlags;
      config[flagName] = {
        source: 'local', // Simplified for this example
        value: flags[flagName],
        override: false,
      };
    }
    
    return config as Record<keyof FeatureFlags, FlagConfig>;
  }, [flags]);

  return {
    ...flags,
    loading,
    error,
    toggleFlag,
    resetFlags,
    setFlag,
    isEnabled,
    getFlagConfig,
  };
};

// Simple hook for checking individual feature flags
export const useFeatureFlag = (flagName: keyof FeatureFlags): boolean => {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flagName);
};

// Hook for A/B testing with feature flags
export const useABTest = (testName: string, variants: string[]) => {
  const [variant, setVariant] = useState<string>('control');
  
  useEffect(() => {
    // Simple hash-based assignment for consistent variant assignment
    const hash = testName.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    const index = Math.abs(hash) % variants.length;
    setVariant(variants[index]);
  }, [testName, variants]);
  
  return variant;
};

// Development-only feature flag manager component
export const FeatureFlagManager: React.FC = () => {
  const flags = useFeatureFlags();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'white',
      border: '1px solid #ccc',
      padding: 16,
      borderRadius: 6,
      maxHeight: 400,
      overflowY: 'auto',
      zIndex: 1000,
      fontSize: 12,
    }}>
      <h4 style={{ margin: '0 0 12px 0' }}>Feature Flags</h4>
      {Object.entries(flags).map(([key, value]) => {
        if (typeof value !== 'boolean') return null;
        
        return (
          <label key={key} style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={value}
              onChange={() => flags.toggleFlag(key as keyof FeatureFlags)}
            />
            <span style={{ marginLeft: 8 }}>{key}</span>
          </label>
        );
      })}
      <button
        onClick={flags.resetFlags}
        style={{
          marginTop: 12,
          padding: '4px 8px',
          fontSize: 12,
        }}
      >
        Reset to Defaults
      </button>
    </div>
  );
};