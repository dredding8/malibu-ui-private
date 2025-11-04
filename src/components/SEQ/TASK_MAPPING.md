# SEQ Task Mapping - Satellite Collection Campaign Application

## Task-to-Component Mapping

This document maps the actual user tasks to their implementation in the codebase for SEQ integration.

| Task ID | Task Name | Component/Page | Task Completion Trigger | SEQ Priority | Status |
|---------|-----------|----------------|------------------------|--------------|--------|
| **TASK 1** | Search for a Satellite | `SCCs.tsx` | Search results displayed | P2 - Medium | ⏳ Pending |
| **TASK 2** | Manually Add New Satellite | `AddSCC.tsx` | Form submission success | P1 - High | ✅ Integrated |
| **TASK 3** | Bulk Upload New Satellites | `AddSCC.tsx` (bulk mode) | Upload processing complete | P1 - High | ⏳ Pending |
| **TASK 4** | Edit Satellite Data | `UnifiedOpportunityEditor.tsx` | Save changes success | P1 - High | ✅ Integrated |
| **TASK 5** | Delete a Satellite VUE (KM) | `SCCsTable.tsx` / `SCCs.tsx` | Delete confirmation | P2 - Medium | ⏳ Pending |
| **TASK 6** | Initiate Deck & Generate TLE Data | `CreateCollectionDeck.tsx` Step 1 | Step 1 completion | P1 - High | 🔄 Partial |
| **TASK 7** | Exclude Site Before Matching | `CreateCollectionDeck.tsx` Step 1 | Site exclusion saved | P2 - Medium | ⏳ Pending |
| **TASK 8** | Review and Edit Parameters | `CreateCollectionDeck.tsx` Step 2 | Step 2 completion | P1 - High | 🔄 Partial |
| **TASK 9** | Run the Matching Algorithm | `CreateCollectionDeck.tsx` Step 3 | Matching complete | P1 - High | 🔄 Partial |
| **TASK 10** | Export a Collection Deck | `CollectionDecks.tsx` | Export download | P1 - High | ⏳ Pending |
| **TASK 11** | Find and Download Past Decks | `History.tsx` / `CollectionDecks.tsx` | Deck download | P2 - Medium | ⏳ Pending |

## Detailed Task Analysis

### ✅ TASK 2: Manually Add New Satellite
**Current Integration:** Complete
- **Component:** `AddSCC.tsx`
- **SEQ Task ID:** `add_scc_form`
- **Task Name:** "Add new SCC (form submission)"
- **Trigger:** After successful form submission (handleSave)
- **Comment Enabled:** No (simple form)
- **Sampling:** 33%

---

### ✅ TASK 4: Edit Satellite Data
**Current Integration:** Complete
- **Component:** `UnifiedOpportunityEditor.tsx`
- **SEQ Task IDs:**
  - `edit_opportunity_quick` (quick mode)
  - `edit_opportunity_standard` (standard mode)
  - `edit_opportunity_override` (override mode)
- **Task Names:** "Edit opportunity allocation ({mode} mode)"
- **Trigger:** After successful save (handleSave)
- **Comment Enabled:** Yes (override mode only)
- **Sampling:** 33%

---

### 🔄 TASK 6 + 8 + 9: CreateCollectionDeck Wizard
**Current Integration:** Partial (wizard completion only)
- **Component:** `CreateCollectionDeck.tsx`
- **Current SEQ Task ID:** `create_collection_deck_wizard`
- **Current Task Name:** "Create collection deck (4-step wizard)"
- **Current Trigger:** After final step completion (handleFinish)
- **Comment Enabled:** Yes
- **Sampling:** 33%

**Recommended Enhancement:** Add SEQ after each major step:
- TASK 6: After Step 1 (TLE data generation)
- TASK 7: After site exclusion
- TASK 8: After Step 2 (parameter review)
- TASK 9: After Step 3 (matching algorithm)

---

### ⏳ TASK 1: Search for a Satellite
**Proposed Integration:**
- **Component:** `SCCs.tsx`
- **SEQ Task ID:** `search_satellite`
- **Task Name:** "Search for a satellite"
- **Trigger:** After search results displayed (debounced)
- **Comment Enabled:** No
- **Sampling:** 33%
- **Priority:** P2 (Medium) - Search is quick, SEQ may be intrusive

**Implementation Notes:**
- Trigger SEQ after user pauses on search results (3-5 seconds)
- Only trigger if results found (not on empty results)
- Consider lower sampling rate (20%) due to high frequency

---

### ⏳ TASK 3: Bulk Upload New Satellites
**Proposed Integration:**
- **Component:** `AddSCC.tsx` (bulk upload mode)
- **SEQ Task ID:** `bulk_upload_satellites`
- **Task Name:** "Bulk upload satellites"
- **Trigger:** After bulk upload processing complete
- **Comment Enabled:** Yes (complex task, valuable feedback)
- **Sampling:** 33%
- **Priority:** P1 (High) - Complex workflow, important for UX

**Implementation Notes:**
- Need to identify bulk upload UI/flow in AddSCC.tsx
- May require separate component/modal for bulk operations
- Show SEQ after all satellites processed

---

### ⏳ TASK 5: Delete a Satellite VUE (KM)
**Proposed Integration:**
- **Component:** `SCCsTable.tsx` or `SCCs.tsx`
- **SEQ Task ID:** `delete_satellite`
- **Task Name:** "Delete a satellite"
- **Trigger:** After delete confirmation and success
- **Comment Enabled:** No
- **Sampling:** 33%
- **Priority:** P2 (Medium) - Destructive action, but straightforward

**Implementation Notes:**
- Trigger only after successful deletion
- Not after cancel or error
- Consider if delete is common enough to warrant SEQ

---

