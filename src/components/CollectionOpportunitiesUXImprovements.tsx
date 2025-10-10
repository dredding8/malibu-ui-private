import React, { useState, useEffect } from 'react';
import { 
    Button, 
    Intent, 
    Position, 
    OverlayToaster,
    ToastProps,
    ProgressBar,
    Card,
    Tag
} from '@blueprintjs/core';
import { Icon } from '../utils/blueprintIconWrapper';
import { MatchStatus, Site, HealthAnalysis } from '../types/collectionOpportunities';

/**
 * UX Law Compliance Improvements for Collection Opportunities
 * Addresses Peak-End Rule, Zeigarnik Effect, and other UX improvements
 */

// 1. Peak-End Rule: Success Toast Notifications
const AppToaster = OverlayToaster.createAsync({
    position: Position.TOP_RIGHT,
    maxToasts: 3
});

export const showSuccessToast = async (message: string, count?: number) => {
    const toaster = await AppToaster;
    const toastProps: ToastProps = {
        message: (
            <div className="success-toast-content">
                <Icon icon="tick-circle" size={20} />
                <span>{message}</span>
                {count && count > 1 && (
                    <Tag minimal round intent={Intent.SUCCESS}>
                        {count} items
                    </Tag>
                )}
            </div>
        ),
        intent: Intent.SUCCESS,
        icon: "tick",
        timeout: 5000,
        action: {
            text: "View Details",
            onClick: () => console.log("View details clicked")
        }
    };
    
    toaster.show(toastProps);
};

export const showProgressToast = async (message: string, progress: number) => {
    const toaster = await AppToaster;
    const toastProps: ToastProps = {
        message: (
            <div className="progress-toast-content">
                <span>{message}</span>
                <ProgressBar 
                    value={progress} 
                    intent={Intent.PRIMARY}
                    animate={true}
                    stripes={false}
                    className="toast-progress-bar"
                />
            </div>
        ),
        intent: Intent.PRIMARY,
        timeout: 0 // Keep showing until dismissed
    };
    
    return toaster.show(toastProps);
};

// 2. Zeigarnik Effect: Enhanced Progress Indicators
export const AllocationProgressIndicator: React.FC<{
    total: number;
    allocated: number;
    pending: number;
    needsReview: number;
}> = ({ total, allocated, pending, needsReview }) => {
    const completionPercentage = Math.round((allocated / total) * 100);
    const segments = [
        { value: allocated / total, intent: Intent.SUCCESS, label: 'Allocated' },
        { value: needsReview / total, intent: Intent.WARNING, label: 'Needs Review' },
        { value: pending / total, intent: Intent.DANGER, label: 'Pending' }
    ];

    return (
        <Card className="allocation-progress-card" elevation={1}>
            <div className="progress-header">
                <h4>Overall Allocation Progress</h4>
                <Tag large round intent={completionPercentage === 100 ? Intent.SUCCESS : Intent.PRIMARY}>
                    {completionPercentage}% Complete
                </Tag>
            </div>
            
            <div className="segmented-progress">
                <ProgressBar 
                    value={1} 
                    intent={Intent.NONE}
                    animate={false}
                    stripes={false}
                    className="multi-segment-progress"
                >
                    {segments.map((segment, index) => (
                        <div
                            key={index}
                            className={`progress-segment bp5-intent-${segment.intent}`}
                            style={{ width: `${segment.value * 100}%` }}
                            title={`${segment.label}: ${Math.round(segment.value * 100)}%`}
                        />
                    ))}
                </ProgressBar>
            </div>
            
            <div className="progress-stats">
                <div className="stat">
                    <Icon icon="tick-circle" intent={Intent.SUCCESS} />
                    <span>{allocated} Allocated</span>
                </div>
                <div className="stat">
                    <Icon icon="warning-sign" intent={Intent.WARNING} />
                    <span>{needsReview} Need Review</span>
                </div>
                <div className="stat">
                    <Icon icon="time" intent={Intent.DANGER} />
                    <span>{pending} Pending</span>
                </div>
            </div>
            
            {completionPercentage < 100 && (
                <div className="progress-motivation">
                    <Icon icon="lightbulb" />
                    <span>
                        {pending > 0 
                            ? `${pending} opportunities await allocation`
                            : `${needsReview} opportunities need review`}
                    </span>
                </div>
            )}
        </Card>
    );
};

// 3. Fitts's Law: Improved Click Targets
export const ImprovedActionButtons: React.FC<{
    matchStatus: MatchStatus;
    opportunityId: string;
    opportunityName: string;
    onAction: (action: string) => void;
}> = ({ matchStatus, opportunityId, opportunityName, onAction }) => {
    const getActionConfig = () => {
        switch (matchStatus) {
            case 'suboptimal':
                return {
                    icon: "swap-horizontal" as any,
                    text: "View Alternatives",
                    intent: Intent.PRIMARY,
                    action: 'view-alternatives',
                    ariaLabel: `View alternative allocations for ${opportunityName}`
                };
            case 'unmatched':
                return {
                    icon: "add" as any,
                    text: "Allocate Now",
                    intent: Intent.SUCCESS,
                    action: 'allocate',
                    ariaLabel: `Allocate satellite for ${opportunityName}`
                };
            default:
                return {
                    icon: "edit" as any,
                    text: "Edit Allocation",
                    intent: Intent.NONE,
                    action: 'edit',
                    ariaLabel: `Edit allocation for ${opportunityName}`
                };
        }
    };

    const config = getActionConfig();

    return (
        <Button
            icon={config.icon}
            text={config.text}
            intent={config.intent}
            onClick={() => onAction(config.action)}
            aria-label={config.ariaLabel}
            className="improved-action-button"
            // Improved size for Fitts's Law
            large={true}
            style={{ minWidth: '120px', minHeight: '32px' }}
        />
    );
};

