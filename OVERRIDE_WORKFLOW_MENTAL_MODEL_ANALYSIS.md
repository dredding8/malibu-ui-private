# Override Workflow Mental Model Analysis
**Roundtable: Legacy vs. Current System**
**Date**: 2025-10-01
**Focus**: User outcomes, mental models, and workflow patterns

---

## 🎯 Executive Summary

**Critical Finding**: Our current system has **strong technical capabilities** but **misses the critical mental model progression** that legacy users rely on for confident decision-making during override operations.

**Legacy System's Core Mental Model**:
> "I see what the system recommends → I understand WHY it's not ideal → I explore alternatives → I make an informed choice → I justify my decision → System confirms I understand the impact → Done"

**Current System Gap**:
> We jump from "I see the recommendation" directly to "Make a change" without the **progressive disclosure** and **forcing functions** that build operator confidence and ensure accountability.

---

## 👥 Roundtable Participants

- 👤 **Senior User-Centered Product Designer** - User mental models and cognitive flow
- 🎨 **Senior Enterprise Visual Designer** - Information hierarchy and visual guidance
- 🏗️ **Expert Information Architecture Specialist** - Decision pathways and data relationships
- ✍️ **Senior UX Copywriter** - Ubiquitous language, terminology consistency, and domain vocabulary
- 🗣️ **Voice & Tone Specialist** - User-facing language that matches legacy mental models

---

## 📊 Mental Model Comparison Matrix

### Legacy System: 5-Step Progressive Disclosure Model

| Step | User Mental State | System Support | Outcome |
|------|------------------|----------------|---------|
| **1. Task Selection** | "Which task needs my attention?" | Row click → Modal opens | **Focus established** |
| **2. Understand Current** | "What did the system choose and why?" | Two-panel view: Options ← → Plan | **Context gained** |
| **3. Explore Options** | "What else is available?" | "Show All" reveals full universe | **Confidence built** |
| **4. Make Decision** | "I choose this alternative" | Select + Allocate | **Intent declared** |
| **5. Justify & Confirm** | "Why am I doing this? What's the impact?" | Mandatory comment → Warning dialog | **Accountability assured** |

### Current System: Fragmented Workflow

| Step | User Mental State | System Support | Gap |
|------|------------------|----------------|-----|
| **1. View Opportunities** | "I see a list of tasks" | Table with opportunities | ✅ **Match** |
| **2. Edit Allocation** | "I need to change something" | Click opens...? | ⚠️ **Unclear entry** |
| **3. Make Changes** | "I'll modify the sites" | Multiple possible paths | ❌ **No clear progression** |
| **4. Save** | "Submit my changes" | Save button | ❌ **No justification required** |
| **5. Confirm** | ??? | ??? | ❌ **No impact warning** |

---

## 🧠 Deep Dive: Mental Model Analysis

### Legacy Step 1: "Select Task for Manual Allocation"

**User's Mental Model:**
> "I click on the problematic task, and the system shows me everything about just that one task in a focused view."

**What Makes This Work:**

👤 **UCD Perspective:**
- **Progressive disclosure**: User moves from overview (table) to detail (modal)
- **Focus management**: System removes distractions by overlaying modal
- **Clear hierarchy**: "This is THE task I'm working on right now"

🎨 **Visual Designer Perspective:**
- **Visual separation**: Modal creates clear "workspace" vs "background"
- **Attention direction**: Two-panel layout immediately shows "options" vs "current plan"
- **Cognitive anchor**: Task ID in modal title reinforces context

🏗️ **IA Perspective:**
- **List/Detail pattern**: Industry-standard pattern users understand
- **Object-centric**: Everything relates to THIS SCC
- **Scope clarity**: User knows boundary of their current work

**Current System Assessment:**
- ✅ We have: Table with opportunities
- ✅ We have: Modal/drawer components (ReallocationWorkspace, UnifiedOpportunityEditor)
- ⚠️ **GAP**: Multiple entry points create confusion about which is "the" workflow
- ⚠️ **GAP**: No clear visual distinction between "browsing" and "editing" states

**✍️ Language & Terminology Assessment:**

✍️ **UX Copywriter Perspective:**
- **Legacy Term**: "Review Matches" - domain-specific language that means "evaluate system-generated allocations"
- **Current Term**: "Manage Opportunities" - more generic, loses domain precision
- **Impact**: Users trained on "matches" as "system's proposed solution" may not recognize "opportunities"
- **Recommendation**: Restore "Review Matches" or add subtitle: "Manage Opportunities (Review System Matches)"

