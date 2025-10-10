# Legacy Compliance Cleanup Plan

## Roundtable Analysis Summary

Based on comprehensive page analysis, the following issues prevent legacy user mental model alignment:

### ❌ Major Issues Identified

1. **Health & Alerts Widget** - 866px distance from top to table
   - Large dashboard widget showing "46% System Health" and "5 Critical Issues"
   - Not part of legacy system
   - Takes significant vertical space
   - **Location**: `CollectionOpportunitiesHub.tsx:541-607`
   - **Control**: `LEGACY_HIDE_HEALTH_WIDGET` feature flag

2. **Multiple Search Inputs** - 2 search bars detected
   - Redundant search functionality
   - Confusing for users

3. **Extra Tabs** - "Review Matches", "Analytics", "Settings"
   - Not part of legacy 3-tab system (ALL, NEEDS REVIEW, UNMATCHED)
   - **Location**: Need to identify

4. **View Mode Toggle** - Grid/List view buttons
   - Legacy users expect table-only view
   - **Location**: `CollectionOpportunitiesEnhanced.tsx:1267-1278`
   - ButtonGroup with GRID_VIEW and PROJECTS icons

5. **Stats Badges** - "Total, Critical, Warning, Optimal" tags
   - Redundant with tab counts
   - **Location**: `CollectionOpportunitiesEnhanced.tsx:1220-1235`

6. **Bulk Operations Toolbar**
   - May not be part of legacy workflow
   - **Location**: `CollectionOpportunitiesEnhanced.tsx:1309-1317`

7. **Undo/Redo Controls**
   - Need verification if part of legacy workflow
   - **Location**: `CollectionOpportunitiesEnhanced.tsx:1319+`

8. **17 Interactive Elements** above table
   - Too many controls before reaching data
   - Legacy users expect immediate table access

## ✅ Recommended Actions

### Priority 1: Remove Non-Legacy Features

1. **Enable LEGACY_HIDE_HEALTH_WIDGET flag**
   - Set default to `true` in `useFeatureFlags.tsx`
   - Removes Health & Alerts section

2. **Remove View Mode Toggle**
   - Delete ButtonGroup (lines 1267-1278 in CollectionOpportunitiesEnhanced.tsx)
   - Remove viewMode state if not used elsewhere

3. **Remove Stats Badges**
   - Delete stats-badges div (lines 1220-1235 in CollectionOpportunitiesEnhanced.tsx)
   - Keep only "Manage Opportunities" heading

4. **Simplify Search**
   - Keep only one search input
   - Identify and remove duplicate

### Priority 2: Verify and Clean Tabs

5. **Audit Tab System**
   - Ensure only 3 tabs: ALL, NEEDS REVIEW, UNMATCHED
   - Remove "Review Matches", "Analytics", "Settings" tabs

### Priority 3: Review Advanced Features

6. **Evaluate Bulk Operations**
   - Confirm if part of legacy workflow
   - If not, hide or remove

7. **Evaluate Undo/Redo**
   - Confirm if part of legacy workflow
   - If not, remove

## Expected Outcome

After cleanup:
- **Distance to table**: <300px (from 866px)
- **Interactive elements**: <8 (from 17)
- **Clean header**: Page title + tabs + search
- **Immediate data access**: Legacy user expectation met
- **100% legacy column compliance**: Already achieved ✅
- **100% legacy tab compliance**: Already achieved ✅

## Implementation Strategy

1. Enable LEGACY_MODE feature flag cascade
2. Remove view mode toggle and stats badges
3. Clean up tabs to match legacy
4. Verify bulk operations and undo/redo necessity
5. Final validation test

## Success Criteria

- [ ] Health & Alerts section hidden
- [ ] Only 1 search input visible
- [ ] Only 3 tabs: ALL, NEEDS REVIEW, UNMATCHED
- [ ] No view mode toggle
- [ ] No stats badges in header
- [ ] Distance to table <300px
- [ ] <10 interactive elements before table
- [ ] Visual validation matches legacy expectations
