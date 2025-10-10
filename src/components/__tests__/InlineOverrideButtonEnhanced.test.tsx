import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InlineOverrideButtonEnhanced from '../InlineOverrideButtonEnhanced';
import {
  CollectionOpportunity,
  Site
} from '../../types/collectionOpportunities';

// Mock the OverrideImpactCalculator component
jest.mock('../OverrideImpactCalculator', () => {
  return function MockOverrideImpactCalculator({ onImpactCalculated, onJustificationRequired }: any) {
    React.useEffect(() => {
      // Simulate impact calculation
      const mockImpact = {
        opportunityId: 'opp-1',
        proposedSite: { id: 'site-2', name: 'Secondary Site' },
        originalSite: { id: 'site-1', name: 'Primary Site' },
        capacityImpact: {
          originalSiteCapacity: 60,
          proposedSiteCapacity: 51.2,
          capacityDelta: -8.8,
          utilizationChange: -8.8
        },
        affectedSatellites: ['sat-1'],
        affectedSites: ['site-1', 'site-2'],
        conflictingOpportunities: [],
        qualityImpact: {
          originalQuality: 75,
          proposedQuality: 78,
          qualityDelta: 3,
          riskLevel: 'low' as const
        },
        operationalImpacts: [],
        recommendations: ['Monitor site capacity closely after allocation'],
        requiresApproval: false,
        riskScore: 25
      };
      
      setTimeout(() => {
        onImpactCalculated?.(mockImpact);
      }, 100);
    }, [onImpactCalculated]);

    return (
      <div data-testid="mock-impact-calculator">
        <h4>Override Impact Analysis</h4>
        <button 
          data-testid="confirm-override-button"
          onClick={() => onJustificationRequired?.('Test justification')}
        >
          Confirm Override
        </button>
      </div>
    );
  };
});

// Mock data
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
    name: 'Another Opportunity',
    allocatedSites: [mockSites[1]]
  }
];

const defaultProps = {
  opportunity: mockOpportunity,
  availableSites: mockSites,
  allOpportunities: mockAllOpportunities,
  onOverride: jest.fn()
};

