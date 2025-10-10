# Collection Management Actions Roundtable - Legacy Validation
**Date**: 2025-10-01
**Page**: `http://localhost:3000/collection/DECK-1757517559289/manage`
**Objective**: Validate ALL actions against legacy capabilities - ruthless prioritization

---

## Roundtable Participants

👤 **Legacy Operator Expert** - "What did the legacy system actually do?"
🏗️ **System Architect** - "What's the system design intent?"
🔍 **UX Analyst** - "What mental models are we supporting?"
⚡ **Ruthless PM** - "What ships? What gets cut? What's actually validated?"
📋 **Product Scribe** - "Documenting findings and decisions"

---

## Live Page Actions Inventory

### Current State (From Playwright Audit)

**Page-Level Actions**:
1. ✅ Refresh
2. ✅ Export
3. ✅ Back
4. ⚠️ More Actions (4 additional - dropdown)

**Per-Opportunity Actions** (Table Rows):
- 🔴 Override buttons (50 found in table)
- 🔴 Additional action buttons (200 total buttons found)

**Search/Filter**:
- 🔴 Search box
- 🔴 Filter functionality

**Tabs**:
1. ✅ Review Matches (Opportunities)
2. ⚠️ Analytics
3. ⚠️ Settings

---

## 🔥 Ruthless PM Analysis

**PM**: "Let me be blunt. We have 200+ buttons on this page and I see exactly ZERO evidence that any of them match legacy workflows except the override button. Show me the validation."

---

## Round 1: What Did Legacy ACTUALLY Support?

### 👤 Legacy Operator Expert: "The Truth"

**PM**: "What actions existed in the legacy system on the 'Review Matches' screen?"

**Legacy Expert**: "Let me be crystal clear - the legacy system had a **VERY** simple action model:

**Primary Workflow** (90% of use):
1. ✅ **Review system matches** (read-only table view)
2. ✅ **Click health icon** → Opens override modal
3. ✅ **Select alternate site** from checkbox list
4. ✅ **Add comment** (required, inline prompt after first save attempt)
5. ✅ **Allocate** button (with capacity warning if needed)
6. ✅ **Export** final deck to tasking system

**Secondary Actions** (10% of use):
- ✅ **Show All / Optimal Only** toggle (filter passes by quality)
- ✅ **Refresh** (reload latest data)
- ✅ **Back** to collection deck list

**That's it. That's the ENTIRE action surface.**"

**PM**: "So you're telling me legacy had ~10 actions total, and we've implemented 200+ buttons?"

**Legacy Expert**: "Correct. And honestly, even 'Analytics' and 'Settings' tabs didn't exist. Those are NEW features with zero legacy validation."

---

## Round 2: Current Implementation vs Legacy

### 🏗️ Architect: "What We Built"

**Architect Review** of current page actions:

```
VALIDATED LEGACY ACTIONS:
✅ Override button (health icon) - CORE LEGACY FLOW
✅ Export button - LEGACY VALIDATED
✅ Refresh button - LEGACY VALIDATED
✅ Back button - LEGACY VALIDATED
✅ Review Matches tab - LEGACY VALIDATED (renamed from "Manage Opportunities")

UNVALIDATED NEW FEATURES:
❌ Analytics tab - NEW (no legacy equivalent)
❌ Settings tab - NEW (no legacy equivalent)
❌ Search box - NEW (legacy had no search - small datasets)
❌ Filter dropdown - PARTIAL (legacy had only Show All toggle)
❌ More Actions (4) dropdown - NEW (unknown contents)
❌ 150+ mystery table buttons - UNKNOWN PURPOSE
```

**PM**: "Stop. You're telling me we have 150 unidentified buttons in the table?"

**Architect**: "Playwright found 200 total buttons. 50 are override buttons (1 per row). The other 150... I don't know what they do."

---

## Round 3: UX Mental Model Assessment

