import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card,
  Tag,
  Button,
  ButtonGroup,
  Intent,
  Checkbox,
  Divider,
  Text,
  Collapse,
  Tooltip,
  Colors,
  Elevation,
  H5,
  NonIdealState,
  Callout
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { useWizardSync } from '../../contexts/WizardSyncContext';
import { useEnhancedNavigation } from '../../contexts/EnhancedNavigationContext';
import './UnifiedMatchReview.css';

export interface UnifiedMatch {
  id: string;
  // Common fields
  priority?: number;
  function?: string;
  status: 'approved' | 'rejected' | 'pending' | 'modified';
  selected: boolean;
  notes?: string;
  lastModified?: Date;
  
  // Collection opportunity fields
  sccNumber?: string;
  orbit?: string;
  periodicity?: number;
  collectionType?: string;
  classification?: string;
  match?: 'Optimal' | 'Baseline' | 'No matches';
  matchNotes?: string;
  siteAllocation?: string[];
  needsReview?: boolean;
  unmatched?: boolean;
  
  // Field mapping fields
  sourceField?: string;
  targetField?: string;
  matchScore?: number;
  confidence?: 'high' | 'medium' | 'low';
  matchType?: 'exact' | 'fuzzy' | 'semantic' | 'manual';
  category?: string;
  dataType?: string;
  validationErrors?: string[];
  usage?: 'frequent' | 'occasional' | 'rare';
  sensorType?: 'wideband' | 'narrowband' | 'imagery' | 'signals';
  calculatedCapacity?: number;
}

interface UnifiedMatchReviewProps {
  matches: UnifiedMatch[];
  context: 'wizard' | 'standalone';
  viewMode?: 'cards' | 'table';
  bulkMode?: boolean;
  selectedMatches: Set<string>;
  expandedMatches?: Set<string>;
  onMatchSelection: (matchId: string, selected: boolean) => void;
  onMatchExpand?: (matchId: string) => void;
  onMatchAction?: (matchId: string, action: 'approve' | 'reject' | 'modify') => void;
  onViewDetails?: (match: UnifiedMatch) => void;
  loading?: boolean;
}

/**
 * Unified match review component that adapts UI based on context
 * Ensures consistent terminology and interaction patterns
 */
