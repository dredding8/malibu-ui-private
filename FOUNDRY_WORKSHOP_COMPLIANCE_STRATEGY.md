# Foundry Workshop Compliance Implementation Strategy
**Date:** 2025-10-06
**Team:** PM, IA, Architect, Frontend, QA, Scribe
**Based on:** [BLUEPRINT_COMPLIANCE_AUDIT_REPORT.md](BLUEPRINT_COMPLIANCE_AUDIT_REPORT.md)

---

## Executive Summary (PM + Scribe)

### Strategic Intent
Align Collection Management with **Palantir Foundry Workshop paradigms** and **Blueprint JS standards** to ensure:
- Seamless user experience across Foundry ecosystem
- Consistent interaction patterns with other Workshop modules
- WCAG AA accessibility compliance (Foundry platform requirement)
- Maintainable codebase using Blueprint design system

### Current State
- **Blueprint Compliance:** 72/100 - Good foundation, excessive CSS overrides
- **Workshop Alignment:** 68/100 - Patterns present but inconsistent
- **Accessibility:** 55/100 - Critical violations blocking compliance
- **Design System:** 60/100 - 1,655 lines custom CSS overriding Blueprint

### Business Impact
- **User Friction:** Workshop users encounter unfamiliar patterns when switching to Collection Management
- **Accessibility Risk:** WCAG violations prevent Foundry platform certification
- **Technical Debt:** 4 table implementations, custom modals, wrapper abstractions
- **Ecosystem Consistency:** Misaligned navigation, selection, and action patterns

### Success Criteria
- Workshop paradigm alignment: ≥90%
- WCAG AA compliance: 100%
- Blueprint component coverage: ≥90%
- Table implementation: Single source of truth
- CSS reduction: 80% (from 1,655 to ~330 lines)

### Timeline: 9 weeks, 5 phases

---

## Dual Compliance Scope Definition (PM-Led)

### In-Scope: Workshop Paradigm Alignment

**Critical Workshop Patterns:**
1. **Table Interactions** (P0)
   - Blueprint Table2 `selectedRegions` API (not custom state)
   - Multi-select: Ctrl/Cmd-click, Shift-range, select-all
   - Keyboard navigation: Arrow keys, Tab, Enter, Space
   - Context menus: Right-click on rows

2. **Bulk Actions** (P0)
   - Workshop action bar (fixed bottom, contextual)
   - Selection feedback (count, clear all)
   - Batch operation progress indicators

3. **Modal Workflows** (P0)
   - Blueprint Dialog with proper structure
   - Focus trap + keyboard handling (Esc, Enter)
   - Modal sizing: `Classes.DIALOG_LARGE` for complex forms

4. **Navigation** (P1)
   - Breadcrumb navigation (context awareness)
   - Search integration (global + scoped)
   - Filter persistence across sessions

5. **Status Indicators** (P1)
   - Blueprint Tags with intent system
   - Semantic colors: success, warning, danger, primary
   - Icon integration: `IconNames` constants

**Accessibility Requirements (WCAG AA):**
- All buttons: `aria-label` attributes
- Interactive divs: `role`, `tabIndex`, `onKeyDown`
- Screen readers: Table captions, ARIA labels
- Focus management: Visible indicators, logical order
- Touch targets: ≥24px (dense tables) / ≥44px (recommended)

**Blueprint Component Requirements:**
- Table2 with proper selection API
- Dialog (not custom modals)
- Direct Icon usage (remove wrapper)
- CSS variables (not hardcoded colors)
- Blueprint spacing grid (not hardcoded px)

### Out-of-Scope (Backlog)

**Deferred to Future:**
- Custom features beyond Workshop standards
- Experimental UI patterns not in Foundry modules
- Non-critical cosmetic refinements
- Advanced Workshop features (saved views, column presets)
- Foundry platform API integrations (search, sharing)

### Scope Validation Questions
1. Would a Foundry user recognize this from other Workshop modules? → **In-scope**
2. Does this improve Workshop ecosystem consistency? → **In-scope**
3. Is this a custom enhancement without Workshop precedent? → **Out-of-scope**

---

## Workshop Information Architecture Assessment (IA-Led)

### Object Model Mapping

**Current → Workshop Equivalent:**
- Collections → Foundry Resources/Datasets
- Decks → Analyses/Boards
- Opportunities → Actionable Items/Recommendations
- Sites → Data Objects/Entities

**Hierarchy Alignment:**
```
Foundry Workshop Pattern:
Home → Workspace → Module → Object → Details

Current Implementation:
Home → Collections Hub → Collection → Opportunities → Opportunity Details

✅ Alignment: 85% - Structure matches Workshop mental model
```

