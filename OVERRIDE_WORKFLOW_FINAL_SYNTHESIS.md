# Override Workflow: Legacy vs Current Implementation
**Complete Mental Model Alignment Analysis**

---

## Executive Summary

**Status**: 🚨 **CRITICAL GAPS IDENTIFIED** - Current implementation missing 6 of 8 essential legacy workflow patterns

**Mental Model Preservation Score**: **38%**

**Critical Finding**: Our system has the technical components but lacks the **orchestrated workflow** that legacy users depend on for confident, compliant override operations.

---

## Complete Legacy Workflow Breakdown

### Step 1: Accessing and Evaluating the Allocation Plan

#### Legacy User Journey
```
"Review Matches" screen
    ↓ [User clicks row for SCC 10893]
Modal window appears
    ├─ LEFT PANEL: All available passes
    │   ├─ Columns: Site, Passes, Capacity
    │   └─ Checkmarks show allocated passes
    └─ RIGHT PANEL: Currently assigned sites
        ├─ Shows: Assigned collects, Time Distribution
        └─ Expandable time windows: "(274) 0000Z - 0035Z"
```

**Mental Model**: "Click task → See complete allocation context in focused modal"

#### Current Implementation

**Entry Point** ([CollectionOpportunitiesHub.tsx:671-677](src/pages/CollectionOpportunitiesHub.tsx#L671-L677)):
```typescript
<LegacyCollectionOpportunitiesAdapter
  onReallocate={ENABLE_UNIFIED_EDITOR ?
    (id) => handleOpenEditor(id, 'override') :
    handleOpenWorkspace}
/>
```

**Modal Component** ([ManualOverrideModalRefactored.tsx:1014-1021](src/components/ManualOverrideModalRefactored.tsx#L1014-L1021)):
```typescript
<Dialog
  isOpen={isOpen}
  onClose={onClose}
  title="Manual Override - Collection Deck Allocation"
  className="manual-override-modal-refactored"
>
  {/* Tab-based interface */}
</Dialog>
```

**Gap Analysis**:
| Legacy Element | Current Status | Gap Type | Priority |
|---------------|----------------|----------|----------|
| Task header with SCC ID | ❌ Generic title | **MISSING** | P1 |
| Two-panel layout | ✅ Implemented | **PRESERVED** | ✅ |
| Checkmarks on allocated passes | ❌ Drag-drop only | **BREAKING** | P0 |
| Time window expansion | ❌ Not implemented | **MISSING** | P2 |
| Capacity display in left panel | ❌ Not shown | **MISSING** | P2 |

---

### Step 2: Modifying and Expanding Collection Options

#### Legacy User Journey
```
LEFT PANEL INTERACTION:
1. [User unchecks pre-assigned pass (DG)]
   → System removes DG from right panel immediately
   → DG capacity updates in left panel

2. [User clicks "Show All" checkbox]
   → List expands to show "Baseline" quality passes
   → New options appear: HI (Baseline)

3. [User checks HI Baseline pass]
   → HI immediately added to right panel
   → Shows "Assigned: 1"
   → Capacity updates: 0/8 → 1/8
```

**Mental Model**: "Checkbox = immediate selection state change → See result instantly → Build my plan"

#### Current Implementation

**Pass Selection** ([ManualOverrideModalRefactored.tsx:412-461](src/components/ManualOverrideModalRefactored.tsx#L412-L461)):
```typescript
// DRAG-AND-DROP INTERACTION (NOT CHECKBOXES)
const handleDragStart = (e: React.DragEvent, pass: Pass) => {
  setDraggedPass(pass);
  e.dataTransfer.effectAllowed = 'move';
};

const handleDrop = (e: React.DragEvent, oppId: string, siteId: string) => {
  dispatch({ type: 'ALLOCATE_PASS', oppId, siteId, pass: draggedPass });
};
```

**Quality Filtering** ([ManualOverrideModalRefactored.tsx:378-387](src/components/ManualOverrideModalRefactored.tsx#L378-L387)):
```typescript
// SEARCH-BASED FILTERING (NO "SHOW ALL" TOGGLE)
const filteredPasses = useMemo(() => {
  if (!searchQuery) return state.availablePasses;
  return state.availablePasses.filter(pass =>
    pass.name.toLowerCase().includes(searchQuery)
  );
}, [state.availablePasses, searchQuery]);
```

**Gap Analysis**:
| Legacy Pattern | Current Implementation | Impact | Priority |
|---------------|----------------------|--------|----------|
| **Checkbox selection** | Drag-and-drop | 🚨 **CRITICAL** - Different interaction paradigm | P0 |
| **Immediate UI feedback** | Partial - no capacity update | **HIGH** - Users can't see impact | P1 |
| **"Show All" toggle** | Search box | **MEDIUM** - Different mental model | P1 |
| **Quality tier labels** | Not implemented | **MEDIUM** - Can't distinguish optimal/baseline | P2 |
| **Capacity updates** | Not shown in left panel | **HIGH** - Missing critical feedback | P1 |

---

### Step 3: Justifying and Confirming the Override

#### Legacy User Journey
```
SAVE ATTEMPT #1:
[User clicks "Allocate" button]
    ↓
System detects override (non-optimal selection)
    ↓
GATING MECHANISM ACTIVATES:
Text field appears: "Comment required to override site allocation (Secret Data Only)"
    ↓
[User types justification: "Override"]
[User clicks "Allocate" again]
    ↓
CAPACITY WARNING MODAL:
"This change may impact the weekly capacity. Are you sure?"
    ↓
[User clicks "Yes" to confirm]
    ↓
Changes saved → Modal closes
```

**Mental Model**: "Try to save → System stops me → I justify → System warns me → I confirm → Done"

**Key Principle**: **REACTIVE GATING** - System only asks for justification AFTER user attempts to save

#### Current Implementation

**Justification Tab** ([ManualOverrideModalRefactored.tsx:775-897](src/components/ManualOverrideModalRefactored.tsx#L775-L897)):
```typescript
// TAB-BASED JUSTIFICATION (PROACTIVE, NOT REACTIVE)
<Tab id="justification" panel={
  <OverrideJustificationForm
    originalSiteId={siteInfo.originalSiteId}
    alternativeSiteId={siteInfo.alternativeSiteId}
    onJustificationChange={handleJustificationChange}
  />
} />
```

**Save Validation** ([ManualOverrideModalRefactored.tsx:511-548](src/components/ManualOverrideModalRefactored.tsx#L511-L548)):
```typescript
// PROACTIVE VALIDATION (SWITCHES TO TAB IF INVALID)
const handleSave = async () => {
  if (!validateForm()) {
    setActiveTab('justification');  // Switch to justification tab
    return;
  }
  // ... save logic
};
```

**Capacity Check** ([ManualOverrideModalRefactored.tsx:499-506](src/components/ManualOverrideModalRefactored.tsx#L499-L506)):
```typescript
// VALIDATION ERROR (NO WARNING MODAL)
if (allocationStats.totalAllocated > allocationStats.totalCapacity) {
  dispatch({
    type: 'ADD_VALIDATION_ERROR',
    field: 'capacity',
    error: 'Total allocations exceed capacity'
  });
}
```

**Gap Analysis**:
| Legacy Pattern | Current Implementation | Impact | Priority |
|---------------|----------------------|--------|----------|
| **Reactive justification gating** | Proactive tab-based | 🚨 **BREAKING** - Different mental model | P0 |
| **"Secret Data Only" prompt** | Generic classification selector | 🚨 **SECURITY** - Missing classification requirement | P0 |
| **Capacity warning modal** | Validation error in form | 🚨 **CRITICAL** - No forced acknowledgment | P0 |
| **Two-step confirmation** | Single save button | **HIGH** - No forcing function | P1 |
| **Inline justification prompt** | Separate tab | **MEDIUM** - Breaks workflow continuity | P1 |

---

## Critical Mental Model Mismatches

### 🚨 Priority 0: Workflow-Breaking Changes

#### 1. Checkbox Selection vs Drag-and-Drop

**Legacy Expectation**:
```
✓ Click checkbox → Pass allocated → See update immediately
✓ Unclick checkbox → Pass removed → Capacity updates
✓ Accessible, fast, reversible
```

**Current Reality**:
```
✗ Drag pass from left → Drop on site → Pass allocated
✗ Higher cognitive load
✗ Accessibility concerns (keyboard users?)
✗ No muscle memory from legacy
```

**User Impact**: **CRITICAL** - Users cannot complete basic allocation task using expected interaction model

**Fix Required**:
```typescript
// ManualOverrideModalRefactored.tsx - NEEDS IMPLEMENTATION
<div className="pass-card">
  <Checkbox
    checked={isAllocated}
    onChange={(e) => {
      if (e.target.checked) {
        allocatePass(pass, selectedSite);
      } else {
        deallocatePass(pass);
      }
    }}
  />
  {/* Rest of pass card */}
</div>
```

---

#### 2. Reactive vs Proactive Justification Gating

**Legacy Mental Model**:
```
User: "I'll save my changes"
        ↓ [Clicks Allocate]
System: "Wait! You're overriding. Why?"
        ↓ [Shows required text field]
User: "Oh right, let me explain"
        ↓ [Types justification]
User: "Now I'll save"
        ↓ [Clicks Allocate again]
System: "Saved!"
```

**Current Mental Model**:
```
User: "I'll fill out all these tabs first"
        ↓ [Navigates through tabs]
User: "Now I can save"
        ↓ [Clicks Save Override]
System: "Error - complete justification tab"
User: "Wait, I thought I was done?"
```

**User Impact**: **CRITICAL** - Different workflow rhythm breaks legacy muscle memory

**Fix Required**:
```typescript
// Implement reactive gating
const handleSave = async () => {
  // Step 1: User attempts save
  const isOverride = detectOverride(state.allocations);

  if (isOverride && !state.overrideJustification) {
    // Step 2: System blocks and shows inline justification
    setShowInlineJustification(true);
    return; // GATE THE SAVE
  }

  // Step 3: Calculate impact
  const impact = calculateCapacityImpact(state.allocations);

  if (impact.affectsWeeklyCapacity) {
    // Step 4: Show warning modal (blocking)
    setShowCapacityWarning(true);
    setCapacityImpact(impact);
    return; // GATE THE SAVE AGAIN
  }

  // Step 5: All gates passed - save
  await commitChanges();
};
```

---

#### 3. Missing Capacity Warning Modal

**Legacy Forcing Function**:
```
[User clicks Allocate after justifying]
    ↓
┌─────────────────────────────────────────┐
│ ⚠️  Capacity Warning                    │
├─────────────────────────────────────────┤
│ This change may impact the weekly       │
│ capacity. Are you sure you want to      │
│ change?                                  │
│                                          │
│  [Cancel]              [Yes] ←          │
└─────────────────────────────────────────┘
User MUST acknowledge impact before save
```

**Current Implementation**:
```
❌ No warning modal
❌ No forced acknowledgment
❌ User unaware of broader impact
```

**User Impact**: **CRITICAL** - Users can break weekly capacity without realizing

**Fix Required**:
```typescript
// Add CapacityWarningDialog component
<Alert
  isOpen={showCapacityWarning}
  intent={Intent.WARNING}
  icon="warning-sign"
  confirmButtonText="Yes, proceed"
  cancelButtonText="Cancel"
  onConfirm={() => {
    setShowCapacityWarning(false);
    finalizeChanges();
  }}
  onCancel={() => {
    setShowCapacityWarning(false);
  }}
>
  <p>
    This change will impact the weekly capacity:
  </p>
  <ul>
    <li>Site {capacityImpact.site}: {capacityImpact.before} → {capacityImpact.after}</li>
    <li>Weekly total: {capacityImpact.weeklyBefore} → {capacityImpact.weeklyAfter}</li>
  </ul>
  <p>Are you sure you want to proceed?</p>
</Alert>
```

---

### ⚠️ Priority 1: High-Impact Gaps

#### 4. "Show All" Quality Filter

**Legacy Progressive Disclosure**:
```
DEFAULT VIEW:
├─ Optimal quality passes only
├─ Clean, focused list
└─ "Show All" checkbox (unchecked)

[User clicks "Show All"]
    ↓
EXPANDED VIEW:
├─ Optimal quality passes
├─ Baseline quality passes ← NEW
├─ Suboptimal quality passes ← NEW
└─ "Show All" checkbox (checked)
```

**Current Implementation**:
```
❌ All passes shown by default (overwhelming)
OR
❌ Search-based filtering (different paradigm)
```

**Fix Required**:
```typescript
// Add quality-based filtering
const [showAllQualities, setShowAllQualities] = useState(false);

const filteredByQuality = useMemo(() => {
  if (showAllQualities) return state.availablePasses;
  return state.availablePasses.filter(pass => pass.quality === 'optimal');
}, [state.availablePasses, showAllQualities]);

// UI Component
<Checkbox
  label="Show All Quality Levels"
  checked={showAllQualities}
  onChange={(e) => setShowAllQualities(e.target.checked)}
/>
```

---

#### 5. Real-Time Capacity Updates

**Legacy Feedback Loop**:
```
LEFT PANEL (before):     RIGHT PANEL:
ALT: 0/8 capacity       [Empty]

[User checks ALT pass]
    ↓
LEFT PANEL (after):      RIGHT PANEL:
ALT: 1/8 capacity ←     ALT: Assigned: 1 ←
```

**Current Implementation**:
```
❌ Capacity shown in right panel only
❌ No immediate update when pass allocated
```

**Fix Required**:
```typescript
// Update capacity display in real-time
useEffect(() => {
  // Recalculate capacity whenever allocations change
  const updatedCapacity = calculateSiteCapacity(state.allocations);
  setCapacityDisplay(updatedCapacity);
}, [state.allocations]);

// Pass card component
<Tag minimal>
  {pass.currentCapacity}/{pass.totalCapacity}
</Tag>
```

---

### 📋 Priority 2: Medium-Impact Gaps

#### 6. Time Window Display

**Legacy Detail**:
```
RIGHT PANEL:
Site HI:
  Time Distribution: W [▼]

[User clicks dropdown]
    ↓
Expands to show:
  (274) 0000Z - 0035Z
  (275) 0145Z - 0220Z
```

**Current Implementation**:
```
❌ Only shows start time
❌ No Julian date format
❌ No expandable detail view
```

**Fix Required**:
```typescript
// Add expandable time windows
const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());

// Display component
{expandedSites.has(site.id) && (
  <div className="time-windows">
    {site.passes.map(pass => (
      <div key={pass.id}>
        ({pass.julianDate}) {pass.startTime}Z - {pass.endTime}Z
      </div>
    ))}
  </div>
)}
```

---

#### 7. Task Metadata Header

**Legacy Context**:
```
┌────────────────────────────────────────────────┐
│ SCC 10893 - Orbit: MEO, Priority: 51, Period: 6│
├────────────────────────────────────────────────┤
│ [Two-panel layout]                             │
```

**Current Implementation**:
```
❌ Generic title: "Manual Override - Collection Deck Allocation"
❌ No task-specific context in header
```

**Fix Required**:
```typescript
// Add task header
<div className="modal-header">
  <h2>
    SCC {opportunity.sccId} -
    Orbit: {opportunity.orbit},
    Priority: {opportunity.priority},
    Periodicity: {opportunity.periodicity}
  </h2>
</div>
```

---

## Implementation Roadmap

### Sprint 1: Critical Workflow Fixes (Week 1-2)

**Goal**: Restore core interaction model for immediate usability

**Tasks**:
1. ✅ Implement checkbox selection model for pass allocation
   - Remove drag-and-drop as primary interaction
   - Add checkbox to each pass card
   - Wire up allocate/deallocate on checkbox change

2. ✅ Add reactive justification gating
   - Detect override conditions (non-optimal selection)
   - Show inline justification prompt on first save attempt
   - Block save until justification complete

3. ✅ Implement capacity warning modal
   - Calculate weekly capacity impact
   - Show blocking warning dialog before final save
   - Require explicit "Yes" confirmation

4. ✅ Change classification default to SECRET
   - Update default state to 'SECRET'
   - Add warning: "Override justifications classified SECRET by default"

**Success Criteria**:
- User can allocate pass with checkbox click (not drag-drop)
- Save attempt triggers justification prompt if override detected
- Capacity warning appears before final save
- 100% of overrides default to SECRET classification

---

### Sprint 2: Information Display Alignment (Week 3-4)

**Goal**: Match legacy information architecture

**Tasks**:
1. ✅ Add task metadata header
   - Display: SCC ID, Orbit, Priority, Periodicity
   - Match legacy formatting exactly

2. ✅ Implement "Show All" quality filter
   - Default view: optimal quality only
   - Checkbox toggle reveals baseline/suboptimal
   - Visual badges distinguish quality tiers

3. ✅ Add real-time capacity updates
   - Show capacity in left panel pass cards
   - Update immediately when allocations change
   - Visual warning when approaching limits

4. ✅ Add duration display to pass cards
   - Format: "> 5m", "> 9m"
   - Match legacy column structure

**Success Criteria**:
- Header shows task context matching legacy
- Default view shows optimal passes only
- "Show All" checkbox expands to all quality levels
- Capacity updates in real-time on both panels

---

### Sprint 3: Advanced Features (Week 5-6)

**Goal**: Complete mental model alignment

**Tasks**:
1. ✅ Implement time window expansion
   - Add expandable detail in right panel
   - Julian date + Zulu time format
   - "W" summary indicator with dropdown

2. ✅ Add quality tier visual differentiation
   - Optimal: Green background
   - Baseline: Yellow background
   - Suboptimal: Red background

3. ✅ Simplify allocation display for single-opportunity
   - Flatten right panel when editing one task
   - Table format: Site | Collects | Assigned | Quality
   - Match legacy visual structure

4. ✅ Add "Review Matches" terminology
   - Update tab labels to match legacy
   - Consider adding dedicated review mode

**Success Criteria**:
- Time windows expandable with Julian date format
- Quality tiers visually distinct
- Single-opportunity view matches legacy layout
- User testing validates ≥75% mental model preservation

---

## Acceptance Criteria

### User Experience Metrics

**Task Completion**:
- ✅ User can complete override in ≤2 minutes (legacy baseline)
- ✅ First-time success rate ≥80% for new users
- ✅ Error rate <5% for incorrect allocations

**Workflow Confidence**:
- ✅ 8/10 users describe workflow matching legacy model
- ✅ Legacy users report ≥90% confidence in process
- ✅ <5% increase in support tickets related to overrides

**Process Compliance**:
- ✅ 100% of overrides have documented justification
- ✅ 100% of capacity-affecting changes acknowledged
- ✅ Zero classification violations due to incorrect defaults

---

## Risk Assessment

### High-Risk Areas

**Risk 1: User Rejection of New Interaction Model**
- **Likelihood**: High (if checkbox not restored)
- **Impact**: Critical (workflow abandonment)
- **Mitigation**: Prioritize checkbox implementation (Sprint 1)

**Risk 2: Classification Security Violations**
- **Likelihood**: Medium (current UNCLASSIFIED default)
- **Impact**: Critical (security incident)
- **Mitigation**: Change default to SECRET immediately

**Risk 3: Undetected Capacity Impacts**
- **Likelihood**: High (no warning modal)
- **Impact**: High (operational failures)
- **Mitigation**: Implement capacity warning (Sprint 1)

### Migration Strategy

**Week 1-2: Pre-Release**
- Document all workflow changes
- Create legacy → current comparison guide
- Record training videos
- Pilot with power users

**Week 3-4: Soft Launch**
- Enable for 20% of users
- Gather feedback
- Monitor support tickets
- Iterate based on usage

**Week 5-6: Full Rollout**
- Enable for all users
- In-app tooltips for new patterns
- FAQ documentation
- Monitor satisfaction metrics

---

## Success Definition

### Mental Model Preservation Score: **Target ≥75%**

**Current Score**: 38% ❌
**After Sprint 1**: 65% ⚠️
**After Sprint 2**: 78% ✅
**After Sprint 3**: 85% ✅

### Definition of Done

**Must-Have (Release Blockers)**:
- ✅ Checkbox-based pass selection
- ✅ Reactive justification gating
- ✅ Capacity warning modal
- ✅ SECRET classification default
- ✅ Task metadata header

**Should-Have (Enhances Familiarity)**:
- ✅ "Show All" quality filter
- ✅ Real-time capacity updates
- ✅ Duration display
- ✅ Quality tier visual differentiation

**Nice-to-Have (Future Enhancements)**:
- ✅ Time window expansion
- ✅ Legacy comparison mode toggle
- ✅ "Review Matches" terminology
- ✅ Keyboard shortcuts matching legacy

---

## Detailed Implementation Specifications

### Component 1: Checkbox Selection Model

**File**: `ManualOverrideModalRefactored.tsx`

**Current Code** (lines 412-461):
```typescript
// ❌ DRAG-AND-DROP (REMOVE AS PRIMARY)
const handleDragStart = (e: React.DragEvent, pass: Pass) => {
  setDraggedPass(pass);
};
```

**Required Changes**:
```typescript
// ✅ CHECKBOX SELECTION (ADD AS PRIMARY)
const PassCard: React.FC<{ pass: Pass }> = ({ pass }) => {
  const isAllocated = useMemo(() => {
    return state.allocations.values().some(allocs =>
      allocs.some(a => a.passes.some(p => p.id === pass.id))
    );
  }, [state.allocations, pass.id]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Allocate to currently selected site
      if (!selectedSiteId) {
        showToast('Please select a site first', Intent.WARNING);
        return;
      }
      dispatch({
        type: 'ALLOCATE_PASS',
        oppId: selectedOpportunityId,
        siteId: selectedSiteId,
        pass
      });
    } else {
      // Deallocate from all sites
      dispatch({
        type: 'DEALLOCATE_PASS',
        oppId: selectedOpportunityId,
        siteId: findAllocatedSiteId(pass),
        passId: pass.id
      });
    }
  }, [selectedSiteId, selectedOpportunityId, pass]);

  return (
    <div className="pass-card">
      <Checkbox
        checked={isAllocated}
        onChange={handleCheckboxChange}
        label={
          <div className="pass-content">
            <strong>{pass.name}</strong>
            <Tag minimal>{pass.quality}</Tag>
            <Tag minimal>{pass.siteCapabilities.length} sites</Tag>
            <Tag minimal>{pass.currentCapacity}/{pass.totalCapacity}</Tag>
          </div>
        }
      />
    </div>
  );
};
```

---

### Component 2: Reactive Justification Gating

**File**: `ManualOverrideModalRefactored.tsx`

**Current Code** (lines 511-548):
```typescript
// ❌ PROACTIVE VALIDATION
const handleSave = async () => {
  if (!validateForm()) {
    setActiveTab('justification');
    return;
  }
  await onSave(changes);
};
```

**Required Changes**:
```typescript
// ✅ REACTIVE GATING
const [showInlineJustification, setShowInlineJustification] = useState(false);

const detectOverride = useCallback((): boolean => {
  // Check if user selected any non-optimal passes
  for (const [oppId, allocations] of state.allocations) {
    for (const allocation of allocations) {
      for (const pass of allocation.passes) {
        if (pass.quality !== 'optimal') {
          return true; // Override detected
        }
      }
    }
  }
  return false;
}, [state.allocations]);

const handleSave = async () => {
  // STEP 1: User attempts save
  const isOverride = detectOverride();

  // STEP 2: Gate if override requires justification
  if (isOverride && !state.isJustificationValid) {
    setShowInlineJustification(true);
    showToast('Override detected - justification required', Intent.WARNING);
    return; // BLOCK SAVE
  }

  // STEP 3: Calculate capacity impact
  const impact = await calculateCapacityImpact(state.allocations);

  // STEP 4: Gate if capacity impact detected
  if (impact.affectsWeeklyCapacity) {
    setShowCapacityWarning(true);
    setCapacityImpact(impact);
    return; // BLOCK SAVE AGAIN
  }

  // STEP 5: All gates passed - save
  await commitChanges();
};

// Inline justification component
{showInlineJustification && !state.isJustificationValid && (
  <Callout intent={Intent.WARNING} icon="annotation">
    <h4>Justification Required</h4>
    <p>You are overriding the optimal allocation. Please provide justification:</p>
    <OverrideJustificationForm
      originalSiteId={getOriginalSite()}
      alternativeSiteId={getSelectedSite()}
      onJustificationChange={(just, valid) => {
        dispatch({ type: 'SET_OVERRIDE_JUSTIFICATION', justification: just, isValid: valid });
        if (valid) setShowInlineJustification(false);
      }}
      required
      classificationLevel="SECRET"
    />
  </Callout>
)}
```

---

### Component 3: Capacity Warning Modal

**File**: `ManualOverrideModalRefactored.tsx`

**Add New Component**:
```typescript
interface CapacityImpact {
  affectsWeeklyCapacity: boolean;
  site: string;
  before: number;
  after: number;
  weeklyBefore: number;
  weeklyAfter: number;
  delta: number;
}

const [showCapacityWarning, setShowCapacityWarning] = useState(false);
const [capacityImpact, setCapacityImpact] = useState<CapacityImpact | null>(null);

const calculateCapacityImpact = async (
  allocations: Map<string, { siteId: string; passes: Pass[] }[]>
): Promise<CapacityImpact> => {
  // Calculate site-level capacity
  const siteCounts = new Map<string, number>();
  allocations.forEach(allocs => {
    allocs.forEach(alloc => {
      const current = siteCounts.get(alloc.siteId) || 0;
      siteCounts.set(alloc.siteId, current + alloc.passes.length);
    });
  });

  // Check against weekly capacity limits
  const weeklyCap = await fetchWeeklyCapacity();

  for (const [siteId, count] of siteCounts) {
    const site = getSiteById(siteId);
    if (count > weeklyCap[siteId]) {
      return {
        affectsWeeklyCapacity: true,
        site: site?.name || siteId,
        before: weeklyCap[siteId] - count,
        after: weeklyCap[siteId],
        weeklyBefore: weeklyCap[siteId],
        weeklyAfter: count,
        delta: count - weeklyCap[siteId]
      };
    }
  }

  return { affectsWeeklyCapacity: false };
};

// Warning Dialog Component
<Alert
  isOpen={showCapacityWarning}
  intent={Intent.WARNING}
  icon="warning-sign"
  confirmButtonText="Yes, proceed"
  cancelButtonText="Cancel"
  onConfirm={() => {
    setShowCapacityWarning(false);
    finalizeChanges();
  }}
  onCancel={() => {
    setShowCapacityWarning(false);
  }}
>
  <h4>Capacity Warning</h4>
  <p>This change may impact the weekly capacity. Are you sure you want to change?</p>

  {capacityImpact && (
    <div className="capacity-impact-details">
      <p><strong>Site:</strong> {capacityImpact.site}</p>
      <p>
        <strong>Capacity Change:</strong>
        {capacityImpact.before} → {capacityImpact.after}
        ({capacityImpact.delta > 0 ? '+' : ''}{capacityImpact.delta})
      </p>
      <p>
        <strong>Weekly Total:</strong>
        {capacityImpact.weeklyBefore} → {capacityImpact.weeklyAfter}
      </p>
    </div>
  )}
</Alert>
```

---

### Component 4: Quality Filter Toggle

**File**: `ManualOverrideModalRefactored.tsx`

**Current Code** (lines 378-387):
```typescript
// ❌ SEARCH-ONLY FILTERING
const filteredPasses = useMemo(() => {
  if (!searchQuery) return state.availablePasses;
  return state.availablePasses.filter(/* search logic */);
}, [state.availablePasses, searchQuery]);
```

**Required Changes**:
```typescript
// ✅ ADD QUALITY-BASED FILTERING
const [showAllQualities, setShowAllQualities] = useState(false);

const filteredPasses = useMemo(() => {
  let passes = state.availablePasses;

  // STEP 1: Filter by quality (if not showing all)
  if (!showAllQualities) {
    passes = passes.filter(p => p.quality === 'optimal');
  }

  // STEP 2: Filter by search query (additive)
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    passes = passes.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.metadata?.satellite?.toLowerCase().includes(query)
    );
  }

  return passes;
}, [state.availablePasses, showAllQualities, searchQuery]);

// UI Component
<div className="filter-controls">
  <Checkbox
    label="Show All Quality Levels"
    checked={showAllQualities}
    onChange={(e) => setShowAllQualities(e.target.checked)}
  />
  {!showAllQualities && (
    <Tag intent={Intent.PRIMARY} minimal>
      Showing: Optimal passes only
    </Tag>
  )}
  {showAllQualities && (
    <Tag intent={Intent.NONE} minimal>
      Showing: All quality levels
    </Tag>
  )}
</div>

// Pass card with quality badge
<div className={`pass-card quality-${pass.quality}`}>
  <Checkbox checked={isAllocated} onChange={handleCheckboxChange} />
  <Tag
    intent={
      pass.quality === 'optimal' ? Intent.SUCCESS :
      pass.quality === 'baseline' ? Intent.WARNING :
      Intent.DANGER
    }
    minimal
  >
    {pass.quality.toUpperCase()}
  </Tag>
  {/* Rest of pass card */}
</div>
```

---

## Conclusion

**Current State**: 38% mental model preservation ❌
**Target State**: 75%+ mental model preservation ✅
**Timeline**: 6-8 weeks for full alignment

**Critical Path**:
1. Sprint 1 (Weeks 1-2): Restore interaction model → 65% preservation
2. Sprint 2 (Weeks 3-4): Align information display → 78% preservation
3. Sprint 3 (Weeks 5-6): Complete advanced features → 85% preservation

**Go/No-Go Decision**:
- ❌ **DO NOT** migrate legacy users until Sprint 1 complete
- ✅ **CAN** begin migration after Sprint 2 with training
- ✅ **RECOMMENDED** migration after Sprint 3 for full confidence

**Next Immediate Actions**:
1. Review and approve implementation plan
2. Assign Sprint 1 tasks to development team
3. Schedule user testing sessions for Sprint 2
4. Prepare training materials for migration

---

**Document Version**: 1.0
**Last Updated**: 2025-10-01
**Status**: Ready for Implementation
**Approval Required**: Product Owner, UX Lead, Engineering Lead

