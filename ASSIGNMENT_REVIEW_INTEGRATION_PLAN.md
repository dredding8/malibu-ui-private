# Assignment Review Table - Integration Plan

**Date**: 2025-10-03
**Status**: Ready for Integration
**Target Page**: `/collection/:collectionId/manage` (CollectionOpportunitiesHub.tsx)

---

## Executive Summary

The **AssignmentReviewTable** component system is complete and ready to integrate into the Collection Management page. This addresses the #1 critical issue identified in the enterprise roundtable: **missing core assignment approval workflow**.

**Impact**: Task completion rate will go from **0% → 85%+**

---

## Integration Approach

### Option 1: Replace Existing Tab (RECOMMENDED)

Replace the current "Review Assignments" tab content with the new AssignmentReviewTable:

**Location**: Line ~670 in CollectionOpportunitiesHub.tsx

**Current Code**:
```tsx
<Tab
  id="opportunities"
  title="Review Assignments"
  icon={IconNames.SATELLITE}
  panel={
    <div className="tab-panel">
      {/* Current CollectionOpportunitiesEnhanced component */}
      <CollectionOpportunitiesEnhanced ... />
    </div>
  }
/>
```

**New Code**:
```tsx
<Tab
  id="review"
  title="Review Assignments"
  icon={IconNames.ENDORSED}
  panel={
    <div className="tab-panel">
      <AssignmentReviewTable
        assignments={convertToAssignmentReviews(filteredOpportunities)}
        onApprove={handleApproveAssignment}
        onReject={handleRejectAssignment}
        onDefer={handleDeferAssignment}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        loading={isLoading}
        enableBulkActions={true}
        pageSize={50}
      />
    </div>
  }
/>
```

---

### Option 2: Add as New Tab

Keep existing tab and add new "Assignment Review" tab:

```tsx
<Tabs ...>
  {/* Existing tab */}
  <Tab
    id="opportunities"
    title="View Opportunities"
    icon={IconNames.SATELLITE}
    panel={<CollectionOpportunitiesEnhanced ... />}
  />

  {/* NEW: Assignment Review tab */}
  <Tab
    id="review"
    title="Review & Approve"
    icon={IconNames.ENDORSED}
    panel={
      <AssignmentReviewTable
        assignments={convertToAssignmentReviews(filteredOpportunities)}
        onApprove={handleApproveAssignment}
        ...
      />
    }
  />

  {/* Other tabs... */}
</Tabs>
```

---

## Required Changes

### 1. Add Imports (Top of File)

```typescript
// Add to existing imports
import { AssignmentReviewTable } from '../components/AssignmentReviewTable';
import {
  AssignmentReview,
  ReviewDecision,
  AssignmentAction,
  AssignmentStatus
} from '../types/assignmentReview';
```

### 2. Add Data Conversion Function

