# Wizard Logical Flow Analysis

**Date**: 2025-11-12
**Analysis**: Wizard flow logic and Step 3 redundancy evaluation

---

## Executive Summary

**Critical Finding**: Step 3 ("Select Opportunities") is **logically redundant** and must be removed from the wizard flow.

**Rationale**: The creation of a collection deck *IS* the opportunity. The deck creation process in Step 2 generates opportunities based on user parameters. Having a separate "selection" step treats opportunities as pre-existing entities that need manual curation, which contradicts the fundamental purpose of the system.

---

## Current Wizard Flow (4 Steps)

### Step 1: Collection Parameters
- **Purpose**: Configure tasking window, data sources, and collection parameters
- **Inputs**:
  - Collection name
  - Start/end dates
  - TLE data source
  - Unavailable sites
  - Hard capacity, min duration, elevation
- **Output**: Configuration object for deck creation
- **Status**: ✅ **Logically sound** - users need to define what they want

### Step 2: Create Collection Deck
- **Purpose**: Generate orbital matches and create collection deck entity
- **Process**:
  - Takes parameters from Step 1
  - Runs matching algorithm
  - Creates collection deck with opportunities
  - Generates match quality scores (Optimal/Baseline/Unmatched)
- **Output**: Collection deck with generated opportunities
- **Status**: ✅ **Logically sound** - this is the core creation action

### Step 3: Select Opportunities ⚠️
- **Purpose**: "Review and select opportunities to include in your collection"
- **Process**:
  - Displays table of opportunities from Step 2
  - Allows filtering by match quality (All/Needs Review/Unmatched)
  - Pre-selects "Optimal" matches
  - User can add/remove opportunities
  - Has "Create Collection" button
- **Output**: Filtered subset of opportunities
- **Status**: ❌ **REDUNDANT - MUST BE REMOVED**

**Why Step 3 is Redundant**:

1. **Conceptual contradiction**: The deck was *already created* in Step 2. Step 3's "Create Collection" button suggests it's creating something, but the deck entity already exists.

2. **Opportunity = Deck**: Creating a collection deck *is* creating the opportunity. Opportunities don't exist independently - they're the output of the deck creation process.

3. **Unnecessary friction**: Forces users to review and manually select from auto-generated matches immediately after generation, when they could do this more effectively in the management interface.

4. **Duplicate functionality**: Step 3's table is essentially a subset of what Step 4 (Manage Collection) offers. The filtering and selection logic should live in the management interface where users can iteratively refine their collection.

5. **Workflow mismatch**: Real workflow is:
   - Define parameters → Generate opportunities → Manage/refine over time

   Not:
   - Define parameters → Generate opportunities → **Cherry-pick subset** → Manage that subset

### Step 4: Manage Collection
- **Purpose**: Manage collection assignments and allocate sites
- **Implementation**: Embeds `CollectionOpportunitiesHub` component
- **Status**: ✅ **Correct final step** - this is where ongoing work happens

---

## Standalone Manage Page Comparison

### Standalone Page Features
URL: `http://localhost:3000/collection/DECK-1762977965881/manage`

**Full functionality** (verified via Playwright):
- ✅ Breadcrumb navigation (History → Collection Decks → Deck ID)
- ✅ Collection header with Live status indicator
- ✅ Actions dropdown menu (Refresh, Export CSV/PDF/Excel, Print)
- ✅ Health & Alerts metrics cards
- ✅ Search bar with real-time filtering
- ✅ Advanced filters (Priority ≥34, Needs Review, Unmatched)
- ✅ Column customization menu
- ✅ Assignment Library table with full columns:
  - Priority
  - Match (Optimal/Baseline/Suboptimal/Unmatched)
  - Match Notes
  - SCC (Satellite Catalog Number)
  - Function
  - Orbit
  - Site Allocation (with expandable "+X more" pills)
- ✅ Interactive row actions (click to edit, validate, etc.)
- ✅ Footer with sync status and version info

### Embedded Mode in Wizard Step 4

**Current implementation** (`ManageCollectionStep.tsx`):
```tsx
<CollectionOpportunitiesHub collectionId={collectionId} embedded={true} />
```

**Embedded mode differences** (from code analysis):
```tsx
// Hidden in embedded mode:
{!embeddedMode && <SkipToMain />}
{!embeddedMode && <KeyboardInstructions />}
{!embeddedMode && (
  <div className="hub-navigation">
    <Breadcrumbs items={[...]} />
  </div>
)}
{!embeddedMode && (
  <div className="hub-status-bar">
    {/* Status bar with sync info */}
  </div>
)}

// Added in embedded mode:
{embeddedMode && (
  <Card>
    <Button text="View All Collections" onClick={onWizardExit} />
    <Button text="Back" onClick={onWizardBack} />
    <Button text="Finish" onClick={onWizardNext} />
  </Card>
)}
```