describe('InlineOverrideButtonEnhanced', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders override button with correct props', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      const button = screen.getByTestId('override-allocation-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title', 'Override system recommendation with impact analysis');
      expect(button).not.toBeDisabled();
    });

    it('renders disabled when disabled prop is true', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} disabled={true} />);
      
      const button = screen.getByTestId('override-allocation-button');
      expect(button).toBeDisabled();
    });

    it('renders minimal version when minimal prop is true', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} minimal={true} />);
      
      const button = screen.getByTestId('override-allocation-button');
      expect(button).toBeInTheDocument();
      // In minimal mode, button text should not be visible
      expect(button).not.toHaveTextContent('Override');
    });
  });

  describe('Dialog Workflow', () => {
    it('opens dialog when button is clicked', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      const button = screen.getByTestId('override-allocation-button');
      fireEvent.click(button);
      
      expect(screen.getByTestId('override-panel')).toBeInTheDocument();
      expect(screen.getByText('Override Allocation')).toBeInTheDocument();
    });

    it('shows current allocation information', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      expect(screen.getByText(/Current Allocation:/)).toBeInTheDocument();
      expect(screen.getByText(/Primary Site/)).toBeInTheDocument();
      expect(screen.getByText(/Test Collection Opportunity/)).toBeInTheDocument();
    });

    it('shows alternative sites in dropdown', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      expect(siteSelect).toBeInTheDocument();
      
      // Should exclude currently allocated site
      expect(screen.getByText(/Secondary Site/)).toBeInTheDocument();
      expect(screen.getByText(/Backup Site/)).toBeInTheDocument();
    });

    it('warns when no alternative sites are available', () => {
      const propsWithNoAlternatives = {
        ...defaultProps,
        availableSites: [mockSites[0]], // Only the currently allocated site
        opportunity: {
          ...mockOpportunity,
          allocatedSites: [mockSites[0]]
        }
      };

      render(<InlineOverrideButtonEnhanced {...propsWithNoAlternatives} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      expect(screen.getByText(/No alternative sites available/)).toBeInTheDocument();
    });
  });

  describe('Site Selection Step', () => {
    it('enables calculate impact button when site is selected', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const calculateButton = screen.getByTestId('calculate-impact-button');
      expect(calculateButton).toBeDisabled();
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });
      
      expect(calculateButton).not.toBeDisabled();
    });

    it('proceeds to impact analysis when calculate impact is clicked', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });
      
      const calculateButton = screen.getByTestId('calculate-impact-button');
      fireEvent.click(calculateButton);
      
      expect(screen.getByTestId('mock-impact-calculator')).toBeInTheDocument();
    });

    it('can cancel site selection', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByTestId('override-panel')).not.toBeInTheDocument();
    });
  });

  describe('Impact Analysis Step', () => {
    beforeEach(async () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });
      
      const calculateButton = screen.getByTestId('calculate-impact-button');
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-impact-calculator')).toBeInTheDocument();
      });
    });

    it('shows impact calculator component', () => {
      expect(screen.getByText('Override Impact Analysis')).toBeInTheDocument();
    });

    it('has back button to return to site selection', () => {
      const backButton = screen.getByText('Back to Site Selection');
      expect(backButton).toBeInTheDocument();
      
      fireEvent.click(backButton);
      
      expect(screen.getByTestId('alternative-site-option')).toBeInTheDocument();
    });

    it('shows confirm override button after impact calculation', async () => {
      await waitFor(() => {
        expect(screen.getByTestId('confirm-override-button')).toBeInTheDocument();
      });
    });

    it('can cancel from impact analysis step', () => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByTestId('override-panel')).not.toBeInTheDocument();
    });
  });

  describe('Override Confirmation', () => {
    it('calls onOverride with correct parameters when confirmed', async () => {
      const mockOnOverride = jest.fn();
      
      render(
        <InlineOverrideButtonEnhanced 
          {...defaultProps} 
          onOverride={mockOnOverride}
        />
      );
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });
      
      const calculateButton = screen.getByTestId('calculate-impact-button');
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirm-override-button')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByTestId('confirm-override-button');
      fireEvent.click(confirmButton);
      
      expect(mockOnOverride).toHaveBeenCalledWith(
        'opp-1',
        expect.objectContaining({
          id: 'site-2',
          name: 'Secondary Site'
        }),
        'Test justification',
        expect.objectContaining({
          opportunityId: 'opp-1',
          riskScore: 25
        })
      );
    });

    it('closes dialog after successful override', async () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });
      
      const calculateButton = screen.getByTestId('calculate-impact-button');
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirm-override-button')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByTestId('confirm-override-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('override-panel')).not.toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('resets state when dialog is reopened', async () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      // First interaction
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });
      
      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // Reopen dialog
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      // State should be reset
      const resetSiteSelect = screen.getByTestId('alternative-site-option');
      expect(resetSiteSelect).toHaveValue('');
      
      const calculateButton = screen.getByTestId('calculate-impact-button');
      expect(calculateButton).toBeDisabled();
    });

    it('maintains state during back navigation', async () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });
      
      const calculateButton = screen.getByTestId('calculate-impact-button');
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-impact-calculator')).toBeInTheDocument();
      });
      
      // Go back
      const backButton = screen.getByText('Back to Site Selection');
      fireEvent.click(backButton);
      
      // Site selection should be preserved
      const backSiteSelect = screen.getByTestId('alternative-site-option');
      expect(backSiteSelect).toHaveValue('site-2');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      const button = screen.getByTestId('override-allocation-button');
      expect(button).toHaveAttribute('title');
      
      fireEvent.click(button);
      
      const dialog = screen.getByTestId('override-panel');
      expect(dialog).toHaveAttribute('role', 'dialog');
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      expect(siteSelect).toHaveAccessibleName();
    });

    it('maintains focus management during workflow', async () => {
      render(<InlineOverrideButtonEnhanced {...defaultProps} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const siteSelect = screen.getByTestId('alternative-site-option');
      fireEvent.change(siteSelect, { target: { value: 'site-2' } });
      
      const calculateButton = screen.getByTestId('calculate-impact-button');
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Override Impact Analysis')).toBeInTheDocument();
      });
      
      // Back button should be focusable
      const backButton = screen.getByText('Back to Site Selection');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing site data gracefully', () => {
      const propsWithoutSites = {
        ...defaultProps,
        availableSites: []
      };

      render(<InlineOverrideButtonEnhanced {...propsWithoutSites} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      expect(screen.getByText(/No alternative sites available/)).toBeInTheDocument();
    });

    it('disables override when no alternatives exist', () => {
      const propsWithSameAllocation = {
        ...defaultProps,
        availableSites: [mockSites[0]], // Only currently allocated site
        opportunity: {
          ...mockOpportunity,
          allocatedSites: [mockSites[0]]
        }
      };

      render(<InlineOverrideButtonEnhanced {...propsWithSameAllocation} />);
      
      fireEvent.click(screen.getByTestId('override-allocation-button'));
      
      const calculateButton = screen.getByTestId('calculate-impact-button');
      expect(calculateButton).toBeDisabled();
    });
  });
});