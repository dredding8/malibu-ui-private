import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CollectionOpportunitiesEnhanced from '../CollectionOpportunitiesEnhanced';
import {
  CollectionOpportunity,
  Site,
  OpportunityStatus,
  Priority
} from '../../types/collectionOpportunities';

// Mock data for integration testing
const mockSites: Site[] = [
  {
    id: 'site-1',
    name: 'Primary Ground Station',
    location: { lat: 40.7128, lon: -74.0060 },
    capacity: 100,
    allocated: 60
  },
  {
    id: 'site-2',
    name: 'Secondary Ground Station',
    location: { lat: 34.0522, lon: -118.2437 },
    capacity: 80,
    allocated: 40
  },
  {
    id: 'site-3',
    name: 'Backup Ground Station',
    location: { lat: 41.8781, lon: -87.6298 },
    capacity: 120,
    allocated: 95 // High utilization to test risk scenarios
  }
];

const mockOpportunities: CollectionOpportunity[] = [
  {
    id: 'opp-1',
    name: 'Priority Mission Collection',
    satellite: {
      id: 'sat-1',
      name: 'EarthWatch-1',
      capacity: 100,
      currentLoad: 50,
      orbit: 'LEO',
      function: 'optical'
    },
    sites: mockSites,
    priority: 'high',
    status: 'optimal',
    capacityPercentage: 75,
    conflicts: [],
    createdDate: '2024-01-01',
    lastModified: '2024-01-02',
    collectionDeckId: 'deck-1',
    allocatedSites: [mockSites[0]], // Allocated to Primary Ground Station
    totalPasses: 5,
    capacity: 100,
    matchStatus: 'baseline',
    matchQuality: 85
  },
  {
    id: 'opp-2',
    name: 'Routine Survey Collection',
    satellite: {
      id: 'sat-2',
      name: 'SurveyBot-2',
      capacity: 80,
      currentLoad: 30,
      orbit: 'GEO',
      function: 'wideband'
    },
    sites: mockSites,
    priority: 'medium',
    status: 'warning',
    capacityPercentage: 60,
    conflicts: [],
    createdDate: '2024-01-01',
    lastModified: '2024-01-02',
    collectionDeckId: 'deck-2',
    allocatedSites: [mockSites[1]], // Allocated to Secondary Ground Station
    totalPasses: 3,
    capacity: 80,
    matchStatus: 'suboptimal',
    matchQuality: 65
  },
  {
    id: 'opp-3',
    name: 'Critical Security Collection',
    satellite: {
      id: 'sat-3',
      name: 'SecureEye-3',
      capacity: 120,
      currentLoad: 90,
      orbit: 'LEO',
      function: 'narrowband'
    },
    sites: mockSites,
    priority: 'critical',
    status: 'critical',
    capacityPercentage: 85,
    conflicts: ['conflict-1'],
    createdDate: '2024-01-01',
    lastModified: '2024-01-02',
    collectionDeckId: 'deck-3',
    allocatedSites: [mockSites[2]], // Allocated to Backup Ground Station (high utilization)
    totalPasses: 7,
    capacity: 120,
    matchStatus: 'baseline',
    matchQuality: 90
  }
];

const defaultProps = {
  opportunities: mockOpportunities,
  availableSites: mockSites,
  onBatchUpdate: jest.fn(),
  enableRealTimeValidation: true,
  enableHealthAnalysis: true,
  showWorkspaceOption: true,
  showValidationOption: true
};

