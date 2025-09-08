import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Spinner,
  NonIdealState,
  Alert,
  OverlayToaster,
  Position
} from '@blueprintjs/core';
import { Cell, Column, Table, TruncatedFormat, JSONFormat } from '@blueprintjs/table';
import { IconNames } from '@blueprintjs/icons';
import { useBackgroundProcessing } from '../../hooks/useBackgroundProcessing';
import { NAVIGATION_LABELS } from '../../constants/navigation';

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

const Step3SelectOpportunities: React.FC<Step3ReviewMatchesProps> = ({ 
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
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('Initializing...');
  const [showInterruptionAlert, setShowInterruptionAlert] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  
  // Refs for cleanup
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [toaster] = useState(() => OverlayToaster.create({ position: Position.TOP }));
  const { isProcessing } = useBackgroundProcessing();

  // Enhanced loading simulation with progress tracking
  const simulateLoading = useCallback(async () => {
    setProgress(0);
    setLoadingStep('Initializing analysis engine...');
    
    // Simulate progress updates
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        
        // Update loading step based on progress
        if (newProgress < 25) {
          setLoadingStep('Loading satellite data...');
        } else if (newProgress < 50) {
          setLoadingStep('Analyzing orbital parameters...');
        } else if (newProgress < 75) {
          setLoadingStep('Calculating collection opportunities...');
        } else if (newProgress < 90) {
          setLoadingStep('Generating match results...');
        } else {
          setLoadingStep('Finalizing results...');
        }
        
        return Math.min(newProgress, 100);
      });
    }, 200);

    // Complete loading after 3 seconds
    loadingTimeoutRef.current = setTimeout(async () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setMatches(sampleMatches);
      setSelectedMatches(new Set(sampleMatches.filter(m => m.selected).map(m => m.id)));
      setIsGenerating(false);
      setProgress(100);
      setLoadingStep('Complete');
      
      // Show success notification
      const toasterInstance = await toaster;
      toasterInstance.show({
        message: "Matches generated successfully!",
        intent: Intent.SUCCESS,
        icon: IconNames.TICK_CIRCLE
      });
    }, 3000);
  }, [toaster]);

  // Cleanup function for loading state
  const cleanupLoading = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Handle interruption
  const handleInterruption = useCallback(() => {
    if (isGenerating) {
      setIsInterrupted(true);
      setShowInterruptionAlert(true);
      cleanupLoading();
    }
  }, [isGenerating, cleanupLoading]);

  // Resume loading after interruption
  const handleResumeLoading = useCallback(() => {
    setIsInterrupted(false);
    setShowInterruptionAlert(false);
    setIsGenerating(true);
    simulateLoading();
  }, [simulateLoading]);

  // Handle background processing completion
  useEffect(() => {
    if (isProcessing) {
      // In a real implementation, this would check for completed background processing
      // For now, we'll just simulate the completion
      const checkCompletion = setTimeout(() => {
        setMatches(sampleMatches);
        setSelectedMatches(new Set(sampleMatches.filter(m => m.selected).map(m => m.id)));
        setIsGenerating(false);
        setProgress(100);
        setLoadingStep('Complete');
        
        // Show completion notification
        toaster.then(toasterInstance => {
          toasterInstance.show({
            message: "Background processing completed! Matches are ready for review.",
            intent: Intent.SUCCESS,
            icon: IconNames.TICK_CIRCLE
          });
        });
      }, 5000); // Simulate 5 second delay
      
      return () => clearTimeout(checkCompletion);
    }
  }, [isProcessing, toaster]);

  // Cancel loading after interruption
  const handleCancelLoading = useCallback(() => {
    setIsInterrupted(false);
    setShowInterruptionAlert(false);
    setIsGenerating(false);
    setProgress(0);
    setLoadingStep('');
  }, []);

  useEffect(() => {
    simulateLoading();
    
    // Cleanup on unmount
    return () => {
      cleanupLoading();
    };
  }, [simulateLoading, cleanupLoading]);

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

  const handleBack = () => {
    // Save current state before going back
    const selectedMatchesData = matches.filter(match => selectedMatches.has(match.id));
    onUpdate({ matches: selectedMatchesData });
    onBack();
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
    <div data-testid="step3-container">
      <h3 id="step-heading" data-testid="step3-heading">Step 3: {NAVIGATION_LABELS.WIZARD_STEP_3}</h3>
      <Divider className="bp4-margin-bottom" data-testid="step3-divider" />

      {/* Configuration Summary */}
      <Section data-testid="configuration-summary-section">
        <SectionCard data-testid="configuration-summary-card">
          <h4 data-testid="configuration-summary-heading">Configuration Summary</h4>
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
        <Card className="bp4-margin-top" data-testid="match-generation-card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spinner 
              size={50} 
              aria-label="Loading collection opportunities..."
              data-testid="loading-spinner"
            />
            <h4 className="bp4-margin-top">Finding Collection Opportunities</h4>
            <Text className="bp4-margin-top" style={{ color: '#666', marginBottom: '20px' }}>
              {loadingStep}
            </Text>
            <ProgressBar 
              intent={Intent.PRIMARY} 
              className="bp4-margin-top"
              data-testid="loading-progress"
              value={progress / 100}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            />
            <Text className="bp4-margin-top" style={{ color: '#666' }}>
              Analyzing satellite passes and identifying collection opportunities...
            </Text>
            <Text className="bp4-margin-top" style={{ color: '#888', fontSize: '14px' }}>
              Estimated time remaining: {Math.max(0, Math.ceil((100 - progress) / 15))} seconds
            </Text>
            
            {/* Interruption Controls */}
            <div className="bp4-margin-top">
              <Button
                minimal
                icon={IconNames.PAUSE}
                text="Pause"
                onClick={handleInterruption}
                intent={Intent.WARNING}
              />
            </div>
            
            <div aria-live="polite" style={{ position: 'absolute', left: '-9999px' }}>
              Loading collection opportunities: {loadingStep} - {Math.round(progress)}% complete
            </div>
          </div>
        </Card>
      ) : isInterrupted ? (
        <Card className="bp4-margin-top" data-testid="match-generation-paused-card">
          <NonIdealState
            icon={IconNames.PAUSE}
            title="Analysis Paused"
            description="The match generation process was interrupted. You can resume or cancel the operation."
            data-testid="analysis-paused-state"
            action={
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }} data-testid="pause-resume-controls">
                <Button
                  intent={Intent.PRIMARY}
                  icon={IconNames.PLAY}
                  text="Resume Analysis"
                  onClick={handleResumeLoading}
                  data-testid="resume-analysis-button"
                />
                <Button
                  intent={Intent.DANGER}
                  icon={IconNames.CROSS}
                  text="Cancel Analysis"
                  onClick={handleCancelLoading}
                  data-testid="cancel-analysis-button"
                />
              </div>
            }
          />
        </Card>
      ) : (
        <Card className="bp4-margin-top" data-testid="matches-results-card">
          {/* Filter Controls */}
          <div style={{ marginBottom: '20px' }} data-testid="match-filter-controls">
            <Tabs 
              id="match-tabs" 
              selectedTabId={activeTab} 
              onChange={(newTabId) => setActiveTab(newTabId as string)}
              large={false}
              data-testid="match-filter-tabs"
            >
              <Tab 
                id="all" 
                title={`ALL (${allCount})`} 
                panel={<div />}
                data-testid="all-matches-tab"
              />
              <Tab 
                id="needsReview" 
                title={`NEEDS REVIEW (${needsReviewCount})`} 
                panel={<div />}
                data-testid="needs-review-tab"
              />
              <Tab 
                id="unmatched" 
                title={`UNMATCHED (${unmatchedCount})`} 
                panel={<div />}
                data-testid="unmatched-tab"
              />
            </Tabs>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
              <InputGroup
                placeholder="Search SCCs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={IconNames.SEARCH}
                aria-label="Search satellite catalog numbers"
                data-testid="search-sccs-input"
                style={{ width: '300px' }}
              />
              <HTMLSelect
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.currentTarget.value)}
                aria-label="Filter by collection site"
                data-testid="site-filter-select"
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
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-testid="table-header-controls">
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
                data-testid="select-all-matches-button"
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
              data-testid="matches-data-table"
            >
              {columns}
            </Table>
          ) : (
            <NonIdealState
              icon={IconNames.SEARCH}
              title="No Matches Found"
              description={
                searchQuery || selectedSite !== 'all' 
                  ? "No matches found with the current search criteria. Try adjusting your filters."
                  : "No matches found with the current parameters. Try adjusting your criteria."
              }
              data-testid="no-matches-found-state"
              action={
                <Button
                  intent={Intent.PRIMARY}
                  icon={IconNames.ARROW_LEFT}
                  text="Go Back"
                  onClick={handleBack}
                  data-testid="no-matches-go-back-button"
                />
              }
            />
          )}
        </Card>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }} data-testid="step3-navigation-buttons">
        <Button
          text="Cancel"
          onClick={onCancel}
          disabled={isGenerating}
          data-testid="step3-cancel-button"
        />
        <Button
          text="Back"
          onClick={handleBack}
          disabled={isGenerating}
          data-testid="step3-back-button"
        />
        <Button
          text="Next"
          intent={Intent.PRIMARY}
          disabled={isGenerating || selectedMatches.size === 0}
          onClick={handleNext}
          data-testid="step3-next-button"
        />
      </div>

      {selectedMatches.size === 0 && !isGenerating && !isInterrupted && (
        <Callout intent={Intent.WARNING} icon={IconNames.WARNING_SIGN} className="bp4-margin-top" data-testid="no-matches-selected-warning">
          Please select at least one match to continue.
        </Callout>
      )}

      {/* Interruption Alert */}
      <Alert
        isOpen={showInterruptionAlert}
        onClose={() => setShowInterruptionAlert(false)}
        onConfirm={handleResumeLoading}
        onCancel={handleCancelLoading}
        intent={Intent.WARNING}
        icon={IconNames.WARNING_SIGN}
        cancelButtonText="Cancel Analysis"
        confirmButtonText="Resume Analysis"
      >
        <p>
          The match generation process has been paused. Would you like to resume the analysis or cancel it entirely?
        </p>
        <p>
          <strong>Note:</strong> Canceling will lose all progress and you'll need to start over from Step 2.
        </p>
      </Alert>
    </div>
  );
};

export default Step3SelectOpportunities;
