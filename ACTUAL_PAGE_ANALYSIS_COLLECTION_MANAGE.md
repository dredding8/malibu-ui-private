# Actual Page Analysis: Collection Management
**URL**: `http://localhost:3000/collection/DECK-1757517559289/manage`

**Date**: 2025-10-01
**Analysis Type**: Live Playwright inspection

---

## 🎯 Critical Finding

**WRONG PAGE ANALYZED!**

The URL `/collection/:id/manage` currently shows the **Collection Opportunities Hub** (list view), **NOT** the legacy override workflow modal.

**Legacy Override Workflow Entry Point**:
- Legacy: "Review Matches" tab → Click row → Modal with two-panel layout
- Current: This page shows opportunities table → Need to click action button → ???

---

## 📸 What We're Actually Looking At

### Current Page: Collection Opportunities Hub

**Visual Layout**:
```
┌────────────────────────────────────────────────────────┐
│ Collection Deck DECK-1757517559289                     │
├────────────────────────────────────────────────────────┤
│ Health & Alerts                                        │
│   52% System Health (red bar - critical issues!)      │
│   6 Critical Issues                                    │
├────────────────────────────────────────────────────────┤
│ Tabs: [Manage Opportunities] [Analytics] [Settings]   │
├────────────────────────────────────────────────────────┤
│ Search: [Search opportunities, satellites...]          │
│ Filters: 10 Total | 6 Critical | 18 Warning | 26 Optimal │
├────────────────────────────────────────────────────────┤
│ TABLE: Collection Opportunities                        │
│ ┌──┬────────┬──────────┬────────┬────────┬─────────┐  │
│ │☐│Health  │Opportunity│Satellite│Priority│Actions │  │
│ ├──┼────────┼──────────┼────────┼────────┼─────────┤  │
│ │☐│⚠️ HI   │Opp 1     │Unit-1  │HIGH    │✏️ 👁️ ⋯ │  │
│ │☐│✅ HI   │Opp 2     │Unit-2  │LOW     │✏️ 👁️ ⋯ │  │
│ │☐│⚠️ HI   │Opp 3     │Unit-3  │CRITICAL│✏️ 👁️ ⋯ │  │
│ └──┴────────┴──────────┴────────┴────────┴─────────┘  │
│ ... (50 opportunities shown)                           │
└────────────────────────────────────────────────────────┘
```

### What We Found

**Playwright Analysis Results**:
- **Mental Model Match**: 38% (3/8 legacy patterns)
- **Primary Component**: CollectionOpportunitiesHub
- **Table Structure**: ✅ Present (50 opportunities)
- **Action Buttons**: ✏️ Edit, 👁️ View, ⋯ More per row
- **Two-Panel Modal**: ❌ Not visible (not opened yet)
- **Override Workflow**: ❌ Not active

---

## 🔍 Missing: The Override Workflow Entry

### Question: How do users access the override workflow?

**Possible Entry Points** (need to test):

1. **Edit Button** (✏️) in each row
2. **More Menu** (⋯) → "Reallocate" option
3. **Row Click** → Opens detail panel/modal
4. **Bulk Selection** → Batch override

Let me trace the actual workflow...

---

## 🧪 Testing Override Workflow Entry

### Test 1: Click Edit Button on First Row
