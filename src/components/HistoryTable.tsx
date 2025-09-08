import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Column, Table2, SelectionModes } from '@blueprintjs/table';
import { Intent, Tag, Tooltip, Button, Classes, Colors, Checkbox } from '@blueprintjs/core';
import { useLocalization } from '../hooks/useLocalization';
import { useBackgroundProcessing } from '../contexts/BackgroundProcessingContext';
import { HistoryTableRow } from '../services/backgroundProcessingService';
import { IconNames } from '@blueprintjs/icons';
import { 
  CollectionDeckStatus, 
  AlgorithmStatus, 
  COLLECTION_STATUS_LABELS, 
  COLLECTION_STATUS_INTENTS,
  ALGORITHM_STATUS_LABELS,
  ALGORITHM_STATUS_INTENTS
} from '../constants/statusTypes';
import { NAVIGATION_LABELS, NAVIGATION_ROUTES, NAVIGATION_DESCRIPTIONS } from '../constants/navigation';
import './HistoryTable.css';

// Data interface as per requirements
interface HistoryTableRowData {
  id: string;
  name: string;
  collectionDeckStatus: CollectionDeckStatus;
  algorithmStatus: AlgorithmStatus;
  progress: number;
  createdDate: Date;
  completionDate?: Date;
}

interface HistoryTableProps {
  startDate: string | null;
  endDate: string | null;
  searchQuery?: string;
  statusFilter?: string;
  onClearFilters?: () => void;
  enableBulkActions?: boolean;
  onSelectionChange?: (selectedIndices: number[]) => void;
  newDeckId?: string; // For highlighting newly created deck
}

// Enterprise table styling constants following design best practices
const TABLE_STYLES = {
  container: `${Classes.ELEVATION_1} bp6-table-container`,
  nameCell: `${Classes.TEXT_OVERFLOW_ELLIPSIS}`,
  statusCell: 'bp6-status-cell',
  progressCell: 'bp6-progress-cell',
  actionCell: 'bp6-action-cell',
  dateCell: 'bp6-date-cell',
  numericCell: 'bp6-numeric-cell',
  emptyState: `${Classes.NON_IDEAL_STATE} ${Classes.CALLOUT}`
};