### ⚠️ Functional Parity Assessment

**Core functionality status**: ✅ **SAME** - The `CollectionOpportunitiesHubCore` component is identical

**UI chrome differences**:
- ❌ Missing breadcrumbs (hidden in embedded mode)
- ❌ Missing status bar footer (hidden in embedded mode)
- ✅ Has wizard navigation (Back/Finish buttons)
- ❌ Missing accessibility helpers (Skip to main, Keyboard instructions)

**Critical question**: Does the embedded mode limit any *actions* or *features*?

**Answer from code**: NO - The core `CollectionOpportunitiesHubCore` component receives the same props and renders the same features:
- Search and filters: ✅ Same
- Table and columns: ✅ Same
- Health metrics: ✅ Same (unless `LEGACY_HIDE_HEALTH_WIDGET` flag is set)
- Actions menu: ✅ Same
- Interactive editing: ✅ Same

**However**, the user specifically requests that Step 4 must "replicate the *full* functionality of the standalone manage page". This means:
1. All core features must be present ✅ (already true)
2. Users must be able to perform all the same actions ✅ (already true)
3. The experience should feel complete, not limited ⚠️ (missing status bar and breadcrumbs creates perception of "lite" version)

---

## Recommended Solution

### Option A: Streamlined 3-Step Wizard (RECOMMENDED)

**Remove Step 3 entirely**. The wizard becomes:

1. **Collection Parameters** - Define what you want
2. **Create Collection Deck** - Generate the deck and opportunities (async process)
3. **Manage Collection** - Work with the created opportunities

**Rationale**:
- Eliminates redundant selection step
- Cleaner, faster workflow
- Aligns with actual user mental model (configure → create → manage)
- Step 2 starts background processing, Step 3 shows results when ready

**User flow**:
```
Step 1: Parameters
↓ (User clicks "Next")
Step 2: Create Deck
  - Show "Creating your collection deck..." loading state
  - Start background processing via useBackgroundProcessing hook
  - When complete, auto-advance to Step 3
↓ (Auto-advance or manual "Continue to Management")
Step 3: Manage Collection
  - Full embedded CollectionOpportunitiesHub
  - All opportunities from deck are visible
  - Users can filter, search, and manage as needed
  - "Finish" button exits wizard and goes to History
```

### Option B: Keep 4 Steps, Merge Step 3 into Step 2

If stakeholders insist on keeping a review step:

1. **Collection Parameters** - Define what you want
2. **Create & Review Deck** - Generate deck + inline preview/selection
3. **Manage Collection** - Full management interface
4. *(Removed)*

Step 2 would show:
- "Creating..." loading state
- When done: Summary of results + expandable table
- "Continue" button advances to Step 3

---

## Implementation Recommendations

### 1. Remove Step 3 (SelectOpportunitiesStep.tsx)

**Files to modify**:
- `src/pages/CreateCollectionDeck.tsx` - Update steps array, routing, and navigation logic
- `src/pages/CreateCollectionDeck/SelectOpportunitiesStep.tsx` - DELETE or archive

**Changes**:
```tsx
// OLD: 4 steps
const steps = [
  { id: 1, name: 'Collection Parameters', path: '/create-collection-deck/parameters' },
  { id: 2, name: 'Create Collection Deck', path: '/create-collection-deck/create' },
  { id: 3, name: 'Select Opportunities', path: '/create-collection-deck/select' },  // REMOVE
  { id: 4, name: 'Manage Collection', path: '/create-collection-deck/manage' }
];

// NEW: 3 steps
const steps = [
  { id: 1, name: 'Collection Parameters', path: '/create-collection-deck/parameters' },
  { id: 2, name: 'Create Collection Deck', path: '/create-collection-deck/create' },
  { id: 3, name: 'Manage Collection', path: '/create-collection-deck/manage' }
];
```

### 2. Update Step 2 (CreateDeckStep.tsx)

**Current behavior**: Step 2 shows a preview of matches and has a "Next" button that goes to Step 3 (Select Opportunities)

**New behavior**: Step 2 should:
- Start background processing when user clicks "Create Collection Deck"
- Show "Creating..." state with progress indicator
- When complete, show success message
- "Continue to Management" button advances to Step 3 (formerly Step 4)

**Key change**: Remove the intermediate selection logic. The deck creation *is* final.

### 3. Enhance Step 3 (ManageCollectionStep.tsx - formerly Step 4)

