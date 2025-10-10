# Feature Flag Cleanup - Wave 5

**Goal**: Reduce 9 flags → 4 flags with clear lifecycle policy
**Impact**: Reduced code complexity, fewer untested combinations

---

## 📊 Current Feature Flags (9)

### Business Flags (Keep - 2)
```typescript
✅ progressiveComplexityUI: boolean
   Purpose: Enable advanced UI features for power users
   Type: Business Feature
   Status: Permanent
   Usage: High (30%+ of users)

✅ enableWorkspaceMode: boolean
   Purpose: Reallocation workspace for complex operations
   Type: Business Feature
   Status: Permanent
   Usage: Medium (15%+ of users)
```

### Technical Debt Flags (Remove - 5)
```typescript
❌ ENABLE_NEW_COLLECTION_SYSTEM: boolean
   Purpose: Gradual migration to new Collection component
   Type: Technical Migration
   Created: 2024-09-01
   Expires: 2025-01-15
   Status: REMOVE after Wave 2 complete
   Cleanup: Delete flag + legacy components

❌ useRefactoredComponents: boolean
   Purpose: Toggle refactored component versions
   Type: Technical Migration
   Created: 2024-09-15
   Status: REMOVE (refactored is now default)
   Cleanup: Delete flag + make refactored version default

❌ enableBentoLayout: boolean
   Purpose: Enable bento grid layout option
   Type: Technical Migration
   Created: 2024-09-20
   Status: MERGE into progressiveComplexityUI
   Cleanup: Migrate to layout option within progressiveComplexityUI

❌ enableEnhancedBento: boolean
   Purpose: Enhanced bento features
   Type: Technical Migration
   Status: MERGE into enableBentoLayout
   Cleanup: Consolidate with bento layout

❌ enableSplitView: boolean
   Purpose: Split view layout option
   Type: Technical Migration
   Status: MERGE into progressiveComplexityUI
   Cleanup: Migrate to layout option
```

### Experiment Flags (Decide - 2)
```typescript
🔄 enableVirtualScrolling: boolean
   Purpose: Performance optimization for large lists
   Type: Experiment
   Created: 2024-10-01
   Expires: 2025-01-01
   Decision Needed: Keep or remove based on metrics
   → If keeps >80% users enabled: Make default
   → If <50%: Remove

🔄 enableBatchOperations: boolean
   Purpose: Bulk operation performance optimization
   Type: Experiment
   Status: Decide based on performance metrics
   Decision Needed: Merge into performanceOptimizations
```

---

## 🎯 Target Feature Flags (4)

### 1. Business Feature Flags
```typescript
// config/featureFlags.ts

export interface FeatureFlags {
  // BUSINESS FLAGS (Permanent)
  progressiveComplexityUI: {
    enabled: boolean;
    options: {
      layout: 'standard' | 'bento' | 'split';
      density: 'compact' | 'comfortable' | 'spacious';
      advancedFilters: boolean;
      bulkOperations: boolean;
    };
  };

  enableWorkspaceMode: boolean;

  // PERFORMANCE FLAGS (Consolidated)
  performanceOptimizations: {
    enabled: boolean;
    features: {
      virtualScrolling: boolean;
      batchOperations: boolean;
      lazyLoading: boolean;
      memoization: boolean;
    };
  };

  // EXPERIMENTAL (Time-limited)
  experimental: {
    enabled: boolean;
    features: Record<string, {
      enabled: boolean;
      expiresAt: Date;
      cleanupBy: string;
    }>;
  };
}

export const defaultFlags: FeatureFlags = {
  progressiveComplexityUI: {
    enabled: true,
    options: {
      layout: 'standard',
      density: 'comfortable',
      advancedFilters: true,
      bulkOperations: true,
    },
  },

  enableWorkspaceMode: true,

  performanceOptimizations: {
    enabled: true,
    features: {
      virtualScrolling: true, // Graduated from experiment
      batchOperations: true,  // Graduated from experiment
      lazyLoading: true,
      memoization: true,
    },
  },

  experimental: {
    enabled: process.env.NODE_ENV === 'development',
    features: {},
  },
};
```

---

## 🔄 Migration Plan

### Phase 1: Consolidate Layout Flags
```typescript
// BEFORE: 3 separate flags
const enableBentoLayout = useFeatureFlag('enableBentoLayout');
const enableEnhancedBento = useFeatureFlag('enableEnhancedBento');
const enableSplitView = useFeatureFlag('enableSplitView');

if (enableBentoLayout || enableEnhancedBento) {
  return <BentoLayout />;
} else if (enableSplitView) {
  return <SplitViewLayout />;
}

// AFTER: Single flag with options
const { progressiveComplexityUI } = useFeatureFlags();

const layout = progressiveComplexityUI.options.layout;

switch (layout) {
  case 'bento':
    return <BentoLayout />;
  case 'split':
    return <SplitViewLayout />;
  default:
    return <StandardLayout />;
}
```

### Phase 2: Remove Migration Flags
```typescript
// BEFORE: Feature flag for new system
const useNewSystem = useFeatureFlag('ENABLE_NEW_COLLECTION_SYSTEM');

return useNewSystem
  ? <Collection collections={data} />
  : <LegacyCollectionOpportunities data={data} />;

// AFTER: New system is default (flag removed)
return <Collection collections={data} />;
```

