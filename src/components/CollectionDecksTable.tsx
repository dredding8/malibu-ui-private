import React, { useMemo, useState } from 'react';
import { Cell, Column, Table, RegionCardinality } from '@blueprintjs/table';
import { Intent, Tag, Button, Tooltip, Position, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useNavigate } from 'react-router-dom';
import IconWrapper from './IconWrapper';
import {
  CollectionDeckStatus,
  COLLECTION_STATUS_LABELS,
  COLLECTION_STATUS_INTENTS
} from '../constants/statusTypes';
import {
  MatchStatus,
  MatchInformation,
  getMatchStatusIntent,
  getMatchStatusLabel,
  formatMatchNotes,
  matchNeedsAttention
} from '../types/matchTypes';
import './CollectionDecksTable.css';

interface CollectionDeck {
  id: string;
  name: string;
  status: CollectionDeckStatus;
  createdDate: string;
  lastModified: string;
  priority: number;
  sccCount: number;
  assignedTo: string;
  completionDate?: string;
  matchInfo?: MatchInformation;
}

interface CollectionDecksTableProps {
  /** Collection decks data - passed from parent to avoid hardcoded sample data */
  data: CollectionDeck[];

  type: 'in-progress' | 'completed';
  startDate: string | null;
  endDate: string | null;

  /** Callback handlers for actions */
  onContinue?: (deckId: string) => void;
  onView?: (deckId: string) => void;
  onDiscard?: (deckId: string) => void;
}

/**
 * CollectionDecksTable Component
 *
 * WAVE 1 IMPROVEMENTS:
 * - Removed hardcoded sample data (now passed via props)
 * - Replaced window.location.href with React Router navigate()
 * - Replaced native confirm() with Blueprint Dialog component
 * - Added proper TypeScript callback handlers
 */