**Current implementation**:
```tsx
<CollectionOpportunitiesHub collectionId={collectionId} embedded={true} />
```

**Required enhancements**:

1. **Ensure full functionality**: Verify no features are hidden due to `embedded` prop or feature flags
2. **Consider showing more UI chrome**: While breadcrumbs may be redundant in wizard context, the status bar is useful
3. **Add clear exit paths**:
   - "Finish" → Go to History page (collection is in table)
   - "View This Collection" → Exit wizard to standalone manage page
   - "Create Another" → Restart wizard (clear state)

**Enhanced implementation**:
```tsx
<div>
  {/* Success Banner */}
  <Callout intent={Intent.SUCCESS} icon={IconNames.TICK_CIRCLE}>
    <strong>Collection Created Successfully!</strong>
    <p>Your collection deck <Tag>{collectionId}</Tag> is ready to manage.</p>
  </Callout>

  {/* Full Embedded Management Interface */}
  <CollectionOpportunitiesHub
    collectionId={collectionId}
    embedded={true}
  />

  {/* Wizard Navigation */}
  <Card className="wizard-navigation">
    <ButtonGroup>
      <Button
        text="Finish & Go to History"
        intent={Intent.PRIMARY}
        onClick={() => navigate('/history')}
      />
      <Button
        text="View Standalone Page"
        onClick={() => navigate(`/collection/${collectionId}/manage`)}
      />
      <Button
        text="Create Another Collection"
        onClick={() => navigate('/create-collection-deck')}
      />
    </ButtonGroup>
  </Card>
</div>
```

### 4. Update Progress Indicators

**Current**: "Step X of 4"
**New**: "Step X of 3"

Update:
- Progress bar calculation: `value={currentStep / 3}`
- Step labels and context descriptions
- ARIA labels for accessibility
- Test data-testid attributes

### 5. Update Tests

**Files to update**:
- `src/tests/e2e/wizard-4-step-flow.spec.ts` → Rename to `wizard-3-step-flow.spec.ts`
- Update all test expectations for 3-step flow
- Remove tests for Step 3 (SelectOpportunitiesStep)
- Update Step 4 tests to reference Step 3

---

## Migration Strategy

### Phase 1: Remove Step 3 (Immediate)
1. Delete/archive `SelectOpportunitiesStep.tsx`
2. Update `CreateCollectionDeck.tsx` steps array
3. Update routing to skip /select path
4. Update Step 2 → Step 3 navigation logic
5. Update progress indicators (4→3)

### Phase 2: Enhance Step 3 (ManageCollectionStep)
1. Verify full functionality in embedded mode
2. Add clear wizard exit controls
3. Update success messaging
4. Test all management features work in wizard context

### Phase 3: Testing & Validation
1. Update e2e tests for 3-step flow
2. Manual testing of complete wizard
3. Verify background processing works correctly
4. Validate embedded manage page has full functionality
5. Accessibility testing (keyboard navigation, screen readers)

### Phase 4: Documentation & Cleanup
1. Update any wizard documentation
2. Update user guides or help text
3. Clean up unused code and components
4. Update git history with clear commit messages

---

## Screenshots

### Current Wizard - Step 1 (Parameters)
![Wizard Step 1](/.playwright-mcp/wizard-step1-parameters.png)

Shows Step 2 of 4 in progress indicator (note: URL shows /parameters but state shows Step 2 due to saved progress)

### Standalone Manage Page
![Standalone Manage Page](/.playwright-mcp/standalone-manage-page.png)

Full-featured management interface with:
- Breadcrumb navigation
- Search and advanced filters
- Column customization
- Assignment library table
- Actions dropdown menu
- Health metrics (not visible in screenshot but present)
- Status bar footer

---

## Conclusion

**Primary Recommendation**: Remove Step 3 ("Select Opportunities") entirely, creating a streamlined 3-step wizard:

1. **Collection Parameters** - Configure
2. **Create Collection Deck** - Generate
3. **Manage Collection** - Work with results

**Rationale**: The "Select Opportunities" step is conceptually redundant. Creating a collection deck *is* creating the opportunity. The selection and filtering logic belongs in the management interface where users can iteratively refine their collection over time, not as a mandatory gate between creation and management.

**Step 3 (formerly Step 4) Status**: The embedded `CollectionOpportunitiesHub` already provides full functionality equivalent to the standalone manage page. The core features are identical - only UI chrome (breadcrumbs, status bar) differs, which is appropriate for wizard context.

**Next Steps**:
1. Implement 3-step wizard changes
2. Update tests and documentation
3. Validate all functionality in embedded mode
4. User acceptance testing

---

**End of Analysis**
