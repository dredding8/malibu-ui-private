import React, { useMemo, useState } from 'react';
import { Cell, Column, Table, RegionCardinality } from '@blueprintjs/table';
import { Intent, Tag, Checkbox, Button, Icon } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';

// Design Assumptions:
// - SCCs have properties like Priority, SCC, Function, Orbit, Periodicity, Collection Type, Classification
// - Using Blueprint's Table component for consistent styling and functionality
// - Implementing search filtering functionality
// - Using Tags to display classification information
// - Providing sample data for demonstration
// - Including checkboxes for row selection and action buttons for edit/delete

interface SCC {
  id: string;
  priority: number;
  scc: string;
  function: string;
  orbit: string;
  periodicity: number;
  collectionType: string;
  classification: string;
}

interface SCCsTableProps {
  searchQuery: string;
  filterFunction?: string;
  filterOrbit?: string;
  filterClassification?: string;
}

const sampleSCCs: SCC[] = [
  {
    id: '1',
    priority: 107,
    scc: '00001',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '2',
    priority: 66,
    scc: '11223',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Narrowband',
    classification: 'S//NF'
  },
  {
    id: '3',
    priority: 51,
    scc: '12233',
    function: 'ISR',
    orbit: 'MEO',
    periodicity: 6,
    collectionType: 'Narrowband',
    classification: 'S//NF'
  },
  {
    id: '4',
    priority: 51,
    scc: '22186',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 20,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '5',
    priority: 51,
    scc: '22219',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '6',
    priority: 51,
    scc: '22688',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '7',
    priority: 51,
    scc: '22689',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '8',
    priority: 51,
    scc: '22690',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '9',
    priority: 51,
    scc: '22698',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '10',
    priority: 51,
    scc: '24753',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '11',
    priority: 51,
    scc: '24772',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '12',
    priority: 51,
    scc: '24793',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  },
  {
    id: '13',
    priority: 51,
    scc: '24795',
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY'
  }
];

const SCCsTable: React.FC<SCCsTableProps> = ({ 
  searchQuery, 
  filterFunction, 
  filterOrbit, 
  filterClassification 
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Filter SCCs based on search query and filters
  const filteredSCCs = useMemo(() => {
    let filtered = sampleSCCs;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(scc => 
        scc.scc.toLowerCase().includes(query) ||
        scc.function.toLowerCase().includes(query) ||
        scc.orbit.toLowerCase().includes(query) ||
        scc.collectionType.toLowerCase().includes(query) ||
        scc.classification.toLowerCase().includes(query)
      );
    }
    
    // Apply function filter
    if (filterFunction) {
      filtered = filtered.filter(scc => scc.function === filterFunction);
    }
    
    // Apply orbit filter
    if (filterOrbit) {
      filtered = filtered.filter(scc => scc.orbit === filterOrbit);
    }
    
    // Apply classification filter
    if (filterClassification) {
      filtered = filtered.filter(scc => scc.classification === filterClassification);
    }
    
    return filtered;
  }, [searchQuery, filterFunction, filterOrbit, filterClassification]);

  // Handle row selection
  const handleRowSelection = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredSCCs.map(scc => scc.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Handle edit action
  const handleEdit = (sccId: string) => {
    console.log('Edit SCC:', sccId);
  };

  // Handle delete action
  const handleDelete = (sccId: string) => {
    console.log('Delete SCC:', sccId);
  };

  // Cell renderers
  const checkboxCellRenderer = (rowIndex: number) => {
    const scc = filteredSCCs[rowIndex];
    if (!scc) return <Cell />;

    return (
      <Cell>
        <Checkbox
          checked={selectedRows.has(scc.id)}
          onChange={(e) => handleRowSelection(scc.id, e.currentTarget.checked)}
        />
      </Cell>
    );
  };

  const priorityCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredSCCs[rowIndex]?.priority}
    </Cell>
  );

  const sccCellRenderer = (rowIndex: number) => (
    <Cell>
      <strong>{filteredSCCs[rowIndex]?.scc}</strong>
    </Cell>
  );

  const functionCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredSCCs[rowIndex]?.function}
    </Cell>
  );

  const orbitCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredSCCs[rowIndex]?.orbit}
    </Cell>
  );

  const periodicityCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredSCCs[rowIndex]?.periodicity}
    </Cell>
  );

  const collectionTypeCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredSCCs[rowIndex]?.collectionType}
    </Cell>
  );

  const classificationCellRenderer = (rowIndex: number) => {
    const scc = filteredSCCs[rowIndex];
    if (!scc) return <Cell />;

    const getClassificationIntent = (classification: string): Intent => {
      if (classification.includes('S//REL FVEY')) return Intent.DANGER;
      if (classification.includes('S//NF')) return Intent.WARNING;
      return Intent.NONE;
    };

    return (
      <Cell>
        <Tag intent={getClassificationIntent(scc.classification)} minimal>
          {scc.classification}
        </Tag>
      </Cell>
    );
  };

  const actionsCellRenderer = (rowIndex: number) => {
    const scc = filteredSCCs[rowIndex];
    if (!scc) return <Cell />;

    return (
      <Cell>
        <div style={{ display: 'flex', gap: 'var(--table-cell-gap)' }}>
          <Button
            minimal
            small
            icon={IconNames.EDIT}
            onClick={() => handleEdit(scc.id)}
            title="Edit"
          />
          <Button
            minimal
            small
            icon={IconNames.TRASH}
            onClick={() => handleDelete(scc.id)}
            title="Delete"
            intent={Intent.DANGER}
          />
        </div>
      </Cell>
    );
  };

  return (
    <div>
      <Table 
        numRows={filteredSCCs.length} 
        enableRowHeader={false}
        selectionModes={[]}
        enableFocusedCell={false}
        enableColumnReordering={false}
        enableColumnResizing={false}
        enableRowReordering={false}
        enableRowResizing={false}
        enableMultipleSelection={false}
      >
        <Column 
          name="" 
          cellRenderer={checkboxCellRenderer}
        />
        <Column 
          name="Priority" 
          cellRenderer={priorityCellRenderer}
        />
        <Column 
          name="SCC" 
          cellRenderer={sccCellRenderer}
        />
        <Column 
          name="Function" 
          cellRenderer={functionCellRenderer}
        />
        <Column 
          name="Orbit" 
          cellRenderer={orbitCellRenderer}
        />
        <Column 
          name="Periodicity" 
          cellRenderer={periodicityCellRenderer}
        />
        <Column 
          name="Collection Type" 
          cellRenderer={collectionTypeCellRenderer}
        />
        <Column 
          name="Classification" 
          cellRenderer={classificationCellRenderer}
        />
        <Column 
          name="" 
          cellRenderer={actionsCellRenderer}
        />
      </Table>
      
      {filteredSCCs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--card-margin)', color: '#666' }}>
          No SCCs found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default SCCsTable;
