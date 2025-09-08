import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  Elevation,
  Button,
  ButtonGroup,
  Intent,
  ControlGroup,
  InputGroup,
  HTMLSelect,
  Tag,
  Checkbox,
  NonIdealState,
  Spinner,
  Classes,
  Colors,
  H5,
  Divider
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { Cell, Column, Table2, SelectionModes } from '@blueprintjs/table';
import { ReviewComponent, FieldMapping, CollectionOpportunity } from '../../types/navigation';
import styled from 'styled-components';

// Styled components for theme application
const ReviewContainer = styled.div<{ theme: ReviewComponent.ThemeConfiguration }>`
  .review-header {
    background: ${props => props.theme.headerGradient || props.theme.primaryColor};
    color: white;
    padding: 24px;
    border-radius: 8px 8px 0 0;
  }
  
  .review-content {
    background: ${props => props.theme.surfaceColor};
    border-radius: 0 0 8px 8px;
  }
`;

interface UnifiedReviewComponentProps<T> {
  mode: 'fieldMapping' | 'collectionOpportunity';
  viewType: 'editable' | 'readonly';
  data: T[];
  config: ReviewComponent.Configuration<T>;
  selectedItems?: Set<string>;
  onSelectionChange?: (selection: Set<string>) => void;
  onAction?: (action: string, items: T[]) => void;
  isLoading?: boolean;
}

/**
 * Unified review component supporting both field mapping and collection opportunity contexts
 * Built with native Blueprint.js components for consistency and accessibility
 */