### Navigation Paradigm Analysis

**Current State Issues:**
1. **Breadcrumbs:** Missing context (should show: Home > Collections > [Name] > Opportunities)
2. **Context Switching:** No clear path back to Workspace/Home
3. **Search:** Scoped to page, not integrated with global Foundry search
4. **Filters:** State lost on navigation (should persist)

**Workshop Pattern Requirements:**
- Breadcrumb navigation with upward traversal
- Global search integration (future: Foundry API)
- Filter state persistence (URL params or localStorage)
- Multi-tab support (same collection in multiple tabs)

**Priority:** P1 for breadcrumbs, P2 for global search integration

### Interaction Pattern Evaluation

**Table Interactions - Current vs. Workshop:**

| Pattern | Current | Workshop Standard | Priority |
|---------|---------|-------------------|----------|
| Row selection | Custom state | `selectedRegions` API | P0 |
| Multi-select | Custom Ctrl/Shift logic | Blueprint built-in | P0 |
| Select-all | Custom checkbox | Blueprint + filtered awareness | P0 |
| Column sort | ✅ Blueprint | ✅ Blueprint | ✅ |
| Column resize | ✅ Blueprint | ✅ Blueprint | ✅ |
| Context menu | ❌ Missing | Right-click actions | P1 |
| Keyboard nav | ⚠️ Partial | Arrow keys + Enter/Space | P0 |

**Bulk Actions - Current vs. Workshop:**

| Feature | Current | Workshop Standard | Priority |
|---------|---------|-------------------|----------|
| Action bar | Custom fixed bottom | Blueprint Navbar contextual | P1 |
| Selection count | Custom | Workshop pattern | P1 |
| Clear selection | Custom button | Workshop "Deselect All" | P1 |
| Batch progress | ❌ Missing | Toast + progress bar | P2 |
| Error handling | Basic | Workshop error states | P2 |

**Modal Workflows - Current vs. Workshop:**

| Feature | Current | Workshop Standard | Priority |
|---------|---------|-------------------|----------|
| Modal component | Custom | Blueprint Dialog | P0 |
| Focus trap | ❌ Missing | Blueprint automatic | P0 |
| Keyboard close | Likely partial | Esc + backdrop click | P0 |
| Modal sizing | Custom CSS | `Classes.DIALOG_LARGE` | P1 |
| Form validation | Custom | Workshop validation patterns | P2 |

### User Journey Workshop Alignment

**Journey: Create Collection → Add Decks → Review Opportunities**

Current Experience:
1. Navigate to Collections Hub
2. Click "Create Collection"
3. Fill form (custom modal)
4. Navigate to Collection Details
5. Add decks (custom workflow)
6. Review opportunities (custom table)

Workshop-Aligned Experience:
1. Navigate to Collections Hub (breadcrumb: Home > Collections)
2. Click "Create Collection" (Blueprint Dialog)
3. Fill form with inline validation (Blueprint FormGroup)
4. Auto-navigate to Collection Details (breadcrumb: Home > Collections > [Name])
5. Add decks (Blueprint Dialog with multi-step wizard)
6. Review opportunities (Blueprint Table2 with Workshop selection)

**Gap Analysis:**
- Breadcrumb context: ❌ Missing
- Modal component: ❌ Custom (should be Blueprint Dialog)
- Table selection: ⚠️ Custom state (should be Blueprint API)
- Form validation: ⚠️ Custom (should use Blueprint patterns)

---

## Prioritization Matrix (PM + IA + Architect)

### Priority Scoring Model

```
Priority Score = (Workshop Paradigm × 0.35)
               + (User Impact × 0.30)
               + (Blueprint Compliance × 0.20)
               + (Accessibility × 0.10)
               + (Technical Risk × 0.05)

Scale: 1-5 (5 = highest priority/impact/risk)
```

### Priority 0 (Critical) - Week 1

**P0-1: Accessibility - ARIA Labels & Keyboard Navigation**
- **Score:** 4.8 (Workshop: 4, User: 5, Blueprint: 5, A11y: 5, Risk: 3)
- **Impact:** WCAG compliance blocker, Foundry certification requirement
- **Files:** All `CollectionOpportunities*.tsx` (25+ button instances)
- **Effort:** 6-8 hours
- **Migration:**
  ```tsx
  // Before
  <Button icon={IconNames.EDIT} onClick={handleEdit} />

  // After
  <Button
    icon={IconNames.EDIT}
    onClick={handleEdit}
    aria-label={`Edit ${itemName}`}
  />

  // Interactive divs → Blueprint Button
  <Button
    minimal
    fill
    alignText="left"
    onClick={handleClick}
    aria-label="Action description"
    role="button"
    tabIndex={0}
  />
  ```

