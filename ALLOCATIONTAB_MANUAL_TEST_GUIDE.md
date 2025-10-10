# AllocationTab Live Application - Manual Design Testing Guide

**Purpose**: Validate the table conversion design in the live application
**Target Component**: AllocationTab (UnifiedEditor → Allocation Tab)
**Design Team**: Visual Designer, IA Specialist, UX Designer, Product Designer

---

## How to Access AllocationTab in Live Application

### Option 1: Via Collection Management Page
1. Start dev server: `npm start`
2. Navigate to: `http://localhost:3000`
3. Click on any Collection Deck card
4. Click "More Actions" or find an opportunity row
5. Click "Edit" or "Override" to open UnifiedEditor modal
6. Click "Allocation" tab (Tab 1)
7. **Result**: You should see the sites table in the left panel ("Available Passes")

### Option 2: Via Test Page (if available)
1. Navigate to: `http://localhost:3000/test-opportunities`
2. Click any opportunity row to trigger editor
3. Navigate to Allocation tab

---

## Design Validation Checklist

### 🎨 VISUAL DESIGNER - Typography & Hierarchy

**What to Look For**:
- [ ] Table has 9 column headers: Select, Site Name, Location, Quality, Passes, Duration, Elevation, Operations, Capacity
- [ ] Headers use Blueprint font (clear, readable)
- [ ] Rows have alternating background colors (striped)
- [ ] Font size is consistent (13px base)
- [ ] Site names are bold (600 weight)
- [ ] Tags use Blueprint styling (rounded, colored)
- [ ] Progress bars are visible in Capacity column

**Visual Hierarchy**:
- [ ] Primary action (Select checkbox) is left-aligned
- [ ] Site Name stands out as primary identifier
- [ ] Pass properties grouped visually (Quality → Elevation)
- [ ] Capacity visualization clear at a glance

---

### 🏗️ INFORMATION ARCHITECT - Content Organization

**Column Grouping Analysis**:
```
Group 1: Selection        → [Select]
Group 2: Identification   → [Site Name, Location]
Group 3: Pass Properties  → [Quality, Passes, Duration, Elevation]
Group 4: Constraints      → [Operations, Capacity]
```

**Validation Questions**:
- [ ] Can you quickly scan for high-quality sites? (Quality column)
- [ ] Can you identify sites at capacity? (Capacity progress bar)
- [ ] Is the information grouped logically?
- [ ] Are headers clear without explanation?
- [ ] Does the column count feel overwhelming? (Should be 7±2 chunks)

**Findability Test**:
- Task: "Find a site with quality ≥4 and capacity <80%"
- [ ] Can complete in <10 seconds?

---

### 💡 UX DESIGNER - Interaction Patterns

**Hover Interaction**:
- [ ] Hover over any row → background color changes (visual feedback)
- [ ] Cursor changes to pointer (affordance)

**Selection Interaction**:
- [ ] Click checkbox → row becomes selected
- [ ] Selected row has highlighted background
- [ ] Click row anywhere → also toggles selection
- [ ] Checkbox click doesn't propagate to row click

**Multi-Select**:
- [ ] Can select multiple sites
- [ ] Selected sites appear in right panel ("Allocated Sites")
- [ ] Visual count matches actual selection

**Nielsen's Heuristics Quick Check**:
1. **Visibility of system state**: ✅/❌ Selected rows visually distinct?
2. **User control**: ✅/❌ Can easily deselect?
3. **Consistency**: ✅/❌ Matches Blueprint patterns?
4. **Recognition over recall**: ✅/❌ All data visible, no hidden info?

---

### 🎯 PRODUCT DESIGNER - Workshop Compliance

**Blueprint Component Check**:
- [ ] Table uses Blueprint HTMLTable styling
- [ ] Interactive hover states present
- [ ] Striped rows (alternating colors)
- [ ] Bordered cells
- [ ] Tags visible in Quality and Duration columns
- [ ] Progress bars in Capacity column
- [ ] Checkboxes are Blueprint checkboxes

**No Inline Styles** (inspect element):
- [ ] Right-click table → Inspect
- [ ] Check `<table>`, `<tr>`, `<td>` elements
- [ ] Verify NO `style="..."` attributes
- [ ] All styling via CSS classes

**Dark Theme Test**:
1. Open browser DevTools (F12)
2. Console: `document.body.classList.add('bp6-dark')`
3. [ ] Table adapts to dark theme
4. [ ] Selected row background changes
5. [ ] Site names remain readable
6. Console: `document.body.classList.remove('bp6-dark')` (restore)

---

### ♿ ACCESSIBILITY - WCAG 2.1 AA

**Keyboard Navigation**:
- [ ] Press Tab → focus moves to first checkbox
- [ ] Press Tab repeatedly → moves through all checkboxes
- [ ] Press Space on focused checkbox → toggles selection
- [ ] Focus indicators visible (outline)

**Screen Reader Simulation** (optional):
- [ ] Semantic `<table>` element
- [ ] Headers in `<thead>` with `<th>` cells
- [ ] Data in `<tbody>` with `<td>` cells

**Touch Targets**:
- [ ] Checkboxes are at least 24x24px (measure in DevTools)
- [ ] Sufficient spacing between interactive elements

---

## Comparative Analysis: Cards vs Table

### Before (Card Grid)
- ~300px per site card
- Vertical scrolling required
- Whitespace-heavy
- Good for mobile

### After (Table)
- ~50-80px per site row
- Compact, scannable
- Column-aligned data
- Better for desktop

**Questions**:
- [ ] Is the table more scannable than cards?
- [ ] Can you compare sites more easily?
- [ ] Does the density feel appropriate (not too cramped)?
- [ ] Would you prefer this for the collection management workflow?

---

## Design Team Scoring

### Visual Design: ___/10
- Typography clarity
- Visual hierarchy
- Blueprint consistency

### Information Architecture: ___/10
- Logical grouping
- Findability
- Cognitive load

### UX Design: ___/10
- Interaction clarity
- Usability heuristics
- User efficiency

### Workshop Compliance: ___/10
- Blueprint components
- No inline styles
- Design system alignment

### Accessibility: ___/10
- Keyboard navigation
- Semantic HTML
- Touch targets

---

## Overall Assessment

**PASS/FAIL**: _______

**Strengths**:
1.
2.
3.

**Issues Found**:
1.
2.
3.

**Recommendation**:
- [ ] Ship as-is
- [ ] Minor tweaks needed
- [ ] Major revision required

---

## Screenshots to Capture

1. `allocation-tab-default-view.png` - Full table view
2. `allocation-tab-row-hover.png` - Hover state
3. `allocation-tab-row-selected.png` - Selection state
4. `allocation-tab-multi-select.png` - Multiple selections
5. `allocation-tab-dark-theme.png` - Dark mode
6. `allocation-tab-capacity-visualization.png` - Progress bars closeup

---

## Browser DevTools Commands

```javascript
// Add dark theme
document.body.classList.add('bp6-dark');

// Remove dark theme
document.body.classList.remove('bp6-dark');

// Measure element
document.querySelector('.sites-table__cell-select input').getBoundingClientRect();

// Check for inline styles
document.querySelectorAll('.allocation-tab__sites-table [style]').length; // Should be 0

// Get table dimensions
document.querySelector('.allocation-tab__sites-table').getBoundingClientRect();
```

---

**Next Steps**: Complete checklist, capture screenshots, and report findings.