🗣️ **Voice & Tone Perspective:**
- **Legacy Voice**: Technical, authoritative, operator-focused ("Review", "Matches", "Allocate")
- **Current Voice**: Mixed signals - "Manage" (active), "Opportunities" (business-casual)
- **Mental Model**: Legacy users think in terms of "missions", "passes", "allocations" not "opportunities"
- **Recommendation**: Audit all user-facing strings for domain vocabulary consistency

---

### Legacy Step 2: "Modify Existing Allocation (De-selection)"

**User's Mental Model:**
> "I can see what the system picked on the left (with green checkboxes). I uncheck what I don't want, and it immediately disappears from my plan on the right."

**What Makes This Work:**

👤 **UCD Perspective:**
- **Direct manipulation**: Checkbox = immediate, visible, reversible action
- **Instant feedback**: Card removal confirms action without ambiguity
- **Mental model reinforcement**: Left = options, Right = my plan
- **Locus of control**: User feels in charge, not confused

🎨 **Visual Designer Perspective:**
- **Checkbox universality**: Everyone understands checkboxes
- **Animation feedback**: Card removal is visible confirmation
- **Spatial consistency**: Left/right panels maintain roles throughout

🏗️ **IA Perspective:**
- **State management**: System correctly maintains "available" vs "selected"
- **Referential integrity**: Removing from plan updates capacity metrics
- **Undo-able**: User can re-check to reverse

**Current System Assessment:**
- ✅ We have: Site allocation components
- ⚠️ **GAP**: No consistent two-panel "source vs destination" pattern
- ❌ **GAP**: Changes don't show immediate visual impact on capacity
- ❌ **GAP**: No clear "this is what was recommended" vs "this is what I'm changing it to"

**✍️ Language & Terminology Assessment:**

✍️ **UX Copywriter Perspective:**
- **Legacy Action**: "Allocate" - verb from domain vocabulary meaning "assign pass to site"
- **Button Label**: "Allocate" - single action word, imperative voice
- **Current Options**: Potentially "Save", "Apply Changes", "Confirm" - generic software terms
- **Impact**: "Allocate" has specific meaning in satellite operations domain
- **Recommendation**: Preserve "Allocate" button label exactly as legacy

🗣️ **Voice & Tone Perspective:**
- **Checkbox Labels**: Legacy uses site codes (DG, SC, HI, ALT) - terse, operator language
- **Mental Model**: Operators recognize site codes instantly, full names slow them down
- **Feedback Messages**: Legacy provides passive voice ("Pass allocated to site") vs active ("You allocated pass")
- **Recommendation**: Use site codes primarily, full names in tooltips only

---

### Legacy Step 3: "Discover Additional Options"

**User's Mental Model:**
> "The system is hiding some options to keep things simple, but I'm an expert and I need to see EVERYTHING. I click 'Show All' and boom - there's the Baseline and Suboptimal passes too."

**What Makes This Work:**

👤 **UCD Perspective:**
- **Respects expertise**: System defaults to optimal, but trusts user to override
- **Escape hatch**: Expert users can break out of guardrails when needed
- **No dead ends**: User never hits "I need X but can't see it"
- **Graduated complexity**: Newbies see simple view, experts see full view

🎨 **Visual Designer Perspective:**
- **Clear affordance**: "Show All" is labeled and positioned logically
- **Visual differentiation**: Baseline rows look different from Optimal
- **Scannable hierarchy**: Quality categories structure the expanded list

🏗️ **IA Perspective:**
- **Filtering strategy**: Default filter reduces cognitive load
- **Quality-based hierarchy**: Optimal → Baseline → Suboptimal is logical
- **Trade-off visibility**: User sees quality vs availability trade-offs

**Current System Assessment:**
- ✅ We have: Smart Views concept (similar intent)
- ⚠️ **Different mental model**: Our "views" are saved configurations, not "show more" filters
- ❌ **GAP**: No clear "I'm looking at filtered data, click here to see ALL data"
- ⚠️ **GAP**: Search/filter feels like "find" not "expand my options"

**✍️ Language & Terminology Assessment:**

