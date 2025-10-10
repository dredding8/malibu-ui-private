# Live Page Roundtable - What Should Be Visible vs Hidden?
**Date**: 2025-10-01
**Page**: `http://localhost:3000/collection/DECK-1757517559289/manage`
**Objective**: Final decision on what legacy users should see vs what should be hidden

---

## Roundtable Participants

👤 **Legacy Operator Expert** - "What did I use every day?"
🏗️ **System Architect** - "What's technically feasible?"
🔍 **UX Analyst** - "What's the cognitive load impact?"
⚡ **Ruthless PM** - "What ships? What gets cut?"
📋 **Product Scribe** - "Documenting final decisions"

---

## Current Live Page Inventory (From Playwright)

### Page Elements Found:

**Navigation Bar** (Top):
- Data Sources, SCCs, Collections, History, Analytics, Logout

**Page Header**:
- Title: "Collection Deck DECK-1757517559289"
- Subtitle: "Manage satellite collection opportunities..."
- Status: Live indicator (green dot)

**Primary Actions**:
- Refresh button
- Export button
- Back button
- More Actions dropdown (... icon)

**Tabs**:
1. Review Matches
2. Analytics
3. Settings

**Table** (in Review Matches tab):
- Columns: Health, Opportunity, Satellite, Priority, Sites, Actions
- 50 rows (opportunities)
- Per-row actions: Edit icon, Override icon, Refresh icon, More icon (...)

**Search/Filter Area**:
- Search box with placeholder
- Result count display

**Health & Alerts Widget**:
- System Health: 48%
- Critical Issues: 11

---

## Round 1: Legacy Operator - "My Daily Workflow"

**PM**: "Walk us through your typical session in the legacy system."

**Legacy Operator**: "Let me be very specific:

**I log in, I see:**
1. ✅ Navigation to different sections (Data Sources, SCCs, Collections, History)
2. ✅ Collection Deck title and ID
3. ✅ Table with passes (we called them 'passes' not 'opportunities')
4. ✅ Health status icons (green/yellow/red dots)
5. ✅ 'Show All' checkbox (defaulted to OFF - showing Optimal only)

**I do these actions:**
1. ✅ Review the table - look for red/yellow health icons
2. ✅ Click health icon → Override modal opens
3. ✅ Select alternate site (checkboxes)
4. ✅ Add comment (required)
5. ✅ Click 'Allocate'
6. ✅ If capacity warning → Confirm or Cancel
7. ✅ Export deck when done

**I NEVER saw or used:**
- ❌ Analytics tab
- ❌ Settings tab
- ❌ Search box (our decks were 30-50 passes, easy to scan)
- ❌ Edit button per row (only health icon was clickable)
- ❌ Refresh per row (only page-level refresh)
- ❌ More menu per row
- ❌ Filter dropdown (only 'Show All' checkbox)
- ❌ Sort (display order was fixed by priority)
- ❌ 'More Actions' dropdown

**The screen was CLEAN. One action per row - click the health icon, that's it.**"

---

## Round 2: UX Analyst - "Cognitive Load Assessment"

**UX Analysis of Current Page**:

**Visual Complexity Score**: 8/10 (Very Cluttered)

**Issues Identified**:
1. **3 tabs** → Legacy had 0 tabs (just the table)
2. **Search box** → Unnecessary for 50 rows
3. **4 buttons per row** → Legacy had 1 click area (health icon)
4. **Health widget** → Legacy had this inline with title, not separate card
5. **More Actions dropdown** → Adds hidden complexity

**Recommended for Legacy Users**:

**KEEP** ✅:
```
- Navigation bar (standard UI, not harmful)
- Page title and deck ID
- Live status indicator
- Refresh button (page-level)
- Export button
- Back button
- Table with columns: Health, Opportunity, Satellite, Priority, Sites
- Health icons (green/yellow/red)
- Override button per row (ONLY action)
- Show All checkbox (MISSING - must add)
```

**HIDE** ❌:
```
- Analytics tab
- Settings tab
- Search box
- More Actions dropdown
- Edit button per row
- Refresh button per row
- More menu (...) per row
- Health & Alerts widget (data is IN the table already)
- Filter dropdown
- Sort controls
```

**UX Verdict**: "We're showing 3x the UI elements legacy had. Legacy users will be confused and overwhelmed."

---

## Round 3: Architect - "Implementation Feasibility"

**Architect Assessment**:

**Easy Wins** (Already Implemented via Flags):
- ✅ Hide Analytics tab: `LEGACY_HIDE_ANALYTICS_TAB`
- ✅ Hide Settings tab: `LEGACY_HIDE_SETTINGS_TAB`
- ✅ Hide Search box: `LEGACY_HIDE_SEARCH`
- ✅ Hide More Actions: `LEGACY_HIDE_MORE_ACTIONS`