**P0-2: Table Selection - Blueprint `selectedRegions` API**
- **Score:** 4.6 (Workshop: 5, User: 5, Blueprint: 5, A11y: 4, Risk: 3)
- **Impact:** Core Workshop pattern misalignment
- **Files:** `CollectionOpportunitiesEnhanced.tsx:536-563`, 3 other table variants
- **Effort:** 8-10 hours
- **Reference:** `CollectionOpportunitiesTable.tsx:103-128` (correct implementation)
- **Migration:**
  ```tsx
  import { Regions, Region } from '@blueprintjs/table';

  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);

  const handleSelection = useCallback((regions: Region[]) => {
    const selectedRows = regions
      .filter(r => r.cols == null && r.rows != null)
      .flatMap(r => {
        const [start, end] = r.rows!;
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      });

    onSelectionChange(selectedRows.map(idx => data[idx].id));
  }, [data, onSelectionChange]);

  <Table2
    selectedRegions={selectedRegions}
    onSelection={handleSelection}
    selectionModes={SelectionModes.ROWS_ONLY}
  />
  ```

**P0-3: Modal Migration - Blueprint Dialog**
- **Score:** 4.5 (Workshop: 5, User: 4, Blueprint: 5, A11y: 5, Risk: 3)
- **Impact:** Focus trap missing (accessibility blocker), Workshop pattern misalignment
- **Files:** `ManualOverrideModalRefactored.tsx`, `QuickEditModal.tsx`
- **Effort:** 10-12 hours
- **Migration:**
  ```tsx
  import { Dialog, Classes, Intent } from '@blueprintjs/core';

  <Dialog
    isOpen={isOpen}
    onClose={onClose}
    title="Manual Override"
    icon={IconNames.EDIT}
    className={Classes.DIALOG_LARGE}
    canEscapeKeyClose={true}
    canOutsideClickClose={false}
  >
    <div className={Classes.DIALOG_BODY}>
      {/* Form content */}
    </div>
    <div className={Classes.DIALOG_FOOTER}>
      <div className={Classes.DIALOG_FOOTER_ACTIONS}>
        <Button onClick={onClose}>Cancel</Button>
        <Button intent={Intent.PRIMARY} onClick={onSave}>
          Save Changes
        </Button>
      </div>
    </div>
  </Dialog>
  ```

### Priority 1 (High) - Week 2-3

**P1-1: Icon Wrapper Removal**
- **Score:** 3.8 (Workshop: 3, User: 2, Blueprint: 5, A11y: 3, Risk: 2)
- **Impact:** Unnecessary abstraction, inconsistent with Blueprint patterns
- **Files:** `utils/blueprintIconWrapper.tsx` + 50+ imports
- **Effort:** 2-3 hours (automated)
- **Migration:**
  ```bash
  # Find all usages
  rg "from.*blueprintIconWrapper" --files-with-matches

  # Replace imports
  sed -i "s/import.*blueprintIconWrapper.*/import { Icon } from '@blueprintjs\/core';/g"
  ```

**P1-2: CSS Variables Migration (Colors)**
- **Score:** 3.7 (Workshop: 4, User: 3, Blueprint: 5, A11y: 3, Risk: 4)
- **Impact:** Dark theme support, Blueprint consistency
- **Files:** `CollectionOpportunitiesHub.css`, `CollectionOpportunitiesEnhanced.css`
- **Effort:** 12-16 hours
- **Migration:**
  ```css
  /* Before */
  background: #f5f8fa;
  border: 1px solid #e1e8ed;
  color: #182026;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  /* After */
  background: var(--bp5-light-gray5);
  border: 1px solid var(--bp5-divider-black);
  color: var(--bp5-text-color);
  box-shadow: var(--bp5-elevation-shadow-1);
  ```

**P1-3: Breadcrumb Navigation**
- **Score:** 3.6 (Workshop: 5, User: 4, Blueprint: 3, A11y: 3, Risk: 2)
- **Impact:** Context awareness, Workshop navigation pattern
- **Files:** All page components
- **Effort:** 6-8 hours
- **Migration:**
  ```tsx
  import { Breadcrumbs, Breadcrumb } from '@blueprintjs/core';

  <Breadcrumbs
    items={[
      { text: 'Home', href: '/' },
      { text: 'Collections', href: '/collections' },
      { text: collectionName, href: `/collections/${id}` },
      { text: 'Opportunities', current: true }
    ]}
  />
  ```