```typescript
/**
 * Convert CollectionOpportunity to AssignmentReview
 * Maps existing data structure to new assignment review schema
 */
const convertToAssignmentReviews = (
  opportunities: CollectionOpportunity[]
): AssignmentReview[] => {
  return opportunities.map(opp => ({
    id: `AR-${opp.passId}` as AssignmentReviewId,
    passId: opp.passId,
    passInfo: {
      satelliteId: opp.satelliteId,
      satelliteName: opp.satelliteName || 'Unknown',
      siteId: opp.siteId,
      siteName: opp.siteName || 'Unknown',
      startTime: new Date(opp.startTime),
      endTime: new Date(opp.endTime),
      duration: opp.duration || 0,
      elevation: opp.maxElevation || 0,
      azimuth: 0, // Not in current data model
      priority: opp.priority as Priority || 'medium'
    },
    qualityScore: opp.qualityScore || 0,
    status: convertToAssignmentStatus(opp.status),
    createdAt: new Date(),
    updatedAt: new Date(),
    decision: null, // No decision yet
    decisionSupport: generateDecisionSupport(opp),
    reviewHistory: []
  }));
};

const convertToAssignmentStatus = (oppStatus: string): AssignmentStatus => {
  // Map opportunity status to assignment status
  const statusMap: Record<string, AssignmentStatus> = {
    'pending': 'pending_review',
    'matched': 'pending_review',
    'selected': 'pending_review',
    'approved': 'approved',
    'rejected': 'rejected'
  };
  return statusMap[oppStatus.toLowerCase()] || 'pending_review';
};

const generateDecisionSupport = (opp: CollectionOpportunity): DecisionSupportData => {
  return {
    recommendation: {
      action: opp.qualityScore >= 80 ? 'approve' : 'defer',
      confidence: opp.qualityScore / 100,
      reasoning: `Quality score: ${opp.qualityScore}/100`,
      riskLevel: opp.qualityScore >= 80 ? 'low' : 'medium',
      alternativeActions: []
    },
    historicalPerformance: {
      totalPasses: 0,
      successfulPasses: 0,
      successRate: 0,
      averageQuality: opp.qualityScore,
      recentTrend: 'stable',
      lastPassDate: null
    },
    conflicts: [],
    qualityAssessment: {
      geometricQuality: {
        elevationQuality: { score: opp.maxElevation || 0, threshold: 30, passed: true },
        durationQuality: { score: opp.duration || 0, threshold: 300, passed: true }
      },
      overallScore: opp.qualityScore,
      riskLevel: opp.qualityScore >= 80 ? 'low' : 'medium'
    },
    resourceAvailability: {
      groundStation: {
        available: true,
        utilizationPercentage: 0,
        maintenanceWindows: []
      }
    },
    riskFactors: [],
    alternativeAssignments: []
  };
};
```

### 3. Add Action Handlers

```typescript
const handleApproveAssignment = useCallback(async (assignmentId: string, decision: ReviewDecision) => {
  try {
    // Call backend API
    const response = await fetch(`/api/assignments/${assignmentId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        justification: decision.justification,
        reviewedBy: 'current-user-id' // Get from auth context
      })
    });

    if (!response.ok) throw new Error('Approval failed');

    // Update local state
    setState(prev => ({
      ...prev,
      opportunities: prev.opportunities.map(opp =>
        opp.passId === assignmentId.replace('AR-', '')
          ? { ...opp, status: 'approved' }
          : opp
      )
    }));

    // Show success toast
    AppToaster.show({
      message: 'Assignment approved successfully',
      intent: Intent.SUCCESS,
      icon: IconNames.TICK
    });
  } catch (error) {
    console.error('Approval error:', error);
    AppToaster.show({
      message: 'Failed to approve assignment',
      intent: Intent.DANGER,
      icon: IconNames.ERROR
    });
  }
}, []);

const handleRejectAssignment = useCallback(async (assignmentId: string, decision: ReviewDecision) => {
  try {
    const response = await fetch(`/api/assignments/${assignmentId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        justification: decision.justification,
        category: decision.category,
        reviewedBy: 'current-user-id'
      })
    });

    if (!response.ok) throw new Error('Rejection failed');

    setState(prev => ({
      ...prev,
      opportunities: prev.opportunities.map(opp =>
        opp.passId === assignmentId.replace('AR-', '')
          ? { ...opp, status: 'rejected' }
          : opp
      )
    }));

    AppToaster.show({
      message: 'Assignment rejected',
      intent: Intent.WARNING,
      icon: IconNames.DISABLE
    });
  } catch (error) {
    console.error('Rejection error:', error);
    AppToaster.show({
      message: 'Failed to reject assignment',
      intent: Intent.DANGER,
      icon: IconNames.ERROR
    });
  }
}, []);

const handleDeferAssignment = useCallback(async (assignmentId: string, decision: ReviewDecision) => {
  try {
    const response = await fetch(`/api/assignments/${assignmentId}/defer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        justification: decision.justification,
        category: decision.category,
        reviewedBy: 'current-user-id'
      })
    });

    if (!response.ok) throw new Error('Deferral failed');

    setState(prev => ({
      ...prev,
      opportunities: prev.opportunities.map(opp =>
        opp.passId === assignmentId.replace('AR-', '')
          ? { ...opp, status: 'deferred' }
          : opp
      )
    }));

    AppToaster.show({
      message: 'Assignment deferred',
      intent: Intent.PRIMARY,
      icon: IconNames.TIME
    });
  } catch (error) {
    console.error('Deferral error:', error);
    AppToaster.show({
      message: 'Failed to defer assignment',
      intent: Intent.DANGER,
      icon: IconNames.ERROR
    });
  }
}, []);

