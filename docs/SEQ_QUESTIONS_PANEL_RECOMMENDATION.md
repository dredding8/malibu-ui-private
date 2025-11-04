# Single Ease Question (SEQ) Recommendations
## Expert Panel: Angela Colter (Plain Language) + Nikki Anderson-Stanier (User Research)

---

## Panel Principles Applied

**Angela Colter - Plain Language:**
- Use everyday words, not jargon ("understand" not "comprehend")
- Be specific about what we're asking
- No unnecessary words

**Nikki Anderson-Stanier - Empathetic Research:**
- Acknowledge user effort
- Make follow-up optional (reduces pressure)
- Respect participant time
- Frame questions around user goals, not system features

---

## SEQ 1: Progress Tracker (Collection Creation Wizard)

### When to Show:
After user interacts with any step of the 4-step collection creation wizard (shown on completion of each step OR when user navigates away from wizard)

### Primary Question:

> **Overall, how easy or difficult was it to understand where you are in the process and what to do next?**
>
> **Scale:** 1 (Very Difficult) → 7 (Very Easy)
>
> - 1 - Very Difficult
> - 2 - Difficult
> - 3 - Somewhat Difficult
> - 4 - Neither Easy nor Difficult
> - 5 - Somewhat Easy
> - 6 - Easy
> - 7 - Very Easy

### Optional Follow-Up (Only if rating ≤4):

> **What would have made it clearer?** *(Optional - your feedback helps us improve)*
>
> [Text area - 2-3 sentences]

---

## SEQ 2: Overall Application

### When to Show:
After user completes a meaningful task (choose ONE trigger based on primary use case):

**Option A - After Collection Management:**
Show after user views/manages collection opportunities for a collection

**Option B - After Data Source Management:**
Show after user adds or updates satellite data sources

**Option C - After Complete Workflow:**
Show after user completes entire collection creation + opportunity management cycle

### Primary Question:

> **Overall, how easy or difficult was it to accomplish what you came here to do?**
>
> **Scale:** 1 (Very Difficult) → 7 (Very Easy)
>
> - 1 - Very Difficult
> - 2 - Difficult
> - 3 - Somewhat Difficult
> - 4 - Neither Easy nor Difficult
> - 5 - Somewhat Easy
> - 6 - Easy
> - 7 - Very Easy

### Optional Follow-Up (Always shown, but optional to complete):

> **What would make this easier?** *(Optional - we read every response)*
>
> [Text area - 2-3 sentences]

---

## Panel Discussion: Design Rationale

### Why "understand where you are and what to do next" (Progress Tracker)?

**Angela Colter:**
> "We're not asking if they *liked* the progress tracker. We're asking if it did its job - helping them understand their position and next steps. That's what progress trackers are FOR."

**Nikki Anderson-Stanier:**
> "This is specific enough to be actionable. If scores are low, we know the progress indicator failed at wayfinding. Generic 'how easy was this' doesn't tell us what to fix."

---

### Why "accomplish what you came here to do" (Overall App)?

**Angela Colter:**
> "No jargon like 'complete your workflow' or 'utilize the system.' Plain language. Users think in terms of their goals, not our features."

**Nikki Anderson-Stanier:**
> "This is empathetic - it acknowledges they had a goal and respects that we're here to help THEM, not the other way around. It's also non-prescriptive - we let them define what they came to do."

---

### Why optional follow-up only for low scores (Progress Tracker) vs. always shown (Overall App)?

**Nikki Anderson-Stanier:**
> "Progress tracker is narrow - if it's working (score ≥5), there's not much to say. But overall application has more surface area. Even positive experiences can yield improvement ideas, so we show the comment field always but keep it optional to avoid pressure."

**Angela Colter:**
> "The conditional follow-up for progress tracker also reduces cognitive load. High scorers get to move on quickly. Low scorers naturally want to explain - we give them the space."

---

## Implementation Specifications

### Timing & Sampling

**Progress Tracker SEQ:**
- **Trigger:** After user completes Step 4 OR navigates away from wizard
- **Sampling:** 25% of wizard sessions (avoid survey fatigue)
- **Cooldown:** Max 1x per user per 7 days
- **Session ID:** Track to correlate with wizard step completion data