const HistoryTable: React.FC<HistoryTableProps> = ({ 
  startDate, 
  endDate, 
  searchQuery = '', 
  statusFilter = 'all',
  onClearFilters,
  enableBulkActions = false,
  onSelectionChange,
  newDeckId
}) => {
  const navigate = useNavigate();
  const { jobs } = useBackgroundProcessing();
  const { t } = useLocalization();
  const [selectedRows, setSelectedRows] = React.useState<number[]>([]);
  const [selectAll, setSelectAll] = React.useState(false);

  // Helper function to check if a deck is newly created
  const isNewlyCreatedDeck = React.useCallback((deckId: string): boolean => {
    return newDeckId === deckId;
  }, [newDeckId]);

  const filteredData = useMemo(() => {
    let filtered = jobs;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(job => 
        job.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(job => 
        job.collectionDeckStatus === statusFilter
      );
    }

    // Apply date filters (if implemented)
    if (startDate || endDate) {
      filtered = filtered.filter(job => {
        const jobDate = job.createdDate;
        if (startDate && jobDate < new Date(startDate)) return false;
        if (endDate && jobDate > new Date(endDate)) return false;
        return true;
      });
    }

    return filtered;
  }, [jobs, searchQuery, statusFilter, startDate, endDate]);

  // Bulk selection handlers
  const handleSelectAll = React.useCallback(() => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      const allIndices = filteredData.map((_, index) => index);
      setSelectedRows(allIndices);
      setSelectAll(true);
    }
  }, [selectAll, filteredData]);

  const handleRowSelect = React.useCallback((rowIndex: number) => {
    const isSelected = selectedRows.includes(rowIndex);
    let newSelection: number[];
    
    if (isSelected) {
      newSelection = selectedRows.filter(index => index !== rowIndex);
    } else {
      newSelection = [...selectedRows, rowIndex];
    }
    
    setSelectedRows(newSelection);
    setSelectAll(newSelection.length === filteredData.length);
    
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  }, [selectedRows, filteredData.length, onSelectionChange]);

  // Update selectAll state when filtered data changes
  React.useEffect(() => {
    if (selectedRows.length === 0) {
      setSelectAll(false);
    } else if (selectedRows.length === filteredData.length && filteredData.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedRows.length, filteredData.length]);

  // Selection column renderer
  const selectionCellRenderer = (rowIndex: number) => {
    if (!enableBulkActions) return <Cell />;
    
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;
    
    const isSelected = selectedRows.includes(rowIndex);
    
    return (
      <Cell>
        <Checkbox 
          checked={isSelected}
          onChange={() => handleRowSelect(rowIndex)}
          style={{ margin: '0', padding: '8px' }}
        />
      </Cell>
    );
  };

  // Header selection renderer
  const selectionHeaderRenderer = () => {
    if (!enableBulkActions) return null;
    
    return (
      <Checkbox 
        checked={selectAll}
        indeterminate={selectedRows.length > 0 && selectedRows.length < filteredData.length}
        onChange={handleSelectAll}
        style={{ margin: '0', padding: '8px' }}
      />
    );
  };

  // Cell Renderers with Blueprint design system compliance
  const nameCellRenderer = (rowIndex: number) => {
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;
    
    const isNewDeck = isNewlyCreatedDeck(item.id);
    
    return (
      <Cell 
        className={TABLE_STYLES.nameCell}
        style={isNewDeck ? {
          backgroundColor: Colors.GREEN5,
          border: `2px solid ${Colors.GREEN3}`,
          boxShadow: '0 0 8px rgba(19, 124, 189, 0.3)',
          borderRadius: '4px'
        } : undefined}
      >
        <div 
          className="bp6-name-cell-content"
          title={item.name}
          style={isNewDeck ? {
            fontWeight: 'bold',
            color: Colors.GREEN1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          } : undefined}
        >
          {isNewDeck && <span style={{ fontSize: '16px' }}>✨</span>}
          {item.name}
          {isNewDeck && <span style={{ 
            fontSize: '11px', 
            backgroundColor: Colors.GREEN2,
            color: Colors.WHITE,
            padding: '2px 6px',
            borderRadius: '10px',
            textTransform: 'uppercase',
            fontWeight: '600',
            letterSpacing: '0.5px'
          }}>Just Created</span>}
        </div>
      </Cell>
    );
  };

  const collectionStatusCellRenderer = (rowIndex: number) => {
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;
    
    const isNewDeck = isNewlyCreatedDeck(item.id);

    const getIntent = (status: CollectionDeckStatus): Intent => {
      const intentString = COLLECTION_STATUS_INTENTS[status];
      return Intent[intentString as keyof typeof Intent] || Intent.NONE;
    };

    const getCollectionStatusText = (status: CollectionDeckStatus): string => {
      return COLLECTION_STATUS_LABELS[status];
    };

    const statusText = getCollectionStatusText(item.collectionDeckStatus);

    return (
      <Cell
        style={isNewDeck ? {
          backgroundColor: Colors.GREEN5,
          border: `2px solid ${Colors.GREEN3}`,
          borderRadius: '4px'
        } : undefined}
      >
        <Tooltip content={t('history.tooltips.collectionStatus')} position="top">
          <Tag
            intent={getIntent(item.collectionDeckStatus)}
            aria-label={`Collection deck status: ${statusText}`}
            data-testid="collection-status-tag"
            className={Classes.TEXT_SMALL}
            style={{
              fontWeight: 600,
              minWidth: '100px',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '13px', /* Ensure accessibility minimum */
              ...(isNewDeck && {
                boxShadow: '0 2px 6px rgba(19, 124, 189, 0.2)',
                transform: 'scale(1.05)'
              })
            }}
          >
            {statusText}
          </Tag>
        </Tooltip>
      </Cell>
    );
  };

  const algorithmStatusCellRenderer = (rowIndex: number) => {
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;

    const getAlgorithmIntent = (status: AlgorithmStatus): Intent => {
      const intentString = ALGORITHM_STATUS_INTENTS[status];
      return Intent[intentString as keyof typeof Intent] || Intent.NONE;
    };

    const getAlgorithmStatusText = (status: AlgorithmStatus): string => {
      return ALGORITHM_STATUS_LABELS[status];
    };

    const statusText = getAlgorithmStatusText(item.algorithmStatus);

    return (
      <Cell className={TABLE_STYLES.statusCell}>
        <Tooltip content={t('history.tooltips.algorithmStatus')} position="top">
          <Tag
            intent={getAlgorithmIntent(item.algorithmStatus)}
            aria-label={`Processing status: ${statusText}`}
            data-testid="algorithm-status-indicator"
            className={Classes.TEXT_SMALL}
            style={{
              fontWeight: 600,
              minWidth: '100px',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '13px' /* Ensure accessibility minimum */
            }}
          >
            {statusText}
          </Tag>
        </Tooltip>
      </Cell>
    );
  };

  const progressCellRenderer = (rowIndex: number) => {
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;
    
    // Workshop-compatible progress indicator using simple text and status badge
    const getProgressIntent = (progress: number): Intent => {
      if (progress === 100) return Intent.SUCCESS;
      if (progress >= 75) return Intent.PRIMARY;
      if (progress >= 25) return Intent.WARNING;
      return Intent.NONE;
    };
    
    const getProgressStatus = (progress: number): string => {
      if (progress === 100) return 'Complete';
      if (progress >= 75) return 'Almost Complete';
      if (progress >= 25) return 'In Progress';
      return 'Initializing';
    };
    
    return (
      <Cell className={TABLE_STYLES.progressCell}>
        <Tooltip content={t('history.tooltips.progressBar')} position="top">
          <div className="bp6-progress-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <Tag
              intent={getProgressIntent(item.progress)}
              minimal
              style={{
                fontWeight: 400,
                fontSize: '12px',
                minWidth: '45px',
                textAlign: 'center',
                opacity: 0.8,
                color: 'var(--bp-color-gray-500)'
              }}
            >
              {item.progress}%
            </Tag>
            {item.progress < 100 && (
              <span 
                className="bp6-progress-status"
                style={{
                  fontSize: '12px',
                  color: 'var(--bp-color-gray-500)',
                  fontStyle: 'italic'
                }}
              >
                {getProgressStatus(item.progress)}
              </span>
            )}
          </div>
        </Tooltip>
      </Cell>
    );
  };

  const actionsCellRenderer = (rowIndex: number) => {
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;

    const isReady = item.collectionDeckStatus === 'ready';
    const isFailed = item.collectionDeckStatus === 'failed';
    const isProcessing = item.collectionDeckStatus === 'processing';

    return (
      <Cell className={TABLE_STYLES.actionCell}>
        <div className="bp6-action-buttons">
          {isReady && (
            <>
              <Button
                icon={IconNames.EYE_OPEN}
                text={NAVIGATION_LABELS.VIEW_COLLECTION}
                intent={Intent.SUCCESS}
                data-testid={`view-deck-${rowIndex}`}
                className={Classes.TEXT_SMALL}
                style={{ fontSize: '12px', padding: '4px 8px', marginBottom: '4px' }}
              />
              <Tooltip content={NAVIGATION_DESCRIPTIONS.COLLECTION_OPPORTUNITIES}>
                <Button
                  icon={IconNames.SATELLITE}
                  text={NAVIGATION_LABELS.COLLECTION_OPPORTUNITIES_BTN}
                  intent={Intent.SUCCESS}
                  data-testid={`view-opportunities-${rowIndex}`}
                  className={Classes.TEXT_SMALL}
                  style={{ fontSize: '12px', padding: '4px 8px', marginRight: '4px' }}
                  onClick={() => {
                    navigate(NAVIGATION_ROUTES.COLLECTION_OPPORTUNITIES_VIEW(item.id));
                  }}
                />
              </Tooltip>
              <Tooltip content={NAVIGATION_DESCRIPTIONS.FIELD_MAPPING_REVIEW}>
                <Button
                  icon={IconNames.FLOWS}
                  text={NAVIGATION_LABELS.FIELD_MAPPINGS}
                  intent={Intent.PRIMARY}
                  data-testid={`view-mappings-${rowIndex}`}
                  className={Classes.TEXT_SMALL}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                  onClick={() => {
                    navigate(NAVIGATION_ROUTES.FIELD_MAPPING_REVIEW(item.id));
                  }}
                />
              </Tooltip>
            </>
          )}
          {isFailed && (
            <Button
              icon={IconNames.REFRESH}
              text="Retry"
              intent={Intent.WARNING}
              data-testid={`retry-deck-${rowIndex}`}
              className={Classes.TEXT_SMALL}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            />
          )}
          {isReady && (
            <Button
              icon={IconNames.DOWNLOAD}
              text={t('history.actions.downloadResults') || 'Download'}
              intent={Intent.PRIMARY}
              data-testid={`download-deck-${rowIndex}`}
              className={Classes.TEXT_SMALL}
              style={{ fontSize: '12px', padding: '4px 8px' }}
            />
          )}
          {isProcessing && (
            <div className="bp6-processing-indicator">
              {t('history.status.processing')}
            </div>
          )}
        </div>
      </Cell>
    );
  };

  const dateCellRenderer = (date?: Date) => (
    <Cell className={TABLE_STYLES.dateCell}>
      <div className="bp6-date-content">
        {date ? date.toLocaleString() : '—'}
      </div>
    </Cell>
  );


  return (
    <div 
      data-testid="history-table-container"
      className={`${TABLE_STYLES.container} bp6-history-table`}
      role="region"
      aria-label="Collection History"
    >
      <Table2 
        numRows={filteredData.length} 
        enableRowHeader={false}
        className="bp6-table bp6-enterprise-table"
        defaultRowHeight={68}
        enableColumnReordering={false}
        enableMultipleSelection={false}
        enableGhostCells={false}
        columnWidths={enableBulkActions ? [50, 200, 140, 180, 100, 120, 120, 140] : [200, 140, 180, 100, 120, 120, 140]}
      >
        {/* Temporary comment out bulk selection column due to TypeScript constraints */}
        {/* {enableBulkActions && (
          <Column 
            name=""
            cellRenderer={selectionCellRenderer}
          />
        )} */}
        <Column 
          name={t('history.columns.name') || 'Collection Name'}
          cellRenderer={nameCellRenderer}
        />
        <Column 
          name={t('history.columns.collectionStatus') || 'Status'}
          cellRenderer={collectionStatusCellRenderer}
        />
        <Column 
          name={t('history.columns.algorithmStatus') || 'Processing Update'}
          cellRenderer={algorithmStatusCellRenderer}
        />
        <Column 
          name={t('history.columns.progress') || 'Progress'}
          cellRenderer={progressCellRenderer}
        />
        <Column 
          name={t('history.columns.created') || 'Created'}
          cellRenderer={(rowIndex) => dateCellRenderer(filteredData[rowIndex]?.createdDate)}
        />
        <Column 
          name={t('history.columns.completed') || 'Completed'}
          cellRenderer={(rowIndex) => dateCellRenderer(filteredData[rowIndex]?.completionDate)}
        />
        <Column 
          name="Actions"
          cellRenderer={actionsCellRenderer}
        />
      </Table2>
      {filteredData.length === 0 && (
        <div 
          className={`${TABLE_STYLES.emptyState}`}
          style={{ margin: '24px', textAlign: 'center', padding: '40px 20px' }}
          role="status"
          aria-live="polite"
        >
          <div className={Classes.NON_IDEAL_STATE_VISUAL}>
            <span className={Classes.ICON_LARGE}>
              {searchQuery || statusFilter !== 'all' ? '🔍' : '📁'}
            </span>
          </div>
          <div className={Classes.NON_IDEAL_STATE_TEXT} style={{ marginBottom: '12px' }}>
            {searchQuery || statusFilter !== 'all' || startDate || endDate 
              ? 'No collections match your current filters'
              : t('history.noResults')
            }
          </div>
          {(searchQuery || statusFilter !== 'all' || startDate || endDate) && (
            <div style={{ 
              fontSize: '14px', 
              color: Colors.GRAY2,
              marginBottom: '16px',
              lineHeight: '1.4'
            }}>
              {searchQuery && (
                <div>• Search: "{searchQuery}"</div>
              )}
              {statusFilter !== 'all' && (
                <div>• Status: {statusFilter}</div>
              )}
              {(startDate || endDate) && (
                <div>• Date range: {startDate || 'Any'} to {endDate || 'Any'}</div>
              )}
            </div>
          )}
          {(searchQuery || statusFilter !== 'all' || startDate || endDate) && (
            <Button 
              text="Clear All Filters"
              intent={Intent.PRIMARY}
              icon={IconNames.CROSS}
              onClick={onClearFilters}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
