import React, { useState, useEffect, useMemo } from 'react';
import {
  H5,
  Divider,
  Button,
  Intent,
  Card,
  Callout,
  Tag,
  ProgressBar,
  Checkbox,
  InputGroup,
  HTMLSelect,
  Tabs,
  Tab,
  Section,
  SectionCard,
  Text,
  Spinner
} from '@blueprintjs/core';
import { Cell, Column, Table, TruncatedFormat, JSONFormat } from '@blueprintjs/table';
import { IconNames } from '@blueprintjs/icons';

interface Match {
  id: string;
  sccNumber: string;
  priority: number;
  function: string;
  orbit: string;
  periodicity: number;
  collectionType: string;
  classification: string;
  match: 'Optimal' | 'Baseline' | 'No matches';
  matchNotes: string;
  siteAllocation: string[];
  notes: string;
  selected: boolean;
  needsReview: boolean;
  unmatched: boolean;
}

interface Step3ReviewMatchesProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

// Enhanced sample data with new fields
const sampleMatches: Match[] = [
  {
    id: '1',
    sccNumber: '13113',
    priority: 51,
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY',
    match: 'Optimal',
    matchNotes: '',
    siteAllocation: ['THU 2', 'FYL 2', 'ASC 2', 'CLR 2', 'HOLT 2'],
    notes: '',
    selected: true,
    needsReview: false,
    unmatched: false
  },
  {
    id: '2',
    sccNumber: '13162',
    priority: 51,
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY',
    match: 'Optimal',
    matchNotes: '',
    siteAllocation: ['THU 2', 'FYL 2', 'ASC 2', 'CLR 2', 'HOLT 2'],
    notes: '',
    selected: true,
    needsReview: false,
    unmatched: false
  },
  {
    id: '3',
    sccNumber: '13777',
    priority: 51,
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 6,
    collectionType: 'Wideband',
    classification: 'S//REL FVEY',
    match: 'Baseline',
    matchNotes: 'Capacity Issue',
    siteAllocation: ['CLR 2', 'PPW 1', 'THU 1', 'CLR 1', 'ASC 1'],
    notes: '',
    selected: false,
    needsReview: true,
    unmatched: false
  },
  {
    id: '4',
    sccNumber: '58253',
    priority: 1,
    function: 'Counterspace',
    orbit: 'GEO',
    periodicity: 6,
    collectionType: 'Optical',
    classification: 'S//REL FVEY',
    match: 'No matches',
    matchNotes: 'Capacity Issue',
    siteAllocation: [],
    notes: '',
    selected: false,
    needsReview: false,
    unmatched: true
  },
  {
    id: '5',
    sccNumber: '34546',
    priority: 3,
    function: 'ISR',
    orbit: 'LEO',
    periodicity: 3,
    collectionType: 'Narrowband',
    classification: 'S//NF',
    match: 'No matches',
    matchNotes: 'Capacity Issue',
    siteAllocation: [],
    notes: '',
    selected: false,
    needsReview: false,
    unmatched: true
  },
  {
    id: '6',
    sccNumber: '25404',
    priority: 12,
    function: 'Counterspace',
    orbit: 'LEO',
    periodicity: 8,
    collectionType: 'Optical',
    classification: 'S//NF',
    match: 'No matches',
    matchNotes: 'Not Seen',
    siteAllocation: [],
    notes: '',
    selected: false,
    needsReview: false,
    unmatched: true
  }
];