**Overall Application SEQ:**
- **Trigger:** After meaningful task completion (define based on analytics)
- **Sampling:** 15% of qualifying sessions
- **Cooldown:** Max 1x per user per 30 days
- **Session ID:** Track to correlate with user journey data

### Display Format

**Modal Overlay (Recommended):**
- Centered on screen
- Semi-transparent backdrop
- Easy to dismiss (X button + click outside)
- Clear visual hierarchy (question → scale → optional comment)

**Alternative - Subtle Slide-in (Less Intrusive):**
- Bottom-right corner
- Slide in after 2-second delay
- Auto-dismiss after 30 seconds if no interaction
- "Remind me later" option

### Accessibility

**All SEQ modals must include:**
- `role="dialog"`
- `aria-labelledby` pointing to question text
- Keyboard navigation (Tab through scale, Enter to submit, Esc to dismiss)
- Focus trap while modal is open
- Screen reader announcements for scale selection
- High contrast mode support

---

## Analysis Framework

### SEQ Score Interpretation

**Progress Tracker:**
- **Target:** Mean ≥ 6.0 (Easy)
- **Acceptable:** Mean 5.0-5.9 (Somewhat Easy)
- **Needs Improvement:** Mean 4.0-4.9 (Neutral)
- **Critical Issue:** Mean < 4.0 (Difficult)

**Overall Application:**
- **Target:** Mean ≥ 5.5 (Between Somewhat Easy and Easy)
- **Acceptable:** Mean 4.5-5.4 (Neutral to Somewhat Easy)
- **Needs Improvement:** Mean 3.5-4.4 (Somewhat Difficult to Neutral)
- **Critical Issue:** Mean < 3.5 (Difficult)

### Red Flags

1. **Bimodal distribution:** Some users rate 1-2, others rate 6-7 → Feature works well for some users but not others (segmentation issue)

2. **High variance (SD > 1.5):** Inconsistent experience → Likely depends on context or user segment

3. **Declining trend:** Scores drop over time → Novelty effect wearing off OR accumulated friction

4. **Low scores + no comments:** Users frustrated but not engaged enough to explain → Need proactive follow-up research

---

## Qualitative Analysis (Optional Comments)

### Thematic Coding Categories

**Progress Tracker Comments:**
- **Wayfinding Issues:** "Didn't know what step I was on" / "Unclear what comes next"
- **Estimation Concerns:** "Time estimate was way off" / "Not sure how long this will take"
- **Status Confusion:** "Couldn't tell if I completed a step" / "Progress bar didn't update"
- **Navigation Problems:** "Couldn't go back to previous step" / "Got lost in the flow"

