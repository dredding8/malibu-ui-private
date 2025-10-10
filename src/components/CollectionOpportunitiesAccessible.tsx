import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Cell,
  Column,
  Table2,
  SelectionModes,
  RenderMode,
} from '@blueprintjs/table';
import {
  Button,
  Tag,
  Intent,
  Checkbox,
  Menu,
  MenuItem,
  MenuDivider,
  Popover,
  Position,
  Tooltip,
  InputGroup,
  Callout,
  Card,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  NavbarDivider,
  ButtonGroup,
  Classes,
  NonIdealState,
  Spinner,
  Dialog,
  Drawer,
  DrawerSize,
  H2,
  H3
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Icon } from '@blueprintjs/core';
import {
  CollectionOpportunity,
  Site,
  MatchStatus,
  Priority,
  CollectionType,
  ClassificationLevel
} from '../types/collectionOpportunities';
import { useAllocationContext } from '../contexts/AllocationContext';
import ReallocationWorkspaceAccessible from './ReallocationWorkspaceAccessible';
import './CollectionOpportunitiesAccessible.css';

interface CollectionOpportunitiesAccessibleProps {
  opportunities: CollectionOpportunity[];
  availableSites: Site[];
  onBatchUpdate: (changes: any[]) => Promise<void>;
  onOpenWorkspace?: (opportunityId: string) => void;
  capacityThresholds?: {
    critical: number;
    warning: number;
    optimal: number;
  };
  enableRealTimeValidation?: boolean;
  enableHealthAnalysis?: boolean;
  showWorkspaceOption?: boolean;
}

// Keyboard navigation help dialog
const KeyboardHelpDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <Dialog
    isOpen={isOpen}
    onClose={onClose}
    title="Keyboard Shortcuts"
    icon={IconNames.KEY}
    canEscapeKeyClose
    canOutsideClickClose
  >
    <div className={Classes.DIALOG_BODY}>
      <table className="keyboard-shortcuts-table" role="table">
        <thead>
          <tr>
            <th scope="col">Shortcut</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><kbd>Tab</kbd></td><td>Navigate forward through elements</td></tr>
          <tr><td><kbd>Shift + Tab</kbd></td><td>Navigate backward through elements</td></tr>
          <tr><td><kbd>Arrow Keys</kbd></td><td>Navigate through table cells</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>Open allocation modal for selected row</td></tr>
          <tr><td><kbd>Space</kbd></td><td>Toggle row selection</td></tr>
          <tr><td><kbd>Ctrl/Cmd + S</kbd></td><td>Save changes</td></tr>
          <tr><td><kbd>Ctrl/Cmd + Z</kbd></td><td>Undo last change</td></tr>
          <tr><td><kbd>Ctrl/Cmd + Y</kbd></td><td>Redo last change</td></tr>
          <tr><td><kbd>Ctrl/Cmd + A</kbd></td><td>Select all rows</td></tr>
          <tr><td><kbd>Escape</kbd></td><td>Clear selection / Close modal</td></tr>
          <tr><td><kbd>?</kbd></td><td>Show this help dialog</td></tr>
          <tr><td><kbd>Alt + H</kbd></td><td>Toggle high contrast mode</td></tr>
        </tbody>
      </table>
    </div>
  </Dialog>
);

// Skip navigation link component
const SkipNavigation: React.FC = () => (
  <a 
    href="#main-table" 
    className="skip-navigation"
    onFocus={(e) => e.currentTarget.classList.add('focused')}
    onBlur={(e) => e.currentTarget.classList.remove('focused')}
  >
    Skip to main table
  </a>
);

