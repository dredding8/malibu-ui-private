# Collection Management Migration Guide

**Phase 3: State Migration** - Comprehensive guide for migrating from React Context to Zustand store with zero downtime and performance improvements.

## Overview

This migration consolidates 3 overlapping collection contexts into a unified Zustand store:

- **CollectionProvider** (Context) → **UnifiedCollectionProvider** (Zustand + Context)
- **AllocationContext** (Context) → **Unified Store Slice** (Future)
- **WizardSyncContext** (Context) → **Unified Store Slice** (Future)

## Migration Strategy

### Phase 3 Focus: Collection Context Migration

**Objective**: Seamless migration from CollectionProvider to UnifiedCollectionProvider with:
- Zero downtime
- Performance improvements
- Backward compatibility
- Real-time monitoring
- Rollback capability

## Quick Start

### 1. Simple Migration (Recommended)

Replace your existing CollectionProvider:

```tsx
// Before (Legacy)
import { CollectionProvider } from './components/Collection/CollectionProvider';

<CollectionProvider collections={collections}>
  <YourComponent />
</CollectionProvider>

// After (Migrated)
import { UnifiedCollectionProvider } from './components/Collection/providers/UnifiedCollectionProvider';

<UnifiedCollectionProvider 
  collections={collections}
  config={{
    strategy: 'hybrid',
    enableSync: true,
    enableMonitoring: true,
  }}
>
  <YourComponent />
</UnifiedCollectionProvider>
```

### 2. Gradual Migration with Bridge

Use the bridge hook for gradual migration:

```tsx
import { useCollectionBridge } from './migration/state/useCollectionBridge';

const YourComponent = () => {
  const { state, actions } = useCollectionBridge({
    preferredSource: 'auto',
    enableFallback: true,
    enableMonitoring: true,
  });

  return (
    <div>
      <p>Collections: {state.collections.length}</p>
      <p>Using: {state.source}</p>
      <button onClick={() => actions.switchSource('store')}>
        Switch to Store
      </button>
    </div>
  );
};
```

### 3. HOC Enhancement

Enhance existing components without changing their code:

```tsx
import { withCollectionState } from './migration/state/withCollectionState';

const EnhancedComponent = withCollectionState(YourExistingComponent, {
  useStore: true,
  enableFallback: true,
  enableMonitoring: true,
});
```

## Migration Components

### UnifiedCollectionProvider

The new provider that supports multiple strategies:

```tsx
interface UnifiedProviderConfig {
  strategy: 'context-only' | 'store-only' | 'hybrid' | 'auto';
  enableSync: boolean;
  enableMonitoring: boolean;
  featureFlags: {
    useZustandStore: boolean;
    enableOptimizations: boolean;
    enableCaching: boolean;
    enableRealtime: boolean;
  };
}
```

**Strategies**:
- **context-only**: Uses original CollectionProvider (no migration)
- **store-only**: Uses Zustand store exclusively
- **hybrid**: Uses both with automatic fallback
- **auto**: Automatically selects best option

### Bridge Hook (useCollectionBridge)

Provides unified interface that works with both Context and Store:

```tsx
const { state, actions, config, isReady } = useCollectionBridge({
  preferredSource: 'auto', // 'context' | 'store' | 'auto'
  enableFallback: true,
  enableMonitoring: true,
  enableSync: true,
});

// State contains unified interface
const {
  collections,
  loading,
  error,
  source, // Current source: 'context' | 'store'
  metrics, // Performance metrics
} = state;

// Actions work regardless of source
const {
  create,
  update,
  delete,
  select,
  switchSource, // Switch between context/store
  syncState, // Synchronize state
} = actions;
```

### HOC (withCollectionState)

Higher-Order Component for existing components:

```tsx
interface InjectedCollectionProps {
  collectionState: CollectionContextValue;
  migrationConfig?: CollectionStateConfig;
  performanceMetrics?: PerformanceMetrics;
}

const withCollectionState = (Component, config) => {
  // Returns enhanced component with migration capabilities
};
```

## Performance Monitoring

### Built-in Performance Tracking

```tsx
import { performanceValidator } from './migration/performance/PerformanceValidator';

// Run performance comparison
const report = await performanceValidator.runValidation(
  contextImplementation,
  storeImplementation,
  10 // iterations
);

console.log('Performance Report:', report);
```

### Migration Monitor Component

Real-time monitoring dashboard:

```tsx
import { MigrationMonitor } from './components/Collection/providers/MigrationMonitor';

<MigrationMonitor
  showDetails={true}
  enableRealtime={true}
  position="top-right"
  compact={false}
/>
```

