# UX Copy Understandability: Open Cloze Test
## Discovering User Mental Models for Satellite Collection Management

**Expert Panel:**
- **Angela Colter** (UX Writing & Plain Language) - "Test comprehension without assuming correctness"
- **Nikki Anderson-Stanier** (User Research Methodology) - "Authentic curiosity means no predetermined answers"

---

## What This Test Does

This is an **open cloze test** - participants fill in blanks with whatever words feel natural to them. We're discovering what terminology users expect, not testing if they can guess our choices.

**Critical Principle:** We don't know if our current labels are correct. This test reveals user mental models so we can align our interface to THEIR language, not the other way around.

---

## Test Setup

**Duration:** 10-15 minutes
**Participants:** 20-25 users across 3 segments:
- **Novice** (8-10): No satellite operations background
- **Adjacent** (8-10): Related fields (logistics, operations, aerospace)
- **Expert** (4-5): Current satellite operations personnel

**Format:** Remote, unmoderated (Google Forms or Qualtrics)
**Analysis:** Pattern recognition - what do most people write?

---

## Instructions for Participants

> **What you'll do:**
> Read short passages describing parts of a satellite management application. Some words are replaced with blanks (like this: _______).
>
> **Fill in each blank with the word that feels most natural to you.**
>
> **There are no right or wrong answers.** We're learning what words make sense to people like you. If multiple words could work, pick your first instinct.
>
> If you're truly stuck, you can write "?" but try your best guess first.
>
> This helps us use language that matches how people think, not technical jargon.

---

## Test Passages

### Context 1: Data Table Screen

> You're looking at a screen with rows and columns showing satellite scheduling information. Each row represents one satellite pass/session.
>
> The top row shows labels for each column:
> - _______ — Whether this is active, complete, or pending
> - _______ — The name or identifier
> - _______ — Which satellite
> - _______ — Available capacity/bandwidth
> - _______ — Importance ranking
> - _______ — Things you can do with this item

**Researcher Note:** Current labels are "Status, Opportunity, Satellite, Capacity, Priority, Actions." Industry standard uses "Pass" or "Contact" for scheduled satellite sessions. Testing if "Opportunity" is intuitive.

---

### Context 2: Quick Edit Screen

> You click on a satellite pass to make a quick change. A panel slides in from the right side of the screen showing:
>
> "_______ : WORLDVIEW-3 North Pass"
>
> Below that, you can adjust the _______ level (shown as P1, P2, P3, or P4).
>
> There's a section labeled "Current Site Assignments" but the text says it's _______ -only — you can't change it here.

**Researcher Note:** Current copy is "Editing:", "Priority", "read-only." Testing if header and "read-only" are clear.

---

### Context 3: Override Warning Banner

> You're about to make advanced changes that will override what the system recommended. A yellow warning box appears:
>
> "_______ _______ Mode: Changes made here override system recommendations. Ensure you provide detailed _______ for audit compliance."

**Researcher Note:** Current is "Manual Override Mode" and "justification." Testing if this conveys seriousness and requirement clarity.

---

### Context 4: Advanced Editor Tabs

> You're in a complex editing mode with three tabs across the top:
>
> **Tab 1:** "_______ " — Where you choose which ground stations to use
>
> **Tab 2:** "_______ " — Where you explain why you're making these changes
>
> **Tab 3:** "_______ " — Where you check everything before saving

**Researcher Note:** Current tabs are "Allocation", "Justification", "Review." Testing if workflow is intuitive. Industry uses "scheduling" and "tasking" terminology.

---

### Context 5: Site Assignment Section

> Inside the advanced editor, you're assigning satellite passes to ground stations. A section header reads:
>
> "_______ Sites"
>
> Below that, you can adjust how many _______ each site will handle.

**Researcher Note:** Current is "Allocated Sites" and "collects." Testing if "collects" (as a noun) is clear vs "passes" or "contacts."

---

### Context 6: Main Dashboard Actions

> You're on the main screen. You need to get the latest satellite data. You see three buttons:
>
> - "_______ Data Sources"
> - "Create _______"
> - "Add Data _______"