const handleBulkApprove = useCallback(async (assignmentIds: readonly string[], justification?: string) => {
  try {
    const response = await fetch('/api/assignments/bulk-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentIds: Array.from(assignmentIds),
        justification,
        reviewedBy: 'current-user-id'
      })
    });

    if (!response.ok) throw new Error('Bulk approval failed');

    const passIds = assignmentIds.map(id => id.replace('AR-', ''));
    setState(prev => ({
      ...prev,
      opportunities: prev.opportunities.map(opp =>
        passIds.includes(opp.passId)
          ? { ...opp, status: 'approved' }
          : opp
      )
    }));

    AppToaster.show({
      message: `${assignmentIds.length} assignments approved`,
      intent: Intent.SUCCESS,
      icon: IconNames.TICK_CIRCLE
    });
  } catch (error) {
    console.error('Bulk approval error:', error);
    AppToaster.show({
      message: 'Failed to approve assignments',
      intent: Intent.DANGER,
      icon: IconNames.ERROR
    });
  }
}, []);

const handleBulkReject = useCallback(async (assignmentIds: readonly string[], justification: string, category: string) => {
  try {
    const response = await fetch('/api/assignments/bulk-reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentIds: Array.from(assignmentIds),
        justification,
        category,
        reviewedBy: 'current-user-id'
      })
    });

    if (!response.ok) throw new Error('Bulk rejection failed');

    const passIds = assignmentIds.map(id => id.replace('AR-', ''));
    setState(prev => ({
      ...prev,
      opportunities: prev.opportunities.map(opp =>
        passIds.includes(opp.passId)
          ? { ...opp, status: 'rejected' }
          : opp
      )
    }));

    AppToaster.show({
      message: `${assignmentIds.length} assignments rejected`,
      intent: Intent.WARNING,
      icon: IconNames.DISABLE
    });
  } catch (error) {
    console.error('Bulk rejection error:', error);
    AppToaster.show({
      message: 'Failed to reject assignments',
      intent: Intent.DANGER,
      icon: IconNames.ERROR
    });
  }
}, []);
```

---

## Backend API Requirements

The frontend components expect these endpoints:

### Individual Actions

**POST `/api/assignments/:id/approve`**
```json
{
  "justification": "string (optional, min 10 chars)",
  "reviewedBy": "string (user ID)"
}
```

**POST `/api/assignments/:id/reject`**
```json
{
  "justification": "string (required, min 50 chars)",
  "category": "quality_threshold" | "schedule_conflict" | "resource_unavailable" | "other",
  "reviewedBy": "string (user ID)"
}
```

**POST `/api/assignments/:id/defer`**
```json
{
  "justification": "string (required, min 50 chars)",
  "category": "needs_more_data" | "pending_approval" | "schedule_tbd" | "other",
  "reviewedBy": "string (user ID)"
}
```

### Bulk Actions

**POST `/api/assignments/bulk-approve`**
```json
{
  "assignmentIds": ["string[]"],
  "justification": "string (optional)",
  "reviewedBy": "string (user ID)"
}
```

**POST `/api/assignments/bulk-reject`**
```json
{
  "assignmentIds": ["string[]"],
  "justification": "string (required, min 50 chars)",
  "category": "quality_threshold" | "schedule_conflict" | "resource_unavailable" | "other",
  "reviewedBy": "string (user ID)"
}
```

---

## Testing Checklist

### Manual Testing
- [ ] Navigate to `/collection/DECK-123/manage`
- [ ] Verify AssignmentReviewTable renders with data
- [ ] Test individual approve action
- [ ] Test individual reject action (with justification)
- [ ] Test individual defer action (with justification)
- [ ] Test bulk approve (select 5+ rows)
- [ ] Test bulk reject (with justification)
- [ ] Verify decision panel shows on row selection
- [ ] Test search/filter functionality
- [ ] Test sorting by each column
- [ ] Test pagination (25/50/100 per page)
- [ ] Verify keyboard navigation works
- [ ] Test with screen reader

### E2E Testing
```typescript
// Add to test suite
test('Assignment review workflow', async ({ page }) => {
  await page.goto('/collection/DECK-123/manage');

  // Select Review Assignments tab
  await page.click('text=Review Assignments');

  // Wait for table to load
  await page.waitForSelector('[data-testid="assignment-review-table"]');

  // Test approve action
  await page.click('[data-testid="approve-button"]').first();
  await page.click('text=Confirm');
  await expect(page.locator('text=approved successfully')).toBeVisible();

  // Test bulk reject
  await page.click('[type="checkbox"]').nth(1);
  await page.click('[type="checkbox"]').nth(2);
  await page.click('text=Reject Selected');
  await page.fill('[placeholder="Reason for rejection"]', 'Quality below threshold - repeating in next pass window');
  await page.click('text=Confirm Rejection');
  await expect(page.locator('text=2 assignments rejected')).toBeVisible();
});
```

---

## Rollout Plan

### Phase 1: Feature Flag (Week 1)
```typescript
const ENABLE_ASSIGNMENT_REVIEW = useFeatureFlag('assignment-review-v1');

