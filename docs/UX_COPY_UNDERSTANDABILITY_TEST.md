# UX Copy Understandability Test
## Closed Test Assessment for Collection Management Application

**Test Design Panel:**
- **Angela Colter** (UX Writing & Content Testing) - Focus on clarity, plain language, and understandability
- **Nikki Anderson-Stanier** (User Research Methodology) - Focus on research rigor, participant empathy, and methodology selection

---

## Executive Summary

This closed test evaluates whether users can understand and correctly interpret the UX copy in our satellite collection management application. Using evidence-based methodologies from UX writing research (Colter) and user research best practices (Anderson-Stanier), we will assess copy clarity, task comprehension, and mental model alignment.

### Test Objectives
1. **Validate terminology understandability** - Do users comprehend domain-specific terms?
2. **Assess copy clarity** - Can users understand action labels and instructions on first read?
3. **Identify confusion points** - Where does copy create cognitive friction?
4. **Measure task completion confidence** - Do users feel certain about what actions will do?
5. **Test mental model alignment** - Do our labels match user expectations?

---

## Test Methodology

### Approach: Mixed-Methods Closed Testing

Drawing on Anderson-Stanier's emphasis on **descoping for focus** and Colter's **plain language principles**, we employ:

1. **Closed Card Sorting** - Testing existing category/label structure
2. **Task-Based Comprehension Scenarios** - Real-world task interpretation
3. **Single Ease Question (SEQ)** - Post-task difficulty ratings
4. **Terminology Matching** - Pairing technical terms with plain language
5. **Anticipatory UX Testing** - Predicting outcomes before interaction

### Why Closed Testing?

**Angela Colter's Perspective:**
- Closed tests allow us to **validate** whether our terminology works without requiring users to invent new language
- We can measure understandability against established baselines
- Reduces participant burden while maintaining research rigor

**Nikki Anderson-Stanier's Perspective:**
- Closed testing provides **quantifiable metrics** for copy effectiveness
- Enables comparison across user segments (novice vs. expert)
- Faster to execute than open-ended methods while yielding actionable insights

---

## Part 1: Closed Card Sorting Test

### Test Structure

**Objective:** Validate that users can correctly categorize UI elements under existing navigation labels

**Materials Needed:**
- Digital card sorting tool (OptimalSort, Maze, or UserTesting)
- 40 cards representing key UI elements/features
- 6 predefined categories matching our navigation

### Categories (Pre-defined)
Based on our application navigation:

1. **Data Sources** - Where satellite and collection capability data comes from
2. **Collection Decks** - Planned collections and scheduling
3. **Collection Opportunities** - Available satellite passes and matching
4. **Analytics** - Performance metrics and insights
5. **History** - Past collections and audit trail
6. **Settings** - Configuration and preferences

### Cards (UI Elements to Sort)

**Group A: Core Actions (10 cards)**
- "Refresh Data Sources"
- "Create Collection"
- "Add Data Source"
- "Review Parameters"
- "Select Opportunities"
- "Build Your Collection"
- "Manage Collection"
- "View Status"
- "Find Sources"
- "Run Matching"

**Group B: Status & Feedback (10 cards)**
- "We're Working on Your Collection"
- "Progress Saved"
- "Updating master list..."
- "Refresh failed"
- "Your collection is being built in the background"
- "Available Data Sources"
- "Optimal passes only"
- "Show all quality tiers"
- "Data integrity issues detected"
- "Validation complete"

**Group C: Navigation Labels (10 cards)**
- "SCC Information"
- "Collection Parameters"
- "Tasking Window"
- "Special Instructions"
- "Field Mapping Review"
- "Allocation Workspace"
- "Override Editor"
- "Conflict Resolution"
- "Pass Details"
- "Site Capabilities"

