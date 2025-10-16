# Design Panel Critique: AllocatedSites Section

**Date**: 2025-10-15
**Component**: AllocationTab - AllocatedSites Section
**Mode**: Design Challenge (Critical Issues Found)

---

## 🚨 CRITICAL FINDING: CODE VS VISUAL MISMATCH

**Status**: ❌ **REDESIGN INCOMPLETE**

The code shows a Table2 implementation, but the **actual visual rendering** shows a **CARD-BASED layout**, NOT tables!

---

## Visual Analysis: What's Actually Rendered

### Screenshot Evidence: [FINAL-01-modal-full.png](FINAL-01-modal-full.png)

**Actual Implementation** (Right Panel):
```
┌─────────────────────────────────────┐
│ Allocated Sites                     │
│ Configure pass allocation...        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Site D                        ▸ │ │
│ │ 1 passes available              │ │
│ │                                 │ │
│ │ Collects  Site Operations       │ │
│ │ (max: 209)  M  T  W TH SA SU   │ │
│ │      [↑↓]                       │ │
│ │                                 │ │
│ │ Capacity: 14/209 allocated      │ │
│ │                                 │ │
│ │ Site infrastructure constraint  │ │
│ │ Ground station operational days │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**This is a CARD, not a Table2!**

---

## Design Panel Analysis

### 🎯 PM - Scope & Strategy

**Issue Identified**: ❌ **Scope Mismatch**

**Analysis**:
- **Expected Deliverable**: Cards → Table2 conversion
- **Actual Deliverable**: Cards still present (expanded card UI)
- **Impact**: Redesign objective NOT achieved
- **User Impact**: High - fails to deliver promised table-based efficiency

**Evidence**:
- Code shows Table2 implementation (AllocationTab.tsx:477-489)
- Visual shows single-site card with expansion pattern
- Not a tabular data display

**Verdict**: ❌ **OUT OF SCOPE** - Deliverable does not match specification

**Priority**: **P0 - BLOCKING**

---

### 🎨 UX Designer - User Experience

**Issue Identified**: ❌ **Pattern Inconsistency**

**Analysis**:

1. **Hick's Law Violation** - Information Overload
   - Card shows: Site name, passes, collects, operations days (7 buttons), capacity, constraints
   - Total interactive elements in single card: **15+ items**
   - Recommended: ≤7 primary elements
   - **Verdict**: ❌ **VIOLATES Hick's Law**

2. **Gestalt Principles** - Poor Visual Hierarchy
   - Site Operations (M T W TH SA SU buttons) compete with primary actions
   - Operational days use same visual weight as site name
   - Information density too high for a single card
   - **Verdict**: ⚠️ **POOR HIERARCHY**

3. **Jakob's Law** - Unexpected Pattern
   - Users expect tabular data for multi-row comparisons
   - Card pattern is for detail view, not list management
   - Available Passes (left) uses Table2, Allocated Sites (right) uses Cards = **inconsistent**
   - **Verdict**: ❌ **VIOLATES Jakob's Law**

4. **Fitts's Law** - Tap Targets
   - Operational day buttons (M, T, W, etc.) appear small (~32x32px estimated)
   - Spin buttons (↑↓) for collects are small targets
   - **Verdict**: ⚠️ **BORDERLINE** (needs measurement)

**Recommendations**:
```
BEFORE (Current - Cards):
┌─────────────────────┐
│ Site D            ▸ │
│ Passes: 1           │
│ M T W TH F SA SU   │
│ [↑↓] collects      │
│ Capacity info       │
│ Constraints text    │
└─────────────────────┘

