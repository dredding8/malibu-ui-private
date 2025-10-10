# Integration Guide: UX Law Improvements for Collection Opportunities

## Quick Start

### 1. Install Dependencies
```bash
npm install lodash @blueprintjs/table@next
```

### 2. Import Performance Optimizations
```typescript
// In CollectionOpportunitiesRefactored.tsx
import {
    useMemoizedHealthScores,
    useDebouncedSearch,
    VirtualizedOpportunitiesTable,
    useOptimizedFiltering,
    withPerformanceMonitoring,
    AUTO_SIZED_COLUMNS
} from './CollectionOpportunitiesPerformance';
```

### 3. Import UX Improvements
```typescript
import {
    showSuccessToast,
    showProgressToast,
    AllocationProgressIndicator,
    ImprovedActionButtons,
    ChunkedSiteDisplay,
    EnhancedHealthIndicator,
    UX_IMPROVEMENTS_CSS
} from './CollectionOpportunitiesUXImprovements';
```

## Key Integration Points

### 1. Performance: Replace useEffect with Memoized Health Scores
```typescript
// OLD (lines 337-345)
useEffect(() => {
    const healthUpdates = new Map<string, HealthAnalysis>();
    opportunities.forEach(opp => {
        const health = calculateOpportunityHealth(opp);
        const healthAnalysis = convertToHealthAnalysis(health);
        healthUpdates.set(opp.id, healthAnalysis);
    });
    dispatch({ type: 'BATCH_UPDATE_HEALTH', updates: healthUpdates });
}, [opportunities]);

// NEW
const healthScores = useMemoizedHealthScores(opportunities);
useEffect(() => {
    dispatch({ type: 'BATCH_UPDATE_HEALTH', updates: healthScores });
}, [healthScores]);
```

### 2. Performance: Add Debounced Search
```typescript
// OLD (line 808)
onChange={(e) => dispatch({ type: 'SET_SEARCH', query: e.target.value })}

// NEW
const debouncedSearch = useDebouncedSearch(dispatch);
onChange={(e) => debouncedSearch(e.target.value)}
```

### 3. Peak-End Rule: Add Success Toast
```typescript
// In handleSaveOverride (line 393)
const handleSaveOverride = useCallback(async (changes: Map<string, CollectionOpportunity>) => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
        const updates = Array.from(changes.values());
        await batchUpdateOpportunities(updates);
        dispatch({ type: 'CLEAR_SELECTION' });
        setOverrideModalOpen(false);
        
        // NEW: Add success feedback
        showSuccessToast(
            `Successfully updated ${updates.length} opportunities`,
            updates.length
        );
    } catch (error) {
        dispatch({ type: 'SET_ERROR', error: (error as Error).message });
    } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
    }
}, [batchUpdateOpportunities]);
```

### 4. Zeigarnik Effect: Add Progress Indicator
```typescript
// Add before the table (around line 870)
<AllocationProgressIndicator
    total={opportunities.length}
    allocated={opportunities.filter(o => o.matchStatus === 'baseline').length}
    pending={opportunities.filter(o => o.matchStatus === 'unmatched').length}
    needsReview={opportunities.filter(o => o.matchStatus === 'suboptimal').length}
/>
```

### 5. Fitts's Law: Update Column Widths
```typescript
// OLD (line 991)
columnWidths={[60, 130, 180, 250, 100, 180, 120, 100]}

// NEW
columnWidths={Object.values(AUTO_SIZED_COLUMNS)}
```

### 6. Miller's Law: Replace Site Cell Renderer
```typescript
// Replace renderSitesCell (lines 614-628)
const renderSitesCell = (rowIndex: number) => {
    const opp = filteredOpportunities[rowIndex];
    if (!opp) return <Cell />;
    
    return (
        <Cell>
            <ChunkedSiteDisplay 
                sites={opp.allocatedSites} 
                maxVisible={3}
            />
        </Cell>
    );
};
```

### 7. Aesthetic-Usability: Enhanced Health Indicator
```typescript
// Replace health cell content (lines 586-606)
return (
    <Cell>
        <EnhancedHealthIndicator health={health} />
    </Cell>
);
```

### 8. Doherty Threshold: Virtual Table (for large datasets)
```typescript
// Replace Table2 with VirtualizedTable for >100 rows
{filteredOpportunities.length > 100 ? (
    <VirtualizedOpportunitiesTable
        filteredOpportunities={filteredOpportunities}
        columnRenderers={[
            renderPriorityCell,
            renderMatchStatusCell,
            renderMatchNotesCell,
            renderNameCell,
            renderHealthCell,
            renderSitesCell,
            renderCapacityCell,
            renderActionsCell
        ]}
    />
) : (
    // Existing Table2 implementation
)}
```

### 9. Add Performance Monitoring
```typescript
// Wrap the export
export default withPerformanceMonitoring(
    CollectionOpportunitiesRefactored,
    'CollectionOpportunities'
);
```

### 10. Add UX Improvements CSS
```typescript
// In CollectionOpportunitiesRefactored.css
${UX_IMPROVEMENTS_CSS}
```

## Testing the Integration

### 1. Run UX Compliance Tests
```bash
chmod +x ./src/components/__tests__/scripts/runUXLawTests.sh
./src/components/__tests__/scripts/runUXLawTests.sh
```

### 2. Performance Benchmarks
```bash
# Test with large dataset
npm run dev -- --test-data=large

# Monitor performance
npm run perf:monitor
```

### 3. Manual Validation Checklist
- [ ] Click targets are at least 44x44px
- [ ] Response times under 400ms
- [ ] Success toasts appear after operations
- [ ] Progress indicator shows overall status
- [ ] Search has 300ms debounce
- [ ] Large tables use virtualization
- [ ] Visual hierarchy is clear
- [ ] Keyboard shortcuts work

## Rollback Plan

If issues arise, revert changes in this order:
1. Remove virtualization (most complex)
2. Remove web worker (if compatibility issues)
3. Remove debouncing (if UX issues)
4. Keep visual improvements (low risk)

## Next Steps

1. **A/B Testing**: Compare metrics before/after improvements
2. **User Feedback**: Gather qualitative feedback on changes
3. **Performance Monitoring**: Set up continuous monitoring
4. **Accessibility Audit**: Ensure WCAG 2.1 AA compliance
5. **Mobile Testing**: Verify touch target sizes on mobile

## Support

For questions or issues:
- Review test results in `test-results/ux-compliance/`
- Check browser console for performance warnings
- Use React DevTools Profiler for component performance
- Enable PWDEBUG=1 for Playwright test debugging