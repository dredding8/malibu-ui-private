# AllocationTab Table Overflow - Critical Issue Analysis

**Date**: 2025-10-07
**Severity**: 🚨 **CRITICAL** - Blocks production deployment
**Component**: AllocationTab sites table
**Issue**: Horizontal table overflow due to excessive column widths

---

## Problem Statement

The AllocationTab sites table is **overflowing horizontally**, making several columns inaccessible without scrolling. This creates a poor user experience and violates Workshop usability principles.

**User Impact**:
- ❌ Cannot see all columns at once
- ❌ Must horizontal scroll to view Operations and Capacity
- ❌ Breaks comparison task workflow (users can't compare sites efficiently)
- ❌ Poor responsive behavior

---

## Root Cause Analysis

### Column Width Calculations

**Current Implementation** (`AllocationTab.css` lines 50-89):

| Column | Width | Type |
|--------|-------|------|
| Select | 60px | fixed |
| Site Name | 140px | min-width |
| Location | 120px | fixed |
| Quality | 80px | fixed |
| Passes | 70px | fixed |
| Duration | 140px | fixed |
| Elevation | 80px | fixed |
| Operations | 180px | min-width |
| Capacity | 160px | min-width |
| **TOTAL** | **~1,030px** | **minimum** |

**Container Width** (Left Panel):
- Likely: ~600-700px (50% of typical modal width)
- **Overflow**: ~330-430px hidden

### CSS Issue

```css
.allocation-tab__sites-table {
  width: 100%;  /* ← This doesn't prevent overflow! */
  max-height: 600px;
  overflow-y: auto;  /* ← Vertical scroll only */
  /* Missing: overflow-x handling */
}
```

**Problem**: `width: 100%` sets the table container to 100% of parent, but **the columns define their own widths**, causing the table **content** to exceed the container.

---

## Proposed Solutions

### Option 1: Reduce Column Count (Recommended)

**Remove 2-3 columns** to fit within 700px budget:

**Recommended Removals**:
1. **Elevation** (80px) - Low priority metric, can show in tooltip
2. **Location** (120px) - Can show in hover tooltip on Site Name
3. **Operations** (180px) - Move to detail panel or tooltip

**New Schema (6 columns)**:
- Select (60px)
- Site Name (200px) ← increased
- Quality (90px) ← increased
- Passes (80px) ← increased
- Duration (150px) ← increased
- Capacity (180px) ← increased for progress bar

**Total**: ~760px (fits comfortably)

### Option 2: Responsive Column Widths

**Use percentage-based widths** instead of fixed pixels:

```css
.sites-table__col-select {
  width: 8%;  /* ~50-60px at 700px */
}

.sites-table__col-site {
  width: 20%;  /* ~140-160px */
}

.sites-table__col-location {
  width: 15%;
}

.sites-table__col-quality {
  width: 10%;
}

.sites-table__col-passes {
  width: 8%;
}

.sites-table__col-duration {
  width: 15%;
}

.sites-table__col-elevation {
  width: 8%;
}

.sites-table__col-operations {
  width: 12%;
}

.sites-table__col-capacity {
  width: 14%;
}

/* Total: 110% - allows slight overflow for scrollbar */
```

**Pros**:
- Keeps all 9 columns
- Adapts to container width
- Scales with screen size

**Cons**:
- Still tight at smaller widths
- May require horizontal scroll on small screens
- Harder to ensure minimum readable widths

### Option 3: Horizontal Scroll Container (Quick Fix)

**Add explicit overflow handling**:

```css
.allocation-tab__sites-table {
  width: 100%;
  max-height: 600px;
  overflow-x: auto;  /* ← Add horizontal scroll */
  overflow-y: auto;
  display: block;    /* ← Required for overflow to work on table */
}

/* Ensure table doesn't shrink */
.allocation-tab__sites-table table {
  min-width: 1030px;  /* Minimum table width */
}
```

**Pros**:
- Quick CSS-only fix
- Preserves all columns
- No data loss

**Cons**:
- **Poor UX** - users must scroll horizontally
- Breaks comparison workflow
- Violates Workshop usability principles

### Option 4: Collapsible Columns

**Progressive disclosure** - show core columns, expand for details:

**Default View (5 columns)**:
- Select
- Site Name
- Quality
- Passes
- Capacity

**Expanded View (toggle button)**:
- All 9 columns visible

```tsx
<Button
  minimal
  icon="more"
  onClick={() => setShowAllColumns(!showAllColumns)}
>
  {showAllColumns ? 'Show Less' : 'Show More Columns'}
</Button>
```

**Pros**:
- Best of both worlds
- User controls information density
- Preserves all data

**Cons**:
- Requires TSX changes
- More complex implementation

---

## Recommended Solution: **Option 1 + Option 4**

### Phase 1: Immediate Fix (Option 1)
**Remove low-priority columns** to fit within container:

**New 6-Column Schema**:
1. **Select** (60px) - checkbox
2. **Site Name** (220px) - primary identifier
3. **Quality** (100px) - decision criterion
4. **Passes** (90px) - decision criterion
5. **Duration** (180px) - decision criterion (total + threshold)
6. **Capacity** (200px) - decision criterion + progress bar

**Total**: ~850px (comfortable fit in most layouts)

**Removed/Relocated**:
- **Elevation** → Tooltip on Duration tag
- **Location** → Tooltip on Site Name
- **Operations** → Allocated Sites panel (right side)

### Phase 2: Enhancement (Option 4)
**Add "Show All Columns" toggle** for power users who need full details

---

## Implementation

### CSS Changes Required

```css
/* Update column widths for 6-column layout */
.sites-table__col-select {
  width: 60px;
  text-align: center;
}

.sites-table__col-site {
  width: 220px;  /* ← Increased from 140px */
}

.sites-table__col-quality {
  width: 100px;  /* ← Increased from 80px */
  text-align: center;
}

.sites-table__col-passes {
  width: 90px;   /* ← Increased from 70px */
  text-align: center;
}

.sites-table__col-duration {
  width: 180px;  /* ← Increased from 140px */
}

.sites-table__col-capacity {
  width: 200px;  /* ← Increased from 160px */
}

/* Remove unused column styles */
/* .sites-table__col-location - REMOVED */
/* .sites-table__col-elevation - REMOVED */
/* .sites-table__col-operations - REMOVED */
```

### TSX Changes Required

**AllocationTab.tsx** - Update table headers and cells:

```tsx
<thead>
  <tr>
    <th className="sites-table__col-select">Select</th>
    <th className="sites-table__col-site">Site Name</th>
    <th className="sites-table__col-quality">Quality</th>
    <th className="sites-table__col-passes">Passes</th>
    <th className="sites-table__col-duration">Duration</th>
    <th className="sites-table__col-capacity">Capacity</th>
  </tr>
</thead>
<tbody>
  {availableSites.map((site) => (
    <tr key={site.id} className={isSelected ? 'sites-table__row--selected' : ''} onClick={() => handleSiteToggle(site.id)}>
      <td className="sites-table__cell-select">
        <Checkbox checked={isSelected} onChange={() => handleSiteToggle(site.id)} onClick={(e) => e.stopPropagation()} />
      </td>
      <td className="sites-table__cell-site">
        <Tooltip content={`${site.location.lat.toFixed(2)}, ${site.location.lon.toFixed(2)}`}>
          <div className="sites-table__site-name">{site.name}</div>
        </Tooltip>
      </td>
      <td className="sites-table__cell-quality">
        {/* Quality tag */}
      </td>
      <td className="sites-table__cell-passes">
        {passProps?.passCount || 0}
      </td>
      <td className="sites-table__cell-duration">
        {/* Duration group with elevation tooltip */}
        <Tooltip content={`Max Elevation: ${passProps.maxElevation}°`}>
          {/* Duration content */}
        </Tooltip>
      </td>
      <td className="sites-table__cell-capacity">
        {/* Capacity display */}
      </td>
    </tr>
  ))}
</tbody>
```

---

## Updated Design Assessment

### Original Score: 9.0/10

### Revised Score: **6.0/10** ⚠️

**Critical Issues Found**:
1. ❌ **Horizontal overflow** (-2.0 points)
   - Table exceeds container width by ~400px
   - Breaks comparison workflow
   - Poor responsive behavior

2. ❌ **Information Architecture issue** (-1.0 points)
   - 9 columns exceeds cognitive load recommendations
   - Miller's Law: 7±2 chunks (9 is at upper limit)

**Breakdown**:
- Visual Design: 7/10 (-2 for overflow, cramped layout)
- Information Architecture: 7/10 (-2.5 for too many columns, cognitive overload)
- UX Design: 5/10 (-3.5 for broken comparison task, horizontal scroll required)
- Workshop Compliance: 6/10 (-3 for unusable table, responsive failure)
- Accessibility: 8/10 (unchanged - semantic structure still valid)

**New Verdict**: **❌ BLOCKS PRODUCTION - Critical UX issue**

---

## Testing Recommendations

1. **Manual Browser Test**:
   - Navigate to AllocationTab
   - Measure actual container width
   - Measure actual table width
   - Confirm overflow amount

2. **Responsive Testing**:
   - Test at 1920px, 1440px, 1280px widths
   - Verify table remains usable at all sizes

3. **User Testing**:
   - Have users complete comparison task
   - Measure task completion time
   - Gather feedback on column priorities

---

## Next Steps

1. ✅ **Immediate**: Implement Option 1 (reduce to 6 columns)
2. ✅ **Short-term**: Add tooltips for relocated data
3. ⏳ **Medium-term**: Implement Option 4 (collapsible columns)
4. ⏳ **Long-term**: User research to validate column priorities

---

**Priority**: 🚨 **P0 - Blocks Production**
**Estimated Fix Time**: 2-3 hours
**Assigned To**: Design Team + Frontend Engineer