**Group D: Help & Guidance (10 cards)**
- "Set up your collection data sources and time window"
- "Configure your collection parameters and site requirements"
- "Select satellite collection opportunities for your deck"
- "Add final instructions and submit your collection"
- "We've saved your work automatically"
- "You can leave and come back anytime"
- "All your entered information will be lost"
- "Please wait while we synchronize with the server"
- "This may take a few moments"
- "Estimated time remaining: 8-10 minutes"

### Success Metrics

**High Confidence Threshold:**
- ≥80% agreement on category placement
- ≤15% misattribution to wrong categories
- Average sort time <10 minutes

**Validation Criteria:**
- If card consistently misplaced → Label is confusing
- If card split across multiple categories → Ambiguous wording
- If participants pause >30s → Requires cognitive effort to understand

### Testing Protocol

**Participant Instructions (Colter's Plain Language Approach):**

> "You'll see 40 cards with text from our application. Each card shows something you might see on screen - like a button, a message, or a heading.
>
> Your job is to put each card into the category where you'd expect to find it. There are 6 categories based on our main navigation areas.
>
> **Important:** There are no right or wrong answers. We want to know where *you* would expect to find these things. If you're unsure, trust your first instinct.
>
> This should take about 10 minutes."

**Data Collection:**
- Category assignment for each card
- Time spent on each card
- Changes/hesitations (tracked by tool)
- Optional: Think-aloud comments

---

## Part 2: Task-Based Comprehension Scenarios

### Objective
Assess whether users can correctly predict what will happen when they interact with specific UI copy.

### Methodology: Anticipatory UX Testing

Based on Colter's work on **predicting content effectiveness without users in the interface**, we present screenshots with specific UI elements highlighted and ask participants to predict outcomes.

### Scenario Structure

Each scenario includes:
1. **Context** - Brief task setup
2. **Screenshot** - Visual of actual UI
3. **Question** - What will happen if you...?
4. **Response Options** - Multiple choice (4 options)
5. **Confidence Rating** - How sure are you? (Very sure / Somewhat sure / Guessing)

### Test Scenarios

---

#### **Scenario 1: Dashboard Actions**

**Context:**
You need to update your satellite data to get the latest information.

**Screenshot:** Dashboard with three action buttons
- "Refresh Data Sources"
- "Create Collection"
- "Add Data Source"

**Question:**
Which button would you click to update your satellite data?

**Options:**
A. Refresh Data Sources ✓ (Correct)
B. Create Collection
C. Add Data Source
D. I'm not sure - none of these seem right

**Confidence:** How confident are you in your choice?
- [ ] Very confident - I'm certain this is right
- [ ] Somewhat confident - I think this is right
- [ ] Not confident - I'm guessing

**Success Criteria:**
- ≥85% select correct option
- ≥70% report "Very confident"

---

#### **Scenario 2: Collection Wizard Progress**

**Context:**
You're partway through creating a collection. You see this message:

> "Progress Saved: We've saved your work automatically. You can leave and come back anytime."

**Question:**
Based on this message, what can you do now?

**Options:**
A. Close the browser and your progress will be lost
B. Close the browser and resume later without losing progress ✓ (Correct)
C. You must complete the collection now or start over
D. You need to click a "Save" button first

**Confidence:** How confident are you?
- [ ] Very confident
- [ ] Somewhat confident
- [ ] Not confident

**Success Criteria:**
- ≥90% select correct option
- ≥80% report "Very confident"

---

#### **Scenario 3: Quality Tier Toggle**

**Context:**
You're viewing collection opportunities and see a checkbox that says:

> "Show all quality tiers"

Currently, it's unchecked. You're seeing 15 opportunities.

**Question:**
If you check this box, what will happen?

**Options:**
A. You'll see fewer opportunities (only the best quality)
B. You'll see more opportunities (including lower quality ones) ✓ (Correct)
C. The opportunities will be sorted by quality
D. Nothing will change - it's just for display preferences

**Confidence:** How confident are you?
- [ ] Very confident
- [ ] Somewhat confident
- [ ] Not confident

**Success Criteria:**
- ≥75% select correct option
- ≥60% report "Very confident"

---

#### **Scenario 4: Background Processing**

**Context:**
After starting a collection, you see this message:

> "We're Working on Your Collection: Your collection is being built in the background."

**Question:**
What does this mean you should do?

**Options:**
A. Wait on this page until it's finished
B. You can navigate away and check back later ✓ (Correct)
C. Close the window and reopen it
D. Click "Refresh" to see updates

**Confidence:** How confident are you?
- [ ] Very confident
- [ ] Somewhat confident
- [ ] Not confident

**Success Criteria:**
- ≥80% select correct option
- ≥75% report "Very confident"

---

#### **Scenario 5: Abandonment Warning**

**Context:**
You're creating a collection and click "Cancel." You see this alert:

> "You've made progress on your collection. Are you sure you want to start over?"
>
> "Note: We can't restore this work once it's gone. All your entered information will be lost."

With buttons: "Continue Editing" | "Discard Changes"

**Question:**
If you click "Discard Changes," what will happen?

**Options:**
A. Your progress is saved as a draft
B. You'll go back to edit mode
C. All your work will be permanently deleted ✓ (Correct)
D. You'll get another warning before deletion

**Confidence:** How confident are you?
- [ ] Very confident
- [ ] Somewhat confident
- [ ] Not confident

**Success Criteria:**
- ≥95% select correct option
- ≥90% report "Very confident"

---

#### **Scenario 6: Step Progress Context**

**Context:**
You're in Step 2 of the collection wizard. You see:

> "Configure your collection parameters and site requirements"
> "Estimated time remaining: 5-7 minutes"

**Question:**
What does "5-7 minutes" refer to?

**Options:**
A. How long this entire step will take
B. How long until your collection is ready
C. How long to complete the remaining steps in the wizard ✓ (Correct)
D. How long the system takes to process

**Confidence:** How confident are you?
- [ ] Very confident
- [ ] Somewhat confident
- [ ] Not confident

**Success Criteria:**
- ≥70% select correct option
- ≥55% report "Very confident"

---

#### **Scenario 7: Search Functionality**

**Context:**
On the Dashboard, you see a search box with this placeholder text:

> "Search for data sources... (⌘K to focus)"

**Question:**
What can you search for using this search box?

**Options:**
A. Satellite data sources ✓ (Correct)
B. Collection decks you've created
C. Anything in the application
D. Help documentation

**Confidence:** How confident are you?
- [ ] Very confident
- [ ] Somewhat confident
- [ ] Not confident

**Success Criteria:**
- ≥85% select correct option
- ≥70% report "Very confident"

---

#### **Scenario 8: Status Message Interpretation**

**Context:**
While refreshing data, you see:

> "Updating master list... Please wait while we synchronize with the server. This may take a few moments."

**Question:**
What should you do while seeing this message?

**Options:**
A. Click somewhere else to speed it up
B. Refresh the page to check if it's done
C. Wait patiently - the system is working ✓ (Correct)
D. Close and reopen the application

**Confidence:** How confident are you?
- [ ] Very confident
- [ ] Somewhat confident
- [ ] Not confident

**Success Criteria:**
- ≥90% select correct option
- ≥85% report "Very confident"

---

#### **Scenario 9: Navigation Breadcrumbs**

**Context:**
You're on the "Add SCC" page and see these breadcrumbs at the top:

> Data Sources > SCCs > Add SCC

**Question:**
What will happen if you click "SCCs" in the breadcrumbs?

**Options:**
A. Nothing - breadcrumbs are just labels
B. You'll go to the SCCs list page ✓ (Correct)
C. You'll lose your current form data
D. A menu will appear with options

**Confidence:** How confident are you?
- [ ] Very confident
- [ ] Somewhat confident
- [ ] Not confident

**Success Criteria:**
- ≥95% select correct option
- ≥90% report "Very confident"

---

#### **Scenario 10: Error Recovery**

**Context:**
After trying to refresh data sources, you see:

> "Refresh failed: Network error: Unable to connect to server"

With a button: "Try Again"

**Question:**
What does the "Try Again" button do?

**Options:**
A. Takes you back to the previous page
B. Attempts to refresh the data sources again ✓ (Correct)
C. Reloads the entire application
D. Opens a help dialog

**Confidence:** How confident are you?
- [ ] Very confident
- [ ] Somewhat confident
- [ ] Not confident

**Success Criteria:**
- ≥95% select correct option
- ≥90% report "Very confident"

---

### Scenario Testing Protocol

**Anderson-Stanier's Empathy-Driven Approach:**

**Pre-Test Briefing:**
> "Thank you for helping us improve our application. In this test, you'll see 10 realistic scenarios showing parts of our interface. For each one, we'll ask you to predict what will happen.
>
> **There's no penalty for being wrong** - we genuinely want to know how clear our copy is. If something is confusing, that's valuable feedback for us.
>
> **Your confidence rating is important.** Even if you get the right answer, if you weren't confident, that tells us the copy could be clearer.
>
> This will take about 15 minutes. Ready?"

**Data Collection:**
- Selected option (A/B/C/D)
- Confidence level
- Time per scenario
- Optional: "Why did you choose this?" (open text)

---

## Part 3: Terminology Matching Test

### Objective
Verify users understand domain-specific terms by matching them with plain language equivalents.

### Test Structure

Present pairs of terms. Participants match technical/domain terms with their plain language meaning.

### Terminology Pairs

**Column A (Our Application)** | **Column B (Plain Language)**
---|---
Data Sources | Information about satellites and their capabilities
SCC | Individual satellite or collection system
Collection Deck | Planned schedule of satellite collections
Tasking Window | Time period for scheduling collections
Collection Opportunities | Available satellite passes you can schedule
Match Status | How well a satellite pass fits your needs
Allocation | Assigning satellites to ground stations
Override | Manually changing an automated decision
Periodicity | How often a satellite passes overhead
Elevation | How high above the horizon a satellite appears
Hard Capacity | Maximum number of collections possible
Pass | When a satellite is visible to a ground station
Site Capabilities | What a ground station can receive/process
Field Mapping | Connecting data from one source to another
Validation | Checking if a plan will work correctly
Baseline Match | Minimum acceptable satellite pass
Optimal Match | Best possible satellite pass for your needs
Conflict Resolution | Fixing scheduling overlaps
Workspace Mode | Temporary editing area for making changes
Reallocation | Moving satellite assignments between stations

### Matching Instructions

> "On the left, you'll see terms from our application. On the right, you'll see plain language descriptions.
>
> Draw a line to connect each term with its meaning. If you're not sure, make your best guess - but mark it with a '?' so we know you weren't certain."

### Success Metrics

- **High Clarity Terms:** ≥90% correct matches
- **Moderate Clarity Terms:** 70-89% correct matches
- **Low Clarity Terms:** <70% correct matches (NEEDS REVISION)

**Analysis:**
- Terms with <70% accuracy should be reconsidered
- Terms where >30% mark '?' may need additional UI explanation
- Compare novice vs. experienced user performance

---

## Part 4: Single Ease Question (SEQ) Assessment

### Objective
Measure perceived ease of understanding after exposure to key application flows.

### Implementation

After participants complete card sorting and scenarios, show them 5 key user flows and ask the SEQ for each:

**SEQ Question:**
> "Overall, how easy or difficult did you find this [flow/task] to understand?"

**Scale:** 1 (Very Difficult) to 7 (Very Easy)

### Flows to Assess

#### Flow 1: Dashboard to Create Collection
**Steps shown:**
1. Dashboard → "Create Collection" button
2. Wizard Step 1: "Input Data"
3. Wizard Step 2: "Review Parameters"
4. Wizard Step 3: "Select Opportunities"
5. Wizard Step 4: "Special Instructions"
6. Confirmation

**SEQ Question:** How easy to understand was this collection creation process?

---

#### Flow 2: Adding a New Data Source
**Steps shown:**
1. Dashboard → "Add Data Source" button
2. Form: "SCC Information"
3. Fields: SCC Number, Priority, Function, Orbit, etc.
4. "Save" button
5. Success confirmation

**SEQ Question:** How easy to understand was the process for adding a data source?

---

#### Flow 3: Managing Collection Opportunities
**Steps shown:**
1. History → Select collection → "Manage Collection"
2. Collection Opportunities view
3. "Show all quality tiers" toggle
4. Opportunity actions (Edit, Override, Validate)

**SEQ Question:** How easy to understand was managing your collection opportunities?

---

#### Flow 4: Background Processing & Status
**Steps shown:**
1. Submit collection
2. "We're Working on Your Collection" message
3. "View Status" button
4. History page with processing status
5. Completion notification

**SEQ Question:** How easy to understand was what's happening with your collection?

---

#### Flow 5: Error Recovery
**Steps shown:**
1. Click "Refresh Data Sources"
2. "Updating master list..." message
3. "Refresh failed" error
4. "Try Again" button
5. Success on retry

**SEQ Question:** How easy to understand was what to do when something went wrong?

---

### SEQ Success Criteria

**Target Scores:**
- **Excellent:** Mean ≥ 6.0 (Easy to Very Easy)
- **Good:** Mean 5.0-5.9 (Moderately Easy)
- **Needs Improvement:** Mean 4.0-4.9 (Neutral)
- **Poor:** Mean < 4.0 (Difficult)

**Red Flags:**
- Standard deviation > 1.5 (highly inconsistent experience)
- >20% rate as "Difficult" (1-3 rating)
- Bimodal distribution (some find easy, some find hard → copy works for some users but not others)

---

## Part 5: Empathy-Driven Open Feedback

### Objective
**Anderson-Stanier Principle:** "Being genuinely curious made me better as a researcher."

Give participants space to share what confused them and why.

### Question Set

**After completing all tests:**

1. **Reflection Question:**
   > "Thinking back on the terms and messages you saw, which ones made you pause or feel uncertain? Tell us about that moment."

   *[Open text response]*

2. **Assumption Check:**
   > "Were there any points where you felt like you needed to be an expert to understand what was happening?"

   - [ ] Yes, several times
   - [ ] Once or twice
   - [ ] No, it felt accessible

   *If yes: "Can you describe which parts felt too technical?"*

3. **Mental Model Probe:**
   > "In your own words, what do you think a 'Collection Deck' is?"

   *[Open text - reveals if our core concept is understandable]*

4. **Confidence in Action:**
   > "If you had to use this application for real work tomorrow, how confident would you feel understanding what buttons and options do?"

   - [ ] Very confident - I'd know what to do
   - [ ] Somewhat confident - I'd figure it out with some trial and error
   - [ ] Not confident - I'd need training or help
   - [ ] Very worried - I'd be afraid of making mistakes

5. **Jargon Detection:**
   > "Did you encounter any words or phrases that felt like 'insider language' or jargon?"

   - [ ] Yes, frequently
   - [ ] Yes, occasionally
   - [ ] No, language felt plain and clear

   *If yes: "Which words? What would make more sense to you?"*

6. **Improvement Suggestions:**
   > "If you could rewrite one label, message, or instruction to make it clearer, which would it be and how would you change it?"

   *[Open text response]*

---

## Participant Recruitment

### Target Sample: 20-25 Participants

**Segmentation (Anderson-Stanier's Context-Aware Research):**

#### Segment 1: Domain Novices (n=8-10)
- **Profile:** No background in satellite operations or collection management
- **Why:** Tests if copy is accessible to new users/stakeholders
- **Recruitment:** General UX research panel

#### Segment 2: Adjacent Domain Users (n=6-8)
- **Profile:** Work in related fields (aerospace, logistics, operations) but not satellite collection
- **Why:** Have some domain familiarity but not expert - realistic primary user base
- **Recruitment:** LinkedIn, professional networks

#### Segment 3: Domain Experts (n=6-7)
- **Profile:** Currently work in satellite operations or collection management
- **Why:** Tests if we've over-simplified or used incorrect terminology
- **Recruitment:** Current users, industry contacts

### Validation Through Diversity

**Anderson-Stanier Empathy Principle:**
Diverse participants reveal different comprehension barriers.

**Additional Considerations:**
- Include non-native English speakers (if applicable to user base)
- Mix of literacy levels (Colter's low-literacy focus)
- Range of technical comfort levels
- Age diversity (different mental models)

---

## Testing Logistics

### Format: Remote, Unmoderated

**Why Unmoderated? (Anderson-Stanier Approach)**
- Reduces participant nervousness/performance pressure
- Allows participants to work at their own pace
- More scalable - can test 25 participants efficiently
- Removes facilitator bias in interpretation

**Platform:** UserTesting, Maze, or OptimalSort

### Timeline

**Phase 1: Pilot (2-3 participants)**
- **Goal:** Validate test clarity and timing
- **Colter's Validation:** Do the test instructions themselves pass plain language standards?
- **Duration:** 1 week

**Phase 2: Full Test (20-25 participants)**
- **Duration:** 2 weeks
- **Stagger releases:** 5 participants/day to monitor for issues

**Phase 3: Analysis (1 week)**
- Quantitative analysis (card sort agreement, scenario accuracy, SEQ scores)
- Qualitative coding (open responses)
- Cross-segment comparison

**Phase 4: Reporting (3 days)**
- Synthesis of findings
- Prioritized recommendations
- Quick-win copy improvements

### Total Duration: 4-5 weeks

---

## Analysis Framework

### Quantitative Metrics

**Card Sorting:**
- Agreement matrix (% agreement per card per category)
- Confusion matrix (common misplacements)
- Sort time distribution

**Scenario Comprehension:**
- Accuracy rate per scenario
- Confidence-accuracy correlation
- Time per scenario

**Terminology Matching:**
- Accuracy per term pair
- '?' frequency (uncertainty markers)

**SEQ Scores:**
- Mean score per flow
- Distribution analysis
- Segment comparison

### Qualitative Analysis (Colter's Content Focus)

**Thematic Coding of Open Responses:**

**Code Categories:**
- **Jargon concerns:** Technical terms causing confusion
- **Ambiguity:** Multiple possible interpretations
- **Missing information:** Context needed but not provided
- **Tone issues:** Copy feels too formal/informal/robotic
- **Action clarity:** Unclear what will happen next
- **Positive examples:** Copy that works well

**Frequency Analysis:**
- Which terms appear most in "confusion" feedback?
- Which scenarios generate most open comments?

### Synthesis: The Understandability Matrix

**For Each UI Copy Element:**

| Copy Element | Accuracy | Confidence | SEQ | Open Feedback | Priority |
|--------------|----------|------------|-----|---------------|----------|
| "Refresh Data Sources" | 95% | 85% | 6.5 | Positive | ✅ Keep |
| "Show all quality tiers" | 68% | 45% | 4.2 | "Confusing toggle" | 🔴 Revise |
| "Collection Deck" | 78% | 62% | 5.1 | "Not sure what this is" | 🟡 Clarify |

**Priority Legend:**
- 🔴 High Priority: <70% accuracy OR <60% confidence OR SEQ <5.0
- 🟡 Medium Priority: 70-79% accuracy OR 60-69% confidence OR SEQ 5.0-5.9
- ✅ Low Priority: ≥80% accuracy AND ≥70% confidence AND SEQ ≥6.0

---

## Recommendations Framework

### Copy Revision Strategy

**Colter's Plain Language Hierarchy:**

1. **Use Familiar Words**
   - Before: "Tasking Window"
   - After: "Collection Time Period" or "When to Schedule"

2. **Active Voice, Clear Actions**
   - Before: "Data sources will be refreshed"
   - After: "Refresh data sources" or "Get latest data"

3. **Specific Over General**
   - Before: "Processing"
   - After: "Building your collection (2 minutes remaining)"

4. **Progressive Disclosure**
   - Start with plain language
   - Offer technical terms as secondary information
   - Example: "Collection Time Period (Tasking Window)"

### Implementation Roadmap

**Quick Wins (Week 1):**
- Fix copy with <70% comprehension
- Replace identified jargon with plain alternatives
- Add clarifying text where needed

**Medium-Term (Month 1):**
- Redesign confusing flows
- Add contextual help for complex concepts
- A/B test revised copy

**Long-Term (Quarter 1):**
- Establish UX writing style guide
- Create terminology glossary
- Implement inline tooltips for technical terms

---

## Success Criteria for Testing Program

**Test Quality (Anderson-Stanier Standards):**
- [ ] ≥20 participants recruited across 3 segments
- [ ] Pilot test completed with refinements
- [ ] <10% participant drop-off rate
- [ ] Clear, actionable findings with examples

**Copy Quality (Colter Standards):**
- [ ] ≥80% overall scenario comprehension accuracy
- [ ] Mean SEQ ≥5.5 across all flows
- [ ] No individual UI element <70% understandability
- [ ] Terminology accessible to novices while accurate for experts

**Empathy & Ethics:**
- [ ] Participants feel respected, not tested
- [ ] Test instructions are themselves clear
- [ ] Time commitment honored (<30 minutes)
- [ ] Feedback loop closed (participants told how their input was used)

---

## Appendix A: Test Script Template

### Unmoderated Test Introduction

> **Welcome! Thank you for helping us improve our application.**
>
> **What you'll do:**
> You'll help us test how clear and understandable our interface text is. This involves:
> - Sorting cards into categories (10 minutes)
> - Answering questions about what you think will happen (15 minutes)
> - Matching terms with meanings (5 minutes)
> - Rating how easy things are to understand (5 minutes)
> - Sharing your thoughts (5 minutes)
>
> **Total time: About 40 minutes**
>
> **Important:**
> - There are no right or wrong answers - we want YOUR honest reactions
> - If something is confusing, that's valuable feedback for us
> - You can skip any question you're uncomfortable with
> - Your responses are confidential
>
> **Technical setup:**
> - Use a computer (not mobile) for best experience
> - Chrome or Firefox browser recommended
> - Stable internet connection
>
> **Ready to begin?**

### Post-Test Thank You

> **Thank you for completing this test!**
>
> Your feedback will directly improve our application and make it easier for everyone to use.
>
> **What happens next:**
> We'll analyze responses from all participants over the next 2 weeks. Based on what we learn, we'll revise confusing labels and instructions.
>
> **Compensation:**
> Your [incentive] will be sent within 5 business days to [delivery method].
>
> **Questions?**
> Contact [researcher email]
>
> **Thank you again for your time and thoughtful responses!**

---

## Appendix B: Consent & Ethics

### Informed Consent Script

> **Research Consent**
>
> **Purpose:** We're testing how understandable our application's text and labels are.
>
> **What we'll collect:**
> - Your responses to sorting tasks and questions
> - Time spent on tasks
> - Open-ended feedback
> - Basic demographic info (role, experience level)
>
> **What we won't collect:**
> - Personal identifying information (unless you choose to share in feedback)
> - Screen recordings or webcam footage
> - Keystroke logging
>
> **How we'll use it:**
> - Improve application copy and labels
> - Aggregate reporting (no individual responses shared)
> - Internal research only
>
> **Your rights:**
> - Participation is voluntary
> - You may skip questions or stop at any time
> - You may request your data be deleted within 7 days
>
> **Contact:** [Researcher name and email]
>
> [ ] I consent to participate in this research

---

## Appendix C: Analysis Checklist

### Post-Test Analysis Steps

**Quantitative Analysis:**
- [ ] Calculate card sort agreement matrix
- [ ] Identify consistently misplaced cards (confusion indicators)
- [ ] Calculate scenario accuracy rates
- [ ] Calculate confidence-accuracy correlation
- [ ] Compute SEQ means and distributions
- [ ] Calculate terminology matching accuracy
- [ ] Segment comparison (novice vs expert)

**Qualitative Analysis:**
- [ ] Code open responses by theme
- [ ] Extract direct quotes for reporting
- [ ] Identify patterns in "confusion" moments
- [ ] List all jargon/terminology concerns
- [ ] Note positive feedback (what works well)

**Synthesis:**
- [ ] Create understandability matrix
- [ ] Prioritize copy revisions (red/yellow/green)
- [ ] Map findings to specific UI locations
- [ ] Draft before/after copy recommendations
- [ ] Estimate implementation effort

**Reporting:**
- [ ] Executive summary (2 pages)
- [ ] Detailed findings by test section
- [ ] Participant quotes with context
- [ ] Prioritized recommendation list
- [ ] Implementation roadmap

---

## Appendix D: Expert Panel Principles Applied

### Angela Colter's Contributions

**Core Principles Embedded in Test:**

1. **Plain Language Testing**
   - Test instructions themselves use plain language
   - Validation of "first-read comprehension"
   - Focus on understandability for diverse literacy levels

2. **Anticipatory UX**
   - Scenario-based testing predicts comprehension without live interaction
   - Reduces need for high-fidelity prototypes
   - Faster iteration on copy

3. **Content-First Approach**
   - Testing copy independent of visual design
   - Validates that words alone carry meaning
   - Identifies where visual support is needed

**Validation Against Colter's Standards:**
- ✅ Users understand on first read
- ✅ No specialized knowledge required
- ✅ Clear action → outcome relationship
- ✅ Accessible to low-literacy users

### Nikki Anderson-Stanier's Contributions

**Research Methodology Principles:**

1. **Empathy-Driven Design**
   - Participant comfort prioritized
   - No "gotcha" questions or tricks
   - Genuine curiosity about user perspective

2. **Methodological Rigor**
   - Clear research questions → methodology mapping
   - Quantitative + qualitative data
   - Segment-based analysis for context

3. **Pragmatic Descoping**
   - Focus on most critical UI copy
   - 40 minutes participant time (respectful)
   - Unmoderated format for scale

4. **Curiosity Over Scripts**
   - Open-ended questions allow unexpected insights
   - "Why did you choose this?" probes mental models
   - Space for participant voice

**Validation Against Anderson-Stanier Standards:**
- ✅ Research goals clearly defined
- ✅ Methodology fits questions
- ✅ Participant experience considered
- ✅ Scalable and efficient
- ✅ Actionable insights prioritized

---

## Conclusion

This closed test provides a rigorous, empathetic, and actionable assessment of UX copy understandability. By combining:

- **Colter's plain language expertise** → Validates clarity and accessibility
- **Anderson-Stanier's research methodology** → Ensures valid, reliable insights
- **Closed testing approach** → Efficient, quantifiable, scalable

We gain confidence that our application copy serves users effectively - or identify exactly where it needs improvement.

**Expected Outcomes:**
1. Quantitative understandability scores for all major UI copy
2. Prioritized list of copy revisions (high/medium/low priority)
3. Evidence-based recommendations grounded in user comprehension
4. Baseline metrics for future copy testing
5. Improved user confidence and task success

**Timeline:** 4-5 weeks from pilot to recommendations
**Investment:** 20-25 participants × $75-100 incentive = $1,500-2,500
**ROI:** Reduced user errors, support tickets, and training needs; increased user confidence and task completion rates

---

*Test designed by: UX Writing & Research Panel (Colter + Anderson-Stanier methodologies)*
*Application: Satellite Collection Management System*
*Date: 2025-10-22*
*Version: 1.0*