### ⏳ TASK 7: Exclude Site Before Matching
**Proposed Integration:**
- **Component:** `CreateCollectionDeck.tsx` Step 1
- **SEQ Task ID:** `exclude_site_before_matching`
- **Task Name:** "Exclude sites before matching"
- **Trigger:** After site exclusion saved (Step 1)
- **Comment Enabled:** No
- **Sampling:** 33%
- **Priority:** P2 (Medium) - Sub-task within wizard

**Implementation Notes:**
- May be better to measure as part of full wizard flow
- Consider if this sub-task warrants separate SEQ
- Could combine with TASK 6 as single "Setup TLE and Sites" task

---

### ⏳ TASK 10: Export a Collection Deck
**Proposed Integration:**
- **Component:** `CollectionDecks.tsx`
- **SEQ Task ID:** `export_collection_deck`
- **Task Name:** "Export a collection deck"
- **Trigger:** After export file downloaded
- **Comment Enabled:** No
- **Sampling:** 33%
- **Priority:** P1 (High) - Critical deliverable action

**Implementation Notes:**
- Trigger after export completes successfully
- May need to detect export format preference
- Consider export complexity (CSV vs PDF vs other formats)

---

### ⏳ TASK 11: Find and Download Past Decks
**Proposed Integration:**
- **Component:** `History.tsx` or `CollectionDecks.tsx`
- **SEQ Task ID:** `find_download_past_decks`
- **Task Name:** "Find and download past decks"
- **Trigger:** After deck download initiated
- **Comment Enabled:** No
- **Sampling:** 33%
- **Priority:** P2 (Medium) - Archive/retrieval task

**Implementation Notes:**
- Measure search + download as combined task
- Trigger after download starts (not just search)
- May combine with TASK 10 if same component/flow

---

## Priority Recommendations

### High Priority (Implement First)
1. **TASK 3:** Bulk Upload - Complex, high-value feedback
2. **TASK 10:** Export Deck - Critical deliverable
3. **TASK 6/7/8/9:** Separate wizard steps - Better granularity

### Medium Priority (Implement Second)
4. **TASK 5:** Delete Satellite - Destructive action feedback
5. **TASK 11:** Download Past Decks - Archive UX
6. **TASK 1:** Search Satellite - High frequency, consider carefully

### Enhancement: Wizard Step Granularity
Currently, the CreateCollectionDeck wizard has a single SEQ at the end. Consider adding SEQ after each major step for better insights:

```typescript
// Current: Single SEQ at end
handleFinish() → SEQ(create_collection_deck_wizard)

// Proposed: SEQ after each step
handleStep1Complete() → SEQ(initiate_deck_generate_tle)  // TASK 6
handleStep2Complete() → SEQ(review_edit_parameters)      // TASK 8
handleStep3Complete() → SEQ(run_matching_algorithm)      // TASK 9
handleFinish()        → SEQ(complete_collection_deck)    // Overall
```

**Trade-off:**
- ✅ Better granularity (know which step is difficult)
- ❌ More survey burden (4 SEQs vs 1)
- **Recommendation:** Use 10-15% sampling per step to balance granularity vs burden

---

## Implementation Checklist

### Immediate Actions (Already Done)
- [x] TASK 2: Add New Satellite (AddSCC.tsx)
- [x] TASK 4: Edit Satellite (UnifiedOpportunityEditor.tsx)
- [x] TASK 6+8+9: Wizard Completion (CreateCollectionDeck.tsx)

### Next Sprint
- [ ] TASK 3: Bulk Upload Satellites
  - [ ] Identify bulk upload flow in codebase
  - [ ] Add SEQ integration
  - [ ] Enable comments for feedback
- [ ] TASK 10: Export Collection Deck
  - [ ] Find export functionality
  - [ ] Add SEQ after export success
- [ ] Wizard Step Granularity Enhancement
  - [ ] Add SEQ after Step 1 (TASK 6)
  - [ ] Add SEQ after Step 2 (TASK 8)
  - [ ] Add SEQ after Step 3 (TASK 9)
  - [ ] Adjust sampling to 15% per step

### Future Enhancements
- [ ] TASK 1: Search Satellite (consider UX impact first)
- [ ] TASK 5: Delete Satellite
- [ ] TASK 11: Download Past Decks
- [ ] Combined task flows (search→download as one task)

---

## SEQ Configuration by Task

| Task | Sampling Rate | Comment | Auto-Dismiss | Rationale |
|------|--------------|---------|--------------|-----------|
| TASK 1 (Search) | 20% | No | 20s | High frequency, quick task |
| TASK 2 (Add) | 33% | No | 30s | Standard form |
| TASK 3 (Bulk) | 33% | Yes | 40s | Complex, valuable feedback |
| TASK 4 (Edit) | 33% | Yes (override) | 30s | Variable complexity |
| TASK 5 (Delete) | 33% | No | 30s | Quick confirmation |
| TASK 6 (TLE) | 15% | No | 30s | Wizard sub-step |
| TASK 7 (Exclude) | 15% | No | 30s | Wizard sub-step |
| TASK 8 (Parameters) | 15% | No | 30s | Wizard sub-step |
| TASK 9 (Matching) | 15% | Yes | 40s | Critical algorithm step |
| TASK 10 (Export) | 33% | No | 30s | Deliverable action |
| TASK 11 (Download) | 33% | No | 30s | Archive retrieval |

---

## Analytics Dashboard Updates

Update SEQAnalyticsDashboard.tsx to show:
- Task completion rates by workflow
- Average difficulty by task type
- Funnel analysis (wizard steps)
- Comparison across satellite management tasks

---

**Last Updated:** 2025-10-20
**Status:** Task mapping complete, 3 of 11 tasks integrated
**Next Review:** After next sprint planning
