import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { Card, NonIdealState, Spinner } from '@blueprintjs/core';
import { useAllocationContext } from '../contexts/AllocationContext';
import { CollectionOpportunity } from '../types/collectionOpportunities';

// Reuse existing components - no duplication!
import { AllocationEditorPanel } from './AllocationEditorPanel';
import { AllocationProgressIndicator, EnhancedHealthIndicator } from './CollectionOpportunitiesUXImprovements';
import { useMemoizedHealthScores } from '../hooks/collections/useCollectionPerformance';

// We'll extract just the table component from the existing split view
import { CollectionOpportunitiesTable } from './CollectionOpportunitiesTable';

// Import styles
// import './CollectionOpportunitiesBento.css'; // File not found - styles may be in parent component

/**
 * CollectionOpportunitiesBento - A true split view implementation
 * 
 * Based on Context7 research:
 * - Uses golden ratio (62/38) for optimal visual hierarchy
 * - Persistent split panels (no sliding drawers)
 * - Conditional right panel content based on selection state
 * - Maximizes reuse of existing components
 */

interface BentoPanelProps {
  selectedIds: string[];
  opportunities: CollectionOpportunity[];
}

// Dashboard view when nothing is selected
const DashboardPanel: React.FC<BentoPanelProps> = memo(({ opportunities }) => {
  // Calculate summary statistics
  const stats = useMemo(() => {
    const total = opportunities.length;
    const allocated = opportunities.filter(o => o.matchStatus === 'baseline').length;
    const needsReview = opportunities.filter(o => o.matchStatus === 'suboptimal').length;
    const unmatched = opportunities.filter(o => o.matchStatus === 'unmatched').length;
    
    return {
      total,
      allocated,
      needsReview,
      unmatched,
      allocationRate: total > 0 ? Math.round((allocated / total) * 100) : 0
    };
  }, [opportunities]);

  return (
    <div className="bento-dashboard-panel">
      <h2>Collection Opportunities Overview</h2>
      
      {/* KPI Cards - Following Context7 recommendation for 5-7 key metrics */}
      <div className="bento-kpi-grid">
        <Card className="bento-kpi-card">
          <div className="kpi-value">{stats.total}</div>
          <div className="kpi-label">Total Opportunities</div>
        </Card>
        
        <Card className="bento-kpi-card success">
          <div className="kpi-value">{stats.allocated}</div>
          <div className="kpi-label">Allocated</div>
          <div className="kpi-percentage">{stats.allocationRate}%</div>
        </Card>
        
        <Card className="bento-kpi-card warning">
          <div className="kpi-value">{stats.needsReview}</div>
          <div className="kpi-label">Needs Review</div>
        </Card>
        
        <Card className="bento-kpi-card danger">
          <div className="kpi-value">{stats.unmatched}</div>
          <div className="kpi-label">Unmatched</div>
        </Card>
      </div>

      {/* Reuse existing progress indicator */}
      <Card className="bento-progress-section">
        <h3>Allocation Progress</h3>
        <AllocationProgressIndicator
          total={stats.total}
          allocated={stats.allocated}
          pending={stats.unmatched}
          needsReview={stats.needsReview}
        />
      </Card>

      {/* Quick Actions */}
      <Card className="bento-quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-tiles">
          <button className="action-tile">
            <span className="action-icon">🎯</span>
            <span className="action-label">Auto-Allocate</span>
          </button>
          <button className="action-tile">
            <span className="action-icon">🔄</span>
            <span className="action-label">Resolve Conflicts</span>
          </button>
          <button 
            className="action-tile"
            aria-label="Export opportunities report"
          >
            <span className="action-icon" aria-hidden="true">📊</span>
            <span className="action-label">Export Report</span>
          </button>
        </div>
        
        <div className="usage-tips">
          <h4>Pro Tips:</h4>
          <ul>
            <li>Click any row to view opportunity details</li>
            <li>Use Ctrl/Cmd+Click for multiple selections</li>
            <li>Use the filter controls to focus on specific criteria</li>
          </ul>
        </div>
      </Card>
    </div>
  );
});