### Performance Metrics

The system tracks:
- **Render Time**: Component rendering performance
- **Memory Usage**: JavaScript heap usage
- **State Access Time**: Time to access state data
- **Action Execution Time**: Time to execute actions
- **Sync Time**: Context/Store synchronization time

## Migration Strategies

### Strategy 1: Big Bang Migration (Fastest)

Replace all CollectionProviders at once:

```tsx
// 1. Replace imports
- import { CollectionProvider } from './components/Collection/CollectionProvider';
+ import { UnifiedCollectionProvider } from './components/Collection/providers/UnifiedCollectionProvider';

// 2. Update configuration
<UnifiedCollectionProvider
  collections={collections}
  config={{ strategy: 'store-only' }}
>
  <App />
</UnifiedCollectionProvider>
```

**Pros**: Fast, clean, immediate benefits
**Cons**: Higher risk, requires thorough testing

### Strategy 2: Gradual Migration (Safest)

Migrate components one by one:

```tsx
// Phase 1: Enable hybrid mode
<UnifiedCollectionProvider config={{ strategy: 'hybrid' }}>
  <App />
</UnifiedCollectionProvider>

// Phase 2: Migrate individual components using bridge
const ComponentA = () => {
  const { state, actions } = useCollectionBridge({
    preferredSource: 'store',
    enableFallback: true,
  });
  // Component uses store but falls back to context
};

// Phase 3: Switch to store-only when all components migrated
<UnifiedCollectionProvider config={{ strategy: 'store-only' }}>
  <App />
</UnifiedCollectionProvider>
```

**Pros**: Lower risk, can rollback individual components
**Cons**: Longer migration period

### Strategy 3: A/B Testing Migration

Test migration with feature flags:

```tsx
const MigrationWrapper = ({ children }) => {
  const useNewProvider = useFeatureFlag('collection-zustand-migration');
  
  if (useNewProvider) {
    return (
      <UnifiedCollectionProvider config={{ strategy: 'store-only' }}>
        {children}
      </UnifiedCollectionProvider>
    );
  }
  
  return (
    <CollectionProvider>
      {children}
    </CollectionProvider>
  );
};
```

**Pros**: Can test in production, gradual rollout
**Cons**: Requires feature flag system

## Backward Compatibility

### LegacyContextWrapper

Provides deprecation warnings and migration assistance:

```tsx
import { LegacyCollectionProvider } from './components/Collection/providers/LegacyContextWrapper';

<LegacyCollectionProvider
  enableMigration={true} // Auto-migrate when recommended
  deprecationConfig={{
    showWarnings: true,
    migrationDeadline: new Date('2024-03-01'),
  }}
  componentName="MyComponent"
>
  <YourLegacyComponent />
</LegacyCollectionProvider>
```

### Migration Assistance

The wrapper provides:
- **Deprecation warnings** with migration guidance
- **Automatic migration** when usage is high
- **Performance tracking** to show migration benefits
- **Migration metrics** for planning

## State Synchronization

### Bidirectional Sync

Keep Context and Store in sync during migration:

```tsx
import { stateSyncManager } from './migration/state/stateSync';

// Manual sync
await stateSyncManager.syncContextToStore(contextValue, storeState, 'collection');

// Automatic sync (enabled by default in hybrid mode)
<UnifiedCollectionProvider 
  config={{ 
    strategy: 'hybrid',
    enableSync: true,
    syncInterval: 5000, // 5 seconds
  }}
>
```

### Conflict Resolution

When Context and Store have different values:

```tsx
stateSyncManager.registerConflictHandler('collection', 'selectedIds', (conflict) => {
  // Custom resolution logic
  if (conflict.contextValue.size > conflict.storeValue.size) {
    return 'use-context';
  }
  return 'use-store';
});
```

## Error Handling & Rollback

### Automatic Fallback

```tsx
const { state, actions } = useCollectionBridge({
  preferredSource: 'store',
  enableFallback: true, // Falls back to context on store errors
  errorStrategy: 'fallback', // 'throw' | 'fallback' | 'return-error'
});
```

### Manual Rollback

```tsx
const { migration } = useUnifiedCollection();

// Switch back to context
await migration.switchToContext();

// Or use bridge
await actions.switchSource('context');
```

### Error Monitoring

```tsx
const monitor = useMigrationMonitor();

// Track errors
monitor.logError('Store initialization failed', 'critical', 'ComponentName');

// View error history
console.log(monitor.metrics.errors);
```

