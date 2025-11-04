# SEQ Quick Reference Guide
## Single Ease Question System - Developer Cheat Sheet

---

## 🎯 Current Task Coverage

| User Task | Status | Component | Task ID |
|-----------|--------|-----------|---------|
| **TASK 2:** Manually Add New Satellite | ✅ Live | AddSCC.tsx | `task_2_manually_add_satellite` |
| **TASK 4:** Edit Satellite Data | ✅ Live | UnifiedOpportunityEditor.tsx | `task_4_edit_satellite_{mode}` |
| **TASK 6+8+9:** Collection Deck Wizard | ✅ Live | CreateCollectionDeck.tsx | `task_6_8_9_collection_deck_wizard` |

---

## 🚀 5-Minute Integration Guide

### Step 1: Import Dependencies
```typescript
import { SingleEaseQuestion, SEQResponse } from '../components/SEQ/SingleEaseQuestion';
import { seqService } from '../services/seqService';
```

### Step 2: Add State
```typescript
const [showSEQ, setShowSEQ] = useState(false);
```

### Step 3: Trigger SEQ After Task Success
```typescript
const handleTaskComplete = async () => {
  // Your save logic...
  await saveSomething();

  // SEQ trigger (33% sampling)
  if (seqService.shouldShowSEQ('task_X_your_task_id')) {
    setTimeout(() => setShowSEQ(true), 500); // 500ms delay
  } else {
    navigate('/next-page'); // Skip SEQ
  }
};
```

### Step 4: Add Response Handlers
```typescript
const handleSEQResponse = useCallback((response: SEQResponse) => {
  seqService.recordResponse(response);
  setShowSEQ(false);
  navigate('/next-page');
}, [navigate]);

const handleSEQDismiss = useCallback(() => {
  seqService.recordDismissal('task_X_your_task_id', 'TASK X: Task Name');
  setShowSEQ(false);
  navigate('/next-page');
}, [navigate]);
```

### Step 5: Render SEQ Component
```typescript
{showSEQ && (
  <SingleEaseQuestion
    taskId="task_X_your_task_id"
    taskName="TASK X: Human-Readable Task Name"
    onResponse={handleSEQResponse}
    onDismiss={handleSEQDismiss}
    enableComment={false} // Set to true for complex tasks
    sessionId={seqService.getSessionId()}
  />
)}
```

---

## 📋 Task ID Naming Convention

**Format:** `task_{number}_{short_description}`

**Examples:**
- `task_2_manually_add_satellite`
- `task_4_edit_satellite_standard`
- `task_10_export_collection_deck`

**Best Practices:**
- Use lowercase with underscores
- Include task number from user requirements
- Keep description concise (3-5 words)
- Use consistent terminology across tasks

---

## ⚙️ Configuration Options

| Parameter | Default | Options | Use When |
|-----------|---------|---------|----------|
| `taskId` | Required | String | Unique identifier |
| `taskName` | Required | String | User-visible task name |
| `enableComment` | `false` | `true/false` | Complex tasks needing feedback |
| `autoDismissMs` | `30000` | Number (ms) | Adjust auto-close timing |
| `sessionId` | Auto | String | Use `seqService.getSessionId()` |

---

## 🎨 When to Enable Comments

| Task Complexity | Enable Comments? | Rationale |
|----------------|------------------|-----------|
| Simple form (TASK 2) | ❌ No | Quick task, minimal friction expected |
| Standard edit (TASK 4) | ❌ No | Moderate complexity, rating sufficient |
| Override mode (TASK 4) | ✅ Yes | Complex workflow, qualitative insights valuable |
| Wizard (TASK 6+8+9) | ✅ Yes | Multi-step process, detailed feedback helpful |
| Bulk operations (TASK 3) | ✅ Yes | Complex, high-value feedback |

**Rule of Thumb:** Enable comments for tasks with >3 steps or high cognitive load

---

## 🔍 Debugging SEQ

### SEQ Not Appearing?

**Check 1: Sampling Rate**
```typescript
// SEQ shows to 33% of users by default
// To force SEQ for testing:
if (process.env.NODE_ENV === 'development') {
  seqService.config.samplingRate = 1.0; // Always show
}
```

**Check 2: Integration**
```typescript
// Verify SEQ trigger is called
console.log('SEQ should show:', seqService.shouldShowSEQ('your_task_id'));
```

**Check 3: State**
```typescript
// Verify state updates
console.log('showSEQ state:', showSEQ);
```

### Data Not Saving?

