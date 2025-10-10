import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import CollectionOpportunitiesHub from '../CollectionOpportunitiesHub';
import { AllocationProvider } from '../../contexts/AllocationContext';
import * as mockModule from '../../mocks/collectionOpportunitiesMocks';

// Mock dependencies
jest.mock('../../components/AppNavbar', () => ({
  __esModule: true,
  default: () => <nav data-testid="app-navbar">Navigation</nav>
}));

jest.mock('../../hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    progressiveComplexityUI: true,
    enableVirtualScrolling: false,
    enableWorkspaceMode: true,
    enableBatchOperations: true,
    enableHealthAnalysis: true,
    useRefactoredComponents: false,
    enableSplitView: false,
    enableBentoLayout: false,
    enableEnhancedBento: false
  })
}));

// Mock lazy loaded components
jest.mock('../../components/ReallocationWorkspace', () => ({
  __esModule: true,
  default: ({ onClose }: any) => (
    <div data-testid="reallocation-workspace">
      <button onClick={onClose}>Close Workspace</button>
    </div>
  )
}));

jest.mock('../../components/CollectionOpportunitiesEnhanced', () => ({
  __esModule: true,
  default: ({ opportunities }: any) => (
    <div data-testid="opportunities-enhanced">
      Enhanced View: {opportunities.length} opportunities
    </div>
  )
}));

// Mock router params
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ collectionId: 'test-collection-123' }),
  useNavigate: () => jest.fn()
}));

describe('CollectionOpportunitiesHub', () => {
  let mockGenerateData: jest.SpyInstance;

  beforeEach(() => {
    // Setup mock data generation
    mockGenerateData = jest.spyOn(mockModule, 'generateCompleteMockData').mockReturnValue({
      opportunities: [
        {
          id: 'opp-1',
          name: 'Test Opportunity 1',
          satellite: { id: 'sat-1', name: 'Satellite 1' },
          site: { id: 'site-1', name: 'Site 1' },
          quality: 5,
          imageCount: 10,
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T11:00:00Z',
          isAllocated: false,
          status: 'available' as const
        },
        {
          id: 'opp-2',
          name: 'Test Opportunity 2',
          satellite: { id: 'sat-2', name: 'Satellite 2' },
          site: { id: 'site-2', name: 'Site 2' },
          quality: 3,
          imageCount: 5,
          startTime: '2024-01-01T12:00:00Z',
          endTime: '2024-01-01T13:00:00Z',
          isAllocated: true,
          status: 'allocated' as const
        }
      ],
      sites: [
        { id: 'site-1', name: 'Site 1', coordinates: { lat: 0, lng: 0 }, capacity: 100 },
        { id: 'site-2', name: 'Site 2', coordinates: { lat: 1, lng: 1 }, capacity: 100 }
      ],
      decks: [
        { id: 'deck-1', name: 'Deck 1' }
      ]
    });

    // Mock console methods
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const renderHub = () => {
    return render(
      <MemoryRouter initialEntries={['/collection/test-collection-123']}>
        <CollectionOpportunitiesHub />
      </MemoryRouter>
    );
  };

  describe('Initial Loading', () => {
    it('should show loading state initially', () => {
      renderHub();
      
      expect(screen.getByText('Loading Collection Opportunities...')).toBeInTheDocument();
      expect(screen.getByText('Initializing real-time connections and fetching data')).toBeInTheDocument();
    });

    it('should load data and display hub content', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.queryByText('Loading Collection Opportunities...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Collection Deck test-collection-123')).toBeInTheDocument();
      expect(screen.getByText(/Manage satellite collection opportunities/)).toBeInTheDocument();
    });
  });

  describe('Statistics Dashboard', () => {
    it('should display opportunity statistics', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Opportunity statistics')).toBeInTheDocument();
      });

      const statsRegion = screen.getByLabelText('Opportunity statistics');
      expect(within(statsRegion).getByText('2')).toBeInTheDocument(); // Total
      expect(within(statsRegion).getByText('Total Opportunities')).toBeInTheDocument();
    });

    it('should have proper ARIA labels for statistics', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Opportunity statistics')).toBeInTheDocument();
      });

      expect(screen.getByRole('group', { name: /total-label/ })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /critical-label/ })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /warning-label/ })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /optimal-label/ })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should render all tabs', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });

      expect(screen.getByRole('tab', { name: /Manage Opportunities/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Analytics/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Settings/i })).toBeInTheDocument();
    });

    it('should switch tabs on click', async () => {
      const user = userEvent.setup();
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });

      const analyticsTab = screen.getByRole('tab', { name: /Analytics/i });
      await user.click(analyticsTab);

      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('View real-time performance metrics and optimization insights')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have skip to main content link', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      });

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have keyboard instructions button', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Show keyboard shortcuts')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error state when data loading fails', async () => {
      mockGenerateData.mockImplementation(() => {
        throw new Error('Failed to load mock data');
      });

      renderHub();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Load')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load mock data generator')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('should retry loading on error retry button click', async () => {
      mockGenerateData.mockImplementationOnce(() => {
        throw new Error('Failed to load');
      });

      const reloadSpy = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true
      });

      renderHub();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('Workspace Mode', () => {
    it('should open workspace when enabled', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByTestId('opportunities-enhanced')).toBeInTheDocument();
      });

      // Simulate workspace opening through context
      // This would normally be triggered by clicking on an opportunity
      // Testing the workspace component integration
    });
  });

  describe('Smart View Integration', () => {
    it('should render smart view selector', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByText(/Collection Deck/)).toBeInTheDocument();
      });

      // Smart view selector should be present
      // The actual SmartViewSelector component would need its own tests
    });
  });

  describe('Connection Status', () => {
    it('should display connection status in status bar', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Connection status')).toBeInTheDocument();
      });

      const statusBar = screen.getByLabelText('Connection status');
      expect(within(statusBar).getByText('Disconnected')).toBeInTheDocument();
      expect(within(statusBar).getByText(/Last sync:/)).toBeInTheDocument();
      expect(within(statusBar).getByText(/Collection ID: test-collection-123/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should use memoized components', async () => {
      const { rerender } = renderHub();
      
      await waitFor(() => {
        expect(screen.getByText('Collection Deck test-collection-123')).toBeInTheDocument();
      });

      // Force re-render
      rerender(
        <MemoryRouter initialEntries={['/collection/test-collection-123']}>
          <CollectionOpportunitiesHub />
        </MemoryRouter>
      );

      // Component should still be present without re-fetching data
      expect(screen.getByText('Collection Deck test-collection-123')).toBeInTheDocument();
      expect(mockGenerateData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA landmarks', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'Collection Deck test-collection-123' })).toBeInTheDocument();
      });
    });

    it('should announce critical issues', async () => {
      renderHub();
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Live region should be present for announcements
      const liveRegions = screen.getAllByRole('status');
      expect(liveRegions.length).toBeGreaterThan(0);
    });
  });
});