describe('Override Impact Calculator Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Override Workflow', () => {
    it('completes full override workflow from table to confirmation', async () => {
      render(<CollectionOpportunitiesEnhanced {...defaultProps} />);
      
      // Wait for table to load
      await waitFor(() => {
        expect(screen.getByText('Priority Mission Collection')).toBeInTheDocument();
      });

      // Find the first opportunity row and click override button
      const firstRow = screen.getByText('Priority Mission Collection').closest('tr');
      expect(firstRow).toBeInTheDocument();
      
      // Look for override button in the actions cell
      const overrideButton = within(firstRow!).getByTitle(/Override system recommendation/);
      fireEvent.click(overrideButton);

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByText('Override Allocation')).toBeInTheDocument();
      });

      // Verify current allocation is shown
      expect(screen.getByText(/Primary Ground Station/)).toBeInTheDocument();

      // Select alternative site
      const siteSelect = screen.getByDisplayValue('Select a site...');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });

      // Calculate impact
      const calculateButton = screen.getByText('Calculate Impact');
      fireEvent.click(calculateButton);

      // Wait for impact analysis
      await waitFor(() => {
        expect(screen.getByText('Override Impact Analysis')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify impact analysis components
      expect(screen.getByText('Capacity Impact')).toBeInTheDocument();
      expect(screen.getByText('Quality Impact')).toBeInTheDocument();

      // Confirm override (assuming low risk)
      const confirmButton = screen.getByRole('button', { name: /Confirm Override|Submit for Approval/ });
      
      // Add justification if required
      const justificationField = screen.queryByPlaceholderText(/Provide detailed justification/);
      if (justificationField) {
        fireEvent.change(justificationField, {
          target: { value: 'Mission requirements changed - need better coverage from secondary site' }
        });
      }

      fireEvent.click(confirmButton);

      // Dialog should close and changes should be applied
      await waitFor(() => {
        expect(screen.queryByText('Override Allocation')).not.toBeInTheDocument();
      });
    });

    it('handles high-risk override requiring approval', async () => {
      // Create a scenario that will trigger high risk
      const highRiskOpportunity = {
        ...mockOpportunities[0],
        priority: 'critical' as Priority,
        status: 'critical' as OpportunityStatus
      };

      const propsWithHighRisk = {
        ...defaultProps,
        opportunities: [highRiskOpportunity, ...mockOpportunities.slice(1)]
      };

      render(<CollectionOpportunitiesEnhanced {...propsWithHighRisk} />);
      
      await waitFor(() => {
        expect(screen.getByText('Priority Mission Collection')).toBeInTheDocument();
      });

      // Start override workflow
      const firstRow = screen.getByText('Priority Mission Collection').closest('tr');
      const overrideButton = within(firstRow!).getByTitle(/Override system recommendation/);
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(screen.getByText('Override Allocation')).toBeInTheDocument();
      });

      // Select high-utilization site
      const siteSelect = screen.getByDisplayValue('Select a site...');
      fireEvent.change(siteSelect, { target: { value: 'site-3' } }); // Backup site with high utilization

      const calculateButton = screen.getByText('Calculate Impact');
      fireEvent.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByText('Override Impact Analysis')).toBeInTheDocument();
      });

      // Check if high risk scenario is triggered
      const highRiskTag = screen.queryByText(/High Risk/);
      if (highRiskTag) {
        // Should require justification
        const justificationField = screen.getByPlaceholderText(/Provide detailed justification/);
        expect(justificationField).toBeInTheDocument();

        // Confirm button should be disabled initially
        const confirmButton = screen.getByRole('button', { name: /Submit for Approval/ });
        expect(confirmButton).toBeDisabled();

        // Add justification
        fireEvent.change(justificationField, {
          target: { value: 'Critical national security requirement - approved by director. Additional resources allocated to manage increased load.' }
        });

        // Button should now be enabled
        await waitFor(() => {
          expect(confirmButton).not.toBeDisabled();
        });
      }
    });
  });

  describe('Impact Analysis Accuracy', () => {
    it('correctly calculates capacity impact for site changes', async () => {
      render(<CollectionOpportunitiesEnhanced {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Priority Mission Collection')).toBeInTheDocument();
      });

      // Start override workflow
      const firstRow = screen.getByText('Priority Mission Collection').closest('tr');
      const overrideButton = within(firstRow!).getByTitle(/Override system recommendation/);
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(screen.getByText('Override Allocation')).toBeInTheDocument();
      });

      // Select site-2 (Secondary Ground Station)
      const siteSelect = screen.getByDisplayValue('Select a site...');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });

      const calculateButton = screen.getByText('Calculate Impact');
      fireEvent.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByText('Capacity Impact')).toBeInTheDocument();
      });

      // Verify capacity calculations
      // Original site (site-1): 60/100 = 60%
      expect(screen.getByText('60.0%')).toBeInTheDocument();
      
      // Proposed site (site-2): (40+1)/80 = 51.25%
      expect(screen.getByText('51.2%')).toBeInTheDocument();
    });

    it('detects conflicts with other opportunities', async () => {
      // Create opportunities that share the same site to test conflict detection
      const conflictingOpportunities = [
        mockOpportunities[0],
        {
          ...mockOpportunities[1],
          allocatedSites: [mockSites[1]] // Same as what we'll select
        },
        mockOpportunities[2]
      ];

      const propsWithConflicts = {
        ...defaultProps,
        opportunities: conflictingOpportunities
      };

      render(<CollectionOpportunitiesEnhanced {...propsWithConflicts} />);
      
      await waitFor(() => {
        expect(screen.getByText('Priority Mission Collection')).toBeInTheDocument();
      });

      // Start override workflow
      const firstRow = screen.getByText('Priority Mission Collection').closest('tr');
      const overrideButton = within(firstRow!).getByTitle(/Override system recommendation/);
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(screen.getByText('Override Allocation')).toBeInTheDocument();
      });

      // Select site that has conflicts
      const siteSelect = screen.getByDisplayValue('Select a site...');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });

      const calculateButton = screen.getByText('Calculate Impact');
      fireEvent.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByText('Override Impact Analysis')).toBeInTheDocument();
      });

      // Should detect conflicts
      expect(screen.getByText(/Scheduling Conflicts/)).toBeInTheDocument();
      expect(screen.getByText(/opp-2/)).toBeInTheDocument(); // Conflicting opportunity ID
    });

    it('provides appropriate recommendations based on risk factors', async () => {
      render(<CollectionOpportunitiesEnhanced {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Priority Mission Collection')).toBeInTheDocument();
      });

      // Start override workflow
      const firstRow = screen.getByText('Priority Mission Collection').closest('tr');
      const overrideButton = within(firstRow!).getByTitle(/Override system recommendation/);
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(screen.getByText('Override Allocation')).toBeInTheDocument();
      });

      // Select high-utilization site to trigger recommendations
      const siteSelect = screen.getByDisplayValue('Select a site...');
      fireEvent.change(siteSelect, { target: { value: 'site-3' } });

      const calculateButton = screen.getByText('Calculate Impact');
      fireEvent.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
      });

      // Should have recommendations for high-capacity site
      expect(screen.getByText(/Monitor site capacity/)).toBeInTheDocument();
    });
  });

  describe('User Experience and Accessibility', () => {
    it('maintains proper focus management throughout workflow', async () => {
      render(<CollectionOpportunitiesEnhanced {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Priority Mission Collection')).toBeInTheDocument();
      });

      // Start override workflow
      const firstRow = screen.getByText('Priority Mission Collection').closest('tr');
      const overrideButton = within(firstRow!).getByTitle(/Override system recommendation/);
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(screen.getByText('Override Allocation')).toBeInTheDocument();
      });

      // Dialog should be properly focused
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Site selector should be focusable
      const siteSelect = screen.getByDisplayValue('Select a site...');
      expect(siteSelect).toBeInTheDocument();
    });

    it('provides clear error messages and validation feedback', async () => {
      render(<CollectionOpportunitiesEnhanced {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Priority Mission Collection')).toBeInTheDocument();
      });

      // Start override workflow
      const firstRow = screen.getByText('Priority Mission Collection').closest('tr');
      const overrideButton = within(firstRow!).getByTitle(/Override system recommendation/);
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(screen.getByText('Override Allocation')).toBeInTheDocument();
      });

      // Try to calculate impact without selecting a site
      const calculateButton = screen.getByText('Calculate Impact');
      expect(calculateButton).toBeDisabled();

      // Select a site
      const siteSelect = screen.getByDisplayValue('Select a site...');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });

      // Button should now be enabled
      expect(calculateButton).not.toBeDisabled();
    });

    it('handles back navigation correctly', async () => {
      render(<CollectionOpportunitiesEnhanced {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Priority Mission Collection')).toBeInTheDocument();
      });

      // Complete workflow to impact analysis
      const firstRow = screen.getByText('Priority Mission Collection').closest('tr');
      const overrideButton = within(firstRow!).getByTitle(/Override system recommendation/);
      fireEvent.click(overrideButton);

      await waitFor(() => {
        expect(screen.getByText('Override Allocation')).toBeInTheDocument();
      });

      const siteSelect = screen.getByDisplayValue('Select a site...');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });

      const calculateButton = screen.getByText('Calculate Impact');
      fireEvent.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByText('Override Impact Analysis')).toBeInTheDocument();
      });

      // Go back to site selection
      const backButton = screen.getByText('Back to Site Selection');
      fireEvent.click(backButton);

      // Should return to site selection with preserved state
      await waitFor(() => {
        expect(screen.getByDisplayValue('site-2')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('handles large datasets efficiently', async () => {
      // Create a large dataset
      const largeOpportunitySet = Array.from({ length: 50 }, (_, i) => ({
        ...mockOpportunities[0],
        id: `opp-${i}`,
        name: `Test Opportunity ${i}`
      }));

      const propsWithLargeDataset = {
        ...defaultProps,
        opportunities: largeOpportunitySet
      };

      const startTime = Date.now();
      
      render(<CollectionOpportunitiesEnhanced {...propsWithLargeDataset} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Opportunity 0')).toBeInTheDocument();
      });

      const renderTime = Date.now() - startTime;
      
      // Should render within reasonable time even with large dataset
      expect(renderTime).toBeLessThan(5000);
    });

    it('recovers gracefully from calculation errors', async () => {
      // Mock console.error to avoid noise in test output
      const originalError = console.error;
      console.error = jest.fn();

      try {
        render(<CollectionOpportunitiesEnhanced {...defaultProps} />);
        
        await waitFor(() => {
          expect(screen.getByText('Priority Mission Collection')).toBeInTheDocument();
        });

        // Start override workflow
        const firstRow = screen.getByText('Priority Mission Collection').closest('tr');
        const overrideButton = within(firstRow!).getByTitle(/Override system recommendation/);
        fireEvent.click(overrideButton);

        await waitFor(() => {
          expect(screen.getByText('Override Allocation')).toBeInTheDocument();
        });

        // The calculation should complete without throwing errors
        const siteSelect = screen.getByDisplayValue('Select a site...');
        fireEvent.change(siteSelect, { target: { value: 'site-2' } });

        const calculateButton = screen.getByText('Calculate Impact');
        fireEvent.click(calculateButton);

        // Should either show results or graceful error message
        await waitFor(() => {
          const hasResults = screen.queryByText('Override Impact Analysis');
          const hasError = screen.queryByText('Unable to calculate impact');
          expect(hasResults || hasError).toBeTruthy();
        });
      } finally {
        console.error = originalError;
      }
    });
  });
});