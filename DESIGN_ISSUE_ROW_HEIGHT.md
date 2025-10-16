# Design Issue: Table Row Height Too Small

**Date**: 2025-10-15
**Component**: AllocationTab - Allocated Sites Table
**Issue**: Row heights are cramped (~30-32px), making content difficult to read
**Priority**: P1 - HIGH (UX/Visual issue)

---

## 🎨 Visual Designer Analysis

### Current State

**Observed Row Height**: ~30-32px (estimated from screenshot)

**Content Per Row**:
- Location: Lat/Lon coordinates
- Collects: Numeric input (3, 2)
- Capacity: "175 available" / "79 available" text
- Operational Days: 4 buttons (M, W, TH, F)

**Problem**: With 4 buttons + text content, rows feel **cramped and difficult to scan**.

---

## ⚡ IxD Perspective

### Fitts's Law Impact

**Current**:
- Row height: ~32px
- Button height: ~28px (minimal Blueprint buttons)
- Vertical spacing: ~2px padding
- **Result**: Difficult to click accurately, buttons very close together

**Recommended**:
- Row height: 48-52px
- Button height: 32px (standard)
- Vertical padding: 8-10px
- **Result**: Comfortable tap targets, easier scanning

**Verdict**: ⚠️ **BORDERLINE Fitts's Law** - Not technically violating (buttons >28px) but **poor ergonomics**

---

## 🎨 Visual Designer Recommendations

### Issue #1: Insufficient Vertical Rhythm

**Current Blueprint Table2 Default**:
```css
.bp5-table-cell {
  height: 30px; /* Blueprint compact default */
  padding: 8px;
}
```

**Problem**: Too compact for content-rich cells (multi-line capacity text + buttons)

**Recommended**:
```css
/* Add to AllocationTab.css */
.allocated-sites-table .bp5-table-cell {
  height: 48px;
  min-height: 48px;
  padding: 12px 8px;
  vertical-align: middle;
}
```

**Rationale**:
- 48px = comfortable reading height
- 12px vertical padding = breathing room
- Aligns with Apple HIG recommendations (44-48pt rows)

---

### Issue #2: Operational Days Buttons Too Crowded

**Current**: 4 buttons (M, W, TH, F) stacked in 32px row
**Visual Weight**: Buttons dominate the row, creating visual clutter

**Recommended Options**:

#### Option A: Increase Row Height (RECOMMENDED)
```css
.allocated-sites-table .bp5-table-cell {
  height: 52px; /* Extra room for buttons */
  padding: 10px 8px;
}

.allocated-sites-table .bp5-button-group .bp5-button {
  height: 32px;
  min-height: 32px;
}
```

**Result**: Buttons have proper spacing, easier to click

---

#### Option B: Compact Button Display
```css
.allocated-sites-table .bp5-button-group .bp5-button {
  height: 24px;
  min-height: 24px;
  font-size: 10px;
  padding: 0 6px;
}
```

**Result**: Smaller buttons fit in ~40px rows, but **harder to click** (not recommended)

---

#### Option C: Badge Display Instead of Buttons (BEST UX)
Replace interactive buttons with read-only badges:

```tsx
// Instead of:
<ButtonGroup>
  <Button>M</Button>
  <Button>W</Button>
  <Button>TH</Button>
  <Button>F</Button>
</ButtonGroup>

// Use:
<div className="operational-days-badges">
  <Tag minimal intent="success">M</Tag>
  <Tag minimal intent="success">W</Tag>
  <Tag minimal intent="success">TH</Tag>
  <Tag minimal intent="success">F</Tag>
</div>
```

```css
.operational-days-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.operational-days-badges .bp5-tag {
  height: 20px;
  line-height: 20px;
  font-size: 10px;
  padding: 0 6px;
}
```

**Result**: More compact, clearer that these are constraints (not actions), row height can be 40-44px

---

## 🏗️ Product Designer Recommendation

### Prioritized Fix Strategy

**Phase 1: Immediate Fix (P1 - Required)**

```css
/* Add to AllocationTab.css line ~275 */

/* Increase row height for better readability and clickability */
.allocated-sites-table .bp5-table-cell {
  height: 48px !important;
  min-height: 48px;
  padding: 12px 8px;
  vertical-align: middle;
}

/* Ensure column headers match */
.allocated-sites-table .bp5-table-column-header-cell {
  height: 40px !important;
  padding: 10px 8px;
}

/* Give buttons proper spacing */
.allocated-sites-table .bp5-button-group {
  gap: 6px;
}

.allocated-sites-table .bp5-button-group .bp5-button {
  min-height: 32px;
  height: 32px;
}
```

