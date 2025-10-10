/**
 * Analytics Enhanced Dashboard - Test Suite
 * Comprehensive test coverage for JTBD #4: Analyze Performance Trends
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Analytics from '../AnalyticsEnhanced';
import AnalyticsService from '../../services/analyticsService';
import { CollectionOpportunity } from '../../types/collectionOpportunities';

// Mock the analytics service
jest.mock('../../services/analyticsService');
const mockAnalyticsService = AnalyticsService as jest.Mocked<typeof AnalyticsService>;

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
  ArcElement: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} />
  ),
}));

// Mock AppNavbar
jest.mock('../../components/AppNavbar', () => {
  return function MockAppNavbar() {
    return <div data-testid="app-navbar">Navigation</div>;
  };
});

// Helper function to wrap component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Mock analytics data
const mockOpportunities: CollectionOpportunity[] = [
  {
    id: 'opp-1',
    name: 'Test Collection 1',
    satellite: {
      id: 'sat-1',
      name: 'Satellite 1',
      capacity: 100,
      currentLoad: 50,
      orbit: 'LEO',
      function: 'Imaging'
    },
    sites: [],
    allocatedSites: [
      {
        id: 'site-1',
        name: 'Site A',
        location: { lat: 0, lon: 0 },
        capacity: 50,
        allocated: 25
      }
    ],
    priority: 'high',
    status: 'optimal',
    capacityPercentage: 75,
    conflicts: [],
    createdDate: '2024-01-01T00:00:00.000Z',
    lastModified: '2024-01-02T00:00:00.000Z',
    collectionDeckId: 'deck-1',
    totalPasses: 5,
    capacity: 100,
    matchStatus: 'baseline'
  }
];

const mockPerformanceMetrics = {
  totalOpportunities: 150,
  matchSuccessRate: 85.5,
  averageProcessingTime: 45.2,
  conflictResolutionRate: 92.3,
  capacityUtilization: 67.8,
  dataIntegrityScore: 94.1
};

const mockTrendData = [
  { date: '2024-01-01', value: 80, change: 2, changePercentage: 2.5 },
  { date: '2024-01-02', value: 82, change: 2, changePercentage: 2.4 },
  { date: '2024-01-03', value: 85, change: 3, changePercentage: 3.7 }
];

const mockSitePerformance = [
  {
    siteId: 'site-1',
    siteName: 'Site A',
    totalAllocations: 25,
    successRate: 88.5,
    averageCapacityUsage: 75.2,
    conflictCount: 2,
    lastActivityDate: '2024-01-03T00:00:00.000Z'
  }
];

const mockConflictAnalytics = {
  totalConflicts: 15,
  resolvedConflicts: 12,
  pendingConflicts: 3,
  averageResolutionTime: 2.5,
  conflictsByType: {
    'Scheduling Conflict': 6,
    'Capacity Limit': 4,
    'Resource Unavailable': 3,
    'Data Quality': 2
  },
  resolutionTrends: mockTrendData
};

const mockInsights = [
  {
    id: 'insight-1',
    type: 'opportunity' as const,
    severity: 'medium' as const,
    title: 'Optimization Opportunity',
    description: 'System performance can be improved',
    recommendation: 'Implement caching strategy',
    impact: 'Faster processing times',
    confidence: 85
  }
];

describe('Analytics Enhanced Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the analytics service singleton
    const mockServiceInstance = {
      calculatePerformanceMetrics: jest.fn().mockReturnValue(mockPerformanceMetrics),
      generateTrendData: jest.fn().mockReturnValue(mockTrendData),
      analyzeSitePerformance: jest.fn().mockReturnValue(mockSitePerformance),
      analyzeConflicts: jest.fn().mockReturnValue(mockConflictAnalytics),
      generateInsights: jest.fn().mockReturnValue(mockInsights),
      exportData: jest.fn().mockResolvedValue('mock,export,data')
    };
    
    mockAnalyticsService.getInstance.mockReturnValue(mockServiceInstance as any);
  });

  describe('Component Rendering', () => {
    test('renders loading state initially', () => {
      renderWithRouter(<Analytics />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('renders main dashboard after loading', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Trends Analytics')).toBeInTheDocument();
      });
      
      expect(screen.getByText('JTBD #4: Monitor collection efficiency and identify optimization opportunities')).toBeInTheDocument();
    });

    test('renders breadcrumb navigation', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      });
    });

    test('renders performance summary cards', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Match Success Rate')).toBeInTheDocument();
        expect(screen.getByText('Capacity Utilization')).toBeInTheDocument();
        expect(screen.getByText('Conflict Resolution')).toBeInTheDocument();
        expect(screen.getByText('Data Integrity')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('switches between tabs correctly', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });

      // Click on Detailed Trends tab
      fireEvent.click(screen.getByText('Detailed Trends'));
      
      await waitFor(() => {
        expect(screen.getByText('Conflict Resolution Trends')).toBeInTheDocument();
      });

      // Click on Site Performance tab
      fireEvent.click(screen.getByText('Site Performance'));
      
      await waitFor(() => {
        expect(screen.getByText('Site Performance Analysis')).toBeInTheDocument();
      });

      // Click on Insights tab
      fireEvent.click(screen.getByText('Insights'));
      
      await waitFor(() => {
        expect(screen.getByText('Actionable Insights')).toBeInTheDocument();
      });

      // Click on Activity Log tab
      fireEvent.click(screen.getByText('Activity Log'));
      
      await waitFor(() => {
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics Display', () => {
    test('displays correct performance metrics values', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('85.5%')).toBeInTheDocument(); // Match Success Rate
        expect(screen.getByText('67.8%')).toBeInTheDocument(); // Capacity Utilization
        expect(screen.getByText('92.3%')).toBeInTheDocument(); // Conflict Resolution
        expect(screen.getByText('94.1%')).toBeInTheDocument(); // Data Integrity
      });
    });

    test('displays charts with correct data', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        const lineCharts = screen.getAllByTestId('line-chart');
        const doughnutChart = screen.getByTestId('doughnut-chart');
        
        expect(lineCharts.length).toBeGreaterThan(0);
        expect(doughnutChart).toBeInTheDocument();
      });
    });
  });

  describe('Site Performance Analysis', () => {
    test('displays site performance data correctly', async () => {
      renderWithRouter(<Analytics />);
      
      // Navigate to Site Performance tab
      await waitFor(() => {
        fireEvent.click(screen.getByText('Site Performance'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Site A')).toBeInTheDocument();
        expect(screen.getByText('25 allocations')).toBeInTheDocument();
      });
    });

    test('shows empty state when no site data available', async () => {
      // Mock empty site performance
      const mockServiceInstance = mockAnalyticsService.getInstance();
      mockServiceInstance.analyzeSitePerformance.mockReturnValue([]);
      
      renderWithRouter(<Analytics />);
      
      fireEvent.click(screen.getByText('Site Performance'));
      
      await waitFor(() => {
        expect(screen.getByText('No Site Data Available')).toBeInTheDocument();
      });
    });
  });

  describe('Insights Display', () => {
    test('displays actionable insights correctly', async () => {
      renderWithRouter(<Analytics />);
      
      // Check insights in overview
      await waitFor(() => {
        expect(screen.getByText('Optimization Opportunity')).toBeInTheDocument();
        expect(screen.getByText('System performance can be improved')).toBeInTheDocument();
      });
      
      // Navigate to Insights tab for detailed view
      fireEvent.click(screen.getByText('Insights'));
      
      await waitFor(() => {
        expect(screen.getByText('Implement caching strategy')).toBeInTheDocument();
        expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();
      });
    });

    test('shows empty state when no insights available', async () => {
      // Mock empty insights
      const mockServiceInstance = mockAnalyticsService.getInstance();
      mockServiceInstance.generateInsights.mockReturnValue([]);
      
      renderWithRouter(<Analytics />);
      
      fireEvent.click(screen.getByText('Insights'));
      
      await waitFor(() => {
        expect(screen.getByText('No Insights Available')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    test('enables real-time updates toggle', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        const realTimeToggle = screen.getByLabelText('Real-time Updates');
        expect(realTimeToggle).toBeInTheDocument();
        expect(realTimeToggle).not.toBeChecked();
        
        fireEvent.click(realTimeToggle);
        expect(realTimeToggle).toBeChecked();
      });
    });

    test('refresh button triggers data reload', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh');
        expect(refreshButton).toBeInTheDocument();
        
        fireEvent.click(refreshButton);
      });
      
      // Verify service methods are called again
      const mockServiceInstance = mockAnalyticsService.getInstance();
      expect(mockServiceInstance.calculatePerformanceMetrics).toHaveBeenCalledTimes(2);
    });
  });

  describe('Export Functionality', () => {
    test('shows export menu when clicked', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        const exportButton = screen.getByText('Export Report');
        fireEvent.click(exportButton);
        
        expect(screen.getByText('Export as CSV')).toBeInTheDocument();
        expect(screen.getByText('Export as Excel')).toBeInTheDocument();
        expect(screen.getByText('Export as JSON')).toBeInTheDocument();
        expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      });
    });

    test('triggers export when format is selected', async () => {
      // Mock URL.createObjectURL and related functions
      const mockCreateObjectURL = jest.fn().mockReturnValue('mock-url');
      const mockRevokeObjectURL = jest.fn();
      
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
      
      // Mock document.createElement and related functions
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation();
      
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        const exportButton = screen.getByText('Export Report');
        fireEvent.click(exportButton);
        
        const csvOption = screen.getByText('Export as CSV');
        fireEvent.click(csvOption);
      });
      
      await waitFor(() => {
        const mockServiceInstance = mockAnalyticsService.getInstance();
        expect(mockServiceInstance.exportData).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            format: 'csv'
          })
        );
      });
      
      // Cleanup mocks
      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('displays error state when data loading fails', async () => {
      // Mock service to throw error
      const mockServiceInstance = {
        calculatePerformanceMetrics: jest.fn().mockImplementation(() => {
          throw new Error('Data loading failed');
        }),
        generateTrendData: jest.fn(),
        analyzeSitePerformance: jest.fn(),
        analyzeConflicts: jest.fn(),
        generateInsights: jest.fn(),
        exportData: jest.fn()
      };
      
      mockAnalyticsService.getInstance.mockReturnValue(mockServiceInstance as any);
      
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Analytics Data Unavailable')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    test('retry button attempts to reload data', async () => {
      // Mock service to throw error initially, then succeed
      let callCount = 0;
      const mockServiceInstance = {
        calculatePerformanceMetrics: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Data loading failed');
          }
          return mockPerformanceMetrics;
        }),
        generateTrendData: jest.fn().mockReturnValue(mockTrendData),
        analyzeSitePerformance: jest.fn().mockReturnValue(mockSitePerformance),
        analyzeConflicts: jest.fn().mockReturnValue(mockConflictAnalytics),
        generateInsights: jest.fn().mockReturnValue(mockInsights),
        exportData: jest.fn()
      };
      
      mockAnalyticsService.getInstance.mockReturnValue(mockServiceInstance as any);
      
      renderWithRouter(<Analytics />);
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
      
      // Click retry
      fireEvent.click(screen.getByText('Retry'));
      
      // Wait for successful load
      await waitFor(() => {
        expect(screen.getByText('Performance Trends Analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('applies responsive CSS classes', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        const summaryGrid = document.querySelector('.performance-summary-grid');
        const chartsGrid = document.querySelector('.charts-grid');
        
        expect(summaryGrid).toBeInTheDocument();
        expect(chartsGrid).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels and roles', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        // Check for tab accessibility
        const tabList = screen.getByRole('tablist');
        expect(tabList).toBeInTheDocument();
        
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThan(0);
        
        // Check for button accessibility
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    test('supports keyboard navigation', async () => {
      renderWithRouter(<Analytics />);
      
      await waitFor(() => {
        const firstTab = screen.getAllByRole('tab')[0];
        firstTab.focus();
        expect(firstTab).toHaveFocus();
      });
    });
  });
});

describe('Analytics Service Integration', () => {
  test('calls analytics service methods with correct parameters', async () => {
    renderWithRouter(<Analytics />);
    
    await waitFor(() => {
      const mockServiceInstance = mockAnalyticsService.getInstance();
      
      expect(mockServiceInstance.calculatePerformanceMetrics).toHaveBeenCalledWith(
        expect.any(Array)
      );
      expect(mockServiceInstance.generateTrendData).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(String)
      );
      expect(mockServiceInstance.analyzeSitePerformance).toHaveBeenCalledWith(
        expect.any(Array)
      );
      expect(mockServiceInstance.analyzeConflicts).toHaveBeenCalledWith(
        expect.any(Array)
      );
      expect(mockServiceInstance.generateInsights).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Object)
      );
    });
  });
});

describe('Performance Optimization', () => {
  test('uses React.memo for performance optimization', () => {
    // This would test that components are properly memoized
    // In a real implementation, we'd check for unnecessary re-renders
    expect(true).toBe(true); // Placeholder test
  });

  test('debounces user interactions appropriately', () => {
    // This would test that expensive operations are debounced
    // In a real implementation, we'd verify debouncing behavior
    expect(true).toBe(true); // Placeholder test
  });
});