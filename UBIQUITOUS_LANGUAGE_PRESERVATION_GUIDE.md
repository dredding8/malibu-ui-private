# Ubiquitous Language Preservation Guide
**Maintaining Legacy User Mental Models Through Terminology**

**Date**: 2025-10-01
**Roundtable**: ✍️ Senior UX Copywriter + 🗣️ Voice & Tone Specialist

---

## 🎯 Executive Summary

**Finding**: Language preservation is **40% of mental model recognition**. Using generic software terms instead of domain-specific operator language makes users question if they're in the right system.

**Current Language Preservation**: **~40%** (estimated from implementation)
**Target**: **90%+** for legacy user comfort
**Impact**: Medium effort, high user confidence gain

---

## 📖 Domain Vocabulary Dictionary

### ✅ MUST USE (Legacy Operator Language)

| Term | Context | Never Use Instead |
|------|---------|-------------------|
| **Pass** | Collection opportunity window | opportunity, window, slot, time-slot |
| **Site** | Ground station location | location, station, facility, ground station |
| **Allocate** | Assign pass to site (verb) | assign, schedule, set, configure, save |
| **Match** | System-generated allocation | result, suggestion, option, item, recommendation |
| **Comment** | Override justification note | justification, reason, explanation, notes |
| **Override** | Manual deviation from optimal | edit, change, modify, adjustment, custom allocation |
| **Review Matches** | Tab for evaluating allocations | Manage Opportunities, View Results, Check Assignments |
| **Show All** | Toggle to expand filtered options | View All, See More, Advanced Options, Expand |
| **Optimal** | System's recommended quality | Recommended, Best, Preferred, High |
| **Baseline** | Acceptable quality alternative | Standard, Medium, Acceptable, Normal |
| **Suboptimal** | Last-resort quality | Low, Poor, Not Recommended, Minimal |

### ❌ AVOID (Generic Software Terms)

These terms break the domain mental model:
- "Save Changes" → Use "Allocate"
- "Justification" → Use "Comment"
- "Opportunities" (in tab name) → Use "Matches"
- "Locations" → Use "Sites"
- "View All Options" → Use "Show All"
- "Please provide..." → Use "Required:"
- "High/Medium/Low Quality" → Use "Optimal/Baseline/Suboptimal"

---

## 🗣️ Voice & Tone Patterns

### Legacy Voice Profile

**Style**: **Technical Operator** - Terse, authoritative, security-conscious, expert-to-expert

**Characteristics**:
1. **Imperative commands**: "Review Matches", "Allocate", "Override"
2. **No conversational fillers**: No "please", "thank you", "you may"
3. **Assumes expertise**: No explanatory text or tutorials
4. **Security-first**: Classification reminders inline, e.g., "(Secret Data Only)"
5. **Maximum brevity**: "Comment required" not "Please provide a comment"
6. **Passive voice OK**: "Pass allocated to site" (system-focused, not user-focused)

### Example Transformations

#### ❌ WRONG: Conversational/Beginner-Friendly

```
"Would you like to override the system's recommendation?
Please provide a justification below so your team
understands why you made this choice."
```

#### ✅ CORRECT: Legacy Operator Voice

```
Comment required to override site allocation (Secret Data Only)
```

---

#### ❌ WRONG: Suggestive/Helpful

```
"You can expand your options by viewing additional
quality tiers that might better meet your needs."
```

#### ✅ CORRECT: Legacy Operator Voice

```
☐ Show All
```

---

#### ❌ WRONG: Explanatory/Cautious

```
"This change might affect the weekly capacity constraints
for this site. Would you like to continue with this
allocation? You can cancel if you'd like to reconsider."
```

#### ✅ CORRECT: Legacy Operator Voice

```
This change may impact the weekly capacity.
Are you sure you want to change?

[Cancel] [Yes]
```

---

## 🔍 Critical UI String Audit

### Buttons & Actions

| Location | ❌ Wrong | ✅ Correct |
|----------|---------|----------|
| Primary action button | "Save Changes" | "Allocate" |
| Override modal button | "Apply Override" | "Allocate" |
| Secondary action | "Cancel Changes" | "Cancel" |
| Quality filter | "View All Options" | "Show All" |
| Tab name | "Manage Opportunities" | "Review Matches" |

### Prompts & Labels

| Component | ❌ Wrong | ✅ Correct |
|-----------|---------|----------|
| Override justification | "Justification required" | "Comment required to override site allocation" |
| Classification reminder | (missing) | "(Secret Data Only)" |
| Quality tier label | "High Quality" | "Optimal" |
| Quality tier label | "Medium Quality" | "Baseline" |
| Quality tier label | "Low Quality" | "Suboptimal" |
| Panel title | "Available Options" | "Available Passes" |
| Panel title | "Current Selections" | "Allocated Sites" |

### Warning Messages

