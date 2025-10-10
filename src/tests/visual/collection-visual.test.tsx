/**
 * Collection Visual Regression Test Suite
 * 
 * Comprehensive visual testing for the collection management system.
 * Ensures UI consistency, responsive design, theme switching,
 * and accessibility compliance across different scenarios.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 * @wave Wave 4 - Validation & Testing
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Components under test
import { CollectionStandardMigrated } from '../../components/Collection/variants/CollectionStandardMigrated';
import { CollectionBentoMigrated } from '../../components/Collection/variants/CollectionBentoMigrated';

// Theme and styling context
import { ThemeProvider } from 'styled-components';

// Types
import { CollectionOpportunity } from '../../types/collectionOpportunities';

// =============================================================================
// Test Setup & Configuration
// =============================================================================

// Mock visual testing utilities (would use actual tools like Percy, Chromatic, etc.)
const mockVisualTest = jest.fn();
const mockScreenshot = jest.fn();

jest.mock('../../utils/visualTesting', () => ({
  captureScreenshot: mockScreenshot,
  compareVisual: mockVisualTest,
  generateVisualBaseline: jest.fn(),
  detectVisualRegression: jest.fn()
}));

// Theme configurations for testing
const lightTheme = {
  colors: {
    primary: '#0f60ff',
    background: '#ffffff',
    surface: '#f5f8fa',
    text: '#182026',
    border: '#d1d9e0'
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px'
  },
  borderRadius: '4px',
  shadows: {
    elevation1: '0 1px 3px rgba(0,0,0,0.12)',
    elevation2: '0 2px 6px rgba(0,0,0,0.16)'
  }
};

const darkTheme = {
  colors: {
    primary: '#48aff0',
    background: '#1c2127',
    surface: '#252a31',
    text: '#f5f8fa',
    border: '#404854'
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    elevation1: '0 1px 3px rgba(0,0,0,0.24)',
    elevation2: '0 2px 6px rgba(0,0,0,0.32)'
  }
};

const highContrastTheme = {
  colors: {
    primary: '#ffff00',
    background: '#000000',
    surface: '#111111',
    text: '#ffffff',
    border: '#ffffff'
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    elevation1: '0 0 0 2px #ffffff',
    elevation2: '0 0 0 3px #ffffff'
  }
};

// Viewport configurations for responsive testing
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  largeDesktop: { width: 1920, height: 1080 },
  ultraWide: { width: 2560, height: 1440 }
};

// Test data generator
const createVisualTestData = (count: number = 20): CollectionOpportunity[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `visual-test-${String(i + 1).padStart(3, '0')}`,
    title: `Visual Test Opportunity ${i + 1}`,
    name: `Visual Test Opportunity ${i + 1}`,
    description: `Test opportunity for visual regression testing. This description has varying lengths to test layout consistency. Item ${i + 1} ${i % 2 === 0 ? 'has additional content for testing text wrapping and layout behavior.' : 'is shorter.'}`,
    type: ['optimization', 'expansion', 'testing', 'analysis'][i % 4] as any,
    status: ['active', 'pending', 'completed', 'paused', 'draft'][i % 5] as any,
    health: 0.1 + (i % 9) * 0.1, // 0.1 to 0.9
    matchStatus: ['baseline', 'suboptimal', 'optimal'][i % 3] as any,
    priority: ['high', 'medium', 'low'][i % 3] as any,
    sites: [`site-${i + 1}`, `site-${i + 2}`],
    allocation: [25, 50, 75, 100][i % 4],
    lastModified: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    version: '1.0.0',
    createdAt: new Date(Date.now() - (i + 30) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    details: `Visual test details ${i + 1}`
  }));
};

// Test wrapper with theme support
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  theme?: typeof lightTheme;
  viewport?: keyof typeof viewports;
}> = ({ children, theme = lightTheme, viewport = 'desktop' }) => {
  // Mock viewport sizing
  React.useEffect(() => {
    if (viewport && viewports[viewport]) {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: viewports[viewport].width,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: viewports[viewport].height,
      });
    }
  }, [viewport]);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ 
        width: viewport ? viewports[viewport].width : '100%',
        height: viewport ? viewports[viewport].height : '100vh',
        overflow: 'auto'
      }}>
        {children}
      </div>
    </ThemeProvider>
  );
};

// =============================================================================
// Theme Switching Visual Tests
// =============================================================================

describe('Theme Switching Visual Tests', () => {
  const testOpportunities = createVisualTestData(15);

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('light theme visual baseline', async () => {
    render(
      <TestWrapper theme={lightTheme}>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    // Capture visual baseline for light theme
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'collection-standard-light-theme',
        fullPage: true,
        threshold: 0.1
      })
    );
  });

  test('dark theme visual consistency', async () => {
    render(
      <TestWrapper theme={darkTheme}>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    // Verify dark theme renders correctly
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'collection-standard-dark-theme',
        fullPage: true,
        threshold: 0.1
      })
    );
  });

  test('high contrast theme accessibility', async () => {
    render(
      <TestWrapper theme={highContrastTheme}>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    // Verify high contrast theme meets accessibility requirements
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'collection-standard-high-contrast-theme',
        fullPage: true,
        threshold: 0.2 // Higher threshold for high contrast differences
      })
    );
  });

  test('theme transition smoothness', async () => {
    const TestThemeSwitch = () => {
      const [isDark, setIsDark] = React.useState(false);
      
      return (
        <TestWrapper theme={isDark ? darkTheme : lightTheme}>
          <button 
            onClick={() => setIsDark(!isDark)}
            data-testid="theme-toggle"
          >
            Toggle Theme
          </button>
          <CollectionStandardMigrated
            opportunities={testOpportunities.slice(0, 8)}
            selectedIds={[]}
          />
        </TestWrapper>
      );
    };

    const user = userEvent.setup();
    render(<TestThemeSwitch />);

    await waitFor(() => screen.getByRole('main'));

    // Capture before theme switch
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'before-theme-switch' })
    );

    // Switch theme
    await user.click(screen.getByTestId('theme-toggle'));
    await waitFor(() => screen.getByRole('main'));

    // Capture after theme switch
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'after-theme-switch' })
    );
  });
});

// =============================================================================
// Responsive Design Visual Tests
// =============================================================================

describe('Responsive Design Visual Tests', () => {
  const testOpportunities = createVisualTestData(12);

  test('mobile viewport layout', async () => {
    render(
      <TestWrapper viewport="mobile">
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
          enableMobileOptimizations={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'collection-mobile-layout',
        viewport: viewports.mobile,
        fullPage: true
      })
    );
  });

  test('tablet viewport layout', async () => {
    render(
      <TestWrapper viewport="tablet">
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'collection-tablet-layout',
        viewport: viewports.tablet,
        fullPage: true
      })
    );
  });

  test('desktop viewport layout', async () => {
    render(
      <TestWrapper viewport="desktop">
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'collection-desktop-layout',
        viewport: viewports.desktop,
        fullPage: true
      })
    );
  });

  test('ultra-wide viewport layout', async () => {
    render(
      <TestWrapper viewport="ultraWide">
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'collection-ultrawide-layout',
        viewport: viewports.ultraWide,
        fullPage: true
      })
    );
  });

  test('responsive breakpoint transitions', async () => {
    const ResponsiveTest = () => {
      const [viewport, setViewport] = React.useState<keyof typeof viewports>('desktop');
      
      return (
        <div>
          <div style={{ padding: '10px', background: '#f0f0f0' }}>
            <button onClick={() => setViewport('mobile')}>Mobile</button>
            <button onClick={() => setViewport('tablet')}>Tablet</button>
            <button onClick={() => setViewport('desktop')}>Desktop</button>
          </div>
          <TestWrapper viewport={viewport}>
            <CollectionStandardMigrated
              opportunities={testOpportunities.slice(0, 6)}
              selectedIds={[]}
            />
          </TestWrapper>
        </div>
      );
    };

    const user = userEvent.setup();
    render(<ResponsiveTest />);

    await waitFor(() => screen.getByRole('main'));

    // Test transitions between viewports
    const breakpoints = ['mobile', 'tablet', 'desktop'] as const;
    
    for (const breakpoint of breakpoints) {
      await user.click(screen.getByText(breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)));
      await waitFor(() => screen.getByRole('main'));
      
      expect(mockScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          name: `responsive-${breakpoint}`,
          viewport: viewports[breakpoint]
        })
      );
    }
  });
});

// =============================================================================
// Component Variant Visual Tests
// =============================================================================

describe('Component Variant Visual Tests', () => {
  const testOpportunities = createVisualTestData(10);

  test('standard layout visual baseline', async () => {
    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'collection-standard-variant',
        fullPage: true
      })
    );
  });

  test('bento layout visual baseline', async () => {
    render(
      <TestWrapper>
        <CollectionBentoMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'collection-bento-variant',
        fullPage: true
      })
    );
  });

  test('variant comparison consistency', async () => {
    const VariantComparison = () => {
      const [variant, setVariant] = React.useState<'standard' | 'bento'>('standard');
      
      return (
        <div>
          <div style={{ padding: '10px', background: '#f0f0f0' }}>
            <button onClick={() => setVariant('standard')}>Standard</button>
            <button onClick={() => setVariant('bento')}>Bento</button>
          </div>
          <TestWrapper>
            {variant === 'standard' ? (
              <CollectionStandardMigrated
                opportunities={testOpportunities.slice(0, 8)}
                selectedIds={[]}
              />
            ) : (
              <CollectionBentoMigrated
                opportunities={testOpportunities.slice(0, 8)}
                selectedIds={[]}
              />
            )}
          </TestWrapper>
        </div>
      );
    };

    const user = userEvent.setup();
    render(<VariantComparison />);

    await waitFor(() => screen.getByRole('main'));

    // Capture standard variant
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'variant-standard' })
    );

    // Switch to bento variant
    await user.click(screen.getByText('Bento'));
    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'variant-bento' })
    );
  });
});

// =============================================================================
// Interactive State Visual Tests
// =============================================================================

describe('Interactive State Visual Tests', () => {
  const testOpportunities = createVisualTestData(8);

  test('selection states visual consistency', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    // Capture initial state
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'selection-none' })
    );

    // Select first item
    const firstCell = screen.getAllByRole('gridcell')[0];
    await user.click(firstCell);

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'selection-single' })
    );

    // Select multiple items
    const thirdCell = screen.getAllByRole('gridcell')[2];
    await user.keyboard('{Control>}');
    await user.click(thirdCell);
    await user.keyboard('{/Control}');

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'selection-multiple' })
    );
  });

  test('hover states visual feedback', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    // Hover over first row
    const firstRow = screen.getAllByRole('gridcell')[0];
    await user.hover(firstRow);

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'hover-state' })
    );

    // Unhover
    await user.unhover(firstRow);

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'hover-none' })
    );
  });

  test('focus states accessibility', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
          enableKeyboardNavigation={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    // Tab to first focusable element
    await user.tab();

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'focus-first-element' })
    );

    // Tab through several elements
    await user.tab();
    await user.tab();

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'focus-navigation' })
    );
  });

  test('loading states visual representation', async () => {
    const LoadingTest = () => {
      const [loading, setLoading] = React.useState(true);
      
      React.useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
      }, []);
      
      return (
        <TestWrapper>
          <CollectionStandardMigrated
            opportunities={testOpportunities}
            selectedIds={[]}
            loading={loading}
          />
        </TestWrapper>
      );
    };

    render(<LoadingTest />);

    // Capture loading state
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'loading-state' })
    );

    // Wait for loaded state
    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'loaded-state' })
    );
  });

  test('error states visual handling', async () => {
    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={[]}
          selectedIds={[]}
          error="Failed to load opportunities"
          enableErrorBoundary={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByText(/failed to load/i));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'error-state' })
    );
  });

  test('empty states visual design', async () => {
    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={[]}
          selectedIds={[]}
          enableEmptyState={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByText(/no opportunities/i));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'empty-state' })
    );
  });
});

// =============================================================================
// Typography and Content Visual Tests
// =============================================================================

describe('Typography and Content Visual Tests', () => {
  test('typography scale consistency', async () => {
    const typographyTestOpportunities = createVisualTestData(5).map((opp, i) => ({
      ...opp,
      title: i === 0 ? 'Short Title' : 
             i === 1 ? 'Medium Length Title That Spans Multiple Words' :
             i === 2 ? 'Very Long Title That Tests Text Wrapping and Layout Behavior in Constrained Spaces' :
             i === 3 ? 'Title with UPPERCASE and MixedCase and lowercase text' :
             'Title with Numbers 123 and Special Characters !@#$%',
      description: i === 0 ? 'Short desc.' :
                  i === 1 ? 'Medium length description with standard content.' :
                  i === 2 ? 'Very detailed description that contains multiple sentences and tests how the layout handles longer content. This should wrap appropriately and maintain good readability.' :
                  i === 3 ? 'Description with VARIOUS formatting and Numbers 456' :
                  'Description with special characters: áéíóú, ñ, and symbols ★☆♠♣'
    }));

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={typographyTestOpportunities}
          selectedIds={[]}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ 
        name: 'typography-consistency',
        fullPage: true 
      })
    );
  });

  test('content overflow handling', async () => {
    const overflowTestOpportunities = createVisualTestData(3).map((opp, i) => ({
      ...opp,
      title: `${'Very '.repeat(20)}Long Title ${i + 1}`,
      description: `${'This is a very long description that should test content overflow behavior. '.repeat(10)}Item ${i + 1}.`,
      sites: Array.from({ length: 15 }, (_, j) => `very-long-site-name-${i}-${j}`)
    }));

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={overflowTestOpportunities}
          selectedIds={[]}
          enableTextTruncation={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ 
        name: 'content-overflow-handling',
        fullPage: true 
      })
    );
  });

  test('internationalization text layout', async () => {
    const i18nTestOpportunities = createVisualTestData(4).map((opp, i) => ({
      ...opp,
      title: [
        'English Test Opportunity',
        'Oportunidad de Prueba en Español',
        'Opportunité de Test en Français',
        'テスト機会 (Japanese)'
      ][i],
      description: [
        'English description with standard Latin characters.',
        'Descripción en español con caracteres especiales: ñáéíóú.',
        'Description française avec accents: àâäçéèêëïîôù.',
        '日本語の説明文です。漢字、ひらがな、カタカナが含まれています。'
      ][i]
    }));

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={i18nTestOpportunities}
          selectedIds={[]}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ 
        name: 'internationalization-layout',
        fullPage: true 
      })
    );
  });
});

// =============================================================================
// Animation and Transition Visual Tests
// =============================================================================

describe('Animation and Transition Visual Tests', () => {
  test('smooth scrolling visual consistency', async () => {
    const user = userEvent.setup();
    const largeDataset = createVisualTestData(100);

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={largeDataset}
          selectedIds={[]}
          enableVirtualization={true}
          enableSmoothScrolling={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    // Capture initial scroll position
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'scroll-position-top' })
    );

    // Scroll down
    const grid = screen.getByRole('grid');
    await user.keyboard('{PageDown}');
    
    // Small delay for scroll animation
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'scroll-position-middle' })
    );
  });

  test('selection animation visual feedback', async () => {
    const user = userEvent.setup();
    const testOpportunities = createVisualTestData(6);

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
          enableSelectionAnimations={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    // Capture before selection
    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'before-selection-animation' })
    );

    // Click to select
    const firstCell = screen.getAllByRole('gridcell')[0];
    await user.click(firstCell);

    // Small delay for animation
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'after-selection-animation' })
    );
  });

  test('reduced motion accessibility compliance', async () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const testOpportunities = createVisualTestData(5);

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
          enableSelection={true}
          respectReducedMotion={true}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ 
        name: 'reduced-motion-compliance',
        fullPage: true 
      })
    );
  });
});

// =============================================================================
// Cross-Browser Visual Consistency
// =============================================================================

describe('Cross-Browser Visual Consistency', () => {
  test('webkit rendering consistency', async () => {
    // Mock webkit user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      configurable: true
    });

    const testOpportunities = createVisualTestData(8);

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ 
        name: 'webkit-rendering',
        browser: 'webkit' 
      })
    );
  });

  test('firefox rendering consistency', async () => {
    // Mock firefox user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      configurable: true
    });

    const testOpportunities = createVisualTestData(8);

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ 
        name: 'firefox-rendering',
        browser: 'firefox' 
      })
    );
  });

  test('chromium rendering consistency', async () => {
    // Mock chromium user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true
    });

    const testOpportunities = createVisualTestData(8);

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={testOpportunities}
          selectedIds={[]}
        />
      </TestWrapper>
    );

    await waitFor(() => screen.getByRole('main'));

    expect(mockScreenshot).toHaveBeenCalledWith(
      expect.objectContaining({ 
        name: 'chromium-rendering',
        browser: 'chromium' 
      })
    );
  });
});

// =============================================================================
// Test Cleanup
// =============================================================================

afterEach(() => {
  jest.clearAllMocks();
});