**Researcher Note:** Current is "Refresh", "Collection", "Source." Testing if "Refresh" vs "Update" and if "Collection" (our term for scheduled group of passes) is intuitive.

---

### Context 7: Progress Save Message

> You're partway through creating a satellite collection schedule. A message appears:
>
> "_______ Saved: We've saved your work automatically. You can leave and come back anytime."

**Researcher Note:** Current is "Progress Saved." Testing if this is clear vs "Work Saved" or "Changes Saved."

---

### Context 8: Quality Filter Toggle

> You're viewing a list of possible satellite passes. A checkbox says:
>
> "Show all _______ _______"
>
> When unchecked, you see 15 passes. When checked, you see 42 passes (including lower-quality ones).

**Researcher Note:** Current is "quality tiers." Testing if users understand this means filtering by quality levels.

---

### Context 9: Background Processing

> After submitting your work, a message appears:
>
> "We're _______ on Your Collection: Your collection is being built in the _______."

**Researcher Note:** Current is "Working" and "background." Testing clarity of background processing communication.

---

### Context 10: Error and Retry

> You tried to refresh data but it failed. You see:
>
> "Refresh _______"
> [Button: "_______ _______"]

**Researcher Note:** Current is "failed" and "Try Again." Testing error recovery copy clarity.

---

### Context 11: Form Title

> You're adding a new satellite to the system. The form title is:
>
> "_______ Information"
>
> The first field asks for the satellite's _______ number.