**Check localStorage:**
```javascript
// Browser DevTools > Application > Local Storage
// Look for key: "seq_responses"
localStorage.getItem('seq_responses');
```

**Verify service call:**
```typescript
// Add debug logging
seqService.recordResponse(response);
console.log('SEQ response recorded:', response);
```

---

## 📊 Viewing Analytics

### Option 1: Dashboard Component
```typescript
import SEQAnalyticsDashboard from '../components/SEQ/SEQAnalyticsDashboard';

<SEQAnalyticsDashboard />
```

### Option 2: Programmatic Access
```typescript
import { seqService } from '../services/seqService';

// Get all analytics
const analytics = seqService.getAllAnalytics();

// Get specific task
const taskAnalytics = seqService.getTaskAnalytics('task_2_manually_add_satellite');

// Export all data
const exportData = seqService.exportData();
console.log(exportData);
```

---

## 🎯 SEQ Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| 6-7 | 🟢 Easy | ✅ Good UX, maintain |
| 5-6 | 🟡 Somewhat Easy | 👀 Monitor |
| 4-5 | 🟠 Neutral | 🔧 Consider improvements |
| 3-4 | 🟠 Somewhat Difficult | ⚠️ Prioritize fixes |
| 1-3 | 🔴 Difficult | 🚨 Immediate attention |

---

## 🛠️ Common Patterns

### Pattern 1: Form Submission
```typescript
const handleSubmit = async () => {
  await saveForm();

  if (seqService.shouldShowSEQ('task_X_form')) {
    setTimeout(() => setShowSEQ(true), 500);
  } else {
    navigate('/success');
  }
};
```

### Pattern 2: Modal/Dialog Close
```typescript
const handleSave = async () => {
  await saveData();

  if (seqService.shouldShowSEQ('task_X_edit')) {
    setTimeout(() => setShowSEQ(true), 500);
  } else {
    onClose(); // Close modal immediately
  }
};
```

### Pattern 3: Multi-Step Wizard
```typescript
const handleWizardComplete = async () => {
  await finalizeWizard();

  // SEQ at end of wizard
  if (seqService.shouldShowSEQ('task_X_wizard')) {
    setShowSEQ(true);
  } else {
    navigate('/summary');
  }
};

// Alternative: SEQ after each step
const handleStepComplete = async (step) => {
  await saveStep(step);

  if (seqService.shouldShowSEQ(`task_X_step_${step}`)) {
    // Use lower sampling (15%) for per-step SEQ
    setShowSEQ(true);
  } else {
    goToNextStep();
  }
};
```

---

## ⚠️ Important Do's and Don'ts

### ✅ DO:
- Trigger SEQ **after** successful task completion
- Add 500ms delay for success feedback to register
- Use consistent task ID naming convention
- Enable comments for complex tasks (>3 steps)
- Close/navigate after SEQ response or dismissal

### ❌ DON'T:
- Show SEQ on errors or failures
- Block users from proceeding (always dismissible)
- Show multiple SEQs in rapid succession
- Use SEQ for tasks <10 seconds (too quick)
- Forget to handle both response and dismissal

---

## 🔄 Testing Checklist

Before committing SEQ integration:

- [ ] SEQ appears after successful task completion
- [ ] SEQ can be dismissed without penalty
- [ ] Keyboard shortcuts work (1-7 keys)
- [ ] Response handler saves data correctly
- [ ] Dismissal handler records dismissal
- [ ] Navigation/close happens after SEQ interaction
- [ ] Comment field appears if `enableComment={true}`
- [ ] Accessible via keyboard (Tab, Enter, Escape)
- [ ] Mobile responsive (tested on small screen)
- [ ] Task ID follows naming convention

---

## 📚 Full Documentation

For comprehensive guides:
- [README.md](../src/components/SEQ/README.md) - Complete implementation guide
- [TASK_MAPPING.md](../src/components/SEQ/TASK_MAPPING.md) - User task analysis
- [SEQ_IMPLEMENTATION_SUMMARY.md](../SEQ_IMPLEMENTATION_SUMMARY.md) - Executive summary

---

## 🆘 Need Help?

**Common Issues:**
1. **SEQ not showing:** Check sampling rate (33% = only shows sometimes)
2. **Data not saving:** Verify localStorage permissions
3. **Build errors:** Ensure imports are correct
4. **TypeScript errors:** Check SEQResponse interface usage

**Contact:**
- UX Research Team: For analytics and interpretation
- Development Team: For technical implementation

---

**Last Updated:** 2025-10-20
**Version:** 1.0.0
