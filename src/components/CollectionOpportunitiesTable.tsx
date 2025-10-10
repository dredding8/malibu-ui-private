import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { 
  Table2, 
  Column, 
  Cell, 
  RenderMode,
  SelectionModes,
  Region,
  RegionCardinality,
  Regions
} from '@blueprintjs/table';
import {
  Card,
  Tag,
  Intent,
  Button,
  InputGroup,
  HTMLSelect,
  ControlGroup,
  Navbar,
  NonIdealState
} from '@blueprintjs/core';
import { CollectionOpportunity, Site } from '../types/collectionOpportunities';
import { EnhancedHealthIndicator, ChunkedSiteDisplay } from './CollectionOpportunitiesUXImprovements';
import { useMemoizedHealthScores, useDebouncedSearch, AUTO_SIZED_COLUMNS } from '../hooks/collections/useCollectionPerformance';
import { calculateOpportunityHealth } from '../utils/opportunityHealth';
import OpportunityStatusIndicatorEnhanced from './OpportunityStatusIndicatorEnhanced';
import './CollectionOpportunitiesTable.css';

interface CollectionOpportunitiesTableProps {
  opportunities: CollectionOpportunity[];
  sites: Site[];
  onSelectionChange: (selectedIds: string[]) => void;
  selectedIds: string[];
}

/**
 * Extracted table component for maximum reusability
 * This is the existing table logic from CollectionOpportunitiesSplitView
 * but made into a standalone component
 */
export const CollectionOpportunitiesTable: React.FC<CollectionOpportunitiesTableProps> = ({
  opportunities,
  sites,
  onSelectionChange,
  selectedIds
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const tableRef = useRef<Table2>(null);
  
  // Debounced search
  const debouncedSetSearch = useDebouncedSearch(setSearchQuery);
  
  // Calculate health scores
  const healthScores = useMemoizedHealthScores(opportunities);
  
  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities;
    
    // Site filter
    if (siteFilter) {
      filtered = filtered.filter(opp => 
        opp.allocatedSites.some(site => site.id === siteFilter)
      );
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(opp => 
        opp.name.toLowerCase().includes(query) ||
        opp.collectionDeckId.toLowerCase().includes(query) ||
        opp.allocatedSites.some(site => site.name.toLowerCase().includes(query))
      );
    }
    
    // Sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = a[sortColumn as keyof CollectionOpportunity];
        let bVal: any = b[sortColumn as keyof CollectionOpportunity];
        
        if (sortColumn === 'health') {
          aVal = healthScores.get(a.id)?.score || 0;
          bVal = healthScores.get(b.id)?.score || 0;
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [opportunities, siteFilter, searchQuery, sortColumn, sortDirection, healthScores]);
  
  // Handle selection changes
  const handleSelection = useCallback((regions: Region[]) => {
    const selectedRows = regions
      .filter(region => region.cols == null && region.rows != null)
      .map(region => {
        const [start, end] = region.rows!;
        const indices: number[] = [];
        for (let i = start; i <= end; i++) {
          indices.push(i);
        }
        return indices;
      })
      .flat();
    
    const newSelectedIds = selectedRows.map(index => filteredOpportunities[index]?.id).filter(Boolean);
    onSelectionChange(newSelectedIds);
  }, [filteredOpportunities, onSelectionChange]);
  
  // Convert selectedIds to regions for table
  const selectedRegions = useMemo((): Region[] => {
    return Array.from(selectedIds)
      .map(id => {
        const index = filteredOpportunities.findIndex(opp => opp.id === id);
        return index >= 0 ? Regions.row(index) : null;
      })
      .filter((region): region is Region => region !== null);
  }, [selectedIds, filteredOpportunities]);
  
  // Cell renderers (reused from existing implementation)
  const renderNameCell = (rowIndex: number) => {
    const opp = filteredOpportunities[rowIndex];
    if (!opp) return <Cell />;
    
    const isSelected = selectedIds.includes(opp.id);
    
    return (
      <Cell className={isSelected ? 'selected-cell' : ''}>
        <span className="opportunity-name">{opp.name}</span>
      </Cell>
    );
  };
  
  const renderPriorityCell = (rowIndex: number) => {
    const opp = filteredOpportunities[rowIndex];
    if (!opp) return <Cell />;
    
    const getPriorityIntent = (priority: string) => {
      switch (priority) {
        case 'critical': return Intent.DANGER;
        case 'high': return Intent.WARNING;
        case 'medium': return Intent.PRIMARY;
        case 'low': return Intent.NONE;
        default: return Intent.NONE;
      }
    };
    
    return (
      <Cell>
        <Tag intent={getPriorityIntent(opp.priority)} minimal round>
          {opp.priority}
        </Tag>
      </Cell>
    );
  };
  
  const renderSitesCell = (rowIndex: number) => {
    const opp = filteredOpportunities[rowIndex];
    if (!opp) return <Cell />;
    
    return (
      <Cell>
        <ChunkedSiteDisplay sites={opp.allocatedSites} maxVisible={3} />
      </Cell>
    );
  };
  
  const renderCapacityCell = (rowIndex: number) => {
    const opp = filteredOpportunities[rowIndex];
    if (!opp) return <Cell />;
    
    const usagePercent = (opp.totalPasses / opp.capacity) * 100;
    
    return (
      <Cell>
        <div className="capacity-cell">
          <div className="capacity-bar" style={{ width: `${usagePercent}%` }} />
          <span className="capacity-text">{opp.totalPasses}/{opp.capacity}</span>
        </div>
      </Cell>
    );
  };
  
  const renderStatusCell = (rowIndex: number) => {
    const opp = filteredOpportunities[rowIndex];
    if (!opp) return <Cell />;
    
    const getStatusIntent = (status: string) => {
      switch (status) {
        case 'baseline': return Intent.SUCCESS;
        case 'suboptimal': return Intent.WARNING;
        case 'unmatched': return Intent.DANGER;
        default: return Intent.NONE;
      }
    };
    
    return (
      <Cell>
        <Tag intent={getStatusIntent(opp.matchStatus || 'unmatched')}>
          {opp.matchStatus || 'unmatched'}
        </Tag>
      </Cell>
    );
  };
  
  const renderHealthCell = (rowIndex: number) => {
    const opp = filteredOpportunities[rowIndex];
    if (!opp) return <Cell />;
    
    const health = healthScores.get(opp.id);
    if (!health) return <Cell>-</Cell>;
    
    // Convert health analysis back to health format for the indicator
    const healthData = {
      level: health.level || 'warning',
      score: health.score || 0,
      reasons: health.issues || [],
      metrics: {
        capacityScore: parseInt(health.coverage?.replace('%', '') || '0'),
        matchQuality: 75, // Default as not provided in HealthAnalysis
        conflictCount: health.issues?.filter(i => i.includes('conflict')).length || 0,
        priorityAlignment: parseInt(health.balance?.replace('%', '') || '0'),
        utilizationEfficiency: parseInt(health.efficiency?.replace('%', '') || '0'),
        riskScore: 100 - health.score // Inverse of health score
      },
      recommendations: [] // Will be calculated by the component
    };
    
    return (
      <Cell className="health-cell">
        <OpportunityStatusIndicatorEnhanced 
          health={healthData}
          compact={true}
          showDetails={false}
        />
      </Cell>
    );
  };
  
  return (
    <Card className="opportunities-table-container">
      {/* Table Header */}
      <Navbar className="table-navbar">
        <Navbar.Group>
          <h3>Collection Opportunities</h3>
          <Navbar.Divider />
          
          <ControlGroup>
            <InputGroup
              leftIcon="search"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => debouncedSetSearch(e.target.value)}
            />
          </ControlGroup>
          
          <HTMLSelect
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="">All Sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </HTMLSelect>
        </Navbar.Group>
        
        <Navbar.Group align="right">
          <Tag round>
            {selectedIds.length} selected
          </Tag>
        </Navbar.Group>
      </Navbar>
      
      {/* Table */}
      <Table2
        ref={tableRef}
        numRows={filteredOpportunities.length}
        columnWidths={[
          AUTO_SIZED_COLUMNS.priority,
          AUTO_SIZED_COLUMNS.name,
          AUTO_SIZED_COLUMNS.status,
          AUTO_SIZED_COLUMNS.health,
          AUTO_SIZED_COLUMNS.sites,
          AUTO_SIZED_COLUMNS.capacity
        ]}
        rowHeights={filteredOpportunities.map(() => 40)}
        enableRowHeader={false}
        enableColumnResizing={true}
        enableRowReordering={false}
        enableMultipleSelection={true}
        selectionModes={SelectionModes.ROWS_ONLY}
        selectedRegions={selectedRegions}
        onSelection={handleSelection}
        renderMode={RenderMode.BATCH}
      >
        <Column name="Priority" cellRenderer={renderPriorityCell} />
        <Column name="Name" cellRenderer={renderNameCell} />
        <Column name="Status" cellRenderer={renderStatusCell} />
        <Column name="Health" cellRenderer={renderHealthCell} />
        <Column name="Sites" cellRenderer={renderSitesCell} />
        <Column name="Capacity" cellRenderer={renderCapacityCell} />
      </Table2>
      
      {filteredOpportunities.length === 0 && (
        <NonIdealState
          icon="search"
          title="No opportunities found"
          description="Try adjusting your filters or search query"
        />
      )}
    </Card>
  );
};