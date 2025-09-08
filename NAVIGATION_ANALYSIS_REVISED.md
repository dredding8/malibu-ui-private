# Revised Navigation Analysis: Collection Opportunity Review

## Critical Requirement Update

The user needs to view the satellite collection opportunities (what was selected during creation) for an existing collection deck from the History page. This is NOT about field mapping - it's about reviewing which satellite passes were included in a completed collection.

## Current Problem (Revised Understanding)

### Navigation Flow Issues

**Current State:**
```
History Page 
  └── Collection Deck (completed)
       └── "Match Review" → Shows field mappings (WRONG FEATURE)
       
What User Actually Wants:
  └── Collection Deck (completed)
       └── View the satellite opportunities that were selected
```

**The Real Problem:**
1. Users want to see WHICH satellite passes were selected for a collection
2. Currently, "Match Review" shows field mappings instead
3. The satellite opportunity data exists only in the wizard (Step 3)
4. No way to view this data after collection creation

## Revised Solution Architecture

### 1. Create Dedicated Collection Opportunities View

```typescript
// New route for viewing collection opportunities
<Route 
  path="/history/:collectionId/collection-opportunities" 
  element={<CollectionOpportunitiesView />} 
/>

// Component that displays the selected opportunities
export const CollectionOpportunitiesView: React.FC = () => {
  const { collectionId } = useParams();
  const [opportunities, setOpportunities] = useState<CollectionOpportunity[]>([]);
  
  // Fetch the opportunities that were selected for this collection
  useEffect(() => {
    fetchCollectionOpportunities(collectionId).then(setOpportunities);
  }, [collectionId]);
  
  return (
    <PageLayout>
      <NavigationBreadcrumbs items={[
        { text: 'History', href: '/history' },
        { text: `Collection ${collectionId}`, href: `/history/${collectionId}` },
        { text: 'Collection Opportunities', current: true }
      ]} />
      
      <PageHeader
        title="Collection Opportunities"
        subtitle="Satellite passes included in this collection deck"
        icon={IconNames.SATELLITE}
      />
      
      <OpportunitiesTable
        opportunities={opportunities}
        viewMode="readonly"
        showSelectionColumn={false}
      />
    </PageLayout>
  );
};
```

### 2. Update History Page Navigation

```typescript
// HistoryTable.tsx - Add new action
const actions = [
  {
    id: 'view-opportunities',
    label: 'View Collection Opportunities',
    icon: IconNames.SATELLITE,
    onClick: (row) => navigate(`/history/${row.id}/collection-opportunities`)
  },
  {
    id: 'view-field-mappings',
    label: 'View Field Mappings',
    icon: IconNames.FLOWS,
    onClick: (row) => navigate(`/history/${row.id}/field-mappings`)
  }
];
```

### 3. Shared Component Strategy (Revised)

```typescript
// Shared component used in BOTH contexts
export const OpportunitiesReviewComponent: React.FC<{
  mode: 'selection' | 'readonly';
  collectionId?: string;
  onSelection?: (selected: CollectionOpportunity[]) => void;
}> = ({ mode, collectionId, onSelection }) => {
  
  const config = {
    selection: {
      title: 'Select Collection Opportunities',
      subtitle: 'Choose satellite passes for your collection',
      showSelection: true,
      showActions: true,
      theme: 'creation'
    },
    readonly: {
      title: 'Collection Opportunities',
      subtitle: 'Satellite passes included in this collection',
      showSelection: false,
      showActions: false,
      theme: 'review'
    }
  };
  
  const currentConfig = config[mode];
  
  return (
    <OpportunitiesContainer theme={currentConfig.theme}>
      <OpportunitiesTable
        data={opportunities}
        enableSelection={currentConfig.showSelection}
        onSelectionChange={onSelection}
      />
    </OpportunitiesContainer>
  );
};
```

## Updated Information Architecture

```
Application
├── History
│   └── Collection Deck Details
│       ├── Collection Opportunities (Satellite passes selected)
│       ├── Field Mapping Review (Data field relationships)
│       └── Processing Results
└── Create Collection Deck
    ├── Step 1: Input Data
    ├── Step 2: Review Parameters  
    ├── Step 3: Select Collection Opportunities
    └── Step 4: Special Instructions
```

## Key Differences from Original Analysis

1. **Two Separate Features**: 
   - Collection Opportunities View (satellite passes)
   - Field Mapping Review (data transformations)

2. **Shared Component Usage**:
   - Same opportunity display component
   - Different modes: 'selection' vs 'readonly'

3. **Clear Navigation Options**:
   - From History: View saved collection opportunities
   - From Wizard: Select new opportunities

## Implementation Priority

### Phase 1: Add Collection Opportunities View (Week 1)
1. Create new route and component
2. Add navigation option to History table
3. Implement data fetching for saved opportunities

### Phase 2: Refactor Shared Components (Week 2)
1. Extract common opportunity display logic
2. Implement mode-based rendering
3. Ensure consistency between contexts

### Phase 3: Update Terminology (Week 3)
1. Rename "Match Review" → "Field Mapping Review"
2. Clear labeling for "Collection Opportunities"
3. Update all documentation

## Benefits of This Approach

1. **User Gets What They Want**: Direct access to view selected satellite passes
2. **Clear Feature Separation**: No confusion between opportunities and field mappings
3. **Code Reuse**: Same component for display in both contexts
4. **Intuitive Navigation**: Clear options from History page

## Success Metrics

- Users can view collection opportunities within 2 clicks from History
- No confusion between satellite passes and field mappings
- Consistent UI between creation and review contexts
- 95% task completion rate for "view what satellites were selected"