import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Table2,
  Column,
  Cell,
  ColumnHeaderCell,
  RenderMode,
  SelectionModes,
  Region,
  RegionCardinality
} from '@blueprintjs/table';
import {
  Button,
  Icon,
  Collapse,
  Card,
  Tag,
  ButtonGroup,
  Intent,
  Classes,
  Tooltip,
  Position
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CollectionOpportunity } from '../types/collectionOpportunities';
import OpportunityStatusIndicatorV2, { EnhancedStatusDimensions } from './OpportunityStatusIndicatorV2';
import DataIntegrityIndicator from './DataIntegrityIndicator';
import './ProgressiveDisclosureTable.css';

interface ProgressiveDisclosureTableProps {
  opportunities: CollectionOpportunity[];
  onRowSelect?: (opportunity: CollectionOpportunity) => void;
  onBatchAction?: (action: string, opportunities: CollectionOpportunity[]) => void;
  enableVirtualization?: boolean;
  defaultExpanded?: Set<string>;
  onPassApprove?: (opportunityId: string, passId: string) => void;
  onPassReject?: (opportunityId: string, passId: string) => void;
}

interface ExpandedRowData {
  [key: string]: {
    isExpanded: boolean;
    isLoading: boolean;
    details?: any;
  };
}

// Helper to convert opportunity to enhanced status
const getEnhancedStatus = (opp: CollectionOpportunity): EnhancedStatusDimensions => ({
  operational: opp.status,
  capacity: opp.capacityPercentage,
  capacityLevel: opp.capacityPercentage >= 90 ? 'critical' : 
                 opp.capacityPercentage >= 70 ? 'high' : 'normal',
  priority: opp.priority === 'critical' ? 'critical' :
            opp.priority === 'high' ? 'high' :
            opp.priority === 'medium' ? 'medium' : 'low',
  conflicts: opp.conflicts,
  trend: 'stable', // Would come from real data
  lastUpdate: opp.lastModified
});