### 🔍 UX Analyst: "Cognitive Load Disaster"

**UX Analysis**:

**Legacy Mental Model** (Simple):
```
Table Row → Health Icon → Override Modal → Allocate
         └→ Optimal/Show All toggle
```

**Current Mental Model** (Complex):
```
Table Row → ??? (mystery buttons)
         → Override button (which one?)
         → Search (why? dataset is 50 rows)
         → Filter (conflicts with Show All toggle?)
         → Analytics tab (what does this do?)
         → Settings tab (what settings?)
         → More Actions (hidden actions?)
```

**UX Verdict**: "We've introduced 10x the complexity with ZERO evidence users need it. Classic feature creep."

**PM**: "Translation: We built a bunch of stuff nobody asked for and can't validate."

---

## Round 4: Action Validation Matrix

### ⚡ PM: "Ship/Kill/Validate Decision Framework"

| Action | Legacy? | Validated? | PM Decision | Rationale |
|--------|---------|------------|-------------|-----------|
| **Override (health icon)** | ✅ YES | ✅ YES | 🚢 **SHIP** | Core workflow, copy updated |
| **Export** | ✅ YES | ✅ YES | 🚢 **SHIP** | Core workflow |
| **Refresh** | ✅ YES | ✅ YES | 🚢 **SHIP** | Standard action |
| **Back** | ✅ YES | ✅ YES | 🚢 **SHIP** | Navigation |
| **Review Matches tab** | ✅ YES | ✅ YES | 🚢 **SHIP** | Renamed, validated |
| **Show All / Optimal Only** | ✅ YES | ❌ **NOT FOUND** | 🔴 **CRITICAL GAP** | Must implement |
| **Analytics tab** | ❌ NO | ❌ NO | 🗑️ **KILL** | Feature flag OFF for legacy users |
| **Settings tab** | ❌ NO | ❌ NO | 🗑️ **KILL** | Feature flag OFF for legacy users |
| **Search box** | ❌ NO | ❌ NO | 🗑️ **KILL** | Legacy datasets too small to need search |
| **Filter dropdown** | ⚠️ PARTIAL | ❌ NO | 🗑️ **KILL** | Replace with Show All toggle |
| **More Actions (4)** | ❌ NO | ❌ NO | ⚠️ **INVESTIGATE** | What are these? Probably kill |
| **150 mystery buttons** | ❓ UNKNOWN | ❌ NO | 🔴 **INVESTIGATE URGENT** | Blocker to validation |

---

## Round 5: Deep Dive - What Are Those 200 Buttons?

### 🏗️ Architect + 🔍 UX: "Let's Find Out"

**Hypothesis**: The 200 buttons are likely:
1. **50 Override buttons** (1 per opportunity row) ✅ VALIDATED
2. **50 Health icons** (probably same as override) ❓
3. **50 Edit buttons?** ❌ NOT LEGACY
4. **50 Delete buttons?** ❌ NOT LEGACY

**PM**: "We need to RUN THE PAGE and screenshot every damn button. I want a visual audit NOW."

---

## Round 6: Live Page Screenshot Analysis

### 👤 Legacy Expert + 🔍 UX: Reviewing Screenshot

**From `override-modal-copy-audit.png`**:

**Visible Table Columns**:
1. Checkbox (select row)
2. Health icon (colored dots: green/yellow/red)
3. Opportunity name
4. Satellite
5. Priority badge
6. Sites (allocated)
7. **Actions column** with multiple buttons

**Actions Column Contains** (per row):
- 🔴 Pencil icon (Edit?)
- 🔴 Wrench icon (Settings?)
- 🔴 More menu (...)

**Legacy Expert**: "NONE of those existed in legacy. The health icon WAS the only action. You clicked the health status, it opened override. That's it."

**PM**: "So we added Edit, Settings, and More menu PER ROW with ZERO legacy validation?"

**Architect**: "Appears so. Those are probably from the 'enhanced' table component with progressive disclosure features."

