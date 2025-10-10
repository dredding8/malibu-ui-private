import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  Button,
  ButtonGroup,
  Intent,
  Callout,
  H3,
  NonIdealState,
  Spinner
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Icon } from '@blueprintjs/core';
import ProgressiveDisclosureTable from './ProgressiveDisclosureTable';
import SmartViewSelector, { SmartView } from './SmartViewSelector';
import { CollectionOpportunity } from '../types/collectionOpportunities';
import { useAllocationContext } from '../contexts/AllocationContext';
import './CollectionOpportunitiesWithJTBD.css';

/**
 * CollectionOpportunitiesWithJTBD - Unified component that addresses all 4 JTBD
 * 
 * JTBD 1: Verify and Validate - Pass information with approve/reject in expandable rows
 * JTBD 2: Override Plans - Inline override button in main table
 * JTBD 3: Data Integrity - Shows TLE errors with escalation options
 * JTBD 4: Reduce Overload - Smart views for filtering
 */
export const CollectionOpportunitiesWithJTBD: React.FC = () => {
  const { state } = useAllocationContext();
  const [activeView, setActiveView] = useState<SmartView | null>(null);
  const [approvedPasses, setApprovedPasses] = useState<Set<string>>(new Set());
  const [rejectedPasses, setRejectedPasses] = useState<Set<string>>(new Set());

  // Filter opportunities based on active view
  const filteredOpportunities = useMemo(() => {
    if (!activeView) return state.opportunities;
    return state.opportunities.filter(activeView.filter);
  }, [state.opportunities, activeView]);

  // Handle pass approval
  const handlePassApprove = useCallback((opportunityId: string, passId: string) => {
    setApprovedPasses(prev => new Set(prev).add(passId));
    setRejectedPasses(prev => {
      const next = new Set(prev);
      next.delete(passId);
      return next;
    });
    console.log('Pass approved:', opportunityId, passId);
    // In real app, would update backend
  }, []);

  // Handle pass rejection
  const handlePassReject = useCallback((opportunityId: string, passId: string) => {
    setRejectedPasses(prev => new Set(prev).add(passId));
    setApprovedPasses(prev => {
      const next = new Set(prev);
      next.delete(passId);
      return next;
    });
    console.log('Pass rejected:', opportunityId, passId);
    // In real app, would update backend
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const dataIssueCount = filteredOpportunities.filter(
      o => o.dataIntegrityIssues && o.dataIntegrityIssues.length > 0
    ).length;
    
    const needsReviewCount = filteredOpportunities.filter(
      o => o.matchStatus === 'suboptimal' || o.matchStatus === 'unmatched'
    ).length;

    const passDecisionCount = Array.from(approvedPasses).length + Array.from(rejectedPasses).length;
    const totalPasses = filteredOpportunities.reduce((sum, o) => sum + (o.passes?.length || 0), 0);

    return {
      dataIssueCount,
      needsReviewCount,
      passDecisionCount,
      totalPasses
    };
  }, [filteredOpportunities, approvedPasses, rejectedPasses]);

  if (!state.opportunities || state.opportunities.length === 0) {
    return (
      <NonIdealState
        icon={<Spinner />}
        title="Loading opportunities..."
      />
    );
  }

  return (
    <div className="collection-opportunities-jtbd">
      <Card className="header-card">
        <H3>Collection Opportunities Management</H3>
        <p className="subtitle">
          Complete workflow supporting all critical jobs: verification, overrides, data integrity, and focused views
        </p>
      </Card>

      {/* Smart Views - JTBD 4: Reduce Information Overload */}
      <Card className="smart-views-card">
        <SmartViewSelector
          opportunities={state.opportunities}
          activeViewId={activeView?.id}
          onViewSelect={setActiveView}
          userSensorIds={['sat-1', 'sat-3', 'sat-5']} // Mock user sensors
        />
      </Card>

      {/* Stats Dashboard */}
      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-value">{filteredOpportunities.length}</div>
          <div className="stat-label">Opportunities</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{stats.needsReviewCount}</div>
          <div className="stat-label">Need Review</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{stats.dataIssueCount}</div>
          <div className="stat-label">Data Issues</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">
            {stats.passDecisionCount}/{stats.totalPasses}
          </div>
          <div className="stat-label">Pass Decisions</div>
        </Card>
      </div>

      {/* Key Features Callout */}
      <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
        <strong>All JTBD Features Active:</strong>
        <ul>
          <li>✅ <strong>Verify Plans:</strong> Expand rows to see pass details with approve/reject buttons</li>
          <li>✅ <strong>Override Plans:</strong> Use inline override button in action column</li>
          <li>✅ <strong>Data Integrity:</strong> Red satellite badges show TLE issues with escalation options</li>
          <li>✅ <strong>Smart Views:</strong> Filter by My Sensors, Needs Review, Critical, or Unmatched</li>
        </ul>
      </Callout>

      {/* Main Table with all JTBD features */}
      <Card className="table-card">
        <ProgressiveDisclosureTable
          opportunities={filteredOpportunities}
          onPassApprove={handlePassApprove}
          onPassReject={handlePassReject}
          enableVirtualization={true}
          defaultExpanded={new Set()}
        />
      </Card>

      {/* Action Summary */}
      {(approvedPasses.size > 0 || rejectedPasses.size > 0) && (
        <Card className="actions-summary">
          <h4>Pending Actions</h4>
          <div className="action-counts">
            <span className="approved">
              <Icon icon={IconNames.TICK_CIRCLE} /> {approvedPasses.size} Approved
            </span>
            <span className="rejected">
              <Icon icon={IconNames.CROSS} /> {rejectedPasses.size} Rejected
            </span>
          </div>
          <ButtonGroup>
            <Button intent={Intent.PRIMARY} icon={IconNames.CLOUD_UPLOAD}>
              Submit All Decisions
            </Button>
            <Button onClick={() => {
              setApprovedPasses(new Set());
              setRejectedPasses(new Set());
            }}>
              Clear Decisions
            </Button>
          </ButtonGroup>
        </Card>
      )}
    </div>
  );
};

export default CollectionOpportunitiesWithJTBD;