✍️ **UX Copywriter Perspective:**
- **Legacy Control**: "Show All" - binary toggle using plain English
- **Implied Contract**: "You're currently seeing SOME, click to see ALL"
- **Mental Model**: Filter = hide/show, NOT search/find
- **Quality Terminology**: "Optimal", "Baseline", "Suboptimal" - specific quality hierarchy
- **Recommendation**: Exact phrase "Show All" must be preserved - users look for this specific label

🗣️ **Voice & Tone Perspective:**
- **Legacy Pattern**: Checkbox + label "Show All" = familiar UI pattern from legacy
- **Not Equivalent**: "Advanced filters", "View options", "More results" change meaning
- **Domain Language**: "Optimal" passes are the system's recommendation, "Baseline" acceptable, "Suboptimal" last resort
- **Recommendation**: Use quality tier terminology exactly: Optimal/Baseline/Suboptimal, NOT High/Medium/Low

---

### Legacy Step 4: "Select Non-Optimal Pass"

**User's Mental Model:**
> "I found the pass I actually need (HI Baseline). I check it, I click Allocate. Now the system should ask me WHY I'm overriding the optimal choice."

**What Makes This Work:**

👤 **UCD Perspective:**
- **Forcing function**: System REQUIRES justification for non-optimal choices
- **Just-in-time prompt**: Comment field appears AFTER user commits to action
- **Contextual requirement**: Only appears when user deviates from optimal
- **Workflow continuity**: Doesn't interrupt until user signals intent

🎨 **Visual Designer Perspective:**
- **Progressive reveal**: Comment field appears when needed, not before
- **Visual emphasis**: Red border/asterisk signals required field
- **Inline context**: Field appears in same modal, maintaining flow

🏗️ **IA Perspective:**
- **State transition**: From "planning" to "justifying"
- **Audit trail**: System captures WHY user made this choice
- **Compliance**: Meets regulatory/operational requirements for accountability

**Current System Assessment:**
- ✅ We have: OverrideJustificationForm component
- ❌ **CRITICAL GAP**: Justification is NOT mandatory in workflow
- ❌ **CRITICAL GAP**: No forcing function - user can save without justification
- ⚠️ **GAP**: Justification form exists but isn't integrated into primary flow

**✍️ Language & Terminology Assessment:**

✍️ **UX Copywriter Perspective:**
- **Legacy Prompt**: "Comment required to override site allocation (Secret Data Only)"
- **Key Linguistic Elements**:
  - "Comment" not "justification" - informal, operator language
  - "required" - mandatory, no ambiguity
  - "override site allocation" - explains WHY comment needed
  - "(Secret Data Only)" - classification reminder, security-conscious
- **Current Risk**: Using "justification", "reason", "explanation" changes tone
- **Recommendation**: Preserve exact phrase "Comment required to override..."

🗣️ **Voice & Tone Perspective:**
- **Legacy Voice**: Imperative, security-conscious, compliance-focused
- **Placeholder Text**: Legacy likely empty or "Enter override comment..."
- **Error Message**: Likely "Comment required" not "Please provide a justification"
- **Mental Model**: "Comment" = quick note to team, "Justification" = formal defense
- **Recommendation**: Match informal "comment" language, not formal "justification"

**Domain Vocabulary Preservation**:
- ✅ **MUST USE**: "comment", "override", "allocate", "pass", "site"
- ❌ **AVOID**: "justification", "reason", "explanation", "assignment", "location"

---

### Legacy Step 5: "Justify, Confirm, and Complete"

**User's Mental Model:**
> "I type my reason (system requires it). I click Allocate again. System shows me a warning about capacity impact. I acknowledge I understand. THEN my changes are saved."

**What Makes This Work:**

👤 **UCD Perspective:**
- **Two-factor confirmation**: Justification + warning acknowledgment
- **Prevents errors**: User must consciously confirm understanding of impact
- **Builds confidence**: User feels system is protecting them from mistakes
- **Clear completion**: Modal closes = task done

🎨 **Visual Designer Perspective:**
- **Warning hierarchy**: Icon + text + action buttons follow standard pattern
- **Risk communication**: Visual severity matches actual risk
- **Action clarity**: "Yes/No" buttons are unambiguous

🏗️ **IA Perspective:**
- **Confirmation pattern**: Industry-standard for critical actions
- **Impact awareness**: User sees downstream consequences before committing
- **Audit completion**: System has full record: what, why, acknowledged impact

**Current System Assessment:**
- ⚠️ We have: Capacity warnings in some components
- ❌ **CRITICAL GAP**: No mandatory warning dialog before save
- ❌ **CRITICAL GAP**: No forced acknowledgment of capacity impact
- ❌ **GAP**: User can make breaking changes without seeing impact warning

