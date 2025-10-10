# Assignment Review Table Implementation

Enterprise-grade satellite pass assignment review interface with comprehensive decision support.

## Overview

The Assignment Review Table component system provides a complete workflow for reviewing, approving, rejecting, or deferring satellite pass assignments. Built for handling 50-1000+ assignments with optimal performance and full accessibility compliance.

## Components

### 1. AssignmentReviewTable

**Location**: `/src/components/AssignmentReviewTable.tsx`

Main table component for assignment review workflow.

**Features**:
- Blueprint Table2 with virtualized rendering for performance
- Bulk selection and operations (approve/reject multiple assignments)
- Search and filtering
- Sortable columns (by pass ID, satellite, station, quality, status, priority)
- Pagination (25/50/100 per page)
- Row-level actions (Approve/Reject/Defer buttons)
- Integration with AssignmentDecisionPanel
- Keyboard navigation and accessibility

**Props**:
```typescript
interface AssignmentReviewTableProps {
  assignments: AssignmentReview[];
  onReviewAction: (assignmentId: string, action: AssignmentAction, justification: DecisionJustification) => Promise<void>;
  onBulkAction?: (request: BulkReviewActionRequest) => Promise<void>;
  loading?: boolean;
  currentUser: { userId: string; userName: string };
  enableBulkOperations?: boolean;
  enableDecisionPanel?: boolean;
}
```

**Usage**:
```tsx
import { AssignmentReviewTable } from './components/AssignmentReviewTable';

<AssignmentReviewTable
  assignments={assignments}
  onReviewAction={handleReviewAction}
  onBulkAction={handleBulkAction}
  loading={loading}
  currentUser={{ userId: 'user-123', userName: 'Jane Analyst' }}
  enableBulkOperations={true}
  enableDecisionPanel={true}
/>
```

### 2. AssignmentDecisionPanel

**Location**: `/src/components/AssignmentDecisionPanel.tsx`

Decision support panel for detailed assignment analysis.

**Features**:
- Comprehensive assignment details (pass info, satellite, ground station)
- System recommendation with AI confidence and reasoning
- Quality assessment breakdown with factor analysis
- Historical performance metrics and trend analysis
- Conflict detection and resolution suggestions
- Risk factor analysis with mitigation strategies
- Alternative assignment comparison
- Inline decision actions with validation
- Tabbed interface for organized information display

**Props**:
```typescript
interface AssignmentDecisionPanelProps {
  assignment: AssignmentReview;
  onClose: () => void;
  onApprove: (justification: DecisionJustification) => Promise<void>;
  onReject: (justification: DecisionJustification) => Promise<void>;
  onDefer: (justification: DecisionJustification) => Promise<void>;
}
```

**Usage**:
```tsx
import AssignmentDecisionPanel from './components/AssignmentDecisionPanel';

<AssignmentDecisionPanel
  assignment={selectedAssignment}
  onClose={() => setSelectedAssignment(null)}
  onApprove={handleApprove}
  onReject={handleReject}
  onDefer={handleDefer}
/>
```

## Type System

All types are defined in `/src/types/assignmentReview.ts`:

**Core Types**:
- `AssignmentReview` - Main assignment record
- `AssignmentAction` - Enum for review actions (APPROVE, REJECT, DEFER)
- `AssignmentStatus` - Lifecycle states
- `DecisionJustification` - Required justification for decisions
- `DecisionSupportData` - Comprehensive decision context
- `BulkReviewActionRequest` - Bulk operation payload

**Helper Functions**:
- `getRejectionReasonLabel()` - Human-readable rejection reasons
- `getDeferralReasonLabel()` - Human-readable deferral reasons
- `canReviewAssignment()` - Validates if assignment can be reviewed
- `validateReviewJustification()` - Validation logic for decisions

## Features

### Performance Optimization

**Table Virtualization**:
- Uses Blueprint Table2 with `RenderMode.BATCH`
- Only renders visible rows for 50-1000+ assignments
- Efficient pagination with configurable page sizes

**State Management**:
- Memoized filtering and sorting to prevent unnecessary re-renders
- Optimized selection state with Set data structure
- Lazy loading of decision panel content

### Decision Validation

**Business Rules**:
- Approvals: Optional justification (minimum 10 characters if provided)
- Rejections: Required category + minimum 50 character justification
- Deferrals: Required category + minimum 50 character justification
- "Other" category requires additional context field