## Testing Migration

### Unit Tests

```tsx
import { render } from '@testing-library/react';
import { UnifiedCollectionProvider } from './providers/UnifiedCollectionProvider';

test('migrated component renders correctly', () => {
  render(
    <UnifiedCollectionProvider config={{ strategy: 'store-only' }}>
      <YourComponent />
    </UnifiedCollectionProvider>
  );
  
  // Test component behavior
});
```

### Performance Tests

```tsx
import { performanceValidator } from './migration/performance/PerformanceValidator';

test('store performance is better than context', async () => {
  const report = await performanceValidator.runValidation(
    contextTest,
    storeTest,
    5
  );
  
  expect(report.summary.improved).toBeGreaterThan(0);
  expect(report.summary.overallScore).toBeGreaterThan(70);
});
```

### Integration Tests

```tsx
test('hybrid mode works correctly', async () => {
  const { result } = renderHook(() => useCollectionBridge({
    preferredSource: 'auto',
    enableFallback: true,
  }));
  
  // Test source switching
  await act(async () => {
    await result.current.actions.switchSource('store');
  });
  
  expect(result.current.state.source).toBe('store');
});
```

## Migration Checklist

### Pre-Migration

- [ ] Review current Context usage with `MigrationStatusDashboard`
- [ ] Set up performance monitoring
- [ ] Create rollback plan
- [ ] Test in development environment
- [ ] Review component dependencies

### During Migration

- [ ] Enable `MigrationMonitor` for real-time tracking
- [ ] Monitor performance metrics
- [ ] Watch for error rates
- [ ] Test key user workflows
- [ ] Validate data consistency

### Post-Migration

- [ ] Verify performance improvements
- [ ] Remove legacy Context providers
- [ ] Update documentation
- [ ] Monitor production metrics
- [ ] Clean up migration utilities

## Performance Benefits

Expected improvements:

- **Render Time**: 20-40% faster re-renders
- **Memory Usage**: 15-30% reduction
- **Bundle Size**: 5-10% reduction (with tree shaking)
- **Developer Experience**: Better debugging, devtools support

## Troubleshooting

### Common Issues

**1. State Synchronization Conflicts**
```
Error: Context and store have conflicting state
Solution: Configure conflict resolution or use manual sync
```

**2. Performance Regression**
```
Error: Store performance worse than context
Solution: Check for unnecessary re-renders, optimize selectors
```

**3. Missing Context Provider**
```
Error: useCollectionContext must be used within provider
Solution: Ensure UnifiedCollectionProvider wraps components
```

### Debug Tools

```tsx
// Enable debug logging
window.COLLECTION_MIGRATION_DEBUG = true;

// Access migration metrics
console.log(window.__COLLECTION_MIGRATION_METRICS__);

// Force migration state
window.__FORCE_COLLECTION_STORE__ = true;
```

## Advanced Configuration

### Custom Performance Benchmarks

```tsx
import { PerformanceValidator } from './migration/performance/PerformanceValidator';

const customBenchmarks = [
  {
    id: 'custom-render',
    name: 'Custom Component Render',
    target: 10, // 10ms
    threshold: 5,
    unit: 'ms',
    category: 'render',
  },
];

const validator = new PerformanceValidator(customBenchmarks);
```

### Custom State Mapping

```tsx
import { contextToStoreMapper } from './migration/state/contextMigrationMap';

// Register custom mapping
contextToStoreMapper.registerMapping('customField', (contextValue, storeValue) => {
  // Custom mapping logic
  return mappedValue;
});
```

## Support

### Migration Support

- **Documentation**: This guide and inline code comments
- **Examples**: See `MigratedCollectionExample.tsx`
- **Monitoring**: Use `MigrationMonitor` and `MigrationStatusDashboard`
- **Performance**: Use `PerformanceValidator` for testing

### Getting Help

1. Check the migration monitor for real-time status
2. Review performance reports for optimization hints
3. Use debug tools for troubleshooting
4. Consult example implementations
5. Check component migration status in dashboard

## Future Roadmap

### Phase 4: Legacy Cleanup (Planned)
- Remove deprecated Context providers
- Clean up migration utilities
- Optimize bundle size
- Complete documentation

### Phase 5: Advanced Features (Future)
- Real-time collaboration
- Offline support
- Advanced caching strategies
- Performance optimizations

---

**Migration Status**: Phase 3 Complete - Ready for Component Migration
**Next Steps**: Start migrating high-impact components using provided tools