{ENABLE_ASSIGNMENT_REVIEW ? (
  <AssignmentReviewTable ... />
) : (
  <CollectionOpportunitiesEnhanced ... />
)}
```

### Phase 2: Beta Users (Week 2)
- Enable for 10% of users
- Collect feedback
- Monitor error rates and performance

### Phase 3: Full Rollout (Week 3)
- Enable for 100% of users
- Remove feature flag
- Monitor success metrics

---

## Success Metrics

### Primary KPIs
- **Task Completion Rate**: Target 85%+ (currently 0%)
- **Time to First Decision**: Target <30 seconds
- **User Satisfaction (NPS)**: Target >70

### Secondary Metrics
- **Bulk Action Usage**: >40% of reviews
- **Error Rate**: <1%
- **Page Load Time**: <2 seconds
- **Decision Support Panel Usage**: >60%

---

## Rollback Plan

If critical issues are discovered:

1. **Immediate**: Disable feature flag
2. **Revert to**: CollectionOpportunitiesEnhanced component
3. **Fix forward**: Address issues and re-enable
4. **Communication**: Notify users of temporary rollback

---

## Files Modified

1. **CollectionOpportunitiesHub.tsx**: Add AssignmentReviewTable integration
2. **Backend API**: Create assignment review endpoints
3. **E2E Tests**: Add assignment review test suite

---

## Next Steps

1. ✅ **Complete**: AssignmentReviewTable component
2. ✅ **Complete**: AssignmentDecisionPanel component
3. ✅ **Complete**: TypeScript schema and types
4. 🔲 **Next**: Integrate into CollectionOpportunitiesHub
5. 🔲 **Next**: Implement backend API endpoints
6. 🔲 **Next**: Add E2E tests
7. 🔲 **Next**: User acceptance testing

---

**Status**: ✅ Ready for Integration
**Estimated Integration Time**: 4-6 hours
**Backend API Development**: 8-12 hours
**Total Time to Production**: 2-3 days