**PM**: "Progressive disclosure of WHAT? Features that don't exist in legacy?"

---

## Round 7: Feature Flag Reality Check

### ⚡ PM: "What's Actually Enabled?"

**PM Review of Feature Flags** (from codebase):

```typescript
// CollectionOpportunitiesHub.tsx
const {
  progressiveComplexityUI,         // ❌ Should be OFF for legacy
  enableVirtualScrolling,          // ⚠️ Performance feature, acceptable
  enableWorkspaceMode,             // ❌ Should be OFF for legacy
  enableBatchOperations,           // ❌ Should be OFF for legacy
  enableHealthAnalysis,            // ⚠️ Depends on implementation
  useRefactoredComponents,         // ⚠️ Depends on legacy parity
  enableSplitView,                 // ❌ Should be OFF for legacy
  enableBentoLayout,               // ❌ Should be OFF for legacy
  enableEnhancedBento,             // ❌ Should be OFF for legacy
  ENABLE_NEW_COLLECTION_SYSTEM,    // ❓ What does this do?
  ENABLE_UNIFIED_EDITOR            // ❌ Should be OFF for legacy
} = useFeatureFlags();
```

**PM Decision**: "We need a **LEGACY_MODE** feature flag that:
1. Disables ALL non-legacy features
2. Shows ONLY validated actions
3. Removes progressive complexity UI
4. Hides Analytics/Settings tabs
5. Replaces search/filter with Show All toggle"

**Architect**: "So basically... show the simple table with override buttons only?"

**PM**: "YES. That's what legacy users expect. Everything else is unvalidated feature creep."

---

## Round 8: Critical Missing Features

### 👤 Legacy Expert: "What We're MISSING"

**Legacy Features NOT Implemented**:

1. 🔴 **"Show All" / "Optimal Only" Toggle**
   - **Legacy Behavior**: Checkbox labeled "☐ Show All"
   - **Default**: Unchecked (Optimal passes only)
   - **Checked**: Shows Baseline and Suboptimal passes too
   - **Location**: Top of table, near search area
   - **Criticality**: HIGH - Users relied on this for workflow

2. 🔴 **Capacity Warning Modal**
   - **Legacy Behavior**: Pops up BEFORE save if weekly capacity exceeded
   - **Message**: "Weekly capacity for [Site] exceeded. Confirm allocation?"
   - **Buttons**: [Cancel] [Confirm]
   - **Criticality**: HIGH - Forcing function to prevent errors

3. 🔴 **Reactive Comment Prompt**
   - **Legacy Behavior**: Comment field appears AFTER first save attempt
   - **Current**: Tab-based (wrong orchestration)
   - **Criticality**: MEDIUM - Mental model mismatch

4. 🔴 **Quality Tier Indicators**
   - **Legacy Labels**: "OPTIMAL" (green), "BASELINE" (yellow), "SUBOPTIMAL" (red)
   - **Current**: Unknown badge system
   - **Criticality**: MEDIUM - User recognition

**PM**: "So we built 200 buttons nobody needs, and MISSED the 4 features they actually use?"

**Legacy Expert**: "That's an accurate summary."

---

## Round 9: PM Prioritization

### ⚡ Ruthless PM: "Here's What Ships"

**MUST HAVE (P0) - Blocking Launch**:
1. 🔴 Implement "Show All / Optimal Only" toggle (4 hours)
2. 🔴 Remove all non-legacy action buttons from table (2 hours)
3. 🔴 Feature flag to hide Analytics/Settings tabs (1 hour)
4. 🔴 Implement capacity warning modal (6 hours)

**SHOULD HAVE (P1) - Launch Week 1**:
5. ⚠️ Quality tier labels: OPTIMAL/BASELINE/SUBOPTIMAL (2 hours)
6. ⚠️ Reactive comment prompt (reorchestrate tabs) (8 hours)

