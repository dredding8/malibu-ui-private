import React, { useMemo } from 'react';
import { Cell, Column, Table } from '@blueprintjs/table';
import { Intent, Tag } from '@blueprintjs/core';

// Design Assumptions:
// - History items have properties like ID, Name, Status, Created Date, and Completion Date
// - Using different data sets for "Ready to Continue" vs "Completed Decks"
// - Implementing date range filtering functionality
// - Using Tags to display status information
// - Providing sample data for demonstration

interface HistoryItem {
  id: string;
  name: string;
  status: 'ready' | 'in_progress' | 'completed' | 'failed';
  createdDate: Date;
  completionDate?: Date;
  type: string;
  description: string;
}

interface HistoryTableProps {
  type: 'ready' | 'completed';
  startDate: string | null;
  endDate: string | null;
}

const sampleReadyItems: HistoryItem[] = [
  {
    id: 'DECK-001',
    name: 'Production Collection A',
    status: 'ready',
    createdDate: new Date('2024-01-15'),
    type: 'Production',
    description: 'Ready for deployment to production environment'
  },
  {
    id: 'DECK-002',
    name: 'Testing Collection B',
    status: 'ready',
    createdDate: new Date('2024-01-14'),
    type: 'Testing',
    description: 'Ready for testing phase'
  },
  {
    id: 'DECK-003',
    name: 'Development Collection C',
    status: 'in_progress',
    createdDate: new Date('2024-01-13'),
    type: 'Development',
    description: 'Currently in development phase'
  }
];

const sampleCompletedItems: HistoryItem[] = [
  {
    id: 'DECK-004',
    name: 'Archive Collection D',
    status: 'completed',
    createdDate: new Date('2024-01-10'),
    completionDate: new Date('2024-01-12'),
    type: 'Archive',
    description: 'Successfully completed and archived'
  },
  {
    id: 'DECK-005',
    name: 'Backup Collection E',
    status: 'completed',
    createdDate: new Date('2024-01-08'),
    completionDate: new Date('2024-01-09'),
    type: 'Backup',
    description: 'Backup process completed successfully'
  },
  {
    id: 'DECK-006',
    name: 'Failed Collection F',
    status: 'failed',
    createdDate: new Date('2024-01-05'),
    completionDate: new Date('2024-01-06'),
    type: 'Production',
    description: 'Failed during deployment process'
  }
];

const HistoryTable: React.FC<HistoryTableProps> = ({ type, startDate, endDate }) => {
  // Get appropriate data based on type
  const baseData = type === 'ready' ? sampleReadyItems : sampleCompletedItems;

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!startDate && !endDate) return baseData;

    return baseData.filter(item => {
      const itemDate = type === 'completed' && item.completionDate 
        ? item.completionDate 
        : item.createdDate;

      const itemDateStr = itemDate.toISOString().split('T')[0];

      if (startDate && itemDateStr < startDate) return false;
      if (endDate && itemDateStr > endDate) return false;
      return true;
    });
  }, [baseData, startDate, endDate, type]);

  // Cell renderers
  const idCellRenderer = (rowIndex: number) => (
    <Cell>
      <strong>{filteredData[rowIndex]?.id}</strong>
    </Cell>
  );

  const nameCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.name}
    </Cell>
  );

  const statusCellRenderer = (rowIndex: number) => {
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;

    const getStatusIntent = (status: string): Intent => {
      switch (status) {
        case 'ready': return Intent.SUCCESS;
        case 'completed': return Intent.SUCCESS;
        case 'in_progress': return Intent.PRIMARY;
        case 'failed': return Intent.DANGER;
        default: return Intent.NONE;
      }
    };

    const getStatusText = (status: string): string => {
      switch (status) {
        case 'ready': return 'READY';
        case 'completed': return 'COMPLETED';
        case 'in_progress': return 'IN PROGRESS';
        case 'failed': return 'FAILED';
        default: return status.toUpperCase();
      }
    };

    return (
      <Cell>
        <Tag intent={getStatusIntent(item.status)} minimal>
          {getStatusText(item.status)}
        </Tag>
      </Cell>
    );
  };

  const typeCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.type}
    </Cell>
  );

  const createdDateCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.createdDate.toLocaleDateString()}
    </Cell>
  );

  const completionDateCellRenderer = (rowIndex: number) => {
    const item = filteredData[rowIndex];
    return (
      <Cell>
        {item?.completionDate ? item.completionDate.toLocaleDateString() : '-'}
      </Cell>
    );
  };

  const descriptionCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredData[rowIndex]?.description}
    </Cell>
  );

  return (
    <div>
      <Table numRows={filteredData.length} enableRowHeader={false}>
        <Column 
          name="ID" 
          cellRenderer={idCellRenderer}
        />
        <Column 
          name="Name" 
          cellRenderer={nameCellRenderer}
        />
        <Column 
          name="Status" 
          cellRenderer={statusCellRenderer}
        />
        <Column 
          name="Type" 
          cellRenderer={typeCellRenderer}
        />
        <Column 
          name="Created Date" 
          cellRenderer={createdDateCellRenderer}
        />
        <Column 
          name="Completion Date" 
          cellRenderer={completionDateCellRenderer}
        />
        <Column 
          name="Description" 
          cellRenderer={descriptionCellRenderer}
        />
      </Table>
      
      {filteredData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          No {type === 'ready' ? 'ready' : 'completed'} items found for the selected date range.
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
