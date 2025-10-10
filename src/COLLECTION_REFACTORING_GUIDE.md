# Collection Management Refactoring Guide

## Overview

This guide documents the comprehensive refactoring of the collection management system, introducing a centralized service layer, improved utility functions, and enhanced store integration.

## Architecture Changes

### Before
```
Components → Store → Direct API calls
           → Inline logic & validation
           → Scattered utilities
```

### After
```
Components → Store → CollectionService → API
           → CollectionHelpers (utilities)
           → Centralized validation
           → Performance monitoring
           → Real-time updates
```

## New File Structure

```
src/
├── services/
│   ├── collectionService.ts         # Centralized service layer
│   └── __tests__/
│       └── collectionService.test.ts
├── utils/
│   ├── collectionHelpers.ts         # Utility functions
│   └── __tests__/
│       └── collectionHelpers.test.ts
├── store/
│   └── collectionStore.ts            # Refactored to use services
└── components/
    └── Collection/                   # Components to be updated
```

## Migration Steps

### 1. Update Component Imports

**Before:**
```typescript
import { useCollectionStore } from '../store/collectionStore';
import { Collection } from '../types/collection.types';

// Direct store manipulation
const collections = useCollectionStore(state => state.collections.collections);
const loading = useCollectionStore(state => state.collections.loading);
```

**After:**
```typescript
import { useFilteredCollections, useCollectionsLoading } from '../store/collectionStore';
import { calculateCollectionHealth, isCollectionActive } from '../utils/collectionHelpers';
import { Collection } from '../types/collection.types';

// Use specialized hooks
const collections = useFilteredCollections();
const loading = useCollectionsLoading();
```

### 2. Use Helper Functions

**Before:**
```typescript
// Manual health calculation
const getHealth = (collection) => {
  const capacity = collection.metadata?.capacity;
  if (!capacity) return 'unknown';
  const utilization = capacity.used / capacity.total;
  if (utilization > 0.9) return 'critical';
  if (utilization > 0.8) return 'warning';
  return 'healthy';
};
```

**After:**
```typescript
import { calculateCollectionHealth } from '../utils/collectionHelpers';

// Use centralized helper
const health = calculateCollectionHealth(collection);
// Returns: { status: 'healthy' | 'warning' | 'critical', score: number, factors: {...} }
```

### 3. Update CRUD Operations

**Before:**
```typescript
const handleCreate = async (data) => {
  try {
    setState({ loading: true });
    const response = await fetch('/api/collections', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const created = await response.json();
    // Manual store update
    setState({ loading: false });
  } catch (error) {
    setState({ error: error.message });
  }
};
```

**After:**
```typescript
const { createCollection } = useCollectionStore();

const handleCreate = async (data) => {
  try {
    // Validation and API call handled by service
    const created = await createCollection(data);
    // Store automatically updated with optimistic updates
    // Real-time notifications automatically sent
  } catch (error) {
    // Error handling integrated
  }
};
```

### 4. Use New Hooks

```typescript
// Collection-specific hook with all operations
import { useCollection } from '../hooks/collections/useCollection';

const {
  collection,
  loading,
  error,
  update,
  delete: deleteCollection,
  validate,
  toggleSelection,
  health
} = useCollection(collectionId, {
  subscribeToUpdates: true,
  validateOnChange: true
});

// Search functionality
import { useCollectionSearch } from '../store/collectionStore';

const { searchResults, isSearching, search } = useCollectionSearch();

// Statistics
import { useCollectionStatistics } from '../store/collectionStore';

const stats = useCollectionStatistics();
// Returns summary with counts, health distribution, etc.
```

### 5. Implement Bulk Operations

```typescript
const { startBulkOperation, getBulkOperationProgress } = useCollectionStore();

const handleBulkUpdate = async () => {
  const operationId = await startBulkOperation({
    type: 'update',
    targets: selectedIds,
    params: { status: 'active' }
  });
  
  // Progress automatically tracked in store
  const progress = getBulkOperationProgress(operationId);
};
```

### 6. Export Functions

```typescript
import { collectionsToCSV, collectionsToExportJSON } from '../utils/collectionHelpers';

const handleExportCSV = () => {
  const csv = collectionsToCSV(collections);
  downloadFile(csv, 'collections.csv', 'text/csv');
};

const handleExportJSON = () => {
  const data = collectionsToExportJSON(collections);
  downloadFile(JSON.stringify(data), 'collections.json', 'application/json');
};
```

## Performance Improvements

### 1. Caching
- Service layer implements intelligent caching
- Cache invalidation on mutations
- Configurable TTL

