import React, { useMemo } from 'react';
import { Cell, Table2 } from '@blueprintjs/table';
// Import Column separately to avoid TypeScript issues
import { Column } from '@blueprintjs/table';
import { Intent, Tag, Tooltip, Button, Classes, Colors, Checkbox } from '@blueprintjs/core';
import { useLocalization } from '../hooks/useLocalization';
import { useBackgroundProcessing } from '../contexts/BackgroundProcessingContext';
import { IconNames } from '@blueprintjs/icons';
import { 
  CollectionDeckStatus, 
  AlgorithmStatus, 
  COLLECTION_STATUS_LABELS, 
  COLLECTION_STATUS_INTENTS,
  ALGORITHM_STATUS_LABELS,
  ALGORITHM_STATUS_INTENTS,
  resolveCollectionStatus
} from '../constants/statusTypes';
import './HistoryTable.css';

interface HistoryTableProps {
  startDate: string | null;
  endDate: string | null;
  searchQuery?: string;
  statusFilter?: string;
  onClearFilters?: () => void;
  enableBulkActions?: boolean;
  onSelectionChange?: (selectedIndices: number[]) => void;
  newDeckId?: string; // For highlighting newly created deck
  selectedCollectionId?: string | null; // Currently selected collection
  onCollectionSelect?: (collectionId: string | null) => void; // Selection callback
}