**Medium Effort** (Need Component Changes):
- 🔧 Remove Edit/Refresh/More icons per row (2 hours)
- 🔧 Add Show All checkbox (4 hours)
- 🔧 Hide Health & Alerts widget (30 minutes)

**Hard** (Requires New Components):
- 🔨 Capacity warning modal (6 hours)
- 🔨 Reactive comment workflow (8 hours - P1, not P0)

**Architect Recommendation**:
"Focus on the visible page elements first. Let's get the table clean (1 action per row), add Show All toggle, and hide the Health widget. Those are the visual changes users will notice immediately."

---

## Round 4: PM - "Final Decisions"

**PM Decision Matrix**:

### Navigation Bar
**Decision**: ✅ **KEEP**
**Rationale**: Standard UI, helps users navigate between sections
**Legacy Parity**: Partial (legacy had navigation, different layout)

### Page Header (Title, Subtitle, Status)
**Decision**: ✅ **KEEP**
**Rationale**: Users need to know which deck they're working on
**Legacy Parity**: ✅ Match

### Primary Actions (Refresh, Export, Back)
**Decision**: ✅ **KEEP ALL THREE**
**Rationale**:
- Refresh: Reload latest data ✅ LEGACY
- Export: Export deck to tasking ✅ LEGACY
- Back: Return to deck list ✅ LEGACY

### "More Actions" Dropdown
**Decision**: ❌ **HIDE** (Already done via flag)
**Rationale**: Contains 6 unvalidated features (Filter, Sort, Settings, Help)
**Implementation**: `LEGACY_HIDE_MORE_ACTIONS=true` ✅

### Tabs (Review Matches, Analytics, Settings)
**Decision**:
- Review Matches: ✅ **KEEP**
- Analytics: ❌ **HIDE** (Already done)
- Settings: ❌ **HIDE** (Already done)

**Rationale**: Legacy had no tabs - just the table. Keeping "Review Matches" tab for future-proofing.
**Implementation**: `LEGACY_HIDE_ANALYTICS_TAB=true`, `LEGACY_HIDE_SETTINGS_TAB=true` ✅

### Search Box
**Decision**: ❌ **HIDE** (Already done via flag)
**Rationale**: Unnecessary for 50-row datasets, legacy didn't have it
**Implementation**: `LEGACY_HIDE_SEARCH=true` ✅

### Health & Alerts Widget
**Decision**: ❌ **HIDE FOR LEGACY**
**Rationale**: Redundant - health data is in table icons. Legacy showed health inline with title.
**Implementation**: Add `LEGACY_HIDE_HEALTH_WIDGET` flag 🔧

### Table Columns
**Decision**: ✅ **KEEP ALL** (with naming note)
**Columns**: Health, Opportunity, Satellite, Priority, Sites, Actions
**Note**: "Opportunity" is acceptable - legacy used "Pass" in some contexts but "Opportunity" in others
**Legacy Parity**: ✅ Match

### Per-Row Actions
**Decision**:
- Health icon (clickable): ✅ **KEEP** (implied - part of Health column)
- Override button: ✅ **KEEP** (primary action)
- Edit button: ❌ **HIDE**
- Refresh button: ❌ **HIDE**
- More menu (...): ❌ **HIDE**

**Rationale**: Legacy had ONLY the health icon click → override. One action per row.
**Implementation**: Add `LEGACY_SIMPLE_TABLE_ACTIONS` logic 🔧

### Show All Toggle
**Decision**: ✅ **ADD** (MISSING - P0 blocker)
**Location**: Above table, left side
**Label**: "☐ Show All"
**Default**: Unchecked (Optimal only)
**Implementation**: Create component 🔧

### Result Count Display
**Decision**: ✅ **KEEP**
**Rationale**: Helpful to see "50 opportunities" or "25 of 50 opportunities" (when filtered)
**Legacy Parity**: Partial (legacy showed count, different format)

---

## Round 5: Final Visual Design

**PM**: "Let me paint the picture of what legacy users should see:"

### Top to Bottom Layout:

```
┌─────────────────────────────────────────────────────────────┐
│ [VUE Dashboard] [Data Sources] [SCCs] [Collections]        │
│ [History] [Analytics] [Logout]                              │
├─────────────────────────────────────────────────────────────┤
│ Collection Deck DECK-1757517559289        [● Live]         │
│ Manage satellite collection opportunities...                │
│                                                              │
│ [Refresh] [Export] [Back]                                   │
├─────────────────────────────────────────────────────────────┤
│ 📊 Review Matches Tab                                        │
├─────────────────────────────────────────────────────────────┤
│ ☐ Show All                                    50 opportunities│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Health │ Opportunity  │ Satellite │ Priority │ Sites   ││
│ ├─────────────────────────────────────────────────────────┤│
│ │  🟢   │ Opportunity 1│ WV-3      │ HIGH     │ 3 sites ││
│ │  🟡   │ Opportunity 2│ WV-2      │ MEDIUM   │ 2 sites ││
│ │  🔴   │ Opportunity 3│ GE-1      │ LOW      │ 1 site  ││
│ │  ...  │ ...          │ ...       │ ...      │ ...     ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**REMOVED**:
- ❌ Analytics tab
- ❌ Settings tab
- ❌ Search box
- ❌ More Actions dropdown (...)
- ❌ Health & Alerts widget
- ❌ Edit/Refresh/More icons in table rows
- ❌ Actions column (since health icon IS the action)

**SIMPLIFIED**:
- ✅ Clean header with 3 buttons
- ✅ Single tab (Review Matches)
- ✅ Show All checkbox
- ✅ Table with health icons (clickable)
- ✅ Result count

**Legacy Operator**: "YES. That's what I remember. Clean, simple, one action - click the health icon."

---

## Implementation Plan

### Phase 1: Hide Existing Elements ✅ DONE
- [x] Hide Analytics tab
- [x] Hide Settings tab
- [x] Hide Search box
- [x] Hide More Actions dropdown

### Phase 2: Remove Table Button Clutter 🔧 NEXT
- [ ] Find table component rendering action buttons
- [ ] Add `LEGACY_SIMPLE_TABLE_ACTIONS` conditional
- [ ] Hide Edit button when flag=true
- [ ] Hide Refresh button when flag=true
- [ ] Hide More menu when flag=true
- [ ] Verify only health icon + data remains visible

### Phase 3: Add Missing Features 🔧 NEXT
- [ ] Add Show All checkbox component
- [ ] Position above table, left side
- [ ] Wire to quality tier filtering
- [ ] Default: unchecked (Optimal only)

### Phase 4: Hide Health Widget 🔧 NEXT
- [ ] Add `LEGACY_HIDE_HEALTH_WIDGET` flag
- [ ] Wrap Health & Alerts section with conditional
- [ ] Verify removal doesn't break layout

### Phase 5: Capacity Warning Modal 🔨 P0
- [ ] Create CapacityWarningModal component
- [ ] Trigger before save when capacity >100%
- [ ] Message: "Weekly capacity for [Site] exceeded. Confirm?"

---

## Acceptance Criteria

**Visual Test** (LEGACY_MODE=true):
```
✅ Page shows: Navigation, Title, 3 buttons (Refresh/Export/Back)
✅ Single tab: "Review Matches"
✅ Show All checkbox visible above table
✅ Table shows: Health icons, Opportunity name, Satellite, Priority, Sites
✅ NO Search box
✅ NO More Actions dropdown
✅ NO Analytics/Settings tabs
✅ NO Health & Alerts widget
✅ NO Edit/Refresh/More buttons per row
✅ Result count visible ("50 opportunities")
```

**Interaction Test**:
```
✅ Click health icon → Override modal opens
✅ Click Show All → Table shows all quality tiers
✅ Uncheck Show All → Table shows Optimal only
✅ Click Refresh → Page reloads data
✅ Click Export → Export dialog opens
✅ Click Back → Navigate to History page
```

**Button Count**:
```
Before: 214 buttons
After (LEGACY_MODE=true): ~60 buttons
- 7 navigation buttons
- 3 page action buttons
- 50 health icons (clickable, but not technically buttons)
- 0 per-row action buttons
- 0 dropdown menus
```

---

## Roundtable Consensus

**All Participants**: "This is the right approach. Legacy users get a clean, simple interface that matches what they know. New users can still enable all the advanced features via feature flags."

**PM Final Mandate**:

"Here's the implementation order:

**TODAY** (Next 2 Hours):
1. Hide Health & Alerts widget (30 min)
2. Remove Edit/Refresh/More buttons from table (1.5 hours)

**TOMORROW** (4-6 Hours):
3. Implement Show All checkbox (4 hours)
4. Test with legacy operator (2 hours)

**FRIDAY** (6 Hours):
5. Implement capacity warning modal (6 hours)
6. Final integration test (included)

**SHIP**: Friday EOD if all tests pass.

Now let's find that table component and clean it up."

---

**Status**: ✅ Roundtable Complete
**Next Action**: Implement Phase 2 (Remove Table Button Clutter)
**Owner**: Engineering Team
**Deadline**: Today (2 hours for table cleanup)