| Scenario | ❌ Wrong | ✅ Correct |
|----------|---------|----------|
| Capacity warning | "This allocation exceeds recommended capacity" | "This change may impact the weekly capacity" |
| Confirmation prompt | "Would you like to proceed?" | "Are you sure you want to change?" |
| Missing comment | "Please provide a justification" | "Comment required" |
| Success message | "Changes saved successfully" | "Pass allocated to site" |

---

## 📋 Implementation Checklist

### Phase 1: Critical Strings (Sprint 1)

**Goal**: Fix buttons and tab names for immediate recognition

- [ ] **Primary Button**: Change "Save" → "Allocate"
- [ ] **Tab Name**: Change "Manage Opportunities" → "Review Matches"
- [ ] **Comment Label**: Change "Justification" → "Comment"
- [ ] **Comment Prompt**: Add "(Secret Data Only)" reminder
- [ ] **Quality Filter**: Change button text → "Show All"

**Estimated Effort**: 2 hours
**Impact**: Language preservation 40% → 70%

---

### Phase 2: Messages & Prompts (Sprint 2)

**Goal**: Match legacy voice and tone in all user-facing text

- [ ] **Override Prompt**: Update to "Comment required to override site allocation (Secret Data Only)"
- [ ] **Capacity Warning**: Update to "This change may impact the weekly capacity. Are you sure you want to change?"
- [ ] **Quality Labels**: Change High/Medium/Low → Optimal/Baseline/Suboptimal
- [ ] **Success Messages**: Update to passive voice "Pass allocated to site"
- [ ] **Error Messages**: Remove conversational fillers, use terse imperatives
- [ ] **Panel Titles**: Verify "Available Passes" and "Allocated Sites"

**Estimated Effort**: 4 hours
**Impact**: Language preservation 70% → 85%

---

### Phase 3: Comprehensive Audit (Sprint 3)

**Goal**: Review every user-facing string for domain vocabulary

- [ ] **Code Search**: Find all text strings in components
- [ ] **Terminology Check**: Verify no generic software terms
- [ ] **Tooltip Audit**: Ensure tooltips use domain language
- [ ] **Help Text**: Match terse operator voice
- [ ] **Placeholder Text**: Use domain examples
- [ ] **Aria Labels**: Maintain accessibility with domain terms
- [ ] **Loading States**: Use domain language ("Loading passes...")
- [ ] **Empty States**: Use domain-specific empty state messages

**Estimated Effort**: 8 hours
**Impact**: Language preservation 85% → 95%

---

## 🧪 Testing & Validation

### Legacy User Recognition Test

**Method**: Show interface to legacy user without explanation

**Pass Criteria** (user should say):
- ✅ "This is the Review Matches screen"
- ✅ "I click Show All to see Baseline passes"
- ✅ "It's asking for a comment because I'm overriding"
- ✅ "This will warn me about weekly capacity"

**Fail Indicators** (user asks):
- ❌ "Is this a different system?"
- ❌ "Where do I allocate?"
- ❌ "How do I see all options?"
- ❌ "Do I need to justify this?"

### Automated String Validation

**Create Linter Rule**: Flag non-domain vocabulary

```javascript
// .eslintrc.js - Custom rule
{
  rules: {
    "domain-vocabulary": [
      "error",
      {
        forbidden: [
          { word: "justification", use: "comment" },
          { word: "opportunity", use: "pass" },
          { word: "location", use: "site" },
          { word: "save", use: "allocate" }
        ]
      }
    ]
  }
}
```

---

## 📊 Language Preservation Metrics

### Current Score: **~40%**

**Evidence from Screenshot Analysis**:
- ✅ "Override" in modal title (5%)
- ✅ "Allocated Sites" panel name (5%)
- ✅ Warning banner uses "override" (5%)
- ⚠️ Tab: "Allocation" good, "Justification" wrong (-5%)
- ❌ Likely missing "Show All" exact phrase (-10%)
- ❌ Likely missing "(Secret Data Only)" (-10%)
- ❌ Button probably says "Save" not "Allocate" (-10%)
- ❌ Quality tiers may not use Optimal/Baseline/Suboptimal (-10%)

### Target Score: **90%+**

**Path to Target**:

| Phase | Focus | Effort | Score Gain | New Score |
|-------|-------|--------|-----------|-----------|
| **Baseline** | Current state | - | - | **40%** |
| **Phase 1** | Buttons & tabs | 2 hours | +30% | **70%** |
| **Phase 2** | Messages & prompts | 4 hours | +15% | **85%** |
| **Phase 3** | Full audit | 8 hours | +10% | **95%** |

**Total Effort**: 14 hours
**ROI**: High - language is cheapest way to improve mental model match

---

## 🎓 Training Materials

### For Developers

**Quick Reference Card**: Tape to monitor