// Memoized bulk operations view for multiple selections
const BulkOperationsPanel: React.FC<BentoPanelProps & { onBulkAction: (action: string) => void }> = memo(({ 
  selectedIds, 
  opportunities,
  onBulkAction 
}) => {
  const selectedOpportunities = opportunities.filter(o => selectedIds.includes(o.id));
  
  return (
    <div className="bento-bulk-panel">
      <h2>Bulk Operations</h2>
      <p>{selectedIds.length} opportunities selected</p>
      
      <Card className="bulk-summary">
        <h3>Selection Summary</h3>
        <ul>
          <li>Total Capacity: {selectedOpportunities.reduce((sum, o) => sum + o.capacity, 0)}</li>
          <li>Total Passes: {selectedOpportunities.reduce((sum, o) => sum + o.totalPasses, 0)}</li>
          <li>Sites Involved: {new Set(selectedOpportunities.flatMap(o => o.allocatedSites.map(s => s.id))).size}</li>
        </ul>
      </Card>
      
      <Card className="bulk-actions">
        <h3>Available Actions</h3>
        <button className="bp5-button bp5-intent-primary" onClick={() => onBulkAction('allocate')}>
          Bulk Allocate
        </button>
        <button className="bp5-button" onClick={() => onBulkAction('reassign')}>
          Reassign Sites
        </button>
        <button className="bp5-button" onClick={() => onBulkAction('priority')}>
          Change Priority
        </button>
        <button className="bp5-button bp5-intent-danger" onClick={() => onBulkAction('delete')}>
          Delete Selected
        </button>
      </Card>
    </div>
  );
});

// Main Bento component
export const CollectionOpportunitiesBento: React.FC = () => {
  const { 
    opportunities, 
    sites, 
    collectionDecks,
    updateOpportunity,
    isLoading 
  } = useAllocationContext();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [splitRatio, setSplitRatio] = useState(62); // Golden ratio default
  
  // Handle selection changes from table
  const handleSelectionChange = useCallback((newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds);
  }, []);
  
  // Handle opportunity updates from editor panel
  const handleSaveOpportunity = useCallback(async (opportunity: CollectionOpportunity) => {
    await updateOpportunity(opportunity.id, opportunity);
  }, [updateOpportunity]);
  
  // Handle bulk actions
  const handleBulkAction = useCallback((action: string) => {
    console.log('Bulk action:', action, 'on', selectedIds);
    // Implementation would go here
  }, [selectedIds]);
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="collection-opportunities-bento loading">
        <Spinner size={50} />
        <h3>Loading Collection Opportunities...</h3>
      </Card>
    );
  }
  
  // Determine which panel to show on the right
  const renderRightPanel = () => {
    if (selectedIds.length === 0) {
      // No selection - show dashboard
      return <DashboardPanel opportunities={opportunities} selectedIds={selectedIds} />;
    } else if (selectedIds.length === 1) {
      // Single selection - show editor
      const selectedOpportunity = opportunities.find(o => o.id === selectedIds[0]);
      if (!selectedOpportunity) return null;
      
      return (
        <AllocationEditorPanel
          opportunity={selectedOpportunity}
          selectedOpportunityIds={selectedIds}
          sites={sites}
          collectionDecks={collectionDecks}
          onSave={handleSaveOpportunity}
          onClose={() => setSelectedIds([])}
          isLoading={false}
        />
      );
    } else {
      // Multiple selection - show bulk operations
      return (
        <BulkOperationsPanel
          selectedIds={selectedIds}
          opportunities={opportunities}
          onBulkAction={handleBulkAction}
        />
      );
    }
  };
  
  return (
    <div className="collection-opportunities-bento">
      {/* Left Panel - Table (62% based on golden ratio) */}
      <div 
        className="bento-table-panel" 
        style={{ width: `${splitRatio}%` }}
      >
        <CollectionOpportunitiesTable
          opportunities={opportunities}
          sites={sites}
          onSelectionChange={handleSelectionChange}
          selectedIds={selectedIds}
        />
      </div>
      
      {/* Resizable Splitter */}
      <div 
        className="bento-splitter"
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startRatio = splitRatio;
          
          const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const deltaRatio = (deltaX / window.innerWidth) * 100;
            const newRatio = Math.max(40, Math.min(80, startRatio + deltaRatio));
            setSplitRatio(newRatio);
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
      
      {/* Right Panel - Dynamic Content (38%) */}
      <div 
        className="bento-content-panel"
        style={{ width: `${100 - splitRatio}%` }}
      >
        {renderRightPanel()}
      </div>
    </div>
  );
};