AFTER (Desired - Table2):
┌─────────┬─────────┬─────────┬──────────┬─────────┐
│ Site    │ Passes  │ Collects│ Capacity │ Ops     │
├─────────┼─────────┼─────────┼──────────┼─────────┤
│ Site D  │    1    │   [0]   │ 14/209   │  [⋯]   │
│ Site B  │    2    │   [0]   │ 82/230   │  [⋯]   │
│ Site J  │    3    │   [0]   │ 12/103   │  [⋯]   │
└─────────┴─────────┴─────────┴──────────┴─────────┘
```

**Priority**: **P0 - BLOCKING**

---

### ⚡ IxD - Interactions

**Issue Identified**: ❌ **Inconsistent Interaction Model**

**Analysis**:

1. **Expansion Pattern vs Table Pattern**
   - Current: Card with chevron (▸) suggests expansion/details
   - Expected: Table row with inline editing
   - **Verdict**: ❌ **WRONG INTERACTION PATTERN**

2. **Operational Days Buttons**
   - Seven separate buttons (M T W TH F SA SU) in each card
   - This is a **toggle group**, but looks like individual actions
   - Should be: Read-only display with icon, clickable to **Drawer** for editing
   - **Verdict**: ❌ **OVER-INTERACTIVE**

3. **Collects Input**
   - Spin buttons (↑↓) instead of EditableCell
   - Code shows EditableCell (line 346), but rendering shows spinners
   - **Verdict**: ❌ **IMPLEMENTATION MISMATCH**

4. **Missing Operations Column**
   - Code shows Operations column with ButtonGroup + Popover (line 376-420)
   - Visual shows operations days (M T W etc.) instead
   - Actual operations actions are missing or hidden
   - **Verdict**: ❌ **MISSING FEATURE**

**Recommendations**:
- Remove card expansion pattern
- Use Table2 with EditableCell for collects
- Operations days → compact badge/tag, details in Drawer
- Add proper Operations column with ⋯ menu

**Priority**: **P0 - BLOCKING**

---

### 🎨 Visual Designer - Aesthetics

**Issue Identified**: ⚠️ **Visual Inconsistency**

**Analysis**:

1. **Layout Pattern Mismatch**
   - Left panel: Clean table with rows and columns ✅
   - Right panel: Stacked cards with expansion ❌
   - **Verdict**: ❌ **INCONSISTENT PATTERNS**

2. **Typography Hierarchy**
   - "Site D" heading is large and prominent (appropriate for card)
   - In table context, this should be regular body text
   - **Verdict**: ⚠️ **OVER-EMPHASIZED**

3. **Spacing**
   - Card has generous padding (good for cards, wrong for tables)
   - Table context needs compact rows for scannability
   - **Verdict**: ⚠️ **INAPPROPRIATE SPACING**

4. **Color Usage**
   - Operational day buttons use green (T, TH, SA) - semantic color?
   - Unclear color meaning (active days? constraints?)
   - **Verdict**: ⚠️ **UNCLEAR SEMANTICS**

**Recommendations**:
- Match left panel table styling
- Reduce vertical spacing between sites
- Consistent row height across all sites
- Use Tags for operational days, not buttons

**Priority**: **P1 - HIGH**

---

### 🏗️ Product Designer - Synthesis

**Issue Identified**: ❌ **IMPLEMENTATION DOES NOT MATCH SPECIFICATION**

**Analysis**:

**Code Specification** (AllocationTab.tsx:477-489):
```typescript
<Table2
  numRows={selectedSites.length}
  className="allocated-sites-table"
>
  <Column name="Site Name" cellRenderer={renderAllocatedSiteNameCell} />
  <Column name="Location" cellRenderer={renderLocationCell} />
  <Column name="Collects" cellRenderer={renderCollectsEditableCell} />
  <Column name="Capacity" cellRenderer={renderCapacityCell} />
  <Column name="Operational Days" cellRenderer={renderOperationalDaysCell} />
  <Column name="Operations" cellRenderer={renderOperationsCell} />