**NICE TO HAVE (P2) - Backlog**:
7. 💡 Analytics tab (for NEW users only, feature flagged)
8. 💡 Settings tab (for NEW users only, feature flagged)
9. 💡 Search (if dataset >100 rows in future)

**KILL IMMEDIATELY**:
- 🗑️ Edit button per row (no legacy equivalent)
- 🗑️ Settings icon per row (no legacy equivalent)
- 🗑️ More menu per row (no legacy equivalent)
- 🗑️ Batch operations (no legacy equivalent)
- 🗑️ Workspace mode (no legacy equivalent)
- 🗑️ Progressive complexity UI (confusing for legacy users)

**PM**: "I want those P0 items done THIS WEEK or we don't launch. Everything else waits."

---

## Round 10: Implementation Plan

### 📋 Product Scribe: "Action Items"

**Immediate (Today)**:

1. **Create Playwright Test: Full Action Inventory**
   ```typescript
   test('Catalog ALL buttons and their purposes', async ({ page }) => {
     // Click each button, identify modal/action
     // Screenshot each interaction
     // Document which are legacy vs new
   });
   ```

2. **Create Legacy Mode Feature Flag**
   ```typescript
   const LEGACY_MODE = true; // For migrating users

   if (LEGACY_MODE) {
     // Hide: Analytics, Settings, Search, Filters (except Show All)
     // Show: Simple table, override only, Show All toggle
     // Remove: Edit/Settings/More buttons from rows
   }
   ```

**This Week (P0 Items)**:

3. **Implement Show All Toggle** (4 hours)
   - Checkbox component: "☐ Show All"
   - Default: Optimal only
   - Checked: Show all quality tiers
   - Position: Above table, left side

4. **Remove Non-Legacy Actions** (2 hours)
   - Strip Edit/Settings/More buttons from table rows
   - Keep ONLY override (health icon) button
   - Update component to legacy-only action surface

5. **Hide Unvalidated Tabs** (1 hour)
   ```typescript
   {!LEGACY_MODE && <Tab id="analytics" ... />}
   {!LEGACY_MODE && <Tab id="settings" ... />}
   ```

6. **Capacity Warning Modal** (6 hours)
   - Create modal component
   - Trigger before save if capacity threshold exceeded
   - Message: "Weekly capacity for [Site] exceeded. Confirm allocation?"
   - Buttons: [Cancel] [Confirm]

**Next Week (P1 Items)**:

7. **Quality Tier Labels** (2 hours)
8. **Reactive Comment Workflow** (8 hours)

---

## Round 11: Validation Criteria

### ⚡ PM: "How Do We Know We're Done?"

**Definition of Done**:

✅ **User Recognition Test**:
- Show page to legacy user (no training)
- User can complete override workflow in <2 minutes
- User says: "This looks like the system I know"
- Zero questions about "what does this button do?"

✅ **Action Parity Test**:
- Count actions: Legacy (10) = New (10 ± 1)
- Every action has legacy precedent OR explicit validation
- Zero unvalidated buttons visible to legacy users

✅ **Terminology Test**:
- 100% of button labels match legacy dictionary
- 100% of modal titles match legacy system
- 100% of helper text uses legacy voice/tone

✅ **Feature Flag Test**:
- LEGACY_MODE=true → Looks like legacy (90%+ match)
- LEGACY_MODE=false → Shows new features
- Zero feature leakage between modes

**PM**: "If we can't pass all 4 tests, we don't ship to legacy users. Period."

---

## Round 12: Risk Assessment

### 🏗️ Architect: "What Could Go Wrong?"

**HIGH RISK** 🔴:
1. **Mystery Buttons**: We don't know what 150 buttons do
   - **Mitigation**: Playwright audit, screenshot every button
   - **Deadline**: Tomorrow

2. **Missing Show All**: Critical legacy feature not implemented
   - **Mitigation**: P0 priority, implement this week
   - **Deadline**: Friday

