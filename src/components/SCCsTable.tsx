import React, { useMemo, useState } from 'react';
import { Cell, Column, Table, RegionCardinality } from '@blueprintjs/table';
import { 
  Intent, 
  Tag, 
  Checkbox, 
  Button, 
  Icon, 
  Alert,
  Position,
  Classes,
  H6,
  Divider,
  ControlGroup,
  ButtonGroup,
  HTMLSelect,
  FormGroup
} from '@blueprintjs/core';
import { OverlayToaster } from '@blueprintjs/core';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sccToDelete, setSccToDelete] = useState<SCC | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [toaster] = useState(() => OverlayToaster.create({ position: Position.TOP }));
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Helper function to show toasts
  const showToast = async (message: string, intent: Intent, icon?: string) => {
    const toasterInstance = await toaster;
    toasterInstance.show({
      message,
      intent,
      icon: icon as any,
    });
  };

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredSCCs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSCCs = filteredSCCs.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Clear selection when changing pages
    setSelectedRows(new Set());
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
    setSelectedRows(new Set()); // Clear selection
  };

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

  // Handle delete action with confirmation
  const handleDelete = (sccId: string) => {
    const scc = filteredSCCs.find(s => s.id === sccId);
    if (scc) {
      setSccToDelete(scc);
      setDeleteDialogOpen(true);
    }
  };

  // Confirm delete action
  const confirmDelete = () => {
    if (sccToDelete) {
      // Simulate API call
      console.log('Deleting SCC:', sccToDelete.id);
      
      // Show success message
      showToast(
        `SCC ${sccToDelete.scc} has been deleted successfully.`,
        Intent.SUCCESS,
        IconNames.TICK_CIRCLE
      );
      
      // Remove from selected rows if it was selected
      const newSelected = new Set(selectedRows);
      newSelected.delete(sccToDelete.id);
      setSelectedRows(newSelected);
    }
    
    setDeleteDialogOpen(false);
    setSccToDelete(null);
  };

  // Cancel delete action
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSccToDelete(null);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedRows.size > 0) {
      setBulkDeleteDialogOpen(true);
    } else {
      showToast(
        "Please select at least one SCC to delete.",
        Intent.WARNING,
        IconNames.WARNING_SIGN
      );
    }
  };

  // Confirm bulk delete
  const confirmBulkDelete = () => {
    const selectedSCCs = filteredSCCs.filter(scc => selectedRows.has(scc.id));
    
    // Simulate API call
    console.log('Bulk deleting SCCs:', Array.from(selectedRows));
    
    // Show success message
    showToast(
      `${selectedSCCs.length} SCC(s) have been deleted successfully.`,
      Intent.SUCCESS,
      IconNames.TICK_CIRCLE
    );
    
    // Clear selection
    setSelectedRows(new Set());
    setBulkDeleteDialogOpen(false);
  };

  // Cancel bulk delete
  const cancelBulkDelete = () => {
    setBulkDeleteDialogOpen(false);
  };

  // Cell renderers
  const checkboxCellRenderer = (rowIndex: number) => {
    const scc = paginatedSCCs[rowIndex];
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
      {paginatedSCCs[rowIndex]?.priority}
    </Cell>
  );

  const sccCellRenderer = (rowIndex: number) => (
    <Cell>
      <strong>{paginatedSCCs[rowIndex]?.scc}</strong>
    </Cell>
  );

  const functionCellRenderer = (rowIndex: number) => (
    <Cell>
      {paginatedSCCs[rowIndex]?.function}
    </Cell>
  );

  const orbitCellRenderer = (rowIndex: number) => (
    <Cell>
      {paginatedSCCs[rowIndex]?.orbit}
    </Cell>
  );

  const periodicityCellRenderer = (rowIndex: number) => (
    <Cell>
      {paginatedSCCs[rowIndex]?.periodicity}
    </Cell>
  );

  const collectionTypeCellRenderer = (rowIndex: number) => (
    <Cell>
      {paginatedSCCs[rowIndex]?.collectionType}
    </Cell>
  );

  const classificationCellRenderer = (rowIndex: number) => {
    const scc = paginatedSCCs[rowIndex];
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
    const scc = paginatedSCCs[rowIndex];
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
      {/* Classification Legend */}
      <div className="classification-legend">
        <H6>Classification Legend</H6>
        <div className="classification-tags">
          <Tag intent={Intent.DANGER} minimal>
            S//REL FVEY - Top Secret/Rel FVEY
          </Tag>
          <Tag intent={Intent.WARNING} minimal>
            S//NF - Secret/No Foreign
          </Tag>
          <Tag intent={Intent.NONE} minimal>
            Other Classifications
          </Tag>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="bulk-actions">
          <span className="bulk-actions-info">
            {selectedRows.size} SCC(s) selected
          </span>
          <ButtonGroup>
            <Button
              small
              intent={Intent.DANGER}
              icon={IconNames.TRASH}
              text="Delete Selected"
              onClick={handleBulkDelete}
            />
            <Button
              small
              icon={IconNames.CROSS}
              text="Clear Selection"
              onClick={() => setSelectedRows(new Set())}
            />
          </ButtonGroup>
        </div>
      )}

      <Table 
        numRows={paginatedSCCs.length} 
        enableRowHeader={false}
        selectionModes={[]}
        enableFocusedCell={false}
        enableColumnReordering={false}
        enableColumnResizing={false}
        enableRowReordering={false}
        enableRowResizing={false}
        enableMultipleSelection={false}
        className="sccs-table"
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

      {/* Pagination Controls */}
      {filteredSCCs.length > 0 && (
        <div className="pagination-controls">
          <div className="pagination-info">
            <span>Showing {startIndex + 1}-{Math.min(endIndex, filteredSCCs.length)} of {filteredSCCs.length} SCCs</span>
            <FormGroup inline label="Per page:" style={{ margin: 0 }}>
              <HTMLSelect
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                options={[
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' },
                  { value: 50, label: '50' }
                ]}
                minimal
              />
            </FormGroup>
          </div>
          
          <div className="pagination-buttons">
            <Button
              small
              icon={IconNames.CHEVRON_LEFT}
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              minimal
            />
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  small
                  minimal
                  active={pageNum === currentPage}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              small
              icon={IconNames.CHEVRON_RIGHT}
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              minimal
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Alert
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        intent={Intent.DANGER}
        icon={IconNames.WARNING_SIGN}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        className={Classes.DARK}
      >
        <p>
          Are you sure you want to delete SCC <strong>{sccToDelete?.scc}</strong>?
        </p>
        <p>
          This action cannot be undone and will permanently remove this SCC from the system.
        </p>
      </Alert>

      {/* Bulk Delete Confirmation Dialog */}
      <Alert
        isOpen={bulkDeleteDialogOpen}
        onClose={cancelBulkDelete}
        onConfirm={confirmBulkDelete}
        intent={Intent.DANGER}
        icon={IconNames.WARNING_SIGN}
        confirmButtonText="Delete All Selected"
        cancelButtonText="Cancel"
        className={Classes.DARK}
      >
        <p>
          Are you sure you want to delete <strong>{selectedRows.size} selected SCC(s)</strong>?
        </p>
        <p>
          This action cannot be undone and will permanently remove these SCCs from the system.
        </p>
      </Alert>
    </div>
  );
};

export default SCCsTable;