export const UnifiedMatchReview: React.FC<UnifiedMatchReviewProps> = ({
  matches,
  context,
  viewMode = 'cards',
  bulkMode = false,
  selectedMatches,
  expandedMatches = new Set(),
  onMatchSelection,
  onMatchExpand,
  onMatchAction,
  onViewDetails,
  loading = false
}) => {
  const { translateTerminology, isWizardContext } = useWizardSync();
  const { currentContext } = useEnhancedNavigation();
  
  // Adapt display based on context
  const isCollectionContext = context === 'wizard' || currentContext.domain === 'collectionOpportunity';
  const isFieldMappingContext = !isCollectionContext;
  
  // Helper functions
  const getStatusIntent = (status: string): Intent => {
    switch (status) {
      case 'approved': return Intent.SUCCESS;
      case 'rejected': return Intent.DANGER;
      case 'modified': return Intent.PRIMARY;
      case 'pending': return Intent.WARNING;
      default: return Intent.NONE;
    }
  };
  
  const getConfidenceIntent = (confidence?: string): Intent => {
    switch (confidence) {
      case 'high': return Intent.SUCCESS;
      case 'medium': return Intent.WARNING;
      case 'low': return Intent.DANGER;
      default: return Intent.NONE;
    }
  };
  
  const getMatchIntent = (match?: string): Intent => {
    switch (match) {
      case 'Optimal': return Intent.SUCCESS;
      case 'Baseline': return Intent.WARNING;
      case 'No matches': return Intent.DANGER;
      default: return Intent.NONE;
    }
  };
  
  const getScoreColor = (score?: number) => {
    if (!score) return Colors.GRAY3;
    if (score >= 0.8) return Colors.GREEN1;
    if (score >= 0.6) return Colors.ORANGE1;
    return Colors.RED1;
  };
  
  // Unified Match Card
  const MatchCard: React.FC<{
    match: UnifiedMatch;
    isSelected: boolean;
    isExpanded: boolean;
  }> = ({ match, isSelected, isExpanded }) => {
    // Determine primary display fields based on context
    const primaryLabel = isCollectionContext 
      ? `SCC ${match.sccNumber}`
      : `${match.sourceField} → ${match.targetField}`;
    
    const secondaryLabel = isCollectionContext
      ? `${match.function} | ${match.orbit}`
      : `${match.category || 'Uncategorized'}`;
    
    const matchQuality = match.match || (
      match.confidence === 'high' ? 'Optimal' :
      match.confidence === 'medium' ? 'Baseline' : 'No matches'
    );
    
    const score = match.matchScore || (
      matchQuality === 'Optimal' ? 0.95 :
      matchQuality === 'Baseline' ? 0.75 : 0.45
    );
    
    return (
      <Card
        elevation={isSelected ? Elevation.TWO : Elevation.ONE}
        className={`unified-match-card ${isSelected ? 'selected' : ''} ${match.needsReview ? 'needs-review' : ''}`}
        interactive={false}
      >
        {/* Card Header */}
        <div className="match-card-header">
          <div className="match-card-primary">
            {bulkMode && (
              <Checkbox
                checked={isSelected}
                onChange={(e) => onMatchSelection(match.id, e.currentTarget.checked)}
                aria-label={`Select ${translateTerminology('item', context)} ${primaryLabel}`}
              />
            )}
            
            <div className="match-card-labels">
              <Text className="primary-label" ellipsize>
                {primaryLabel}
              </Text>
              <Text className="secondary-label" ellipsize>
                {secondaryLabel}
              </Text>
            </div>
            
            <div className="match-card-indicators">
              {/* Match Quality */}
              <div className="match-score" style={{ color: getScoreColor(score) }}>
                {(score * 100).toFixed(0)}%
              </div>
              
              {/* Status Tags */}
              {isFieldMappingContext && match.confidence && (
                <Tag intent={getConfidenceIntent(match.confidence)} minimal>
                  {match.confidence}
                </Tag>
              )}
              
              {isCollectionContext && match.match && (
                <Tag intent={getMatchIntent(match.match)} minimal>
                  {match.match}
                </Tag>
              )}
              
              <Tag intent={getStatusIntent(match.status)} minimal>
                {match.status}
              </Tag>
              
              {/* Context-specific tags */}
              {isCollectionContext && match.classification && (
                <Tag 
                  minimal 
                  intent={match.classification.includes('REL') ? Intent.WARNING : Intent.DANGER}
                >
                  {match.classification}
                </Tag>
              )}
              
              {isFieldMappingContext && match.matchType && (
                <Tag minimal className="match-type-tag">
                  {match.matchType}
                </Tag>
              )}
            </div>
          </div>
          
          <div className="match-card-actions">
            {match.status === 'pending' && onMatchAction && (
              <ButtonGroup>
                <Tooltip content={`${translateTerminology('approve', context)} this ${translateTerminology('item', context)}`}>
                  <Button
                    icon={IconNames.TICK}
                    intent={Intent.SUCCESS}
                    minimal
                    small
                    onClick={() => onMatchAction(match.id, 'approve')}
                    aria-label={`Approve ${primaryLabel}`}
                  />
                </Tooltip>
                <Tooltip content={`Reject this ${translateTerminology('item', context)}`}>
                  <Button
                    icon={IconNames.CROSS}
                    intent={Intent.DANGER}
                    minimal
                    small
                    onClick={() => onMatchAction(match.id, 'reject')}
                    aria-label={`Reject ${primaryLabel}`}
                  />
                </Tooltip>
              </ButtonGroup>
            )}
            
            {onMatchExpand && (
              <Button
                minimal
                small
                icon={isExpanded ? IconNames.CHEVRON_UP : IconNames.CHEVRON_DOWN}
                onClick={() => onMatchExpand(match.id)}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details`}
                aria-expanded={isExpanded}
              />
            )}
            
            {onViewDetails && (
              <Button
                minimal
                small
                icon={IconNames.MORE}
                onClick={() => onViewDetails(match)}
                aria-label={`View full details for ${primaryLabel}`}
              />
            )}
          </div>
        </div>
        
        {/* Expandable Details */}
        {onMatchExpand && (
          <Collapse isOpen={isExpanded}>
            <Divider className="match-card-divider" />
            <div className="match-card-details">
              {/* Collection Opportunity Details */}
              {isCollectionContext && (
                <div className="detail-grid">
                  {match.priority !== undefined && (
                    <div className="detail-item">
                      <Text className="detail-label">Priority</Text>
                      <Text className="detail-value">
                        {match.priority}
                        {match.priority <= 10 && (
                          <span 
                            className="bp5-icon bp5-intent-warning"
                            data-icon={IconNames.WARNING_SIGN}
                            style={{ marginLeft: '4px', fontSize: 12 }}
                          />
                        )}
                      </Text>
                    </div>
                  )}
                  
                  {match.periodicity !== undefined && (
                    <div className="detail-item">
                      <Text className="detail-label">Periodicity</Text>
                      <Text className="detail-value">{match.periodicity} hours</Text>
                    </div>
                  )}
                  
                  {match.collectionType && (
                    <div className="detail-item">
                      <Text className="detail-label">Collection Type</Text>
                      <Text className="detail-value">{match.collectionType}</Text>
                    </div>
                  )}
                  
                  {match.siteAllocation && match.siteAllocation.length > 0 && (
                    <div className="detail-item detail-full-width">
                      <Text className="detail-label">Site Allocation</Text>
                      <div className="site-allocation">
                        {match.siteAllocation.map((site, idx) => (
                          <Tag key={idx} minimal intent={Intent.SUCCESS}>
                            {site}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Field Mapping Details */}
              {isFieldMappingContext && (
                <div className="detail-grid">
                  {match.dataType && (
                    <div className="detail-item">
                      <Text className="detail-label">Data Type</Text>
                      <Text className="detail-value">{match.dataType}</Text>
                    </div>
                  )}
                  
                  {match.sensorType && (
                    <div className="detail-item">
                      <Text className="detail-label">Sensor Type</Text>
                      <Text className="detail-value capitalize">{match.sensorType}</Text>
                    </div>
                  )}
                  
                  {match.calculatedCapacity !== undefined && (
                    <div className="detail-item">
                      <Text className="detail-label">Calculated Capacity</Text>
                      <div className="capacity-display">
                        <Text className="capacity-value">{match.calculatedCapacity}</Text>
                        {match.sensorType && (
                          <Tag minimal intent={Intent.PRIMARY}>
                            {match.sensorType === 'wideband' || match.sensorType === 'narrowband' 
                              ? 'channels' : 'collections'}
                          </Tag>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {match.usage && (
                    <div className="detail-item">
                      <Text className="detail-label">Usage Frequency</Text>
                      <Text className="detail-value capitalize">{match.usage}</Text>
                    </div>
                  )}
                </div>
              )}
              
              {/* Common Details */}
              {match.notes && (
                <div className="detail-item detail-full-width">
                  <Text className="detail-label">Notes</Text>
                  <Text className="detail-value">{match.notes}</Text>
                </div>
              )}
              
              {match.validationErrors && match.validationErrors.length > 0 && (
                <div className="detail-item detail-full-width">
                  <Text className="detail-label error-label">Validation Issues</Text>
                  <div className="validation-errors">
                    {match.validationErrors.map((error, idx) => (
                      <Tag key={idx} intent={Intent.WARNING} minimal>
                        {error}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Collapse>
        )}
      </Card>
    );
  };
  
  if (loading) {
    return (
      <div className="unified-match-loading">
        <NonIdealState
          icon={IconNames.SATELLITE}
          title="Loading Matches"
          description={`Analyzing ${translateTerminology('item', context)} data...`}
        />
      </div>
    );
  }
  
  if (matches.length === 0) {
    return (
      <NonIdealState
        icon={IconNames.SEARCH}
        title={`No ${translateTerminology('item', context)}s found`}
        description={`No ${translateTerminology('item', context)}s available with current criteria.`}
      />
    );
  }
  
  // Render match cards
  return (
    <div className="unified-match-review">
      {viewMode === 'cards' && (
        <div className="match-cards-container" role="list" aria-label={`${translateTerminology('item', context)} results`}>
          {matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              isSelected={selectedMatches.has(match.id)}
              isExpanded={expandedMatches.has(match.id)}
            />
          ))}
        </div>
      )}
      
      {/* Table view would go here if needed */}
    </div>
  );
};

// Summary statistics component
export const UnifiedMatchSummary: React.FC<{
  matches: UnifiedMatch[];
  context: 'wizard' | 'standalone';
}> = ({ matches, context }) => {
  const { translateTerminology } = useWizardSync();
  
  const stats = useMemo(() => {
    const approved = matches.filter(m => m.status === 'approved').length;
    const pending = matches.filter(m => m.status === 'pending').length;
    const rejected = matches.filter(m => m.status === 'rejected').length;
    const modified = matches.filter(m => m.status === 'modified').length;
    const needsReview = matches.filter(m => m.needsReview).length;
    
    return { approved, pending, rejected, modified, needsReview, total: matches.length };
  }, [matches]);
  
  return (
    <div className="unified-match-summary">
      <div className="summary-stats">
        <Callout intent={Intent.SUCCESS} icon={IconNames.TICK} className="stat-callout">
          <H5>{stats.approved}</H5>
          <Text>Approved</Text>
        </Callout>
        
        <Callout intent={Intent.WARNING} icon={IconNames.TIME} className="stat-callout">
          <H5>{stats.pending}</H5>
          <Text>Pending Review</Text>
        </Callout>
        
        <Callout intent={Intent.DANGER} icon={IconNames.CROSS} className="stat-callout">
          <H5>{stats.rejected}</H5>
          <Text>Rejected</Text>
        </Callout>
        
        {stats.modified > 0 && (
          <Callout intent={Intent.PRIMARY} icon={IconNames.EDIT} className="stat-callout">
            <H5>{stats.modified}</H5>
            <Text>Modified</Text>
          </Callout>
        )}
      </div>
      
      {stats.needsReview > 0 && (
        <Callout 
          intent={Intent.WARNING} 
          icon={IconNames.WARNING_SIGN}
          className="review-alert"
        >
          {stats.needsReview} {translateTerminology('item', context)}{stats.needsReview !== 1 ? 's' : ''} need{stats.needsReview === 1 ? 's' : ''} review
        </Callout>
      )}
    </div>
  );
};