3. **Capacity Warning**: Silent failure if not implemented
   - **Mitigation**: P0 priority, implement this week
   - **Deadline**: Friday

**MEDIUM RISK** ⚠️:
4. **Feature Flag Leakage**: New features visible to legacy users
   - **Mitigation**: Code review, QA testing
   - **Deadline**: Before launch

5. **Quality Tier Confusion**: Wrong labels → user errors
   - **Mitigation**: P1 priority, verify against legacy screenshots
   - **Deadline**: Week 2

**LOW RISK** 💡:
6. **Analytics/Settings Tabs**: Not harmful if hidden
   - **Mitigation**: Feature flag OFF by default
   - **Deadline**: Backlog

---

## Roundtable Consensus

### Final Decisions

**✅ APPROVED FOR LEGACY**:
- Override button (health icon)
- Export, Refresh, Back buttons
- Review Matches tab
- Table columns: Opportunity, Satellite, Priority, Sites, Actions

**🔴 BLOCKING ISSUES** (Must Fix This Week):
1. Implement "Show All / Optimal Only" toggle
2. Remove Edit/Settings/More buttons from table rows
3. Implement capacity warning modal
4. Hide Analytics/Settings tabs behind feature flag

**🗑️ KILLED** (Remove from legacy mode):
- Progressive complexity UI
- Batch operations
- Workspace mode
- Enhanced bento layouts
- Search (datasets too small)
- Per-row edit/settings/more actions

**⏭️ DEFERRED** (Post-Launch):
- Reactive comment workflow improvement
- Quality tier label verification
- Analytics tab (for new users only)
- Settings tab (for new users only)

---

## PM Final Mandate

**PM**: "Here's the deal:

1. **TODAY**: Run full Playwright audit, identify every button
2. **THIS WEEK**: Implement P0 items (Show All, remove buttons, capacity warning, feature flags)
3. **FRIDAY**: User acceptance test with legacy operator
4. **NO SHIP** until all 4 validation criteria pass

We built a lot of cool features. Great. But legacy users don't care about 'cool' - they care about 'works like what I know.'

Feature flags save us here. New features stay for new users. Legacy users get legacy experience. Ship both, target correctly.

Now go find out what those 200 buttons do. I want screenshots on my desk tomorrow morning."

---

## Appendix: Playwright Audit Script

```typescript
// comprehensive-action-audit.spec.ts
test('Full action inventory with screenshots', async ({ page }) => {
  await page.goto('http://localhost:3000/collection/DECK-1757517559289/manage');

  // Find all buttons
  const buttons = await page.locator('button').all();

  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const text = await btn.textContent();
    const title = await btn.getAttribute('title');
    const ariaLabel = await btn.getAttribute('aria-label');

    // Highlight button
    await btn.evaluate(node => {
      node.style.border = '3px solid red';
      node.style.boxShadow = '0 0 10px red';
    });

    // Screenshot
    await page.screenshot({
      path: `action-audit/button-${i}-${title || text || 'unnamed'}.png`,
      fullPage: false
    });

    // Try clicking (if safe)
    if (!text?.includes('Delete') && !text?.includes('Remove')) {
      try {
        await btn.click({ timeout: 1000 });
        await page.waitForTimeout(500);

        // Check what opened
        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          console.log(`Button ${i} (${title || text}) → Opens modal`);
          await page.screenshot({
            path: `action-audit/button-${i}-modal.png`
          });
          await page.keyboard.press('Escape');
        }
      } catch (e) {
        // Not clickable or failed
      }
    }

    // Remove highlight
    await btn.evaluate(node => {
      node.style.border = '';
      node.style.boxShadow = '';
    });
  }
});
```

---

**Roundtable Status**: ✅ Complete
**Next Session**: Post-Audit Review (after button investigation)
**Owner**: PM + Engineering Team
**Validation**: Legacy Operator UAT Required Before Ship
