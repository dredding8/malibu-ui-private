# JTBD Gap Resolution Implementation Plan

## Executive Summary

Based on comprehensive analysis from Architecture, UX, and Business perspectives, this plan outlines the technical implementation strategy to address critical gaps in the Collection Opportunities Hub for supporting the 4 Jobs To Be Done.

## Phase 1: Critical Fixes (Sprint 1-3)

### Sprint 1: Emergency Fixes & Override Foundation

#### 1.1 Fix VirtualizedOpportunitiesTable Import
```typescript
// Fix missing import in CollectionOpportunitiesHub.tsx
import VirtualizedOpportunitiesTable from './components/VirtualizedOpportunitiesTable';
```

#### 1.2 Add Override Justification to CollectionOpportunity Type
```typescript
// Update types/collectionOpportunities.ts
export interface CollectionOpportunity {
  // ... existing fields
  
  // Override tracking
  overrideStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  overrideJustification?: string;
  overrideAuthor?: string;
  overrideTimestamp?: string;
  overrideAlternatives?: AlternativeMatch[];
}
```

#### 1.3 Create Inline Override Component
```typescript
// New component: components/InlineOverride.tsx
interface InlineOverrideProps {
  opportunity: CollectionOpportunity;
  onOverride: (justification: string) => void;
  alternatives: AlternativeMatch[];
}

export const InlineOverride: React.FC<InlineOverrideProps> = ({
  opportunity,
  onOverride,
  alternatives
}) => {
  return (
    <div className="inline-override">
      <Button icon="edit" intent="warning" small>
        Override Allocation
      </Button>
      {/* Popover with justification field */}
    </div>
  );
};
```

### Sprint 2: Pass Information Display

#### 2.1 Connect Pass Data to Opportunities
```typescript
// Update CollectionOpportunity interface
export interface CollectionOpportunity {
  // ... existing fields
  passes?: PassAllocation[]; // NEW: Link to actual pass data
}

export interface PassAllocation {
  pass: Pass;
  site: Site;
  matchQuality: number;
  constraints: TemporalConstraint[];
}

export interface TemporalConstraint {
  type: 'visibility' | 'capacity' | 'priority';
  startTime: Date;
  endTime: Date;
  description: string;
}
```

#### 2.2 Create Pass Details Component
```tsx
// components/PassDetailsPanel.tsx
export const PassDetailsPanel: React.FC<{opportunity: CollectionOpportunity}> = ({
  opportunity
}) => {
  return (
    <div className="pass-details-panel">
      <h3>Collection Windows</h3>
      {opportunity.passes?.map(allocation => (
        <PassTimeWindow 
          key={allocation.pass.id}
          pass={allocation.pass}
          site={allocation.site}
        />
      ))}
    </div>
  );
};
```

### Sprint 3: Data Integrity Error Handling

#### 3.1 Add Data Integrity Types
```typescript
export interface DataIntegrityIssue {
  type: 'NO_TLE' | 'STALE_EPHEMERIS' | 'SITE_OFFLINE' | 'SENSOR_FAILURE';
  satelliteId: string;
  severity: 'critical' | 'warning' | 'info';
  lastKnownGood?: Date;
  escalationPath: string[];
  workarounds: WorkaroundOption[];
}

export interface WorkaroundOption {
  id: string;
  description: string;
  impact: string;
  action: () => Promise<void>;
}
```

#### 3.2 Create Data Error Component
```tsx
// components/DataIntegrityAlert.tsx
export const DataIntegrityAlert: React.FC<{issue: DataIntegrityIssue}> = ({
  issue
}) => {
  return (
    <Callout intent="danger" icon="error">
      <h4>{issue.type}: {issue.satelliteId}</h4>
      <p>Last Known Good: {issue.lastKnownGood}</p>
      <ButtonGroup>
        <Button intent="primary" onClick={escalate}>
          Escalate to Ops
        </Button>
        <Button onClick={retry}>Retry Update</Button>
      </ButtonGroup>
    </Callout>
  );
};
```

## Phase 2: Core Features (Sprint 4-6)

### Sprint 4-5: Smart Views & Filtering

#### 4.1 Implement View Presets
```typescript
export interface ViewPreset {
  id: string;
  name: string;
  icon: string;
  filter: (opportunity: CollectionOpportunity) => boolean;
  sort?: SortConfig;
  columns?: string[];
}

export const DEFAULT_VIEW_PRESETS: ViewPreset[] = [
  {
    id: 'my-sensors',
    name: 'My Sensors',
    icon: 'satellite',
    filter: (opp) => userSensors.includes(opp.satellite.id)
  },
  {
    id: 'needs-review',
    name: 'Needs Review',
    icon: 'warning-sign',
    filter: (opp) => opp.matchStatus === 'suboptimal' || opp.overrideStatus === 'pending'
  },
  {
    id: 'critical-issues',
    name: 'Critical Issues',
    icon: 'error',
    filter: (opp) => opp.status === 'critical' || opp.dataIntegrityIssues?.length > 0
  }
];
```