// Enterprise table styling constants following design best practices
const TABLE_STYLES = {
  container: `${Classes.ELEVATION_1} bp6-table-container`,
  statusCell: 'bp6-status-cell',
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
  newDeckId,
  selectedCollectionId,
  onCollectionSelect
}) => {
  const { jobs } = useBackgroundProcessing();
  const { t } = useLocalization();
  const [selectedRows, setSelectedRows] = React.useState<number[]>([]);
  const [selectAll, setSelectAll] = React.useState(false);

  // Helper function to check if a deck is newly created
  const isNewlyCreatedDeck = React.useCallback((deckId: string): boolean => {
    return newDeckId === deckId;
  }, [newDeckId]);

  // Extract column names to avoid TypeScript issues
  const algorithmStatusColumnName = t('history.columns.algorithmStatus') || 'Matching status';
  const completedColumnName = t('history.columns.completed') || 'Completed';
  const createdColumnName = t('history.columns.created') || 'Created Date';
  const collectionStatusColumnName = t('history.columns.collectionStatus') || 'Collection Deck Status';

  const filteredData = useMemo(() => {
    let filtered = jobs;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(job => 
        job.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter using granular algorithmStatus model
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(job => {
        // Handle grouped status filters
        if (statusFilter === 'processing') {
          return job.algorithmStatus === 'running' || job.algorithmStatus === 'optimizing';
        } else if (statusFilter === 'needs-attention') {
          return job.algorithmStatus === 'error' || job.algorithmStatus === 'timeout';
        } else {
          // Direct algorithmStatus match for individual statuses
          return job.algorithmStatus === statusFilter;
        }
      });
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
  const createdByCellRenderer = (rowIndex: number) => {
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;
    
    return (
      <Cell className={TABLE_STYLES.dateCell}>
        <div 
          className="bp6-created-by-content" 
          style={{
            fontSize: '14px',
            color: Colors.DARK_GRAY1,
            fontWeight: '500',
            cursor: 'pointer',
            width: '100%',
            height: '100%',
            padding: '8px'
          }}
          onClick={() => handleCellClick(item.id)}
        >
          {item.createdBy}
        </div>
      </Cell>
    );
  };

  const collectionStatusCellRenderer = (rowIndex: number) => {
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;
    
    const isNewDeck = isNewlyCreatedDeck(item.id);
    
    // Use simplified status resolution
    const simplifiedStatus = resolveCollectionStatus(item.algorithmStatus);

    const getIntent = (status: CollectionDeckStatus): Intent => {
      const intentString = COLLECTION_STATUS_INTENTS[status];
      return Intent[intentString as keyof typeof Intent] || Intent.NONE;
    };

    const getCollectionStatusText = (status: CollectionDeckStatus): string => {
      return COLLECTION_STATUS_LABELS[status];
    };

    const statusText = getCollectionStatusText(simplifiedStatus);

    return (
      <Cell
        style={isNewDeck ? {
          backgroundColor: Colors.GREEN5,
          border: `2px solid ${Colors.GREEN3}`,
          borderRadius: '4px'
        } : undefined}
      >
        <div 
          style={{ 
            cursor: 'pointer', 
            width: '100%', 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => handleCellClick(item.id)}
        >
          <Tooltip content={t('history.tooltips.collectionStatus')} position="top">
            <Tag
              intent={getIntent(simplifiedStatus)}
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
        </div>
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
        <div 
          style={{ 
            cursor: 'pointer',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => handleCellClick(item.id)}
        >
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
        </div>
      </Cell>
    );
  };



  const dateCellRenderer = (date?: Date, itemId?: string) => (
    <Cell className={TABLE_STYLES.dateCell}>
      <div 
        className="bp6-date-content"
        style={{
          cursor: itemId ? 'pointer' : 'default',
          width: '100%',
          height: '100%',
          padding: '8px'
        }}
        onClick={itemId ? () => handleCellClick(itemId) : undefined}
      >
        {date ? date.toLocaleString() : '—'}
      </div>
    </Cell>
  );

  // Helper function to handle row clicks
  const handleCellClick = React.useCallback((itemId: string) => {
    if (onCollectionSelect) {
      onCollectionSelect(itemId === selectedCollectionId ? null : itemId);
    }
  }, [onCollectionSelect, selectedCollectionId]);

  // Define columns to work around TypeScript issue
  const columns = React.useMemo(() => {
    const cols = [];
    
    // Collection Name column
    cols.push(
      <Column 
        key="name"
        name="Collection Name"
        cellRenderer={(rowIndex) => {
          const item = filteredData[rowIndex];
          if (!item) return <Cell />;
          const isSelected = item.id === selectedCollectionId;
          const isNew = isNewlyCreatedDeck(item.id);
          
          return (
            <Cell
              style={{
                backgroundColor: isSelected ? Colors.BLUE5 : isNew ? Colors.GREEN5 : undefined,
                borderLeft: isSelected ? `3px solid ${Colors.BLUE3}` : undefined,
                transition: 'background-color 0.15s ease'
              }}
            >
              <div 
                style={{ 
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '14px',
                  color: Colors.DARK_GRAY1,
                  padding: '8px 4px',
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }}
                onClick={() => handleCellClick(item.id)}
              >
                {item.name}
              </div>
            </Cell>
          );
        }}
      />
    );
    
    // Created Date column
    cols.push(
      <Column 
        key="created"
        name={createdColumnName}
        cellRenderer={(rowIndex) => {
          const item = filteredData[rowIndex];
          return dateCellRenderer(item?.createdDate, item?.id);
        }}
      />
    );
    
    // Created By column
    cols.push(
      <Column 
        key="createdBy"
        name="Created By"
        cellRenderer={createdByCellRenderer}
      />
    );
    
    // Collection Status column
    cols.push(
      <Column 
        key="collectionStatus"
        name={collectionStatusColumnName}
        cellRenderer={collectionStatusCellRenderer}
      />
    );
    
    // Algorithm Status column
    cols.push(
      <Column 
        key="algorithmStatus"
        name={algorithmStatusColumnName}
        cellRenderer={algorithmStatusCellRenderer}
      />
    );
    
    // Completed Date column
    cols.push(
      <Column 
        key="completed"
        name={completedColumnName}
        cellRenderer={(rowIndex) => {
          const item = filteredData[rowIndex];
          return dateCellRenderer(item?.completionDate, item?.id);
        }}
      />
    );
    
    return cols;
  }, [filteredData, selectedCollectionId, isNewlyCreatedDeck, createdColumnName, collectionStatusColumnName, algorithmStatusColumnName, completedColumnName, dateCellRenderer, createdByCellRenderer, collectionStatusCellRenderer, algorithmStatusCellRenderer, handleCellClick]);

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
        columnWidths={enableBulkActions ? [50, 250, 120, 120, 140, 180, 120] : [250, 120, 120, 140, 180, 120]}
        onSelection={(regions) => {
          if (regions.length > 0 && regions[0].rows) {
            const rowIndex = regions[0].rows[0];
            const item = filteredData[rowIndex];
            if (item && onCollectionSelect) {
              onCollectionSelect(item.id === selectedCollectionId ? null : item.id);
            }
          }
        }}
        getCellClipboardData={(row) => {
          return filteredData[row]?.name || '';
        }}
      >
        {columns}
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
              aria-label="Clear all filters"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
