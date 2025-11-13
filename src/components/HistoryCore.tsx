import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocalization } from '../hooks/useLocalization';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';
import { realTimeUpdatesService, StatusUpdateNotification } from '../services/realTimeUpdatesService';
import { useBackgroundProcessing } from '../contexts/BackgroundProcessingContext';
import {
  Card,
  FormGroup,
  H3,
  H5,
  Divider,
  ControlGroup,
  Intent,
  Callout,
  NonIdealState,
  Classes,
  Colors,
  Elevation,
  Spinner,
  Tag,
  Button,
  InputGroup,
  HTMLSelect,
  Collapse,
  ProgressBar,
  Overlay,
  Menu,
  MenuItem,
  Popover,
  Position,
  Tooltip
} from '@blueprintjs/core';
import { DateInput } from '@blueprintjs/datetime';
import { IconNames } from '@blueprintjs/icons';
import HistoryTable from './HistoryTable';
import CollectionDetailPanel from './CollectionDetailPanel';
import ContextualHelp from './ContextualHelp';
import PredictiveProgress, { ProcessingJob } from './PredictiveProgress';
import { useUrlState } from '../hooks/useUrlState';

export interface HistoryCoreProps {
  embeddedMode?: boolean;
  autoSelectId?: string;
  newDeckId?: string;
  onWizardNext?: () => void;
  onWizardBack?: () => void;
  onWizardExit?: () => void;
}