### Phase 3: Consolidate Performance Flags
```typescript
// BEFORE: Individual flags
const enableVirtualScrolling = useFeatureFlag('enableVirtualScrolling');
const enableBatchOperations = useFeatureFlag('enableBatchOperations');

// AFTER: Grouped optimization flags
const { performanceOptimizations } = useFeatureFlags();

if (performanceOptimizations.features.virtualScrolling && items.length > 1000) {
  return <VirtualizedList items={items} />;
}

if (performanceOptimizations.features.batchOperations) {
  useBatchedUpdates();
}
```

---

## 📋 Flag Cleanup Checklist

### Week 1: Remove Technical Debt Flags
- [ ] Remove `useRefactoredComponents` flag
  - Make refactored components default
  - Delete legacy component versions
  - Update all conditional renders

- [ ] Remove `ENABLE_NEW_COLLECTION_SYSTEM` flag
  - Ensure Wave 2 migration complete
  - Delete legacy Collection components
  - Update all imports

### Week 2: Consolidate Layout Flags
- [ ] Merge layout flags into `progressiveComplexityUI`
  - Create layout option enum
  - Update all layout-related conditionals
  - Test all layout variants

- [ ] Remove individual layout flags
  - Delete `enableBentoLayout`
  - Delete `enableEnhancedBento`
  - Delete `enableSplitView`

### Week 3: Graduate Experiment Flags
- [ ] Decide on `enableVirtualScrolling`
  - Analyze usage metrics
  - Make default if successful
  - Remove flag if not used

- [ ] Decide on `enableBatchOperations`
  - Performance analysis
  - Merge into `performanceOptimizations`
  - Remove individual flag

### Week 4: Implement Flag Lifecycle Policy
- [ ] Create flag management system
  - Auto-expiration tracking
  - Cleanup reminders
  - Deprecation warnings

- [ ] Update documentation
  - Flag usage guide
  - Lifecycle policy
  - Adding new flags process

---

## 🛠️ Feature Flag Lifecycle Policy

### Flag Types & Lifecycle

```typescript
enum FlagType {
  BUSINESS = 'business',           // Permanent product features
  TECHNICAL = 'technical',         // Temporary migration (Max 6 months)
  EXPERIMENT = 'experiment',       // A/B testing (Max 3 months)
}

interface FlagMetadata {
  key: string;
  type: FlagType;
  enabled: boolean;
  createdAt: Date;
  createdBy: string;
  expiresAt?: Date;                // Required for technical/experiment
  cleanupBy?: string;              // Owner responsible for cleanup
  dependencies?: string[];         // Other flags this depends on
  usage?: {
    percentage: number;            // % of users with flag enabled
    lastChecked: Date;
  };
}
```

### Lifecycle Rules

**1. Business Flags** (Permanent)
- No expiration date
- High-impact product features
- Require product manager approval
- Annual review for relevance

**2. Technical Flags** (Max 6 months)
- Must have expiration date
- Created for migrations/refactoring
- Automatic cleanup warnings at 80% lifetime
- Forced removal at expiration

**3. Experiment Flags** (Max 3 months)
- Must have expiration date
- Requires metrics/success criteria
- Decision required at expiration:
  - Graduate to business flag
  - Make default behavior
  - Remove feature
- No extensions without re-approval

### Automated Monitoring

```typescript
// scripts/check-feature-flags.ts

/**
 * Automated feature flag monitoring
 * Run daily in CI to check flag health
 */
export function checkFeatureFlags() {
  const flags = loadFeatureFlags();
  const now = new Date();
  const warnings: string[] = [];

  for (const [key, metadata] of Object.entries(flags)) {
    // Check for expired flags
    if (metadata.expiresAt && metadata.expiresAt < now) {
      warnings.push(`🚨 EXPIRED: ${key} expired on ${metadata.expiresAt}`);
    }

    // Check for flags nearing expiration
    if (metadata.expiresAt) {
      const daysRemaining = differenceInDays(metadata.expiresAt, now);
      if (daysRemaining <= 30 && daysRemaining > 0) {
        warnings.push(`⚠️ EXPIRING SOON: ${key} expires in ${daysRemaining} days`);
      }
    }

    // Check for unused flags
    if (metadata.usage && metadata.usage.percentage < 5) {
      warnings.push(`📊 LOW USAGE: ${key} only ${metadata.usage.percentage}% enabled`);
    }
  }

  if (warnings.length > 0) {
    console.log('Feature Flag Warnings:\n' + warnings.join('\n'));
    // Create GitHub issue or Slack notification
  }
}
```

---

## ✅ Success Criteria

### Quantitative
- [ ] Feature flags: 9 → 4 (-55%)
- [ ] Code paths: 2^9 (512) → 2^4 (16) combinations (-97%)
- [ ] Flag-related conditionals reduced by 60%
- [ ] Zero expired flags in production

### Qualitative
- [ ] Clear flag categorization (business vs technical vs experiment)
- [ ] Automated lifecycle management
- [ ] Documented flag policy
- [ ] Team trained on flag management
- [ ] Reduced decision fatigue

---

**Status**: Design Complete
**Next**: Implement flag consolidation
