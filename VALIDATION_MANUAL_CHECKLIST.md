# Manual UX Validation Checklist

**Target**: Unified Opportunities Modal at `/collection/TEST-001/manage`
**Redesign**: Cards → Tables (AllocatedSites + AllocationTab)

---

## 🎯 Quick Visual Inspection

### 1. AllocatedSites Section
- [ ] **Table2 Component**: AllocatedSites uses Blueprint Table2 (not cards)
- [ ] **No Cards**: Card components completely removed
- [ ] **Columns Visible**: Site name, status, allocation details
- [ ] **Dark Mode**: Works correctly in both themes

**Expected**: Structured table with rows and columns
**Screenshot**: `.playwright-mcp/validation/allocated-sites-table.png`

---

### 2. Inline Editing (Available Passes)
- [ ] **EditableText**: Click collection name to edit inline
- [ ] **Input Appears**: Text field replaces static text
- [ ] **Save on Enter**: Pressing Enter saves changes
- [ ] **Visual Feedback**: Save indicator or confirmation

**Expected**: Seamless inline editing without modal
**Screenshot**: `.playwright-mcp/validation/inline-edit-active.png`

---

### 3. Site Operations Column
- [ ] **Operations Visible**: New column in Available Passes table
- [ ] **ButtonGroup or Popover**: Uses Blueprint components
- [ ] **Actions Available**: Allocate, Edit, Remove options
- [ ] **Icons Clear**: Recognizable action icons

**Expected**: Operations integrated into table
**Screenshot**: `.playwright-mcp/validation/site-operations-column.png`

---

## ⚖️  UX Laws Validation

### Hick's Law (Decision Complexity)
**Rule**: ≤7 primary actions per screen

**Check**:
1. Count all primary buttons (blue/intent-primary)
2. Count major interactive elements in modal
3. Verify ≤7 for fast decision-making

- [ ] **Primary actions count**: _____ (should be ≤7)
- [ ] **✅ PASS** / **❌ FAIL**: _____

**Impact**: Each additional choice increases decision time by ~0.1-0.2s

---

### Fitts's Law (Target Size)
**Rule**: All tap targets ≥44x44px (iOS), ≥48x48px (Android)

**Check**:
1. Inspect button dimensions in dev tools
2. Check icon-only buttons especially
3. Measure operations menu triggers

- [ ] **Save/Submit button**: _____ x _____ px
- [ ] **Edit icons**: _____ x _____ px
- [ ] **Operations buttons**: _____ x _____ px
- [ ] **All ≥44x44px**: **✅ PASS** / **❌ FAIL**

**Failures**: List any buttons < 44x44px:
- _____________________
- _____________________

---

### Jakob's Law (Familiar Patterns)
**Rule**: Users expect patterns they've seen elsewhere

**Check**:
1. Table sorting: Click column headers
2. Row selection: Checkbox or click behavior
3. Inline editing: Single-click to edit
4. Operations menu: Three-dot menu or button group

- [ ] **Sorting works**: Click headers to sort
- [ ] **Selection standard**: Checkbox or row click
- [ ] **Editing familiar**: Click-to-edit pattern
- [ ] **Menu conventional**: Standard Blueprint pattern

**✅ PASS** / **⚠️  REVIEW**: _____

---

### Gestalt Principles (Visual Grouping)
**Rule**: Related items should be visually grouped

**Check**:
1. Section spacing: 16-24px between unrelated sections
2. Row spacing: <8px between table rows (related)
3. Visual consistency: Similar items look similar

- [ ] **Allocated vs Available**: Clear visual separation
- [ ] **Table rows**: Close spacing (<8px)
- [ ] **Button styles**: Consistent variants (≤3)
- [ ] **Color consistency**: Same actions = same color

**✅ PASS** / **⚠️  REVIEW**: _____

---

## 📦 Blueprint Component Compliance

### Required Components
- [ ] **Table2**: AllocatedSites uses `.bp5-table2`
- [ ] **EditableText**: Collection editing uses `.bp5-editable-text`
- [ ] **ButtonGroup or Popover**: Operations use Blueprint
- [ ] **Dialog/Drawer**: Modal uses `.bp5-dialog` or `.bp5-drawer`
- [ ] **Form Controls**: All inputs use `.bp5-input` etc.
- [ ] **Icons**: All icons use `.bp5-icon`

### Forbidden Patterns
- [ ] **No custom tables**: No `<table>` without `.bp5-` classes
- [ ] **No raw inputs**: No `<input>` without Blueprint wrapper
- [ ] **No custom dropdowns**: No non-Blueprint select/menu

**Component Check**:
```javascript
// Run in browser console
console.log('Blueprint Tables:', document.querySelectorAll('.bp5-table, .bp5-table2').length);
console.log('Custom Tables:', document.querySelectorAll('table:not([class*="bp5"])').length);
console.log('EditableText:', document.querySelectorAll('.bp5-editable-text').length);
```

**✅ COMPLIANT** / **❌ VIOLATIONS**: _____

---

## ♿ Accessibility (WCAG AA)

### Keyboard Navigation
**Test**: Use keyboard only (no mouse)

1. **Tab Through Modal**:
   - [ ] Tab order is logical (top→bottom, left→right)
   - [ ] Focus visible on all elements
   - [ ] No focus traps (except modal itself)

2. **Escape to Close**:
   - [ ] Pressing Escape closes modal
   - [ ] Focus returns to trigger element

3. **Enter/Space Activate**:
   - [ ] Enter activates buttons
   - [ ] Space activates buttons
   - [ ] Arrow keys navigate menus

