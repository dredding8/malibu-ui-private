import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Spinner, NonIdealState, Button, Callout, Intent } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { featureFlags, useFeatureFlag } from '../config/featureFlags';
import { trackTableLoad, trackImportError } from '../monitoring/collectionOpportunitiesAlerts';
import ErrorBoundary from './ErrorBoundary';

// Define loading priorities
const LOAD_PRIORITIES = {
  CRITICAL: ['CollectionOpportunities'],
  ENHANCED: ['CollectionOpportunitiesEnhancedBento', 'VirtualizedOpportunitiesTable'],
  OPTIONAL: ['CollectionOpportunitiesRefactoredBento', 'CollectionOpportunitiesPerformance']
};

// Lazy load components with fallbacks
const componentLoaders = {
  legacy: lazy(() => import('./CollectionOpportunities')),
  enhanced: lazy(() => import('./CollectionOpportunitiesEnhancedBento')),
  refactored: lazy(() => import('./CollectionOpportunitiesRefactoredBento')),
  split: lazy(() => import('./CollectionOpportunitiesSplitView')),
};

interface LoaderProps {
  variant?: 'legacy' | 'enhanced' | 'refactored' | 'split';
  onLoadError?: (error: Error) => void;
  fallbackToLegacy?: boolean;
  [key: string]: any;
}

interface LoadState {
  status: 'loading' | 'success' | 'error' | 'fallback';
  error?: Error;
  loadTime?: number;
  variant: string;
}

const CollectionOpportunitiesLoader: React.FC<LoaderProps> = ({
  variant,
  onLoadError,
  fallbackToLegacy = true,
  ...props
}) => {
  const [loadState, setLoadState] = useState<LoadState>({
    status: 'loading',
    variant: variant || featureFlags.getVariant()
  });

  const enableVirtualized = useFeatureFlag('ENABLE_VIRTUALIZED_TABLE');
  const enableFallback = useFeatureFlag('ENABLE_FALLBACK_UI');

  useEffect(() => {
    const startTime = performance.now();

    // Simulate component loading with timeout
    const loadTimeout = setTimeout(() => {
      if (loadState.status === 'loading') {
        setLoadState({
          status: 'error',
          error: new Error('Component load timeout'),
          variant: loadState.variant
        });
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(loadTimeout);
  }, []);

  const handleLoadSuccess = () => {
    const loadTime = performance.now();
    trackTableLoad(loadTime, loadState.variant === 'legacy');
    
    setLoadState(prev => ({
      ...prev,
      status: 'success',
      loadTime
    }));
  };

  const handleLoadError = (error: Error) => {
    trackImportError(error);
    onLoadError?.(error);

    if (fallbackToLegacy && loadState.variant !== 'legacy') {
      setLoadState({
        status: 'fallback',
        error,
        variant: 'legacy'
      });
    } else {
      setLoadState(prev => ({
        ...prev,
        status: 'error',
        error
      }));
    }
  };

  const LoadingFallback = () => (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <Spinner size={50} />
      <p style={{ marginTop: '20px', color: '#5C7080' }}>
        Loading Collection Opportunities...
      </p>
    </div>
  );

  const ErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
    <NonIdealState
      icon={IconNames.ERROR}
      title="Failed to Load Component"
      description={
        <div>
          <p>{error.message}</p>
          {enableFallback && (
            <Callout intent={Intent.WARNING} style={{ marginTop: '20px' }}>
              Using simplified version with reduced functionality
            </Callout>
          )}
        </div>
      }
      action={
        <Button
          intent="primary"
          icon={IconNames.REFRESH}
          onClick={retry}
        >
          Retry
        </Button>
      }
    />
  );

  const CurrentComponent = componentLoaders[loadState.variant] || componentLoaders.legacy;

  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          error={loadState.error || new Error('Unknown error')}
          retry={() => setLoadState({ status: 'loading', variant: 'legacy' })}
        />
      }
      onError={handleLoadError}
    >
      <Suspense fallback={<LoadingFallback />}>
        <div onLoad={handleLoadSuccess}>
          <CurrentComponent {...props} />
          
          {loadState.status === 'fallback' && (
            <Callout
              intent={Intent.WARNING}
              icon={IconNames.INFO_SIGN}
              style={{ marginBottom: '10px' }}
            >
              Using legacy table due to loading issues. Some features may be limited.
            </Callout>
          )}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default CollectionOpportunitiesLoader;

// Preload critical components
export const preloadCriticalComponents = async () => {
  try {
    await Promise.all([
      import('./CollectionOpportunities'),
      import('./ErrorBoundary')
    ]);
  } catch (error) {
    console.error('Failed to preload critical components:', error);
  }
};