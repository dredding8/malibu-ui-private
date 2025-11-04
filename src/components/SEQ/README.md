# Single Ease Question (SEQ) System

## Overview

The Single Ease Question (SEQ) system is a lightweight, evidence-based post-task usability metric integrated into the Malibu application. SEQ measures task difficulty on a 7-point scale immediately after task completion, providing actionable UX insights with minimal user burden.

## Design Principles

This implementation follows UX research best practices and Laws of UX principles:

### 1. **Peak-End Rule** (Kahneman)
- SEQ appears immediately after task completion to capture peak emotional response
- 500ms delay allows success feedback to register before prompting

### 2. **Cognitive Load Minimization** (Miller's Law)
- Single question only (not a multi-question survey)
- 7-point scale (within working memory limits)
- Keyboard shortcuts (1-7) for rapid response

### 3. **Aesthetic-Usability Effect**
- Blueprint design system integration
- Visually appealing, non-intrusive presentation
- Smooth animations and transitions

### 4. **Postel's Law** (Robustness Principle)
- Optional participation (dismissible without penalty)
- Graceful handling of all input states
- No blocking or forced completion

## Implementation Details

### Architecture

```
src/components/SEQ/
├── SingleEaseQuestion.tsx       # Main SEQ component
├── SingleEaseQuestion.css       # Component styles
├── SEQAnalyticsDashboard.tsx    # Research dashboard
├── SEQAnalyticsDashboard.css    # Dashboard styles
└── README.md                    # This file

src/services/
└── seqService.ts                # Data collection & analytics service
```

### Sampling Strategy

**Rate:** 33% of task completions (configurable)

**Rationale:**
- Prevents survey fatigue (ethnographic research principle)
- Sufficient sample size for statistical significance (n≥10-15 per task)
- Respects user time and attention

**Implementation:**
```typescript
if (seqService.shouldShowSEQ(taskId)) {
  setShowSEQ(true);
}
```

### Current Integrations

SEQ is currently integrated at these key task completion points aligned with actual user tasks:

| User Task | SEQ Task ID | Task Name | Comment Enabled | Component | Status |
|-----------|-------------|-----------|----------------|-----------|--------|
| **TASK 2** | `task_2_manually_add_satellite` | Manually Add New Satellite | No | AddSCC.tsx | ✅ Active |
| **TASK 4** | `task_4_edit_satellite_quick` | Edit Satellite Data (quick mode) | No | UnifiedOpportunityEditor.tsx | ✅ Active |
| **TASK 4** | `task_4_edit_satellite_standard` | Edit Satellite Data (standard mode) | No | UnifiedOpportunityEditor.tsx | ✅ Active |
| **TASK 4** | `task_4_edit_satellite_override` | Edit Satellite Data (override mode) | **Yes** | UnifiedOpportunityEditor.tsx | ✅ Active |
| **TASK 6+8+9** | `task_6_8_9_collection_deck_wizard` | Initiate Deck, Edit Parameters, Run Matching (Complete Wizard) | **Yes** | CreateCollectionDeck.tsx | ✅ Active |

### Pending Task Integrations

See [TASK_MAPPING.md](./TASK_MAPPING.md) for complete task analysis and implementation roadmap:

| User Task | Priority | Status |
|-----------|----------|--------|
| TASK 1: Search for a Satellite | P2 - Medium | ⏳ Planned |
| TASK 3: Bulk Upload New Satellites | P1 - High | ⏳ Planned |
| TASK 5: Delete a Satellite | P2 - Medium | ⏳ Planned |
| TASK 7: Exclude Site Before Matching | P2 - Medium | ⏳ Planned |
| TASK 10: Export a Collection Deck | P1 - High | ⏳ Planned |
| TASK 11: Find and Download Past Decks | P2 - Medium | ⏳ Planned |

### Data Collection

**Storage:** `localStorage` (client-side)
- Key: `seq_responses`
- Format: JSON array of `SEQResponse` objects

**Future Enhancement:** API endpoint integration for centralized data collection

**Response Schema:**
```typescript
interface SEQResponse {
  taskId: string;           // Unique task identifier
  taskName: string;         // Human-readable task name
  rating: number;           // 1-7 scale
  timestamp: string;        // ISO 8601 timestamp
  sessionId: string;        // Session identifier
  userAgent: string;        // Browser/device info
  optionalComment?: string; // Qualitative feedback (if enabled)
}
```