---

## 🎭 User Personas & Mental Model Fit

### Expert Collection Planner (Primary Legacy User)

**Mental Model Expectations:**
1. "Show me the optimal solution first" ✅ Current system does this
2. "Let me understand WHY it's optimal" ❌ Not clearly communicated
3. "Let me see ALL my options when I need them" ⚠️ Search works differently than "Show All"
4. "Make me justify non-optimal choices" ❌ Not enforced
5. "Warn me about consequences before I commit" ❌ Not consistently present

**Workflow Confidence Level:**
- Legacy: **HIGH** - "System guides me but trusts my expertise"
- Current: **MEDIUM** - "I can make changes but I'm not sure I'm following the 'right' process"

### Operations Manager (Reviewing Overrides)

**Mental Model Expectations:**
1. "I can see WHO made changes" ✅ Change tracking exists
2. "I can see WHY they made changes" ❌ No mandatory justification
3. "I can see WHAT impact it had" ⚠️ Partial - no pre-save impact preview
4. "I trust the process was followed" ❌ Process is optional, not enforced

**Audit Confidence Level:**
- Legacy: **HIGH** - "Every override has documented justification and acknowledged impact"
- Current: **LOW** - "Some changes might be undocumented"

---

## 🚨 Critical Mental Model Gaps

### Gap 1: No Clear "This is an Override" Moment

**Legacy:**
User explicitly enters "override mode" when they:
1. Uncheck system's optimal choices
2. Check non-optimal alternatives
3. System responds: "You're overriding. Justify this."

**Current:**
User can modify allocations through multiple paths:
- Quick edit
- Standard edit
- Reallocation workspace
- Unclear which path requires justification

**Impact:** User doesn't have clear mental model of when they're "just editing" vs "overriding optimal"

---

### Gap 2: No Progressive Disclosure of Complexity

**Legacy:**
1. Simple view (Optimal only)
2. → Click "Show All" →
3. Complex view (Optimal + Baseline + Suboptimal)

**Current:**
All complexity visible simultaneously through search/filter OR hidden behind different views

**Impact:** Cognitive overload for simple tasks, hidden options for complex tasks

---

### Gap 3: Missing "Justification is Required" Forcing Function

**Legacy:**
Cannot proceed without:
1. Typing justification text
2. Acknowledging capacity warning

**Current:**
Can save changes without any justification

**Impact:**
- Audit trail gaps
- Operational risk
- Loss of tribal knowledge about why decisions were made

---

### Gap 4: No "See Impact Before Commit" Pattern

**Legacy:**
Before final save:
1. System calculates capacity impact
2. Shows warning modal
3. Forces acknowledgment

**Current:**
Impact may be calculated, but no forced preview/acknowledgment

**Impact:** Users can accidentally break weekly capacity without realizing

---

## ✅ Recommendations: Align with Legacy Mental Model

### Priority 1: Implement Progressive Override Flow (CRITICAL)

**User Journey:**
```
View Opportunity Table
    ↓ (Click row)
Opportunity Detail View (Modal/Drawer)
    ├─ Left Panel: Available passes (Optimal shown by default)
    ├─ Right Panel: Current allocation plan
    └─ "Show All Passes" toggle → reveals Baseline/Suboptimal
        ↓ (User selects non-optimal)
Override Justification Form (APPEARS AUTOMATICALLY)
    ├─ Category dropdown (required)
    ├─ Reason text (50 char minimum, required)
    └─ Cannot proceed without completion
        ↓ (User clicks "Allocate")
Impact Warning Dialog (FORCED ACKNOWLEDGMENT)
    ├─ Shows capacity impact: "HI will go from 5/100 to 4/100"
    ├─ Shows quality delta: "Quality drops from 92% to 78%"
    └─ "I understand the impact" confirmation required
        ↓ (User clicks "Yes, proceed")
Changes Saved → Modal closes → Table updates
```

### Priority 2: Unify Edit vs Override Mental Model

**Current Confusion:**
- "Quick edit" = change priority/notes (not override)
- "Standard edit" = change sites (maybe override?)
- "Override mode" = full workflow (definitely override)

**Recommendation:**
```
IF user changes allocated sites FROM system recommendation
THEN trigger override workflow (justification required)

ELSE IF user changes priority/notes only
THEN allow quick save (no justification needed)
```

