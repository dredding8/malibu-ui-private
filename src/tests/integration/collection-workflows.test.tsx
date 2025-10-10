/**
 * Collection Workflows Integration Test Suite
 * 
 * Comprehensive end-to-end testing of complete user workflows
 * in the collection management system. Tests the integration
 * between all components and user interaction patterns.
 * 
 * @version 2.0.0
 * @date 2025-09-30
 * @wave Wave 4 - Validation & Testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Core components
import { CollectionProvider } from '../../components/Collection/CollectionProvider';
import { CollectionStandardMigrated } from '../../components/Collection/variants/CollectionStandardMigrated';
import { CollectionBentoMigrated } from '../../components/Collection/variants/CollectionBentoMigrated';

// Context providers
import { NavigationContext } from '../../contexts/NavigationContext';
import { AllocationContext } from '../../contexts/AllocationContext';

// Test utilities
import { createCollectionTestData } from '../../components/__tests__/helpers/collectionOpportunities.helpers';

// Types
import { CollectionOpportunity } from '../../types/collectionOpportunities';
import { Collection } from '../../types/collection.types';

// Mock external dependencies
jest.mock('../../hooks/useFeatureFlags', () => ({
  useFeatureFlag: jest.fn(() => true)
}));

jest.mock('../../services/analyticsService', () => ({
  trackUserAction: jest.fn(),
  trackPageView: jest.fn(),
  trackError: jest.fn()
}));

// =============================================================================
// Test Setup & Utilities
// =============================================================================

const createMockNavigationContext = () => ({
  currentPath: '/collections',
  navigate: jest.fn(),
  goBack: jest.fn(),
  breadcrumbs: [],
  isLoading: false
});

const createMockAllocationContext = () => ({
  allocations: new Map(),
  updateAllocation: jest.fn(),
  bulkUpdateAllocations: jest.fn(),
  validateAllocation: jest.fn(() => ({ isValid: true, errors: [] })),
  totalAllocation: 100,
  isLoading: false
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigationContext = createMockNavigationContext();
  const allocationContext = createMockAllocationContext();

  return (
    <NavigationContext.Provider value={navigationContext}>
      <AllocationContext.Provider value={allocationContext}>
        <CollectionProvider>
          {children}
        </CollectionProvider>
      </AllocationContext.Provider>
    </NavigationContext.Provider>
  );
};

const createTestOpportunities = (count: number = 20): CollectionOpportunity[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `opp-${String(i + 1).padStart(3, '0')}`,
    title: `Test Opportunity ${i + 1}`,
    name: `Test Opportunity ${i + 1}`,
    description: `Comprehensive test opportunity description ${i + 1}`,
    type: i % 3 === 0 ? 'optimization' : i % 3 === 1 ? 'expansion' : 'testing',
    status: i % 4 === 0 ? 'active' : i % 4 === 1 ? 'pending' : i % 4 === 2 ? 'completed' : 'paused',
    health: 0.3 + (i % 7) * 0.1, // Varied health scores
    matchStatus: i % 2 === 0 ? 'baseline' : 'suboptimal',
    priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
    sites: [`site-${i + 1}`, `site-${i + 2}`],
    allocation: Math.floor(Math.random() * 100) + 1,
    lastModified: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    version: `1.${Math.floor(i / 5)}.0`,
    createdAt: new Date(Date.now() - (i + 30) * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    details: `Detailed technical information for opportunity ${i + 1}`
  }));
};

// =============================================================================
// Create Collection Workflow Tests
// =============================================================================

describe('Create Collection Workflow', () => {
  const mockOpportunities = createTestOpportunities(15);

  test('complete create collection workflow - Standard view', async () => {
    const user = userEvent.setup();
    const mockOnCreate = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onCreate={mockOnCreate}
          enableSelection={true}
          enableBulkOperations={true}
        />
      </TestWrapper>
    );

    // Step 1: Verify initial state
    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    // Step 2: Select multiple opportunities
    const opportunities = screen.getAllByRole('gridcell');
    await user.click(opportunities[0]);
    await user.click(opportunities[2]);
    await user.click(opportunities[4]);

    // Step 3: Open bulk operations toolbar
    await waitFor(() => {
      expect(screen.getByRole('toolbar', { name: /bulk operations/i })).toBeInTheDocument();
    });

    // Step 4: Click create collection action
    const createButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(createButton);

    // Step 5: Verify collection creation dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /create collection/i })).toBeInTheDocument();
    });

    // Step 6: Fill in collection details
    const nameInput = screen.getByLabelText(/collection name/i);
    await user.type(nameInput, 'Test Collection Workflow');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Created via workflow test');

    // Step 7: Submit collection creation
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    // Step 8: Verify creation callback
    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Collection Workflow',
          description: 'Created via workflow test',
          opportunities: expect.arrayContaining([
            expect.objectContaining({ id: 'opp-001' }),
            expect.objectContaining({ id: 'opp-003' }),
            expect.objectContaining({ id: 'opp-005' })
          ])
        })
      );
    });

    // Step 9: Verify success feedback
    expect(screen.getByText(/collection created successfully/i)).toBeInTheDocument();
  });

  test('create collection with validation errors', async () => {
    const user = userEvent.setup();
    const mockOnCreate = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onCreate={mockOnCreate}
          enableSelection={true}
        />
      </TestWrapper>
    );

    // Select opportunities and start creation
    const opportunities = screen.getAllByRole('gridcell');
    await user.click(opportunities[0]);

    const createButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(createButton);

    // Try to submit without required fields
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    // Verify validation messages
    await waitFor(() => {
      expect(screen.getByText(/collection name is required/i)).toBeInTheDocument();
    });

    // Fill partial data and try again
    const nameInput = screen.getByLabelText(/collection name/i);
    await user.type(nameInput, 'a'); // Too short

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be at least/i)).toBeInTheDocument();
    });

    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  test('create collection with duplicate name handling', async () => {
    const user = userEvent.setup();
    const mockOnCreate = jest.fn().mockRejectedValue(new Error('Collection name already exists'));

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onCreate={mockOnCreate}
          enableSelection={true}
        />
      </TestWrapper>
    );

    // Complete valid creation form
    const opportunities = screen.getAllByRole('gridcell');
    await user.click(opportunities[0]);

    const createButton = screen.getByRole('button', { name: /create collection/i });
    await user.click(createButton);

    const nameInput = screen.getByLabelText(/collection name/i);
    await user.type(nameInput, 'Existing Collection Name');

    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText(/collection name already exists/i)).toBeInTheDocument();
    });

    // Dialog should remain open for user to fix
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// =============================================================================
// Edit Collection Workflow Tests
// =============================================================================

describe('Edit Collection Workflow', () => {
  const mockOpportunities = createTestOpportunities(10);

  test('edit single opportunity in place', async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onEdit={mockOnEdit}
          enableInlineEditing={true}
        />
      </TestWrapper>
    );

    // Find and click edit on first opportunity
    const firstRow = screen.getAllByRole('gridcell')[0];
    const editButton = within(firstRow).getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Verify inline editing mode
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Opportunity 1')).toBeInTheDocument();
    });

    // Modify the opportunity
    const nameInput = screen.getByDisplayValue('Test Opportunity 1');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Opportunity Name');

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify edit callback
    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'opp-001',
          name: 'Updated Opportunity Name'
        })
      );
    });
  });

  test('edit opportunity allocation with validation', async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onEdit={mockOnEdit}
          enableInlineEditing={true}
          enableAllocationEditing={true}
        />
      </TestWrapper>
    );

    // Start editing allocation
    const allocationCell = screen.getByText(/allocation/i).closest('td');
    const editButton = within(allocationCell!).getByRole('button', { name: /edit allocation/i });
    await user.click(editButton);

    // Change allocation value
    const allocationInput = screen.getByRole('spinbutton', { name: /allocation/i });
    await user.clear(allocationInput);
    await user.type(allocationInput, '150'); // Invalid > 100

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify validation error
    await waitFor(() => {
      expect(screen.getByText(/allocation cannot exceed 100/i)).toBeInTheDocument();
    });

    // Fix allocation
    await user.clear(allocationInput);
    await user.type(allocationInput, '85');
    await user.click(saveButton);

    // Verify successful update
    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          allocation: 85
        })
      );
    });
  });

  test('bulk edit multiple opportunities', async () => {
    const user = userEvent.setup();
    const mockOnBulkEdit = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onBulkEdit={mockOnBulkEdit}
          enableSelection={true}
          enableBulkOperations={true}
        />
      </TestWrapper>
    );

    // Select multiple opportunities
    const opportunities = screen.getAllByRole('gridcell');
    await user.click(opportunities[0]);
    await user.click(opportunities[2]);
    await user.click(opportunities[4]);

    // Open bulk edit
    const bulkEditButton = screen.getByRole('button', { name: /bulk edit/i });
    await user.click(bulkEditButton);

    // Verify bulk edit dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /bulk edit/i })).toBeInTheDocument();
    });

    // Change status for all selected
    const statusSelect = screen.getByLabelText(/status/i);
    await user.selectOptions(statusSelect, 'paused');

    // Apply changes
    const applyButton = screen.getByRole('button', { name: /apply changes/i });
    await user.click(applyButton);

    // Verify bulk edit callback
    await waitFor(() => {
      expect(mockOnBulkEdit).toHaveBeenCalledWith(
        ['opp-001', 'opp-003', 'opp-005'],
        expect.objectContaining({
          status: 'paused'
        })
      );
    });
  });
});

// =============================================================================
// Delete Collection Workflow Tests
// =============================================================================

describe('Delete Collection Workflow', () => {
  const mockOpportunities = createTestOpportunities(8);

  test('delete single opportunity with confirmation', async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onDelete={mockOnDelete}
          enableDeletion={true}
        />
      </TestWrapper>
    );

    // Find and click delete on first opportunity
    const firstRow = screen.getAllByRole('gridcell')[0];
    const deleteButton = within(firstRow).getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Verify confirmation dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /confirm delete/i })).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    // Verify delete callback
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('opp-001');
    });
  });

  test('bulk delete with safety confirmation', async () => {
    const user = userEvent.setup();
    const mockOnBulkDelete = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onBulkDelete={mockOnBulkDelete}
          enableSelection={true}
          enableBulkOperations={true}
        />
      </TestWrapper>
    );

    // Select multiple opportunities
    const opportunities = screen.getAllByRole('gridcell');
    await user.click(opportunities[0]);
    await user.click(opportunities[1]);
    await user.click(opportunities[2]);

    // Click bulk delete
    const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
    await user.click(bulkDeleteButton);

    // Verify enhanced confirmation for bulk delete
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /confirm bulk delete/i })).toBeInTheDocument();
      expect(screen.getByText(/delete 3 opportunities/i)).toBeInTheDocument();
    });

    // Type confirmation text
    const confirmationInput = screen.getByLabelText(/type "DELETE" to confirm/i);
    await user.type(confirmationInput, 'DELETE');

    const confirmButton = screen.getByRole('button', { name: /delete 3 opportunities/i });
    await user.click(confirmButton);

    // Verify bulk delete callback
    await waitFor(() => {
      expect(mockOnBulkDelete).toHaveBeenCalledWith(['opp-001', 'opp-002', 'opp-003']);
    });
  });

  test('cancel delete operation preserves data', async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onDelete={mockOnDelete}
          enableDeletion={true}
        />
      </TestWrapper>
    );

    // Start delete process
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    await user.click(deleteButton);

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify no deletion occurred
    expect(mockOnDelete).not.toHaveBeenCalled();
    
    // Verify data still exists
    expect(screen.getByText('Test Opportunity 1')).toBeInTheDocument();
  });
});

// =============================================================================
// Search and Filter Workflow Tests
// =============================================================================

describe('Search and Filter Workflows', () => {
  const mockOpportunities = createTestOpportunities(25);

  test('search functionality with real-time filtering', async () => {
    const user = userEvent.setup();
    const mockOnSearch = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onSearch={mockOnSearch}
          enableFiltering={true}
          enableSearch={true}
        />
      </TestWrapper>
    );

    // Find search input
    const searchInput = screen.getByRole('searchbox', { name: /search opportunities/i });
    
    // Type search query
    await user.type(searchInput, 'opportunity 5');

    // Verify real-time filtering
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('opportunity 5');
    });

    // Verify filtered results
    const visibleRows = screen.getAllByRole('gridcell');
    expect(visibleRows.some(row => 
      within(row).queryByText(/opportunity 5/i)
    )).toBe(true);
  });

  test('advanced filtering with multiple criteria', async () => {
    const user = userEvent.setup();
    const mockOnFilter = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onFilter={mockOnFilter}
          enableFiltering={true}
          enableAdvancedFilters={true}
        />
      </TestWrapper>
    );

    // Open advanced filters
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filtersButton);

    // Set status filter
    const statusFilter = screen.getByLabelText(/status/i);
    await user.selectOptions(statusFilter, 'active');

    // Set priority filter
    const priorityFilter = screen.getByLabelText(/priority/i);
    await user.selectOptions(priorityFilter, 'high');

    // Set health range filter
    const healthMinInput = screen.getByLabelText(/minimum health/i);
    await user.type(healthMinInput, '0.7');

    // Apply filters
    const applyFiltersButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyFiltersButton);

    // Verify filter callback
    await waitFor(() => {
      expect(mockOnFilter).toHaveBeenCalledWith({
        status: 'active',
        priority: 'high',
        healthMin: 0.7
      });
    });
  });

  test('clear all filters functionality', async () => {
    const user = userEvent.setup();
    const mockOnFilterClear = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onFilterClear={mockOnFilterClear}
          enableFiltering={true}
          initialFilters={{ status: 'active', priority: 'high' }}
        />
      </TestWrapper>
    );

    // Verify filters are applied initially
    expect(screen.getByText(/2 filters applied/i)).toBeInTheDocument();

    // Clear all filters
    const clearFiltersButton = screen.getByRole('button', { name: /clear all filters/i });
    await user.click(clearFiltersButton);

    // Verify clear callback
    await waitFor(() => {
      expect(mockOnFilterClear).toHaveBeenCalled();
    });

    // Verify no filters indicator
    expect(screen.queryByText(/filters applied/i)).not.toBeInTheDocument();
  });
});

// =============================================================================
// Sorting Workflow Tests
// =============================================================================

describe('Sorting Workflows', () => {
  const mockOpportunities = createTestOpportunities(15);

  test('column sorting with visual feedback', async () => {
    const user = userEvent.setup();
    const mockOnSort = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onSort={mockOnSort}
          enableSorting={true}
        />
      </TestWrapper>
    );

    // Click on health column header to sort
    const healthHeader = screen.getByRole('columnheader', { name: /health/i });
    await user.click(healthHeader);

    // Verify sort callback
    await waitFor(() => {
      expect(mockOnSort).toHaveBeenCalledWith({
        field: 'health',
        direction: 'desc'
      });
    });

    // Verify visual indicator
    expect(healthHeader).toHaveAttribute('aria-sort', 'descending');

    // Click again for reverse sort
    await user.click(healthHeader);

    await waitFor(() => {
      expect(mockOnSort).toHaveBeenCalledWith({
        field: 'health',
        direction: 'asc'
      });
    });

    expect(healthHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  test('multi-column sorting workflow', async () => {
    const user = userEvent.setup();
    const mockOnSort = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onSort={mockOnSort}
          enableSorting={true}
          enableMultiSort={true}
        />
      </TestWrapper>
    );

    // Sort by priority first (hold Ctrl/Cmd)
    const priorityHeader = screen.getByRole('columnheader', { name: /priority/i });
    await user.click(priorityHeader);

    // Add secondary sort by health (Ctrl+click)
    const healthHeader = screen.getByRole('columnheader', { name: /health/i });
    await user.keyboard('{Control>}');
    await user.click(healthHeader);
    await user.keyboard('{/Control}');

    // Verify multi-sort callback
    await waitFor(() => {
      expect(mockOnSort).toHaveBeenCalledWith([
        { field: 'priority', direction: 'desc' },
        { field: 'health', direction: 'desc' }
      ]);
    });
  });
});

// =============================================================================
// State Synchronization Tests
// =============================================================================

describe('State Synchronization Workflows', () => {
  const mockOpportunities = createTestOpportunities(10);

  test('selection state persistence across re-renders', async () => {
    const user = userEvent.setup();
    let selectedIds: string[] = [];
    
    const TestComponent = () => {
      const [opportunities, setOpportunities] = React.useState(mockOpportunities);
      
      return (
        <TestWrapper>
          <CollectionStandardMigrated
            opportunities={opportunities}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => { selectedIds = ids; }}
            enableSelection={true}
          />
          <button onClick={() => setOpportunities([...opportunities])}>
            Trigger Re-render
          </button>
        </TestWrapper>
      );
    };

    render(<TestComponent />);

    // Select some opportunities
    const opportunities = screen.getAllByRole('gridcell');
    await user.click(opportunities[0]);
    await user.click(opportunities[2]);

    // Trigger re-render
    const reRenderButton = screen.getByRole('button', { name: /trigger re-render/i });
    await user.click(reRenderButton);

    // Verify selection persists
    await waitFor(() => {
      const selectedCells = screen.getAllByRole('gridcell', { selected: true });
      expect(selectedCells).toHaveLength(2);
    });
  });

  test('filter and sort state coordination', async () => {
    const user = userEvent.setup();
    const mockOnStateChange = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onStateChange={mockOnStateChange}
          enableFiltering={true}
          enableSorting={true}
        />
      </TestWrapper>
    );

    // Apply filter
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');

    // Apply sort
    const nameHeader = screen.getByRole('columnheader', { name: /name/i });
    await user.click(nameHeader);

    // Verify coordinated state change
    await waitFor(() => {
      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ searchTerm: 'test' }),
          sorting: expect.objectContaining({ field: 'name', direction: 'desc' })
        })
      );
    });
  });
});

// =============================================================================
// Error Recovery Workflow Tests
// =============================================================================

describe('Error Recovery Workflows', () => {
  const mockOpportunities = createTestOpportunities(5);

  test('network error recovery during save operation', async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ success: true });

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onEdit={mockOnEdit}
          enableInlineEditing={true}
          enableRetry={true}
        />
      </TestWrapper>
    );

    // Start editing
    const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
    await user.click(editButton);

    // Modify and save (will fail)
    const nameInput = screen.getByDisplayValue('Test Opportunity 1');
    await user.clear(nameInput);
    await user.type(nameInput, 'Modified Name');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Verify error message and retry option
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    // Retry operation
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    // Verify successful retry
    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalledTimes(2);
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });

  test('optimistic update rollback on failure', async () => {
    const user = userEvent.setup();
    const mockOnEdit = jest.fn().mockRejectedValue(new Error('Save failed'));

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={mockOpportunities}
          selectedIds={[]}
          onEdit={mockOnEdit}
          enableOptimisticUpdates={true}
          enableInlineEditing={true}
        />
      </TestWrapper>
    );

    // Verify original value
    expect(screen.getByText('Test Opportunity 1')).toBeInTheDocument();

    // Start editing
    const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
    await user.click(editButton);

    // Modify value (optimistic update)
    const nameInput = screen.getByDisplayValue('Test Opportunity 1');
    await user.clear(nameInput);
    await user.type(nameInput, 'Optimistic Update');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should show optimistic update initially
    expect(screen.getByText('Optimistic Update')).toBeInTheDocument();

    // Verify rollback on failure
    await waitFor(() => {
      expect(screen.getByText('Test Opportunity 1')).toBeInTheDocument();
      expect(screen.queryByText('Optimistic Update')).not.toBeInTheDocument();
    });
  });
});

// =============================================================================
// Performance Under Load Tests
// =============================================================================

describe('Performance Under Load', () => {
  test('maintains responsiveness with frequent updates', async () => {
    const user = userEvent.setup();
    const largeOpportunities = createTestOpportunities(500);
    const mockOnSelectionChange = jest.fn();

    render(
      <TestWrapper>
        <CollectionStandardMigrated
          opportunities={largeOpportunities}
          selectedIds={[]}
          onSelectionChange={mockOnSelectionChange}
          enableSelection={true}
          enableVirtualization={true}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    // Rapid selection changes
    const startTime = performance.now();
    
    for (let i = 0; i < 10; i++) {
      const cells = screen.getAllByRole('gridcell');
      if (cells[i]) {
        await user.click(cells[i]);
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Should handle rapid interactions efficiently (under 1 second)
    expect(totalTime).toBeLessThan(1000);
    expect(mockOnSelectionChange).toHaveBeenCalledTimes(10);
  });
});

// =============================================================================
// Test Cleanup
// =============================================================================

afterEach(() => {
  jest.clearAllMocks();
});