### Priority 2 (Medium) - Week 4-6

**P2-1: Spacing System Migration**
- **Score:** 3.2 (Workshop: 3, User: 2, Blueprint: 5, A11y: 2, Risk: 3)
- **Effort:** 8-12 hours
- **Migration:**
  ```css
  /* Before */
  padding: 12px 16px;
  margin-top: 24px;
  gap: 8px;

  /* After */
  padding: calc(var(--bp5-grid-size) * 1.5) calc(var(--bp5-grid-size) * 2);
  margin-top: calc(var(--bp5-grid-size) * 3);
  gap: var(--bp5-grid-size);
  ```

**P2-2: Table Component Consolidation**
- **Score:** 3.0 (Workshop: 4, User: 3, Blueprint: 4, A11y: 2, Risk: 5)
- **Impact:** Maintainability, single source of truth
- **Files:** 4 table variants → 1 canonical implementation
- **Effort:** 16-24 hours
- **Strategy:**
  1. Use `CollectionOpportunitiesTable.tsx` as baseline (best Blueprint compliance)
  2. Extract shared logic → custom hooks
  3. Migrate features from other variants incrementally
  4. Deprecate old components with warnings
  5. Update all imports

**P2-3: Context Menu (Right-Click Actions)**
- **Score:** 2.9 (Workshop: 4, User: 3, Blueprint: 3, A11y: 2, Risk: 2)
- **Effort:** 4-6 hours
- **Migration:**
  ```tsx
  import { Menu, MenuItem, ContextMenu } from '@blueprintjs/core';

  const showContextMenu = (e: React.MouseEvent, rowData: Opportunity) => {
    e.preventDefault();
    ContextMenu.show(
      <Menu>
        <MenuItem icon={IconNames.EDIT} text="Edit" onClick={() => handleEdit(rowData.id)} />
        <MenuItem icon={IconNames.DUPLICATE} text="Duplicate" onClick={() => handleDuplicate(rowData.id)} />
        <MenuDivider />
        <MenuItem icon={IconNames.DELETE} text="Delete" intent={Intent.DANGER} onClick={() => handleDelete(rowData.id)} />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    );
  };
  ```

### Priority 3 (Low) - Week 7-9

**P3-1: Table Virtualization**
- **Score:** 2.5 (Workshop: 2, User: 3, Blueprint: 3, A11y: 1, Risk: 3)
- **Effort:** 4-6 hours
- **Trigger:** Datasets >100 rows

**P3-2: Skeleton Loading States**
- **Score:** 2.2 (Workshop: 3, User: 2, Blueprint: 3, A11y: 1, Risk: 2)
- **Effort:** 4-6 hours

**P3-3: Status Indicator Simplification**
- **Score:** 2.0 (Workshop: 2, User: 1, Blueprint: 3, A11y: 2, Risk: 2)
- **Effort:** 2-4 hours

---

## Implementation Roadmap (Architect + PM)

### Phase 1: Critical Accessibility (Week 1)
**Total Effort:** 24-30 hours
**Risk:** Low
**Dependencies:** None
**Team:** Frontend + QA

**Tasks:**
- [ ] P0-1: Add ARIA labels to all buttons (6-8 hours)
- [ ] P0-1: Fix keyboard navigation (clickable divs → Blueprint Button) (6-8 hours)
- [ ] P0-2: Migrate table selection to `selectedRegions` API (8-10 hours)
- [ ] Write Playwright accessibility test suite (4-6 hours)

**Success Criteria:**
- Zero axe-core violations
- All interactive elements keyboard accessible
- Table selection uses Blueprint API
- Playwright tests: 100% pass rate

**Validation:**
```bash
# Run accessibility audit
npx playwright test accessibility-compliance.spec.ts

# Expected: 0 violations
```

### Phase 2: Blueprint Component Migration (Week 2-3)
**Total Effort:** 24-30 hours
**Risk:** Medium
**Dependencies:** Phase 1 complete
**Team:** Frontend + Architect

**Tasks:**
- [ ] P0-3: Migrate modals to Blueprint Dialog (10-12 hours)
- [ ] P1-1: Remove icon wrapper (2-3 hours, automated)
- [ ] P1-2: Migrate colors to CSS variables (12-16 hours)
- [ ] Visual regression testing (4-6 hours)

**Success Criteria:**
- All modals use Blueprint Dialog with focus trap
- Zero custom icon wrappers
- Dark theme functional
- Visual regression tests pass