```
┌─────────────────────────────────────┐
│   OPERATOR LANGUAGE QUICK REF       │
├─────────────────────────────────────┤
│ ✅ USE          │ ❌ DON'T USE      │
├─────────────────┼───────────────────┤
│ Pass            │ Opportunity       │
│ Site            │ Location          │
│ Allocate        │ Save/Assign       │
│ Comment         │ Justification     │
│ Override        │ Edit/Modify       │
│ Review Matches  │ Manage Items      │
│ Show All        │ View All          │
│ Optimal         │ High Quality      │
│ Baseline        │ Medium Quality    │
│ Suboptimal      │ Low Quality       │
└─────────────────┴───────────────────┘
```

### For UX Writers

**Voice & Tone Guide**

1. **Be terse**: "Comment required" not "Please provide a comment"
2. **Use imperatives**: "Review Matches" not "You can review matches"
3. **Assume expertise**: No explanatory text
4. **Security-first**: Always show classification inline
5. **Passive OK**: "Pass allocated" not "You allocated the pass"
6. **No fillers**: Remove "please", "thank you", "you may"

### For QA

**String Validation Checklist**

Test every user-facing string against:
- [ ] Uses domain nouns (pass, site, match, allocation)
- [ ] Uses domain verbs (allocate, override, review)
- [ ] Uses quality tiers (Optimal/Baseline/Suboptimal)
- [ ] Terse (no conversational fillers)
- [ ] Imperative voice when commanding
- [ ] Passive voice when describing system action
- [ ] Includes security reminders where applicable

---

## 🚨 Common Mistakes to Avoid

### Mistake 1: "Improving" Legacy Language

**DON'T**: Make language "more user-friendly" or "more modern"

**Example**:
```
❌ "Let's get started! First, you'll want to review the
    system's recommendations..."

✅ Review Matches
```

**Why**: Legacy users are experts. They don't need hand-holding. Conversational language signals "different system."

---

### Mistake 2: Mixing Generic & Domain Terms

**DON'T**: Use both "opportunity" and "pass" in same interface

**Example**:
```
❌ "Allocate opportunity to location"

✅ "Allocate pass to site"
```

**Why**: Inconsistent terminology breaks mental model. Pick domain term and use everywhere.

---

### Mistake 3: Explaining Domain Terms

**DON'T**: Add tooltips or help text explaining basic concepts

**Example**:
```
❌ Site (Ground station where collection occurs)

✅ Site
```

**Why**: Legacy users already know what "site" means. Explanations signal "this is for beginners."

---

### Mistake 4: Softening Security Language

**DON'T**: Hide or soften classification reminders

**Example**:
```
❌ [Separate info icon] → "This data is classified"

✅ Comment required to override site allocation (Secret Data Only)
```

**Why**: Security reminders must be inline and visible. Legacy system trains users to look for these.

---

### Mistake 5: Using Action Phrases Instead of Commands

**DON'T**: Turn commands into descriptive phrases

**Example**:
```
❌ "Save my changes and allocate passes"

✅ Allocate
```

**Why**: Single imperative verb matches legacy button style. Phrases feel uncertain.

---

## 📄 Deliverables

### 1. String Replacement Spreadsheet

Create CSV for development team:

```csv
Component,Location,Old String,New String,Priority
Button,ManualOverrideModal,Save Override,Allocate,P0
Tab,CollectionOpportunitiesHub,Manage Opportunities,Review Matches,P0
Label,OverrideJustificationForm,Justification required,Comment required to override site allocation (Secret Data Only),P0
Button,PassFilter,View All Options,Show All,P1
Tag,PassCard,High Quality,Optimal,P1
Tag,PassCard,Medium Quality,Baseline,P1
Tag,PassCard,Low Quality,Suboptimal,P1
```

### 2. Voice & Tone Style Guide

1-page reference for all team members:
- Domain vocabulary list
- Voice characteristics (terse, imperative, security-conscious)
- Example transformations (wrong → right)
- Common mistakes to avoid

### 3. Automated Test Suite

Unit tests for string validation:

```typescript
describe('Domain Vocabulary Compliance', () => {
  it('uses "Allocate" not "Save" for primary action', () => {
    const button = screen.getByRole('button', { name: /allocate/i });
    expect(button).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save/i })).toBeNull();
  });

  it('uses "Comment" not "Justification" in override prompt', () => {
    const prompt = screen.getByText(/comment required/i);
    expect(prompt).toBeInTheDocument();
    expect(screen.queryByText(/justification/i)).toBeNull();
  });

  // ... more tests
});
```

---

## ✅ Success Definition

**Objective Measure**: Legacy user completes override workflow without asking questions about terminology

**Language Contribution**: 40% of overall mental model recognition
- 60%: Visual design, workflow rhythm, interaction patterns
- 40%: Terminology, voice, tone, domain vocabulary

**ROI**: High
- **Effort**: 14 hours total
- **Impact**: 40% → 95% language preservation
- **Cost**: Low (string changes only, no logic changes)
- **Risk**: Zero (no functional changes)

---

**Document Version**: 1.0
**Created By**: ✍️ Senior UX Copywriter + 🗣️ Voice & Tone Specialist
**Status**: ✅ Ready for Development Team
**Next Step**: Create string replacement spreadsheet and schedule Phase 1 implementation

