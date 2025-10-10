import React, { Suspense, lazy, useState } from 'react';
import { Spinner, Callout, Intent, Button } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import ErrorBoundary from './ErrorBoundary';
import { CollectionOpportunity, OpportunityChange } from '../types/collectionOpportunities';

// Lazy load main component with fallback
const CollectionOpportunities = lazy(() => import('./CollectionOpportunities'));

interface UnifiedProps {
  opportunities: CollectionOpportunity[];
  onBatchUpdate: (changes: OpportunityChange[]) => Promise<void>;
  variant?: 'table' | 'cards' | 'split';
  density?: 'compact' | 'comfortable' | 'spacious';
  enableVirtualScroll?: boolean;
}

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="collection-loading">
    <Spinner size={50} />
    <p style={{ marginTop: '20px', color: '#5C7080' }}>
      Loading opportunities...
    </p>
  </div>
);

// Error fallback UI
const ErrorFallback = ({ error, retry }: { error?: Error; retry: () => void }) => (
  <Callout intent={Intent.DANGER} icon={IconNames.ERROR}>
    <h4>Unable to load collection opportunities</h4>
    <p>{error?.message || 'An unexpected error occurred'}</p>
    <Button 
      intent="primary" 
      icon={IconNames.REFRESH} 
      onClick={retry}
      style={{ marginTop: '10px' }}
    >
      Try Again
    </Button>
  </Callout>
);

export const UnifiedCollectionOpportunities: React.FC<UnifiedProps> = ({
  opportunities,
  onBatchUpdate,
  variant = 'table',
  density = 'comfortable',
  enableVirtualScroll = opportunities.length > 100,
}) => {
  const [errorKey, setErrorKey] = useState(0);

  // User preferences (would come from context/storage in real app)
  const userPrefs = {
    variant,
    density,
    features: {
      virtualScroll: enableVirtualScroll,
      bulkEdit: true,
      advancedFilters: false, // YAGNI
    }
  };

  return (
    <ErrorBoundary 
      key={errorKey}
      fallback={
        <ErrorFallback 
          retry={() => setErrorKey(k => k + 1)} 
        />
      }
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <div className={`collection-wrapper density-${density}`}>
          <CollectionOpportunities
            opportunities={opportunities}
            onBatchUpdate={onBatchUpdate}
            capacityThresholds={{
              critical: 10,
              warning: 30,
              optimal: 70,
            }}
            enableRealTimeValidation={true}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

// Styles for density variants
const densityStyles = `
.density-compact {
  --row-height: 32px;
  --cell-padding: 4px 8px;
  --font-size: 13px;
}

.density-comfortable {
  --row-height: 40px;
  --cell-padding: 8px 12px;
  --font-size: 14px;
}

.density-spacious {
  --row-height: 48px;
  --cell-padding: 12px 16px;
  --font-size: 15px;
}

.collection-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.collection-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* Apply density to table */
.collection-wrapper .bp5-table-cell,
.collection-wrapper .bp4-table-cell {
  padding: var(--cell-padding);
  font-size: var(--font-size);
}

.collection-wrapper .bp5-table-row-wrapper,
.collection-wrapper .bp4-table-row-wrapper {
  height: var(--row-height);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = densityStyles;
  document.head.appendChild(styleEl);
}

export default UnifiedCollectionOpportunities;