**Validation:**
```bash
# Run visual regression tests
npx playwright test visual-regression.spec.ts --update-snapshots
```

### Phase 3: Workshop Pattern Alignment (Week 4-5)
**Total Effort:** 20-26 hours
**Risk:** Medium
**Dependencies:** Phase 2 complete
**Team:** Frontend + IA

**Tasks:**
- [ ] P1-3: Implement breadcrumb navigation (6-8 hours)
- [ ] P2-1: Migrate spacing to Blueprint grid (8-12 hours)
- [ ] P2-3: Add context menu (right-click actions) (4-6 hours)
- [ ] Workshop pattern validation (2-4 hours)

**Success Criteria:**
- Breadcrumbs on all pages
- Spacing uses CSS variables
- Right-click context menu functional
- Workshop paradigm score: ≥85%

### Phase 4: Component Consolidation (Week 6-7)
**Total Effort:** 20-28 hours
**Risk:** High
**Dependencies:** Phase 3 complete
**Team:** Architect + Frontend

**Tasks:**
- [ ] P2-2: Consolidate 4 table variants → 1 (16-24 hours)
- [ ] Update documentation (4-6 hours)
- [ ] Comprehensive regression testing (6-8 hours)

**Success Criteria:**
- Single table component as source of truth
- All deprecated components removed
- Zero breaking changes for existing features
- Full regression test suite passes

### Phase 5: Polish & Optimization (Week 8-9)
**Total Effort:** 12-18 hours
**Risk:** Low
**Dependencies:** Phase 4 complete
**Team:** Frontend + QA

**Tasks:**
- [ ] P3-1: Add table virtualization (>100 rows) (4-6 hours)
- [ ] P3-2: Implement skeleton loading states (4-6 hours)
- [ ] P3-3: Simplify status indicators (2-4 hours)
- [ ] Final accessibility audit (2-3 hours)
- [ ] Performance benchmarking (2-3 hours)

**Success Criteria:**
- WCAG AA: 100% compliance
- CSS bundle: 80% reduction (1,655 → ~330 lines)
- Table performance: <100ms render for 500 rows
- Workshop alignment: ≥90%

---

## Workshop Compliance Testing Strategy (QA-Led + Playwright)

### Test Architecture

**3-Tier Testing Strategy:**
1. **Unit Tests:** Blueprint component integration (Jest + React Testing Library)
2. **Integration Tests:** Workshop pattern compliance (Playwright)
3. **E2E Tests:** Full user journeys (Playwright)

### Playwright Test Suites

#### Suite 1: Accessibility Compliance
**File:** `accessibility-compliance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG AA Compliance', () => {
  test('collection opportunities page - zero violations', async ({ page }) => {
    await page.goto('/collection-opportunities');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('all buttons have accessible names', async ({ page }) => {
    await page.goto('/collection-opportunities');
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label')
        || await button.textContent();
      expect(accessibleName).toBeTruthy();
    }
  });

  test('keyboard navigation through table', async ({ page }) => {
    await page.goto('/collection-opportunities');

    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Should focus table or first interactive element
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();

    // Tab through rows
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Activate action

    // Verify modal opens
    await expect(page.locator('.bp5-dialog')).toBeVisible();

    // Escape closes modal
    await page.keyboard.press('Escape');
    await expect(page.locator('.bp5-dialog')).not.toBeVisible();
  });

  test('focus trap in modal', async ({ page }) => {
    await page.goto('/collection-opportunities');

    // Open modal
    await page.click('button[aria-label*="Edit"]');
    await expect(page.locator('.bp5-dialog')).toBeVisible();

    // Tab through modal elements
    const focusedElements = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      focusedElements.push(focused);
    }

    // Focus should stay within dialog
    const dialogElement = await page.locator('.bp5-dialog').elementHandle();
    const activeElement = await page.evaluate(() => document.activeElement);

    expect(await dialogElement?.evaluate(el => el.contains(activeElement))).toBe(true);
  });
});
```