### 2. Batch Operations
- Configurable batch size
- Progress tracking
- Cancellable operations

### 3. Client-side Filtering
- Filters applied locally when possible
- Reduces API calls
- Instant UI updates

### 4. Performance Monitoring
```typescript
const { measureRender, measureFetch } = usePerformanceMonitor();

// Track render performance
measureRender(() => {
  renderComplexComponent();
});

// Track fetch performance
const data = await measureFetch(() => 
  collectionService.fetchCollections()
);
```

## Component Examples

### CollectionList Component
```typescript
import React from 'react';
import { useFilteredCollections, useCollectionsLoading } from '../../store/collectionStore';
import { calculateCollectionHealth } from '../../utils/collectionHelpers';

export const CollectionList: React.FC = () => {
  const collections = useFilteredCollections();
  const loading = useCollectionsLoading();
  
  if (loading.collections) {
    return <Spinner />;
  }
  
  return (
    <div className="collection-list">
      {collections.map(collection => {
        const health = calculateCollectionHealth(collection);
        
        return (
          <CollectionCard
            key={collection.id}
            collection={collection}
            health={health}
          />
        );
      })}
    </div>
  );
};
```

### CollectionForm Component
```typescript
import React, { useState } from 'react';
import { useCollectionStore } from '../../store/collectionStore';
import { validateCollectionName, validateCollectionDates } from '../../utils/collectionHelpers';

export const CollectionForm: React.FC = () => {
  const { createCollection } = useCollectionStore();
  const [formData, setFormData] = useState({
    name: '',
    type: 'standard',
    startDate: '',
    endDate: ''
  });
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate using helpers
    const nameValidation = validateCollectionName(formData.name);
    const dateValidation = validateCollectionDates(formData.startDate, formData.endDate);
    
    if (!nameValidation.isValid || !dateValidation.isValid) {
      setErrors({
        name: nameValidation.errors,
        dates: dateValidation.errors
      });
      return;
    }
    
    try {
      await createCollection(formData);
      // Success handled automatically with notifications
    } catch (error) {
      // Error handling
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

## Testing

### Service Testing
```typescript
import { collectionService } from '../services/collectionService';

describe('CollectionService', () => {
  it('should fetch collections with caching', async () => {
    // First call - hits API
    const result1 = await collectionService.fetchCollections();
    
    // Second call - returns from cache
    const result2 = await collectionService.fetchCollections();
    
    expect(result1).toEqual(result2);
  });
});
```

### Helper Testing
```typescript
import { calculateCollectionHealth } from '../utils/collectionHelpers';

describe('collectionHelpers', () => {
  it('should calculate health status correctly', () => {
    const collection = {
      metadata: {
        capacity: { used: 95, total: 100 },
        conflicts: 10
      }
    };
    
    const health = calculateCollectionHealth(collection);
    expect(health.status).toBe('critical');
  });
});
```

## Best Practices

### 1. Use Specialized Hooks
Instead of accessing the store directly, use the provided hooks:
- `useCollection()` for single collection
- `useFilteredCollections()` for lists
- `useCollectionHealth()` for health status
- `useActiveCollections()` for active-only

### 2. Leverage Helpers
Don't reimplement common logic:
- Health calculations
- Filtering/sorting
- Validation
- Export formatting

### 3. Handle Loading States
All async operations have loading states:
```typescript
const { loading } = useCollectionsLoading();

if (loading.collections) return <Spinner />;
if (loading.creating) return <CreatingIndicator />;
if (loading.bulk) return <BulkOperationProgress />;
```

### 4. Error Handling
Errors are centralized in the store:
```typescript
const { errors } = useCollectionsErrors();

if (errors.global.length > 0) {
  return <ErrorBoundary errors={errors.global} />;
}
```

### 5. Performance Optimization
- Use `React.memo` for collection components
- Implement virtualization for large lists
- Use the performance monitoring hooks
- Enable caching for read operations

## Rollback Plan

If issues arise:

1. **Service Layer**: Can be bypassed by reverting store to direct API calls
2. **Helpers**: Components can temporarily use inline logic
3. **Store Changes**: Previous store version is backward compatible

## Timeline

1. **Phase 1**: Service & helpers implementation ✅
2. **Phase 2**: Store integration ✅
3. **Phase 3**: Component migration (current)
4. **Phase 4**: Performance validation
5. **Phase 5**: Monitoring & optimization

## Support

For questions or issues:
- Check test files for usage examples
- Review TypeScript interfaces for API details
- Use performance monitoring to identify bottlenecks