</Table2>
```

**Visual Implementation**:
- ❌ NO Table2 component visible
- ❌ NO column headers (Site Name, Location, Collects, etc.)
- ❌ NO tabular layout
- ✅ Card component with expansion
- ✅ Single-site detail view

**Gap Analysis**:

| Feature | Code | Visual | Status |
|---------|------|--------|--------|
| Table2 Component | ✅ Present | ❌ Missing | **FAIL** |
| Column Headers | ✅ Defined | ❌ Not rendered | **FAIL** |
| Row-based Layout | ✅ Expected | ❌ Card-based | **FAIL** |
| EditableCell | ✅ Line 346 | ❌ Spin buttons | **FAIL** |
| Operations Column | ✅ Line 488 | ❌ Not visible | **FAIL** |
| Multi-site View | ✅ `numRows={selectedSites.length}` | ❌ Single site | **FAIL** |

**Root Cause Hypothesis**:

1. **Conditional Rendering Logic**:
   - Code may have conditional that bypasses Table2
   - Check for `if (selectedSites.length === 1)` logic
   - Possible fallback to legacy card component

2. **CSS Display Issue**:
   - Table2 rendered but CSS hides it
   - Card overlaying table

3. **Wrong Component Imported**:
   - Import path error loading old component
   - Build/bundling issue serving cached version

**Verification Needed**:
```typescript
// Check AllocationTab.tsx around line 471-492
{selectedSites.length === 0 ? (
  <Callout>No sites selected</Callout>
) : (
  // IS THERE AN ADDITIONAL CONDITIONAL HERE?
  // Check for: selectedSites.length === 1 ? <Card> : <Table2>
  <Table2 ...>
)}
```

**Priority**: **P0 - BLOCKING** - Implementation fundamentally broken

---

## 📊 Comparison: Expected vs Actual

### Expected (per CODE):

**Available Passes** (LEFT):
```
┌──────┬───────────┬──────────┬─────────┬────────┐
│☐     │ Site Name │ Location │ Quality │ Passes │
├──────┼───────────┼──────────┼─────────┼────────┤
│☑ Site D│ 13.39,.. │   4/5   │    1   │ NaNm   │
│☐ Site B│ -87.96,..│   5/5   │    2   │ NaNm   │
│☑ Site J│  2.72,.. │   5/5   │    3   │ NaNm   │
└──────┴───────────┴──────────┴─────────┴────────┘
```

**Allocated Sites** (RIGHT - EXPECTED):
```
┌───────────┬──────────┬─────────┬──────────┬────────────────┬──────┐
│ Site Name │ Location │ Collects│ Capacity │ Operational    │ Ops  │
├───────────┼──────────┼─────────┼──────────┼────────────────┼──────┤
│ Site D    │ 13.39,.. │  [0]▾   │ 14/209   │ M T W TH       │ [⋯] │
│ Site J    │  2.72,.. │  [0]▾   │ 12/103   │ M T W TH F     │ [⋯] │
└───────────┴──────────┴─────────┴──────────┴────────────────┴──────┘
```
- ✅ Tabular layout
- ✅ Multiple rows visible simultaneously
- ✅ Scannable columns
- ✅ Compact operational days
- ✅ Operations menu (⋯)

---

### Actual (per SCREENSHOT):

**Available Passes** (LEFT):
```
✅ Table2 implementation (CORRECT)
```

**Allocated Sites** (RIGHT - ACTUAL):
```
┌──────────────────────────────────────┐
│ Allocated Sites                      │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Site D                         ▸ │ │
│ │ 1 passes available               │ │
│ │                                  │ │
│ │ Collects    Site Operations      │ │
│ │ (max: 209)   M T W TH SA SU     │ │
│ │      [↑↓]                        │ │
│ │                                  │ │
│ │ Capacity: 14/209 allocated       │ │
│ │ Site infrastructure constraint   │ │
│ │ Ground station operational days  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ (Only ONE site visible at a time)   │
└──────────────────────────────────────┘
```
- ❌ Card-based layout
- ❌ Single site view (no multi-row)
- ❌ Verbose operational days display
- ❌ No visible operations menu
- ❌ Spinner input instead of EditableCell

---

## 🔍 Detailed Issue Breakdown

### Issue #1: Table2 Not Rendered

**Severity**: P0 - BLOCKING

**Expected**:
```tsx
<Table2 className="allocated-sites-table" numRows={2}>
  <Column name="Site Name" />
  <Column name="Collects" />
  ...
</Table2>
```

**Actual**:
```
[Card component with single site]
```

**Impact**:
- Cannot compare multiple sites side-by-side
- Inefficient for managing 3+ allocated sites
- Violates Hick's Law (too much info in single view)

---

### Issue #2: Operational Days Over-Emphasis

**Severity**: P1 - HIGH

**Current**: 7 interactive buttons (M T W TH F SA SU) per site
**Expected**: Compact tag or badge, e.g., `M-TH ●●●●○○○`

**Why This Matters**:
- Operational days are **constraints**, not **primary actions**
- Users shouldn't interact with these frequently in allocation flow
- Takes up 50% of card visual space
- Distracts from primary action (setting collects)

**Recommended Fix**:
```tsx
// Instead of 7 buttons:
<ButtonGroup>
  <Button>M</Button><Button>T</Button>...
</ButtonGroup>

// Use compact display:
<OperationalDaysCompact
  operationalDays={site.operationalDays}
  compact={true}