### Priority 3: Implement "Show All" vs Smart Views Hybrid

**Legacy "Show All":**
- Default: Show optimal passes only
- "Show All": Expand to include baseline/suboptimal
- Mental model: "I'm seeing filtered data, click to see everything"

**Current Smart Views:**
- Different saved configurations
- Mental model: "I'm switching between different pre-configured views"

**Recommendation:**
Keep Smart Views BUT add:
- **Default filter badge**: "Showing: Optimal passes only"
- **"Show All Quality Levels" toggle**: Reveals baseline/suboptimal in current view
- **Visual differentiation**: Baseline/suboptimal rows have different styling

### Priority 4: Mandatory Impact Preview

**Before ANY allocation save:**
```
System calculates:
├─ Capacity changes (site-by-site)
├─ Quality delta (if switching from optimal to baseline)
├─ Schedule conflicts (if any)
└─ Resource utilization impact

User sees warning dialog:
├─ Summary of impacts
├─ Risk level indicator
└─ Required acknowledgment: "I understand these impacts"
```

---

## 📏 Success Metrics

### User Confidence Metrics
- **Time to complete override**: Should match or beat legacy (target: <2 min)
- **Error rate**: Reduce accidental overrides (target: <5%)
- **Justification completion**: 100% of overrides documented

### Process Compliance Metrics
- **Audit trail completeness**: 100% of overrides have justification
- **Impact acknowledgment**: 100% of capacity-affecting changes acknowledged
- **Workflow abandonment**: <10% of users abandon override mid-flow

### Mental Model Validation
- **User testing**: 8/10 users should describe workflow matching legacy model
- **First-time success**: New users complete override correctly on first try (>80%)
- **Expert satisfaction**: Legacy users report confidence in process (>90%)

---

## 🎯 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- ✅ Audit existing components (DONE - we have pieces)
- Create unified override detection logic
- Implement progressive disclosure in UnifiedOpportunityEditor

### Phase 2: Forcing Functions (Week 3-4)
- Make justification mandatory when override detected
- Implement impact calculation preview
- Add confirmation dialog before save

### Phase 3: Mental Model Refinement (Week 5-6)
- Add "Show All Quality Levels" toggle
- Implement visual differentiation for quality tiers
- Add "You are overriding optimal" indicators

### Phase 4: Polish & Validation (Week 7-8)
- User testing with legacy operators
- Refine based on feedback
- Performance optimization

---

## 💡 Key Insights from Roundtable

### 👤 User-Centered Designer's Take:
> "The legacy system's genius is in its **progressive disclosure** and **forcing functions**. Users never wonder 'what should I do next?' because each step naturally leads to the next. Our current system has all the pieces but lacks the **connective tissue** that guides users through the decision-making process."

### 🎨 Visual Designer's Take:
> "The two-panel layout isn't just pretty - it's a **visual mental model**. Left = universe of possibilities. Right = my plan. When I drag from left to right (mentally or physically), I'm building my solution. We need to restore that **spatial consistency** that makes the workflow feel intuitive."

### 🏗️ Information Architect's Take:
> "The legacy system enforces a **data collection sequence** that ensures completeness: selection → justification → impact acknowledgment. Our current system allows users to skip steps, which creates **data integrity gaps**. We need to make the mandatory steps **architecturally impossible to skip**, not just UI suggestions."

---

## 🎬 Conclusion

**The Gap is Not Technical - It's Cognitive**

We have built powerful override components:
- ✅ OverrideJustificationForm
- ✅ UnifiedOpportunityEditor
- ✅ ReallocationWorkspace
- ✅ Impact calculators

But we haven't **orchestrated them into a coherent mental model** that matches how legacy users think about override workflows.

**The Fix:**
1. **Detect** when user deviates from optimal → trigger override mode
2. **Guide** through progressive disclosure → show complexity only when needed
3. **Require** justification and impact acknowledgment → no escape hatches
4. **Confirm** user understands consequences → forcing function before save

**Timeline:** 6-8 weeks to align current implementation with proven legacy mental model

**Risk of Not Fixing:** Users will work around the system, create Excel trackers for justifications, and lose confidence in the tool.

---

## 📖 Comprehensive Language & Terminology Audit

### ✍️ UX Copywriter's Domain Vocabulary Analysis

**Core Finding**: Legacy system uses **highly specific operator language** that forms users' mental models. Any deviation causes cognitive friction and suggests "this is a different system."