// 4. Doherty Threshold: Loading States with Skeleton
export const OpportunityRowSkeleton: React.FC = () => (
    <div className="opportunity-row-skeleton">
        <div className="skeleton-cell skeleton-priority" />
        <div className="skeleton-cell skeleton-status" />
        <div className="skeleton-cell skeleton-name" />
        <div className="skeleton-cell skeleton-health" />
        <div className="skeleton-cell skeleton-sites" />
        <div className="skeleton-cell skeleton-capacity" />
        <div className="skeleton-cell skeleton-actions" />
    </div>
);

// 5. Miller's Law: Chunked Information Display
export const ChunkedSiteDisplay: React.FC<{
    sites: Site[];
    maxVisible?: number;
}> = ({ sites, maxVisible = 3 }) => {
    const [expanded, setExpanded] = useState(false);
    const visibleSites = expanded ? sites : sites.slice(0, maxVisible);
    const hiddenCount = sites.length - maxVisible;

    return (
        <div className="chunked-site-display">
            <div className="site-tags-container">
                {visibleSites.map(site => (
                    <Tag 
                        key={site.id} 
                        minimal 
                        round 
                        className="site-tag enhanced"
                        interactive
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            console.log('Site clicked:', site.name);
                        }}
                    >
                        <Icon icon="satellite" size={12} />
                        {site.name}
                    </Tag>
                ))}
            </div>
            
            {hiddenCount > 0 && !expanded && (
                <Button
                    minimal
                    small
                    className="expand-sites-button"
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setExpanded(true);
                    }}
                >
                    +{hiddenCount} more
                </Button>
            )}
            
            {expanded && sites.length > maxVisible && (
                <Button
                    minimal
                    small
                    className="collapse-sites-button"
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setExpanded(false);
                    }}
                >
                    Show less
                </Button>
            )}
        </div>
    );
};

// 6. Aesthetic-Usability: Enhanced Visual Feedback
export const EnhancedHealthIndicator: React.FC<{
    health: HealthAnalysis;
}> = ({ health }) => {
    const getHealthConfig = () => {
        const configs = {
            excellent: { icon: "tick-circle", gradient: "linear-gradient(135deg, #0f9960, #15b371)" },
            good: { icon: "tick", gradient: "linear-gradient(135deg, #2b95d6, #4ca1e3)" },
            fair: { icon: "warning-sign", gradient: "linear-gradient(135deg, #f29d49, #ff9f40)" },
            poor: { icon: "error", gradient: "linear-gradient(135deg, #e76a6e, #f55656)" }
        };
        return configs[health.overallHealth] || configs.fair;
    };

    const config = getHealthConfig();

    return (
        <div className="enhanced-health-indicator">
            <div 
                className="health-circle"
                style={{ background: config.gradient }}
            >
                <Icon icon={config.icon as any} color="white" size={16} />
            </div>
            <div className="health-details">
                <div className="health-score">{Math.round(health.score)}%</div>
                <div className="health-metrics">
                    <span title="Coverage">{health.coverage}</span>
                    <span title="Efficiency">{health.efficiency}</span>
                </div>
            </div>
        </div>
    );
};

// 7. CSS for UX improvements
export const UX_IMPROVEMENTS_CSS = `
/* Peak-End Rule: Success animations */
.success-toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

@keyframes success-bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.bp5-toast.bp5-intent-success {
    animation: success-bounce 0.5s ease-in-out;
}

/* Zeigarnik Effect: Progress visualization */
.allocation-progress-card {
    margin-bottom: 20px;
    padding: 20px;
}

.segmented-progress {
    position: relative;
    height: 24px;
    border-radius: 12px;
    overflow: hidden;
    background: #f5f8fa;
}

.progress-segment {
    position: absolute;
    height: 100%;
    transition: width 0.3s ease;
}

.progress-stats {
    display: flex;
    justify-content: space-around;
    margin-top: 16px;
}

.progress-motivation {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    background: #ebf1f5;
    border-radius: 8px;
}

/* Fitts's Law: Larger click targets */
.improved-action-button {
    min-width: 120px !important;
    min-height: 40px !important;
    padding: 8px 16px !important;
}

.site-tag.enhanced {
    min-height: 28px;
    padding: 6px 12px;
    margin: 2px 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.site-tag.enhanced:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Doherty Threshold: Skeleton loading */
.opportunity-row-skeleton {
    display: flex;
    align-items: center;
    padding: 12px;
    gap: 16px;
}

.skeleton-cell {
    background: linear-gradient(90deg, #f5f8fa 25%, #e1e8ed 50%, #f5f8fa 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    height: 24px;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.skeleton-priority { width: 60px; }
.skeleton-status { width: 120px; }
.skeleton-name { width: 200px; }
.skeleton-health { width: 80px; }
.skeleton-sites { width: 150px; }
.skeleton-capacity { width: 100px; }
.skeleton-actions { width: 100px; }

/* Miller's Law: Chunked display */
.chunked-site-display {
    display: flex;
    align-items: center;
    gap: 8px;
}

.site-tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

/* Aesthetic-Usability: Enhanced visuals */
.enhanced-health-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
}

.health-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.2s ease;
}

.health-circle:hover {
    transform: scale(1.1);
}

.health-details {
    display: flex;
    flex-direction: column;
}

.health-score {
    font-weight: 600;
    font-size: 14px;
}

.health-metrics {
    display: flex;
    gap: 8px;
    font-size: 11px;
    opacity: 0.8;
}
`;