/>
// Renders: "M-TH ●●●●○○○" or similar
```

---

### Issue #3: Missing Operations Column

**Severity**: P0 - BLOCKING

**Code Shows** (line 376-420):
```tsx
const renderOperationsCell = (rowIndex: number): JSX.Element => {
  return (
    <Cell>
      <ButtonGroup minimal>
        <Button icon={IconNames.INFO_SIGN} />
        <Popover content={<Menu>...</Menu>}>
          <Button icon={IconNames.MORE} />
        </Popover>
      </ButtonGroup>
    </Cell>
  );
};
```

**Visual Shows**:
- ❌ No operations buttons visible
- ❌ No "more" (⋯) menu
- ✅ Chevron (▸) for card expansion (wrong pattern)

**Impact**:
- Users cannot access Edit, Reset, Remove actions
- Actions defined in code but not accessible
- Functional regression

---

### Issue #4: EditableCell Not Used

**Severity**: P1 - HIGH

**Code Shows** (line 346):
```tsx
<EditableCell
  value={collects.toString()}
  onConfirm={(value) => handleCollectsChange(...)}
/>
```

**Visual Shows**:
- Spinner input with ↑↓ buttons
- Label: "Collects (max: 209)"
- Not inline-editable in table

**Impact**:
- Interaction pattern doesn't match Blueprint EditableCell
- Spinner is slower than click-to-edit
- Fails inline editing requirement

---

## 📋 Issue Summary Table

| Issue | Severity | Category | Status |
|-------|----------|----------|--------|
| Table2 not rendered | P0 | Implementation | ❌ BLOCKING |
| Cards still in use | P0 | Visual | ❌ BLOCKING |
| Operational days over-emphasis | P1 | UX/IxD | ⚠️ HIGH |
| Missing operations column | P0 | Functionality | ❌ BLOCKING |
| EditableCell not used | P1 | Interaction | ⚠️ HIGH |
| Single-site view only | P0 | UX | ❌ BLOCKING |
| Pattern inconsistency (left vs right) | P1 | Visual | ⚠️ HIGH |
| Hick's Law violation | P1 | UX | ⚠️ HIGH |
| Jakob's Law violation | P1 | UX | ⚠️ HIGH |

---

## 🛠️ Root Cause Investigation Needed

### Hypothesis 1: Conditional Rendering Bug

**Check**: AllocationTab.tsx around line 471-492

```typescript
{selectedSites.length === 0 ? (
  <Callout intent={Intent.PRIMARY}>No sites selected</Callout>
) : (
  // QUESTION: Is there a hidden condition here?
  // Possible bug: selectedSites.length === 1 ? <LegacyCard> : <Table2>
  <>
    <Table2 ...>
  </>
)}
```

**Action**: Search for conditional logic that bypasses Table2

---

### Hypothesis 2: Wrong Component Build/Import

**Check**: Build output and bundle

```bash
# Verify Table2 is in bundle
grep -r "bp5-table2" build/static/js/*.js

# Check if old component is imported instead
grep -r "AllocatedSitesCard" src/components/
```

**Action**: Verify correct component is loaded at runtime

---

### Hypothesis 3: CSS Display Override

**Check**: AllocationTab.css

```bash
grep -A5 "allocated-sites-table" src/components/UnifiedEditor/OverrideTabs/AllocationTab.css
```

**Possible culprit**:
```css
.allocated-sites-table {
  display: none; /* BUG: Table hidden */
}
```

**Action**: Inspect CSS for display/visibility overrides

---

## ✅ Recommended Fixes

### Fix #1: Ensure Table2 Renders

**File**: `AllocationTab.tsx` line 475-492

**Current** (presumed):
```typescript
{selectedSites.length === 0 ? (
  <Callout>...</Callout>
) : selectedSites.length === 1 ? (
  <SingleSiteCard site={selectedSites[0]} /> // BUG: Card fallback
) : (
  <Table2 ...>
)}
```

**Fixed**:
```typescript
{selectedSites.length === 0 ? (
  <Callout intent={Intent.PRIMARY}>No sites selected</Callout>
) : (
  <Table2
    numRows={selectedSites.length}
    enableRowHeader={false}
    className="allocated-sites-table"
  >
    <Column name="Site Name" cellRenderer={renderAllocatedSiteNameCell} />
    <Column name="Location" cellRenderer={renderLocationCell} />
    <Column name="Collects" cellRenderer={renderCollectsEditableCell} />
    <Column name="Capacity" cellRenderer={renderCapacityCell} />
    <Column name="Operational Days" cellRenderer={renderOperationalDaysCell} />
    <Column name="Operations" cellRenderer={renderOperationsCell} />
  </Table2>
)}
```

**Priority**: P0

---

### Fix #2: Simplify Operational Days Display

**File**: `AllocationTab.tsx` - `renderOperationalDaysCell`

**Current** (presumed):
```typescript
const renderOperationalDaysCell = (rowIndex: number): JSX.Element => {
  return (
    <Cell>
      <ButtonGroup>
        <Button>M</Button>
        <Button>T</Button>
        <Button>W</Button>
        <Button>TH</Button>
        <Button>F</Button>
        <Button>SA</Button>
        <Button>SU</Button>
      </ButtonGroup>
    </Cell>
  );
};
```

**Fixed**:
```typescript
const renderOperationalDaysCell = (rowIndex: number): JSX.Element => {
  const site = selectedSites[rowIndex];

  return (
    <Cell>
      <OperationalDaysCompact
        operationalDays={site.operationalDays}
        showTooltip={true}
      />
    </Cell>
  );
};
```

**Output**: `M-TH ●●●●○○○` (compact, read-only badge)

**Priority**: P1

---

### Fix #3: Verify Operations Column Renders

**File**: `AllocationTab.tsx` line 488

**Ensure**:
```typescript
<Column
  name="Operations"
  cellRenderer={renderOperationsCell}
  // Verify this column is NOT conditionally hidden