const HistoryCore: React.FC<HistoryCoreProps> = ({
  embeddedMode = false,
  autoSelectId,
  newDeckId,
  onWizardNext,
  onWizardBack,
  onWizardExit
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocalization();
  const { jobs } = useBackgroundProcessing();
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState<string>('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(autoSelectId || null);

  // URL state preservation for filters (only in standalone mode)
  const [urlFilters, setUrlFilters] = useUrlState({
    search: '',
    status: 'all'
  });
  const searchQuery = urlFilters.search;
  const statusFilter = urlFilters.status;
  const setSearchQuery = (value: string) => setUrlFilters({ ...urlFilters, search: value });
  const setStatusFilter = (value: string) => setUrlFilters({ ...urlFilters, status: value });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [realTimeStatus, setRealTimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [liveUpdateCount, setLiveUpdateCount] = useState(0);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);

  // Extract navigation state from deck creation flow
  const navigationState = location.state as { newDeckId?: string; fromCreation?: boolean; deckName?: string } | null;

  // Calculate matching status metrics with AlgorithmStatus granularity
  const matchingMetrics = useMemo(() => {
    // Group statuses for intuitive user understanding
    const waiting = jobs.filter(j => j.algorithmStatus === 'queued').length;
    const processing = jobs.filter(j =>
      j.algorithmStatus === 'running' || j.algorithmStatus === 'optimizing'
    ).length;
    const completed = jobs.filter(j => j.algorithmStatus === 'converged').length;
    const needsAttention = jobs.filter(j =>
      j.algorithmStatus === 'error' || j.algorithmStatus === 'timeout'
    ).length;

    return {
      waiting,
      processing,
      completed,
      needsAttention,
      // Detailed breakdown for tooltips and advanced views
      detailed: {
        queued: jobs.filter(j => j.algorithmStatus === 'queued').length,
        running: jobs.filter(j => j.algorithmStatus === 'running').length,
        optimizing: jobs.filter(j => j.algorithmStatus === 'optimizing').length,
        converged: jobs.filter(j => j.algorithmStatus === 'converged').length,
        error: jobs.filter(j => j.algorithmStatus === 'error').length,
        timeout: jobs.filter(j => j.algorithmStatus === 'timeout').length
      }
    };
  }, [jobs]);

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setUrlFilters({ search: '', status: 'all' });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  const handleSelectionChange = (selectedIndices: number[]) => {
    setSelectedCollections(selectedIndices);
  };

  const toggleBulkActionMode = () => {
    setBulkActionMode(!bulkActionMode);
    if (bulkActionMode) {
      setSelectedCollections([]);
    }
  };

  const handleBulkDownload = () => {
    console.log('Bulk downloading collections:', selectedCollections);
    // Implementation for bulk download
  };

  const handleBulkDelete = () => {
    console.log('Bulk deleting collections:', selectedCollections);
    // Implementation for bulk delete with confirmation
  };

  // WebSocket message handler
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('📡 Received real-time update:', message);
    realTimeUpdatesService.processMessage(message);
    setLiveUpdateCount(prev => prev + 1);

    // Update processing jobs for predictive progress
    if (message.type === 'progress_update' && message.collectionId) {
      setProcessingJobs(prev => {
        const existing = prev.find(job => job.id === message.collectionId);
        if (existing) {
          return prev.map(job =>
            job.id === message.collectionId
              ? { ...job, progress: message.progress || 0 }
              : job
          );
        } else {
          // Add new processing job
          return [...prev, {
            id: message.collectionId!,
            name: `Collection ${message.collectionId}`,
            status: 'processing' as const,
            progress: message.progress || 0,
            startTime: new Date(),
            currentPhase: 'processing'
          }];
        }
      });
    }
  };

  // WebSocket connection handlers
  const handleWebSocketConnect = () => {
    console.log('🔗 WebSocket connected - real-time updates active');
    setRealTimeStatus('connected');
  };

  const handleWebSocketDisconnect = () => {
    console.log('🔌 WebSocket disconnected');
    setRealTimeStatus('disconnected');
  };

  const handleWebSocketError = (error: Event) => {
    console.error('❌ WebSocket error:', error);
    setRealTimeStatus('disconnected');
  };

  // Initialize WebSocket connection (only in standalone mode)
  const { isConnected, isConnecting, error: wsError } = useWebSocket({
    url: process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws',
    onMessage: handleWebSocketMessage,
    onConnect: handleWebSocketConnect,
    onDisconnect: handleWebSocketDisconnect,
    onError: handleWebSocketError,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    enabled: !embeddedMode // Disable WebSocket in embedded mode
  });

  const handleExport = (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    console.log(`Exporting results as ${format}`);
    // Simulate export process
    const exportData = {
      format,
      timestamp: new Date().toISOString(),
      totalResults: selectedCollections.length || 'all',
      filters: {
        search: searchQuery,
        status: statusFilter,
        dateRange: startDate && endDate ? `${startDate} to ${endDate}` : null
      }
    };

    // Simulate download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collection-results-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMenu = (
    <Menu>
      <MenuItem
        icon={IconNames.TH}
        text="Download CSV"
        onClick={() => handleExport('csv')}
      />
      <MenuItem
        icon={IconNames.GRID_VIEW}
        text="Download Excel"
        onClick={() => handleExport('excel')}
      />
      <MenuItem
        icon={IconNames.DOCUMENT}
        text="Download PDF"
        onClick={() => handleExport('pdf')}
      />
      <MenuItem
        icon={IconNames.CODE}
        text="Download JSON"
        onClick={() => handleExport('json')}
      />
    </Menu>
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshProgress(0);
    setRefreshStatus('Connecting to server...');

    try {
      // Simulate progressive loading with status updates
      const steps = [
        { progress: 20, status: 'Fetching your latest collections...' },
        { progress: 50, status: 'Updating collection statuses...' },
        { progress: 75, status: 'Checking for new results...' },
        { progress: 90, status: 'Almost ready...' },
        { progress: 100, status: 'All set!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setRefreshProgress(step.progress);
        setRefreshStatus(step.status);
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      setRefreshStatus('Unable to refresh. Please try again.');
    } finally {
      setIsRefreshing(false);
      setRefreshProgress(0);
      setRefreshStatus('');
    }
  };

  // Determine contextual help context based on current state
  const getHelpContext = (): 'first-visit' | 'empty-state' | 'filtered-view' | 'bulk-mode' | 'processing' | 'error-state' => {
    if (!hasSeenWelcome) return 'first-visit';
    if (bulkActionMode) return 'bulk-mode';
    if (processingJobs.length > 0) return 'processing';
    if (searchQuery || statusFilter !== 'all' || startDate || endDate) return 'filtered-view';
    return 'empty-state';
  };

  // Initialize some demo processing jobs and check welcome status
  React.useEffect(() => {
    const welcomed = localStorage.getItem('history-page-welcomed');
    setHasSeenWelcome(!!welcomed);

    // Add some demo processing jobs
    const demoJobs: ProcessingJob[] = [
      {
        id: 'collection-1',
        name: 'Q4 Sales Analysis Collection',
        status: 'processing',
        progress: 65,
        startTime: new Date(Date.now() - 120000), // Started 2 minutes ago
        currentPhase: 'optimization'
      },
      {
        id: 'collection-2',
        name: 'Customer Feedback Analysis',
        status: 'queued',
        progress: 0,
        startTime: new Date()
      }
    ];

    setProcessingJobs(demoJobs);
  }, []);

  // Keyboard navigation support
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedCollectionId) return;

      const selectedJob = jobs.find(job => job.id === selectedCollectionId);
      if (!selectedJob) return;

      // Check if user is typing in an input field
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          // View collection
          navigate(`/decks/${selectedCollectionId}`);
          break;
        case 'd':
          // Download collection
          console.log('Download collection:', selectedCollectionId);
          break;
        case 'escape':
          // Deselect collection
          setSelectedCollectionId(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCollectionId, jobs, navigate]);

  const handleWelcomeDismiss = () => {
    setHasSeenWelcome(true);
    localStorage.setItem('history-page-welcomed', 'true');
  };

  const handleStatusFilterClick = (status: string) => {
    setStatusFilter(status);
    if (!showAdvancedFilters) {
      // Briefly show advanced filters to indicate the filter was applied
      setShowAdvancedFilters(true);
      setTimeout(() => setShowAdvancedFilters(false), 2000);
    }
  };

  return (
    <div className={`history-content ${embeddedMode ? 'embedded' : ''}`} style={{
      padding: embeddedMode ? '0 24px 24px' : '24px',
      backgroundColor: Colors.LIGHT_GRAY5,
      minHeight: embeddedMode ? 'auto' : 'calc(100vh - 50px)',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>

      {/* Page Header with Primary Action */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <H3 className={Classes.HEADING} style={{
            marginBottom: '8px',
            color: Colors.DARK_GRAY1,
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Your Collections
          </H3>
          <p className={Classes.TEXT_MUTED} style={{
            margin: 0,
            fontSize: '16px',
            lineHeight: '1.5',
            color: Colors.GRAY1
          }}>
            Track progress and access your data collection results
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexShrink: 0,
          flexWrap: 'wrap'
        }}>
          {!embeddedMode && (
            <Button
              icon={IconNames.PLUS}
              text="New Collection"
              intent={Intent.PRIMARY}
              large
              onClick={() => navigate('/create-collection-deck/data')}
              style={{ minWidth: '160px' }}
            />
          )}
          <Popover
            content={exportMenu}
            position={Position.BOTTOM_RIGHT}
            minimal
          >
            <Button
              icon={IconNames.DOWNLOAD}
              text="Export Results"
              intent={Intent.SUCCESS}
              rightIcon={IconNames.CARET_DOWN}
              style={{ minWidth: '140px' }}
            />
          </Popover>
          <Button
            icon={bulkActionMode ? IconNames.CROSS : IconNames.SELECTION}
            text={bulkActionMode ? 'Cancel Selection' : 'Select Multiple'}
            onClick={toggleBulkActionMode}
            style={{ minWidth: '140px' }}
          />
        </div>
      </div>

      {/* Contextual Help */}
      {!embeddedMode && (
        <ContextualHelp
          context={getHelpContext()}
          onDismiss={handleWelcomeDismiss}
        />
      )}

      {/* Predictive Progress Indicators */}
      {processingJobs.length > 0 && (
        <PredictiveProgress jobs={processingJobs} />
      )}

      {/* Status Overview - Enhanced Visual Design */}
      <Card
        elevation={Elevation.TWO}
        className="bp6-margin-bottom"
        style={{
          backgroundColor: Colors.WHITE,
          border: `1px solid ${Colors.LIGHT_GRAY3}`,
          marginBottom: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '0 4px'
        }}>
          <H5 className={Classes.HEADING} style={{
            margin: 0,
            color: Colors.DARK_GRAY1,
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Matching Status
          </H5>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Real-time Status Indicator */}
            {!embeddedMode && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '12px',
                backgroundColor: isConnected ? Colors.GREEN5 : isConnecting ? Colors.ORANGE5 : Colors.RED5,
                border: `1px solid ${isConnected ? Colors.GREEN3 : isConnecting ? Colors.ORANGE3 : Colors.RED3}`
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? Colors.GREEN2 : isConnecting ? Colors.ORANGE2 : Colors.RED2,
                  animation: isConnecting ? 'pulse 1.5s infinite' : 'none'
                }} />
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: isConnected ? Colors.GREEN1 : isConnecting ? Colors.ORANGE1 : Colors.RED1
                }}>
                  {isConnected ? 'Live' : isConnecting ? 'Connecting...' : 'Offline'}
                </span>
                {isConnected && liveUpdateCount > 0 && (
                  <span style={{
                    fontSize: '10px',
                    color: Colors.GREEN2,
                    fontStyle: 'italic'
                  }}>
                    ({liveUpdateCount} new)
                  </span>
                )}
              </div>
            )}

            <Button
              icon={isRefreshing ? undefined : IconNames.REFRESH}
              text={isRefreshing ? "Updating..." : "Refresh"}
              intent={Intent.PRIMARY}
              onClick={handleRefresh}
              disabled={isRefreshing}
              loading={isRefreshing}
              style={{
                minWidth: '140px',
                fontWeight: '600',
                boxShadow: isRefreshing ? 'none' : '0 2px 8px rgba(41, 101, 204, 0.2)'
              }}
            />

            {isRefreshing && refreshStatus && (
              <div style={{
                fontSize: '12px',
                color: Colors.GRAY2,
                fontStyle: 'italic',
                maxWidth: '200px'
              }}>
                {refreshStatus}
              </div>
            )}
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}>
          {/* Waiting (Queued) */}
          <Callout
            intent={Intent.NONE}
            icon={IconNames.TIME}
            style={{
              margin: 0,
              borderRadius: '6px',
              border: `1px solid ${Colors.GRAY3}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleStatusFilterClick('queued')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
              e.currentTarget.style.borderColor = Colors.GRAY1;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = Colors.GRAY3;
            }}
          >
            <Tooltip content={`${matchingMetrics.detailed.queued} queued`}>
              <div>
                <div style={{
                  fontSize: '38px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: Colors.GRAY1,
                  lineHeight: '1',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {matchingMetrics.waiting}
                </div>
                <div style={{
                  fontSize: '16px',
                  color: Colors.DARK_GRAY1,
                  marginBottom: '4px',
                  fontWeight: '600'
                }}>
                  Waiting
                </div>
                <div style={{
                  fontSize: '14px',
                  color: Colors.GRAY1,
                  lineHeight: '1.4'
                }}>
                  Starting soon
                </div>
                <div style={{
                  fontSize: '13px',
                  color: Colors.GRAY2,
                  marginTop: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  View all →
                </div>
              </div>
            </Tooltip>
          </Callout>

          {/* Processing (Running + Optimizing) */}
          <Callout
            intent={Intent.PRIMARY}
            icon={IconNames.PLAY}
            style={{
              margin: 0,
              borderRadius: '6px',
              border: `1px solid ${Colors.BLUE3}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleStatusFilterClick('processing')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
              e.currentTarget.style.borderColor = Colors.BLUE2;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = Colors.BLUE3;
            }}
          >
            <Tooltip content={`${matchingMetrics.detailed.running} running, ${matchingMetrics.detailed.optimizing} optimizing`}>
              <div>
                <div style={{
                  fontSize: '38px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: Colors.BLUE1,
                  lineHeight: '1',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {matchingMetrics.processing}
                </div>
                <div style={{
                  fontSize: '16px',
                  color: Colors.DARK_GRAY1,
                  marginBottom: '4px',
                  fontWeight: '600'
                }}>
                  Processing
                </div>
                <div style={{
                  fontSize: '14px',
                  color: Colors.GRAY1,
                  lineHeight: '1.4'
                }}>
                  Actively running
                </div>
                <div style={{
                  fontSize: '13px',
                  color: Colors.BLUE2,
                  marginTop: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  View all →
                </div>
              </div>
            </Tooltip>
          </Callout>

          {/* Completed (Converged) */}
          <Callout
            intent={Intent.SUCCESS}
            icon={IconNames.TICK_CIRCLE}
            style={{
              margin: 0,
              borderRadius: '6px',
              border: `1px solid ${Colors.GREEN3}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleStatusFilterClick('converged')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
              e.currentTarget.style.borderColor = Colors.GREEN2;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = Colors.GREEN3;
            }}
          >
            <Tooltip content={`${matchingMetrics.detailed.converged} completed`}>
              <div>
                <div style={{
                  fontSize: '38px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: Colors.GREEN1,
                  lineHeight: '1',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {matchingMetrics.completed}
                </div>
                <div style={{
                  fontSize: '16px',
                  color: Colors.DARK_GRAY1,
                  marginBottom: '4px',
                  fontWeight: '600'
                }}>
                  Completed
                </div>
                <div style={{
                  fontSize: '14px',
                  color: Colors.GRAY1,
                  lineHeight: '1.4'
                }}>
                  Ready to view
                </div>
                <div style={{
                  fontSize: '13px',
                  color: Colors.GREEN2,
                  marginTop: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  View all →
                </div>
              </div>
            </Tooltip>
          </Callout>

          {/* Needs Attention (Error + Timeout) */}
          <Callout
            intent={Intent.WARNING}
            icon={IconNames.WARNING_SIGN}
            style={{
              margin: 0,
              borderRadius: '6px',
              border: `1px solid ${Colors.ORANGE3}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleStatusFilterClick('needs-attention')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
              e.currentTarget.style.borderColor = Colors.ORANGE2;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = Colors.ORANGE3;
            }}
          >
            <Tooltip content={`${matchingMetrics.detailed.error} errors, ${matchingMetrics.detailed.timeout} timeouts`}>
              <div>
                <div style={{
                  fontSize: '38px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: Colors.ORANGE1,
                  lineHeight: '1',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {matchingMetrics.needsAttention}
                </div>
                <div style={{
                  fontSize: '16px',
                  color: Colors.DARK_GRAY1,
                  marginBottom: '4px',
                  fontWeight: '600'
                }}>
                  Needs Attention
                </div>
                <div style={{
                  fontSize: '14px',
                  color: Colors.GRAY1,
                  lineHeight: '1.4'
                }}>
                  Review required
                </div>
                <div style={{
                  fontSize: '13px',
                  color: Colors.ORANGE2,
                  marginTop: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  View all →
                </div>
              </div>
            </Tooltip>
          </Callout>
        </div>
      </Card>

      {/* Enhanced Filter Section with Search and Advanced Filters */}
      <Card
        elevation={Elevation.ONE}
        className="bp6-margin-bottom"
        style={{
          backgroundColor: Colors.WHITE,
          marginBottom: '24px',
          borderRadius: '8px',
          border: `1px solid ${Colors.LIGHT_GRAY3}`
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '0 4px'
        }}>
          <H5 className={Classes.HEADING} style={{
            margin: 0,
            color: Colors.DARK_GRAY1,
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Search & Filter
          </H5>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              minimal
              icon={showAdvancedFilters ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
              text="More Filters"
              small
              onClick={toggleAdvancedFilters}
              style={{ minWidth: '100px' }}
            />
            <Button
              minimal
              icon={IconNames.CROSS}
              text="Reset"
              small
              onClick={handleReset}
              disabled={!startDate && !endDate && !searchQuery && statusFilter === 'all'}
              style={{ minWidth: '100px' }}
            />
          </div>
        </div>

        {/* Primary Search Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr auto',
          gap: '16px',
          alignItems: 'end',
          marginBottom: showAdvancedFilters ? '20px' : '0'
        }}>
          <FormGroup
            label="Search Collections"
            labelFor="search-input"
            style={{ margin: 0 }}
          >
            <InputGroup
              id="search-input"
              data-testid="collection-search-input"
              placeholder="Search collections by name..."
              leftIcon={IconNames.SEARCH}
              value={searchQuery}
              onChange={handleSearchChange}
              rightElement={
                searchQuery ? (
                  <Button
                    icon={IconNames.CROSS}
                    minimal
                    small
                    onClick={() => setSearchQuery('')}
                  />
                ) : undefined
              }
            />
          </FormGroup>
          <FormGroup
            label="Show"
            labelFor="status-filter"
            style={{ margin: 0 }}
          >
            <HTMLSelect
              id="status-filter"
              data-testid="status-filter-select"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              fill
              options={[
                { label: 'All Collections', value: 'all' },
                { label: 'Waiting', value: 'queued' },
                { label: 'Processing', value: 'processing' },
                { label: 'Completed', value: 'converged' },
                { label: 'Needs Attention', value: 'needs-attention' }
              ]}
            />
          </FormGroup>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
            <Button
              icon={IconNames.TICK}
              text="Apply"
              intent={Intent.PRIMARY}
              data-testid="apply-filter-button"
              disabled={!startDate && !endDate && !searchQuery && statusFilter === 'all'}
              style={{
                minWidth: '140px',
                fontWeight: '600',
                boxShadow: (!startDate && !endDate && !searchQuery && statusFilter === 'all') ?
                  'none' : '0 2px 8px rgba(41, 101, 204, 0.2)'
              }}
            />
          </div>
        </div>

        {/* Advanced Filters Collapsible Section */}
        <Collapse isOpen={showAdvancedFilters}>
          <Divider style={{ margin: '16px 0' }} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            alignItems: 'end'
          }}>
            <FormGroup
              label={t('history.filters.startDate')}
              labelFor="start-date-input"
              style={{ margin: 0 }}
            >
              <DateInput
                data-testid="start-date-input"
                value={startDate}
                onChange={setStartDate}
                placeholder="From date..."
                fill
                showActionsBar
                maxDate={new Date()}
              />
            </FormGroup>
            <FormGroup
              label={t('history.filters.endDate')}
              labelFor="end-date-input"
              style={{ margin: 0 }}
            >
              <DateInput
                data-testid="end-date-input"
                value={endDate}
                onChange={setEndDate}
                placeholder="To date..."
                fill
                showActionsBar
                maxDate={new Date()}
                minDate={startDate ? new Date(startDate) : undefined}
              />
            </FormGroup>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 0',
              color: Colors.GRAY1,
              fontSize: '14px'
            }}>
              <span style={{ marginRight: '6px' }}>•</span>
              Filter by date range to find collections from specific time periods
            </div>
          </div>
        </Collapse>
      </Card>

      {/* Bulk Actions Toolbar */}
      {bulkActionMode && selectedCollections.length > 0 && (
        <Card
          elevation={Elevation.ONE}
          style={{
            backgroundColor: Colors.BLUE5,
            border: `1px solid ${Colors.BLUE3}`,
            marginBottom: '16px',
            borderRadius: '8px'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <span style={{ color: Colors.BLUE1, fontSize: '16px' }}>✓</span>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: Colors.BLUE1,
                  fontSize: '14px'
                }}>
                  {selectedCollections.length} collection{selectedCollections.length !== 1 ? 's' : ''} selected
                </div>
                <div style={{
                  fontSize: '12px',
                  color: Colors.BLUE2
                }}>
                  Choose what to do with selected collections
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                icon={IconNames.DOWNLOAD}
                text={`Download (${selectedCollections.length})`}
                intent={Intent.SUCCESS}
                small
                onClick={handleBulkDownload}
              />
              <Button
                icon={IconNames.TRASH}
                text={`Delete (${selectedCollections.length})`}
                intent={Intent.DANGER}
                small
                onClick={handleBulkDelete}
              />
              <Button
                icon={IconNames.CROSS}
                minimal
                small
                onClick={() => setSelectedCollections([])}
                title="Clear all selections"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Collection Decks Table - Enhanced Container */}
      <Card
        elevation={Elevation.ONE}
        style={{
          backgroundColor: Colors.WHITE,
          borderRadius: '8px',
          border: `1px solid ${Colors.LIGHT_GRAY3}`
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '0 4px'
        }}>
          <H5 className={Classes.HEADING} style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: Colors.DARK_GRAY1
          }}>
            Collection Library
          </H5>
          <ControlGroup>
            <Button
              minimal
              icon={IconNames.SEARCH}
              text="Search"
              small
              style={{ minWidth: '80px' }}
            />
            <Button
              minimal
              icon={IconNames.SORT}
              text="Sort"
              small
              style={{ minWidth: '80px' }}
            />
          </ControlGroup>
        </div>
        <Divider className="bp6-margin-bottom" style={{ margin: '0 0 16px 0' }} />
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'stretch',
          minHeight: '400px'
        }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <HistoryTable
              startDate={startDate}
              endDate={endDate}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              onClearFilters={handleReset}
              enableBulkActions={bulkActionMode}
              onSelectionChange={handleSelectionChange}
              newDeckId={newDeckId || navigationState?.newDeckId}
              selectedCollectionId={selectedCollectionId}
              onCollectionSelect={setSelectedCollectionId}
              embeddedMode={embeddedMode}
              autoSelectId={autoSelectId}
            />
          </div>
          {selectedCollectionId && (
            <CollectionDetailPanel
              collection={jobs.find(job => job.id === selectedCollectionId) || null}
              onClose={() => setSelectedCollectionId(null)}
            />
          )}
        </div>
      </Card>

      {/* Wizard Navigation (embedded mode only) */}
      {embeddedMode && (
        <Card
          elevation={Elevation.TWO}
          style={{
            marginTop: '24px',
            backgroundColor: Colors.WHITE,
            borderRadius: '8px',
            border: `1px solid ${Colors.LIGHT_GRAY3}`,
            padding: '16px'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Button
              text="View All Collections"
              icon={IconNames.HISTORY}
              onClick={onWizardExit}
              large
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                text="Back"
                icon={IconNames.ARROW_LEFT}
                onClick={onWizardBack}
                large
              />
              <Button
                text="Continue to Management"
                intent={Intent.PRIMARY}
                rightIcon={IconNames.ARROW_RIGHT}
                onClick={onWizardNext}
                disabled={!selectedCollectionId}
                large
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HistoryCore;
