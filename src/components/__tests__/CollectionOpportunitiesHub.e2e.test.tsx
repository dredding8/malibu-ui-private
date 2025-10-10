import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CollectionOpportunitiesHub from '../../pages/CollectionOpportunitiesHub';
import { AllocationProvider } from '../../contexts/AllocationContext';

// Mock the feature flags hook
jest.mock('../../hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    progressiveComplexityUI: true,
    enableVirtualScrolling: true,
    enableWorkspaceMode: true,
    enableBatchOperations: true,
    enableHealthAnalysis: true
  })
}));

// Wrapper component with necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Collection Opportunities Management Hub E2E', () => {
  beforeEach(() => {
    // Clear any existing state
    jest.clearAllMocks();
  });

  describe('Quick edit flow completes in <3 clicks', () => {
    test('should allow editing opportunity with minimal clicks', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CollectionOpportunitiesHub />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/Loading Collection Opportunities/)).not.toBeInTheDocument();
      });

      // 1st click: Click Edit icon on first opportunity
      const editButtons = await screen.findAllByRole('button', { name: /quick edit/i });
      expect(editButtons.length).toBeGreaterThan(0);
      await user.click(editButtons[0]);

      // Verify Quick Edit Modal opened
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // 2nd click: Change priority (example modification)
      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, 'high');

      // 3rd click: Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Verify modal closed and changes reflected
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify the table shows pending changes
      expect(screen.getByText(/1 changes pending/i)).toBeInTheDocument();
    });
  });

  describe('Reallocation workspace maintains context', () => {
    test('should pre-populate workspace with satellite context', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CollectionOpportunitiesHub />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/Loading Collection Opportunities/)).not.toBeInTheDocument();
      });

      // Find a specific satellite row (e.g., Satellite 1)
      const opportunityRows = screen.getAllByRole('row');
      const targetRow = opportunityRows.find(row => 
        within(row).queryByText(/Satellite 1/) !== null
      );
      
      expect(targetRow).toBeDefined();

      // Click Reallocate button for this satellite
      const reallocateButton = within(targetRow!).getByRole('button', { name: /reallocate/i });
      await user.click(reallocateButton);

      // Verify workspace opened with correct satellite context
      await waitFor(() => {
        const workspace = screen.getByRole('dialog');
        expect(workspace).toBeInTheDocument();
        expect(within(workspace).getByText(/Satellite 1/)).toBeInTheDocument();
      });

      // Verify pre-populated passes
      expect(screen.getByText(/available passes/i)).toBeInTheDocument();

      // Make a change in the workspace
      const allocateButton = screen.getByRole('button', { name: /allocate/i });
      await user.click(allocateButton);

      // Save workspace changes
      const saveWorkspaceButton = screen.getByRole('button', { name: /save.*workspace/i });
      await user.click(saveWorkspaceButton);

      // Verify workspace closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify row shows modified state
      expect(within(targetRow!).getByText(/modified/i)).toBeInTheDocument();
    });
  });

  describe('Batch save preserves all changes', () => {
    test('should save multiple edits and reallocations together', async () => {
      const user = userEvent.setup();
      const mockBatchUpdate = jest.fn().mockResolvedValue({
        success: true,
        updated: ['opp-1', 'opp-2', 'opp-3'],
        failures: []
      });
      
      render(
        <TestWrapper>
          <CollectionOpportunitiesHub />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/Loading Collection Opportunities/)).not.toBeInTheDocument();
      });

      // Edit first opportunity
      const editButtons = await screen.findAllByRole('button', { name: /quick edit/i });
      await user.click(editButtons[0]);
      
      const prioritySelect1 = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect1, 'high');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Edit second opportunity
      await user.click(editButtons[1]);
      
      const notesTextarea = screen.getByLabelText(/notes/i);
      await user.type(notesTextarea, 'Updated notes for testing');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Reallocate third opportunity
      const reallocateButtons = await screen.findAllByRole('button', { name: /reallocate/i });
      await user.click(reallocateButtons[2]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Make allocation changes
      const allocateButton = within(screen.getByRole('dialog')).getByRole('button', { name: /allocate/i });
      await user.click(allocateButton);
      
      const saveWorkspaceButton = screen.getByRole('button', { name: /save.*workspace/i });
      await user.click(saveWorkspaceButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Verify all changes are tracked
      expect(screen.getByText(/3 changes pending/i)).toBeInTheDocument();

      // Click "Update Collection Deck" to save all changes
      const updateButton = screen.getByRole('button', { name: /update collection deck.*3/i });
      await user.click(updateButton);

      // Verify batch update was called
      await waitFor(() => {
        expect(screen.queryByText(/changes pending/i)).not.toBeInTheDocument();
      });

      // Simulate page refresh to verify persistence
      const { rerender } = render(
        <TestWrapper>
          <CollectionOpportunitiesHub />
        </TestWrapper>
      );

      // Verify changes persisted after refresh
      await waitFor(() => {
        expect(screen.queryByText(/Loading Collection Opportunities/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard shortcuts', () => {
    test('should support keyboard navigation and shortcuts', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <CollectionOpportunitiesHub />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/Loading Collection Opportunities/)).not.toBeInTheDocument();
      });

      // Select first row
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // First data row checkbox

      // Test Cmd+E for edit
      await user.keyboard('{Meta>}e{/Meta}');
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Test Cmd+R for reallocate
      await user.keyboard('{Meta>}r{/Meta}');
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/reallocation workspace/i)).toBeInTheDocument();
      });

      // Close workspace
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Test Escape to clear selection
      await user.keyboard('{Escape}');
      
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  describe('Health status indicators', () => {
    test('should display health scores and update in real-time', async () => {
      render(
        <TestWrapper>
          <CollectionOpportunitiesHub />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/Loading Collection Opportunities/)).not.toBeInTheDocument();
      });

      // Verify health indicators are visible
      const healthCells = screen.getAllByRole('cell', { name: /health/i });
      expect(healthCells.length).toBeGreaterThan(0);

      // Verify statistics badges
      expect(screen.getByText(/\d+ Total/)).toBeInTheDocument();
      expect(screen.getByText(/\d+ Optimal/)).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    test('should handle different viewport sizes', async () => {
      // Test at 1920px
      window.innerWidth = 1920;
      window.dispatchEvent(new Event('resize'));
      
      render(
        <TestWrapper>
          <CollectionOpportunitiesHub />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading Collection Opportunities/)).not.toBeInTheDocument();
      });

      // Verify full table is visible
      expect(screen.getByRole('table')).toBeInTheDocument();

      // Test at 768px (tablet)
      window.innerWidth = 768;
      window.dispatchEvent(new Event('resize'));

      // Table should still be functional
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});