#### 4.2 Create Smart View Selector
```tsx
// components/SmartViewSelector.tsx
export const SmartViewSelector: React.FC = () => {
  const [customViews, setCustomViews] = useLocalStorage('customViews', []);
  
  return (
    <ButtonGroup>
      {DEFAULT_VIEW_PRESETS.map(preset => (
        <ViewPresetButton key={preset.id} preset={preset} />
      ))}
      <Popover content={<CustomViewBuilder />}>
        <Button icon="plus">Custom View</Button>
      </Popover>
    </ButtonGroup>
  );
};
```

### Sprint 6: Integration & Performance

#### 6.1 Implement Service Layer
```typescript
// services/CollectionOpportunitiesService.ts
export class CollectionOpportunitiesService {
  async getOpportunities(filter?: FilterConfig): Promise<CollectionOpportunity[]> {
    // Real API implementation
    const response = await api.get('/opportunities', { params: filter });
    return response.data;
  }
  
  async updateOpportunity(
    id: string, 
    changes: Partial<CollectionOpportunity>
  ): Promise<void> {
    await api.patch(`/opportunities/${id}`, changes);
  }
  
  async overrideAllocation(
    id: string,
    override: OverrideRequest
  ): Promise<OverrideResponse> {
    return api.post(`/opportunities/${id}/override`, override);
  }
}
```

## Phase 3: Architecture Consolidation (Sprint 7-10)

### Component Consolidation Strategy

#### Step 1: Create Unified Component
```tsx
// components/CollectionOpportunitiesUnified.tsx
export interface CollectionOpportunitiesUnifiedProps {
  variant?: 'table' | 'cards' | 'bento';
  features?: {
    virtualization?: boolean;
    realTimeUpdates?: boolean;
    advancedFiltering?: boolean;
    bulkOperations?: boolean;
  };
}

export const CollectionOpportunitiesUnified: React.FC<CollectionOpportunitiesUnifiedProps> = ({
  variant = 'table',
  features = {}
}) => {
  // Unified implementation replacing 13 variants
};
```

#### Step 2: Migrate Feature Flags
```typescript
// From multiple components to single configuration
const FEATURE_MIGRATION_MAP = {
  'CollectionOpportunitiesLegacy': { variant: 'table', features: {} },
  'CollectionOpportunitiesEnhanced': { variant: 'table', features: { advancedFiltering: true } },
  'CollectionOpportunitiesBento': { variant: 'bento', features: { realTimeUpdates: true } },
  // ... map all 13 variants
};
```

## Technical Implementation Details

### API Contract Specifications
```typescript
// API endpoints needed
interface CollectionOpportunitiesAPI {
  // Opportunities
  GET    /api/opportunities
  GET    /api/opportunities/:id
  PATCH  /api/opportunities/:id
  POST   /api/opportunities/:id/override
  
  // Passes
  GET    /api/opportunities/:id/passes
  GET    /api/passes/:id
  
  // Data Integrity
  GET    /api/satellites/:id/tle-status
  POST   /api/satellites/:id/request-tle-update
  POST   /api/issues/:id/escalate
  
  // Views
  GET    /api/users/:id/saved-views
  POST   /api/users/:id/saved-views
  DELETE /api/users/:id/saved-views/:viewId
}
```

### State Management Improvements
```typescript
// Split monolithic context
interface OpportunityDataContext {
  opportunities: CollectionOpportunity[];
  updateOpportunity: (id: string, changes: Partial<CollectionOpportunity>) => void;
}

interface OpportunityUIContext {
  selectedIds: Set<string>;
  activeView: ViewPreset;
  filters: FilterConfig;
}

interface OpportunityRealtimeContext {
  subscriptions: Map<string, Subscription>;
  updates: Map<string, Update>;
}
```

### Performance Optimizations
```typescript
// Virtual scrolling for all table views
import { VariableSizeList } from 'react-window';

// Memoization for expensive calculations
const memoizedHealthScores = useMemo(
  () => calculateBatchHealth(opportunities, thresholds),
  [opportunities, thresholds]
);

// Debounced filtering
const debouncedFilter = useDebouncedCallback(
  (value) => setFilter(value),
  300
);
```

## Success Metrics

### Technical Metrics
- Component count: 32 → 8 (75% reduction)
- Bundle size: <500KB initial load
- Response time: <300ms for all operations
- Test coverage: >85%

### Business Metrics
- JTBD completion rate: >95%
- Override documentation rate: 95%
- Error resolution time: <3 minutes
- User satisfaction: 8.5/10

## Risk Mitigation

1. **Backward Compatibility**: Feature flag migration map
2. **Data Migration**: Incremental rollout with fallbacks
3. **Performance**: Progressive loading with virtualization
4. **User Adoption**: In-app tutorials and tooltips

## Implementation Timeline

- **Week 1-2**: Critical fixes (Sprint 1)
- **Week 3-4**: Pass information (Sprint 2)
- **Week 5-6**: Error handling (Sprint 3)
- **Week 7-10**: Smart views (Sprint 4-5)
- **Week 11-12**: Integration (Sprint 6)
- **Week 13-20**: Architecture consolidation

Total: 20 weeks to full implementation