**Researcher Note:** Current form title is "SCC Information" (SCC = Space Collection Capability or Satellite Collection... we don't even have it spelled out). Testing if acronym is intuitive or if we need plain language.

---

### Context 12: Time Estimate

> You're in step 2 of a 4-step wizard. Text at the top says:
>
> "Configure your collection _______ and site requirements"
> "Estimated time remaining: 5-7 _______"

**Researcher Note:** Current is "parameters" and "minutes." Testing if "parameters" is too technical vs "settings" or "options."

---

### Context 13: Navigation Path

> At the top of the screen, you see:
>
> Data Sources > SCCs > _______ SCC

**Researcher Note:** Current is "Add SCC." Testing breadcrumb navigation clarity and if "Add" is the right verb vs "New" or "Create."

---

### Context 14: Loading Status

> While data loads, you see:
>
> "_______ master list... Please wait while we _______ with the server."

**Researcher Note:** Current is "Updating" and "synchronize." Testing if "synchronize" is too technical vs "sync", "connect", "communicate."

---

### Context 15: Cancel Warning

> You click "Cancel" while creating a collection. A dialog appears:
>
> "You've made _______ on your collection. Are you sure you want to start over?"
> "Note: We can't _______ this work once it's gone."
>
> Two buttons: "Continue _______" | "_______ Changes"

**Researcher Note:** Current is "progress", "restore", "Editing", "Discard." Testing clarity of abandonment warning and button labels.

---

## Analysis Framework

### Step 1: Data Collection

For each blank, record what each participant wrote. Track:
- Exact wording
- Participant segment (novice/adjacent/expert)
- Time spent on that passage (if available)
- Any "?" responses

### Step 2: Pattern Analysis

For each blank, calculate:
- **Top 3 responses** and their frequencies
- **Convergence score**: % who wrote the most common word
- **Synonym clustering**: Group semantically similar responses
  - Example: "Edit", "Editing", "Modify" → Edit cluster
- **Domain variation**: Do novices vs experts use different terms?

### Step 3: Interpretation

**High convergence (>70% agreement):**
- Users have a clear mental model
- If they match our term → Good alignment
- If they don't match our term → **We should consider changing**

**Moderate convergence (40-69%):**
- Multiple acceptable terms
- Consider: Use most popular term OR add clarifying text

**Low convergence (<40%):**
- Concept is unclear or context insufficient
- Users don't have a shared mental model
- **Indicates UX problem beyond just wording**

**Domain split (novice vs expert write different things):**
- Red flag: Interface may alienate one group
- Consider: Progressive disclosure or dual labeling

---

## Validation Against Industry Standards

After collecting user responses, compare against industry research:

### Satellite Operations Terminology (from NASA, ITU-R standards):

**Industry-Standard Terms:**
- **Pass** or **Contact** = When satellite is visible to ground station
- **TT&C** = Tracking, Telemetry & Command
- **Mission Planning** = Scheduling satellite activities
- **Tasking** = Assigning collection tasks
- **Ground Segment** = Ground stations and control systems

**Our Current Terms to Validate:**
- "Opportunity" → Industry says "Pass" or "Contact"
- "Collection" → Industry says "Mission" or "Tasking Window"
- "Allocation" → Industry says "Scheduling" or "Tasking"
- "SCC" → Not industry standard (internal acronym?)

**Key Question:** If users naturally write industry-standard terms but we use different ones, should we align with industry or with user preference?

---

## Scoring & Prioritization

### For Each UI Element:

| Element | User Top Response | Our Current Term | Match? | Convergence | Industry Term | Recommendation |
|---------|------------------|------------------|--------|-------------|---------------|----------------|
| *Fill after data collection* | | | | | | |

### Priority Framework:

**🔴 Critical (Must Change):**
- <30% convergence (users confused)
- OR Users write industry-standard term ≠ our term
- OR Experts use different term than our label

**🟡 Review (Consider Change):**
- 30-60% convergence (multiple acceptable options)
- OR Novices struggle but experts understand
- OR Users write synonym of our term

**🟢 Keep:**
- >60% convergence on our exact term
- OR >70% convergence on synonym cluster matching our term
- OR Industry term matches our term AND users match both

---

## Recommendations Strategy

### If Users Match Industry Standard ≠ Our Term:
**Example:** 75% of users write "Pass" but we use "Opportunity"

**Options:**
1. **Adopt industry term** ("Pass")
2. **Dual label** ("Opportunity (Pass)")
3. **Keep ours + tooltip** ("Opportunity ⓘ" → hover shows "Also called a pass")

**Decision Criteria:**
- If experts strongly prefer industry term → Adopt it
- If novices don't know industry term → Dual label or keep ours with explanation

### If Users Match Each Other but Not Industry OR Us:
**Example:** 80% write "Task" but industry says "Pass" and we say "Opportunity"

**Action:** Users have spoken. Use "Task" (their term) and consider why both industry and we missed this.

### If Low Convergence (<40%):
**Example:** Users write "Edit", "Change", "Modify", "Update", "Adjust" with no majority

**Actions:**
1. Check if context provides enough information (maybe passage is ambiguous)
2. Consider if the concept itself is unclear (not just the label)
3. May need visual cues (icons) to supplement text
4. Retest with more context

---

## Research Questions This Test Answers

### Primary Questions:
1. **Do users naturally use our terminology?**
   - If yes → Validation
   - If no → What DO they use?

2. **Do users agree with each other?**
   - High convergence → Clear mental model exists
   - Low convergence → Concept is ambiguous

3. **Do novices and experts use the same language?**
   - If yes → Universal terminology possible
   - If no → Need progressive disclosure or dual labeling

### Secondary Questions:
4. **Do users prefer industry-standard terms?**
   - Experts likely will, novices may not
   - Informs whether to use jargon or plain language

5. **Where do users get confused?**
   - Low convergence or many "?" responses
   - Indicates where we need better explanation, not just better labels

6. **What patterns emerge?**
   - Do users consistently prefer verbs over nouns? ("Edit" vs "Editing")
   - Do they prefer plain language over technical terms? ("Settings" vs "Parameters")

---

## Implementation Guide

### Setup (1 day):

**Google Forms Setup:**
1. Create form with consent + demographics (role, experience with satellite ops)
2. Add each passage as separate page
3. Use "Short answer" for blanks
4. Randomize passage order
5. Add optional "Comments" field per passage

**Qualtrics Setup:**
1. Use text piping for blanks
2. Enable timer to track time per passage
3. Set up auto-export to CSV

### Pilot (2 days, 3 participants):

**Goals:**
- Verify passages make sense
- Check for technical issues
- Estimate actual completion time
- Identify confusing phrasing in test instructions

**Red flags:**
- Pilot participants ask "What do you mean?"
- Many "?" responses in pilot
- Completion time >20 minutes

### Full Test (1 week, 20-25 participants):

**Recruitment:**
- Novices: UserTesting, Respondent, general panel
- Adjacent: LinkedIn recruiting in aerospace/logistics groups
- Experts: Direct outreach to current satellite ops professionals

**Incentive:**
- $20 per participant (15 min @ ~$80/hr rate)
- Faster completion for future testing if we build relationship

### Analysis (2-3 days):

**Day 1: Data Cleaning**
- Export responses to spreadsheet
- Group obvious synonyms (Edit/Editing, Refresh/Reload)
- Flag nonsense responses (exclude from analysis)
- Calculate convergence scores

**Day 2: Pattern Analysis**
- Create frequency tables for each blank
- Identify domain splits (novice vs expert)
- Compare against industry standards
- Generate visualizations (word clouds, bar charts)

**Day 3: Recommendations**
- Prioritize findings (red/yellow/green)
- Draft specific copy changes
- Create comparison table (before/after with rationale)

---

## Success Criteria

**Test Quality:**
- ✅ ≥20 completed responses
- ✅ <10% dropout rate
- ✅ Representative sample across all 3 segments
- ✅ Clear patterns emerge (not random noise)

**Actionable Insights:**
- ✅ Identify 5-10 high-priority terminology changes
- ✅ Evidence-based rationale for each decision
- ✅ Understand where users are confused (not just what words they prefer)

**Validation:**
- ✅ Compare findings to industry standards
- ✅ Identify terminology gaps between segments
- ✅ Baseline metrics for future testing

---

## What This Test Does NOT Do

**It doesn't test:**
- Visual design (only copy/terminology)
- Task completion (that requires usability testing)
- Information architecture (that requires card sorting)
- Findability (that requires tree testing)

**It doesn't tell you:**
- Whether features are useful (only if labels are clear)
- Whether the workflow makes sense (only if terms are intuitive)
- Whether the UI is easy to use (only if copy is understandable)

**Cloze testing is for comprehension, not preference.**
Users might understand "Parameters" perfectly but still prefer "Settings." This test finds confusion, not opinions.

---

## Follow-Up Questions (Optional)

After completing all passages, ask:

1. **Hardest Passage:**
   > "Which passage was hardest to fill in? Why?"
   - Identifies ambiguous contexts

2. **Unfamiliar Terms:**
   > "Were there any contexts where you felt you needed specialized knowledge?"
   - Identifies jargon barriers

3. **Terminology Suggestions:**
   > "If you could rename one thing in this application to make it clearer, what would it be?"
   - Gets direct recommendations

4. **Mental Model Check:**
   > "In your own words, what do you think this application helps people do?"
   - Validates overall conceptual understanding

---

## Reporting Template

### Executive Summary

**Key Finding:** [e.g., "Users naturally use 'Pass' not 'Opportunity' (80% convergence)"]

**Recommendation:** [e.g., "Change 'Opportunity' to 'Pass' in all UI locations"]

**Impact:** [e.g., "Aligns with both user expectations AND industry standards"]

---

### Detailed Findings

**Context [X]: [Brief description]**

| Blank | Top User Response | % | Our Term | Match? | Action |
|-------|------------------|---|----------|--------|---------|
| 1 | [Word] | [%] | [Our word] | ✅/❌ | Keep/Change/Review |

**Insights:**
- [Pattern observation]
- [Domain differences if any]
- [Comparison to industry standard]

**Recommendation:**
- [Specific action with rationale]

---

### Priority Matrix

**🔴 Critical Changes (Must Address):**
1. [Finding] → [Recommendation]
2. [Finding] → [Recommendation]

**🟡 Consider Changing:**
1. [Finding] → [Recommendation]
2. [Finding] → [Recommendation]

**🟢 Keep As Is:**
1. [Finding] → [Validation]

---

*UX Copy Cloze Test - Open Format*
*Expert Panel: Angela Colter (Plain Language) + Nikki Anderson-Stanier (User Research)*
*Approach: Discovery, not validation*
*Timeline: 2 weeks from pilot to recommendations*
*Investment: ~$500 (incentives) + 5 days (research time)*