**Impact**:
- ✅ Improves readability immediately
- ✅ Better tap targets (Fitts's Law)
- ✅ Professional visual rhythm
- ✅ Minimal code change

**Estimated Time**: 15 minutes

---

**Phase 2: UX Enhancement (P2 - Recommended)**

Replace operational day buttons with Tag badges:

```tsx
// File: AllocationTab.tsx, renderOperationalDaysCell function

const renderOperationalDaysCell = (rowIndex: number): JSX.Element => {
  const site = selectedSites[rowIndex];
  const days = ['M', 'T', 'W', 'TH', 'F', 'SA', 'SU'];

  const activeDays = site.operationalDays?.days || [];

  return (
    <Cell>
      <div className="operational-days-badges">
        {days.map((day, idx) => {
          const isActive = activeDays.includes(idx);
          return (
            <Tag
              key={day}
              minimal
              intent={isActive ? Intent.SUCCESS : Intent.NONE}
              style={{ opacity: isActive ? 1 : 0.3 }}
            >
              {day}
            </Tag>
          );
        })}
      </div>
    </Cell>
  );
};
```

```css
/* Add to AllocationTab.css */
.operational-days-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
}

.operational-days-badges .bp5-tag {
  height: 22px;
  line-height: 22px;
  font-size: 10px;
  padding: 0 6px;
  cursor: default; /* Not clickable */
}
```

**Impact**:
- ✅ Clearer semantics (constraints, not actions)
- ✅ More compact visual
- ✅ Allows row height of 44px (more content space)
- ✅ Better information density

**Estimated Time**: 30 minutes

---

## 📊 Before vs After Comparison

### Current State (Row Height: ~32px)
```
┌──────────┬─────────┬──────────┬─────────────────┐
│ Location │ Collects│ Capacity │ Operational Days│ ← 32px row
├──────────┼─────────┼──────────┼─────────────────┤
│34.08,..  │    3    │175 avail │ [M][W][TH][F]  │ ← Cramped
│          │         │          │ 28px buttons    │
└──────────┴─────────┴──────────┴─────────────────┘
```
❌ **Problems**:
- Buttons cramped (28px in 32px row = 2px padding)
- Hard to click accurately
- Poor visual rhythm
- Capacity text feels squished

---

### Recommended (Phase 1: Row Height 48px)
```
┌──────────┬─────────┬──────────┬─────────────────┐
│ Location │ Collects│ Capacity │ Operational Days│ ← 40px header
├──────────┼─────────┼──────────┼─────────────────┤
│          │         │          │                 │
│34.08,..  │    3    │175 avail │ [M] [W][TH][F] │ ← 48px row
│          │         │          │ 32px buttons    │
│          │         │          │                 │
└──────────┴─────────┴──────────┴─────────────────┘
```
✅ **Improvements**:
- Buttons have 8px vertical padding
- Comfortable tap targets
- Professional visual rhythm
- Text has breathing room

---

### Ideal (Phase 2: Row 44px + Tag Badges)
```
┌──────────┬─────────┬──────────┬─────────────────┐
│ Location │ Collects│ Capacity │ Operational Days│ ← 40px header
├──────────┼─────────┼──────────┼─────────────────┤
│34.08,..  │    3    │175 avail │ M W TH F       │ ← 44px row
│          │         │          │ (22px badges)   │
└──────────┴─────────┴──────────┴─────────────────┘
```
✅ **Best UX**:
- Compact badges (22px)
- Row height 44px (optimal)
- Clear constraint semantics
- More space for other content

---

## 🎯 Implementation: Quick Fix

### File: `/src/components/UnifiedEditor/OverrideTabs/AllocationTab.css`

**Add after line 274** (after `.allocated-sites-table .bp5-table-container`):

```css
/* ============================================
   TABLE ROW HEIGHT FIX
   Increase row heights for better readability and tap targets
   ============================================ */

/* Data rows - increased from default 30px to 48px */
.allocated-sites-table .bp5-table-cell {
  height: 48px !important;
  min-height: 48px;
  padding: 12px 8px;
  vertical-align: middle;
}

/* Column headers - balanced height */
.allocated-sites-table .bp5-table-column-header-cell {
  height: 40px !important;
  min-height: 40px;
  padding: 10px 8px;
  vertical-align: middle;
}

/* Button sizing within cells */
.allocated-sites-table .bp5-button-group {
  gap: 6px; /* Space between buttons */
}

.allocated-sites-table .bp5-button-group .bp5-button {
  min-height: 32px;
  height: 32px;
}

/* Also apply to Available Passes table for consistency */
.available-passes-table .bp5-table-cell {
  height: 44px !important;
  min-height: 44px;
  padding: 10px 8px;
  vertical-align: middle;
}

.available-passes-table .bp5-table-column-header-cell {
  height: 40px !important;
  min-height: 40px;
  padding: 10px 8px;
  vertical-align: middle;
}
```

---

## ✅ Expected Results

### After Fix:

1. **Allocated Sites table**:
   - Row height: 48px (was ~32px)
   - Buttons: 32px with 8px vertical padding
   - Better visual rhythm

2. **Available Passes table**:
   - Row height: 44px (consistent)
   - Comfortable reading
   - Professional appearance

3. **UX Improvements**:
   - ✅ Easier to click buttons (Fitts's Law)
   - ✅ Better scannability (Gestalt)
   - ✅ More professional appearance
   - ✅ Consistent with Apple HIG (44-48pt rows)

---

## 🔍 Testing Checklist

After applying fix:

- [ ] Allocated Sites rows are 48px tall
- [ ] Available Passes rows are 44px tall
- [ ] Buttons are 32px tall with proper spacing
- [ ] Column headers are 40px tall
- [ ] Text is vertically centered
- [ ] No content overflow
- [ ] Scrolling works smoothly
- [ ] Dark mode appearance correct

---

## 📚 References

**Apple Human Interface Guidelines**:
- Recommended row height: 44-48pt
- Tap targets: minimum 44x44pt

**Blueprint Design System**:
- Default table row: 30px (compact)
- Comfortable row: 40-50px
- Button minimum: 30px

**UX Best Practices**:
- Row height should accommodate content + padding
- Buttons need 8-12px vertical padding
- Multi-element rows need 44-52px height

---

**Issue Identified**: 2025-10-15
**Priority**: P1 - HIGH (Impacts usability and professional appearance)
**Estimated Fix Time**: 15 minutes (Phase 1), 30 minutes (Phase 2)
**Status**: ⚠️ **REQUIRES FIX BEFORE DEPLOYMENT**
