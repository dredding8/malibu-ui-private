import React, { useState, useCallback } from 'react';
import { 
    Collapse, 
    Button, 
    Intent, 
    Card, 
    Elevation,
    Tag,
    Icon as BPIcon
} from '@blueprintjs/core';
import { Icon } from '../../utils/blueprintIconWrapper';

interface DisclosureLevel {
    id: string;
    label: string;
    icon?: any;  // Blueprint's icon type
    intent?: Intent;
    content: React.ReactNode;
    defaultOpen?: boolean;
}

interface ProgressiveDisclosureProps {
    levels: DisclosureLevel[];
    mode?: 'accordion' | 'progressive' | 'tabs';
    showIndicators?: boolean;
    animationDuration?: number;
    onLevelChange?: (levelId: string, isOpen: boolean) => void;
}

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
    levels,
    mode = 'progressive',
    showIndicators = true,
    animationDuration = 200,
    onLevelChange
}) => {
    const [openLevels, setOpenLevels] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        levels.forEach(level => {
            if (level.defaultOpen) {
                initial.add(level.id);
            }
        });
        return initial;
    });

    const toggleLevel = useCallback((levelId: string) => {
        setOpenLevels(prev => {
            const newSet = new Set(prev);
            if (newSet.has(levelId)) {
                newSet.delete(levelId);
                onLevelChange?.(levelId, false);
            } else {
                // In accordion mode, close all others
                if (mode === 'accordion') {
                    newSet.clear();
                }
                newSet.add(levelId);
                onLevelChange?.(levelId, true);
            }
            return newSet;
        });
    }, [mode, onLevelChange]);

    const renderLevel = (level: DisclosureLevel, index: number) => {
        const isOpen = openLevels.has(level.id);
        const isFirstClosed = !isOpen && index === levels.findIndex(l => !openLevels.has(l.id));

        return (
            <div 
                key={level.id} 
                className={`disclosure-level disclosure-level-${index}`}
                style={{ marginBottom: index < levels.length - 1 ? 8 : 0 }}
            >
                <Button
                    fill
                    alignText="left"
                    icon={level.icon || (isOpen ? 'chevron-down' : 'chevron-right') as any}
                    intent={level.intent}
                    minimal={!isFirstClosed}
                    onClick={() => toggleLevel(level.id)}
                    rightIcon={
                        showIndicators && mode === 'progressive' && !isOpen ? (
                            <Tag minimal round>
                                Click to reveal
                            </Tag>
                        ) : undefined
                    }
                    className="disclosure-trigger"
                    style={{
                        transition: 'all 0.2s ease',
                        fontWeight: isFirstClosed ? 600 : 400
                    }}
                >
                    {level.label}
                </Button>
                <Collapse 
                    isOpen={isOpen}
                    transitionDuration={animationDuration}
                >
                    <Card 
                        elevation={Elevation.ZERO}
                        style={{ 
                            marginTop: 8, 
                            marginLeft: mode === 'progressive' ? 24 : 0,
                            padding: 16,
                            backgroundColor: 'rgba(92, 112, 128, 0.05)'
                        }}
                    >
                        {level.content}
                    </Card>
                </Collapse>
            </div>
        );
    };

    if (mode === 'tabs') {
        return (
            <div className="disclosure-tabs">
                <div className="tab-headers" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {levels.map((level, index) => (
                        <Button
                            key={level.id}
                            intent={openLevels.has(level.id) ? level.intent || Intent.PRIMARY : Intent.NONE}
                            minimal={!openLevels.has(level.id)}
                            icon={level.icon as any}
                            onClick={() => toggleLevel(level.id)}
                            active={openLevels.has(level.id)}
                        >
                            {level.label}
                        </Button>
                    ))}
                </div>
                <div className="tab-content">
                    {levels.map(level => (
                        <div
                            key={level.id}
                            style={{ display: openLevels.has(level.id) ? 'block' : 'none' }}
                        >
                            {level.content}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="progressive-disclosure">
            {levels.map((level, index) => renderLevel(level, index))}
        </div>
    );
};

// Specialized component for allocation status details
export const AllocationStatusDisclosure: React.FC<{
    status: 'confirmed' | 'needs-review' | 'not-allocated';
    quality: number;
    details: string;
    alternatives?: Array<{ id: string; name: string; score: number }>;
}> = ({ status, quality, details, alternatives }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'confirmed':
                return {
                    intent: Intent.SUCCESS,
                    icon: 'tick-circle',
                    primaryLabel: 'Allocation Confirmed'
                };
            case 'needs-review':
                return {
                    intent: Intent.WARNING,
                    icon: 'warning-sign',
                    primaryLabel: 'Review Required'
                };
            case 'not-allocated':
                return {
                    intent: Intent.DANGER,
                    icon: 'error',
                    primaryLabel: 'Not Allocated'
                };
        }
    };

    const config = getStatusConfig();
    
    const levels: DisclosureLevel[] = [
        {
            id: 'primary',
            label: config.primaryLabel,
            icon: config.icon,
            intent: config.intent,
            defaultOpen: true,
            content: (
                <div>
                    <div style={{ marginBottom: 12 }}>
                        <strong>Quality Score:</strong>{' '}
                        <Tag intent={quality > 80 ? Intent.SUCCESS : quality > 60 ? Intent.WARNING : Intent.DANGER}>
                            {quality}%
                        </Tag>
                    </div>
                    <div>
                        <strong>Details:</strong> {details}
                    </div>
                </div>
            )
        }
    ];

    if (status === 'needs-review' && alternatives && alternatives.length > 0) {
        levels.push({
            id: 'alternatives',
            label: `${alternatives.length} Alternative Options Available`,
            icon: 'swap-horizontal',
            intent: Intent.PRIMARY,
            content: (
                <div>
                    <p style={{ marginBottom: 8 }}>Consider these alternatives:</p>
                    {alternatives.map((alt, index) => (
                        <div 
                            key={alt.id}
                            style={{ 
                                padding: '8px 12px',
                                marginBottom: 8,
                                backgroundColor: 'rgba(19, 124, 189, 0.1)',
                                borderRadius: 4,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span>{index + 1}. {alt.name}</span>
                            <Tag minimal intent={Intent.PRIMARY}>
                                {alt.score}% match
                            </Tag>
                        </div>
                    ))}
                </div>
            )
        });
    }

    if (status === 'not-allocated') {
        levels.push({
            id: 'actions',
            label: 'Recommended Actions',
            icon: 'lightbulb',
            intent: Intent.PRIMARY,
            content: (
                <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li>Review satellite availability for this time window</li>
                    <li>Check if priority needs to be adjusted</li>
                    <li>Consider alternative collection methods</li>
                    <li>Contact operations team if urgent</li>
                </ol>
            )
        });
    }

    return <ProgressiveDisclosure levels={levels} mode="progressive" />;
};