#### Critical Terminology Preservation

| Legacy Term | Domain Meaning | Current Risk | Recommendation |
|------------|----------------|--------------|----------------|
| **"Review Matches"** | Tab name for evaluating system-generated allocations | Changed to "Manage Opportunities" | **RESTORE**: Use "Review Matches" or "Review System Matches" |
| **"Allocate"** | Assign pass to site (domain verb) | May be "Save", "Apply", "Confirm" | **PRESERVE**: Button must say "Allocate" exactly |
| **"Comment"** | Quick operator note about override | May be "justification", "reason" | **PRESERVE**: Use "comment" not "justification" |
| **"Show All"** | Binary toggle to expand filtered options | May be "Advanced options", "More" | **PRESERVE**: Exact phrase "Show All" |
| **"Pass"** | Collection opportunity window | Never "opportunity", "window" | **PRESERVE**: Use "pass" in all UI |
| **"Site"** | Ground station location | Never "location", "station" | **PRESERVE**: Use "site" consistently |
| **"Optimal/Baseline/Suboptimal"** | Quality tier hierarchy | May be "High/Medium/Low" | **PRESERVE**: Use exact quality labels |
| **"Secret Data Only"** | Classification reminder | May be generic or missing | **PRESERVE**: Include parenthetical reminder |
| **"Weekly capacity"** | Resource constraint metric | May be "total capacity" | **PRESERVE**: "weekly" is temporal qualifier |

#### Button & Action Labels

**Legacy Pattern**: Imperative voice, single action verbs, domain-specific

```
✅ CORRECT (Legacy)        ❌ INCORRECT (Generic Software)
"Allocate"                 "Save Changes"
"Show All"                 "View All Options"
"Override"                 "Edit Allocation"
"Review Matches"           "Manage Items"
"Comment required"         "Please provide justification"
```

#### Prompt & Message Patterns

**Legacy Voice**: Direct, terse, security-conscious

```
✅ LEGACY PATTERN:
"Comment required to override site allocation (Secret Data Only)"

❌ AVOID:
"Please provide a justification for your override decision"
"Why are you changing the system recommendation?"
"Enter reason for modification (optional)"
```

**Key Linguistic Features**:
1. **Passive voice acceptable**: "Pass allocated to site" (not "You allocated the pass")
2. **Terse imperative**: "Comment required" (not "Please provide a comment")
3. **Domain nouns**: Always "site", "pass", "allocate" never generic equivalents
4. **Security reminders**: "(Secret Data Only)" appears inline, not separate
5. **No conversational fillers**: "Please", "thank you", "you may" avoided

### 🗣️ Voice & Tone Specialist's Analysis

**Legacy System Voice**: **Technical Operator** - Authoritative, terse, security-conscious, expert-to-expert

**Characteristics**:
- **Assumes expertise**: No hand-holding or explanatory text
- **Command-oriented**: Uses imperatives ("Review", "Allocate", "Override")
- **Security-first**: Reminders appear inline, not as separate steps
- **Efficiency-focused**: Minimal words, maximum meaning
- **Formal but not verbose**: "Comment required" not "We require that you provide a comment"

**Tone Comparison**:

| Aspect | Legacy Tone | Current Risk | Recommendation |
|--------|-------------|--------------|----------------|
| **Formality** | Professional military-style | May be conversational | Match legacy: terse professional |
| **Expertise Level** | Expert operator | May be beginner-friendly | Assume expert knowledge |
| **Authority** | System commands user | May be suggestion-based | Restore imperative voice |
| **Brevity** | Maximum terse | May be explanatory | Match legacy word economy |
| **Security** | Always visible | May be buried | Inline classification reminders |

**Example Transformations**:

```
❌ CURRENT (Conversational):
"Would you like to override the system's recommendation?
Please provide a justification below so your team understands
why you made this choice."

✅ LEGACY (Terse Professional):
"Comment required to override site allocation (Secret Data Only)"
```

```
❌ CURRENT (Suggestive):
"You can expand your options by viewing additional quality tiers"

✅ LEGACY (Command):
☐ Show All
```

```
❌ CURRENT (Explanatory):
"This change might affect the weekly capacity constraints.
Do you want to continue with this allocation?"

✅ LEGACY (Direct):
"This change may impact the weekly capacity. Are you sure you want to change?"
```

### Ubiquitous Language Dictionary

**For Implementation Teams**: Use this exact terminology in code, UI, documentation