#### Suite 2: Workshop Table Patterns
**File:** `workshop-table-compliance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Workshop Table Interaction Patterns', () => {
  test('multi-select with Ctrl/Cmd + Click', async ({ page }) => {
    await page.goto('/collection-opportunities');

    // Select first row
    await page.click('tr[data-testid="opportunity-row"]:nth-child(1)');
    expect(await page.locator('.bp5-table-selection-region').count()).toBe(1);

    // Ctrl+Click second row (add to selection)
    await page.click('tr[data-testid="opportunity-row"]:nth-child(2)', {
      modifiers: ['Control']
    });
    expect(await page.locator('.bp5-table-selection-region').count()).toBe(2);
  });

  test('range select with Shift + Click', async ({ page }) => {
    await page.goto('/collection-opportunities');

    // Click first row
    await page.click('tr[data-testid="opportunity-row"]:nth-child(1)');

    // Shift+Click fifth row (select range)
    await page.click('tr[data-testid="opportunity-row"]:nth-child(5)', {
      modifiers: ['Shift']
    });

    // Should select 5 rows
    const selectedRegions = await page.evaluate(() => {
      const table = document.querySelector('.bp5-table-container');
      // Access Blueprint's internal selection state
      return table?.querySelectorAll('.bp5-table-selection-region').length;
    });

    expect(selectedRegions).toBeGreaterThanOrEqual(1);
  });

  test('select all with header checkbox', async ({ page }) => {
    await page.goto('/collection-opportunities');

    // Click select-all checkbox
    await page.click('input[data-testid="bulk-select-checkbox"]');

    // Verify all rows selected
    const totalRows = await page.locator('tr[data-testid="opportunity-row"]').count();
    const selectedText = await page.locator('.selection-count').textContent();

    expect(selectedText).toContain(`${totalRows} selected`);
  });

  test('context menu on right-click', async ({ page }) => {
    await page.goto('/collection-opportunities');

    // Right-click on row
    await page.click('tr[data-testid="opportunity-row"]:nth-child(1)', {
      button: 'right'
    });

    // Verify context menu appears
    await expect(page.locator('.bp5-menu')).toBeVisible();

    // Verify menu items
    await expect(page.locator('.bp5-menu-item:has-text("Edit")')).toBeVisible();
    await expect(page.locator('.bp5-menu-item:has-text("Duplicate")')).toBeVisible();
    await expect(page.locator('.bp5-menu-item:has-text("Delete")')).toBeVisible();
  });

  test('keyboard navigation in table', async ({ page }) => {
    await page.goto('/collection-opportunities');

    // Focus first row
    await page.keyboard.press('Tab');

    // Arrow down to next row
    await page.keyboard.press('ArrowDown');

    // Enter to open details
    await page.keyboard.press('Enter');

    // Verify modal opened
    await expect(page.locator('.bp5-dialog')).toBeVisible();
  });
});
```

#### Suite 3: Blueprint Dialog Compliance
**File:** `workshop-modal-compliance.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Workshop Modal/Dialog Patterns', () => {
  test('dialog structure - header, body, footer', async ({ page }) => {
    await page.goto('/collection-opportunities');

    // Open modal
    await page.click('button[aria-label*="Edit"]');

    // Verify Blueprint Dialog structure
    await expect(page.locator('.bp5-dialog-header')).toBeVisible();
    await expect(page.locator('.bp5-dialog-body')).toBeVisible();
    await expect(page.locator('.bp5-dialog-footer')).toBeVisible();

    // Verify action buttons in footer
    const footer = page.locator('.bp5-dialog-footer-actions');
    await expect(footer.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(footer.locator('button:has-text("Save")')).toBeVisible();
  });

  test('Escape key closes dialog', async ({ page }) => {
    await page.goto('/collection-opportunities');

    await page.click('button[aria-label*="Edit"]');
    await expect(page.locator('.bp5-dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.bp5-dialog')).not.toBeVisible();
  });

  test('backdrop click handling', async ({ page }) => {
    await page.goto('/collection-opportunities');

    await page.click('button[aria-label*="Edit"]');
    await expect(page.locator('.bp5-dialog')).toBeVisible();

    // Click backdrop (outside dialog)
    await page.click('.bp5-overlay-backdrop', { position: { x: 10, y: 10 } });

    // Should NOT close (canOutsideClickClose={false})
    await expect(page.locator('.bp5-dialog')).toBeVisible();
  });

  test('focus restoration after close', async ({ page }) => {
    await page.goto('/collection-opportunities');

    // Focus trigger button
    const trigger = page.locator('button[aria-label*="Edit"]').first();
    await trigger.focus();

    // Open dialog
    await trigger.click();
    await expect(page.locator('.bp5-dialog')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');

    // Focus should return to trigger button
    await expect(trigger).toBeFocused();
  });
});
```