**Overall Application Comments:**
- **Terminology Issues:** "Didn't understand 'Collection' vs 'Opportunity'"
- **Missing Features:** "Couldn't find how to..." / "Wish I could..."
- **Workflow Friction:** "Too many steps" / "Had to go back and forth"
- **Performance:** "Slow loading" / "System froze"
- **Positive Feedback:** "Loved the..." / "Easy to..." (don't ignore these!)

---

## Reporting Template

### Weekly SEQ Dashboard

**Progress Tracker (Week of [Date]):**
- **Mean Score:** [X.X] / 7
- **Response Count:** [N] responses ([% of opportunities])
- **Trend:** ↑ ↓ → vs. previous week
- **Distribution:** [Chart: count per rating 1-7]
- **Top Issue (from comments):** [Theme + frequency]

**Overall Application (Week of [Date]):**
- **Mean Score:** [X.X] / 7
- **Response Count:** [N] responses ([% of opportunities])
- **Trend:** ↑ ↓ → vs. previous week
- **Distribution:** [Chart: count per rating 1-7]
- **Top 3 Themes (from comments):**
  1. [Theme] ([N] mentions)
  2. [Theme] ([N] mentions)
  3. [Theme] ([N] mentions)

---

## Action Triggers

### Automated Alerts

**If Progress Tracker mean score < 5.0 for 2 consecutive weeks:**
→ Trigger: Review wizard UX, prioritize progress indicator improvements

**If Overall Application mean score < 4.5 for 2 consecutive weeks:**
→ Trigger: Convene UX review, plan deeper usability research

**If >30% of responses rate ≤3 (Difficult) on either SEQ:**
→ Trigger: Emergency UX assessment, critical usability issue

**If comment themes converge (same issue mentioned >40% of comments):**
→ Trigger: Prioritize fix for that specific issue

---

## Integration with Existing SEQ System

Based on review of `src/services/seqService.ts` and `src/components/SEQ/SingleEaseQuestion.tsx`:

### New Task IDs to Add:

```typescript
// Add to seqService.ts
export const SEQ_TASKS = {
  // ... existing tasks ...

  // New tasks
  progress_tracker: 'task_progress_tracker_wizard',
  overall_application: 'task_overall_application_usage',
} as const;

// Task configurations
export const SEQ_TASK_CONFIG = {
  [SEQ_TASKS.progress_tracker]: {
    name: 'Progress Tracker - Collection Creation Wizard',
    samplingRate: 0.25, // 25%
    cooldownDays: 7,
    showCommentIfRatingBelow: 5, // Only show comment field for ratings 1-4
  },
  [SEQ_TASKS.overall_application]: {
    name: 'Overall Application Experience',
    samplingRate: 0.15, // 15%
    cooldownDays: 30,
    showCommentIfRatingBelow: 8, // Always show comment field (any rating triggers)
  },
};
```

### Implementation Example (Progress Tracker):

```tsx
// In CreateCollectionDeck.tsx, after wizard completion or exit
import { seqService, SEQ_TASKS } from '../services/seqService';

const [showProgressSEQ, setShowProgressSEQ] = useState(false);

const handleWizardExit = useCallback(() => {
  // Show SEQ based on sampling
  if (seqService.shouldShowSEQ(SEQ_TASKS.progress_tracker)) {
    setShowProgressSEQ(true);
  } else {
    // Navigate away
    navigate('/decks');
  }
}, [navigate]);

// Render SEQ
{showProgressSEQ && (
  <SingleEaseQuestion
    taskId={SEQ_TASKS.progress_tracker}
    taskName="Progress Tracker - Collection Creation Wizard"
    question="Overall, how easy or difficult was it to understand where you are in the process and what to do next?"
    onResponse={(response) => {
      seqService.recordResponse(response);
      setShowProgressSEQ(false);
      navigate('/decks');
    }}
    onDismiss={() => {
      seqService.recordDismissal(
        SEQ_TASKS.progress_tracker,
        'Progress Tracker - Collection Creation Wizard'
      );
      setShowProgressSEQ(false);
      navigate('/decks');
    }}
    enableComment={true}
    commentPrompt="What would have made it clearer? (Optional)"
    sessionId={seqService.getSessionId()}
  />
)}
```

---

## Success Criteria

### Progress Tracker SEQ:
- ✅ Mean score ≥ 6.0 within 3 months
- ✅ <10% of users rate ≤ 3 (Difficult)
- ✅ No single issue mentioned in >25% of comments
- ✅ Novice users score similarly to experts (±0.5 points)

### Overall Application SEQ:
- ✅ Mean score ≥ 5.5 within 6 months
- ✅ <15% of users rate ≤ 3 (Difficult)
- ✅ Positive trend (scores improving month-over-month)
- ✅ Qualitative comments reveal specific, actionable improvements

---

## Panel Final Notes

**Angela Colter:**
> "Remember: SEQ measures *ease*, not *satisfaction*. A user can find something easy but still not like it. We're testing if the interface gets out of their way, not if it delights them. That's a different metric."

**Nikki Anderson-Stanier:**
> "SEQ is powerful because it's fast and non-intrusive. But it's a thermometer, not a diagnosis. Low scores tell you something's wrong; the optional comments give clues; but you'll still need deeper research (usability testing, interviews) to truly understand the 'why.'"

**Combined Recommendation:**
> "Use SEQ continuously for monitoring. When scores drop or patterns emerge, pause and do qualitative research. Don't just collect scores endlessly - act on them."

---

*SEQ Questions - Expert Panel Recommendations*
*Angela Colter (Plain Language) + Nikki Anderson-Stanier (User Research)*
*Date: 2025-10-22*
*Integration: Ready for implementation in existing SEQ system*
