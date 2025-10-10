# 🎯 Lean Product Triage: Collection Management

## User Reality Check

### What Users Actually Need
1. **See opportunities** → Make decisions → Save changes
2. **Find problems quickly** → Fix them → Move on
3. **Bulk operations** → Save time → Feel productive

### Current Pain Points
- 🔴 **Page won't load** (VirtualizedTable import error)
- 🟡 **4 different interfaces** (Bento variants) = confusion
- 🟡 **665-line context** = slow updates
- 🟡 **Missing CSRF** = security risk

## Pragmatic Fix Priority

### 🚨 NOW (0-2 hours)
```typescript
// 1. Simple fallback that WORKS
const TableComponent = React.lazy(() => 
  import('./CollectionOpportunitiesPerformance')
    .then(m => ({ default: m.VirtualizedOpportunitiesTable }))
    .catch(() => ({ default: Table2 })) // Just use Blueprint's table!
);

// 2. Wrap existing component
export default function SafeCollectionOpportunities(props) {
  return (
    <ErrorBoundary fallback={<BasicTable {...props} />}>
      <Suspense fallback={<Spinner />}>
        <CollectionOpportunities {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### 📍 TODAY (2-8 hours)
1. **One Table To Rule Them All**
   - Keep CollectionOpportunities.tsx as the ONLY component
   - Delete the 4 Bento variants
   - Add feature flags for any unique features worth keeping

2. **User-First Performance**
   - Virtual scrolling ONLY if >100 rows
   - Debounce search at 300ms
   - Show skeleton while loading

### 📅 THIS WEEK
1. **Split Context Smartly**
   ```typescript
   // From 665 lines to 3 focused hooks
   useOpportunityData()    // Just the data
   useOpportunityActions() // Just the mutations  
   useOpportunityUI()      // Just UI state
   ```

2. **CSRF the Simple Way**
   ```typescript
   // Add to all mutations
   headers: { 'X-CSRF-Token': getCsrfToken() }
   ```

## Design-Led Consolidation

### Before: 4 Confusing Variants
- CollectionOpportunitiesBento.tsx
- CollectionOpportunitiesEnhancedBento.tsx  
- CollectionOpportunitiesRefactoredBento.tsx
- CollectionOpportunitiesSplitView.tsx

### After: 1 Adaptive Component
```typescript
<CollectionOpportunities
  view={userPreference || 'table'} // table | cards | split
  density={userPreference || 'comfortable'} // compact | comfortable | spacious
  features={{
    virtualScroll: rowCount > 100,
    bulkEdit: userRole.includes('editor'),
    advancedFilters: false // YAGNI
  }}
/>
```

## Metrics That Matter

### User Success Metrics
- ✅ Page loads < 3 seconds
- ✅ Can find & fix issues in < 5 clicks
- ✅ Bulk operations work reliably
- ✅ No confusing variant switching

### Technical Health
- ✅ 1 component instead of 5
- ✅ <300 lines per file
- ✅ 0 "any" types in user paths
- ✅ Error boundaries everywhere

## Implementation Playbook

### Day 1: Stop the Bleeding
```bash
# 1. Deploy the fallback fix
git checkout -b hotfix/collection-table-fallback
# Apply minimal fix
npm test
git push

# 2. Monitor user impact
# Check Sentry, support tickets
```

### Day 2-3: Consolidate
```bash
# 1. Create unified component
git checkout -b feature/unified-collection-table

# 2. Migrate best features from variants
# 3. Delete redundant files
# 4. Update imports
```

### Day 4-5: Polish
- Add user preferences (view, density)
- Improve error messages  
- Add loading skeletons
- Test with real users

## What We're NOT Doing

❌ Complex architectural rewrites
❌ Perfect TypeScript everywhere  
❌ Premature optimization
❌ Feature parity with all 4 variants
❌ Waiting for consensus

## Success = Happy Users

Users don't care about:
- Component architecture
- TypeScript coverage
- Bundle size optimization

Users DO care about:
- ✅ It works when they need it
- ✅ It's fast enough
- ✅ It's predictable
- ✅ It saves them time

---

**Next Action**: Deploy fallback fix NOW, then consolidate this week.