**Focus Order** (list first 10 tab stops):
1. _____________________
2. _____________________
3. _____________________
...

**✅ PASS** / **❌ FAIL**: _____

---

### Screen Reader Support
**Test**: Use VoiceOver (Mac) or NVDA (Windows)

- [ ] **Dialog Announced**: "Dialog" or "Modal" announced
- [ ] **Modal Title**: Title is announced
- [ ] **Buttons Labeled**: All buttons have clear labels
- [ ] **State Changes**: Success/error messages announced
- [ ] **Table Structure**: Headers and cells properly linked

**Unlabeled Elements** (if any):
- _____________________
- _____________________

**✅ PASS** / **⚠️  WARNINGS**: _____

---

### Color Contrast
**Test**: Use browser DevTools Accessibility panel

**Requirements**:
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- Icons/UI elements: 3:1 minimum

**Check**:
- [ ] **Body text**: _____ : 1 (4.5:1 required)
- [ ] **Button text**: _____ : 1 (4.5:1 required)
- [ ] **Icons**: _____ : 1 (3:1 required)
- [ ] **Disabled states**: _____ : 1 (no requirement)

**Violations** (if any):
- _____________________

**✅ PASS** / **❌ FAIL**: _____

---

## ⚡ Performance

### Render Performance
**Test**: Open DevTools Performance tab

1. **Modal Open Time**:
   - [ ] Click to open modal
   - [ ] Time to interactive: _____ ms (target: <500ms)
   - [ ] **✅ <300ms** / **⚠️  300-500ms** / **❌ >500ms**

2. **Table Render**:
   - [ ] Large dataset (>50 rows)
   - [ ] Check if virtualization active
   - [ ] Smooth scrolling: **✅** / **❌**

3. **Interaction Latency**:
   - [ ] Button click response: _____ ms (target: <100ms)
   - [ ] Inline edit activation: _____ ms
   - [ ] **✅ <100ms** / **⚠️  100-200ms** / **❌ >200ms**

---

### Resource Efficiency
**Test**: DevTools Elements panel

```javascript
// Run in browser console on modal
const modal = document.querySelector('.bp5-dialog, .bp5-drawer');
console.log('DOM nodes:', modal.querySelectorAll('*').length);
console.log('Max depth:', /* calculate nesting depth */);
```

- [ ] **DOM nodes**: _____ (target: <500)
- [ ] **Nesting depth**: _____ (target: <15)
- [ ] **✅ Lightweight** / **⚠️  Moderate** / **❌ Heavy**

---

## 🎨 Visual Consistency

### Design System Adherence
- [ ] **Spacing**: Uses 8px grid (8, 16, 24, 32)
- [ ] **Typography**: Consistent font sizes and weights
- [ ] **Colors**: Uses semantic Blueprint colors
- [ ] **Shadows**: Standard elevation levels

### Cross-Feature Consistency
- [ ] **Matches other modals**: Same Dialog pattern
- [ ] **Matches other tables**: Same Table2 usage
- [ ] **Matches other forms**: Same input styling

**Pattern Deviations** (if any):
- _____________________

**✅ CONSISTENT** / **⚠️  REVIEW**: _____

---

## 📸 Screenshot Documentation

### Required Screenshots
Capture these views for documentation:

1. **Allocated Sites Table** (light mode)
   - [ ] Full table visible
   - [ ] Multiple rows if available
   - Save as: `allocated-sites-table.png`

2. **Inline Editing Active**
   - [ ] Edit mode showing input field
   - [ ] Before/after if possible
   - Save as: `inline-edit-active.png`

3. **Site Operations Menu**
   - [ ] Operations column visible
   - [ ] Menu expanded (if applicable)
   - Save as: `site-operations-menu.png`

4. **Dark Mode**
   - [ ] Same view as #1 but dark theme
   - Save as: `modal-dark-mode.png`

5. **Full Modal**
   - [ ] Entire modal visible
   - [ ] Shows both sections
   - Save as: `unified-modal-full.png`

---

## 📊 Issue Tracking

### P0 - Blocking (Must Fix Before Deploy)
Critical issues that prevent deployment:

1. _____________________
2. _____________________

### P1 - High Priority (Should Fix)
Important issues that should be addressed:

1. _____________________
2. _____________________

### P2 - Medium Priority (Nice to Have)
Improvements that can be deferred:

1. _____________________
2. _____________________

---

## ✅ Final Verdict

### Overall Assessment
- [ ] **Visual Implementation**: ✅ Complete / ⚠️  Issues / ❌ Incomplete
- [ ] **UX Laws Compliance**: ✅ Pass / ⚠️  Warnings / ❌ Fail
- [ ] **Blueprint Compliance**: ✅ Pass / ⚠️  Warnings / ❌ Fail
- [ ] **Accessibility**: ✅ WCAG AA / ⚠️  Warnings / ❌ Fail
- [ ] **Performance**: ✅ Excellent / ⚠️  Acceptable / ❌ Slow

### Deployment Recommendation
- [ ] **✅ APPROVED**: Ready for production
- [ ] **⚠️  APPROVED WITH CONDITIONS**: Fix P1 issues
- [ ] **❌ BLOCKED**: Must address P0 issues

### Next Steps
1. _____________________
2. _____________________
3. _____________________

---

## 📝 Validation Notes

**Tester**: _____________________
**Date**: _____________________
**Environment**: _____________________
**Browser**: _____________________

**Additional Observations**:
_____________________
_____________________
_____________________

---

**Automated Tests**: Once dev server is stable, run:
```bash
npm run test:validate-ux
```

This manual checklist complements the automated test suite.
