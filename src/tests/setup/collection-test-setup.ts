/**
 * Collection Test Setup
 * 
 * Global test setup for collection management test suite.
 * Configures mocks, utilities, and test environment for
 * comprehensive testing across all test categories.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 * @wave Wave 4 - Validation & Testing
 */

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// =============================================================================
// Global Test Configuration
// =============================================================================

// Increase timeout for performance tests
jest.setTimeout(30000);

// =============================================================================
// Performance Testing Setup
// =============================================================================

// Mock performance APIs for consistent testing
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  memory: {
    usedJSHeapSize: 10 * 1024 * 1024, // 10MB
    totalJSHeapSize: 50 * 1024 * 1024, // 50MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
  }
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

// =============================================================================
// Intersection Observer Mock
// =============================================================================

class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true
});

Object.defineProperty(global, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true
});

// =============================================================================
// Resize Observer Mock
// =============================================================================

class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true
});

// =============================================================================
// Media Query Mock
// =============================================================================

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// =============================================================================
// Local Storage Mock
// =============================================================================

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
});

// =============================================================================
// Fetch Mock
// =============================================================================

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData())
  } as Response)
);

// =============================================================================
// Console Mock for Performance Tests
// =============================================================================

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info
};

// Mock console methods to avoid noise in performance tests
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();
console.info = jest.fn();

// Restore console for specific test suites if needed
(global as any).restoreConsole = () => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
};

// =============================================================================
// Viewport Mock
// =============================================================================

Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// =============================================================================
// Request Animation Frame Mock
// =============================================================================

global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// =============================================================================
// URL Mock
// =============================================================================

Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn()
  },
  writable: true
});

// =============================================================================
// Navigation API Mock
// =============================================================================

Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    userAgent: 'Mozilla/5.0 (Test Environment)',
    platform: 'Test',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
    cookieEnabled: true,
    doNotTrack: null,
    geolocation: {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn()
    }
  },
  writable: true
});

// =============================================================================
// Test Data Utilities
// =============================================================================

export const createMockOpportunity = (overrides = {}) => ({
  id: 'test-opportunity-1',
  title: 'Test Opportunity',
  name: 'Test Opportunity',
  description: 'Test opportunity description',
  type: 'optimization',
  status: 'active',
  health: 0.85,
  matchStatus: 'baseline',
  priority: 'high',
  sites: ['site1', 'site2'],
  allocation: 100,
  lastModified: new Date().toISOString(),
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  details: 'Test opportunity details',
  ...overrides
});

export const createMockCollection = (overrides = {}) => ({
  id: 'test-collection-1',
  name: 'Test Collection',
  description: 'Test collection description',
  type: 'opportunity',
  status: 'active',
  health: 0.85,
  metadata: {
    originalType: 'opportunity',
    matchStatus: 'baseline',
    priority: 'high'
  },
  tags: ['test', 'collection'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

// =============================================================================
// Performance Test Utilities
// =============================================================================

export const measureExecutionTime = async (fn: () => Promise<void> | void): Promise<number> => {
  const start = performance.now();
  await fn();
  return performance.now() - start;
};

export const mockPerformanceEntry = (name: string, duration: number) => ({
  name,
  duration,
  startTime: performance.now(),
  entryType: 'measure',
  toJSON: () => ({ name, duration })
});

// =============================================================================
// Test Environment Cleanup
// =============================================================================

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset local storage
  localStorageMock.clear();
  
  // Reset performance mocks
  mockPerformance.now.mockReturnValue(Date.now());
  mockPerformance.getEntriesByType.mockReturnValue([]);
  
  // Reset fetch mock
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    clone: jest.fn()
  });
});

afterEach(() => {
  // Clean up any side effects
  jest.restoreAllMocks();
});

// =============================================================================
// Error Boundary Test Utility
// =============================================================================

export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { 'data-testid': 'error-boundary' }, `Error: ${this.state.error?.message}`);
    }

    return this.props.children;
  }
}

// =============================================================================
// Global Test Constants
// =============================================================================

export const TEST_CONSTANTS = {
  PERFORMANCE_THRESHOLDS: {
    RENDER_TIME: 200, // ms
    INTERACTION_TIME: 50, // ms
    MEMORY_INCREASE: 100 * 1024 * 1024, // 100MB
  },
  
  VIEWPORT_SIZES: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 }
  },
  
  TEST_IDS: {
    COLLECTION_MAIN: 'collection-main',
    COLLECTION_GRID: 'collection-grid',
    COLLECTION_TOOLBAR: 'collection-toolbar',
    BULK_OPERATIONS: 'bulk-operations-toolbar'
  }
};

// Make React available globally for JSX
import React from 'react';
(global as any).React = React;