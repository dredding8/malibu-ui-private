# Assignment Review Table - Quick Start Guide

## 5-Minute Integration

### Step 1: Import Component
```tsx
import { AssignmentReviewTable } from './components/AssignmentReviewTable';
import type { AssignmentReview, AssignmentAction, DecisionJustification } from '../types/assignmentReview';
```

### Step 2: Implement Handlers
```tsx
const handleReviewAction = async (
  assignmentId: string,
  action: AssignmentAction,
  justification: DecisionJustification
) => {
  await fetch(`/api/assignments/${assignmentId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, justification }),
  });
};

const handleBulkAction = async (request: BulkReviewActionRequest) => {
  await fetch('/api/assignments/bulk-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
};
```

### Step 3: Render Component
```tsx
<AssignmentReviewTable
  assignments={assignments}
  onReviewAction={handleReviewAction}
  onBulkAction={handleBulkAction}
  currentUser={{ userId: 'user-123', userName: 'Jane Analyst' }}
/>
```

## Required API Endpoints

### 1. Single Review
```
POST /api/assignments/:assignmentId/review

Body:
{
  "action": "approve" | "reject" | "defer",
  "justification": {
    "category": "approval" | "quality_insufficient" | ...,
    "reason": "Detailed text (50+ chars for reject/defer)",
    "additionalContext": "Optional context"
  }
}
```

### 2. Bulk Review
```
POST /api/assignments/bulk-review

Body:
{
  "action": "approve" | "reject",
  "assignmentIds": ["id1", "id2", ...],
  "justification": { ... },
  "reviewer": { "userId": "...", "userName": "..." }
}
```

## Component Features

| Feature | Enabled By Default | Description |
|---------|-------------------|-------------|
| Table View | ✅ Yes | Sortable, filterable, paginated table |
| Search | ✅ Yes | Real-time search across pass/satellite/station |
| Bulk Operations | ✅ Yes | Multi-select with bulk approve/reject |
| Decision Panel | ✅ Yes | Side panel with detailed decision support |
| Pagination | ✅ Yes | 25/50/100 per page options |
| Keyboard Nav | ✅ Yes | Full keyboard accessibility |

## Props Quick Reference

```typescript
interface AssignmentReviewTableProps {
  // Required
  assignments: AssignmentReview[];
  onReviewAction: (id, action, justification) => Promise<void>;
  currentUser: { userId: string; userName: string };

  // Optional
  onBulkAction?: (request) => Promise<void>;
  loading?: boolean;
  enableBulkOperations?: boolean;  // default: true
  enableDecisionPanel?: boolean;   // default: true
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between elements |
| `Space` / `Enter` | Activate button or checkbox |
| `Escape` | Close dialog or panel |
| `Arrow Keys` | Navigate table cells |

## Status Color Codes

| Status | Color | Intent |
|--------|-------|--------|
| Pending Review | Gray | NONE |
| Approved | Green | SUCCESS |
| Rejected | Red | DANGER |
| Deferred | Orange | WARNING |
| Conditional | Blue | PRIMARY |

| Quality Score | Color | Range |
|---------------|-------|-------|
| Excellent | Green | 80-100 |
| Good | Yellow | 60-79 |
| Poor | Red | 0-59 |

## Common Customizations

### Disable Bulk Operations
```tsx
<AssignmentReviewTable
  {...props}
  enableBulkOperations={false}
/>
```

### Disable Decision Panel
```tsx
<AssignmentReviewTable
  {...props}
  enableDecisionPanel={false}
/>
```

### Custom Loading State
```tsx
<AssignmentReviewTable
  {...props}
  loading={isLoading}
/>
```

## Troubleshooting

### Table Not Rendering
- ✅ Check `assignments` is an array
- ✅ Verify all required props are provided
- ✅ Check browser console for errors

### Actions Not Working
- ✅ Verify `onReviewAction` is async
- ✅ Check network tab for API errors
- ✅ Ensure backend endpoints are implemented

### Performance Issues
- ✅ Enable pagination (default: yes)
- ✅ Check if filtering/sorting is efficient
- ✅ Verify virtualization is working (Table2)

## Support Resources

- **Full Documentation**: `ASSIGNMENT_REVIEW_IMPLEMENTATION.md`
- **Examples**: `AssignmentReviewTable.example.tsx`
- **Type Definitions**: `src/types/assignmentReview.ts`
- **Blueprint Docs**: https://blueprintjs.com/docs/#table

---

**Quick Start Version**: 1.0.0
**Last Updated**: 2025-10-03
