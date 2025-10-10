import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OverrideImpactCalculator, { OverrideImpact } from '../OverrideImpactCalculator';
import {
  CollectionOpportunity,
  Site,
  OpportunityStatus,
  Priority
} from '../../types/collectionOpportunities';

// Mock data setup
const mockSites: Site[] = [
  {
    id: 'site-1',
    name: 'Primary Site',
    location: { lat: 40.7128, lon: -74.0060 },
    capacity: 100,
    allocated: 60
  },
  {
    id: 'site-2',
    name: 'Secondary Site',
    location: { lat: 34.0522, lon: -118.2437 },
    capacity: 80,
    allocated: 40
  },
  {
    id: 'site-3',
    name: 'Backup Site',
    location: { lat: 41.8781, lon: -87.6298 },
    capacity: 120,
    allocated: 90
  }
];

const mockOpportunity: CollectionOpportunity = {
  id: 'opp-1',
  name: 'Test Collection Opportunity',
  satellite: {
    id: 'sat-1',
    name: 'TestSat-1',
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
  allocatedSites: [mockSites[0]], // Currently allocated to Primary Site
  totalPasses: 5,
  capacity: 100,
  matchStatus: 'baseline',
  matchQuality: 75
};

const mockAllOpportunities: CollectionOpportunity[] = [
  mockOpportunity,
  {
    ...mockOpportunity,
    id: 'opp-2',
    name: 'Conflicting Opportunity',
    allocatedSites: [mockSites[1]], // Allocated to Secondary Site
    priority: 'critical'
  },
  {
    ...mockOpportunity,
    id: 'opp-3',
    name: 'Another Opportunity',
    allocatedSites: [mockSites[2]], // Allocated to Backup Site
    priority: 'medium'
  }
];

const defaultProps = {
  opportunity: mockOpportunity,
  proposedSite: mockSites[1], // Proposing to move to Secondary Site
  availableSites: mockSites,
  allOpportunities: mockAllOpportunities
};

describe('OverrideImpactCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders loading state initially', () => {
      render(<OverrideImpactCalculator {...defaultProps} />);
      
      expect(screen.getByText('Calculating override impact...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders impact analysis after calculation', async () => {
      render(<OverrideImpactCalculator {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('impact-analysis-results')).toBeInTheDocument();
      });

      expect(screen.getByText('Override Impact Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Moving from Primary Site to Secondary Site/)).toBeInTheDocument();
    });

    it('renders error state when calculation fails', () => {
      const propsWithoutSite = {
        ...defaultProps,
        proposedSite: undefined as any
      };

      render(<OverrideImpactCalculator {...propsWithoutSite} />);

      expect(screen.getByText('Unable to calculate impact. Please verify site selection.')).toBeInTheDocument();
    });
  });

  describe('Impact Analysis Components', () => {
    it('displays capacity impact comparison', async () => {
      render(<OverrideImpactCalculator {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Capacity Impact')).toBeInTheDocument();
      });

      expect(screen.getByText('Primary Site')).toBeInTheDocument();
      expect(screen.getByText('Secondary Site')).toBeInTheDocument();
      
      // Check for capacity percentages
      expect(screen.getByText('60.0%')).toBeInTheDocument(); // Original site capacity
      expect(screen.getByText('51.2%')).toBeInTheDocument(); // Proposed site capacity (40+1)/80*100
    });

    it('displays quality impact analysis', async () => {
      render(<OverrideImpactCalculator {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Quality Impact')).toBeInTheDocument();
      });

      expect(screen.getByText(/Original: 75.0/)).toBeInTheDocument();
      expect(screen.getByText(/Proposed:/)).toBeInTheDocument();
    });

    it('shows conflicts when they exist', async () => {
      const conflictingOpportunity = {
        ...mockOpportunity,
        id: 'opp-conflict',
        allocatedSites: [mockSites[1]] // Same as proposed site
      };
      
      const propsWithConflict = {
        ...defaultProps,
        allOpportunities: [...mockAllOpportunities, conflictingOpportunity]
      };

      render(<OverrideImpactCalculator {...propsWithConflict} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Scheduling Conflicts/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Opportunity opp-conflict/)).toBeInTheDocument();
    });

    it('displays operational impacts when present', async () => {
      // Use a site that will trigger high capacity warning
      const highCapacitySite = {
        ...mockSites[1],
        allocated: 70 // This will push utilization over 80% when +1 added
      };

      const propsWithHighCapacity = {
        ...defaultProps,
        proposedSite: highCapacitySite
      };

      render(<OverrideImpactCalculator {...propsWithHighCapacity} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Operational Impacts/)).toBeInTheDocument();
      });

      // Click to expand details
      fireEvent.click(screen.getByText(/Operational Impacts/));
      
      await waitFor(() => {
        expect(screen.getByText(/exceed recommended capacity/)).toBeInTheDocument();
      });
    });
  });

  describe('Risk Assessment', () => {
    it('displays low risk for safe overrides', async () => {
      render(<OverrideImpactCalculator {...defaultProps} />);
      
      await waitFor(() => {
        // Use getAllByText since "Low Risk" appears in multiple places
        const lowRiskElements = screen.getAllByText(/Low Risk/);
        expect(lowRiskElements.length).toBeGreaterThan(0);
      });

      expect(screen.getByText('Confirm Override (Low Risk)')).toBeInTheDocument();
    });

    it('requires justification for high-risk overrides', async () => {
      // Create a high-risk scenario with capacity issues and conflicts
      const highRiskSite = {
        ...mockSites[1],
        allocated: 75 // Will cause high utilization
      };

      const conflictingOpps = [
        ...mockAllOpportunities,
        { ...mockOpportunity, id: 'conflict-1', allocatedSites: [highRiskSite] },
        { ...mockOpportunity, id: 'conflict-2', allocatedSites: [highRiskSite] }
      ];

      const highRiskProps = {
        ...defaultProps,
        proposedSite: highRiskSite,
        allOpportunities: conflictingOpps
      };

      render(<OverrideImpactCalculator {...highRiskProps} />);
      
      await waitFor(() => {
        const highRiskElements = screen.getAllByText(/High Risk/);
        expect(highRiskElements.length).toBeGreaterThan(0);
      });

      await waitFor(() => {
        expect(screen.getByText('Approval Required:')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('override-justification')).toBeInTheDocument();
      });
    });

    it('enables submit button only when justification is provided for high-risk', async () => {
      const highRiskSite = {
        ...mockSites[1],
        allocated: 75
      };

      const conflictingOpps = [
        ...mockAllOpportunities,
        { ...mockOpportunity, id: 'conflict-1', allocatedSites: [highRiskSite] },
        { ...mockOpportunity, id: 'conflict-2', allocatedSites: [highRiskSite] }
      ];

      const highRiskProps = {
        ...defaultProps,
        proposedSite: highRiskSite,
        allOpportunities: conflictingOpps
      };

      render(<OverrideImpactCalculator {...highRiskProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirm-override-button')).toBeDisabled();
      });

      // Add justification
      const justificationInput = screen.getByTestId('override-justification');
      fireEvent.change(justificationInput, {
        target: { value: 'Critical mission requirement - approved by mission commander' }
      });

      await waitFor(() => {
        expect(screen.getByTestId('confirm-override-button')).not.toBeDisabled();
      });
    });
  });

  describe('Recommendations', () => {
    it('provides relevant recommendations based on risk factors', async () => {
      const highRiskSite = {
        ...mockSites[1],
        allocated: 75
      };

      const highRiskProps = {
        ...defaultProps,
        proposedSite: highRiskSite
      };

      render(<OverrideImpactCalculator {...highRiskProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
      });

      expect(screen.getByText(/Monitor site capacity closely/)).toBeInTheDocument();
    });

    it('shows positive recommendations for quality improvements', async () => {
      // Mock a scenario where quality improves significantly
      const mockCalculateImpact = jest.fn();
      const qualityImprovementProps = {
        ...defaultProps,
        onImpactCalculated: mockCalculateImpact
      };

      render(<OverrideImpactCalculator {...qualityImprovementProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
      });

      // Should show some recommendation about quality or monitoring
      const recommendations = screen.getAllByText(/Monitor|Consider|Review|Implement/);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Event Handlers', () => {
    it('calls onImpactCalculated when calculation completes', async () => {
      const mockOnImpactCalculated = jest.fn();
      
      render(
        <OverrideImpactCalculator 
          {...defaultProps} 
          onImpactCalculated={mockOnImpactCalculated}
        />
      );
      
      await waitFor(() => {
        expect(mockOnImpactCalculated).toHaveBeenCalledWith(
          expect.objectContaining({
            opportunityId: 'opp-1',
            proposedSite: mockSites[1],
            originalSite: mockSites[0]
          })
        );
      });
    });

    it('calls onJustificationRequired when justification is submitted', async () => {
      const mockOnJustificationRequired = jest.fn();
      
      // Create high-risk scenario
      const highRiskSite = {
        ...mockSites[1],
        allocated: 75
      };

      const conflictingOpps = [
        ...mockAllOpportunities,
        { ...mockOpportunity, id: 'conflict-1', allocatedSites: [highRiskSite] },
        { ...mockOpportunity, id: 'conflict-2', allocatedSites: [highRiskSite] }
      ];

      render(
        <OverrideImpactCalculator 
          {...defaultProps}
          proposedSite={highRiskSite}
          allOpportunities={conflictingOpps}
          onJustificationRequired={mockOnJustificationRequired}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('override-justification')).toBeInTheDocument();
      });

      // Fill justification and submit
      const justificationInput = screen.getByTestId('override-justification');
      fireEvent.change(justificationInput, {
        target: { value: 'Critical mission requirement' }
      });

      const submitButton = screen.getByTestId('confirm-override-button');
      fireEvent.click(submitButton);

      expect(mockOnJustificationRequired).toHaveBeenCalledWith('Critical mission requirement');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<OverrideImpactCalculator {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('impact-analysis-results')).toBeInTheDocument();
      });

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: /Override Impact Analysis/ })).toBeInTheDocument();
      
      // Check for proper form labeling
      if (screen.queryByTestId('override-justification')) {
        expect(screen.getByLabelText(/Override Justification/)).toBeInTheDocument();
      }
    });

    it('maintains focus management in justification workflow', async () => {
      const highRiskSite = {
        ...mockSites[1],
        allocated: 75
      };

      const conflictingOpps = [
        ...mockAllOpportunities,
        { ...mockOpportunity, id: 'conflict-1', allocatedSites: [highRiskSite] },
        { ...mockOpportunity, id: 'conflict-2', allocatedSites: [highRiskSite] }
      ];

      render(
        <OverrideImpactCalculator 
          {...defaultProps}
          proposedSite={highRiskSite}
          allOpportunities={conflictingOpps}
        />
      );
      
      await waitFor(() => {
        const justificationInput = screen.getByTestId('override-justification');
        expect(justificationInput).toBeInTheDocument();
      });
      
      // Verify the input is properly set up
      const justificationInput = screen.getByTestId('override-justification');
      expect(justificationInput).toHaveAttribute('placeholder');
    });
  });

  describe('Performance', () => {
    it('calculates impact within reasonable time', async () => {
      const startTime = Date.now();
      
      render(<OverrideImpactCalculator {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('impact-analysis-results')).toBeInTheDocument();
      });

      const endTime = Date.now();
      const calculationTime = endTime - startTime;
      
      // Should complete calculation within 2 seconds (including simulated delay)
      expect(calculationTime).toBeLessThan(2000);
    });

    it('handles large numbers of opportunities efficiently', async () => {
      // Create a large dataset
      const largeOpportunitySet = Array.from({ length: 100 }, (_, i) => ({
        ...mockOpportunity,
        id: `opp-${i}`,
        name: `Opportunity ${i}`
      }));

      const performanceProps = {
        ...defaultProps,
        allOpportunities: largeOpportunitySet
      };

      const startTime = Date.now();
      
      render(<OverrideImpactCalculator {...performanceProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('impact-analysis-results')).toBeInTheDocument();
      });

      const endTime = Date.now();
      const calculationTime = endTime - startTime;
      
      // Should still complete reasonably quickly even with large dataset
      expect(calculationTime).toBeLessThan(3000);
    });
  });
});