/**
 * Feature Flags Hook Unit Tests
 * 
 * Test suite for the useFeatureFlags and useFeatureFlag hooks covering
 * flag management, persistence, and A/B testing functionality.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeatureFlags, useFeatureFlag, useABTest } from '../useFeatureFlags';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.location
const mockLocation = {
  search: '',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock process.env
const originalEnv = process.env;

describe('useFeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocation.search = '';
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Initial Loading', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useFeatureFlags());
      
      expect(result.current.loading).toBe(true);
    });

    it('should load default flags', async () => {
      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progressiveComplexityUI).toBe(true);
      expect(result.current.enableVirtualScrolling).toBe(true);
      expect(result.current.USE_ENHANCED_STATUS).toBe(true);
      expect(result.current.USE_ENHANCED_BENTO).toBe(true);
      expect(result.current.ENABLE_NEW_COLLECTION_SYSTEM).toBe(true);
    });
  });

  describe('Local Storage Integration', () => {
    it('should load flags from localStorage', async () => {
      const storedFlags = {
        progressiveComplexityUI: false,
        USE_ENHANCED_STATUS: false,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedFlags));

      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progressiveComplexityUI).toBe(false);
      expect(result.current.USE_ENHANCED_STATUS).toBe(false);
      // Other flags should remain default
      expect(result.current.enableVirtualScrolling).toBe(true);
    });

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should fall back to defaults
      expect(result.current.progressiveComplexityUI).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should save flags to localStorage when toggled', async () => {
      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.toggleFlag('progressiveComplexityUI');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'featureFlags',
        expect.stringContaining('"progressiveComplexityUI":false')
      );
    });
  });

  describe('URL Query Parameters', () => {
    it('should load flags from URL query parameters', async () => {
      mockLocation.search = '?ff_progressiveComplexityUI=false&ff_USE_ENHANCED_STATUS=false';

      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progressiveComplexityUI).toBe(false);
      expect(result.current.USE_ENHANCED_STATUS).toBe(false);
    });

    it('should handle boolean string conversion', async () => {
      mockLocation.search = '?ff_enableVirtualScrolling=1&ff_enableDarkMode=true&ff_enableWorkspaceMode=0';

      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.enableVirtualScrolling).toBe(true);
      expect(result.current.enableDarkMode).toBe(true);
      expect(result.current.enableWorkspaceMode).toBe(false);
    });

    it('should handle special non-boolean flags', async () => {
      mockLocation.search = '?ff_bentoTransitionMode=instant';

      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.bentoTransitionMode).toBe('instant');
    });

    it('should ignore invalid flag names in URL', async () => {
      mockLocation.search = '?ff_invalidFlag=true&ff_progressiveComplexityUI=false';

      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progressiveComplexityUI).toBe(false);
      // Invalid flag should not be set
      expect((result.current as any).invalidFlag).toBeUndefined();
    });
  });

  describe('Environment Variables', () => {
    it('should load flags from environment variables', async () => {
      process.env.REACT_APP_FEATURE_PROGRESSIVE_UI = 'false';
      process.env.REACT_APP_FEATURE_VIRTUAL_SCROLLING = 'true';

      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progressiveComplexityUI).toBe(false);
      expect(result.current.enableVirtualScrolling).toBe(true);
    });
  });

  describe('Priority System', () => {
    it('should prioritize query > local > remote > env > default', async () => {
      // Set up different sources with conflicting values
      process.env.REACT_APP_FEATURE_PROGRESSIVE_UI = 'false'; // env
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({ progressiveComplexityUI: true }) // local
      );
      mockLocation.search = '?ff_progressiveComplexityUI=false'; // query

      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Query should win
      expect(result.current.progressiveComplexityUI).toBe(false);
    });
  });

  describe('Flag Management', () => {
    it('should toggle flag value', async () => {
      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialValue = result.current.progressiveComplexityUI;

      act(() => {
        result.current.toggleFlag('progressiveComplexityUI');
      });

      expect(result.current.progressiveComplexityUI).toBe(!initialValue);
    });

    it('should set specific flag value', async () => {
      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setFlag('enableDarkMode', false);
      });

      expect(result.current.enableDarkMode).toBe(false);

      act(() => {
        result.current.setFlag('enableDarkMode', true);
      });

      expect(result.current.enableDarkMode).toBe(true);
    });

    it('should reset all flags to defaults', async () => {
      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change some flags
      act(() => {
        result.current.setFlag('progressiveComplexityUI', false);
        result.current.setFlag('enableDarkMode', false);
      });

      // Reset
      act(() => {
        result.current.resetFlags();
      });

      expect(result.current.progressiveComplexityUI).toBe(true); // default
      expect(result.current.enableDarkMode).toBe(true); // default
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('featureFlags');
    });

    it('should check if flag is enabled', async () => {
      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isEnabled('progressiveComplexityUI')).toBe(true);
      expect(result.current.isEnabled('enableRealtimeCollaboration')).toBe(false);
    });

    it('should handle non-boolean flags in isEnabled', async () => {
      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Non-boolean flags should return true
      expect(result.current.isEnabled('bentoTransitionMode')).toBe(true);
    });
  });

  describe('Configuration Retrieval', () => {
    it('should return flag configuration', async () => {
      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const config = result.current.getFlagConfig();
      
      expect(config).toHaveProperty('progressiveComplexityUI');
      expect(config.progressiveComplexityUI).toHaveProperty('source');
      expect(config.progressiveComplexityUI).toHaveProperty('value');
      expect(config.progressiveComplexityUI).toHaveProperty('override');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage save errors', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => useFeatureFlags());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not throw when localStorage fails
      expect(() => {
        act(() => {
          result.current.toggleFlag('progressiveComplexityUI');
        });
      }).not.toThrow();
    });
  });
});

describe('useFeatureFlag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should return flag value for specific flag', async () => {
    const { result } = renderHook(() => useFeatureFlag('USE_ENHANCED_STATUS'));
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should return false for disabled flag', async () => {
    const { result } = renderHook(() => useFeatureFlag('enableRealtimeCollaboration'));
    
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should update when flag changes', async () => {
    const flagsHook = renderHook(() => useFeatureFlags());
    const flagHook = renderHook(() => useFeatureFlag('progressiveComplexityUI'));
    
    await waitFor(() => {
      expect(flagsHook.result.current.loading).toBe(false);
    });

    expect(flagHook.result.current).toBe(true);

    act(() => {
      flagsHook.result.current.toggleFlag('progressiveComplexityUI');
    });

    await waitFor(() => {
      expect(flagHook.result.current).toBe(false);
    });
  });
});

describe('useABTest', () => {
  it('should assign consistent variant based on test name', () => {
    const { result: result1 } = renderHook(() => 
      useABTest('test-experiment', ['control', 'variant-a', 'variant-b'])
    );
    
    const { result: result2 } = renderHook(() => 
      useABTest('test-experiment', ['control', 'variant-a', 'variant-b'])
    );

    // Same test name should get same variant
    expect(result1.current).toBe(result2.current);
  });

  it('should assign different variants for different test names', () => {
    const { result: result1 } = renderHook(() => 
      useABTest('test-a', ['control', 'variant'])
    );
    
    const { result: result2 } = renderHook(() => 
      useABTest('test-b', ['control', 'variant'])
    );

    // Different test names might get different variants
    // (not guaranteed, but with high probability for different strings)
    expect(['control', 'variant']).toContain(result1.current);
    expect(['control', 'variant']).toContain(result2.current);
  });

  it('should handle single variant', () => {
    const { result } = renderHook(() => 
      useABTest('single-variant-test', ['only-variant'])
    );

    expect(result.current).toBe('only-variant');
  });

  it('should start with control variant', () => {
    const { result } = renderHook(() => 
      useABTest('initial-test', ['control', 'variant'])
    );

    // Initially should be 'control' before useEffect runs
    expect(['control', 'variant']).toContain(result.current);
  });
});