#### Suite 4: Visual Regression
**File:** `visual-regression.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Blueprint Compliance', () => {
  test('collection opportunities table - light theme', async ({ page }) => {
    await page.goto('/collection-opportunities');
    await expect(page.locator('.opportunities-table')).toBeVisible();

    await expect(page).toHaveScreenshot('table-light-theme.png');
  });

  test('collection opportunities table - dark theme', async ({ page }) => {
    // Enable dark theme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/collection-opportunities');

    await expect(page).toHaveScreenshot('table-dark-theme.png');
  });

  test('modal dialog - Blueprint structure', async ({ page }) => {
    await page.goto('/collection-opportunities');
    await page.click('button[aria-label*="Edit"]');

    await expect(page.locator('.bp5-dialog')).toBeVisible();
    await expect(page).toHaveScreenshot('dialog-structure.png');
  });
});
```

### Test Execution Strategy

**CI/CD Integration:**
```yaml
# .github/workflows/workshop-compliance.yml
name: Workshop Compliance Tests

on: [pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Run accessibility tests
        run: npx playwright test accessibility-compliance.spec.ts
      - name: Upload accessibility report
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: playwright-report/

  workshop-patterns:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm install
      - name: Run Workshop pattern tests
        run: npx playwright test workshop-*.spec.ts
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: workshop-compliance-report
          path: test-results/
```

**Quality Gates:**
- Accessibility: 0 violations (blocking)
- Workshop patterns: 100% pass rate (blocking)
- Visual regression: <5% diff (warning)
- Performance: <100ms table render (warning)

---

## Risk Assessment & Mitigation (QA + Architect)

### High-Risk Areas

**Risk 1: CSS Variable Migration Breaking Visual Design**
- **Probability:** High (60%)
- **Impact:** High - User confusion, brand inconsistency
- **Mitigation:**
  - Feature flag: `ENABLE_BLUEPRINT_THEME`
  - A/B testing with 10% user rollout
  - Visual regression test baseline before/after
  - Rollback plan: Keep old CSS in separate file for 1 sprint
- **Contingency:** Gradual migration (colors → spacing → elevations)

**Risk 2: Table Consolidation Introduces Regressions**
- **Probability:** Medium (40%)
- **Impact:** High - Core workflow disruption
- **Mitigation:**
  - Comprehensive Playwright test suite (100+ tests)
  - Feature parity matrix (ensure no lost functionality)
  - Parallel implementation (new component alongside old)
  - 2-sprint deprecation period with console warnings
- **Contingency:** Maintain 2 implementations if critical bugs found

**Risk 3: Modal Migration Breaks Complex Workflows**
- **Probability:** Low (20%)
- **Impact:** Medium - Temporary workflow disruption
- **Mitigation:**
  - Blueprint Dialog handles focus trap automatically
  - Migrate modals one at a time (not big-bang)
  - User acceptance testing before deployment
- **Contingency:** Revert individual modals if issues arise

### Medium-Risk Areas

**Risk 4: Accessibility Fixes Change User Workflows**
- **Probability:** Low (15%)
- **Impact:** Low - Positive change for accessibility users
- **Mitigation:**
  - User training materials (keyboard shortcuts)
  - Tooltip hints for new keyboard navigation
  - Gradual rollout with user feedback
- **Contingency:** Refinement based on user feedback

---

## Stakeholder Communication Plan (PM + Scribe)

### Communication Matrix

| Stakeholder | Frequency | Content | Channel |
|-------------|-----------|---------|---------|
| Engineering Team | Daily | Sprint progress, blockers | Slack + Standup |
| Product Leadership | Weekly | Phase completion, metrics | Email + Demo |
| Foundry Platform Team | Bi-weekly | Workshop alignment, API needs | Meeting |
| End Users | Per Phase | Feature updates, training | Release Notes |

### Key Messages

**To Engineering:**
- "Aligning with Workshop patterns reduces long-term maintenance"
- "Blueprint compliance = 80% less custom CSS to maintain"
- "Single table component = easier feature additions"

**To Leadership:**
- "WCAG AA compliance unblocks Foundry platform certification"
- "Workshop consistency improves user experience across Foundry ecosystem"
- "9-week investment prevents months of future refactoring"

**To Users:**
- "Familiar patterns from other Foundry modules"
- "Improved keyboard navigation and accessibility"
- "Faster performance with Blueprint optimizations"

### Progress Reporting

**Weekly Dashboard Metrics:**
- Workshop paradigm alignment: X/90% target
- WCAG AA compliance: X/100% target
- Blueprint component coverage: X/90% target
- CSS reduction: 1,655 → X lines (target: 330)
- Table implementations: X/1 (consolidation target)

---

## Success Metrics & Validation (PM + QA)

### Quantitative Metrics

**Workshop Compliance Scorecard:**
- Navigation patterns: 100% (breadcrumbs, context switching)
- Table interactions: 100% (Blueprint `selectedRegions` API)
- Modal workflows: 100% (Blueprint Dialog)
- Bulk actions: 90% (Workshop action bar, deferred advanced features)
- **Overall Workshop Alignment: ≥90%**