const CollectionOpportunitiesAccessible: React.FC<CollectionOpportunitiesAccessibleProps> = React.memo(({
  opportunities,
  availableSites,
  onBatchUpdate,
  onOpenWorkspace,
  capacityThresholds = { critical: 10, warning: 30, optimal: 70 },
  enableRealTimeValidation = true,
  enableHealthAnalysis = true,
  showWorkspaceOption = true,
}) => {
  const { 
    state,
    updateOpportunity,
    commitChanges,
    rollbackChanges,
    openWorkspace,
    closeWorkspace,
    undo,
    redo,
    canUndo,
    canRedo
  } = useAllocationContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showReallocationModal, setShowReallocationModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<CollectionOpportunity | null>(null);
  const [highContrastMode, setHighContrastMode] = useState(() => 
    localStorage.getItem('highContrastMode') === 'true'
  );
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [announcements, setAnnouncements] = useState<string>('');

  const tableRef = useRef<HTMLDivElement>(null);
  const announcerRef = useRef<HTMLDivElement>(null);
  const focusedCellRef = useRef<{ row: number; col: number }>({ row: 0, col: 0 });

  // ARIA live region announcements
  const announce = useCallback((message: string) => {
    setAnnouncements(message);
    // Clear after announcement
    setTimeout(() => setAnnouncements(''), 1000);
  }, []);

  // Toggle high contrast mode
  const toggleHighContrastMode = useCallback(() => {
    const newMode = !highContrastMode;
    setHighContrastMode(newMode);
    localStorage.setItem('highContrastMode', newMode.toString());
    document.body.classList.toggle('high-contrast', newMode);
    announce(newMode ? 'High contrast mode enabled' : 'High contrast mode disabled');
  }, [highContrastMode, announce]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let data = [...opportunities];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(opp =>
        opp.name.toLowerCase().includes(query) ||
        opp.satellite.name.toLowerCase().includes(query) ||
        (opp.sccNumber && String(opp.sccNumber).includes(query)) ||
        opp.notes?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortColumn) {
      data.sort((a, b) => {
        let aVal, bVal;

        switch (sortColumn) {
          case 'priority':
            aVal = a.priorityValue || 0;
            bVal = b.priorityValue || 0;
            break;
          case 'match':
            aVal = a.matchStatus;
            bVal = b.matchStatus;
            break;
          case 'periodicity':
            aVal = a.periodicity || 0;
            bVal = b.periodicity || 0;
            break;
          default:
            aVal = (a as any)[sortColumn];
            bVal = (b as any)[sortColumn];
        }
        
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [opportunities, searchQuery, sortColumn, sortDirection]);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help dialog
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowKeyboardHelp(true);
        return;
      }

      // Toggle high contrast
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        toggleHighContrastMode();
        return;
      }

      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's': // Save
            e.preventDefault();
            if (state.pendingChanges.size > 0) {
              commitChanges();
              announce(`Saving ${state.pendingChanges.size} changes`);
            }
            break;
          case 'z': // Undo
            e.preventDefault();
            if (canUndo) {
              undo();
              announce('Change undone');
            }
            break;
          case 'y': // Redo
            e.preventDefault();
            if (canRedo) {
              redo();
              announce('Change redone');
            }
            break;
          case 'a': // Select all
            e.preventDefault();
            setSelectedRows(new Set(processedData.map(o => o.id)));
            announce(`Selected all ${processedData.length} opportunities`);
            break;
        }
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        if (selectedRows.size > 0) {
          setSelectedRows(new Set());
          announce('Selection cleared');
        }
      }

      // Enter to open modal for selected row
      if (e.key === 'Enter' && !e.shiftKey && selectedRows.size === 1) {
        const selectedId = Array.from(selectedRows)[0];
        const opportunity = processedData.find(o => o.id === selectedId);
        if (opportunity) {
          handleOpenReallocationModal(opportunity);
        }
      }

      // Arrow key navigation in table
      if (tableRef.current && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        navigateTable(e.key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [processedData, selectedRows, state, commitChanges, announce, toggleHighContrastMode]);

  // Table navigation handler
  const navigateTable = (direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') => {
    const { row, col } = focusedCellRef.current;
    let newRow = row;
    let newCol = col;

    switch (direction) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(processedData.length - 1, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(10, col + 1); // 11 columns total
        break;
    }

    focusedCellRef.current = { row: newRow, col: newCol };
    // Focus the cell (implementation depends on table structure)
  };

  // Handle row selection with announcement
  const handleRowSelection = useCallback((opportunityId: string, selected: boolean) => {
    const newSelection = new Set(selectedRows);
    if (selected) {
      newSelection.add(opportunityId);
    } else {
      newSelection.delete(opportunityId);
    }
    setSelectedRows(newSelection);
    
    const opportunity = processedData.find(o => o.id === opportunityId);
    if (opportunity) {
      announce(`${opportunity.name} ${selected ? 'selected' : 'deselected'}`);
    }
  }, [selectedRows, processedData, announce]);

  // Handle opening reallocation modal
  const handleOpenReallocationModal = useCallback((opportunity: CollectionOpportunity) => {
    setSelectedOpportunity(opportunity);
    setShowReallocationModal(true);
    announce(`Opening allocation modal for ${opportunity.name}`);
  }, [announce]);

  // Column renderers with accessibility enhancements
  
  // 1. Priority column (numerical)
  const priorityCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    const priorityColors: Record<Priority, Intent> = {
      low: Intent.NONE,
      medium: Intent.PRIMARY,
      high: Intent.WARNING,
      critical: Intent.DANGER,
    };

    return (
      <Cell>
        <div className="priority-cell" role="cell" aria-label={`Priority: ${opportunity?.priorityValue || 'N/A'}`}>
          <Tag 
            intent={priorityColors[opportunity?.priority || 'low']}
            large
            aria-label={`${opportunity?.priority} priority, value ${opportunity?.priorityValue || 0}`}
          >
            {opportunity?.priorityValue || 0}
          </Tag>
          <span className="sr-only">{opportunity?.priority} priority</span>
        </div>
      </Cell>
    );
  }, [processedData]);

  // 2. Match status column
  const matchStatusCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    const matchStatusLabels: Record<MatchStatus, string> = {
      baseline: 'Baseline',
      suboptimal: 'Suboptimal',
      unmatched: 'Unmatched'
    };
    const matchStatusIntent: Record<MatchStatus, Intent> = {
      baseline: Intent.SUCCESS,
      suboptimal: Intent.WARNING,
      unmatched: Intent.DANGER
    };

    return (
      <Cell>
        <div className="match-status-cell" role="cell">
          <Tag 
            intent={matchStatusIntent[opportunity?.matchStatus || 'unmatched']}
            aria-label={`Match status: ${matchStatusLabels[opportunity?.matchStatus || 'unmatched']}`}
          >
            {matchStatusLabels[opportunity?.matchStatus || 'unmatched']}
          </Tag>
        </div>
      </Cell>
    );
  }, [processedData]);

  // 3. Match notes column
  const matchNotesCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    const matchNotes = opportunity?.matchNotes || 'N/A';

    return (
      <Cell>
        <div 
          className="match-notes-cell" 
          role="cell"
          aria-label={`Match notes: ${matchNotes}`}
        >
          {matchNotes === 'Best Pass' && (
            <Tag intent={Intent.SUCCESS} icon={IconNames.TICK}>
              Best Pass
            </Tag>
          )}
          {matchNotes === 'Capacity Issue' && (
            <Tag intent={Intent.WARNING} icon={IconNames.WARNING_SIGN}>
              Capacity Issue
            </Tag>
          )}
          {matchNotes !== 'Best Pass' && matchNotes !== 'Capacity Issue' && (
            <span>{matchNotes}</span>
          )}
        </div>
      </Cell>
    );
  }, [processedData]);

  // 4. SCC column
  const sccCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    return (
      <Cell>
        <div role="cell" aria-label={`SCC: ${opportunity?.sccNumber || 'N/A'}`}>
          <code>{opportunity?.sccNumber || 'N/A'}</code>
        </div>
      </Cell>
    );
  }, [processedData]);

  // 5. Function column
  const functionCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    return (
      <Cell>
        <div role="cell" aria-label={`Function: ${opportunity?.satellite.function || 'N/A'}`}>
          {opportunity?.satellite.function || 'N/A'}
        </div>
      </Cell>
    );
  }, [processedData]);

  // 6. Orbit column
  const orbitCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    return (
      <Cell>
        <div role="cell" aria-label={`Orbit: ${opportunity?.satellite.orbit || 'N/A'}`}>
          {opportunity?.satellite.orbit || 'N/A'}
        </div>
      </Cell>
    );
  }, [processedData]);

  // 7. Periodicity column
  const periodicityCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    const periodicity = opportunity?.periodicity || 0;
    const unit = opportunity?.periodicityUnit || 'hours';

    return (
      <Cell>
        <div role="cell" aria-label={`Periodicity: ${periodicity} ${unit}`}>
          {periodicity > 0 ? `${periodicity} ${unit}` : 'N/A'}
        </div>
      </Cell>
    );
  }, [processedData]);

  // 8. Collection Type column
  const collectionTypeCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    const typeLabels: Record<CollectionType, string> = {
      optical: 'Optical',
      wideband: 'Wideband',
      narrowband: 'Narrowband'
    };

    return (
      <Cell>
        <div role="cell" aria-label={`Collection type: ${typeLabels[opportunity?.collectionType || 'optical']}`}>
          {typeLabels[opportunity?.collectionType || 'optical']}
        </div>
      </Cell>
    );
  }, [processedData]);

  // 9. Classification column
  const classificationCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    const classification = opportunity?.classificationLevel || 'UNCLASSIFIED';

    return (
      <Cell>
        <div role="cell" aria-label={`Classification: ${classification}`}>
          <Tag minimal className={`classification-${classification.toLowerCase()}`}>
            {classification === 'SECRET' ? 'S//REL FVEY' : classification}
          </Tag>
        </div>
      </Cell>
    );
  }, [processedData]);

  // 10. Site Allocation column
  const siteAllocationCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    const sites = opportunity?.siteAllocationCodes || [];

    return (
      <Cell>
        <div 
          role="cell" 
          aria-label={`Site allocation: ${sites.length > 0 ? sites.join(', ') : 'None'}`}
        >
          {sites.length > 0 ? (
            <div className="site-codes">
              {sites.map(code => (
                <Tag key={code} minimal>{code}</Tag>
              ))}
            </div>
          ) : (
            <span className={Classes.TEXT_MUTED}>None</span>
          )}
        </div>
      </Cell>
    );
  }, [processedData]);

  // 11. Notes column
  const notesCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    const hasNotes = !!opportunity?.notes;

    return (
      <Cell>
        <div role="cell" aria-label={`Notes: ${opportunity?.notes || 'No notes'}`}>
          {hasNotes ? (
            <Tooltip content={opportunity.notes}>
              <span className={Classes.ICON} data-icon="comment" />
            </Tooltip>
          ) : (
            <span className={Classes.TEXT_MUTED}>—</span>
          )}
        </div>
      </Cell>
    );
  }, [processedData]);

  // Name cell renderer - clickable for allocation modal
  const nameCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    return (
      <Cell>
        <div className="name-cell-accessible">
          <Button
            minimal
            className="opportunity-name-button"
            onClick={() => handleOpenReallocationModal(opportunity)}
            aria-label={`Open allocation modal for ${opportunity?.name}`}
          >
            <strong>{opportunity?.name}</strong>
          </Button>
        </div>
      </Cell>
    );
  }, [processedData, handleOpenReallocationModal]);

  // Enhanced checkbox cell with better accessibility
  const checkboxCellRenderer = useCallback((rowIndex: number) => {
    const opportunity = processedData[rowIndex];
    if (!opportunity) return <Cell />;

    return (
      <Cell>
        <Checkbox
          checked={selectedRows.has(opportunity.id)}
          onChange={(e) => handleRowSelection(opportunity.id, e.currentTarget.checked)}
          aria-label={`Select ${opportunity.name}`}
          className="row-checkbox"
        />
      </Cell>
    );
  }, [processedData, selectedRows, handleRowSelection]);

  // Handle sort with announcement
  const handleSort = useCallback((column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    announce(`Sorting by ${column} in ${newDirection}ending order`);
  }, [sortColumn, sortDirection, announce]);

  // Create sortable header renderer
  const createSortableHeader = (column: string, label: string) => () => (
    <Button
      minimal
      className="sortable-header"
      onClick={() => handleSort(column)}
      aria-label={`Sort by ${label} ${sortColumn === column ? (sortDirection === 'asc' ? 'descending' : 'ascending') : ''}`}
      aria-sort={sortColumn === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {sortColumn === column && (
        <Icon icon={sortDirection === 'asc' ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN} />
      )}
    </Button>
  );

  // Apply high contrast mode on mount
  useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrastMode);
  }, []);

  return (
    <div className={`collection-opportunities-accessible ${highContrastMode ? 'high-contrast' : ''}`}>
      <SkipNavigation />
      
      {/* ARIA live region for announcements */}
      <div 
        ref={announcerRef}
        className="sr-only"
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {announcements}
      </div>

      {/* Header with enhanced navigation */}
      <header role="banner">
        <Navbar className="opportunities-navbar" aria-label="Collection opportunities toolbar">
          <NavbarGroup>
            <NavbarHeading>
              <H2>Satellite Collection Management</H2>
            </NavbarHeading>
            <NavbarDivider />
            
            {/* Search with better labeling */}
            <InputGroup
              leftIcon={IconNames.SEARCH}
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search collection opportunities"
              className="search-input"
            />
          </NavbarGroup>
          
          <NavbarGroup align="right">
            {/* Action buttons with clear labels */}
            {state.pendingChanges.size > 0 && (
              <>
                <Button
                  minimal
                  onClick={() => rollbackChanges()}
                  aria-label={`Cancel ${state.pendingChanges.size} pending changes`}
                >
                  Cancel Changes ({state.pendingChanges.size})
                </Button>
                <Button
                  intent={Intent.PRIMARY}
                  onClick={commitChanges}
                  loading={state.isSaving}
                  icon={IconNames.CLOUD_UPLOAD}
                  aria-label={`Save ${state.pendingChanges.size} pending changes`}
                >
                  Save Changes ({state.pendingChanges.size})
                </Button>
              </>
            )}
            
            <ButtonGroup>
              <Tooltip content="Keyboard shortcuts">
                <Button
                  icon={IconNames.KEY}
                  onClick={() => setShowKeyboardHelp(true)}
                  aria-label="Show keyboard shortcuts"
                />
              </Tooltip>
              <Tooltip content={highContrastMode ? 'Disable high contrast' : 'Enable high contrast'}>
                <Button
                  icon={IconNames.CONTRAST}
                  active={highContrastMode}
                  onClick={toggleHighContrastMode}
                  aria-label={`${highContrastMode ? 'Disable' : 'Enable'} high contrast mode`}
                />
              </Tooltip>
            </ButtonGroup>
          </NavbarGroup>
        </Navbar>
      </header>

      {/* Status summary for screen readers */}
      <div className="sr-only" aria-live="polite">
        {processedData.length} opportunities displayed. 
        {selectedRows.size > 0 && `${selectedRows.size} selected.`}
        {state.pendingChanges.size > 0 && `${state.pendingChanges.size} unsaved changes.`}
      </div>

      {/* Main table with enhanced accessibility */}
      <main id="main-table" role="main" ref={tableRef}>
        {processedData.length === 0 ? (
          <NonIdealState
            icon={IconNames.SEARCH}
            title="No opportunities found"
            description="Try adjusting your search criteria."
          />
        ) : (
          <div role="region" aria-label="Collection opportunities table">
            <Table2
              numRows={processedData.length}
              enableRowHeader={false}
              enableColumnHeader={true}
              enableRowReordering={false}
              enableColumnReordering={false}
              enableRowResizing={false}
              enableColumnResizing={true}
              enableFocusedCell={true}
              selectionModes={SelectionModes.ROWS_ONLY}
              renderMode={RenderMode.BATCH}
              className="opportunities-table-accessible"
              cellRendererDependencies={[processedData, selectedRows, sortColumn, sortDirection]}
              aria-label="Collection opportunities data table"
              role="table"
            >
              {/* Columns in specified order */}
              <Column
                name=""
                cellRenderer={checkboxCellRenderer}
                columnHeaderCellRenderer={() => (
                  <Checkbox
                    checked={selectedRows.size === processedData.length && processedData.length > 0}
                    indeterminate={selectedRows.size > 0 && selectedRows.size < processedData.length}
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        setSelectedRows(new Set(processedData.map(o => o.id)));
                        announce(`Selected all ${processedData.length} opportunities`);
                      } else {
                        setSelectedRows(new Set());
                        announce('Deselected all opportunities');
                      }
                    }}
                    aria-label="Select all opportunities"
                  />
                )}
              />
              
              {/* 1. Priority */}
              <Column 
                name="Priority" 
                cellRenderer={priorityCellRenderer}
                columnHeaderCellRenderer={createSortableHeader('priority', 'Priority')}
              />
              
              {/* 2. Match */}
              <Column 
                name="Match" 
                cellRenderer={matchStatusCellRenderer}
                columnHeaderCellRenderer={createSortableHeader('match', 'Match Status')}
              />
              
              {/* 3. Match Notes */}
              <Column 
                name="Match Notes" 
                cellRenderer={matchNotesCellRenderer}
              />
              
              {/* 4. SCC */}
              <Column 
                name="SCC" 
                cellRenderer={sccCellRenderer}
                columnHeaderCellRenderer={createSortableHeader('sccNumber', 'SCC')}
              />
              
              {/* 5. Function */}
              <Column 
                name="Function" 
                cellRenderer={functionCellRenderer}
                columnHeaderCellRenderer={createSortableHeader('function', 'Function')}
              />
              
              {/* 6. Orbit */}
              <Column 
                name="Orbit" 
                cellRenderer={orbitCellRenderer}
                columnHeaderCellRenderer={createSortableHeader('orbit', 'Orbit')}
              />
              
              {/* 7. Periodicity */}
              <Column 
                name="Periodicity" 
                cellRenderer={periodicityCellRenderer}
                columnHeaderCellRenderer={createSortableHeader('periodicity', 'Periodicity')}
              />
              
              {/* 8. Collection Type */}
              <Column 
                name="Collection Type" 
                cellRenderer={collectionTypeCellRenderer}
              />
              
              {/* 9. Classification */}
              <Column 
                name="Classification" 
                cellRenderer={classificationCellRenderer}
              />
              
              {/* 10. Site Allocation */}
              <Column 
                name="Site Allocation" 
                cellRenderer={siteAllocationCellRenderer}
              />
              
              {/* 11. Notes */}
              <Column 
                name="Notes" 
                cellRenderer={notesCellRenderer}
              />
              
              {/* Opportunity Name (for clicking) */}
              <Column 
                name="Name" 
                cellRenderer={nameCellRenderer}
              />
            </Table2>
          </div>
        )}
      </main>

      {/* Keyboard help dialog */}
      <KeyboardHelpDialog 
        isOpen={showKeyboardHelp} 
        onClose={() => setShowKeyboardHelp(false)} 
      />

      {/* Allocation modal */}
      {showReallocationModal && selectedOpportunity && (
        <ReallocationWorkspaceAccessible
          opportunity={selectedOpportunity}
          availableSites={availableSites}
          isOpen={showReallocationModal}
          onClose={() => {
            setShowReallocationModal(false);
            setSelectedOpportunity(null);
            announce('Allocation modal closed');
          }}
          onSave={async (changes) => {
            await onBatchUpdate(changes);
            setShowReallocationModal(false);
            setSelectedOpportunity(null);
            announce('Changes saved successfully');
          }}
        />
      )}
    </div>
  );
});

CollectionOpportunitiesAccessible.displayName = 'CollectionOpportunitiesAccessible';

export default CollectionOpportunitiesAccessible;