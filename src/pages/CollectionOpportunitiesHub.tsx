import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Spinner,
  NonIdealState,
  Button,
  Intent
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

// Legacy imports
import { AllocationProvider } from '../contexts/AllocationContext';
import { CollectionOpportunity, Site, CollectionDeck } from '../types/collectionOpportunities';
import AppNavbar from '../components/AppNavbar';
import CollectionOpportunitiesHubCore from '../components/CollectionOpportunitiesHubCore';
import './CollectionOpportunitiesHub.css';
import './CollectionOpportunitiesHub.enhanced.css';
import './CollectionOpportunitiesHub.accessible.css';
import { usePerformanceMonitor } from '../utils/performanceOptimizations';

// Secure mock data handling - only in development
let generateCompleteMockData: typeof import('../mocks/collectionOpportunitiesMocks').generateCompleteMockData | undefined;
let IS_USING_MOCK_DATA = false;

// Security: Ensure mock data is completely excluded from production builds
if (process.env.NODE_ENV === 'development') {
  // Dynamic import with error handling
  import('../mocks/collectionOpportunitiesMocks')
    .then(module => {
      generateCompleteMockData = module.generateCompleteMockData;
      IS_USING_MOCK_DATA = module.IS_USING_MOCK_DATA;
      // Security: Log warning about mock data usage
      if (IS_USING_MOCK_DATA) {
        console.warn('🔒 Using mock data in development mode');
      }
    })
    .catch(() => {
      console.warn('Mock data module not available');
    });
}

// Props interface for embedded mode support
interface CollectionOpportunitiesHubProps {
  collectionId?: string;
  embedded?: boolean;
  defaultFilter?: 'all' | 'needsReview' | 'highPriority' | 'unmatched';
  compactMode?: boolean;
  onNavigateToFull?: () => void;
}

// Main hub component with provider - memoized for performance
const CollectionOpportunitiesHub: React.FC<CollectionOpportunitiesHubProps> = memo(({
  collectionId: propCollectionId,
  embedded = false,
  defaultFilter = 'all',
  compactMode = false,
  onNavigateToFull
}) => {
  // Performance monitoring
  usePerformanceMonitor('CollectionOpportunitiesHub');
  const [opportunities, setOpportunities] = useState<CollectionOpportunity[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [collectionDecks, setCollectionDecks] = useState<CollectionDeck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // In production, replace with API calls
        // TEMP FIX: Always use mock data for now
        const useMockData = true; // process.env.NODE_ENV !== 'production'

        if (!useMockData) {
          // TODO: Replace with actual API calls
          // const response = await fetch('/api/opportunities');
          // const data = await response.json();
          // setOpportunities(data.opportunities);
          // setSites(data.sites);
          // setCollectionDecks(data.decks);

          // For now, just set empty data in production
          setOpportunities([]);
          setSites([]);
          setCollectionDecks([]);
        } else {
          // Development mode - use mock data
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Wait for dynamic import to load
          let retries = 0;
          while (!generateCompleteMockData && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
          }

          if (generateCompleteMockData) {
            const mockData = generateCompleteMockData(50, 10, 5);
            setOpportunities(mockData.opportunities);
            setSites(mockData.sites);
            setCollectionDecks(mockData.decks);

            console.info('✅ Mock data loaded:', mockData.opportunities.length, 'opportunities');
          } else {
            throw new Error('Failed to load mock data generator');
          }
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle batch update
  const handleBatchUpdate = useCallback(async (changes: any[]) => {
    // Implement API call
    return {
      success: true,
      updated: changes.map(c => c.opportunityId),
      failures: []
    };
  }, []);

  // Add smooth fade-in animation
  useEffect(() => {
    if (!isLoading) {
      document.body.classList.add('app-loaded');
    }
    return () => {
      document.body.classList.remove('app-loaded');
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="hub-loading">
        {!embedded && <AppNavbar />}
        <div className="hub-skeleton">
          {/* Header Skeleton */}
          <div className="skeleton-header">
            <div className="skeleton-title">
              <div className="skeleton skeleton-h1" />
              <div className="skeleton skeleton-subtitle" />
            </div>
            <div className="skeleton-actions">
              <div className="skeleton skeleton-button" />
              <div className="skeleton skeleton-button" />
            </div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="skeleton-stats">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton skeleton-stat-card" />
            ))}
          </div>
          
          {/* Content Skeleton */}
          <div className="skeleton-content">
            <div className="skeleton skeleton-tabs" />
            <div className="skeleton skeleton-table" />
          </div>
          
          {/* Actual Loading Overlay */}
          <div className="loading-overlay">
            <div className="loading-content">
              <Spinner size={50} />
              <h2>Loading Assignments...</h2>
              <p>Initializing real-time connections and fetching data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hub-error">
        {!embedded && <AppNavbar />}
        <NonIdealState
          icon={IconNames.ERROR}
          title="Failed to Load"
          description={error.message}
          action={
            <Button
              intent={Intent.PRIMARY}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      {!embedded && <AppNavbar />}
      <AllocationProvider
        initialOpportunities={opportunities}
        initialSites={sites}
        initialCollectionDecks={collectionDecks}
        capacityThresholds={{ critical: 10, warning: 30, optimal: 70 }}
        enableRealTimeUpdates={true}
        onBatchUpdate={handleBatchUpdate}
      >
        {/* Main Content - delegated to CollectionOpportunitiesHubCore */}
        <CollectionOpportunitiesHubCore
          embeddedMode={embedded}
          defaultFilter={defaultFilter}
          compactMode={compactMode}
          onNavigateToFull={onNavigateToFull}
        />
      </AllocationProvider>
    </>
  );
});

CollectionOpportunitiesHub.displayName = 'CollectionOpportunitiesHub';

export default CollectionOpportunitiesHub;