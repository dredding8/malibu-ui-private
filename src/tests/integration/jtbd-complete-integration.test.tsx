import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { BlueprintProvider } from '@blueprintjs/core';
import CollectionOpportunitiesHub from '../../pages/CollectionOpportunitiesHub';
import { AllocationProvider } from '../../contexts/AllocationContext';
import { generateCompleteMockData } from '../../mocks/collectionOpportunitiesMocks';
import '@testing-library/jest-dom';

// Mock data for testing
const mockData = generateCompleteMockData(20); // Generate 20 opportunities

// Helper to render with all required providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <BlueprintProvider>
        <AllocationProvider
          initialOpportunities={mockData.opportunities}
          initialSites={mockData.sites}
          initialCollectionDecks={mockData.collectionDecks}
          capacityThresholds={{ critical: 10, warning: 30, optimal: 70 }}
          enableRealTimeUpdates={false}
          onBatchUpdate={async () => {}}
        >
          {component}
        </AllocationProvider>
      </BlueprintProvider>
    </BrowserRouter>
  );
};

describe('JTBD Complete Integration Test Suite', () => {
  describe('Cross-JTBD Integration Workflows', () => {
    it('should support complete analyst workflow from validation to bulk operations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CollectionOpportunitiesHub />);

      // Wait for hub to load
      await waitFor(() => {
        expect(screen.getByText(/Collection Opportunities/i)).toBeInTheDocument();
      });

      // JTBD #1: Validation Workflow
      // Click on first opportunity to open details
      const firstOpportunity = screen.getAllByTestId('opportunity-row')[0];
      await user.click(firstOpportunity);

      // Verify details modal opens
      await waitFor(() => {
        expect(screen.getByTestId('opportunity-details')).toBeInTheDocument();
      });

      // Click validate button
      const validateButton = screen.getByTestId('validate-opportunity-button');
      await user.click(validateButton);

      // Close modal
      await user.keyboard('{Escape}');

      // JTBD #2: Override Impact Analysis
      // Find and click override button for an opportunity
      const overrideButtons = screen.getAllByLabelText(/Override allocation/i);
      await user.click(overrideButtons[0]);

      // Should show impact calculator
      await waitFor(() => {
        expect(screen.getByText(/Override Impact Analysis/i)).toBeInTheDocument();
      });

      // Check that impact metrics are displayed
      expect(screen.getByText(/Capacity Impact/i)).toBeInTheDocument();
      expect(screen.getByText(/Risk Score/i)).toBeInTheDocument();

      // Cancel override
      await user.click(screen.getByText(/Cancel/i));

      // JTBD #5: Bulk Operations
      // Select multiple opportunities
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Header checkbox to select all

      // Verify bulk toolbar appears
      await waitFor(() => {
        expect(screen.getByTestId('bulk-operations-toolbar')).toBeInTheDocument();
      });

      // Open bulk actions menu
      const bulkActionsButton = screen.getByText(/Bulk Actions/i);
      await user.click(bulkActionsButton);

      // Select bulk validate
      const bulkValidate = screen.getByText(/Validate All/i);
      await user.click(bulkValidate);

      // Verify preview dialog
      await waitFor(() => {
        expect(screen.getByText(/Preview Bulk Changes/i)).toBeInTheDocument();
      });

      // Apply changes
      const applyButton = screen.getByText(/Apply Changes/i);
      await user.click(applyButton);

      // JTBD #4: Analytics Dashboard
      // Navigate to analytics tab
      const analyticsTab = screen.getByText(/Analytics/i);
      await user.click(analyticsTab);

      // Verify analytics components load
      await waitFor(() => {
        expect(screen.getByText(/Performance Trends/i)).toBeInTheDocument();
      });

      // Check for key metrics
      expect(screen.getByText(/Match Success Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Capacity Utilization/i)).toBeInTheDocument();
    });

    it('should handle override decisions affecting analytics metrics', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CollectionOpportunitiesHub />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/Collection Opportunities/i)).toBeInTheDocument();
      });

      // Navigate to analytics first to see baseline
      const analyticsTab = screen.getByText(/Analytics/i);
      await user.click(analyticsTab);

      // Note initial capacity utilization
      const initialUtilization = screen.getByTestId('capacity-utilization-metric');
      const initialValue = initialUtilization.textContent;

      // Go back to opportunities
      const opportunitiesTab = screen.getByText(/Opportunities/i);
      await user.click(opportunitiesTab);

      // Perform an override
      const overrideButtons = screen.getAllByLabelText(/Override allocation/i);
      await user.click(overrideButtons[0]);

      // Complete override workflow
      // ... (implementation details)

      // Go back to analytics
      await user.click(analyticsTab);

      // Verify metrics have updated
      const updatedUtilization = screen.getByTestId('capacity-utilization-metric');
      expect(updatedUtilization.textContent).not.toBe(initialValue);
    });

    it('should validate bulk operations include individual validation workflows', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CollectionOpportunitiesHub />);

      // Select opportunities with different statuses
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select first data row
      await user.click(checkboxes[2]); // Select second data row

      // Open bulk actions
      const bulkActionsButton = screen.getByText(/Bulk Actions/i);
      await user.click(bulkActionsButton);

      // Select validate all
      const validateAll = screen.getByText(/Validate All/i);
      await user.click(validateAll);

      // Should show individual validation status for each
      await waitFor(() => {
        const previewDialog = screen.getByRole('dialog');
        const validationStatuses = within(previewDialog).getAllByText(/Validation:/i);
        expect(validationStatuses.length).toBe(2);
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should load opportunities table within acceptable time', async () => {
      const startTime = performance.now();
      renderWithProviders(<CollectionOpportunitiesHub />);

      await waitFor(() => {
        expect(screen.getByText(/Collection Opportunities/i)).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second max load time
    });

    it('should handle bulk operations on 20+ items efficiently', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CollectionOpportunitiesHub />);

      // Select all opportunities
      const selectAllCheckbox = screen.getByLabelText(/Select all/i);
      await user.click(selectAllCheckbox);

      const startTime = performance.now();

      // Open bulk actions
      const bulkActionsButton = screen.getByText(/Bulk Actions/i);
      await user.click(bulkActionsButton);

      // Select bulk priority update
      const updatePriority = screen.getByText(/Update Priority/i);
      await user.click(updatePriority);

      const operationTime = performance.now() - startTime;
      expect(operationTime).toBeLessThan(500); // 500ms max for UI response
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should gracefully handle validation failures', async () => {
      const user = userEvent.setup();
      const mockBatchUpdate = jest.fn().mockRejectedValueOnce(new Error('Validation failed'));
      
      render(
        <BrowserRouter>
          <BlueprintProvider>
            <AllocationProvider
              initialOpportunities={mockData.opportunities}
              initialSites={mockData.sites}
              initialCollectionDecks={mockData.collectionDecks}
              capacityThresholds={{ critical: 10, warning: 30, optimal: 70 }}
              enableRealTimeUpdates={false}
              onBatchUpdate={mockBatchUpdate}
            >
              <CollectionOpportunitiesHub />
            </AllocationProvider>
          </BlueprintProvider>
        </BrowserRouter>
      );

      // Attempt validation
      const firstOpportunity = screen.getAllByTestId('opportunity-row')[0];
      await user.click(firstOpportunity);
      
      const validateButton = screen.getByTestId('validate-opportunity-button');
      await user.click(validateButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Validation failed/i)).toBeInTheDocument();
      });
    });

    it('should prevent invalid bulk operations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CollectionOpportunitiesHub />);

      // Select opportunities
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      // Try to perform bulk operation with conflicts
      const bulkActionsButton = screen.getByText(/Bulk Actions/i);
      await user.click(bulkActionsButton);

      const overrideAll = screen.getByText(/Override Allocations/i);
      await user.click(overrideAll);

      // Should show conflict warnings
      await waitFor(() => {
        expect(screen.getByText(/conflicts detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should support keyboard navigation through all JTBD workflows', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CollectionOpportunitiesHub />);

      // Tab through main elements
      await user.tab(); // Focus first interactive element
      
      // Navigate to opportunity row
      const firstOpportunity = screen.getAllByTestId('opportunity-row')[0];
      firstOpportunity.focus();
      
      // Enter to open details
      await user.keyboard('{Enter}');

      // Verify modal opened
      await waitFor(() => {
        expect(screen.getByTestId('opportunity-details')).toBeInTheDocument();
      });

      // Tab to validate button
      await user.tab();
      await user.tab(); // May need multiple tabs

      // Verify focus on validate button
      const validateButton = screen.getByTestId('validate-opportunity-button');
      expect(document.activeElement).toBe(validateButton);
    });

    it('should announce bulk operation results to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CollectionOpportunitiesHub />);

      // Select items
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      // Check for aria-live region
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/selected/i);
    });
  });
});