const CollectionDecksTable: React.FC<CollectionDecksTableProps> = ({
  data,
  type,
  startDate,
  endDate,
  onContinue,
  onView,
  onDiscard
}) => {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [discardDialogId, setDiscardDialogId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let filteredData = data;
    
    // Apply date filtering if dates are provided
    if (startDate || endDate) {
      filteredData = filteredData.filter(deck => {
        const deckDate = new Date(deck.createdDate);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && deckDate < start) return false;
        if (end && deckDate > end) return false;
        return true;
      });
    }

    return filteredData;
  }, [data, startDate, endDate]);

  const handleRowSelection = (rowId: string, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowId);
    } else {
      newSelection.delete(rowId);
    }
    setSelectedRows(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredData.map(deck => deck.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleContinue = (deckId: string) => {
    if (onContinue) {
      onContinue(deckId);
    } else {
      // Default behavior: use React Router navigation
      navigate(`/decks/${deckId}/continue`);
    }
  };

  const handleView = (deckId: string) => {
    if (onView) {
      onView(deckId);
    } else {
      // Default behavior: use React Router navigation
      navigate(`/decks/${deckId}/view`);
    }
  };

  const handleDiscard = (deckId: string) => {
    // Show accessible Blueprint Dialog instead of native confirm()
    setDiscardDialogId(deckId);
  };

  const handleDiscardConfirmed = () => {
    if (discardDialogId) {
      if (onDiscard) {
        onDiscard(discardDialogId);
      } else {
        console.log('Deck discarded:', discardDialogId);
      }
      setDiscardDialogId(null);
    }
  };

  const getStatusIntent = (status: CollectionDeckStatus): Intent => {
    const intentString = COLLECTION_STATUS_INTENTS[status];
    return Intent[intentString as keyof typeof Intent] || Intent.NONE;
  };

  const nameCellRenderer = (rowIndex: number) => (
    <Cell>
      <strong>{filteredData[rowIndex]?.name}</strong>
    </Cell>
  );

  const statusCellRenderer = (rowIndex: number) => {
    const deck = filteredData[rowIndex];
    return (
      <Cell>
        <Tag intent={getStatusIntent(deck?.status || 'in-progress')}>
          {COLLECTION_STATUS_LABELS[deck?.status || 'in-progress']}
        </Tag>
      </Cell>
    );
  };

  const priorityCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.priority}
    </Cell>
  );

  const sccCountCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.sccCount}
    </Cell>
  );

  const assignedToCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.assignedTo}
    </Cell>
  );

  const createdDateCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.createdDate}
    </Cell>
  );

  const lastModifiedCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.lastModified}
    </Cell>
  );

  const completionDateCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.completionDate || '-'}
    </Cell>
  );

  const matchNotesCellRenderer = (rowIndex: number) => {
    const deck = filteredData[rowIndex];
    const matchInfo = deck?.matchInfo;
    
    if (!matchInfo) {
      return (
        <Cell>
          <span style={{ color: '#666', fontStyle: 'italic' }}>No match data</span>
        </Cell>
      );
    }

    const status = matchInfo.status;
    const notes = matchInfo.notes;
    const needsAttention = matchNeedsAttention(status);
    const statusIntent = getMatchStatusIntent(status);
    const statusLabel = getMatchStatusLabel(status);
    const noteMessage = notes ? formatMatchNotes(notes) : '';

    // Build tooltip content
    const tooltipContent = (
      <div className="match-notes-tooltip">
        <strong>Match Status: {statusLabel}</strong>
        {matchInfo.matchPercentage !== undefined && (
          <div>Match Percentage: {matchInfo.matchPercentage}%</div>
        )}
        {notes && notes.length > 0 && (
          <>
            <div className="match-notes-tooltip-details">
              <strong>Details:</strong>
            </div>
            {notes.map((note, idx) => (
              <div key={idx} className="match-notes-tooltip-item">
                <div>• {note.message}</div>
                {note.details && (
                  <div className="match-notes-tooltip-subitem">
                    {note.details}
                  </div>
                )}
                {note.affectedSensors && note.affectedSensors.length > 0 && (
                  <div className="match-notes-tooltip-subitem">
                    Affected sensors: {note.affectedSensors.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    );

    return (
      <Cell className="match-notes-cell">
        <div className="match-notes-content">
          <Tag 
            intent={statusIntent} 
            minimal={status === 'optimal'}
            className="match-status-tag"
          >
            {statusLabel}
          </Tag>
          
          {noteMessage && (
            <Tooltip content={tooltipContent} position={Position.TOP}>
              <span className={`match-notes-text ${
                status === 'no-match' ? 'match-notes-text-danger' : 'match-notes-text-warning'
              }`}>
                {needsAttention && (
                  <IconWrapper
                    icon={status === 'no-match' ? IconNames.ERROR : IconNames.WARNING_SIGN}
                    size={16}
                    className="match-notes-icon"
                    intent={status === 'no-match' ? 'danger' : 'warning'}
                  />
                )}
                <span className="match-notes-message">{noteMessage}</span>
              </span>
            </Tooltip>
          )}
          
          {!noteMessage && status === 'optimal' && (
            <span className="match-full-coverage">
              Full coverage
            </span>
          )}
        </div>
      </Cell>
    );
  };

  const actionsCellRenderer = (rowIndex: number) => {
    const deck = filteredData[rowIndex];
    return (
      <Cell>
        <div style={{ display: 'flex', gap: '5px' }}>
          {type === 'in-progress' ? (
            <>
              <Button
                small
                minimal
                icon={IconNames.ARROW_RIGHT}
                text="Continue"
                onClick={() => handleContinue(deck?.id || '')}
                data-testid="resume-deck-button"
                aria-label={`Continue editing ${deck?.name || 'collection'}`}
              />
              <Button
                small
                minimal
                icon={IconNames.TRASH}
                text="Discard"
                onClick={() => handleDiscard(deck?.id || '')}
                data-testid="discard-deck-menu-item"
                intent="danger"
                aria-label={`Discard ${deck?.name || 'collection'}`}
              />
            </>
          ) : (
            <Button
              small
              minimal
              icon={IconNames.EYE_OPEN}
              text="View"
              onClick={() => handleView(deck?.id || '')}
              aria-label={`View ${deck?.name || 'collection'}`}
            />
          )}
        </div>
      </Cell>
    );
  };

  const columns = [
    <Column key="name" name="Collection Name" cellRenderer={nameCellRenderer} />,
    <Column key="status" name="Status" cellRenderer={statusCellRenderer} />,
    <Column key="priority" name="Priority" cellRenderer={priorityCellRenderer} />,
    <Column key="sccCount" name="SCC Count" cellRenderer={sccCountCellRenderer} />,
    <Column key="assignedTo" name="Assigned To" cellRenderer={assignedToCellRenderer} />,
    <Column key="createdDate" name="Created Date" cellRenderer={createdDateCellRenderer} />,
    <Column key="lastModified" name="Last Modified" cellRenderer={lastModifiedCellRenderer} />,
    ...(type === 'completed' ? [
      <Column key="completionDate" name="Completion Date" cellRenderer={completionDateCellRenderer} />
    ] : []),
    <Column key="matchNotes" name="Match Notes" cellRenderer={matchNotesCellRenderer} />,
    <Column key="actions" name="Actions" cellRenderer={actionsCellRenderer} />
  ];

  return (
    <div className="collection-decks-table-wrapper">
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          Showing {filteredData.length} {type === 'in-progress' ? 'in-progress' : 'completed'} deck{filteredData.length !== 1 ? 's' : ''}
        </span>
        {filteredData.length > 0 && (
          <Button
            small
            minimal
            icon={IconNames.SELECTION}
            text={selectedRows.size === filteredData.length ? 'Deselect All' : 'Select All'}
            onClick={() => handleSelectAll(selectedRows.size !== filteredData.length)}
          />
        )}
      </div>
      
      <Table
        numRows={filteredData.length}
        enableRowHeader={false}
        enableColumnHeader={true}
        enableRowReordering={false}
        enableColumnReordering={false}
        enableRowResizing={false}
        enableColumnResizing={true}
        enableFocusedCell={true}
        enableMultipleSelection={true}
      >
        {columns}
      </Table>
      
      {filteredData.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666',
          fontStyle: 'italic'
        }}>
          No {type === 'in-progress' ? 'in-progress' : 'completed'} collections found.
        </div>
      )}

      {/* Accessible confirmation dialog (replaces native confirm()) */}
      <Dialog
        isOpen={discardDialogId !== null}
        title="Discard Collection Deck?"
        icon={IconNames.WARNING_SIGN}
        onClose={() => setDiscardDialogId(null)}
      >
        <DialogBody>
          <p>Are you sure you want to discard this collection deck?</p>
          <p><strong>This action cannot be undone.</strong></p>
        </DialogBody>
        <DialogFooter
          actions={[
            <Button
              key="cancel"
              onClick={() => setDiscardDialogId(null)}
            >
              Cancel
            </Button>,
            <Button
              key="discard"
              intent={Intent.DANGER}
              onClick={handleDiscardConfirmed}
            >
              Discard Deck
            </Button>
          ]}
        />
      </Dialog>
    </div>
  );
};

export default CollectionDecksTable;