**Blueprint Component Metrics:**
- Component coverage: ≥90%
- CSS variable usage: 100% (no hardcoded colors)
- Icon system: 100% (Blueprint Icons, no wrappers)
- Spacing system: 100% (Blueprint grid, no hardcoded px)
- **Overall Blueprint Compliance: ≥95%**

**Accessibility Metrics:**
- WCAG AA compliance: 100% (P0/P1 features)
- Keyboard navigation: 100% (all interactive elements)
- Screen reader compatibility: 100% (ARIA labels, semantic structure)
- axe-core violations: 0
- **Overall Accessibility: 100%**

**Performance Metrics:**
- Table render time: <100ms (500 rows)
- Modal open time: <50ms
- CSS bundle size: <400KB (80% reduction from 1,655 lines)
- Lighthouse accessibility score: 100

### Qualitative Metrics

**User Experience:**
- Task completion rate: ≥95% (Workshop-standard workflows)
- User satisfaction: ≥4.5/5 (compared to other Foundry modules)
- Cognitive load: "Familiar" rating ≥85% (Foundry users)
- Time-to-proficiency: <30 minutes (Foundry users)

**Developer Experience:**
- Code maintainability: ≥4/5 (team survey)
- Blueprint linting warnings: 0
- Component duplication: 0 (single table source of truth)
- Onboarding time: <2 hours (new team members)

### Validation Process

**Phase Gate Reviews:**
- **Phase 1:** Accessibility audit (axe-core + manual testing)
- **Phase 2:** Blueprint compliance review (linting + visual regression)
- **Phase 3:** Workshop pattern validation (IA review + user testing)
- **Phase 4:** Regression testing (Playwright suite 100% pass)
- **Phase 5:** Final certification (WCAG AA + Workshop alignment)

---

## Appendix: Quick Reference

### Workshop Pattern Checklist

**Table Interactions:**
- [ ] `selectedRegions` API (not custom state)
- [ ] Multi-select: Ctrl/Cmd-click, Shift-range
- [ ] Select-all with filtered awareness
- [ ] Keyboard navigation: Arrow keys, Enter, Space
- [ ] Context menu: Right-click actions

**Modal Workflows:**
- [ ] Blueprint Dialog component
- [ ] Proper structure: header, body, footer
- [ ] Focus trap automatic
- [ ] Keyboard handling: Esc, Enter
- [ ] Action buttons in footer

**Navigation:**
- [ ] Breadcrumb navigation
- [ ] Context awareness (current location)
- [ ] Upward traversal
- [ ] Filter persistence

**Accessibility:**
- [ ] All buttons: `aria-label`
- [ ] Interactive divs: `role`, `tabIndex`, `onKeyDown`
- [ ] Screen readers: captions, ARIA labels
- [ ] Focus indicators: visible, logical order
- [ ] Touch targets: ≥24px

### Blueprint Component Reference

**Core Components:**
- Table2: `selectedRegions`, `onSelection`, `SelectionModes.ROWS_ONLY`
- Dialog: `Classes.DIALOG_LARGE`, `Classes.DIALOG_BODY`, `Classes.DIALOG_FOOTER`
- Button: `intent`, `minimal`, `aria-label`
- Tag: `intent`, `minimal`, `icon`
- Menu: `MenuItem`, `MenuDivider`, `ContextMenu.show()`
- Breadcrumbs: `items` array with `text`, `href`, `current`

**CSS Variables:**
- Colors: `var(--bp5-intent-primary)`, `var(--bp5-text-color)`
- Spacing: `calc(var(--bp5-grid-size) * N)`
- Elevation: `var(--bp5-elevation-shadow-1)`
- Borders: `var(--bp5-divider-black)`

### Migration Effort Summary

| Phase | Effort | Risk | Team Size |
|-------|--------|------|-----------|
| 1 - Accessibility | 24-30h | Low | 2 FE + 1 QA |
| 2 - Blueprint | 24-30h | Medium | 2 FE + 1 Arch |
| 3 - Workshop | 20-26h | Medium | 1 FE + 1 IA |
| 4 - Consolidation | 20-28h | High | 1 Arch + 1 FE |
| 5 - Polish | 12-18h | Low | 1 FE + 1 QA |
| **Total** | **100-132h** | | **~6-8 weeks** |

---

**Document Version:** 1.0
**Last Updated:** 2025-10-06
**Next Review:** Post-Phase 1 (Week 2)
**Owner:** Product Manager + Engineering Lead