const Step3ReviewMatches: React.FC<Step3ReviewMatchesProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onBack, 
  onCancel 
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState('all');

  useEffect(() => {
    // Simulate generating matches
    setTimeout(() => {
      setMatches(sampleMatches);
      setSelectedMatches(new Set(sampleMatches.filter(m => m.selected).map(m => m.id)));
      setIsGenerating(false);
    }, 3000);
  }, []);

  // Filter matches based on active tab, search query, and site selection
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Filter by tab
    switch (activeTab) {
      case 'needsReview':
        filtered = filtered.filter(match => match.needsReview);
        break;
      case 'unmatched':
        filtered = filtered.filter(match => match.unmatched);
        break;
      default:
        // 'all' tab - no filtering
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(match => 
        match.sccNumber.toLowerCase().includes(query) ||
        match.function.toLowerCase().includes(query) ||
        match.collectionType.toLowerCase().includes(query)
      );
    }

    // Filter by site (if not 'all')
    if (selectedSite !== 'all') {
      filtered = filtered.filter(match => 
        match.siteAllocation.some(site => site.startsWith(selectedSite))
      );
    }

    return filtered;
  }, [matches, activeTab, searchQuery, selectedSite]);

  const handleMatchSelection = (matchId: string, selected: boolean) => {
    const newSelection = new Set(selectedMatches);
    if (selected) {
      newSelection.add(matchId);
    } else {
      newSelection.delete(matchId);
    }
    setSelectedMatches(newSelection);
    
    // Update matches with selection state
    const updatedMatches = matches.map(match => 
      match.id === matchId ? { ...match, selected } : match
    );
    setMatches(updatedMatches);
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelection = new Set<string>();
    const updatedMatches = matches.map(match => {
      if (selected) {
        newSelection.add(match.id);
      }
      return { ...match, selected };
    });
    setSelectedMatches(newSelection);
    setMatches(updatedMatches);
  };

  const handleNext = () => {
    const selectedMatchesData = matches.filter(match => selectedMatches.has(match.id));
    onUpdate({ matches: selectedMatchesData });
    onNext();
  };

  const getMatchIntent = (match: string): Intent => {
    switch (match) {
      case 'Optimal':
        return Intent.SUCCESS;
      case 'Baseline':
        return Intent.WARNING;
      case 'No matches':
        return Intent.DANGER;
      default:
        return Intent.NONE;
    }
  };

  const getClassificationIntent = (classification: string): Intent => {
    switch (classification) {
      case 'S//REL FVEY':
        return Intent.DANGER;
      case 'S//NF':
        return Intent.WARNING;
      default:
        return Intent.NONE;
    }
  };

  // Cell renderers
  const priorityCellRenderer = (rowIndex: number) => {
    const match = filteredMatches[rowIndex];
    return (
      <Cell>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {match?.priority <= 10 && (
            <span style={{ color: '#ff6b6b', fontSize: '12px' }}>⚠</span>
          )}
          {match?.priority}
        </div>
      </Cell>
    );
  };

  const sccCellRenderer = (rowIndex: number) => (
    <Cell>
      <strong>{filteredMatches[rowIndex]?.sccNumber}</strong>
    </Cell>
  );

  const functionCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredMatches[rowIndex]?.function}
    </Cell>
  );

  const orbitCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredMatches[rowIndex]?.orbit}
    </Cell>
  );

  const periodicityCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredMatches[rowIndex]?.periodicity}
    </Cell>
  );

  const collectionTypeCellRenderer = (rowIndex: number) => (
    <Cell>
      {filteredMatches[rowIndex]?.collectionType}
    </Cell>
  );

  const classificationCellRenderer = (rowIndex: number) => {
    const match = filteredMatches[rowIndex];
    return (
      <Cell>
        <Tag intent={getClassificationIntent(match?.classification || '')}>
          {match?.classification}
        </Tag>
      </Cell>
    );
  };

  const matchCellRenderer = (rowIndex: number) => {
    const match = filteredMatches[rowIndex];
    return (
      <Cell>
        <Tag intent={getMatchIntent(match?.match || '')}>
          {match?.match}
        </Tag>
      </Cell>
    );
  };

  const matchNotesCellRenderer = (rowIndex: number) => {
    const match = filteredMatches[rowIndex];
    return (
      <Cell>
        {match?.matchNotes ? (
          <TruncatedFormat>{match.matchNotes}</TruncatedFormat>
        ) : (
          <span style={{ color: '#666', fontStyle: 'italic' }}>-</span>
        )}
      </Cell>
    );
  };

  const siteAllocationCellRenderer = (rowIndex: number) => {
    const match = filteredMatches[rowIndex];
    return (
      <Cell>
        {match?.siteAllocation && match.siteAllocation.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {match.siteAllocation.map((site, index) => (
              <Tag key={index} minimal intent={Intent.SUCCESS} style={{ fontSize: '11px' }}>
                {site}
              </Tag>
            ))}
          </div>
        ) : (
          <span style={{ color: '#666', fontStyle: 'italic' }}>-</span>
        )}
      </Cell>
    );
  };

  const notesCellRenderer = (rowIndex: number) => {
    const match = filteredMatches[rowIndex];
    return (
      <Cell>
        {match?.notes ? (
          <TruncatedFormat>{match.notes}</TruncatedFormat>
        ) : (
          <span style={{ color: '#666', fontStyle: 'italic' }}>-</span>
        )}
      </Cell>
    );
  };

  const selectionCellRenderer = (rowIndex: number) => {
    const match = filteredMatches[rowIndex];
    return (
      <Cell>
        <Checkbox
          checked={selectedMatches.has(match?.id || '')}
          onChange={(e) => handleMatchSelection(match?.id || '', e.currentTarget.checked)}
        />
      </Cell>
    );
  };

  const columns = [
    <Column key="selection" name="Select" cellRenderer={selectionCellRenderer} />,
    <Column key="priority" name="Priority" cellRenderer={priorityCellRenderer} />,
    <Column key="scc" name="SCC" cellRenderer={sccCellRenderer} />,
    <Column key="function" name="Function" cellRenderer={functionCellRenderer} />,
    <Column key="orbit" name="Orbit" cellRenderer={orbitCellRenderer} />,
    <Column key="periodicity" name="Periodicity" cellRenderer={periodicityCellRenderer} />,
    <Column key="collectionType" name="Collection Type" cellRenderer={collectionTypeCellRenderer} />,
    <Column key="classification" name="Classification" cellRenderer={classificationCellRenderer} />,
    <Column key="match" name="Match" cellRenderer={matchCellRenderer} />,
    <Column key="matchNotes" name="Match Notes" cellRenderer={matchNotesCellRenderer} />,
    <Column key="siteAllocation" name="Site Allocation" cellRenderer={siteAllocationCellRenderer} />,
    <Column key="notes" name="Notes" cellRenderer={notesCellRenderer} />
  ];

  // Calculate counts for tabs
  const allCount = matches.length;
  const needsReviewCount = matches.filter(m => m.needsReview).length;
  const unmatchedCount = matches.filter(m => m.unmatched).length;

  return (
    <div>
      <H5>Step 3: Review Matches</H5>
      <Divider className="bp4-margin-bottom" />

      {/* Configuration Summary */}
      <Section>
        <SectionCard>
          <H5>Configuration Summary</H5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', fontSize: '14px' }}>
            <div>
              <strong>Tasking Window:</strong><br />
              {data.taskingWindow.startDate} to {data.taskingWindow.endDate}
            </div>
            <div>
              <strong>Parameters:</strong><br />
              Capacity: {data.parameters.hardCapacity}, Duration: {data.parameters.minDuration}min, Elevation: {data.parameters.elevation}°
            </div>
            <div>
              <strong>Data Sources:</strong><br />
              TLE: {data.tleData.source}, Sites: {data.unavailableSites.sites.length} unavailable
            </div>
          </div>
        </SectionCard>
      </Section>

      {isGenerating ? (
        <Card className="bp4-margin-top">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spinner size={50} />
            <H5 className="bp4-margin-top">Generating Matches</H5>
            <ProgressBar intent={Intent.PRIMARY} className="bp4-margin-top" />
            <Text className="bp4-margin-top" style={{ color: '#666' }}>
              Analyzing satellite data and generating collection opportunities...
            </Text>
          </div>
        </Card>
      ) : (
        <Card className="bp4-margin-top">
          {/* Filter Controls */}
          <div style={{ marginBottom: '20px' }}>
            <Tabs 
              id="match-tabs" 
              selectedTabId={activeTab} 
              onChange={(newTabId) => setActiveTab(newTabId as string)}
              large={false}
            >
              <Tab 
                id="all" 
                title={`ALL (${allCount})`} 
                panel={<div />}
              />
              <Tab 
                id="needsReview" 
                title={`NEEDS REVIEW (${needsReviewCount})`} 
                panel={<div />}
              />
              <Tab 
                id="unmatched" 
                title={`UNMATCHED (${unmatchedCount})`} 
                panel={<div />}
              />
            </Tabs>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
              <InputGroup
                placeholder="Search SCCs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={IconNames.SEARCH}
                style={{ width: '300px' }}
              />
              <HTMLSelect
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.currentTarget.value)}
                style={{ width: '150px' }}
              >
                <option value="all">Sites</option>
                <option value="THU">THU</option>
                <option value="FYL">FYL</option>
                <option value="ASC">ASC</option>
                <option value="CLR">CLR</option>
                <option value="HOLT">HOLT</option>
                <option value="PPW">PPW</option>
                <option value="PPE">PPE</option>
              </HTMLSelect>
            </div>
          </div>

          {/* Table Header with Selection Controls */}
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              Showing {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
            </span>
            {filteredMatches.length > 0 && (
              <Button
                small
                minimal
                icon={IconNames.SELECTION}
                text={selectedMatches.size === filteredMatches.length ? 'Deselect All' : 'Select All'}
                onClick={() => handleSelectAll(selectedMatches.size !== filteredMatches.length)}
              />
            )}
          </div>
          
          {/* Data Table */}
          {filteredMatches.length > 0 ? (
            <Table
              numRows={filteredMatches.length}
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
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              fontStyle: 'italic'
            }}>
              {searchQuery || selectedSite !== 'all' 
                ? "No matches found with the current search criteria. Try adjusting your filters."
                : "No matches found with the current parameters. Try adjusting your criteria."
              }
            </div>
          )}
        </Card>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <Button
          text="Cancel"
          onClick={onCancel}
        />
        <Button
          text="Back"
          onClick={onBack}
        />
        <Button
          text="Next"
          intent={Intent.PRIMARY}
          disabled={isGenerating || selectedMatches.size === 0}
          onClick={handleNext}
        />
      </div>

      {selectedMatches.size === 0 && !isGenerating && (
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} className="bp4-margin-top">
          Please select at least one match to continue.
        </Callout>
      )}
    </div>
  );
};

export default Step3ReviewMatches;
