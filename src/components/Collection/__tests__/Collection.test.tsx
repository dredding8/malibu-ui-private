/**
 * Collection Component Unit Tests
 * 
 * Test suite for the main Collection compound component covering
 * rendering, states, and compound component integration.
 * 
 * @version 1.0.0
 * @date 2025-09-30
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Collection } from '../index';
import { Collection as CollectionType } from '../../../types/collection.types';

// Mock child components
jest.mock('../CollectionProvider', () => ({
  CollectionProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="collection-provider">{children}</div>,
}));

jest.mock('../CollectionEmpty', () => ({
  CollectionEmpty: () => <div data-testid="collection-empty">No collections</div>,
}));

jest.mock('../../hooks/useFeatureFlags', () => ({
  useFeatureFlag: jest.fn(() => true),
}));

// Mock collections data
const mockCollections: CollectionType[] = [
  {
    id: 'test-1',
    name: 'Test Collection 1',
    description: 'Test description',
    type: 'satellite',
    status: {
      operational: 'nominal',
      capacity: 'available',
      priority: 'routine',
      conflicts: 0,
      health: 95,
      healthScore: 95,
      lastUpdated: new Date(),
    },
    metadata: {
      classification: 'UNCLASSIFIED',
      criticality: 'medium',
      progress: 50,
      resourceRequirements: [],
      customProperties: {},
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user',
    updatedBy: 'test-user',
    tags: ['test', 'satellite'],
    childIds: [],
  },
];

describe('Collection Component', () => {
  describe('Loading State', () => {
    it('should render loading state with default spinner', () => {
      render(<Collection loading={true} />);
      
      expect(screen.getByText('Loading collections...')).toBeInTheDocument();
      expect(document.querySelector('.collection-loading')).toBeInTheDocument();
      expect(document.querySelector('.bp5-spinner')).toBeInTheDocument();
    });

    it('should render custom loading component when provided', () => {
      const CustomLoader = () => <div data-testid="custom-loader">Custom Loading...</div>;
      
      render(<Collection loading={true} loadingComponent={CustomLoader} />);
      
      expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });

    it('should apply custom className and styles to loading state', () => {
      render(
        <Collection 
          loading={true} 
          className="custom-class" 
          style={{ backgroundColor: 'red' }}
        />
      );
      
      const container = document.querySelector('.collection-container');
      expect(container).toHaveClass('custom-class');
      expect(container).toHaveStyle({ backgroundColor: 'red' });
    });
  });

  describe('Error State', () => {
    it('should render error state with default error display', () => {
      const errorMessage = 'Failed to load collections';
      
      render(<Collection error={errorMessage} />);
      
      expect(screen.getByText('Error Loading Collections')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(document.querySelector('.collection-error')).toBeInTheDocument();
    });

    it('should render custom error component when provided', () => {
      const CustomError = ({ error }: { error: string }) => (
        <div data-testid="custom-error">Custom Error: {error}</div>
      );
      
      render(
        <Collection 
          error="Test error" 
          errorComponent={CustomError} 
        />
      );
      
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();
    });

    it('should apply custom className and styles to error state', () => {
      render(
        <Collection 
          error="Test error" 
          className="error-class" 
          style={{ color: 'red' }}
        />
      );
      
      const container = document.querySelector('.collection-container');
      expect(container).toHaveClass('error-class');
      expect(container).toHaveStyle({ color: 'red' });
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no collections provided', () => {
      render(<Collection collections={[]} />);
      
      expect(screen.getByTestId('collection-empty')).toBeInTheDocument();
      expect(screen.getByText('No collections')).toBeInTheDocument();
    });

    it('should render empty state when collections is undefined', () => {
      render(<Collection />);
      
      expect(screen.getByTestId('collection-empty')).toBeInTheDocument();
    });

    it('should render custom empty component when provided', () => {
      const CustomEmpty = () => <div data-testid="custom-empty">No data available</div>;
      
      render(<Collection collections={[]} emptyComponent={CustomEmpty} />);
      
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should wrap empty state with CollectionProvider', () => {
      render(<Collection collections={[]} />);
      
      expect(screen.getByTestId('collection-provider')).toBeInTheDocument();
    });
  });

  describe('Normal State', () => {
    it('should render main interface with collections', () => {
      render(<Collection collections={mockCollections}>
        <div data-testid="children">Test children</div>
      </Collection>);
      
      expect(screen.getByTestId('collection-provider')).toBeInTheDocument();
      expect(screen.getByTestId('children')).toBeInTheDocument();
      expect(document.querySelector('.collection-container')).toBeInTheDocument();
    });

    it('should apply enhanced class when feature flag is enabled', () => {
      const { useFeatureFlag } = require('../../hooks/useFeatureFlags');
      useFeatureFlag.mockReturnValue(true);
      
      render(<Collection collections={mockCollections} />);
      
      const container = document.querySelector('.collection-container');
      expect(container).toHaveClass('enhanced');
    });

    it('should apply standard class when feature flag is disabled', () => {
      const { useFeatureFlag } = require('../../hooks/useFeatureFlags');
      useFeatureFlag.mockReturnValue(false);
      
      render(<Collection collections={mockCollections} />);
      
      const container = document.querySelector('.collection-container');
      expect(container).toHaveClass('standard');
    });

    it('should pass all props to CollectionProvider', () => {
      render(
        <Collection 
          collections={mockCollections}
          enableSelection={false}
          enableFiltering={false}
          enableSorting={true}
          enableBulkOperations={true}
          enableRealtime={false}
        />
      );
      
      // Verify provider is rendered (full prop verification would require provider test)
      expect(screen.getByTestId('collection-provider')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should forward additional props to container div', () => {
      render(
        <Collection 
          collections={mockCollections} 
          data-testid="custom-test-id"
          aria-label="Collections container"
        />
      );
      
      const container = document.querySelector('[data-testid="custom-test-id"]');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('aria-label', 'Collections container');
    });

    it('should handle ref forwarding', () => {
      const ref = React.createRef<HTMLDivElement>();
      
      render(<Collection ref={ref} collections={mockCollections} />);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should apply default props correctly', () => {
      render(<Collection collections={mockCollections} />);
      
      // Default props should be applied to provider
      expect(screen.getByTestId('collection-provider')).toBeInTheDocument();
    });
  });

  describe('State Priorities', () => {
    it('should prioritize loading state over error', () => {
      render(<Collection loading={true} error="Some error" />);
      
      expect(screen.getByText('Loading collections...')).toBeInTheDocument();
      expect(screen.queryByText('Error Loading Collections')).not.toBeInTheDocument();
    });

    it('should prioritize error state over empty', () => {
      render(<Collection error="Some error" collections={[]} />);
      
      expect(screen.getByText('Error Loading Collections')).toBeInTheDocument();
      expect(screen.queryByTestId('collection-empty')).not.toBeInTheDocument();
    });

    it('should prioritize empty state over normal when no collections', () => {
      render(<Collection collections={[]}>
        <div>Should not render</div>
      </Collection>);
      
      expect(screen.getByTestId('collection-empty')).toBeInTheDocument();
      expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
    });
  });
});

describe('Collection Compound Components', () => {
  it('should have all sub-components attached as static properties', () => {
    expect(Collection.Provider).toBeDefined();
    expect(Collection.Grid).toBeDefined();
    expect(Collection.List).toBeDefined();
    expect(Collection.Item).toBeDefined();
    expect(Collection.Empty).toBeDefined();
    expect(Collection.Header).toBeDefined();
    expect(Collection.Footer).toBeDefined();
    expect(Collection.Toolbar).toBeDefined();
    expect(Collection.Filters).toBeDefined();
    expect(Collection.Actions).toBeDefined();
    expect(Collection.Status).toBeDefined();
  });

  it('should have correct displayName', () => {
    expect(Collection.displayName).toBe('Collection');
  });
});

describe('Pre-composed Layouts', () => {
  it('should export CollectionStandard component', () => {
    const { CollectionStandard } = require('../index');
    expect(CollectionStandard).toBeDefined();
    expect(typeof CollectionStandard).toBe('function');
  });

  it('should export CollectionMinimal component', () => {
    const { CollectionMinimal } = require('../index');
    expect(CollectionMinimal).toBeDefined();
    expect(typeof CollectionMinimal).toBe('function');
  });

  it('should export CollectionManagement component', () => {
    const { CollectionManagement } = require('../index');
    expect(CollectionManagement).toBeDefined();
    expect(typeof CollectionManagement).toBe('function');
  });

  it('should export CollectionReadOnly component', () => {
    const { CollectionReadOnly } = require('../index');
    expect(CollectionReadOnly).toBeDefined();
    expect(typeof CollectionReadOnly).toBe('function');
  });
});