**Client-Side Validation**:
- Real-time character count feedback
- Intent-based visual feedback (red for invalid, green for valid)
- Disabled submit button until validation passes
- Category-specific field requirements

### Accessibility (WCAG 2.1 AA)

**Keyboard Navigation**:
- `Tab` - Navigate between interactive elements
- `Space` / `Enter` - Activate buttons and checkboxes
- `Escape` - Close dialogs and cancel operations
- Arrow keys - Navigate table cells

**Screen Reader Support**:
- ARIA labels on all actions and controls
- Role attributes for proper semantic structure
- Live region announcements for status changes
- Descriptive alt text for icons

**Visual Accessibility**:
- High contrast mode support
- Focus indicators on all interactive elements
- Color-blind friendly status indicators
- Reduced motion support

### Error Handling

**User Feedback**:
- Loading states with spinners
- Empty states with helpful messaging
- Error boundaries for graceful failure
- Toast notifications for action results

**Network Resilience**:
- Async error handling with try/catch
- Loading states during API calls
- Optimistic UI updates with rollback on failure
- Retry logic for transient failures

## Integration Guide

### Step 1: Install Dependencies

Ensure you have Blueprint.js v6 installed:

```bash
npm install @blueprintjs/core @blueprintjs/table @blueprintjs/icons
```

### Step 2: Import Types

```typescript
import {
  AssignmentReview,
  AssignmentAction,
  DecisionJustification,
  BulkReviewActionRequest,
} from '../types/assignmentReview';
```

### Step 3: Implement Action Handlers

```typescript
const handleReviewAction = async (
  assignmentId: string,
  action: AssignmentAction,
  justification: DecisionJustification
) => {
  try {
    const response = await fetch(`/api/assignments/${assignmentId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, justification }),
    });

    if (!response.ok) throw new Error('Failed to submit review');

    const result = await response.json();

    // Update local state
    setAssignments(prev =>
      prev.map(a => a.id === assignmentId ? { ...a, ...result } : a)
    );
  } catch (error) {
    console.error('Review action failed:', error);
    // Show error notification to user
  }
};