#### Primary Domain Nouns
- **Pass** (NOT: opportunity, window, slot, time-slot)
- **Site** (NOT: location, station, ground station, facility)
- **Allocation** (NOT: assignment, distribution, scheduling)
- **Match** (NOT: result, suggestion, option, item)
- **Collection** (NOT: capture, acquisition, gathering)
- **Override** (NOT: edit, change, modify, adjustment)
- **Comment** (NOT: justification, reason, note, explanation)

#### Action Verbs
- **Allocate** (NOT: assign, schedule, set, configure)
- **Review** (NOT: view, see, check, examine)
- **Override** (NOT: edit, change, modify)
- **Expand** (in "Show All" context, NOT: reveal, display, show more)

#### Quality Descriptors
- **Optimal** (NOT: recommended, best, preferred, high-quality)
- **Baseline** (NOT: acceptable, standard, medium-quality)
- **Suboptimal** (NOT: low-quality, poor, not recommended)

#### UI Element Names
- **Modal** (NOT: dialog, popup, window, overlay)
- **Panel** (NOT: pane, section, area, column)
- **Tab** (NOT: page, section, step, stage)
- **Checkbox** (NOT: toggle, selector, option)

### Implementation Checklist

**For Developers**:
- [ ] Audit all user-facing strings in components
- [ ] Replace "justification" with "comment" in UI
- [ ] Replace "Manage Opportunities" with "Review Matches"
- [ ] Replace "Save" with "Allocate" on primary action button
- [ ] Add "(Secret Data Only)" to comment prompt
- [ ] Change quality tier labels to Optimal/Baseline/Suboptimal
- [ ] Update button label to exactly "Show All"
- [ ] Use "pass" and "site" consistently, never alternatives
- [ ] Update warning dialog text to match legacy tone

**For UX Writers**:
- [ ] Create style guide based on legacy terminology
- [ ] Document voice & tone patterns (terse, imperative)
- [ ] Review all new copy for domain vocabulary compliance
- [ ] Establish approval process for any terminology changes

**For QA**:
- [ ] Test that all legacy terms appear correctly
- [ ] Verify no generic software terms in operator workflows
- [ ] Check that tooltips/help text uses domain language
- [ ] Validate error messages match legacy tone

### Language Preservation Score

**Current Implementation**: **Estimated 40%** (based on screenshot analysis)

**Evidence**:
- ✅ Modal title includes "Override" (domain term preserved)
- ✅ Uses "Allocated Sites" (domain term preserved)
- ✅ Warning banner uses "override" language
- ⚠️ Tab names: "Allocation" (good) but "Justification" (should be "Comment")
- ⚠️ Panel titles: May use "Available Passes" (good) but need verification
- ❌ Likely missing "Show All" exact phrase
- ❌ Likely missing "(Secret Data Only)" reminder
- ❌ Button may not say "Allocate" exactly

**Target**: **90%+** language preservation for legacy user comfort

**Path to Target**:
1. **Sprint 1** (Language Quick Wins): Replace all button/tab labels → **70%**
2. **Sprint 2** (Message Refinement): Update prompts, warnings, help text → **85%**
3. **Sprint 3** (Terminology Audit): Review all strings for domain vocabulary → **95%**

---

## 💬 Sample Dialogue: Legacy User Testing

**Scenario**: Show prototype to legacy user without explanation

**Expected Recognition Markers** (if language correct):
- User: "Oh, this is the Review Matches screen" (recognizes by terminology)
- User: "I need to click Show All to see the Baseline passes" (knows exact phrase)
- User: "It's asking me for a comment because I'm overriding" (expects inline prompt)
- User: "This will probably warn me about weekly capacity" (anticipates forcing function)

**Red Flags** (if language wrong):
- User: "Is this a different system?" (doesn't recognize terminology)
- User: "Where do I allocate?" (can't find action because button says "Save")
- User: "How do I see all the options?" (doesn't see "Show All" phrase)
- User: "Do I need to justify this?" (unsure because says "justification" not "comment")

### Success Metric

**Definition of Success**: Legacy user navigates workflow without asking "Is this the same system?"

**Language plays 40% role** in this recognition (other 60%: visual design, workflow rhythm)

---

**Document Updated**: 2025-10-01
**Language Audit By**: ✍️ Senior UX Copywriter + 🗣️ Voice & Tone Specialist
**Status**: ✅ Ready for Development Style Guide
