import React, { useMemo, useState } from 'react';
import { Cell, Column, Table, RegionCardinality } from '@blueprintjs/table';
import { Intent, Tag, Button, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

interface CollectionDeck {
  id: string;
  name: string;
  status: string;
  createdDate: string;
  lastModified: string;
  priority: number;
  sccCount: number;
  assignedTo: string;
  completionDate?: string;
}

interface CollectionDecksTableProps {
  type: 'in-progress' | 'completed';
  startDate: string | null;
  endDate: string | null;
}

const sampleInProgressDecks: CollectionDeck[] = [
  {
    id: '1',
    name: 'Collection Deck Alpha-001',
    status: 'In Progress',
    createdDate: '2024-01-15',
    lastModified: '2024-01-20',
    priority: 1,
    sccCount: 25,
    assignedTo: 'John Smith'
  },
  {
    id: '2',
    name: 'Collection Deck Beta-002',
    status: 'Review',
    createdDate: '2024-01-18',
    lastModified: '2024-01-22',
    priority: 2,
    sccCount: 18,
    assignedTo: 'Jane Doe'
  },
  {
    id: '3',
    name: 'Collection Deck Gamma-003',
    status: 'Pending Approval',
    createdDate: '2024-01-20',
    lastModified: '2024-01-23',
    priority: 3,
    sccCount: 32,
    assignedTo: 'Mike Johnson'
  }
];

const sampleCompletedDecks: CollectionDeck[] = [
  {
    id: '4',
    name: 'Collection Deck Delta-004',
    status: 'Completed',
    createdDate: '2024-01-10',
    lastModified: '2024-01-15',
    priority: 1,
    sccCount: 28,
    assignedTo: 'John Smith',
    completionDate: '2024-01-15'
  },
  {
    id: '5',
    name: 'Collection Deck Epsilon-005',
    status: 'Completed',
    createdDate: '2024-01-12',
    lastModified: '2024-01-17',
    priority: 2,
    sccCount: 15,
    assignedTo: 'Jane Doe',
    completionDate: '2024-01-17'
  }
];

const CollectionDecksTable: React.FC<CollectionDecksTableProps> = ({ 
  type, 
  startDate, 
  endDate 
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const filteredData = useMemo(() => {
    let data = type === 'in-progress' ? sampleInProgressDecks : sampleCompletedDecks;
    
    // Apply date filtering if dates are provided
    if (startDate || endDate) {
      data = data.filter(deck => {
        const deckDate = new Date(deck.createdDate);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && deckDate < start) return false;
        if (end && deckDate > end) return false;
        return true;
      });
    }
    
    return data;
  }, [type, startDate, endDate]);

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
    console.log('Continue with deck:', deckId);
    // Navigate to continue deck flow
  };

  const handleView = (deckId: string) => {
    console.log('View deck:', deckId);
    // Navigate to view deck details
  };

  const getStatusIntent = (status: string): Intent => {
    switch (status.toLowerCase()) {
      case 'completed':
        return Intent.SUCCESS;
      case 'in progress':
        return Intent.PRIMARY;
      case 'review':
        return Intent.WARNING;
      case 'pending approval':
        return Intent.DANGER;
      default:
        return Intent.NONE;
    }
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
        <Tag intent={getStatusIntent(deck?.status || '')}>
          {deck?.status}
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

  const actionsCellRenderer = (rowIndex: number) => {
    const deck = filteredData[rowIndex];
    return (
      <Cell>
        <div style={{ display: 'flex', gap: '5px' }}>
          {type === 'in-progress' ? (
            <Button
              small
              minimal
              icon={IconNames.ARROW_RIGHT}
              text="Continue"
              onClick={() => handleContinue(deck?.id || '')}
            />
          ) : (
            <Button
              small
              minimal
              icon={IconNames.EYE_OPEN}
              text="View"
              onClick={() => handleView(deck?.id || '')}
            />
          )}
        </div>
      </Cell>
    );
  };

  const columns = [
    <Column key="name" name="Deck Name" cellRenderer={nameCellRenderer} />,
    <Column key="status" name="Status" cellRenderer={statusCellRenderer} />,
    <Column key="priority" name="Priority" cellRenderer={priorityCellRenderer} />,
    <Column key="sccCount" name="SCC Count" cellRenderer={sccCountCellRenderer} />,
    <Column key="assignedTo" name="Assigned To" cellRenderer={assignedToCellRenderer} />,
    <Column key="createdDate" name="Created Date" cellRenderer={createdDateCellRenderer} />,
    <Column key="lastModified" name="Last Modified" cellRenderer={lastModifiedCellRenderer} />,
    ...(type === 'completed' ? [
      <Column key="completionDate" name="Completion Date" cellRenderer={completionDateCellRenderer} />
    ] : []),
    <Column key="actions" name="Actions" cellRenderer={actionsCellRenderer} />
  ];

  return (
    <div>
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
          No {type === 'in-progress' ? 'in-progress' : 'completed'} collection decks found.
        </div>
      )}
    </div>
  );
};

export default CollectionDecksTable;