export const ProgressiveDisclosureTable: React.FC<ProgressiveDisclosureTableProps> = ({
  opportunities,
  onRowSelect,
  onBatchAction,
  enableVirtualization = true,
  defaultExpanded = new Set(),
  onPassApprove,
  onPassReject
}) => {
  const [expandedRows, setExpandedRows] = useState<ExpandedRowData>(() => {
    const initial: ExpandedRowData = {};
    defaultExpanded.forEach(id => {
      initial[id] = { isExpanded: true, isLoading: false };
    });
    return initial;
  });

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const tableRef = useRef<Table2>(null);

  // Toggle row expansion
  const toggleRowExpansion = useCallback((opportunityId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [opportunityId]: {
        ...prev[opportunityId],
        isExpanded: !prev[opportunityId]?.isExpanded,
        isLoading: false
      }
    }));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedRow && focusedRow !== 0) return;

      switch (e.key) {
        case 'ArrowRight':
          const oppToExpand = opportunities[focusedRow];
          if (oppToExpand && !expandedRows[oppToExpand.id]?.isExpanded) {
            toggleRowExpansion(oppToExpand.id);
          }
          break;
        case 'ArrowLeft':
          const oppToCollapse = opportunities[focusedRow];
          if (oppToCollapse && expandedRows[oppToCollapse.id]?.isExpanded) {
            toggleRowExpansion(oppToCollapse.id);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const oppToToggle = opportunities[focusedRow];
          if (oppToToggle) {
            toggleRowExpansion(oppToToggle.id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedRow, opportunities, expandedRows, toggleRowExpansion]);

  // Render expand/collapse control
  const renderExpandControl = useCallback((rowIndex: number) => {
    const opportunity = opportunities[rowIndex];
    const isExpanded = expandedRows[opportunity.id]?.isExpanded;

    return (
      <Cell className="expand-control-cell">
        <Tooltip
          content={isExpanded ? "Collapse details" : "Expand details"}
          position={Position.TOP}
        >
          <Button
            minimal
            small
            icon={isExpanded ? IconNames.CHEVRON_DOWN : IconNames.CHEVRON_RIGHT}
            onClick={() => toggleRowExpansion(opportunity.id)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${opportunity.name}`}
          />
        </Tooltip>
      </Cell>
    );
  }, [opportunities, expandedRows, toggleRowExpansion]);

  // Render status with enhanced indicator
  const renderStatus = useCallback((rowIndex: number) => {
    const opportunity = opportunities[rowIndex];
    const status = getEnhancedStatus(opportunity);

    return (
      <Cell className="status-cell">
        <OpportunityStatusIndicatorV2
          status={status}
          size="medium"
          enableAnimation={true}
          showMultiDimensional={true}
        />
      </Cell>
    );
  }, [opportunities]);

  // Render name with information scent
  const renderName = useCallback((rowIndex: number) => {
    const opportunity = opportunities[rowIndex];
    const hasIssues = opportunity.conflicts.length > 0 || opportunity.status !== 'optimal';

    return (
      <Cell className="name-cell">
        <div className="name-content">
          <strong className="opportunity-name">{opportunity.name}</strong>
          <div className="name-metadata">
            <Tag minimal>{opportunity.satellite.orbit}</Tag>
            <Tag minimal>{opportunity.collectionType || 'optical'}</Tag>
            {hasIssues && (
              <Tag minimal intent={Intent.WARNING}>
                {opportunity.conflicts.length} issues
              </Tag>
            )}
          </div>
        </div>
      </Cell>
    );
  }, [opportunities]);

  // Render satellite info
  const renderSatellite = useCallback((rowIndex: number) => {
    const opportunity = opportunities[rowIndex];
    
    return (
      <Cell>
        <div className="satellite-info">
          <span className="satellite-name">{opportunity.satellite.name}</span>
          <small className={Classes.TEXT_MUTED}>
            {opportunity.satellite.function}
          </small>
        </div>
      </Cell>
    );
  }, [opportunities]);

  // Render capacity
  const renderCapacity = useCallback((rowIndex: number) => {
    const opportunity = opportunities[rowIndex];
    const capacityIntent = opportunity.capacityPercentage >= 90 ? Intent.DANGER :
                          opportunity.capacityPercentage >= 70 ? Intent.WARNING :
                          Intent.SUCCESS;

    return (
      <Cell>
        <div className="capacity-display">
          <div className="capacity-bar-container">
            <div 
              className={`capacity-bar capacity-${capacityIntent}`}
              style={{ width: `${opportunity.capacityPercentage}%` }}
            />
          </div>
          <span className="capacity-text">
            {opportunity.capacityPercentage.toFixed(1)}%
          </span>
        </div>
      </Cell>
    );
  }, [opportunities]);

  // Render priority
  const renderPriority = useCallback((rowIndex: number) => {
    const opportunity = opportunities[rowIndex];
    const priorityIntent = opportunity.priority === 'critical' ? Intent.DANGER :
                          opportunity.priority === 'high' ? Intent.WARNING :
                          opportunity.priority === 'medium' ? Intent.PRIMARY :
                          Intent.NONE;

    return (
      <Cell>
        <Tag intent={priorityIntent} minimal round>
          {opportunity.priority.toUpperCase()}
        </Tag>
      </Cell>
    );
  }, [opportunities]);

  // Render actions
  const renderActions = useCallback((rowIndex: number) => {
    const opportunity = opportunities[rowIndex];

    return (
      <Cell>
        <ButtonGroup minimal>
          <Button
            icon={IconNames.EDIT}
            small
            onClick={() => onRowSelect?.(opportunity)}
            aria-label={`Edit ${opportunity.name}`}
          />
          <Button
            icon={IconNames.MORE}
            small
            aria-label={`More actions for ${opportunity.name}`}
          />
        </ButtonGroup>
      </Cell>
    );
  }, [opportunities, onRowSelect]);

  // Handle row selection
  const onSelection = useCallback((regions: Region[]) => {
    const newSelectedRows = new Set<string>();
    
    regions.forEach(region => {
      if (region.rows) {
        const [start, end] = region.rows;
        for (let i = start; i <= end; i++) {
          if (opportunities[i]) {
            newSelectedRows.add(opportunities[i].id);
          }
        }
      }
    });

    setSelectedRows(newSelectedRows);
  }, [opportunities]);

  // Render expanded row content
  const renderExpandedContent = (opportunity: CollectionOpportunity) => {
    const isExpanded = expandedRows[opportunity.id]?.isExpanded;

    return (
      <Collapse isOpen={isExpanded} className="expanded-row-content">
        <Card elevation={0} className="detail-card">
          <div className="detail-grid">
            {/* Sites Section */}
            <div className="detail-section">
              <h6>Allocated Sites</h6>
              {opportunity.allocatedSites.length > 0 ? (
                <div className="site-list">
                  {opportunity.allocatedSites.map(site => (
                    <div key={site.id} className="site-item">
                      <span className="site-name">{site.name}</span>
                      <div className="site-capacity">
                        <span>{site.allocated}/{site.capacity}</span>
                        <div className="mini-capacity-bar">
                          <div 
                            className="mini-capacity-fill"
                            style={{ width: `${(site.allocated / site.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={Classes.TEXT_MUTED}>No sites allocated</p>
              )}
            </div>

            {/* Conflicts Section */}
            {opportunity.conflicts.length > 0 && (
              <div className="detail-section conflicts">
                <h6>Active Conflicts</h6>
                <ul className="conflict-list">
                  {opportunity.conflicts.map((conflict, idx) => (
                    <li key={idx}>
                      <span className="conflict-icon">
                        <Icon icon={IconNames.WARNING_SIGN} size={12} intent={Intent.WARNING} />
                      </span>
                      {conflict}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pass Information - JTBD 1: Verify and Validate */}
            {opportunity.passes && opportunity.passes.length > 0 && (
              <div className="detail-section">
                <h6>Collection Windows</h6>
                <div className="passes-list">
                  {opportunity.passes.slice(0, 3).map(pass => (
                    <div key={pass.id} className="pass-item">
                      <div className="pass-time">
                        <Icon icon={IconNames.TIME} />
                        <span>{new Date(pass.startTime).toLocaleTimeString()} - {new Date(pass.endTime).toLocaleTimeString()}</span>
                      </div>
                      <Tag minimal intent={pass.quality >= 4 ? Intent.SUCCESS : pass.quality >= 3 ? Intent.WARNING : Intent.DANGER}>
                        Quality: {pass.quality}/5
                      </Tag>
                      <span className="pass-site">{pass.metadata?.downlinkSite || 'Auto'}</span>
                      <ButtonGroup minimal>
                        <Button 
                          small 
                          intent={Intent.SUCCESS} 
                          icon={IconNames.TICK}
                          onClick={() => onPassApprove?.(opportunity.id, pass.id)}
                        >
                          Approve
                        </Button>
                        <Button 
                          small 
                          intent={Intent.DANGER} 
                          icon={IconNames.CROSS}
                          onClick={() => onPassReject?.(opportunity.id, pass.id)}
                        >
                          Reject
                        </Button>
                      </ButtonGroup>
                    </div>
                  ))}
                  {opportunity.passes.length > 3 && (
                    <div className="more-passes">+{opportunity.passes.length - 3} more passes</div>
                  )}
                </div>
              </div>
            )}

            {/* Data Integrity Issues - JTBD 3: Diagnose and Escalate */}
            {opportunity.dataIntegrityIssues && opportunity.dataIntegrityIssues.length > 0 && (
              <div className="detail-section">
                <h6>Data Integrity Issues</h6>
                <DataIntegrityIndicator
                  issues={opportunity.dataIntegrityIssues}
                  satelliteId={opportunity.satellite.id}
                  onEscalate={(satId, issue) => console.log('Escalate:', satId, issue)}
                  onRetry={(satId) => console.log('Retry TLE update:', satId)}
                />
              </div>
            )}

            {/* Metadata Section */}
            <div className="detail-section">
              <h6>Additional Information</h6>
              <div className="metadata-grid">
                <div className="metadata-item">
                  <span className="label">Collection Type:</span>
                  <span className="value">{opportunity.collectionType || 'Optical'}</span>
                </div>
                <div className="metadata-item">
                  <span className="label">Match Status:</span>
                  <span className="value">{opportunity.matchStatus}</span>
                </div>
                <div className="metadata-item">
                  <span className="label">Total Passes:</span>
                  <span className="value">{opportunity.totalPasses}</span>
                </div>
                <div className="metadata-item">
                  <span className="label">Last Modified:</span>
                  <span className="value">
                    {new Date(opportunity.lastModified).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="detail-actions">
            <ButtonGroup>
              <Button intent={Intent.PRIMARY} icon={IconNames.RESOLVE}>
                Resolve Conflicts
              </Button>
              <Button icon={IconNames.DUPLICATE}>
                Reallocate Sites
              </Button>
              <Button icon={IconNames.TIMELINE_EVENTS}>
                View History
              </Button>
            </ButtonGroup>
          </div>
        </Card>
      </Collapse>
    );
  };

  // Compute row heights including expanded content
  const rowHeights = useMemo(() => {
    return opportunities.map((opp, idx) => {
      const baseHeight = 50;
      const isExpanded = expandedRows[opp.id]?.isExpanded;
      return isExpanded ? baseHeight + 200 : baseHeight; // Adjust based on content
    });
  }, [opportunities, expandedRows]);

  return (
    <div className="progressive-disclosure-table">
      <Table2
        ref={tableRef}
        numRows={opportunities.length}
        renderMode={enableVirtualization ? RenderMode.BATCH : RenderMode.NONE}
        enableRowHeader={false}
        enableMultipleSelection={true}
        selectionModes={SelectionModes.ROWS_ONLY}
        onSelection={onSelection}
        rowHeights={rowHeights}
        onFocusedCell={(focusedCell) => {
          if (focusedCell?.row !== undefined) {
            setFocusedRow(focusedCell.row);
          }
        }}
        className="opportunity-table"
      >
        <Column
          key="expand"
          name=""
          cellRenderer={renderExpandControl}
          columnHeaderCellRenderer={() => <ColumnHeaderCell />}
        />
        <Column
          key="status"
          name="Status"
          cellRenderer={renderStatus}
          columnHeaderCellRenderer={() => (
            <ColumnHeaderCell name="Status" />
          )}
        />
        <Column
          key="name"
          name="Opportunity"
          cellRenderer={renderName}
          columnHeaderCellRenderer={() => (
            <ColumnHeaderCell name="Opportunity" />
          )}
        />
        <Column
          key="satellite"
          name="Satellite"
          cellRenderer={renderSatellite}
          columnHeaderCellRenderer={() => (
            <ColumnHeaderCell name="Satellite" />
          )}
        />
        <Column
          key="capacity"
          name="Capacity"
          cellRenderer={renderCapacity}
          columnHeaderCellRenderer={() => (
            <ColumnHeaderCell name="Capacity" />
          )}
        />
        <Column
          key="priority"
          name="Priority"
          cellRenderer={renderPriority}
          columnHeaderCellRenderer={() => (
            <ColumnHeaderCell name="Priority" />
          )}
        />
        <Column
          key="actions"
          name="Actions"
          cellRenderer={renderActions}
          columnHeaderCellRenderer={() => (
            <ColumnHeaderCell name="Actions" />
          )}
        />
      </Table2>

      {/* Render expanded content for each row */}
      <div className="expanded-content-container">
        {opportunities.map(opp => (
          <div key={opp.id} className="expanded-wrapper">
            {renderExpandedContent(opp)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressiveDisclosureTable;