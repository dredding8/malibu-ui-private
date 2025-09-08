import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Cell, Column, Table2, SelectionModes, ColumnHeaderCell } from '@blueprintjs/table';
import {
  Card,
  H3,
  H4,
  H5,
  Button,
  Intent,
  Tag,
  Breadcrumbs,
  Breadcrumb,
  Divider,
  FormGroup,
  InputGroup,
  HTMLSelect,
  ControlGroup,
  Callout,
  Colors,
  Elevation,
  Classes,
  Tooltip,
  ButtonGroup,
  Drawer,
  DrawerSize,
  Collapse,
  Checkbox,
  Text,
  Menu,
  MenuItem,
  MenuDivider,
  Popover,
  Position,
  NonIdealState,
  Spinner,
  Hotkey,
  HotkeysTarget2,
  useHotkeys
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import AppNavbar from '../components/AppNavbar';
import { useUrlState } from '../hooks/useUrlState';
import { NAVIGATION_LABELS, NAVIGATION_ROUTES } from '../constants/navigation';
import '../components/MatchReview.css';

interface MatchResult {
  id: string;
  sourceField: string;
  targetField: string;
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'manual';
  status: 'approved' | 'rejected' | 'pending' | 'modified';
  lastModified: Date;
  notes?: string;
  category?: string;
  dataType?: string;
  validationErrors?: string[];
  usage?: 'frequent' | 'occasional' | 'rare';
  sensorType?: 'wideband' | 'narrowband' | 'imagery' | 'signals';
  calculatedCapacity?: number;
}

interface FilterState {
  search: string;
  status: string;
  confidence: string;
  category: string;
  matchType: string;
  [key: string]: string;  // Index signature for useUrlState
}

type BulkAction = 'approve' | 'reject' | 'modify' | 'export';

type ViewMode = 'table' | 'cards' | 'detailed';

/**
 * Field Mapping Review Page
 * Reviews data field relationships and transformations for a collection
 */
const FieldMappingReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { collectionId } = useParams<{ collectionId: string }>();
  
  // Enhanced state management for enterprise UX with URL persistence
  const [filters, setFilters] = useUrlState<FilterState>({
    search: '',
    status: 'all',
    confidence: 'all',
    category: 'all',
    matchType: 'all'
  });
  
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [urlViewMode, setUrlViewMode] = useUrlState({ viewMode: 'cards' });
  const viewMode = urlViewMode.viewMode as ViewMode;
  const setViewMode = (mode: ViewMode) => setUrlViewMode({ viewMode: mode });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for accessibility
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Performance optimization for large datasets
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate sensor capacity based on sensor type
  const calculateSensorCapacity = (sensorType: string): number => {
    switch (sensorType) {
      case 'wideband':
        return 8; // Wideband Collection: 8 simultaneous channels
      case 'narrowband':
        return 16; // Narrowband Collection: 16 simultaneous channels
      case 'imagery':
        return 4; // Imagery Collection: 4 simultaneous collections
      case 'signals':
        return 12; // Signals Collection: 12 simultaneous collections
      default:
        return 1; // Default capacity for unknown sensor types
    }
  };

  // Enhanced sample match data with enterprise requirements and sensor capacity
  const sampleMatches: MatchResult[] = [
    {
      id: '1',
      sourceField: 'customer_name',
      targetField: 'client_name',
      matchScore: 0.95,
      confidence: 'high',
      matchType: 'exact',
      status: 'approved',
      lastModified: new Date(),
      notes: 'Perfect field name match',
      category: 'Identity',
      dataType: 'string',
      usage: 'frequent',
      sensorType: 'wideband',
      calculatedCapacity: 8
    },
    {
      id: '2',
      sourceField: 'phone_number',
      targetField: 'telephone',
      matchScore: 0.78,
      confidence: 'medium',
      matchType: 'semantic',
      status: 'pending',
      lastModified: new Date(),
      notes: 'Semantic similarity detected',
      category: 'Contact',
      dataType: 'string',
      usage: 'frequent',
      sensorType: 'narrowband',
      calculatedCapacity: 16
    },
    {
      id: '3',
      sourceField: 'email_addr',
      targetField: 'email_address',
      matchScore: 0.92,
      confidence: 'high',
      matchType: 'fuzzy',
      status: 'approved',
      lastModified: new Date(),
      category: 'Contact',
      dataType: 'email',
      usage: 'frequent',
      sensorType: 'imagery',
      calculatedCapacity: 4
    },
    {
      id: '4',
      sourceField: 'addr_line1',
      targetField: 'street_address',
      matchScore: 0.65,
      confidence: 'low',
      matchType: 'fuzzy',
      status: 'rejected',
      lastModified: new Date(),
      notes: 'Low confidence match rejected',
      category: 'Address',
      dataType: 'string',
      usage: 'occasional',
      validationErrors: ['Format mismatch', 'Length variance'],
      sensorType: 'signals',
      calculatedCapacity: 12
    },
    {
      id: '5',
      sourceField: 'order_date',
      targetField: 'purchase_timestamp',
      matchScore: 0.88,
      confidence: 'high',
      matchType: 'semantic',
      status: 'pending',
      lastModified: new Date(),
      notes: 'Date format conversion required',
      category: 'Temporal',
      dataType: 'datetime',
      usage: 'frequent',
      sensorType: 'wideband',
      calculatedCapacity: 8
    },
    {
      id: '6',
      sourceField: 'product_id',
      targetField: 'item_code',
      matchScore: 0.71,
      confidence: 'medium',
      matchType: 'manual',
      status: 'modified',
      lastModified: new Date(),
      notes: 'Manual mapping applied',
      category: 'Product',
      dataType: 'identifier',
      usage: 'frequent',
      sensorType: 'narrowband',
      calculatedCapacity: 16
    }
  ];

  // Enhanced filtering with performance optimization
  const filteredMatches = useMemo(() => {
    let filtered = sampleMatches;

    // Apply search filter
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(match => 
        match.sourceField.toLowerCase().includes(query) ||
        match.targetField.toLowerCase().includes(query) ||
        match.notes?.toLowerCase().includes(query) ||
        match.category?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(match => match.status === filters.status);
    }

    // Apply confidence filter
    if (filters.confidence !== 'all') {
      filtered = filtered.filter(match => match.confidence === filters.confidence);
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(match => match.category === filters.category);
    }

    // Apply match type filter
    if (filters.matchType !== 'all') {
      filtered = filtered.filter(match => match.matchType === filters.matchType);
    }

    return filtered;
  }, [sampleMatches, filters]);

  // Paginated matches for performance
  const paginatedMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMatches.slice(startIndex, startIndex + pageSize);
  }, [filteredMatches, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredMatches.length / pageSize);

  // Enhanced event handlers for enterprise functionality
  const handleBack = useCallback(() => {
    // Preserve state when navigating back
    navigate(NAVIGATION_ROUTES.HISTORY, { state: { ...location.state, fromFieldMapping: true } });
  }, [navigate, location.state]);

  const handleMatchSelection = useCallback((matchId: string, selected: boolean) => {
    const newSelection = new Set(selectedMatches);
    if (selected) {
      newSelection.add(matchId);
    } else {
      newSelection.delete(matchId);
    }
    setSelectedMatches(newSelection);
  }, [selectedMatches]);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedMatches(new Set(paginatedMatches.map(m => m.id)));
    } else {
      setSelectedMatches(new Set());
    }
  }, [paginatedMatches]);

  const handleBulkAction = useCallback(async (action: BulkAction) => {
    setIsLoading(true);
    try {
      const selectedIds = Array.from(selectedMatches);
      switch (action) {
        case 'approve':
          console.log('Bulk approving matches:', selectedIds);
          break;
        case 'reject':
          console.log('Bulk rejecting matches:', selectedIds);
          break;
        case 'export':
          console.log('Exporting selected matches:', selectedIds);
          break;
      }
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedMatches(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMatches]);

  const handleExpandMatch = useCallback((matchId: string) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  }, [expandedMatches]);

  const handleViewDetails = useCallback((match: MatchResult) => {
    setSelectedMatch(match);
    setDrawerOpen(true);
  }, []);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1); // Reset to first page when filtering
  }, [filters, setFilters]);

  // Keyboard shortcuts for accessibility and power users
  useHotkeys([
    {
      combo: 'ctrl+a',
      label: 'Select all matches',
      onKeyDown: () => handleSelectAll(true),
    },
    {
      combo: 'ctrl+shift+a',
      label: 'Approve selected matches',
      onKeyDown: () => handleBulkAction('approve'),
    },
    {
      combo: 'ctrl+shift+r',
      label: 'Reject selected matches', 
      onKeyDown: () => handleBulkAction('reject'),
    },
    {
      combo: 'escape',
      label: 'Clear selection',
      onKeyDown: () => setSelectedMatches(new Set()),
    },
    {
      combo: 'ctrl+f',
      label: 'Focus search',
      onKeyDown: () => searchInputRef.current?.focus(),
    },
  ]);

  // Utility functions
  const getConfidenceIntent = (confidence: string): Intent => {
    switch (confidence) {
      case 'high': return Intent.SUCCESS;
      case 'medium': return Intent.WARNING;
      case 'low': return Intent.DANGER;
      default: return Intent.NONE;
    }
  };


  // Enterprise Match Card Component with Progressive Disclosure
  const MatchCard: React.FC<{ 
    match: MatchResult; 
    isSelected: boolean; 
    isExpanded: boolean;
    onSelect: (selected: boolean) => void;
    onExpand: () => void;
  }> = ({ match, isSelected, isExpanded, onSelect, onExpand }) => {
    const getStatusIntent = (status: string): Intent => {
      switch (status) {
        case 'approved': return Intent.SUCCESS;
        case 'rejected': return Intent.DANGER;
        case 'modified': return Intent.PRIMARY;
        case 'pending': return Intent.WARNING;
        default: return Intent.NONE;
      }
    };

    const getConfidenceIntent = (confidence: string): Intent => {
      switch (confidence) {
        case 'high': return Intent.SUCCESS;
        case 'medium': return Intent.WARNING;
        case 'low': return Intent.DANGER;
        default: return Intent.NONE;
      }
    };

    const getScoreColor = (score: number) => {
      if (score >= 0.8) return Colors.GREEN1;
      if (score >= 0.6) return Colors.ORANGE1;
      return Colors.RED1;
    };

    return (
      <Card
        elevation={isSelected ? Elevation.TWO : Elevation.ONE}
        className={`match-card ${isSelected ? 'selected' : ''}`}
        style={{ 
          marginBottom: '12px',
          borderLeft: isSelected ? `4px solid ${Colors.BLUE3}` : 'none',
          backgroundColor: isSelected ? Colors.BLUE5 : Colors.WHITE
        }}
      >
        {/* Card Header - Always Visible */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '12px 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {bulkMode && (
              <Checkbox
                checked={isSelected}
                onChange={(e) => onSelect(e.currentTarget.checked)}
                aria-label={`Select match ${match.sourceField} to ${match.targetField}`}
              />
            )}
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Text style={{ fontFamily: 'Monaco, monospace', fontSize: '13px', fontWeight: '600' }}>
                  {match.sourceField}
                </Text>
                <span style={{ color: Colors.GRAY1 }}>→</span>
                <Text style={{ fontFamily: 'Monaco, monospace', fontSize: '13px', fontWeight: '600' }}>
                  {match.targetField}
                </Text>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: getScoreColor(match.matchScore) 
                }}>
                  {(match.matchScore * 100).toFixed(0)}%
                </div>
                <Tag intent={getConfidenceIntent(match.confidence)} minimal>
                  {match.confidence}
                </Tag>
                <Tag intent={getStatusIntent(match.status)} minimal>
                  {match.status}
                </Tag>
                {match.category && (
                  <Tag minimal style={{ backgroundColor: Colors.LIGHT_GRAY4 }}>
                    {match.category}
                  </Tag>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {match.status === 'pending' && (
              <ButtonGroup>
                <Button
                  icon={IconNames.TICK}
                  intent={Intent.SUCCESS}
                  minimal
                  small
                  onClick={() => console.log('Approve', match.id)}
                  aria-label={`Approve match ${match.sourceField}`}
                />
                <Button
                  icon={IconNames.CROSS}
                  intent={Intent.DANGER}
                  minimal
                  small
                  onClick={() => console.log('Reject', match.id)}
                  aria-label={`Reject match ${match.sourceField}`}
                />
              </ButtonGroup>
            )}
            
            <Button
              minimal
              small
              icon={isExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
              onClick={onExpand}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${match.sourceField}`}
              aria-expanded={isExpanded}
            />
            
            <Button
              minimal
              small
              icon={IconNames.MORE}
              onClick={() => handleViewDetails(match)}
              aria-label={`View detailed information for ${match.sourceField}`}
            />
          </div>
        </div>

        {/* Expandable Details Section */}
        <Collapse isOpen={isExpanded}>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ padding: '0 0 12px 0' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.GRAY1, textTransform: 'uppercase' }}>
                  Match Type
                </Text>
                <Text>{match.matchType}</Text>
              </div>
              
              <div>
                <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.GRAY1, textTransform: 'uppercase' }}>
                  Data Type
                </Text>
                <Text>{match.dataType || 'Unknown'}</Text>
              </div>
              
              <div>
                <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.GRAY1, textTransform: 'uppercase' }}>
                  Sensor Type
                </Text>
                <Text style={{ textTransform: 'capitalize' }}>{match.sensorType || 'Unknown'}</Text>
              </div>
              
              <div>
                <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.GRAY1, textTransform: 'uppercase' }}>
                  Calculated Capacity
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text style={{ fontWeight: '600', fontSize: '16px', color: Colors.BLUE2 }}>
                    {match.calculatedCapacity || 'N/A'}
                  </Text>
                  {match.sensorType && (
                    <Tag minimal intent={Intent.PRIMARY} style={{ fontSize: '10px' }}>
                      {match.sensorType === 'wideband' || match.sensorType === 'narrowband' ? 'channels' : 'collections'}
                    </Tag>
                  )}
                </div>
              </div>
              
              <div>
                <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.GRAY1, textTransform: 'uppercase' }}>
                  Usage Frequency
                </Text>
                <Text style={{ textTransform: 'capitalize' }}>{match.usage || 'Unknown'}</Text>
              </div>
              
              <div>
                <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.GRAY1, textTransform: 'uppercase' }}>
                  Last Modified
                </Text>
                <Text>{match.lastModified.toLocaleDateString()}</Text>
              </div>
            </div>

            {match.notes && (
              <div style={{ marginBottom: '12px' }}>
                <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.GRAY1, textTransform: 'uppercase' }}>
                  Notes
                </Text>
                <Text>{match.notes}</Text>
              </div>
            )}

            {match.validationErrors && match.validationErrors.length > 0 && (
              <div>
                <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.RED1, textTransform: 'uppercase' }}>
                  Validation Issues
                </Text>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {match.validationErrors.map((error, index) => (
                    <Tag key={index} intent={Intent.WARNING} minimal>
                      {error}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Collapse>
      </Card>
    );
  };

  return (
    <div className="field-mapping-review">
      <AppNavbar />
      
      <div style={{ 
        padding: '24px',
        backgroundColor: Colors.LIGHT_GRAY5,
        minHeight: 'calc(100vh - 50px)',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: '24px' }}>
          <Breadcrumbs
            items={[
              {
                text: NAVIGATION_LABELS.HISTORY,
                icon: IconNames.HISTORY,
                onClick: handleBack
              },
              {
                text: `Collection ${collectionId || 'Unknown'}`,
                icon: IconNames.FOLDER_CLOSE
              },
              {
                text: NAVIGATION_LABELS.FIELD_MAPPING_REVIEW,
                icon: IconNames.FLOWS,
                current: true
              }
            ]}
          />
        </div>

        {/* Enhanced Page Header with View Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '24px',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <H3 style={{ marginBottom: '8px', color: Colors.DARK_GRAY1 }}>
              Field Mapping Review
            </H3>
            <Text style={{ 
              fontSize: '16px',
              color: Colors.GRAY1,
              lineHeight: '1.5'
            }}>
              Review and approve data field relationships • {filteredMatches.length} mappings
            </Text>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
            <ButtonGroup>
              <Button
                icon={IconNames.TH}
                active={viewMode === 'cards'}
                onClick={() => setViewMode('cards')}
                title="Card View"
              />
              <Button
                icon={IconNames.LIST}
                active={viewMode === 'table'}
                onClick={() => setViewMode('table')}
                title="Table View"
              />
            </ButtonGroup>
            
            <Button 
              icon={IconNames.SELECTION}
              text={bulkMode ? 'Exit Bulk' : 'Bulk Mode'}
              intent={bulkMode ? Intent.PRIMARY : Intent.NONE}
              onClick={() => {
                setBulkMode(!bulkMode);
                if (!bulkMode) setSelectedMatches(new Set());
              }}
            />
            
            <Button 
              icon={IconNames.DOWNLOAD}
              text="Export"
              intent={Intent.SUCCESS}
              onClick={() => handleBulkAction('export')}
            />
            
            <Button 
              icon={IconNames.ARROW_LEFT}
              text="Back to History"
              onClick={handleBack}
            />
          </div>
        </div>

        {/* Enhanced Status Summary */}
        <Card 
          elevation={Elevation.ONE}
          style={{ marginBottom: '24px', backgroundColor: Colors.WHITE }}
        >
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '16px'
          }}>
            <Callout intent={Intent.SUCCESS} icon={IconNames.TICK} style={{ padding: '16px' }}>
              <H4 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>
                {sampleMatches.filter(m => m.status === 'approved').length}
              </H4>
              <Text>Approved Matches</Text>
            </Callout>
            <Callout intent={Intent.WARNING} icon={IconNames.TIME} style={{ padding: '16px' }}>
              <H4 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>
                {sampleMatches.filter(m => m.status === 'pending').length}
              </H4>
              <Text>Pending Review</Text>
            </Callout>
            <Callout intent={Intent.DANGER} icon={IconNames.CROSS} style={{ padding: '16px' }}>
              <H4 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>
                {sampleMatches.filter(m => m.status === 'rejected').length}
              </H4>
              <Text>Rejected Matches</Text>
            </Callout>
            <Callout intent={Intent.PRIMARY} icon={IconNames.EDIT} style={{ padding: '16px' }}>
              <H4 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>
                {sampleMatches.filter(m => m.status === 'modified').length}
              </H4>
              <Text>Modified Matches</Text>
            </Callout>
          </div>
        </Card>

        {/* Enhanced Filter Interface */}
        <Card elevation={Elevation.ONE} style={{ marginBottom: '24px', backgroundColor: Colors.WHITE }}>
          <H5>Advanced Filtering</H5>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginTop: '16px'
          }}>
            <FormGroup label="Search">
              <InputGroup
                inputRef={searchInputRef}
                placeholder="Search fields, notes, categories..."
                leftIcon={IconNames.SEARCH}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                aria-label="Search matches"
              />
            </FormGroup>
            
            <FormGroup label="Status">
              <HTMLSelect
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                fill
                options={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Rejected', value: 'rejected' },
                  { label: 'Modified', value: 'modified' }
                ]}
              />
            </FormGroup>
            
            <FormGroup label="Confidence">
              <HTMLSelect
                value={filters.confidence}
                onChange={(e) => handleFilterChange('confidence', e.target.value)}
                fill
                options={[
                  { label: 'All Confidence', value: 'all' },
                  { label: 'High', value: 'high' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Low', value: 'low' }
                ]}
              />
            </FormGroup>
            
            <FormGroup label="Category">
              <HTMLSelect
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                fill
                options={[
                  { label: 'All Categories', value: 'all' },
                  { label: 'Identity', value: 'Identity' },
                  { label: 'Contact', value: 'Contact' },
                  { label: 'Address', value: 'Address' },
                  { label: 'Temporal', value: 'Temporal' },
                  { label: 'Product', value: 'Product' }
                ]}
              />
            </FormGroup>
          </div>
        </Card>

        {/* Bulk Actions Toolbar */}
        {selectedMatches.size > 0 && (
          <Card 
            elevation={Elevation.TWO}
            style={{ 
              marginBottom: '16px', 
              backgroundColor: Colors.BLUE5,
              borderLeft: `4px solid ${Colors.BLUE3}`
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: '16px', fontWeight: '600' }}>
                {selectedMatches.size} matches selected
              </Text>
              <ButtonGroup>
                <Button
                  icon={IconNames.TICK}
                  text="Approve Selected"
                  intent={Intent.SUCCESS}
                  onClick={() => handleBulkAction('approve')}
                  loading={isLoading}
                />
                <Button
                  icon={IconNames.CROSS}
                  text="Reject Selected"
                  intent={Intent.DANGER}
                  onClick={() => handleBulkAction('reject')}
                  loading={isLoading}
                />
                <Button
                  icon={IconNames.DOWNLOAD}
                  text="Export Selected"
                  onClick={() => handleBulkAction('export')}
                  loading={isLoading}
                />
                <Button
                  icon={IconNames.CROSS}
                  minimal
                  onClick={() => setSelectedMatches(new Set())}
                  title="Clear Selection"
                />
              </ButtonGroup>
            </div>
          </Card>
        )}

        {/* Match Results Display */}
        <Card elevation={Elevation.ONE} style={{ backgroundColor: Colors.WHITE }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <H5 style={{ margin: 0 }}>
              Matches ({filteredMatches.length} found)
            </H5>
            
            {paginatedMatches.length > 0 && viewMode === 'cards' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button
                  small
                  minimal
                  icon={selectedMatches.size === paginatedMatches.length ? IconNames.SELECTION : IconNames.SELECT}
                  text={selectedMatches.size === paginatedMatches.length ? 'Deselect Page' : 'Select Page'}
                  onClick={() => handleSelectAll(selectedMatches.size !== paginatedMatches.length)}
                />
              </div>
            )}
          </div>
          
          <Divider style={{ margin: '0 0 16px 0' }} />

          {paginatedMatches.length > 0 ? (
            <div>
              {/* Cards View */}
              {viewMode === 'cards' && (
                <div role="list" aria-label="Match results">
                  {paginatedMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isSelected={selectedMatches.has(match.id)}
                      isExpanded={expandedMatches.has(match.id)}
                      onSelect={(selected) => handleMatchSelection(match.id, selected)}
                      onExpand={() => handleExpandMatch(match.id)}
                    />
                  ))}
                </div>
              )}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginTop: '24px',
                  padding: '16px 0'
                }}>
                  <Button
                    minimal
                    icon={IconNames.CHEVRON_LEFT}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    aria-label="Previous page"
                  />
                  
                  <Text>
                    Page {currentPage} of {totalPages} 
                    <span style={{ color: Colors.GRAY1, marginLeft: '8px' }}>
                      ({filteredMatches.length} total matches)
                    </span>
                  </Text>
                  
                  <Button
                    minimal
                    icon={IconNames.CHEVRON_RIGHT}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    aria-label="Next page"
                  />
                </div>
              )}
            </div>
          ) : (
            <NonIdealState
              icon={IconNames.SEARCH}
              title="No matches found"
              description={
                Object.values(filters).some(filter => filter !== 'all' && filter !== '')
                  ? "No matches found with the current filters. Try adjusting your search criteria."
                  : "No matching results available for this collection."
              }
              action={
                <Button
                  icon={IconNames.REFRESH}
                  text="Clear Filters"
                  onClick={() => setFilters({
                    search: '',
                    status: 'all',
                    confidence: 'all',
                    category: 'all',
                    matchType: 'all'
                  })}
                />
              }
            />
          )}
        </Card>

        {/* Details Drawer */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Match Details"
          size={DrawerSize.STANDARD}
          hasBackdrop={false}
        >
          <div style={{ padding: '20px' }}>
            {selectedMatch && (
              <div>
                <H4>Field Mapping Details</H4>
                <div style={{ marginBottom: '20px' }}>
                  <Text style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Source → Target
                  </Text>
                  <Text style={{ fontFamily: 'Monaco, monospace', fontSize: '14px' }}>
                    {selectedMatch.sourceField} → {selectedMatch.targetField}
                  </Text>
                </div>
                
                {/* Sensor and Capacity Details */}
                <div style={{ marginBottom: '20px' }}>
                  <H5 style={{ marginBottom: '12px' }}>Sensor Capacity Analysis</H5>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: Colors.LIGHT_GRAY5,
                    borderRadius: '4px'
                  }}>
                    <div>
                      <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.GRAY1, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Sensor Type
                      </Text>
                      <Text style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                        {selectedMatch.sensorType || 'Unknown'}
                      </Text>
                    </div>
                    <div>
                      <Text style={{ fontSize: '12px', fontWeight: '600', color: Colors.GRAY1, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Calculated Capacity
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Text style={{ fontWeight: '700', fontSize: '18px', color: Colors.BLUE1 }}>
                          {selectedMatch.calculatedCapacity || 'N/A'}
                        </Text>
                        {selectedMatch.sensorType && (
                          <Tag intent={Intent.PRIMARY} minimal>
                            {selectedMatch.sensorType === 'wideband' || selectedMatch.sensorType === 'narrowband' ? 'channels' : 'collections'}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Performance Details */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px' 
                }}>
                  <div>
                    <Text style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Match Score
                    </Text>
                    <Text>{(selectedMatch.matchScore * 100).toFixed(1)}%</Text>
                  </div>
                  <div>
                    <Text style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Confidence
                    </Text>
                    <Tag intent={getConfidenceIntent(selectedMatch.confidence)}>
                      {selectedMatch.confidence}
                    </Tag>
                  </div>
                </div>
                
                {/* Capacity Guidelines */}
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <H5 style={{ marginBottom: '8px' }}>Sensor Capacity Guidelines</H5>
                  <Card style={{ padding: '12px', backgroundColor: Colors.LIGHT_GRAY4 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div>
                        <Text style={{ fontWeight: '600', marginBottom: '4px' }}>Collection Types:</Text>
                        <ul style={{ marginLeft: '16px', lineHeight: '1.4' }}>
                          <li>Wideband: 8 channels</li>
                          <li>Narrowband: 16 channels</li>
                        </ul>
                      </div>
                      <div>
                        <Text style={{ fontWeight: '600', marginBottom: '4px' }}>Specialized:</Text>
                        <ul style={{ marginLeft: '16px', lineHeight: '1.4' }}>
                          <li>Imagery: 4 collections</li>
                          <li>Signals: 12 collections</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>

                {selectedMatch.notes && (
                  <div style={{ marginTop: '20px' }}>
                    <Text style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                      Notes
                    </Text>
                    <Text>{selectedMatch.notes}</Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </Drawer>
      </div>
    </div>
  );
};

export default FieldMappingReview;