## Usage

### Adding SEQ to a New Task

1. **Import dependencies:**
```typescript
import { SingleEaseQuestion, SEQResponse } from '../components/SEQ/SingleEaseQuestion';
import { seqService } from '../services/seqService';
```

2. **Add state:**
```typescript
const [showSEQ, setShowSEQ] = useState(false);
```

3. **Trigger SEQ after task completion:**
```typescript
const handleTaskComplete = async () => {
  // ... save logic ...

  // Show SEQ based on sampling
  if (seqService.shouldShowSEQ('my_task_id')) {
    setTimeout(() => setShowSEQ(true), 500); // Delay for success feedback
  } else {
    onClose(); // Close immediately if no SEQ
  }
};
```

4. **Add handlers:**
```typescript
const handleSEQResponse = useCallback((response: SEQResponse) => {
  seqService.recordResponse(response);
  setShowSEQ(false);
  onClose(); // Navigate or close after response
}, [onClose]);

const handleSEQDismiss = useCallback(() => {
  seqService.recordDismissal('my_task_id', 'Task name');
  setShowSEQ(false);
  onClose(); // Navigate or close after dismissal
}, [onClose]);
```

5. **Render SEQ component:**
```typescript
{showSEQ && (
  <SingleEaseQuestion
    taskId="my_task_id"
    taskName="Human-readable task description"
    onResponse={handleSEQResponse}
    onDismiss={handleSEQDismiss}
    enableComment={false} // true for complex tasks
    sessionId={seqService.getSessionId()}
  />
)}
```

### Viewing Analytics

**Method 1: Programmatic Access**
```typescript
import { seqService } from '../services/seqService';

// Get analytics for specific task
const analytics = seqService.getTaskAnalytics('task_id');

// Get all analytics
const allAnalytics = seqService.getAllAnalytics();

// Export all data
const exportData = seqService.exportData();
```

**Method 2: Analytics Dashboard Component**
```typescript
import SEQAnalyticsDashboard from '../components/SEQ/SEQAnalyticsDashboard';

// Render dashboard
<SEQAnalyticsDashboard />
```

## Interpreting Results

### SEQ Score Interpretation

| Score Range | Label | Interpretation | Action |
|-------------|-------|----------------|--------|
| 6.0 - 7.0 | **Easy** | Task is intuitive and user-friendly | Maintain current design |
| 5.0 - 5.9 | **Somewhat Easy** | Task is acceptable | Monitor for patterns |
| 4.0 - 4.9 | **Neutral** | Task has room for improvement | Consider UX enhancements |
| 3.0 - 3.9 | **Somewhat Difficult** | Task causes friction | Prioritize improvements |
| 1.0 - 2.9 | **Difficult** | Task needs immediate attention | Conduct user interviews |

### Statistical Significance

- **Minimum responses:** 10-15 per task for reliable insights
- **Sample size calculation:** With 33% sampling, expect this many task completions needed:
  - For 10 responses: ~30 completions
  - For 20 responses: ~60 completions
  - For 50 responses: ~150 completions

### Research Workflow

1. **Monitor Dashboard:** Review SEQ scores weekly
2. **Identify Pain Points:** Tasks scoring < 4.0
3. **Qualitative Follow-up:** Read user comments for context
4. **User Interviews:** Conduct 5-7 interviews for problematic tasks
5. **Implement Fixes:** Address identified friction points
6. **Re-measure:** Track SEQ improvement post-changes

## Configuration

### Adjusting Sampling Rate

```typescript
// In src/services/seqService.ts
export const seqService = new SEQService({
  samplingRate: 0.50, // Change to 50% sampling
  enableStorage: true,
  debug: process.env.NODE_ENV === 'development',
});
```

### Enabling API Integration

```typescript
export const seqService = new SEQService({
  samplingRate: 0.33,
  enableStorage: true,
  apiEndpoint: 'https://api.example.com/seq/responses', // Add endpoint
  debug: false,
});
```

## Data Privacy & Ethics