/>
```

**Verify** `renderOperationsCell` includes:
```typescript
<ButtonGroup minimal>
  <Tooltip content="View details">
    <Button icon={IconNames.INFO_SIGN} minimal onClick={...} />
  </Tooltip>
  <Popover content={<Menu>...</Menu>}>
    <Button icon={IconNames.MORE} minimal />
  </Popover>
</ButtonGroup>
```

**Priority**: P0

---

## 🎯 Final Verdict

### Overall Assessment

| Category | Expected | Actual | Status |
|----------|----------|--------|--------|
| Visual Implementation | Table2 | Cards | ❌ **FAIL** |
| UX Laws Compliance | Pass | Fail | ❌ **FAIL** |
| Blueprint Compliance | Table2 | Custom Card | ❌ **FAIL** |
| Code vs Visual | Match | Mismatch | ❌ **FAIL** |

---

### Deployment Recommendation

❌ **BLOCKED - REQUIRES REDESIGN**

**Rationale**:
1. ❌ Code specifies Table2, visual shows Cards
2. ❌ Redesign objective (Cards → Tables) NOT achieved
3. ❌ Implementation does not match specification
4. ❌ Multiple P0 blocking issues
5. ❌ UX law violations present

**Estimated Fix Time**: 4-8 hours

---

### Next Steps (Priority Order)

1. **P0**: Identify why Table2 is not rendering
   - Check conditional logic in AllocationTab.tsx:471-492
   - Verify CSS is not hiding table
   - Confirm correct component is built/bundled

2. **P0**: Fix Table2 rendering
   - Remove any single-site card fallback
   - Ensure Table2 renders for selectedSites.length > 0

3. **P0**: Verify Operations column appears
   - Test ButtonGroup + Popover renders
   - Verify actions (Edit, Reset, Remove) work

4. **P1**: Simplify Operational Days display
   - Replace ButtonGroup with OperationalDaysCompact
   - Make it read-only, details in Drawer

5. **P1**: Verify EditableCell for Collects
   - Test inline editing works
   - Remove spinner if present

6. **P1**: Visual regression testing
   - Screenshot comparison
   - Multi-site view (3+ sites)
   - All columns visible

---

## 📸 Visual Evidence

**Current State** (INCORRECT):
- [FINAL-01-modal-full.png](FINAL-01-modal-full.png) - Shows card-based layout
- [workflow-3-allocation-tab.png](workflow-3-allocation-tab.png) - Shows empty state

**Code Specification** (CORRECT):
- [AllocationTab.tsx](src/components/UnifiedEditor/OverrideTabs/AllocationTab.tsx#L477) - Table2 implementation

**Gap**: Code ≠ Visual

---

**Report Generated**: 2025-10-15
**Panel Members**: PM, UX Designer, IxD, Visual Designer, Product Designer
**Verdict**: ❌ **CRITICAL ISSUES - REDESIGN INCOMPLETE**
**Status**: **BLOCKED FOR PRODUCTION**