export function UnifiedReviewComponent<T extends { id: string }>({
  mode,
  viewType,
  data,
  config,
  selectedItems = new Set(),
  onSelectionChange,
  onAction,
  isLoading = false
}: UnifiedReviewComponentProps<T>) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter data based on current filters and search
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(query)
        );
      });
    }
    
    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(item => 
          (item as any)[key] === value
        );
      }
    });
    
    return filtered;
  }, [data, filters, searchQuery]);
  
  // Handle selection changes
  const handleSelectionChange = useCallback((itemId: string, selected: boolean) => {
    if (viewType === 'readonly' || !onSelectionChange) return;
    
    const newSelection = new Set(selectedItems);
    if (selected) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    onSelectionChange(newSelection);
  }, [selectedItems, onSelectionChange, viewType]);
  
  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (viewType === 'readonly' || !onSelectionChange) return;
    
    if (selected) {
      const allIds = filteredData.map(item => item.id);
      onSelectionChange(new Set(allIds));
    } else {
      onSelectionChange(new Set());
    }
  }, [filteredData, onSelectionChange, viewType]);
  
  // Handle action execution
  const handleAction = useCallback((actionId: string) => {
    if (!onAction) return;
    
    const action = config.actions.find(a => a.id === actionId);
    if (!action) return;
    
    const selectedData = filteredData.filter(item => 
      selectedItems.has(item.id)
    );
    
    if (action.requiresSelection && selectedData.length === 0) {
      return;
    }
    
    onAction(actionId, selectedData);
  }, [config.actions, filteredData, selectedItems, onAction]);
  
  // Render cell based on column configuration
  const renderCell = useCallback((rowIndex: number, columnKey: string) => {
    const item = filteredData[rowIndex];
    if (!item) return <Cell />;
    
    const column = config.columns.find(c => c.key === columnKey);
    const value = (item as any)[columnKey];
    
    // Custom cell renderer if provided
    if (column?.cellRenderer) {
      return <Cell>{column.cellRenderer(value, item)}</Cell>;
    }
    
    // Default rendering based on column type
    switch (column?.type) {
      case 'badge':
      case 'tag':
        return (
          <Cell>
            <Tag intent={getIntentForValue(value, columnKey)} minimal>
              {value}
            </Tag>
          </Cell>
        );
        
      case 'multi-tag':
        return (
          <Cell>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {Array.isArray(value) && value.map((v, i) => (
                <Tag key={i} minimal>{v}</Tag>
              ))}
            </div>
          </Cell>
        );
        
      case 'metric':
        return (
          <Cell>
            <strong>{value}</strong>
          </Cell>
        );
        
      default:
        return <Cell>{String(value || '-')}</Cell>;
    }
  }, [filteredData, config.columns]);
  
  // Get intent for tag values
  const getIntentForValue = (value: any, key: string): Intent => {
    if (mode === 'fieldMapping') {
      if (key === 'confidence') {
        switch (value) {
          case 'high': return Intent.SUCCESS;
          case 'medium': return Intent.WARNING;
          case 'low': return Intent.DANGER;
        }
      }
      if (key === 'status') {
        switch (value) {
          case 'approved': return Intent.SUCCESS;
          case 'rejected': return Intent.DANGER;
          case 'pending': return Intent.WARNING;
          case 'modified': return Intent.PRIMARY;
        }
      }
    }
    
    if (mode === 'collectionOpportunity') {
      if (key === 'match') {
        switch (value) {
          case 'Optimal': return Intent.SUCCESS;
          case 'Baseline': return Intent.WARNING;
          case 'No matches': return Intent.DANGER;
        }
      }
    }
    
    return Intent.NONE;
  };
  
  // Loading state
  if (isLoading) {
    return (
      <NonIdealState
        icon={<Spinner size={50} />}
        title="Loading..."
        description={`Loading ${mode === 'fieldMapping' ? 'field mappings' : 'collection opportunities'}`}
      />
    );
  }
  
  // Empty state
  if (filteredData.length === 0) {
    return (
      <NonIdealState
        icon={IconNames.SEARCH}
        title="No results found"
        description={
          searchQuery || Object.keys(filters).length > 0
            ? "Try adjusting your search criteria"
            : `No ${mode === 'fieldMapping' ? 'field mappings' : 'collection opportunities'} available`
        }
        action={
          searchQuery || Object.keys(filters).length > 0 ? (
            <Button
              text="Clear Filters"
              onClick={() => {
                setSearchQuery('');
                setFilters({});
              }}
            />
          ) : undefined
        }
      />
    );
  }
  
  return (
    <ReviewContainer theme={config.theme}>
      <Card elevation={Elevation.ONE}>
        {/* Header Section */}
        <div className="review-header">
          <H5 style={{ margin: 0, color: 'white' }}>
            {config.contextHelp.title}
          </H5>
          {config.contextHelp.content && (
            <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '14px' }}>
              {config.contextHelp.content}
            </p>
          )}
        </div>
        
        <div className="review-content" style={{ padding: '16px' }}>
          {/* Filter Controls */}
          <div style={{ marginBottom: '16px' }}>
            <ControlGroup fill>
              <InputGroup
                leftIcon={IconNames.SEARCH}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={viewType === 'readonly'}
              />
              
              {config.filters.map(filter => (
                <HTMLSelect
                  key={filter.key}
                  value={filters[filter.key] || 'all'}
                  onChange={(e) => setFilters({
                    ...filters,
                    [filter.key]: e.target.value
                  })}
                  disabled={viewType === 'readonly'}
                >
                  <option value="all">{filter.label}</option>
                  {filter.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </HTMLSelect>
              ))}
            </ControlGroup>
          </div>
          
          <Divider />
          
          {/* Actions Bar */}
          {viewType === 'editable' && (
            <>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px' 
              }}>
                <div>
                  {selectedItems.size > 0 && (
                    <span className={Classes.TEXT_MUTED}>
                      {selectedItems.size} items selected
                    </span>
                  )}
                </div>
                
                <ButtonGroup>
                  {selectedItems.size !== filteredData.length && (
                    <Button
                      text="Select All"
                      icon={IconNames.SELECTION}
                      minimal
                      onClick={() => handleSelectAll(true)}
                    />
                  )}
                  
                  {selectedItems.size > 0 && (
                    <Button
                      text="Clear Selection"
                      icon={IconNames.CROSS}
                      minimal
                      onClick={() => handleSelectAll(false)}
                    />
                  )}
                  
                  {config.actions.map(action => (
                    <Button
                      key={action.id}
                      text={action.label}
                      icon={action.icon as any}
                      intent={action.intent}
                      disabled={action.requiresSelection && selectedItems.size === 0}
                      onClick={() => handleAction(action.id)}
                    />
                  ))}
                </ButtonGroup>
              </div>
              
              <Divider />
            </>
          )}
          
          {/* Data Table */}
          <Table2
            numRows={filteredData.length}
            enableRowHeader={false}
            enableColumnHeader={true}
            selectionModes={viewType === 'editable' ? SelectionModes.ROWS_ONLY : SelectionModes.NONE}
            onSelection={(selection) => {
              if (viewType === 'readonly' || !onSelectionChange) return;
              
              const newSelection = new Set<string>();
              selection.forEach(region => {
                if (region.rows) {
                  const [start, end] = region.rows;
                  for (let i = start; i <= end; i++) {
                    if (filteredData[i]) {
                      newSelection.add(filteredData[i].id);
                    }
                  }
                }
              });
              onSelectionChange(newSelection);
            }}
          >
            {/* Columns */}
            {[
              ...(viewType === 'editable' ? [{
                key: '__selection__',
                name: '',
                cellRenderer: (rowIndex: number) => (
                  <Cell>
                    <Checkbox
                      checked={selectedItems.has(filteredData[rowIndex]?.id)}
                      onChange={(e) => handleSelectionChange(
                        filteredData[rowIndex]?.id,
                        e.currentTarget.checked
                      )}
                    />
                  </Cell>
                )
              }] : []),
              ...config.columns.map(column => ({
                key: column.key,
                name: column.label,
                cellRenderer: (rowIndex: number) => renderCell(rowIndex, column.key)
              }))
            ].map(col => (
              <Column
                key={col.key}
                name={col.name}
                cellRenderer={col.cellRenderer}
              />
            ))}
          </Table2>
        </div>
      </Card>
    </ReviewContainer>
  );
}