### Privacy Considerations
- **No PII:** SEQ data does not collect personally identifiable information
- **Anonymized:** Session IDs are randomized, not linked to user accounts
- **Local Storage:** Data stored client-side by default
- **Optional Participation:** Users can dismiss without penalty

### Ethical Guidelines
- **Informed Consent:** Users understand data collection purpose
- **Minimal Burden:** Single question, < 10 seconds to complete
- **Respectful Sampling:** 33% rate prevents survey fatigue
- **Actionable Use:** Collected data drives UX improvements

## Troubleshooting

### SEQ Not Appearing

**Symptoms:** SEQ never shows after task completion

**Diagnosis:**
1. Check sampling: `seqService.shouldShowSEQ('task_id')` returns `false` 67% of the time
2. Verify integration: Ensure `setShowSEQ(true)` is called after save success
3. Check console: Debug mode logs sampling decisions

**Solution:**
```typescript
// Force SEQ to always show (testing only)
seqService.config.samplingRate = 1.0;
```

### Data Not Persisting

**Symptoms:** Analytics dashboard shows no data after responses

**Diagnosis:**
1. Check localStorage: Inspect `seq_responses` key in DevTools
2. Verify service: Ensure `seqService.recordResponse()` is called
3. Check browser: Some browsers block localStorage in incognito mode

**Solution:**
- Use standard browser mode (not incognito)
- Check browser console for storage errors

### Analytics Dashboard Empty

**Symptoms:** Dashboard shows "No SEQ data collected yet"

**Diagnosis:**
1. Verify responses collected: Check `localStorage.getItem('seq_responses')`
2. Ensure task completions: SEQ only appears at 33% sampling rate
3. Check integration: Verify `handleSEQResponse` calls `recordResponse()`

**Solution:**
```typescript
// Manually trigger SEQ for testing
seqService.shouldShowSEQ = () => true; // Always show
```

## References

### Academic Research
- Sauro, J., & Lewis, J. R. (2016). *Quantifying the User Experience: Practical Statistics for User Research*. Morgan Kaufmann.
- Kahneman, D., Fredrickson, B. L., Schreiber, C. A., & Redelmeier, D. A. (1993). "When More Pain Is Preferred to Less: Adding a Better End." *Psychological Science*.

### UX Standards
- Nielsen Norman Group: [Post-Task Usability Questionnaires](https://www.nngroup.com/articles/measuring-ux/)
- Laws of UX: [Peak-End Rule](https://lawsofux.com/peak-end-rule/)
- Laws of UX: [Cognitive Load](https://lawsofux.com/cognitive-load/)

### Industry Practice
- Google HEART Framework: Happiness, Engagement, Adoption, Retention, Task Success
- Microsoft UMUX-Lite: Lightweight usability metrics
- Qualtrics XM: Experience management best practices

## Contributing

### Adding New Task Integration

When adding SEQ to a new task:

1. Choose a descriptive `taskId` (e.g., `export_opportunities_csv`)
2. Write a clear `taskName` (e.g., "Export opportunities to CSV")
3. Enable comments for complex tasks only (`enableComment: true`)
4. Add task to integration table in this README
5. Test both response and dismissal flows

### Modifying SEQ Component

Follow these guidelines:

- **Design System:** Use Blueprint components only
- **Accessibility:** Maintain WCAG AA compliance
- **Performance:** Keep bundle size minimal (< 50kb)
- **Testing:** Add unit tests for new features

## Roadmap

### Planned Enhancements

- [ ] **API Integration:** Centralized data collection endpoint
- [ ] **Advanced Analytics:** Time-series trends, cohort analysis
- [ ] **A/B Testing:** Compare SEQ scores before/after UX changes
- [ ] **Automated Alerts:** Notify team when scores drop below threshold
- [ ] **Cross-Task Comparison:** Benchmark tasks against each other
- [ ] **Export Formats:** CSV, Excel, Google Sheets integration

### Future Research

- [ ] Correlation with task completion time
- [ ] Relationship between SEQ and user retention
- [ ] Optimal sampling rates for different task complexities
- [ ] Multi-language SEQ question validation

## Contact

**UX Research Team:** For questions or feedback about SEQ system

**Technical Support:** For implementation or integration issues

---

*Last Updated: 2025-10-20*
*Version: 1.0.0*