const handleBulkAction = async (request: BulkReviewActionRequest) => {
  try {
    const response = await fetch('/api/assignments/bulk-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error('Failed to submit bulk action');

    const result = await response.json();

    // Update local state for all processed assignments
    setAssignments(prev =>
      prev.map(a => {
        const processed = result.processed.includes(a.id);
        return processed ? { ...a, status: getNewStatus(request.action) } : a;
      })
    );
  } catch (error) {
    console.error('Bulk action failed:', error);
    // Show error notification to user
  }
};
```

### Step 4: Render Component

```tsx
import { AssignmentReviewTable } from './components/AssignmentReviewTable';

function AssignmentReviewPage() {
  const [assignments, setAssignments] = useState<AssignmentReview[]>([]);
  const [loading, setLoading] = useState(false);

  const currentUser = {
    userId: 'user-123',
    userName: 'Jane Analyst',
  };

  return (
    <div className="assignment-review-page">
      <AssignmentReviewTable
        assignments={assignments}
        onReviewAction={handleReviewAction}
        onBulkAction={handleBulkAction}
        loading={loading}
        currentUser={currentUser}
        enableBulkOperations={true}
        enableDecisionPanel={true}
      />
    </div>
  );
}
```

## API Integration

### Single Assignment Review Endpoint

**POST** `/api/assignments/:assignmentId/review`

**Request Body**:
```json
{
  "action": "approve" | "reject" | "defer",
  "justification": {
    "category": "approval" | "quality_insufficient" | "additional_analysis_needed",
    "reason": "Detailed justification text (50+ characters for reject/defer)",
    "additionalContext": "Optional additional context"
  },
  "reviewedBy": "user-id",
  "timestamp": "2025-10-03T12:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "assignment": {
    "id": "assignment-id",
    "status": "approved",
    "decision": { ... },
    "updatedAt": "2025-10-03T12:00:00Z"
  }
}
```

### Bulk Review Endpoint

**POST** `/api/assignments/bulk-review`

**Request Body**:
```json
{
  "action": "approve" | "reject",
  "assignmentIds": ["id1", "id2", "id3"],
  "justification": { ... },
  "reviewer": {
    "userId": "user-id",
    "userName": "Jane Analyst"
  },
  "timestamp": "2025-10-03T12:00:00Z"
}
```

**Response**:
```json
{
  "success": true,
  "processed": ["id1", "id2"],
  "failed": [
    {
      "assignmentId": "id3",
      "error": "Assignment already processed",
      "reason": "Status is already 'approved'"
    }
  ],
  "summary": "Successfully processed 2 of 3 assignments",
  "totalCount": 3,
  "successCount": 2,
  "failureCount": 1
}
```

## Styling

### CSS Files

1. **AssignmentReviewTable.css** - Main table and layout styles
2. **AssignmentDecisionPanel.css** - Decision panel and detail styles

### Customization

Override CSS variables for theming:

```css
.assignment-review-table {
  --table-bg: #ffffff;
  --row-hover-bg: #f5f8fa;
  --border-color: #e1e8ed;
  --primary-color: #137cbd;
}
```

### Dark Mode

Components include automatic dark mode support:

```css
@media (prefers-color-scheme: dark) {
  .assignment-review-table {
    background: #1c2127;
  }
}
```

## Testing

### Unit Tests Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssignmentReviewTable } from './AssignmentReviewTable';

describe('AssignmentReviewTable', () => {
  it('renders assignments correctly', () => {
    const assignments = [/* mock data */];
    render(
      <AssignmentReviewTable
        assignments={assignments}
        onReviewAction={jest.fn()}
        currentUser={{ userId: '1', userName: 'Test' }}
      />
    );

    expect(screen.getByText('Assignment Review')).toBeInTheDocument();
  });

  it('handles approval action', async () => {
    const onReviewAction = jest.fn();
    render(
      <AssignmentReviewTable
        assignments={assignments}
        onReviewAction={onReviewAction}
        currentUser={{ userId: '1', userName: 'Test' }}
      />
    );

    fireEvent.click(screen.getByLabelText('Approve PASS-001'));

    await waitFor(() => {
      expect(onReviewAction).toHaveBeenCalledWith(
        'assignment-1',
        AssignmentAction.APPROVE,
        expect.any(Object)
      );
    });
  });
});
```

### Integration Tests

Test the full workflow:
1. Load assignments
2. Select multiple assignments
3. Perform bulk approval
4. Verify state updates
5. Check accessibility

## Performance Benchmarks

**Target Metrics**:
- Initial render: < 300ms for 1000 assignments
- Search/filter response: < 50ms
- Sort operation: < 100ms
- Page navigation: < 50ms
- Decision panel open: < 100ms

**Optimization Techniques**:
- React.memo for cell renderers
- useMemo for filtered/sorted data
- useCallback for event handlers
- Virtualized rendering with Blueprint Table2
- Efficient Set-based selection tracking

## Troubleshooting

### Common Issues

**1. Table not rendering assignments**
- Verify `assignments` prop is an array
- Check console for TypeScript errors
- Ensure all required fields are present in assignment objects

**2. Actions not triggering**
- Verify `onReviewAction` handler is properly async
- Check network tab for API errors
- Ensure `currentUser` prop is provided

**3. Decision panel not opening**
- Verify `enableDecisionPanel={true}` is set
- Check that assignment has valid decision support data
- Ensure CSS is properly imported

**4. Performance issues with large datasets**
- Verify pagination is enabled
- Check if unnecessary re-renders are occurring
- Use React DevTools Profiler to identify bottlenecks

## Future Enhancements

**Planned Features**:
- [ ] Export to CSV/Excel
- [ ] Advanced filtering (date range, custom queries)
- [ ] Saved filter presets
- [ ] Column customization (show/hide, reorder)
- [ ] Batch edit capabilities
- [ ] Conflict resolution workflow
- [ ] Mobile responsive design
- [ ] Real-time updates via WebSocket
- [ ] Audit trail visualization
- [ ] Keyboard shortcuts modal

## Support

For questions or issues:
- Check type definitions in `/src/types/assignmentReview.ts`
- Review example usage in `AssignmentReviewTable.example.tsx`
- Consult Blueprint.js documentation for Table2 component

## License

This implementation is part of the Collection Management system.

---

**Version**: 1.0.0
**Last Updated**: 2025-10-03
**Author**: Claude Code Assistant
